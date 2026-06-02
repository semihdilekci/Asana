export type AuditActorNameParts = {
  firstName: string;
  lastName: string;
  sicil: string | null;
};

function formatPersonLabel(parts: AuditActorNameParts): string {
  const name = `${parts.firstName} ${parts.lastName}`.trim();
  return parts.sicil ? `${name} · ${parts.sicil}` : name;
}

function readMetadataRecord(metadata: unknown): Record<string, unknown> | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  return metadata as Record<string, unknown>;
}

/** S-ADMIN-AUDIT — impersonation altındaki kayıtlar için `{A} ({B} yerine)` */
export function formatAuditActorDisplayLabel(
  actor: AuditActorNameParts,
  metadata: unknown,
): string {
  const actorPart = formatPersonLabel(actor);
  const m = readMetadataRecord(metadata);
  if (!m) return actorPart;

  if (m.isImpersonation === true) {
    const displayName =
      typeof m.impersonatedUserDisplayName === 'string' ? m.impersonatedUserDisplayName : '';
    const sicil =
      typeof m.impersonatedUserSicil === 'string' && m.impersonatedUserSicil
        ? m.impersonatedUserSicil
        : null;
    const targetPart = displayName
      ? formatPersonLabel({ firstName: displayName, lastName: '', sicil })
      : String(m.impersonatedUserId ?? '—');
    return `${actorPart} (${targetPart} yerine)`;
  }

  return actorPart;
}

/** Mutating aksiyon impersonation badge — lifecycle action'ları hariç */
export function isImpersonationMutatingAudit(metadata: unknown): boolean {
  const m = readMetadataRecord(metadata);
  return m?.isImpersonation === true;
}

/** Süreç/görev timeline — `{Impersonator} ({Hedef} yerine)` */
export function formatImpersonationActionLabel(
  actor: AuditActorNameParts,
  effective: AuditActorNameParts,
): string {
  return formatAuditActorDisplayLabel(actor, {
    isImpersonation: true,
    impersonatedUserDisplayName: `${effective.firstName} ${effective.lastName}`.trim(),
    impersonatedUserSicil: effective.sicil,
    impersonatedUserId: 'effective',
  });
}
