import type { Prisma } from '@leanmgmt/prisma-client';
import { formatImpersonationActionLabel } from '@leanmgmt/shared-utils';

import type { AuthenticatedUser } from '../decorators/current-user.decorator.js';

export type UserBriefParts = {
  id: string;
  firstName: string;
  lastName: string;
  sicil: string | null;
};

export type ActionPerformerFields = {
  performedViaImpersonation: boolean;
  performerDisplayLabel: string;
  actionActor?: UserBriefParts;
};

function formatEffectiveLabel(effective: UserBriefParts): string {
  const name = `${effective.firstName} ${effective.lastName}`.trim();
  return effective.sicil ? `${name} · ${effective.sicil}` : name;
}

export function readTaskActionContext(raw: unknown): { actorUserId: string } | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const actorUserId = (raw as Record<string, unknown>).actorUserId;
  return typeof actorUserId === 'string' ? { actorUserId } : null;
}

export function readProcessStartImpersonation(metadata: unknown): { actorUserId: string } | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const start = (metadata as Record<string, unknown>).startImpersonation;
  if (!start || typeof start !== 'object' || Array.isArray(start)) return null;
  const actorUserId = (start as Record<string, unknown>).actorUserId;
  return typeof actorUserId === 'string' ? { actorUserId } : null;
}

export function buildImpersonationActionContext(
  actor: AuthenticatedUser,
): Prisma.InputJsonValue | undefined {
  if (!actor.impersonatorId) return undefined;
  return { actorUserId: actor.impersonatorId };
}

export function buildProcessStartMetadata(
  actor: AuthenticatedUser,
): Prisma.InputJsonValue | undefined {
  if (!actor.impersonatorId) return undefined;
  return { startImpersonation: { actorUserId: actor.impersonatorId } };
}

export function serializeActionPerformerFields(
  effective: UserBriefParts,
  actor: UserBriefParts | null,
): ActionPerformerFields {
  if (!actor || actor.id === effective.id) {
    return {
      performedViaImpersonation: false,
      performerDisplayLabel: formatEffectiveLabel(effective),
    };
  }
  return {
    performedViaImpersonation: true,
    actionActor: actor,
    performerDisplayLabel: formatImpersonationActionLabel(actor, effective),
  };
}
