import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { LoadingSplash } from '@/components/shared/LoadingSplash';

export const metadata: Metadata = {
  title: 'Şifre sıfırlama',
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<LoadingSplash variant="card" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
