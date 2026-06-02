import { PageRouteCardMotion } from '@/components/layout/PageRouteCardMotion';

/** Şifre sıfırlama vb. — ortalanmış kart düzeni */
export function AuthCenteredShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-secondary p-[var(--space-4)]">
      <header className="mb-[var(--space-8)] text-center">
        <p className="font-display text-lg font-semibold text-brand-700">Lean Management</p>
        <p className="text-sm text-text-tertiary">Kurumsal lean yönetim platformu</p>
      </header>
      <main className="w-full max-w-md" id="main-content">
        <PageRouteCardMotion>{children}</PageRouteCardMotion>
      </main>
    </div>
  );
}
