import type { Metadata } from 'next';
import Link from 'next/link';

import { Card } from '@/components/base';
import { UserForm } from '@/components/users/UserForm';

export const metadata: Metadata = {
  title: 'Yeni Kullanıcı',
};

export default function NewUserPage() {
  return (
    <div className="space-y-[var(--space-6)]">
      <div>
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-[var(--space-2)] text-sm text-[var(--color-neutral-500)]">
            <li>
              <Link href="/users" className="hover:text-[var(--color-primary-600)]">
                Kullanıcılar
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-[var(--color-neutral-800)]">Yeni Kullanıcı</li>
          </ol>
        </nav>
        <h1 className="mt-[var(--space-2)] font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-neutral-900)]">
          Yeni Kullanıcı Oluştur
        </h1>
      </div>

      <Card className="p-[var(--space-6)]">
        <UserForm mode="create" />
      </Card>
    </div>
  );
}
