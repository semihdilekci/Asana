'use client';

import { Badge } from '@/components/base';

export interface ActionPerformerUserBrief {
  id: string;
  firstName: string;
  lastName: string;
  sicil: string | null;
}

export interface ActionPerformerProps {
  /** Örn. "Tamamlayan", "Başlatan" */
  roleLabel: string;
  performerDisplayLabel?: string;
  performedViaImpersonation?: boolean;
  user?: ActionPerformerUserBrief | null;
}

function fallbackLabel(user: ActionPerformerUserBrief): string {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return user.sicil ? `${name} · Sicil ${user.sicil}` : name;
}

export function ActionPerformerLine({
  roleLabel,
  performerDisplayLabel,
  performedViaImpersonation,
  user,
}: ActionPerformerProps) {
  const text = performerDisplayLabel ?? (user ? fallbackLabel(user) : null);
  if (!text) return null;

  const badge = performedViaImpersonation ? (
    <Badge color="warning" size="sm" className="ml-[var(--space-2)] align-middle">
      Impersonation
    </Badge>
  ) : null;

  if (!roleLabel) {
    return (
      <span className="text-[var(--color-neutral-800)]">
        {text}
        {badge}
      </span>
    );
  }

  return (
    <p className="text-sm text-[var(--color-neutral-700)]">
      {roleLabel}: {text}
      {badge}
    </p>
  );
}
