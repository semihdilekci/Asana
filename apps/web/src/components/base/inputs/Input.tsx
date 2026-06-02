'use client';

import { Input as AriaInput, type InputProps as AriaInputProps } from 'react-aria-components';

import { inputClassName, type InputFieldSize } from './input-styles';

export type { InputFieldSize };

export interface InputProps extends Omit<AriaInputProps, 'size' | 'className'> {
  fieldSize?: InputFieldSize;
  className?: string;
}

export function Input({ fieldSize = 'md', className, ...props }: InputProps) {
  return <AriaInput className={inputClassName(fieldSize, className)} {...props} />;
}
