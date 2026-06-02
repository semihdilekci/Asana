'use client';

import { Permission } from '@leanmgmt/shared-types';

import { useHasPermission } from '@/hooks/usePermissions';
import { useAuthStore } from '@/stores/auth-store';

/** Modal açma: aktif impersonation veya USER_IMPERSONATION yetkisi */
export function useCanOpenImpersonationModal(): boolean {
  const impersonationActive = useAuthStore((s) => s.impersonation.active);
  const hasPermission = useHasPermission(Permission.USER_IMPERSONATION);
  return impersonationActive || hasPermission;
}

export function useImpersonationDisplayName(): string | null {
  const user = useAuthStore((s) => s.currentUser);
  if (!user) return null;
  return `${user.firstName} ${user.lastName}`;
}
