import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { apiClient, type ApiErrorBody } from '@/lib/api-client';
import { parseAuthSessionResponse } from '@/lib/auth-session-response';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/stores/auth-store';

export const authQueryKeys = {
  me: ['me'] as const,
  consentVersion: (id: string) => ['consent-version', id] as const,
};

export function useConsentVersionQuery(consentVersionId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: authQueryKeys.consentVersion(consentVersionId ?? 'none'),
    enabled: enabled && !!consentVersionId,
    queryFn: async () => {
      const res = await apiClient.get<{
        success: boolean;
        data: { id: string; version: number; title: string; body: string; locale: string };
      }>(`/api/v1/consent-versions/${consentVersionId!}`);
      if (!res.data.success || !res.data.data) {
        throw new Error('Rıza metni yüklenemedi');
      }
      return res.data.data;
    },
    staleTime: 5 * 60_000,
  });
}

function isApiError(err: unknown): err is { response: { data: ApiErrorBody } } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response?: unknown }).response === 'object'
  );
}

function impersonationErrorMessage(err: unknown): string {
  if (isApiError(err)) {
    const code = err.response.data?.error?.code;
    const message = err.response.data?.error?.message;
    if (code === 'AUTH_IMPERSONATION_TARGET_INACTIVE') {
      return 'Pasif kullanıcı adına oturum açılamaz.';
    }
    if (code === 'AUTH_IMPERSONATION_FORBIDDEN') {
      return 'Bu kullanıcı adına oturum açma yetkiniz bulunmuyor.';
    }
    if (message) return message;
  }
  return 'İşlem başarısız. Tekrar deneyin.';
}

/** Impersonation sonrası effective user'a bağlı tüm cache'leri yeniler */
export function invalidateAuthBoundQueries(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.processes.all() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.roles.all() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.masterData.all() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.admin.summary() });
}

function applyAuthSessionToStore(data: ReturnType<typeof parseAuthSessionResponse>): void {
  useAuthStore.getState().setAuth(data);
}

export function useImpersonateSwitchMutation() {
  const queryClient = useQueryClient();
  const impersonationActive = useAuthStore((s) => s.impersonation.active);

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      const endpoint = impersonationActive
        ? '/api/v1/auth/impersonate/switch'
        : '/api/v1/auth/impersonate/start';
      const res = await apiClient.post<{
        success: boolean;
        data: Parameters<typeof parseAuthSessionResponse>[0];
      }>(endpoint, { targetUserId });
      if (!res.data.success || !res.data.data) {
        throw new Error('Impersonation yanıtı geçersiz');
      }
      return parseAuthSessionResponse(res.data.data);
    },
    onSuccess: (session) => {
      applyAuthSessionToStore(session);
      invalidateAuthBoundQueries(queryClient);
    },
    onError: (err) => {
      toast.error(impersonationErrorMessage(err));
    },
  });
}

export function useImpersonateStopMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{
        success: boolean;
        data: Parameters<typeof parseAuthSessionResponse>[0];
      }>('/api/v1/auth/impersonate/stop', {});
      if (!res.data.success || !res.data.data) {
        throw new Error('Impersonation stop yanıtı geçersiz');
      }
      return parseAuthSessionResponse(res.data.data);
    },
    onSuccess: (session) => {
      applyAuthSessionToStore(session);
      invalidateAuthBoundQueries(queryClient);
    },
    onError: (err) => {
      toast.error(impersonationErrorMessage(err));
    },
  });
}
