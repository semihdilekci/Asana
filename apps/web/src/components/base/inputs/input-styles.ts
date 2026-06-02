import { cx, sortCx } from '@/utils/cx';

import { disabledStyles, focusRing } from '../styles';

export const inputStyles = sortCx({
  base: cx(
    'w-full rounded-md border border-transparent bg-bg-primary px-4 text-sm text-text-primary shadow-sm',
    'placeholder:text-text-quaternary',
    'hover:shadow-md',
    'data-[invalid]:border-error-600 data-[invalid]:shadow-[0_0_0_3px_var(--color-danger-soft)]',
    focusRing,
    disabledStyles,
  ),
  size: {
    sm: 'h-[30px] text-xs',
    md: 'h-10',
    lg: 'h-[46px] text-md',
  },
});

export type InputFieldSize = keyof typeof inputStyles.size;

/** RHF / native `<input>` / `<select>` için paylaşılan sınıflar */
export function inputClassName(fieldSize: InputFieldSize = 'md', className?: string): string {
  return cx(inputStyles.base, inputStyles.size[fieldSize], className);
}
