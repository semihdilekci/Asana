import { create } from 'zustand';

/** GET /auth/me ve login yanıtı ile hizalı (şirket / yönetici KTİ başlatma için) */
export interface AuthUserCompany {
  id: string;
  code: string;
  name: string;
}

export interface AuthUserManager {
  id: string;
  sicil: string;
  firstName: string;
  lastName: string;
}

export interface AuthUser {
  id: string;
  sicil: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Weather preset key — eski oturumlarda yoksa `UserAvatar` varsayılan kullanır */
  avatarKey?: string;
  permissions: string[];
  activeConsentVersionId: string | null;
  consentAccepted: boolean;
  passwordExpiresAt: string | null;
  company?: AuthUserCompany;
  manager?: AuthUserManager | null;
}

export interface ImpersonatorSummary {
  id: string;
  sicil: string;
  firstName: string;
  lastName: string;
}

export interface ImpersonationState {
  active: boolean;
  impersonator: ImpersonatorSummary | null;
}

interface AuthState {
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  csrfToken: string | null;
  currentUser: AuthUser | null;
  impersonation: ImpersonationState;
  setAuth: (input: {
    accessToken: string;
    accessTokenExpiresAt: string;
    csrfToken: string;
    user: AuthUser;
    impersonation?: ImpersonationState;
  }) => void;
  setSessionUser: (input: { user: AuthUser; impersonation: ImpersonationState }) => void;
  setTokens: (input: {
    accessToken: string;
    accessTokenExpiresAt: string;
    csrfToken: string;
  }) => void;
  clearAuth: () => void;
}

const DEFAULT_IMPERSONATION: ImpersonationState = {
  active: false,
  impersonator: null,
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  accessTokenExpiresAt: null,
  csrfToken: null,
  currentUser: null,
  impersonation: DEFAULT_IMPERSONATION,
  setAuth: ({ accessToken, accessTokenExpiresAt, csrfToken, user, impersonation }) =>
    set({
      accessToken,
      accessTokenExpiresAt,
      csrfToken,
      currentUser: user,
      impersonation: impersonation ?? DEFAULT_IMPERSONATION,
    }),
  setSessionUser: ({ user, impersonation }) => set({ currentUser: user, impersonation }),
  setTokens: ({ accessToken, accessTokenExpiresAt, csrfToken }) =>
    set((s) => ({ ...s, accessToken, accessTokenExpiresAt, csrfToken })),
  clearAuth: () =>
    set({
      accessToken: null,
      accessTokenExpiresAt: null,
      csrfToken: null,
      currentUser: null,
      impersonation: DEFAULT_IMPERSONATION,
    }),
}));
