import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Permission } from '@leanmgmt/shared-types';

import { AppSidebarNav } from './AppSidebarNav';

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (s: { currentUser: { permissions: Permission[] } }) => unknown) =>
    selector({
      currentUser: {
        permissions: Object.values(Permission),
      },
    }),
}));

describe('<AppSidebarNav>', () => {
  afterEach(() => {
    cleanup();
  });

  it('admin varyantında yönetim menüsü ve özet bağlantısı render eder', () => {
    render(<AppSidebarNav variant="admin" />);
    expect(screen.getByRole('navigation', { name: 'Yönetim menüsü' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Özet' })).toBeDefined();
  });
});
