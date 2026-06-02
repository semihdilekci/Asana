'use client';

import type { HTMLAttributes, ReactNode } from 'react';

import { cx, sortCx } from '@/utils/cx';

const cardStyles = sortCx({
  base: cx(
    'rounded-[var(--radius-card)] bg-bg-primary p-[var(--card-padding-inner)] shadow-card transition-[box-shadow,transform] duration-200',
  ),
  interactive: 'cursor-pointer hover:-translate-y-0.5 hover:shadow-card-hover',
  header: 'mb-4 flex items-center justify-between gap-2',
  title: 'font-display text-lg font-semibold tracking-tight text-text-primary',
  subtitle: 'text-xs text-text-tertiary',
});

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ interactive, className, children, ...props }: CardProps) {
  return (
    <div
      data-route-card=""
      className={cx(cardStyles.base, interactive && cardStyles.interactive, className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action, className, ...props }: CardHeaderProps) {
  return (
    <div className={cx(cardStyles.header, className)} {...props}>
      <div>
        <h2 className={cardStyles.title}>{title}</h2>
        {subtitle ? <p className={cardStyles.subtitle}>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
