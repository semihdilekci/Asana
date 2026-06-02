import { LoginSplitShell } from '@/components/auth/login-split-shell';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <LoginSplitShell>{children}</LoginSplitShell>;
}
