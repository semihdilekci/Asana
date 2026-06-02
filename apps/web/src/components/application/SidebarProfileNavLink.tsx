'use client';

import { ChevronSelectorVertical } from '@untitledui/icons';
import Link from 'next/link';

import { UserAvatar } from '@/components/profile/UserAvatar';
import { useAuthStore } from '@/stores/auth-store';
import { cx } from '@/utils/cx';

import { focusRing } from '@/components/base/styles';

/** Sidebar alt — Untitled UI account kartı */
export function SidebarProfileNavLink({
  onNavigate,
  compact,
}: {
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const user = useAuthStore((s) => s.currentUser);
  if (!user) return null;

  return (
    <Link
      href="/profile"
      onClick={onNavigate}
      className={cx(
        'flex items-center gap-3 rounded-xl border border-border-secondary bg-bg-primary p-3 text-sm transition-colors hover:bg-bg-secondary',
        focusRing,
        compact && 'min-h-11',
      )}
    >
      <span className="relative shrink-0">
        <UserAvatar avatarKey={user.avatarKey} size={compact ? 40 : 40} />
        <span
          className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-bg-primary bg-success-500"
          aria-hidden
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-text-primary">
          {user.firstName} {user.lastName}
        </span>
        {user.email ? (
          <span className="block truncate text-xs text-text-tertiary">{user.email}</span>
        ) : null}
      </span>
      <ChevronSelectorVertical className="size-4 shrink-0 text-text-quaternary" aria-hidden />
    </Link>
  );
}
