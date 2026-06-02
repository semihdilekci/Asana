import { describe, expect, it } from 'vitest';

import { isNavActive } from '@/lib/app-sidebar-nav';

describe('isNavActive', () => {
  it('dashboard ve kök için eşleşir', () => {
    expect(isNavActive('/dashboard', '/dashboard')).toBe(true);
    expect(isNavActive('/', '/dashboard')).toBe(true);
    expect(isNavActive('/processes', '/dashboard')).toBe(false);
  });

  it('admin özeti yalnızca tam /admin yolunda aktif', () => {
    expect(isNavActive('/admin', '/admin')).toBe(true);
    expect(isNavActive('/admin/audit-logs', '/admin')).toBe(false);
    expect(isNavActive('/admin/audit-logs', '/admin/audit-logs')).toBe(true);
  });

  it('tam eşleşme ve alt rota', () => {
    expect(isNavActive('/processes', '/processes')).toBe(true);
    expect(isNavActive('/processes/KTI-1', '/processes')).toBe(true);
    expect(isNavActive('/process', '/processes')).toBe(false);
  });
});
