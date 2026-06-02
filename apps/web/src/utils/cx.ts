import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['display-xs', 'display-sm', 'display-md', 'display-lg', 'display-xl', 'display-2xl'],
    },
  },
});

type ClassValue = string | false | null | undefined;

/** Stil sınıflarını birleştirir; çakışan Tailwind utility'lerinde son değer kazanır. */
export function cx(...inputs: ClassValue[]): string {
  return twMerge(inputs.filter(Boolean).join(' '));
}

/**
 * Style object içindeki sınıfları IDE sıralaması için gruplar; runtime'da değişiklik yapmaz.
 * Untitled UI pattern — Tailwind IntelliSense object key sıralaması için.
 */
export function sortCx<
  T extends Record<
    string,
    string | number | Record<string, string | number | Record<string, string | number>>
  >,
>(classes: T): T {
  return classes;
}
