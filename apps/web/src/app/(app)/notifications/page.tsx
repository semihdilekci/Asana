'use client';

import { Suspense } from 'react';

import { NotificationList } from '@/components/notifications/NotificationList';
import { LoadingSplash } from '@/components/shared/LoadingSplash';

function NotificationListFallback() {
  return <LoadingSplash variant="card" />;
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<NotificationListFallback />}>
      <NotificationList />
    </Suspense>
  );
}
