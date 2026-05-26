import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ChangePasswordForm } from '@/components/auth/change-password-form';
import { LoadingSplash } from '@/components/shared/LoadingSplash';

export const metadata: Metadata = {
  title: 'Şifre değiştir',
};

function Fallback() {
  return <LoadingSplash variant="card" />;
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ChangePasswordForm />
    </Suspense>
  );
}
