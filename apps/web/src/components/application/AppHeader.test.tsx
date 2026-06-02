import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Permission } from '@leanmgmt/shared-types';

import { AppHeader } from './AppHeader';
import { ImpersonationBanner } from './ImpersonationBanner';

const stopMutateAsync = vi.fn().mockResolvedValue(undefined);

let mockAuthState = {
  currentUser: null as {
    id: string;
    firstName: string;
    lastName: string;
    permissions: Permission[];
  } | null,
  impersonation: {
    active: false,
    impersonator: null as {
      id: string;
      sicil: string;
      firstName: string;
      lastName: string;
    } | null,
  },
};

vi.mock('@/lib/api-client', () => ({
  logoutRequest: vi.fn(),
}));

vi.mock('@/lib/queries/auth', () => ({
  useImpersonateStopMutation: () => ({
    mutateAsync: stopMutateAsync,
    isPending: false,
  }),
}));

vi.mock('@/components/notifications/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

vi.mock('@/components/layout/AppBreadcrumbs', () => ({
  AppBreadcrumbs: () => <nav aria-label="breadcrumb">Breadcrumb</nav>,
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (s: typeof mockAuthState) => unknown) => selector(mockAuthState),
}));

describe('<AppHeader>', () => {
  beforeEach(() => {
    mockAuthState = {
      currentUser: {
        id: 'u1',
        firstName: 'Ayşe',
        lastName: 'Yılmaz',
        permissions: [],
      },
      impersonation: { active: false, impersonator: null },
    };
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('USER_IMPERSONATION yokken isim salt okunur', () => {
    render(<AppHeader onOpenImpersonationModal={vi.fn()} />);
    expect(screen.getByText('Ayşe Yılmaz').tagName).toBe('SPAN');
    expect(screen.queryByRole('button', { name: 'Ayşe Yılmaz' })).toBeNull();
  });

  it('USER_IMPERSONATION varken isim tıklanabilir', () => {
    mockAuthState.currentUser!.permissions = [Permission.USER_IMPERSONATION];
    const onOpen = vi.fn();
    render(<AppHeader onOpenImpersonationModal={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ayşe Yılmaz' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('impersonation aktifken header ismi gizler', () => {
    mockAuthState.currentUser = {
      id: 'target',
      firstName: 'Hedef',
      lastName: 'Kullanıcı',
      permissions: [],
    };
    mockAuthState.impersonation = {
      active: true,
      impersonator: {
        id: 'admin',
        sicil: '10000001',
        firstName: 'Admin',
        lastName: 'User',
      },
    };
    render(<AppHeader hideUserName onOpenImpersonationModal={vi.fn()} />);
    expect(screen.queryByText('Hedef Kullanıcı')).toBeNull();
  });
});

describe('<ImpersonationBanner>', () => {
  beforeEach(() => {
    mockAuthState = {
      currentUser: {
        id: 'target',
        firstName: 'Hedef',
        lastName: 'Kullanıcı',
        permissions: [],
      },
      impersonation: {
        active: true,
        impersonator: {
          id: 'admin',
          sicil: '10000001',
          firstName: 'Admin',
          lastName: 'User',
        },
      },
    };
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('stop düğmesi ve modal açma handler çalışır', () => {
    const onOpenModal = vi.fn();
    render(<ImpersonationBanner onOpenModal={onOpenModal} />);
    fireEvent.click(screen.getByRole('button', { name: 'Kendi hesabıma dön' }));
    expect(stopMutateAsync).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Hedef Kullanıcı' }));
    expect(onOpenModal).toHaveBeenCalledTimes(1);
  });
});
