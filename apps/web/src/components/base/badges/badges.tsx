'use client';

import type { HTMLAttributes, ReactNode } from 'react';

import { cx, sortCx } from '@/utils/cx';

const badgeWithDotStyles = sortCx({
  base: 'inline-flex items-center gap-1.5 font-medium',
  type: {
    modern: 'rounded-md border border-border-secondary bg-bg-primary shadow-xs',
    pill: 'rounded-full',
  },
  size: {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
  },
  dotColor: {
    success: 'bg-success-500',
    brand: 'bg-brand-500',
    warning: 'bg-warning-500',
    error: 'bg-error-600',
    neutral: 'bg-neutral-400',
  },
  textColor: {
    success: 'text-success-700',
    brand: 'text-brand-700',
    warning: 'text-warning-900',
    error: 'text-error-700',
    neutral: 'text-text-tertiary',
  },
});

export type BadgeWithDotColor = keyof typeof badgeWithDotStyles.dotColor;
export type BadgeWithDotType = keyof typeof badgeWithDotStyles.type;
export type BadgeWithDotSize = keyof typeof badgeWithDotStyles.size;

export interface BadgeWithDotProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeWithDotColor;
  type?: BadgeWithDotType;
  size?: BadgeWithDotSize;
  children: ReactNode;
}

/** Untitled UI — modern badge + durum noktası */
export function BadgeWithDot({
  color = 'success',
  type = 'modern',
  size = 'sm',
  className,
  children,
  ...props
}: BadgeWithDotProps) {
  return (
    <span
      className={cx(
        badgeWithDotStyles.base,
        badgeWithDotStyles.type[type],
        badgeWithDotStyles.size[size],
        badgeWithDotStyles.textColor[color],
        className,
      )}
      {...props}
    >
      <span
        className={cx('size-1.5 shrink-0 rounded-full', badgeWithDotStyles.dotColor[color])}
        aria-hidden
      />
      {children}
    </span>
  );
}
