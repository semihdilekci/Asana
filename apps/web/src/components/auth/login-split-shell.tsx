'use client';

import { PageRouteCardMotion } from '@/components/layout/PageRouteCardMotion';
import { SilkBackground } from '@/components/ui/SilkBackground';

/** Giriş — sol form, sağ silk dokusu (lg+) */
export function LoginSplitShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="flex min-h-screen w-full flex-col bg-bg-primary lg:w-1/2">
        <div className="flex flex-1 flex-col items-center justify-center px-[var(--space-6)] py-[var(--space-10)]">
          <div className="mb-[var(--space-8)] w-full max-w-[400px]">
            <p className="text-center font-display text-lg font-semibold text-brand-700">
              Lean Management
            </p>
            <p className="mt-[var(--space-1)] text-center text-sm text-text-tertiary">
              Kurumsal lean yönetim platformu
            </p>
          </div>
          <main className="w-full max-w-[400px]" id="main-content">
            <PageRouteCardMotion>{children}</PageRouteCardMotion>
          </main>
        </div>
        <p className="px-[var(--space-6)] pb-[var(--space-4)] text-xs text-text-quaternary">
          © {new Date().getFullYear()} Lean Management
        </p>
      </div>

      <aside
        className="relative -ml-[var(--space-6)] hidden min-h-screen min-w-0 flex-1 overflow-hidden lg:block"
        aria-hidden
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, var(--color-brand-900) 0%, var(--color-brand-700) 45%, var(--color-brand-600) 100%)',
          }}
        />
        <SilkBackground
          speed={10}
          scale={1.05}
          color="#045358"
          noiseIntensity={1.15}
          rotation={50}
          className="opacity-65 mix-blend-soft-light"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 70% 20%, var(--color-brand-300) 0%, transparent 55%)',
            opacity: 0.12,
          }}
        />
      </aside>
    </div>
  );
}
