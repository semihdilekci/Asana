'use client';

import type { HTMLAttributes, TableHTMLAttributes } from 'react';

import { cx, sortCx } from '@/utils/cx';

const tableStyles = sortCx({
  wrapper: 'overflow-hidden rounded-[var(--radius-lg)] border border-border-secondary',
  table: 'w-full border-collapse text-sm',
  head: 'bg-bg-secondary',
  headCell: 'px-4 py-3 text-left text-[11px] font-medium text-text-tertiary first:pl-4 last:pr-4',
  body: '',
});

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  'aria-label': string;
}

export function Table({ className, children, ...props }: TableProps) {
  return (
    <div className={tableStyles.wrapper}>
      <table className={cx(tableStyles.table, className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cx(tableStyles.head, className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cx(tableStyles.body, className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableHeadCell({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope="col" className={cx(tableStyles.headCell, className)} {...props}>
      {children}
    </th>
  );
}
