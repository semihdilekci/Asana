import { describe, expect, it } from 'vitest';

import { filterKnownPermissionKeys, isKnownPermissionKey, Permission } from './permission.js';

describe('permission keys', () => {
  it('NOTIFICATION_READ geçerli enum değil', () => {
    expect(isKnownPermissionKey('NOTIFICATION_READ')).toBe(false);
    expect(isKnownPermissionKey(Permission.NOTIFICATION_EDIT)).toBe(true);
  });

  it('filterKnownPermissionKeys eski anahtarları eler', () => {
    expect(
      filterKnownPermissionKeys(['NOTIFICATION_READ', Permission.USER_LIST_VIEW, 'FAKE_KEY']),
    ).toEqual([Permission.USER_LIST_VIEW]);
  });
});
