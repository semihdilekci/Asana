import type { AuthUser, ImpersonationState } from '@/stores/auth-store';

export interface AuthSessionResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  csrfToken: string;
  user: AuthUser & { impersonation?: ImpersonationState };
}

const DEFAULT_IMPERSONATION: ImpersonationState = {
  active: false,
  impersonator: null,
};

/** GET /auth/me ve impersonate yanıtlarından store alanlarını ayırır */
export function parseAuthSessionResponse(data: AuthSessionResponse): {
  accessToken: string;
  accessTokenExpiresAt: string;
  csrfToken: string;
  user: AuthUser;
  impersonation: ImpersonationState;
} {
  const { impersonation, ...userFields } = data.user;
  return {
    accessToken: data.accessToken,
    accessTokenExpiresAt: data.accessTokenExpiresAt,
    csrfToken: data.csrfToken,
    user: userFields as AuthUser,
    impersonation: impersonation ?? DEFAULT_IMPERSONATION,
  };
}

/** /me yanıtı — token alanları olmadan impersonation senkronu */
export function parseAuthMeUser(user: AuthUser & { impersonation?: ImpersonationState }): {
  user: AuthUser;
  impersonation: ImpersonationState;
} {
  const { impersonation, ...userFields } = user;
  return {
    user: userFields as AuthUser,
    impersonation: impersonation ?? DEFAULT_IMPERSONATION,
  };
}
