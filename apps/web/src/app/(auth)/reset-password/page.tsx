import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { LoadingSplash } from '@/components/shared/LoadingSplash';

export const metadata: Metadata = {
  title: 'Yeni şifre',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSplash variant="card" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
