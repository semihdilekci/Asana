import { Suspense } from 'react';

import { Permission } from '@leanmgmt/shared-types';

import { AuditLogsPageClient } from '@/components/admin/AuditLogsPageClient';
import { LoadingSplash } from '@/components/shared/LoadingSplash';
import { PermissionGate } from '@/components/shared/PermissionGate';

export default function AdminAuditLogsPage() {
  return (
    <PermissionGate
      permission={Permission.AUDIT_LOG_VIEW}
      fallback={
        <p className="text-sm text-[var(--color-neutral-600)]">Bu sayfaya erişim yetkiniz yok.</p>
      }
    >
      <Suspense fallback={<LoadingSplash variant="card" />}>
        <AuditLogsPageClient />
      </Suspense>
    </PermissionGate>
  );
}
