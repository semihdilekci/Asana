'use client';

import type { ReactNode } from 'react';
import {
  FieldError,
  Label,
  Text,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';

import { cx, sortCx } from '@/utils/cx';

import { Input, type InputProps } from './Input';

const fieldStyles = sortCx({
  root: 'flex flex-col gap-1.5',
  label: 'text-xs font-semibold text-text-tertiary tracking-wide',
  hint: 'text-xs text-text-tertiary',
  error: 'flex items-center gap-1.5 text-xs text-error-600',
});

export interface TextFieldProps extends Omit<AriaTextFieldProps, 'className' | 'children'> {
  label: string;
  hint?: string;
  inputSize?: InputProps['fieldSize'];
  inputClassName?: string;
  className?: string;
  children?: ReactNode;
}

export function TextField({
  label,
  hint,
  inputSize,
  inputClassName,
  className,
  children,
  ...props
}: TextFieldProps) {
  return (
    <AriaTextField className={cx(fieldStyles.root, className)} {...props}>
      <Label className={fieldStyles.label}>{label}</Label>
      {children ?? <Input fieldSize={inputSize} className={inputClassName} />}
      {hint ? (
        <Text slot="description" className={fieldStyles.hint}>
          {hint}
        </Text>
      ) : null}
      <FieldError className={fieldStyles.error} />
    </AriaTextField>
  );
}
