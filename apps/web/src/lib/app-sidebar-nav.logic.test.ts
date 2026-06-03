import { describe, expect, it } from 'vitest';

import { isNavActive } from './app-sidebar-nav';

describe('isNavActive', () => {
  it('dashboard kök ve /dashboard için aktif', () => {
    expect(isNavActive('/dashboard', '/dashboard')).toBe(true);
    expect(isNavActive('/', '/dashboard')).toBe(true);
    expect(isNavActive('/users', '/dashboard')).toBe(false);
  });

  it('admin özeti yalnızca tam /admin yolunda aktif', () => {
    expect(isNavActive('/admin', '/admin')).toBe(true);
    expect(isNavActive('/admin/audit-logs', '/admin')).toBe(false);
    expect(isNavActive('/admin/audit-logs', '/admin/audit-logs')).toBe(true);
  });

  it('alt yol prefix ile eşleşir', () => {
    expect(isNavActive('/users/abc-123', '/users')).toBe(true);
    expect(isNavActive('/user', '/users')).toBe(false);
  });
});
