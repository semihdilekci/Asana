import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoginForm } from '@/components/auth/login-form';
import { LoadingSplash } from '@/components/shared/LoadingSplash';

export const metadata: Metadata = {
  title: 'Giriş',
};

function LoginFallback() {
  return <LoadingSplash variant="card" />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
