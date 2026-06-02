'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Permission } from '@leanmgmt/shared-types';

import { Button, ButtonLink, inputClassName } from '@/components/base';
import { PermissionGate } from '@/components/shared/PermissionGate';
import {
  useDeleteRoleMutation,
  useRoleDetailQuery,
  useUpdateRoleMutation,
} from '@/lib/queries/roles';

export function RoleDetailContent({ roleId }: { roleId: string }) {
  const router = useRouter();
  const { data: role, isLoading, error, refetch } = useRoleDetailQuery(roleId);
  const updateMutation = useUpdateRoleMutation(roleId);
  const deleteMutation = useDeleteRoleMutation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-live="polite">
        <span className="sr-only">Yükleniyor...</span>
        <div className="h-24 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-neutral-100)]" />
      </div>
    );
  }
  if (error || !role) {
    return (
      <p className="text-sm text-[var(--color-error-600)]">
        Rol yüklenemedi.{' '}
        <button type="button" className="underline" onClick={() => void refetch()}>
          Tekrar dene
        </button>
      </p>
    );
  }

  const startEdit = () => {
    setName(role.name);
    setDescription(role.description ?? '');
    setEditing(true);
    setMsg(null);
  };

  const saveEdit = async () => {
    setMsg(null);
    try {
      await updateMutation.mutateAsync({ name, description: description || null });
      setEditing(false);
      setMsg('Kaydedildi.');
    } catch {
      setMsg('Güncelleme başarısız.');
    }
  };

  const onDelete = async () => {
    if (!window.confirm('Bu rol kalıcı olarak silinecek. Emin misiniz?')) return;
    try {
      await deleteMutation.mutateAsync(roleId);
      router.push('/roles');
    } catch {
      setMsg('Silinemedi (sistem rolü veya yetki kısıtı).');
    }
  };

  return (
    <div className="space-y-[var(--space-4)]">
      <nav className="text-sm text-[var(--color-neutral-600)]">
        <Link href="/roles" className="hover:text-[var(--color-primary-600)]">
          Roller
        </Link>
        <span aria-hidden> / </span>
        <span className="text-[var(--color-neutral-900)]">{role.name}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-[var(--color-neutral-500)]">{role.code}</p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--color-neutral-900)]">
            {role.name}
          </h1>
          {role.isSystem ? (
            <span className="mt-1 inline-block rounded bg-[var(--color-neutral-200)] px-2 py-0.5 text-xs">
              Sistem rolü
            </span>
          ) : (
            <span className="mt-1 inline-block rounded bg-[var(--color-primary-100)] px-2 py-0.5 text-xs">
              Özel rol
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <PermissionGate permission={Permission.ROLE_UPDATE}>
            {editing ? (
              <>
                <Button color="primary" size="sm" onPress={() => void saveEdit()}>
                  Kaydet
                </Button>
                <Button color="secondary" size="sm" onPress={() => setEditing(false)}>
                  İptal
                </Button>
              </>
            ) : (
              <Button color="secondary" size="sm" onPress={startEdit}>
                Düzenle
              </Button>
            )}
          </PermissionGate>
          <PermissionGate permission={Permission.ROLE_DELETE}>
            {!role.isSystem ? (
              <Button
                color="secondary"
                size="sm"
                className="text-[var(--color-error-700)]"
                onPress={() => void onDelete()}
              >
                Sil
              </Button>
            ) : null}
          </PermissionGate>
        </div>
      </div>

      {msg ? <p className="text-sm text-[var(--color-neutral-600)]">{msg}</p> : null}

      {editing ? (
        <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] p-4">
          <label className="block text-sm">
            <span className="text-[var(--color-neutral-700)]">Ad</span>
            <input
              className={inputClassName('md', 'mt-1 w-full')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--color-neutral-700)]">Açıklama</span>
            <textarea
              className={inputClassName('md', 'mt-1 min-h-[4rem] w-full')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-neutral-700)]">{role.description || '—'}</p>
      )}

      <div className="flex flex-wrap gap-2 border-t border-[var(--color-neutral-200)] pt-4">
        <ButtonLink href={`/roles/${role.id}/permissions`} color="secondary" size="sm">
          Yetkiler ({role.permissionCount})
        </ButtonLink>
        <ButtonLink href={`/roles/${role.id}/rules`} color="secondary" size="sm">
          Kurallar ({role.ruleCount})
        </ButtonLink>
        <ButtonLink href={`/roles/${role.id}/users`} color="secondary" size="sm">
          Kullanıcılar
        </ButtonLink>
      </div>
    </div>
  );
}
