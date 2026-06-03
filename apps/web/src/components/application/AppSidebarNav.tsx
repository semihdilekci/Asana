'use client';

import { Permission } from '@leanmgmt/shared-types';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import {
  buildAdminNavItems,
  buildAppNavItems,
} from '@/components/application/app-navigation/build-shell-nav-items';
import { SidebarNavigationSectionDividers } from '@/components/application/app-navigation/sidebar-navigation/sidebar-section-dividers';
import { useAuthStore } from '@/stores/auth-store';

export type AppSidebarNavProps = {
  variant?: 'app' | 'admin';
  onNavigate?: () => void;
};

export function AppSidebarNav({ variant = 'app', onNavigate }: AppSidebarNavProps) {
  const pathname = usePathname();
  const permissionKey = useAuthStore((s) => (s.currentUser?.permissions ?? []).join('|'));
  const permissions = useAuthStore((s) => s.currentUser?.permissions ?? []) as Permission[];

  const items = useMemo(() => {
    if (variant !== 'app') {
      return buildAdminNavItems(permissions);
    }
    return buildAppNavItems(permissions);
  }, [variant, permissionKey, permissions]);

  return (
    <SidebarNavigationSectionDividers
      items={items}
      activeUrl={pathname}
      onNavigate={onNavigate}
      aria-label={variant === 'admin' ? 'Yönetim menüsü' : 'Ana menü'}
    />
  );
}
