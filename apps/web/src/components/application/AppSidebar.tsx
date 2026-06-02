'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { AppSidebarNav } from '@/components/application/AppSidebarNav';
import { SidebarSearch } from '@/components/application/app-navigation/sidebar-navigation/sidebar-search';
import { SidebarProfileNavLink } from '@/components/application/SidebarProfileNavLink';
import { Badge } from '@/components/base';
import { cx } from '@/utils/cx';

export type AppSidebarVariant = 'app' | 'admin';

export interface AppSidebarProps {
  variant?: AppSidebarVariant;
  onNavigate?: () => void;
  /** Mobil çekmece başlığı id (aria-labelledby) */
  mobileTitleId?: string;
  /** Mobil çekmece üst başlık metni */
  mobileTitle?: string;
  footer?: ReactNode;
  className?: string;
}

export function AppSidebar({
  variant = 'app',
  onNavigate,
  mobileTitleId,
  mobileTitle = 'Menü',
  footer,
  className,
}: AppSidebarProps) {
  const isAdmin = variant === 'admin';

  return (
    <aside
      className={cx(
        'flex h-full min-h-0 flex-col border-r border-border-secondary bg-bg-primary',
        className,
      )}
      aria-label={isAdmin ? 'Yönetim menüsü' : 'Uygulama menüsü'}
    >
      <div className="flex flex-col gap-5 px-4 pt-6 pb-2">
        <div className="flex flex-wrap items-center gap-2 px-1">
          <Link
            href={isAdmin ? '/admin' : '/dashboard'}
            className="flex items-center gap-2.5"
            onClick={onNavigate}
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white"
              aria-hidden
            >
              LM
            </span>
            <span className="font-display text-base font-semibold tracking-tight text-text-primary">
              Lean Management
            </span>
          </Link>
          {isAdmin ? (
            <Badge color="brand" size="md">
              Yönetim
            </Badge>
          ) : null}
        </div>
        {mobileTitleId ? (
          <p id={mobileTitleId} className="sr-only">
            {mobileTitle}
          </p>
        ) : null}
        <SidebarSearch className="px-0.5" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <AppSidebarNav variant={variant} onNavigate={onNavigate} />
      </div>
      <div className="shrink-0 border-t border-border-secondary p-3">
        {footer ?? <SidebarProfileNavLink onNavigate={onNavigate} />}
      </div>
    </aside>
  );
}
