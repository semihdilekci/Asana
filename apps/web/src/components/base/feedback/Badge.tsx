'use client';

import type { HTMLAttributes } from 'react';

import { cx, sortCx } from '@/utils/cx';

const badgeStyles = sortCx({
  base: 'inline-flex items-center justify-center rounded-full font-bold leading-none',
  size: {
    sm: 'min-h-[18px] px-1.5 text-[10px]',
    md: 'min-h-5 px-2 text-xs',
  },
  color: {
    brand: 'bg-brand-50 text-brand-700',
    success: 'bg-success-50 text-success-700',
    warning: 'bg-warning-50 text-warning-900',
    error: 'bg-error-50 text-error-700',
    neutral: 'bg-neutral-200 text-neutral-700',
  },
});

export type BadgeColor = keyof typeof badgeStyles.color;
export type BadgeSize = keyof typeof badgeStyles.size;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  size?: BadgeSize;
  dot?: boolean;
}

export function Badge({
  color = 'brand',
  size = 'sm',
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cx(
        badgeStyles.base,
        badgeStyles.size[size],
        badgeStyles.color[color],
        dot && 'size-2 min-h-0 min-w-2 p-0',
        className,
      )}
      {...props}
    >
      {dot ? null : children}
    </span>
  );
}
