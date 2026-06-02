'use client';

import { AlertCircle, AlertTriangle, CheckCircle, InfoCircle } from '@untitledui/icons';
import type { ReactNode } from 'react';

import { cx, sortCx } from '@/utils/cx';

const alertStyles = sortCx({
  base: 'flex gap-4 rounded-lg p-4 shadow-sm',
  variant: {
    info: 'bg-[var(--color-info-soft)] text-[var(--color-info)]',
    success: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
    warning: 'bg-[var(--color-warning-soft)] text-neutral-800',
    error: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  },
  title: 'm-0 mb-1 font-semibold',
  body: 'm-0 text-sm opacity-90',
  icon: 'mt-0.5 size-5 shrink-0',
});

export type AlertVariant = keyof typeof alertStyles.variant;

const variantIcons: Record<AlertVariant, typeof InfoCircle> = {
  info: InfoCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const Icon = variantIcons[variant];

  return (
    <div role="alert" className={cx(alertStyles.base, alertStyles.variant[variant], className)}>
      <Icon aria-hidden className={alertStyles.icon} />
      <div>
        {title ? <p className={alertStyles.title}>{title}</p> : null}
        <div className={alertStyles.body}>{children}</div>
      </div>
    </div>
  );
}
