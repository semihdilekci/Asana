import { AuthCenteredShell } from '@/components/auth/auth-centered-shell';

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <AuthCenteredShell>{children}</AuthCenteredShell>;
}
