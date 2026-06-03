'use client';

import { useEffect, useState } from 'react';

import { useAuthStore } from '@/stores/auth-store';

/** SSR ile istemci aynı metni üretsin; saat dilimi farkı hidrasyon uyumsuzluğu yaratmasın */
function getGreetingClient(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Günaydın';
  if (hour < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.currentUser);
  const [greeting, setGreeting] = useState('Merhaba');
  useEffect(() => {
    setGreeting(getGreetingClient());
  }, []);

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-[var(--text-2xl)] font-bold leading-[var(--lh-2xl)] tracking-[var(--tracking-2xl)] text-[var(--color-fg)]">
          {greeting}
          {user?.firstName ? `, ${user.firstName}` : ''}
        </h1>
        <p className="mt-[var(--space-2)] text-[var(--text-sm)] text-[var(--color-fg-muted)]">
          Lean Management platformuna hoş geldiniz
        </p>
      </div>
    </div>
  );
}
