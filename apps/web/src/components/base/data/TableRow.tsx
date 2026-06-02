'use client';

import type { HTMLAttributes, TdHTMLAttributes } from 'react';

import { cx, sortCx } from '@/utils/cx';

const rowStyles = sortCx({
  row: 'transition-colors hover:bg-brand-600/4',
  cell: 'border-b border-border-secondary px-4 py-4 text-text-primary last:border-b-0',
  cellMuted: 'font-mono text-xs text-text-tertiary',
});

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  interactive?: boolean;
}

export function TableRow({ className, interactive = true, ...props }: TableRowProps) {
  return <tr className={cx(interactive && rowStyles.row, className)} {...props} />;
}

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  muted?: boolean;
}

export function TableCell({ className, muted, ...props }: TableCellProps) {
  return <td className={cx(rowStyles.cell, muted && rowStyles.cellMuted, className)} {...props} />;
}
