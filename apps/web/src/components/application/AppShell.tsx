'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useState, type ReactNode } from 'react';

import { ConsentBlockingDialog } from '@/components/auth/consent-blocking-dialog';
import { AppHeader } from '@/components/application/AppHeader';
import { ImpersonationBanner } from '@/components/application/ImpersonationBanner';
import { ImpersonationUserSearchModal } from '@/components/application/ImpersonationUserSearchModal';
import { AppSidebar } from '@/components/application/AppSidebar';
import { SidebarProfileNavLink } from '@/components/application/SidebarProfileNavLink';
import { Button } from '@/components/base';
import { PageRouteCardMotion } from '@/components/layout/PageRouteCardMotion';
import { AppBreadcrumbs } from '@/components/layout/AppBreadcrumbs';
import { PasswordExpiryBanner } from '@/components/layout/PasswordExpiryBanner';
import { logoutRequest } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

export type AppShellVariant = 'app' | 'admin';

export interface AppShellProps {
  variant?: AppShellVariant;
  children: ReactNode;
}

export function AppShell({ variant = 'app', children }: AppShellProps) {
  const user = useAuthStore((s) => s.currentUser);
  const impersonationActive = useAuthStore((s) => s.impersonation.active);
  const needConsent = Boolean(user?.activeConsentVersionId && !user.consentAccepted);
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [impersonationModalOpen, setImpersonationModalOpen] = useState(false);
  const mobileNavTitleId = useId();
  const isAdmin = variant === 'admin';

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useEffect(() => {
    closeMobileNav();
  }, [pathname, closeMobileNav]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileNav();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen, closeMobileNav]);

  const showChrome = Boolean(user && (isAdmin || !needConsent));

  const mobileDrawerFooter = user ? (
    <div className="text-sm text-[var(--color-sidebar-nav-idle)]">
      <div className="mb-4">
        <SidebarProfileNavLink onNavigate={closeMobileNav} compact />
      </div>
      <div className="flex flex-col gap-3">
        <Button
          color="secondary"
          size="sm"
          className="w-full"
          onPress={() =>
            void logoutRequest().then(() => {
              window.location.href = '/login';
            })
          }
        >
          Çıkış
        </Button>
        <Link
          href="/profile/change-password"
          className="text-center text-sm font-medium text-brand-600"
          onClick={closeMobileNav}
        >
          Şifre değiştir
        </Link>
      </div>
    </div>
  ) : null;

  return (
    <div
      className={
        showChrome
          ? 'flex h-screen max-h-screen flex-col overflow-hidden'
          : 'flex min-h-screen flex-col'
      }
      style={{ background: 'var(--gradient-page-bg)' }}
    >
      {user && !needConsent ? <PasswordExpiryBanner expiresAt={user.passwordExpiresAt} /> : null}

      {showChrome && impersonationActive ? (
        <ImpersonationBanner onOpenModal={() => setImpersonationModalOpen(true)} />
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        {mobileNavOpen && showChrome ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
              aria-label="Menüyü kapat"
              onClick={closeMobileNav}
            />
            <div
              id="app-sidebar-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby={mobileNavTitleId}
              className="absolute top-0 left-0 h-full w-[min(18rem,85vw)] shadow-xl"
            >
              <AppSidebar
                variant={variant}
                onNavigate={closeMobileNav}
                mobileTitleId={mobileNavTitleId}
                footer={mobileDrawerFooter}
              />
            </div>
          </div>
        ) : null}

        {showChrome ? (
          <div
            className="hidden h-full min-h-0 shrink-0 md:block"
            style={{ width: 'var(--sidebar-width)' }}
          >
            <AppSidebar variant={variant} />
          </div>
        ) : null}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {showChrome ? (
            <AppHeader
              variant={variant}
              mobile
              mobileNavOpen={mobileNavOpen}
              mobileNavControlsId="app-sidebar-panel"
              onOpenMobileNav={() => setMobileNavOpen((o) => !o)}
              onOpenImpersonationModal={() => setImpersonationModalOpen(true)}
              hideUserName={impersonationActive}
            />
          ) : null}

          {showChrome && !isAdmin ? (
            <div className="shrink-0 px-5 py-2 md:hidden">
              <AppBreadcrumbs />
            </div>
          ) : null}

          {showChrome ? (
            <div className="hidden md:block">
              <AppHeader
                variant={variant}
                onOpenImpersonationModal={() => setImpersonationModalOpen(true)}
                hideUserName={impersonationActive}
              />
            </div>
          ) : null}

          {!showChrome && user && needConsent ? (
            <header className="shrink-0 px-8 py-5">
              <div className="mx-auto flex max-w-[var(--content-maxw)] items-center justify-end gap-4">
                <span className="text-sm font-medium text-text-tertiary">
                  {user.firstName} {user.lastName}
                </span>
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
            </header>
          ) : null}

          <main
            className={`min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto ${needConsent && !isAdmin ? 'pointer-events-none opacity-30 select-none' : ''}`}
            id="main-content"
            aria-hidden={needConsent && !isAdmin}
          >
            <div className="mx-auto w-full max-w-[var(--content-maxw)] px-8 py-7">
              <PageRouteCardMotion>{children}</PageRouteCardMotion>
            </div>
          </main>
        </div>
      </div>

      {user && needConsent && !isAdmin ? (
        <ConsentBlockingDialog user={user} open={needConsent} />
      ) : null}

      <ImpersonationUserSearchModal
        open={impersonationModalOpen}
        onOpenChange={setImpersonationModalOpen}
      />
    </div>
  );
}
