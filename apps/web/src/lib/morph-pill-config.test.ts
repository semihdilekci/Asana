import { describe, expect, it } from 'vitest';

import { MORPH_PILL_CONFIG } from '@/lib/morph-pill-config';

describe('MORPH_PILL_CONFIG', () => {
  it('faz süreleri pozitif ve toplamı anlamlı', () => {
    expect(MORPH_PILL_CONFIG.d1).toBeGreaterThan(0);
    const total =
      MORPH_PILL_CONFIG.d1 + MORPH_PILL_CONFIG.d2 + MORPH_PILL_CONFIG.d3 + MORPH_PILL_CONFIG.d4;
    expect(total).toBeGreaterThan(0.5);
    expect(total).toBeLessThan(1.5);
  });
});
