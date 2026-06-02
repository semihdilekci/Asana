/**
 * Dikey sidebar + yatay segment morph pill ortak süre / squash parametreleri.
 * Ayar: application/AppSidebarNav ve HorizontalMorphSegmented aynı dosyayı import eder.
 */
export const MORPH_PILL_CONFIG = {
  squashY: 0.8,
  squashX: 0.88,
  bridge: 0.82,
  overshoot: 1,
  d1: 0.14,
  d2: 0.28,
  d3: 0.36,
  d4: 0.22,
} as const;
