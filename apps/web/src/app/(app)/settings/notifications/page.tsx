'use client';

import Link from 'next/link';

import { Permission } from '@leanmgmt/shared-types';

import { NotificationPreferencesForm } from '@/components/notifications/NotificationPreferencesForm';
import { PermissionGate } from '@/components/shared/PermissionGate';

export default function NotificationSettingsPage() {
  return (
    <PermissionGate
      permission={Permission.NOTIFICATION_EDIT}
      fallback={
        <div className="ls-alert ls-alert--danger" role="alert">
          <p>Bu sayfayı görüntülemek için bildirim ayarlarını düzenleme yetkisi gerekir.</p>
          <Link
            href="/dashboard"
            className="mt-[var(--space-2)] inline-block text-sm text-[var(--color-primary-700)] underline"
          >
            Ana sayfaya dön
          </Link>
        </div>
      }
    >
      <NotificationPreferencesForm />
    </PermissionGate>
  );
}
