'use client';

import type {
  NavItemDividerType,
  NavItemType,
} from '@/components/application/app-navigation/config';
import { isNavDivider } from '@/components/application/app-navigation/config';
import { SidebarNavItemRow } from '@/components/application/app-navigation/sidebar-navigation/sidebar-nav-item';

export interface SidebarNavigationSectionDividersProps {
  items: (NavItemType | NavItemDividerType)[];
  activeUrl: string;
  onNavigate?: () => void;
  /** `nav` erişilebilir adı */
  'aria-label'?: string;
}

/**
 * Untitled UI — Sidebar navigation (section dividers) örneğiyle uyumlu liste.
 */
export function SidebarNavigationSectionDividers({
  items,
  activeUrl,
  onNavigate,
  'aria-label': ariaLabel = 'Ana menü',
}: SidebarNavigationSectionDividersProps) {
  return (
    <nav aria-label={ariaLabel}>
      <ul className="flex flex-col gap-0.5">
        {items.map((entry, index) => {
          if (isNavDivider(entry)) {
            return (
              <li key={`divider-${index}`} role="presentation" className="py-1">
                <div className="h-px w-full bg-border-secondary" aria-hidden />
              </li>
            );
          }
          return (
            <SidebarNavItemRow
              key={entry.href ?? entry.label}
              item={entry}
              pathname={activeUrl}
              onNavigate={onNavigate}
            />
          );
        })}
      </ul>
    </nav>
  );
}
