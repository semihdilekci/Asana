import { HomeLine } from '@untitledui/icons';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SidebarNavigationSectionDividers } from '@/components/application/app-navigation/sidebar-navigation/sidebar-section-dividers';
import { NavItemCountBadge } from '@/components/application/app-navigation/sidebar-navigation/sidebar-nav-item';

afterEach(() => {
  cleanup();
});

describe('NavItemCountBadge', () => {
  it('sıfırda gizlenir', () => {
    const { container } = render(<NavItemCountBadge count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('sayıyı pill rozet olarak gösterir', () => {
    render(<NavItemCountBadge count={10} />);
    expect(screen.getByText('10').textContent).toBe('10');
  });

  it('99 üstünde 99+ gösterir', () => {
    render(<NavItemCountBadge count={120} />);
    expect(screen.getByText('99+').textContent).toBe('99+');
  });
});

describe('SidebarNavigationSectionDividers', () => {
  it('aktif öğede bg-bg-secondary vurgusu uygular', () => {
    render(
      <SidebarNavigationSectionDividers
        activeUrl="/users"
        items={[
          { label: 'Ana Sayfa', href: '/dashboard', icon: HomeLine },
          { label: 'Kullanıcılar', href: '/users', icon: HomeLine },
        ]}
      />,
    );
    const active = screen.getByRole('link', { name: 'Kullanıcılar' });
    expect(active.className).toContain('bg-bg-secondary');
    expect(active.getAttribute('aria-current')).toBe('page');
  });

  it('nav öğesinde sağa hizalı sayı rozeti gösterir', () => {
    render(
      <SidebarNavigationSectionDividers
        activeUrl="/dashboard"
        items={[
          {
            label: 'Kullanıcılar',
            href: '/users',
            icon: HomeLine,
            badge: <NavItemCountBadge count={10} />,
          },
        ]}
      />,
    );
    const link = screen.getByRole('link', { name: /Kullanıcılar/i });
    expect(link.textContent).toContain('10');
    expect(link.querySelector('span.ml-auto')).not.toBeNull();
  });
});
