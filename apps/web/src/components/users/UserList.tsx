'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Permission } from '@leanmgmt/shared-types';

import { Alert, Button } from '@/components/base';
import { PermissionGate } from '@/components/shared/PermissionGate';
import {
  hasUserListActiveFilters,
  userListFilterSignature,
  UserListFiltersPanel,
} from '@/components/users/UserListFilters';
import { useDeactivateUserMutation, useUserListQuery } from '@/lib/queries/users';

export function UserList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cursor, setCursor] = useState<string | undefined>();

  const filterSignature = useMemo(() => userListFilterSignature(searchParams), [searchParams]);

  useEffect(() => {
    setCursor(undefined);
  }, [filterSignature]);

  const filters = useMemo(
    () => ({
      search: searchParams.get('search') ?? undefined,
      companyId: searchParams.get('companyId') ?? undefined,
      locationId: searchParams.get('locationId') ?? undefined,
      departmentId: searchParams.get('departmentId') ?? undefined,
      positionId: searchParams.get('positionId') ?? undefined,
      levelId: searchParams.get('levelId') ?? undefined,
      employeeType: searchParams.get('employeeType') ?? undefined,
      isActive: searchParams.get('isActive') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
      cursor,
      limit: 20,
    }),
    [searchParams, cursor],
  );

  const activeFilters = useMemo(() => hasUserListActiveFilters(searchParams), [searchParams]);

  const { data, isLoading, error, refetch } = useUserListQuery(filters);
  const deactivateMutation = useDeactivateUserMutation();

  if (isLoading) {
    return (
      <div className="space-y-[var(--space-4)]">
        <UserListFiltersPanel />
        <div role="status" aria-live="polite" aria-busy className="space-y-[var(--space-3)]">
          <span className="sr-only">Yükleniyor...</span>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-neutral-100)]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-[var(--space-4)]">
        <UserListFiltersPanel />
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
      </div>
    );
  }

  if (!data?.items.length) {
    return (
      <div className="space-y-[var(--space-4)]">
        <UserListFiltersPanel />
        <div className="py-[var(--space-12)] text-center text-[var(--color-neutral-500)]">
          <p className="text-lg font-medium">Kullanıcı bulunamadı</p>
          <p className="mt-[var(--space-1)] text-sm">
            {activeFilters
              ? 'Seçili filtrelere uyan kullanıcı yok. Filtreleri gevşetmeyi deneyin.'
              : 'Farklı filtreler deneyin veya yeni kullanıcı oluşturun.'}
          </p>
          {activeFilters && (
            <Button
              color="secondary"
              size="sm"
              className="mt-[var(--space-4)]"
              onPress={() => router.push('/users')}
            >
              Filtreleri temizle
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-[var(--space-4)]">
      <UserListFiltersPanel />
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-neutral-200)]">
        <table className="w-full text-sm" aria-label="Kullanıcı listesi">
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
                Ad Soyad
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
                Şirket
              </th>
              <th
                scope="col"
                className="px-[var(--space-4)] py-[var(--space-3)] text-left font-medium text-[var(--color-neutral-600)]"
              >
                Durum
              </th>
              <th
                scope="col"
                className="px-[var(--space-4)] py-[var(--space-3)] text-right font-medium text-[var(--color-neutral-600)]"
              >
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-neutral-200)] bg-[var(--color-neutral-0)]">
            {data.items.map((user) => (
              <tr key={user.id} className="hover:bg-[var(--color-neutral-50)] transition-colors">
                <td className="px-[var(--space-4)] py-[var(--space-3)] font-mono text-[var(--color-neutral-700)]">
                  {user.sicil ?? '—'}
                </td>
                <td className="px-[var(--space-4)] py-[var(--space-3)]">
                  <Link
                    href={`/users/${user.id}`}
                    className="font-medium text-[var(--color-primary-700)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)]"
                  >
                    {user.firstName} {user.lastName}
                  </Link>
                </td>
                <td className="px-[var(--space-4)] py-[var(--space-3)] text-[var(--color-neutral-600)]">
                  {user.email ?? '—'}
                </td>
                <td className="px-[var(--space-4)] py-[var(--space-3)] text-[var(--color-neutral-600)]">
                  {user.company.name}
                </td>
                <td className="px-[var(--space-4)] py-[var(--space-3)]">
                  <span
                    className={`inline-flex items-center gap-[var(--space-1)] rounded-full px-[var(--space-2)] py-0.5 text-xs font-medium ${
                      user.isActive
                        ? 'bg-[var(--color-success-100)] text-[var(--color-success-700)]'
                        : 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]'
                    }`}
                    aria-label={user.isActive ? 'Aktif' : 'Pasif'}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-[var(--color-success-500)]' : 'bg-[var(--color-neutral-400)]'}`}
                      aria-hidden
                    />
                    {user.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-[var(--space-4)] py-[var(--space-3)] text-right">
                  <div className="flex items-center justify-end gap-[var(--space-2)]">
                    <Button
                      color="secondary"
                      size="xs"
                      onPress={() => router.push(`/users/${user.id}`)}
                    >
                      Detay
                    </Button>
                    <PermissionGate permission={Permission.USER_UPDATE_ATTRIBUTE}>
                      <Button
                        color="secondary"
                        size="xs"
                        onPress={() => router.push(`/users/${user.id}/edit`)}
                      >
                        Düzenle
                      </Button>
                    </PermissionGate>
                    {user.isActive && (
                      <PermissionGate permission={Permission.USER_DEACTIVATE}>
                        <Button
                          color="destructive"
                          size="xs"
                          isDisabled={deactivateMutation.isPending}
                          onPress={() => {
                            if (
                              !confirm('Bu kullanıcıyı pasif yapmak istediğinizden emin misiniz?')
                            )
                              return;
                            deactivateMutation.mutate(
                              { id: user.id, reason: 'Admin tarafından deaktive edildi' },
                              {
                                onSuccess: () => toast.success('Kullanıcı pasif yapıldı'),
                                onError: () => toast.error('İşlem başarısız'),
                              },
                            );
                          }}
                        >
                          Pasif yap
                        </Button>
                      </PermissionGate>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-[var(--space-4)] flex items-center justify-between">
        <p className="text-sm text-[var(--color-neutral-500)]">
          {data.items.length} kayıt gösteriliyor
        </p>
        <div className="flex gap-[var(--space-2)]">
          {cursor && (
            <Button color="secondary" size="sm" onPress={() => setCursor(undefined)}>
              Başa dön
            </Button>
          )}
          {data.pagination.hasMore && (
            <Button
              color="primary"
              size="sm"
              onPress={() => setCursor(data.pagination.nextCursor ?? undefined)}
            >
              Sonraki
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
