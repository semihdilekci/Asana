import { describe, expect, it } from 'vitest';

import { parseAuthMeUser, parseAuthSessionResponse } from './auth-session-response';

describe('parseAuthSessionResponse', () => {
  it('impersonation bloğunu user alanından ayırır', () => {
    const parsed = parseAuthSessionResponse({
      accessToken: 'token',
      accessTokenExpiresAt: '2026-01-01T00:00:00.000Z',
      csrfToken: 'csrf',
      user: {
        id: 'target',
        sicil: '12345678',
        firstName: 'Hedef',
        lastName: 'Kullanıcı',
        email: 'hedef@example.com',
        permissions: [],
        activeConsentVersionId: null,
        consentAccepted: true,
        passwordExpiresAt: null,
        impersonation: {
          active: true,
          impersonator: {
            id: 'admin',
            sicil: '87654321',
            firstName: 'Admin',
            lastName: 'User',
          },
        },
      },
    });

    expect(parsed.user.id).toBe('target');
    expect(parsed.impersonation.active).toBe(true);
    expect(parsed.impersonation.impersonator?.sicil).toBe('87654321');
    expect('impersonation' in parsed.user).toBe(false);
  });
});

describe('parseAuthMeUser', () => {
  it('impersonation yoksa varsayılan döner', () => {
    const parsed = parseAuthMeUser({
      id: 'u1',
      sicil: '11111111',
      firstName: 'Test',
      lastName: 'User',
      email: 't@example.com',
      permissions: [],
      activeConsentVersionId: null,
      consentAccepted: true,
      passwordExpiresAt: null,
    });

    expect(parsed.impersonation).toEqual({ active: false, impersonator: null });
  });
});
