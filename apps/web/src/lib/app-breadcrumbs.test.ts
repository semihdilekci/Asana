import { describe, expect, it } from 'vitest';

import { getAppBreadcrumbs } from './app-breadcrumbs';

describe('getAppBreadcrumbs', () => {
  it('dashboard ve kök için tek öğe', () => {
    expect(getAppBreadcrumbs('/dashboard')).toEqual([{ href: '/dashboard', label: 'Ana Sayfa' }]);
    expect(getAppBreadcrumbs('/')).toEqual([{ href: '/dashboard', label: 'Ana Sayfa' }]);
  });

  it('bildirim ayarları birleşik etiket', () => {
    expect(getAppBreadcrumbs('/settings/notifications')).toEqual([
      { href: '/dashboard', label: 'Ana Sayfa' },
      { href: '/settings/notifications', label: 'Bildirim ayarları' },
    ]);
  });

  it('profil kökü', () => {
    expect(getAppBreadcrumbs('/profile')).toEqual([
      { href: '/dashboard', label: 'Ana Sayfa' },
      { href: '/profile', label: 'Profilim' },
    ]);
  });

  it('şifre değiştir', () => {
    expect(getAppBreadcrumbs('/profile/change-password')).toEqual([
      { href: '/dashboard', label: 'Ana Sayfa' },
      { href: '/profile/change-password', label: 'Şifre değiştir' },
    ]);
  });
});
