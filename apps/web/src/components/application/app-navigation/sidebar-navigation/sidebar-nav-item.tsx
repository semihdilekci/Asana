'use client';

import { ChevronDown, LinkExternal01 } from '@untitledui/icons';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { NavItemType, NavSubItemType } from '@/components/application/app-navigation/config';
import { focusRing } from '@/components/base/styles';
import { isNavActive } from '@/lib/app-sidebar-nav';
import { cx } from '@/utils/cx';

const rowBase = cx(
  'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
  focusRing,
);

const rowIdle = 'text-text-tertiary hover:bg-bg-secondary hover:text-text-secondary';
const rowActive = 'bg-bg-secondary text-text-secondary';

const iconClass = 'size-5 shrink-0 text-text-quaternary group-hover:text-text-tertiary';
const iconActiveClass = 'text-fg-brand-primary';

/** Untitled UI sidebar simple — sağa hizalı sayı rozeti */
export function NavItemCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? '99+' : String(count);
  return (
    <span className="ml-auto shrink-0 rounded-full border border-border-secondary bg-bg-primary px-2 py-0.5 text-xs font-medium tabular-nums text-text-secondary shadow-xs">
      {label}
    </span>
  );
}

function SubItemBadge({ value }: { value: number | string }) {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isNaN(n)) {
    return <NavItemCountBadge count={n} />;
  }
  return (
    <span className="ml-auto shrink-0 rounded-full border border-border-secondary bg-bg-primary px-2 py-0.5 text-xs font-medium text-text-secondary shadow-xs">
      {value}
    </span>
  );
}

function NavIcon({ icon: Icon, active }: { icon: NavItemType['icon']; active: boolean }) {
  if (!Icon) return null;
  return <Icon className={cx(iconClass, active && iconActiveClass)} aria-hidden />;
}

export function SidebarNavItemRow({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItemType;
  pathname: string;
  onNavigate?: () => void;
}) {
  const hasChildren = Boolean(item.items?.length);
  const childActive = hasChildren && item.items!.some((c) => isNavActive(pathname, c.href));
  const linkActive = item.href ? isNavActive(pathname, item.href) : childActive;
  const [open, setOpen] = useStateOpen(childActive, item.label);

  if (hasChildren) {
    return (
      <li>
        <button
          type="button"
          aria-expanded={open}
          className={cx(rowBase, linkActive ? rowActive : rowIdle, 'justify-between')}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="flex min-w-0 flex-1 items-center gap-3">
            <NavIcon icon={item.icon} active={linkActive} />
            <span className="truncate">{item.label}</span>
          </span>
          <ChevronDown
            className={cx(
              'size-4 shrink-0 text-text-quaternary transition-transform',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        </button>
        {open ? (
          <ul className="mt-0.5 flex flex-col gap-0.5 pl-4">
            {item.items!.map((sub) => (
              <SidebarNavSubItem
                key={sub.href}
                sub={sub}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  if (!item.href) return null;

  const external = item.external ?? item.href.startsWith('http');

  if (external) {
    return (
      <li>
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cx(rowBase, rowIdle)}
          onClick={() => onNavigate?.()}
        >
          <NavIcon icon={item.icon} active={false} />
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge}
          <LinkExternal01 className="size-4 shrink-0 text-text-quaternary" aria-hidden />
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        scroll={false}
        className={cx(rowBase, linkActive ? rowActive : rowIdle)}
        onClick={() => onNavigate?.()}
        aria-current={linkActive ? 'page' : undefined}
      >
        <NavIcon icon={item.icon} active={linkActive} />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge}
      </Link>
    </li>
  );
}

function SidebarNavSubItem({
  sub,
  pathname,
  onNavigate,
}: {
  sub: NavSubItemType;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isNavActive(pathname, sub.href);
  return (
    <li>
      <Link
        href={sub.href}
        scroll={false}
        className={cx(
          rowBase,
          'py-1.5 pl-7',
          active ? 'font-semibold text-text-secondary' : rowIdle,
        )}
        onClick={() => onNavigate?.()}
        aria-current={active ? 'page' : undefined}
      >
        <span className="flex-1 truncate">{sub.label}</span>
        {sub.badge !== undefined ? <SubItemBadge value={sub.badge} /> : null}
      </Link>
    </li>
  );
}

function useStateOpen(initial: boolean, label: string) {
  const [open, setOpen] = useState(initial);
  useEffect(() => {
    if (initial) setOpen(true);
  }, [initial, label]);
  return [open, setOpen] as const;
}
