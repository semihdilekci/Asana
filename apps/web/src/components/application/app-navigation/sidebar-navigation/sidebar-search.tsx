'use client';

import { SearchLg } from '@untitledui/icons';

import { focusRing } from '@/components/base/styles';
import { cx } from '@/utils/cx';

export interface SidebarSearchProps {
  className?: string;
  placeholder?: string;
  onFocus?: () => void;
}

/** Untitled UI sidebar üst arama alanı (⌘K ipucu — komut paleti ileride bağlanabilir) */
export function SidebarSearch({ className, placeholder = 'Ara', onFocus }: SidebarSearchProps) {
  return (
    <div className={cx('relative', className)}>
      <SearchLg
        className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-text-quaternary"
        aria-hidden
      />
      <input
        type="search"
        readOnly
        placeholder={placeholder}
        onFocus={onFocus}
        className={cx(
          'w-full rounded-lg border border-border-secondary bg-bg-primary py-2 pr-14 pl-10 text-sm text-text-primary shadow-xs',
          'placeholder:text-text-placeholder',
          focusRing,
        )}
        aria-label={placeholder}
      />
      <kbd
        className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border border-border-secondary bg-bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-medium text-text-quaternary sm:inline"
        aria-hidden
      >
        ⌘K
      </kbd>
    </div>
  );
}
