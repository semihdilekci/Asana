import { Permission } from '@leanmgmt/shared-types';

export type NavIconKey =
  | 'home'
  | 'users'
  | 'masterData'
  | 'roles'
  | 'notifications'
  | 'admin'
  | 'audit'
  | 'settings'
  | 'consent'
  | 'email';

export type NavChild = {
  href: string;
  label: string;
  permission?: Permission;
};

export type AppNavEntry =
  | { type: 'divider' }
  | {
      type?: 'link';
      href: string;
      label: string;
      icon: NavIconKey;
      permission?: Permission;
      anyOf?: Permission[];
    }
  | {
      type: 'accordion';
      label: string;
      icon: NavIconKey;
      anyOf?: Permission[];
      permission?: Permission;
      children: NavChild[];
    };

export const APP_NAV_ENTRIES: AppNavEntry[] = [
  { href: '/dashboard', label: 'Ana Sayfa', icon: 'home' },
  { type: 'divider' },
  { href: '/users', label: 'Kullanıcılar', icon: 'users', permission: Permission.USER_LIST_VIEW },
  {
    href: '/master-data',
    label: 'Master Data',
    icon: 'masterData',
    anyOf: [Permission.MASTER_DATA_VIEW, Permission.MASTER_DATA_MANAGE],
  },
  { href: '/roles', label: 'Roller', icon: 'roles', permission: Permission.ROLE_VIEW },
  { type: 'divider' },
  {
    href: '/settings/notifications',
    label: 'Bildirim Ayarları',
    icon: 'notifications',
    permission: Permission.NOTIFICATION_EDIT,
  },
  {
    href: '/admin',
    label: 'Yönetim',
    icon: 'admin',
    anyOf: [
      Permission.AUDIT_LOG_VIEW,
      Permission.SYSTEM_SETTINGS_VIEW,
      Permission.SYSTEM_SETTINGS_EDIT,
      Permission.CONSENT_VERSION_VIEW,
      Permission.CONSENT_VERSION_EDIT,
      Permission.CONSENT_VERSION_PUBLISH,
      Permission.EMAIL_TEMPLATE_VIEW,
    ],
  },
];

export type AdminNavEntry =
  | { type: 'divider' }
  | {
      href: string;
      label: string;
      icon: NavIconKey;
      anyOf?: Permission[];
      permission?: Permission;
    };

export const ADMIN_NAV_ENTRIES: AdminNavEntry[] = [
  { href: '/admin', label: 'Özet', icon: 'home' },
  { type: 'divider' },
  {
    href: '/admin/audit-logs',
    label: 'Denetim',
    icon: 'audit',
    permission: Permission.AUDIT_LOG_VIEW,
  },
  {
    href: '/admin/audit-logs/chain-integrity',
    label: 'Zincir',
    icon: 'audit',
    permission: Permission.AUDIT_LOG_VIEW,
  },
  { type: 'divider' },
  {
    href: '/admin/system-settings',
    label: 'Sistem ayarları',
    icon: 'settings',
    anyOf: [Permission.SYSTEM_SETTINGS_VIEW, Permission.SYSTEM_SETTINGS_EDIT],
  },
  {
    href: '/admin/consent-versions',
    label: 'Rıza metinleri',
    icon: 'consent',
    anyOf: [
      Permission.CONSENT_VERSION_VIEW,
      Permission.CONSENT_VERSION_EDIT,
      Permission.CONSENT_VERSION_PUBLISH,
    ],
  },
  {
    href: '/admin/email-templates',
    label: 'E-posta şablonları',
    icon: 'email',
    permission: Permission.EMAIL_TEMPLATE_VIEW,
  },
];

export const ADMIN_ENTRY_ANY_OF: Permission[] = [
  Permission.AUDIT_LOG_VIEW,
  Permission.SYSTEM_SETTINGS_VIEW,
  Permission.SYSTEM_SETTINGS_EDIT,
  Permission.CONSENT_VERSION_VIEW,
  Permission.CONSENT_VERSION_EDIT,
  Permission.CONSENT_VERSION_PUBLISH,
  Permission.EMAIL_TEMPLATE_VIEW,
];

export function filterNavByPermissions<
  T extends { type?: string; permission?: Permission; anyOf?: Permission[] },
>(entries: T[], permissions: Permission[]): T[] {
  const set = new Set(permissions);
  return entries.filter((item) => {
    if ('type' in item && item.type === 'divider') return true;
    if (item.permission) return set.has(item.permission);
    if (item.anyOf?.length) return item.anyOf.some((p) => set.has(p));
    return true;
  });
}

/** Accordion alt öğeleri permission ile süzer */
export function filterAccordionChildren(
  children: NavChild[],
  permissions: Permission[],
): NavChild[] {
  const set = new Set(permissions);
  return children.filter((c) => !c.permission || set.has(c.permission));
}
