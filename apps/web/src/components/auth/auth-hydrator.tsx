'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LoadingSplash } from '@/components/shared/LoadingSplash';
import { isAuthProtectedAppPath } from '@/lib/auth-protected-paths';
import { readCookie } from '@/lib/auth-session-hint';
import { refreshAccessToken } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

export function AuthHydrator({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  /** Korumalı rota + bellekte token yok: yalnız o zaman tam sayfa bekleme (refresh / yönlendirme) */
  const [sessionReady, setSessionReady] = useState(() => {
    if (!isAuthProtectedAppPath(pathname)) return true;
    return Boolean(useAuthStore.getState().accessToken);
  });

  useEffect(() => {
    let cancelled = false;

    async function run(): Promise<void> {
      if (!isAuthProtectedAppPath(pathname)) {
        if (!cancelled) setSessionReady(true);
        return;
      }
      if (useAuthStore.getState().accessToken) {
        if (!cancelled) setSessionReady(true);
        return;
      }
      const csrf = readCookie('csrf_token');
      if (!csrf) {
        if (!cancelled) {
          setSessionReady(true);
          router.replace('/login');
        }
        return;
      }
      try {
        await refreshAccessToken();
      } catch {
        if (!cancelled) router.replace('/login');
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (isAuthProtectedAppPath(pathname) && !sessionReady) {
    return <LoadingSplash variant="fullscreen" srLabel="Oturum yükleniyor" />;
  }

  return <>{children}</>;
}
