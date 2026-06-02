import { AuthCenteredShell } from '@/components/auth/auth-centered-shell';

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <AuthCenteredShell>{children}</AuthCenteredShell>;
}
