import { describe, expect, it } from 'vitest';

import { cx, sortCx } from './cx';

describe('cx', () => {
  it('çakışan padding sınıflarında son değeri korur', () => {
    expect(cx('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('false değerleri yok sayar', () => {
    expect(cx('text-sm', false, undefined, 'font-medium')).toBe('text-sm font-medium');
  });

  it('birden fazla sınıfı birleştirir', () => {
    expect(cx('text-sm', 'font-medium', 'text-text-primary')).toBe(
      'text-sm font-medium text-text-primary',
    );
  });
});

describe('sortCx', () => {
  it('girdi nesnesini olduğu gibi döner', () => {
    const styles = sortCx({
      root: 'flex gap-2',
      active: 'bg-brand-600',
    });
    expect(styles.root).toBe('flex gap-2');
    expect(styles.active).toBe('bg-brand-600');
  });
});
