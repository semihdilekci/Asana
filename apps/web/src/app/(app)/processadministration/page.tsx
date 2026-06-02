import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { Permission } from '@leanmgmt/shared-types';

import { Alert } from '@/components/base';
import { ProcessAdminList } from '@/components/processes/ProcessAdminList';
import { PermissionGate } from '@/components/shared/PermissionGate';

export const metadata: Metadata = {
  title: 'Süreç Yöneticisi',
};

export default function ProcessAdministrationPage() {
  return (
    <div className="space-y-[var(--space-6)]">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-neutral-900)]">
          Süreç Yöneticisi
        </h1>
        <p className="mt-[var(--space-1)] text-sm text-[var(--color-neutral-500)]">
          Kurum genelindeki tüm süreçleri görüntüleyin ve filtreleyin.
        </p>
      </div>

      <PermissionGate
        permission={Permission.PROCESS_VIEW_ALL}
        fallback={
          <Alert variant="error">
            <p>Bu sayfayı görüntülemek için tüm süreçleri görüntüleme yetkisi gerekir.</p>
            <Link
              href="/dashboard"
              className="mt-[var(--space-2)] inline-block text-sm text-[var(--color-primary-700)] underline"
            >
              Ana sayfaya dön
            </Link>
          </Alert>
        }
      >
        <Suspense
          fallback={
            <div className="space-y-[var(--space-3)]" role="status" aria-live="polite">
              <span className="sr-only">Yükleniyor...</span>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-neutral-100)]"
                />
              ))}
            </div>
          }
        >
          <ProcessAdminList />
        </Suspense>
      </PermissionGate>

      <p className="text-center text-sm text-[var(--color-neutral-500)]">
        <Link href="/dashboard" className="text-[var(--color-primary-600)] hover:underline">
          Ana sayfaya dön
        </Link>
      </p>
    </div>
  );
}
