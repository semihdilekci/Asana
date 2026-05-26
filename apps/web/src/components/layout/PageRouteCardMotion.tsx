'use client';

import { usePathname } from 'next/navigation';

/**
 * Rota değişince `main` içindeki `.ls-card` öğelerine giriş animasyonu uygular.
 *
 * Önceden `querySelectorAll` + inline `--card-enter-delay` ile kademeli gecikme vardı; bu,
 * SSR ile istemci hidrasyonunda `style` uyumsuzluğu üretiyordu. Gecikme artık yalnızca
 * `globals.css` içindeki `.page-route-card-motion .ls-card` kuralıyla (0ms) verilir.
 * Rota anahtarı (`key`) animasyonu yeniden tetiklemek için yeterli.
 */
export function PageRouteCardMotion({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-route-card-motion w-full min-w-0">
      {children}
    </div>
  );
}
