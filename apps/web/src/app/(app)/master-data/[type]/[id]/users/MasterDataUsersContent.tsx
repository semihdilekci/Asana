'use client';

import Link from 'next/link';

import type { MasterDataType } from '@leanmgmt/shared-schemas';

import { Alert, Button } from '@/components/base';
import { useMasterDataUsersQuery } from '@/lib/queries/master-data';

interface MasterDataUsersContentProps {
  type: MasterDataType;
  id: string;
}

export function MasterDataUsersContent({ type, id }: MasterDataUsersContentProps) {
  const { data, isLoading, error, refetch } = useMasterDataUsersQuery(type, id);

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" aria-busy className="space-y-[var(--space-3)]">
        <span className="sr-only">Kullanıcılar yükleniyor...</span>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-neutral-100)]"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        <p>Kullanıcılar yüklenemedi.</p>
        <Button
          color="secondary"
          size="sm"
          className="mt-[var(--space-2)]"
          onPress={() => void refetch()}
        >
          Tekrar dene
        </Button>
      </Alert>
    );
  }

  if (!data?.items.length) {
    return (
      <div className="py-[var(--space-12)] text-center text-[var(--color-neutral-500)]">
        <p className="text-lg font-medium">Bu kayda bağlı kullanıcı bulunamadı</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-[var(--space-3)] text-sm text-[var(--color-neutral-500)]">
        {data.items.length} kullanıcı gösteriliyor
      </p>
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)]">
        <table className="w-full text-sm" aria-label="Bağlı kullanıcılar">
          <thead className="bg-[var(--color-neutral-50)]">
            <tr>
              <th
                scope="col"
                className="px-[var(--space-4)] py-[var(--space-3)] text-left font-medium text-[var(--color-neutral-600)]"
              >
                Sicil
              </th>
              <th
                scope="col"
                className="px-[var(--space-4)] py-[var(--space-3)] text-left font-medium text-[var(--color-neutral-600)]"
              >
                E-posta
              </th>
              <th
                scope="col"
                className="px-[var(--space-4)] py-[var(--space-3)] text-left font-medium text-[var(--color-neutral-600)]"
              >
                Ad Soyad
              </th>
              <th
                scope="col"
                className="px-[var(--space-4)] py-[var(--space-3)] text-left font-medium text-[var(--color-neutral-600)]"
              >
                Pozisyon
              </th>
              <th
                scope="col"
                className="px-[var(--space-4)] py-[var(--space-3)] text-left font-medium text-[var(--color-neutral-600)]"
              >
                Durum
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-neutral-200)] bg-[var(--color-neutral-0)]">
            {data.items.map((user) => (
              <tr key={user.id} className="hover:bg-[var(--color-neutral-50)]">
                <td className="px-[var(--space-4)] py-[var(--space-3)] font-mono text-[var(--color-neutral-600)]">
                  {user.sicil ?? '—'}
                </td>
                <td className="px-[var(--space-4)] py-[var(--space-3)] text-[var(--color-neutral-700)]">
                  {user.email ?? '—'}
                </td>
                <td className="px-[var(--space-4)] py-[var(--space-3)]">
                  <Link
                    href={`/users/${user.id}`}
                    className="font-medium text-[var(--color-primary-700)] hover:underline"
                  >
                    {user.firstName} {user.lastName}
                  </Link>
                </td>
                <td className="px-[var(--space-4)] py-[var(--space-3)] text-[var(--color-neutral-700)]">
                  {user.position ? `${user.position.code} — ${user.position.name}` : '—'}
                </td>
                <td className="px-[var(--space-4)] py-[var(--space-3)]">
                  <span
                    className={`inline-flex items-center gap-[var(--space-1)] rounded-full px-[var(--space-2)] py-0.5 text-xs font-medium ${
                      user.isActive
                        ? 'bg-[var(--color-success-100)] text-[var(--color-success-700)]'
                        : 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]'
                    }`}
                  >
                    {user.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
