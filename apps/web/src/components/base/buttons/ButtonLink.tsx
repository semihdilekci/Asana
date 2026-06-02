import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { buttonClassName, type ButtonColor, type ButtonSize } from './button-styles';

export interface ButtonLinkProps extends Omit<ComponentPropsWithoutRef<typeof Link>, 'className'> {
  color?: ButtonColor;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({
  color = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClassName(color, size, className)} {...props}>
      {children}
    </Link>
  );
}
