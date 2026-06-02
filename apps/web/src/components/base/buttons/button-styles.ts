import { cx, sortCx } from '@/utils/cx';

import { disabledStyles, focusRing } from '../styles';

/**
 * Untitled UI Button — https://www.untitledui.com/react/components/buttons
 * İkincil eylemler (İptal, Vazgeç, Filtreleri temizle, Çıkış, Dosya seç): color="secondary"
 */
export const buttonStyles = sortCx({
  base: cx(
    'inline-flex cursor-pointer items-center justify-center gap-2 border border-transparent font-semibold whitespace-nowrap transition-[background,color,box-shadow] duration-100 ease-linear select-none',
    focusRing,
    disabledStyles,
  ),
  size: {
    xs: 'rounded-lg px-2.5 py-1.5 text-sm',
    sm: 'rounded-lg px-3 py-2 text-sm',
    md: 'rounded-lg px-3.5 py-2.5 text-sm',
    lg: 'rounded-lg px-4 py-2.5 text-md',
    xl: 'rounded-lg px-[18px] py-3 text-md',
  },
  color: {
    primary:
      'bg-brand-600 text-white shadow-xs ring-1 ring-transparent ring-inset hover:bg-brand-700 active:scale-[0.98]',
    secondary:
      'bg-bg-primary text-text-secondary shadow-xs ring-1 ring-border-primary ring-inset hover:bg-bg-secondary hover:text-text-primary',
    destructive:
      'bg-error-600 text-white shadow-xs ring-1 ring-transparent ring-inset hover:brightness-105',
    ghost: 'bg-transparent text-text-tertiary hover:bg-bg-secondary hover:text-text-primary',
  },
});

export type ButtonColor = keyof typeof buttonStyles.color;
export type ButtonSize = keyof typeof buttonStyles.size;

export function buttonClassName(
  color: ButtonColor = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cx(buttonStyles.base, buttonStyles.size[size], buttonStyles.color[color], className);
}

/** @deprecated Eski ls-btn eşlemesi — yeni kodda doğrudan ButtonColor kullanın */
export function mapLegacyButtonColor(
  legacy: 'primary' | 'secondary' | 'neutral' | 'danger' | 'ghost',
): ButtonColor {
  if (legacy === 'neutral') return 'secondary';
  if (legacy === 'danger') return 'destructive';
  return legacy;
}
