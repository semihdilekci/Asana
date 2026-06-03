import {
  BarChartSquare02,
  Bell01,
  Database01,
  HomeLine,
  Settings01,
  Shield01,
  Users01,
} from '@untitledui/icons';

import type {
  NavItemDividerType,
  NavItemType,
} from '@/components/application/app-navigation/config';
import type { NavIconComponent } from '@/components/application/app-navigation/config';
import {
  ADMIN_NAV_ENTRIES,
  APP_NAV_ENTRIES,
  filterAccordionChildren,
  filterNavByPermissions,
  type AdminNavEntry,
  type AppNavEntry,
} from '@/components/application/shell-nav-config';
import { Permission } from '@leanmgmt/shared-types';

const NAV_ICONS = {
  home: HomeLine,
  users: Users01,
  masterData: Database01,
  roles: Shield01,
  notifications: Bell01,
  admin: Settings01,
  audit: BarChartSquare02,
  settings: Settings01,
  consent: Shield01,
  email: Bell01,
} as const satisfies Record<string, NavIconComponent>;

function mapLink(entry: Extract<AppNavEntry, { href: string }>): NavItemType {
  const iconKey = entry.icon;
  return {
    label: entry.label,
    href: entry.href,
    icon: NAV_ICONS[iconKey],
  };
}

function mapAccordion(
  entry: Extract<AppNavEntry, { type: 'accordion' }>,
  permissions: Permission[],
): NavItemType | null {
  const children = filterAccordionChildren(entry.children, permissions);
  if (children.length === 0) return null;
  return {
    label: entry.label,
    icon: NAV_ICONS[entry.icon],
    items: children.map((c) => ({ label: c.label, href: c.href })),
  };
}

function collapseDividers(
  items: (NavItemType | NavItemDividerType)[],
): (NavItemType | NavItemDividerType)[] {
  const out: (NavItemType | NavItemDividerType)[] = [];
  for (const item of items) {
    if ('divider' in item) {
      if (out.length === 0) continue;
      const last = out[out.length - 1];
      if (last && 'divider' in last) continue;
      out.push(item);
      continue;
    }
    out.push(item);
  }
  while (out.length > 0 && 'divider' in out[out.length - 1]!) {
    out.pop();
  }
  return out;
}

export function buildAppNavItems(permissions: Permission[]): (NavItemType | NavItemDividerType)[] {
  const visible = filterNavByPermissions(APP_NAV_ENTRIES, permissions);
  const items: (NavItemType | NavItemDividerType)[] = [];

  for (const entry of visible) {
    if ('type' in entry && entry.type === 'divider') {
      items.push({ divider: true });
      continue;
    }
    if ('type' in entry && entry.type === 'accordion') {
      const mapped = mapAccordion(entry, permissions);
      if (mapped) items.push(mapped);
      continue;
    }
    if ('href' in entry) {
      items.push(mapLink(entry));
    }
  }

  return collapseDividers(items);
}

function mapAdminLink(entry: Extract<AdminNavEntry, { href: string }>): NavItemType {
  return {
    label: entry.label,
    href: entry.href,
    icon: NAV_ICONS[entry.icon],
  };
}

export function buildAdminNavItems(
  permissions: Permission[],
): (NavItemType | NavItemDividerType)[] {
  const visible = filterNavByPermissions(ADMIN_NAV_ENTRIES, permissions);
  const items: (NavItemType | NavItemDividerType)[] = [];

  for (const entry of visible) {
    if ('type' in entry && entry.type === 'divider') {
      items.push({ divider: true });
      continue;
    }
    if ('href' in entry) {
      items.push(mapAdminLink(entry));
    }
  }

  return collapseDividers(items);
}
