'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

import { AppShell } from '@/components/application';
import { ADMIN_ENTRY_ANY_OF } from '@/components/application/shell-nav-config';
import { LoadingSplash } from '@/components/shared/LoadingSplash';
import { useAuthStore } from '@/stores/auth-store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);

  const allowed = useMemo(() => {
    const p = currentUser?.permissions;
    if (!p?.length) return false;
    return ADMIN_ENTRY_ANY_OF.some((perm) => p.includes(perm));
  }, [currentUser?.permissions]);

  useEffect(() => {
    if (!currentUser) return;
    if (!allowed) {
      router.replace('/dashboard');
    }
  }, [allowed, currentUser, router]);

  if (!currentUser) {
    return <LoadingSplash variant="fullscreen" />;
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-secondary">
        <p className="text-sm text-text-tertiary">Yönlendiriliyor…</p>
      </div>
    );
  }

  return <AppShell variant="admin">{children}</AppShell>;
}
