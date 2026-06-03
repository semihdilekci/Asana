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

export function buildImpersonationActionContext(
  actor: AuthenticatedUser,
): Prisma.InputJsonValue | undefined {
  if (!actor.impersonatorId) return undefined;
  return { actorUserId: actor.impersonatorId };
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
