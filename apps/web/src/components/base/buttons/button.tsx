'use client';

import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';

import { buttonClassName, type ButtonColor, type ButtonSize } from './button-styles';

export type { ButtonColor, ButtonSize };

export interface ButtonProps extends Omit<AriaButtonProps, 'className'> {
  color?: ButtonColor;
  size?: ButtonSize;
  className?: string;
}

export function Button({
  color = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <AriaButton className={buttonClassName(color, size, className)} {...props}>
      {children}
    </AriaButton>
  );
}
