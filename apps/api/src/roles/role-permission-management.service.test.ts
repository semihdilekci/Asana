import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Permission } from '@leanmgmt/shared-types';

import { RolePermissionSelfEditForbiddenException } from './roles.exceptions.js';
import { RolePermissionManagementService } from './role-permission-management.service.js';

describe('RolePermissionManagementService.replaceRolePermissions', () => {
  let prisma: {
    role: { findFirst: ReturnType<typeof vi.fn> };
    rolePermission: {
      findMany: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
      createMany: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };
  let permissionResolver: {
    projectPermissionsForUserWithRoleOverride: ReturnType<typeof vi.fn>;
    getUserPermissions: ReturnType<typeof vi.fn>;
    invalidateRole: ReturnType<typeof vi.fn>;
  };
  let audit: { append: ReturnType<typeof vi.fn> };
  let service: RolePermissionManagementService;

  const actor = { id: 'actor-1', sicil: '00000001', email: 'a@x.com' };
  const roleId = 'role-superadmin';

  beforeEach(() => {
    prisma = {
      role: { findFirst: vi.fn() },
      rolePermission: {
        findMany: vi.fn(),
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      $transaction: vi.fn(async (fn: (tx: typeof prisma) => Promise<void>) => fn(prisma)),
    };
    permissionResolver = {
      projectPermissionsForUserWithRoleOverride: vi.fn(),
      getUserPermissions: vi.fn(),
      invalidateRole: vi.fn(),
    };
    audit = { append: vi.fn() };
    service = new RolePermissionManagementService(
      prisma as never,
      permissionResolver as never,
      audit as never,
      new EventEmitter2(),
    );

    prisma.role.findFirst.mockResolvedValue({ id: roleId, isActive: true });
    prisma.rolePermission.findMany.mockResolvedValue([]);
    prisma.rolePermission.deleteMany.mockResolvedValue({ count: 0 });
    prisma.rolePermission.createMany.mockResolvedValue({ count: 1 });
  });

  it('NOTIFICATION_EDIT eklerken eski NOTIFICATION_READ düşüşü self-edit engeli tetiklemez', async () => {
    permissionResolver.getUserPermissions.mockResolvedValue(
      new Set(['NOTIFICATION_READ', Permission.USER_LIST_VIEW]),
    );
    permissionResolver.projectPermissionsForUserWithRoleOverride.mockResolvedValue(
      new Set([Permission.NOTIFICATION_EDIT, Permission.USER_LIST_VIEW]),
    );

    const result = await service.replaceRolePermissions(
      roleId,
      { permissionKeys: [Permission.NOTIFICATION_EDIT, Permission.USER_LIST_VIEW] },
      actor,
    );

    expect(result.permissionKeys).toEqual([
      Permission.NOTIFICATION_EDIT,
      Permission.USER_LIST_VIEW,
    ]);
  });

  it('geçerli enum yetkisini düşürürse ROLE_SELF_EDIT_FORBIDDEN', async () => {
    permissionResolver.getUserPermissions.mockResolvedValue(
      new Set([Permission.USER_LIST_VIEW, Permission.ROLE_VIEW]),
    );
    permissionResolver.projectPermissionsForUserWithRoleOverride.mockResolvedValue(
      new Set([Permission.USER_LIST_VIEW]),
    );

    await expect(
      service.replaceRolePermissions(
        roleId,
        { permissionKeys: [Permission.USER_LIST_VIEW] },
        actor,
      ),
    ).rejects.toBeInstanceOf(RolePermissionSelfEditForbiddenException);
  });
});
