'use client';

import Link from 'next/link';

import { Permission } from '@leanmgmt/shared-types';

import { useHasPermission } from '@/hooks/usePermissions';

export function ProcessDetailBackLink() {
  const hasProcessViewAll = useHasPermission(Permission.PROCESS_VIEW_ALL);
  const href = hasProcessViewAll ? '/processadministration' : '/processes';
  const label = hasProcessViewAll ? 'Süreç Yöneticisi listesine dön' : 'Başlattığım süreçlere dön';

  return (
    <p className="text-center text-sm text-[var(--color-neutral-500)]">
      <Link href={href} className="text-[var(--color-primary-600)] hover:underline">
        {label}
      </Link>
    </p>
  );
}
