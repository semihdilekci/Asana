import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Oturum',
};

/** Alt rotalar kendi kabuğunu seçer (login split, diğerleri ortalanmış). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
