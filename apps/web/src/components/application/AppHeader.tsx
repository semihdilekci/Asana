'use client';

import Link from 'next/link';

import { AppBreadcrumbs } from '@/components/layout/AppBreadcrumbs';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Button } from '@/components/base';
import {
  useCanOpenImpersonationModal,
  useImpersonationDisplayName,
} from '@/hooks/useImpersonation';
import { logoutRequest } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { cx } from '@/utils/cx';

export type AppHeaderVariant = 'app' | 'admin';

export interface AppHeaderProps {
  variant?: AppHeaderVariant;
  className?: string;
  /** Mobil üst çubukta yalnızca logo + menü düğmesi */
  mobile?: boolean;
  onOpenMobileNav?: () => void;
  mobileNavOpen?: boolean;
  mobileNavControlsId?: string;
  onOpenImpersonationModal?: () => void;
  /** Impersonation bandı aktifken header'daki isim tekrarlanmaz */
  hideUserName?: boolean;
}

function HeaderUserName({
  displayName,
  canOpenModal,
  onOpenModal,
}: {
  displayName: string;
  canOpenModal: boolean;
  onOpenModal?: () => void;
}) {
  if (canOpenModal && onOpenModal) {
    return (
      <button
        type="button"
        className="hidden text-sm font-medium text-brand-700 underline decoration-brand-600/30 underline-offset-2 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 sm:inline"
        onClick={onOpenModal}
      >
        {displayName}
      </button>
    );
  }

  return (
    <span className="hidden text-sm font-medium text-text-tertiary sm:inline">{displayName}</span>
  );
}

export function AppHeader({
  variant = 'app',
  className,
  mobile = false,
  onOpenMobileNav,
  mobileNavOpen,
  mobileNavControlsId,
  onOpenImpersonationModal,
  hideUserName = false,
}: AppHeaderProps) {
  const user = useAuthStore((s) => s.currentUser);
  const impersonationActive = useAuthStore((s) => s.impersonation.active);
  const canOpenModal = useCanOpenImpersonationModal();
  const displayName = useImpersonationDisplayName();
  const isAdmin = variant === 'admin';

  if (mobile) {
    return (
      <div
        className={cx(
          'flex shrink-0 items-center justify-between gap-3 px-5 py-4 md:hidden',
          className,
        )}
      >
        <Link
          href={isAdmin ? '/admin' : '/dashboard'}
          className="font-display text-lg font-bold text-brand-700"
        >
          Lean Management
        </Link>
        <div className="flex items-center gap-2">
          {!isAdmin ? <NotificationBell /> : null}
          {onOpenMobileNav ? (
            <Button
              color="secondary"
              size="sm"
              aria-expanded={mobileNavOpen}
              aria-controls={mobileNavControlsId}
              onPress={() => onOpenMobileNav?.()}
            >
              Menü
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <header className={cx('shrink-0 px-8 py-5', className)}>
      <div className="mx-auto flex w-full max-w-[var(--content-maxw)] items-center justify-between gap-4">
        <div className="min-w-0 flex-1 pr-4">
          {isAdmin ? (
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-display text-lg font-semibold text-brand-700">Yönetim</span>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-brand-600 underline decoration-brand-600 underline-offset-2"
              >
                Uygulamaya dön
              </Link>
            </div>
          ) : (
            <AppBreadcrumbs />
          )}
        </div>
        {user && displayName ? (
          <div className="flex shrink-0 items-center gap-5">
            {!isAdmin ? <NotificationBell /> : null}
            {!hideUserName && !impersonationActive ? (
              <HeaderUserName
                displayName={displayName}
                canOpenModal={canOpenModal}
                onOpenModal={onOpenImpersonationModal}
              />
            ) : null}
            <Button
              color="secondary"
              size="sm"
              onPress={() =>
                void logoutRequest().then(() => {
                  window.location.href = '/login';
                })
              }
            >
              Çıkış
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
