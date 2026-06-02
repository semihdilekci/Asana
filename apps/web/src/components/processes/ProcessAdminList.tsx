'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import {
  Alert,
  Badge,
  Button,
  Card,
  DatePicker,
  dateValueToIsoDateString,
  inputClassName,
  isoDateStringToDateValue,
} from '@/components/base';
import { useMasterDataListQuery } from '@/lib/queries/master-data';
import { useProcessesListQuery } from '@/lib/queries/processes';
import type { ProcessListFilters } from '@/lib/query-keys';

const STATUS_OPTIONS = [
  { value: '', label: 'Tümü' },
  { value: 'INITIATED', label: 'INITIATED' },
  { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
  { value: 'COMPLETED', label: 'COMPLETED' },
  { value: 'REJECTED', label: 'REJECTED' },
  { value: 'CANCELLED', label: 'CANCELLED' },
];

function filtersFromSearch(searchParams: URLSearchParams): ProcessListFilters {
  const displayId = searchParams.get('displayId')?.trim();
  const status = searchParams.get('status')?.trim();
  const processType = searchParams.get('processType')?.trim();
  const rawFrom = searchParams.get('startedAtFrom')?.trim();
  const rawTo = searchParams.get('startedAtTo')?.trim();
  const startedByUserId = searchParams.get('startedByUserId')?.trim();
  const companyId = searchParams.get('companyId')?.trim();
  const showCancelled = searchParams.get('showCancelled') === 'true' ? 'true' : undefined;

  const startedAtFrom =
    rawFrom && /^\d{4}-\d{2}-\d{2}$/.test(rawFrom) ? `${rawFrom}T00:00:00.000Z` : undefined;
  const startedAtTo =
    rawTo && /^\d{4}-\d{2}-\d{2}$/.test(rawTo) ? `${rawTo}T23:59:59.999Z` : undefined;

  return {
    scope: 'admin',
    limit: 50,
    sort: 'started_at_desc',
    ...(displayId ? { displayId } : {}),
    ...(status ? { status } : {}),
    ...(processType ? { processType } : {}),
    ...(startedAtFrom ? { startedAtFrom } : {}),
    ...(startedAtTo ? { startedAtTo } : {}),
    ...(startedByUserId ? { startedByUserId } : {}),
    ...(companyId ? { companyId } : {}),
    ...(showCancelled ? { showCancelled } : {}),
  };
}

export function ProcessAdminList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const filters = useMemo(() => filtersFromSearch(searchParams), [searchParams]);

  const { data: companiesData } = useMasterDataListQuery('companies', {
    isActive: 'true',
    usageFilter: 'all',
  });
  const companies = companiesData?.items ?? [];

  const { data, isLoading, isError, error, refetch } = useProcessesListQuery(filters);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const p = new URLSearchParams(searchParams.toString());
      if (value === null || value === '') p.delete(key);
      else p.set(key, value);
      router.push(`/processadministration?${p.toString()}`);
    },
    [router, searchParams],
  );

  const clearFilters = () => {
    router.push('/processadministration');
  };

  if (isLoading) {
    return (
      <div className="space-y-[var(--space-3)]" role="status" aria-live="polite">
        <span className="sr-only">Yükleniyor...</span>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-neutral-100)]"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="error">
        <p>Süreçler yüklenemedi.</p>
        <p className="text-sm opacity-90">{(error as Error)?.message ?? 'Bilinmeyen hata'}</p>
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

  const items = data?.items ?? [];

  return (
    <div className="space-y-[var(--space-6)]">
      <Card className="space-y-[var(--space-4)] p-[var(--space-4)]">
        <div className="flex flex-wrap items-end gap-[var(--space-3)]">
          <label className="flex min-w-[10rem] flex-col gap-1 text-sm">
            <span className="text-[var(--color-neutral-600)]">Süreç ID</span>
            <input
              type="text"
              className={inputClassName('md', 'text-sm')}
              placeholder="KTI-000001"
              defaultValue={searchParams.get('displayId') ?? ''}
              onBlur={(e) => setParam('displayId', e.target.value.trim() || null)}
            />
          </label>
          <label className="flex min-w-[10rem] flex-col gap-1 text-sm">
            <span className="text-[var(--color-neutral-600)]">Durum</span>
            <select
              className={inputClassName('md', 'text-sm')}
              value={searchParams.get('status') ?? ''}
              onChange={(e) => setParam('status', e.target.value || null)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[10rem] flex-col gap-1 text-sm">
            <span className="text-[var(--color-neutral-600)]">Süreç tipi</span>
            <select
              className={inputClassName('md', 'text-sm')}
              value={searchParams.get('processType') ?? ''}
              onChange={(e) => setParam('processType', e.target.value || null)}
            >
              <option value="">Tümü</option>
              <option value="BEFORE_AFTER_KAIZEN">BEFORE_AFTER_KAIZEN (KTİ)</option>
            </select>
          </label>
          <div className="flex min-w-[10rem] flex-col gap-1 text-sm">
            <span className="text-[var(--color-neutral-600)]">Başlangıç (başlangıç)</span>
            <DatePicker
              aria-label="Başlangıç tarihi (başlangıç)"
              size="sm"
              value={isoDateStringToDateValue(searchParams.get('startedAtFrom'))}
              onChange={(v) => setParam('startedAtFrom', v ? dateValueToIsoDateString(v) : null)}
            />
          </div>
          <div className="flex min-w-[10rem] flex-col gap-1 text-sm">
            <span className="text-[var(--color-neutral-600)]">Başlangıç (bitiş)</span>
            <DatePicker
              aria-label="Başlangıç tarihi (bitiş)"
              size="sm"
              value={isoDateStringToDateValue(searchParams.get('startedAtTo'))}
              onChange={(v) => setParam('startedAtTo', v ? dateValueToIsoDateString(v) : null)}
            />
          </div>
          <label className="flex min-w-[12rem] flex-col gap-1 text-sm">
            <span className="text-[var(--color-neutral-600)]">Şirket</span>
            <select
              className={inputClassName('md', 'text-sm')}
              value={searchParams.get('companyId') ?? ''}
              onChange={(e) => setParam('companyId', e.target.value || null)}
            >
              <option value="">Tümü</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[14rem] flex-col gap-1 text-sm">
            <span className="text-[var(--color-neutral-600)]">Başlatan kullanıcı ID</span>
            <input
              type="text"
              className={inputClassName('md', 'font-mono text-sm')}
              placeholder="UUID"
              defaultValue={searchParams.get('startedByUserId') ?? ''}
              onBlur={(e) => setParam('startedByUserId', e.target.value.trim() || null)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--color-neutral-700)]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[var(--color-neutral-300)]"
              checked={searchParams.get('showCancelled') === 'true'}
              onChange={(e) => setParam('showCancelled', e.target.checked ? 'true' : null)}
            />
            İptal edilenleri göster
          </label>
          <Button color="secondary" size="sm" onPress={clearFilters}>
            Filtreleri temizle
          </Button>
        </div>
      </Card>

      {items.length === 0 ? (
        <Card className="p-[var(--space-8)] text-center">
          <p className="text-[var(--color-neutral-700)]">Filtrelere uyan süreç bulunamadı.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-neutral-200)]">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-[var(--color-neutral-50)] text-[var(--color-neutral-600)]">
              <tr>
                <th className="px-[var(--space-4)] py-[var(--space-3)] font-medium">Süreç</th>
                <th className="px-[var(--space-4)] py-[var(--space-3)] font-medium">Durum</th>
                <th className="px-[var(--space-4)] py-[var(--space-3)] font-medium">Aktif adım</th>
                <th className="px-[var(--space-4)] py-[var(--space-3)] font-medium">Başlatan</th>
                <th className="px-[var(--space-4)] py-[var(--space-3)] font-medium">Başlangıç</th>
                <th className="px-[var(--space-4)] py-[var(--space-3)] font-medium">Şirket</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-t border-[var(--color-neutral-100)]">
                  <td className="px-[var(--space-4)] py-[var(--space-3)]">
                    <Link
                      href={`/processes/${encodeURIComponent(row.displayId)}`}
                      className="font-mono font-medium text-[var(--color-primary-700)] hover:underline"
                    >
                      {row.displayId}
                    </Link>
                  </td>
                  <td className="px-[var(--space-4)] py-[var(--space-3)]">{row.status}</td>
                  <td className="px-[var(--space-4)] py-[var(--space-3)] text-[var(--color-neutral-700)]">
                    {row.activeTaskLabel}
                  </td>
                  <td className="px-[var(--space-4)] py-[var(--space-3)] text-[var(--color-neutral-700)]">
                    <Link
                      href={`/users/${encodeURIComponent(row.startedBy.id)}`}
                      className="text-[var(--color-primary-700)] hover:underline"
                    >
                      {row.performerDisplayLabel ??
                        `${row.startedBy.firstName} ${row.startedBy.lastName}`}
                    </Link>
                    {row.performedViaImpersonation ? (
                      <Badge color="warning" size="sm" className="mt-[var(--space-1)]">
                        Impersonation
                      </Badge>
                    ) : row.startedBy.sicil ? (
                      <span className="block text-xs text-[var(--color-neutral-500)]">
                        Sicil {row.startedBy.sicil}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-[var(--space-4)] py-[var(--space-3)] text-[var(--color-neutral-600)]">
                    {new Date(row.startedAt).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-[var(--space-4)] py-[var(--space-3)] text-[var(--color-neutral-600)]">
                    {row.company.name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
