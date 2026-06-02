'use client';

import { SwitchHorizontal01 } from '@untitledui/icons';

import { useImpersonationDisplayName } from '@/hooks/useImpersonation';
import { useImpersonateStopMutation } from '@/lib/queries/auth';
import { cx } from '@/utils/cx';

export interface ImpersonationBannerProps {
  className?: string;
  onOpenModal: () => void;
}

export function ImpersonationBanner({ className, onOpenModal }: ImpersonationBannerProps) {
  const displayName = useImpersonationDisplayName();
  const stopMutation = useImpersonateStopMutation();

  if (!displayName) return null;

  return (
    <div
      className={cx(
        'flex shrink-0 items-center justify-center gap-3 border-b border-brand-600/20 bg-brand-50 px-4 py-2 text-sm text-brand-800',
        className,
      )}
      role="status"
    >
      <button
        type="button"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-brand-700 transition-colors hover:bg-brand-600/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
        aria-label="Kendi hesabıma dön"
        disabled={stopMutation.isPending}
        onClick={() => void stopMutation.mutateAsync()}
      >
        <SwitchHorizontal01 className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        className="font-medium underline decoration-brand-600/40 underline-offset-2 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
        onClick={onOpenModal}
      >
        {displayName}
      </button>
      <span className="sr-only">— başka kullanıcıya geçmek için ada tıklayın</span>
    </div>
  );
}
