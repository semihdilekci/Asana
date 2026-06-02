import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@leanmgmt/prisma-client';

import { nextAuditChainHash } from '@leanmgmt/shared-utils';

import type { AuthenticatedUser } from '../decorators/current-user.decorator.js';
import { realActorId } from '../decorators/current-user.decorator.js';
import { EncryptionService } from '../encryption/encryption.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export type AppendAuditInput = {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipHash: string;
  userAgent?: string | null;
  sessionId?: string | null;
};

export type AppendAuditForActorInput = Omit<AppendAuditInput, 'userId'>;

/**
 * audit_logs.chain_hash uygulama tarafında üretilir (migration’da INSERT trigger yok).
 * Seed ile aynı zincirleme: sha256(prevChain + canonicalPayload)
 */
@Injectable()
export class AuditLogService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(EncryptionService) private readonly encryption: EncryptionService,
  ) {}

  /** [AUD-005] — impersonation aktifken userId=impersonator + metadata.isImpersonation */
  async appendForActor(actor: AuthenticatedUser, input: AppendAuditForActorInput): Promise<void> {
    const auditUserId = realActorId(actor);
    let metadata = input.metadata;

    if (actor.impersonatorId) {
      const impersonated = await this.resolveImpersonatedUserMetadata(actor.id);
      const base =
        metadata && typeof metadata === 'object' && !Array.isArray(metadata)
          ? (metadata as Record<string, unknown>)
          : {};
      metadata = {
        ...base,
        isImpersonation: true,
        ...impersonated,
      } satisfies Prisma.JsonObject;
    }

    await this.append({
      ...input,
      userId: auditUserId,
      metadata,
    });
  }

  async append(input: AppendAuditInput): Promise<void> {
    const last = await this.prisma.auditLog.findFirst({
      orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
      select: { chainHash: true },
    });
    const prev = last?.chainHash ?? 'GENESIS';
    const chainHash = nextAuditChainHash(prev, {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      userId: input.userId ?? null,
      sessionId: input.sessionId ?? null,
      metadata: input.metadata ?? null,
      ipHash: input.ipHash,
    });

    await this.prisma.auditLog.create({
      data: {
        userId: input.userId ?? undefined,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? undefined,
        metadata: input.metadata ?? undefined,
        ipHash: input.ipHash,
        userAgent: input.userAgent ?? undefined,
        sessionId: input.sessionId ?? undefined,
        chainHash,
      },
    });
  }

  private async resolveImpersonatedUserMetadata(effectiveUserId: string): Promise<{
    impersonatedUserId: string;
    impersonatedUserSicil: string | null;
    impersonatedUserDisplayName: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: effectiveUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        sicilEncrypted: true,
        anonymizedAt: true,
      },
    });
    if (!user) {
      return {
        impersonatedUserId: effectiveUserId,
        impersonatedUserSicil: null,
        impersonatedUserDisplayName: effectiveUserId,
      };
    }
    const sicil = user.anonymizedAt
      ? null
      : this.encryption.decryptSicil(user.sicilEncrypted as unknown as Buffer);
    return {
      impersonatedUserId: user.id,
      impersonatedUserSicil: sicil,
      impersonatedUserDisplayName: `${user.firstName} ${user.lastName}`.trim(),
    };
  }
}
