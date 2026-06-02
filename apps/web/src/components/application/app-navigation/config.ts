import type { FC, ReactNode, SVGProps } from 'react';

export type NavIconComponent = FC<SVGProps<SVGSVGElement>>;

export type NavItemDividerType = {
  divider: true;
};

export type NavSubItemType = {
  label: string;
  href: string;
  badge?: number | string;
};

export type NavItemType = {
  label: string;
  href?: string;
  icon?: NavIconComponent;
  badge?: ReactNode;
  items?: NavSubItemType[];
  /** Harici bağlantı — yeni sekmede açılır */
  external?: boolean;
};

export function isNavDivider(item: NavItemType | NavItemDividerType): item is NavItemDividerType {
  return 'divider' in item && item.divider === true;
}
