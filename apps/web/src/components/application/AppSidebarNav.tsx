'use client';

import { Permission } from '@leanmgmt/shared-types';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import {
  buildAdminNavItems,
  buildAppNavItems,
} from '@/components/application/app-navigation/build-shell-nav-items';
import { NavItemCountBadge } from '@/components/application/app-navigation/sidebar-navigation/sidebar-nav-item';
import { SidebarNavigationSectionDividers } from '@/components/application/app-navigation/sidebar-navigation/sidebar-section-dividers';
import { useActiveTaskCountQuery } from '@/lib/queries/tasks';
import { useAuthStore } from '@/stores/auth-store';

export type AppSidebarNavProps = {
  variant?: 'app' | 'admin';
  onNavigate?: () => void;
};

export function AppSidebarNav({ variant = 'app', onNavigate }: AppSidebarNavProps) {
  const pathname = usePathname();
  const permissionKey = useAuthStore((s) => (s.currentUser?.permissions ?? []).join('|'));
  const permissions = useAuthStore((s) => s.currentUser?.permissions ?? []) as Permission[];
  const isAppNav = variant === 'app';
  const { data: activeTaskCount = 0 } = useActiveTaskCountQuery(isAppNav);

  const items = useMemo(() => {
    if (!isAppNav) {
      return buildAdminNavItems(permissions);
    }
    const base = buildAppNavItems(permissions);
    if (activeTaskCount <= 0) {
      return base;
    }
    return base.map((item) => {
      if ('divider' in item) return item;
      if (item.href === '/tasks') {
        return {
          ...item,
          badge: <NavItemCountBadge count={activeTaskCount} />,
        };
      }
      return item;
    });
  }, [isAppNav, permissionKey, permissions, activeTaskCount]);

  return (
    <SidebarNavigationSectionDividers
      items={items}
      activeUrl={pathname}
      onNavigate={onNavigate}
      aria-label={variant === 'admin' ? 'Yönetim menüsü' : 'Ana menü'}
    />
  );
}
