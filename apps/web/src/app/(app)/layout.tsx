'use client';

import { AppShell } from '@/components/application';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell variant="app">{children}</AppShell>;
}
