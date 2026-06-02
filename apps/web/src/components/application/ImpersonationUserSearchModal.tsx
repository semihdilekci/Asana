'use client';

import { SearchLg } from '@untitledui/icons';
import { useEffect, useState } from 'react';

import {
  Button,
  Input,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHeadCell,
  TableHeader,
  TableRow,
} from '@/components/base';
import { useImpersonateSwitchMutation } from '@/lib/queries/auth';
import { useUserListQuery, type UserListItem } from '@/lib/queries/users';
import { useAuthStore } from '@/stores/auth-store';

const SEARCH_DEBOUNCE_MS = 300;

export interface ImpersonationUserSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImpersonationUserSearchModal({
  open,
  onOpenChange,
}: ImpersonationUserSearchModalProps) {
  const currentUserId = useAuthStore((s) => s.currentUser?.id);
  const impersonationActive = useAuthStore((s) => s.impersonation.active);
  const impersonatorId = useAuthStore((s) => s.impersonation.impersonator?.id);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const switchMutation = useImpersonateSwitchMutation();

  useEffect(() => {
    if (!open) {
      setSearchInput('');
      setDebouncedSearch('');
      return;
    }
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput, open]);

  const { data, isLoading, isFetching } = useUserListQuery(
    {
      search: debouncedSearch || undefined,
      isActive: 'true',
      limit: 20,
      sort: 'last_name_asc',
    },
    open && debouncedSearch.length >= 2,
  );

  const handleSelect = (user: UserListItem) => {
    void switchMutation
      .mutateAsync(user.id)
      .then(() => onOpenChange(false))
      .catch(() => undefined);
  };

  const selfId = impersonationActive ? impersonatorId : currentUserId;
  const items = (data?.items ?? []).filter((item) => item.id !== selfId);
  const showEmpty = debouncedSearch.length >= 2 && !isLoading && items.length === 0;
  const showHint = debouncedSearch.length < 2 && !isLoading;

  return (
    <Modal
      isOpen={open}
      onOpenChange={onOpenChange}
      title="Kullanıcı adına oturum aç"
      size="lg"
      footer={
        <Button color="secondary" size="sm" onPress={() => onOpenChange(false)}>
          İptal
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="relative">
          <SearchLg
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-tertiary"
            aria-hidden
          />
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Sicil, ad veya soyad ile ara…"
            aria-label="Kullanıcı ara"
            className="pl-10"
            autoFocus
          />
        </div>

        {showHint ? (
          <p className="text-sm text-text-tertiary">Aramak için en az 2 karakter girin.</p>
        ) : null}

        {isLoading || isFetching ? (
          <div role="status" aria-live="polite" aria-busy className="space-y-2">
            <span className="sr-only">Yükleniyor…</span>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-[var(--radius-md)] bg-bg-secondary"
              />
            ))}
          </div>
        ) : null}

        {showEmpty ? (
          <p className="text-sm text-text-tertiary">Arama kriterine uyan kullanıcı yok</p>
        ) : null}

        {!isLoading && items.length > 0 ? (
          <Table aria-label="Kullanıcı arama sonuçları">
            <TableHeader>
              <tr>
                <TableHeadCell>Sicil</TableHeadCell>
                <TableHeadCell>Ad Soyad</TableHeadCell>
                <TableHeadCell>Şirket</TableHeadCell>
              </tr>
            </TableHeader>
            <TableBody>
              {items.map((user) => (
                <TableRow
                  key={user.id}
                  interactive
                  className="cursor-pointer"
                  tabIndex={0}
                  aria-label={`${user.firstName} ${user.lastName} — oturum aç`}
                  onClick={() => handleSelect(user)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(user);
                    }
                  }}
                >
                  <TableCell muted>{user.sicil ?? '—'}</TableCell>
                  <TableCell>
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell muted>{user.company.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}

        {switchMutation.isPending ? (
          <p className="text-sm text-text-tertiary" role="status">
            Oturum açılıyor…
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
