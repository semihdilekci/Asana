'use client';

import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cx, sortCx } from '@/utils/cx';

import { focusRing } from '@/components/base/styles';

const navItemStyles = sortCx({
  base: cx(
    'relative z-10 flex items-center gap-2 rounded-md px-5 py-4 text-sm font-medium transition-[background,color,box-shadow,border-color] duration-200',
    focusRing,
  ),
  primary: {
    idle: 'text-[var(--color-sidebar-nav-idle)] hover:bg-brand-600/7 hover:text-text-primary',
    active: cx(
      'border-l-2 border-brand-300 bg-brand-600 text-white',
      'shadow-[0_0_14px_rgba(125,249,255,0.35)]',
    ),
  },
  child: {
    idle: 'px-4 py-3 text-[var(--color-sidebar-nav-idle)] hover:bg-brand-600/7',
    active: 'font-semibold text-brand-700',
  },
});

export type SidebarNavItemLevel = 'primary' | 'child';

export interface SidebarNavItemLinkProps extends Omit<
  ComponentPropsWithoutRef<typeof Link>,
  'className'
> {
  level?: SidebarNavItemLevel;
  active?: boolean;
  className?: string;
  children: ReactNode;
}

export function SidebarNavItemLink({
  level = 'primary',
  active = false,
  className,
  children,
  ...props
}: SidebarNavItemLinkProps) {
  return (
    <Link
      className={cx(
        navItemStyles.base,
        level === 'child'
          ? navItemStyles.child[active ? 'active' : 'idle']
          : navItemStyles.primary[active ? 'active' : 'idle'],
        className,
      )}
      scroll={false}
      {...props}
    >
      {children}
    </Link>
  );
}

export interface SidebarNavItemButtonProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'className' | 'type'
> {
  level?: SidebarNavItemLevel;
  active?: boolean;
  className?: string;
  children: ReactNode;
}

export function SidebarNavItemButton({
  level = 'primary',
  active = false,
  className,
  children,
  ...props
}: SidebarNavItemButtonProps) {
  return (
    <button
      type="button"
      className={cx(
        navItemStyles.base,
        level === 'primary' && 'w-full justify-between',
        level === 'child'
          ? navItemStyles.child[active ? 'active' : 'idle']
          : navItemStyles.primary[active ? 'active' : 'idle'],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
