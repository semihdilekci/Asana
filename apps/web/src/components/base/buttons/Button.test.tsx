import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './button';

describe('<Button>', () => {
  it('birincil eylem olarak render edilir', () => {
    render(<Button color="primary">Kaydet</Button>);
    const btn = screen.getByRole('button', { name: 'Kaydet' });
    expect(btn.className).toContain('bg-brand-600');
  });

  it('secondary varyantı Untitled UI yüzeyini uygular', () => {
    render(
      <Button color="secondary" size="sm">
        Filtreleri temizle
      </Button>,
    );
    const btn = screen.getByRole('button', { name: 'Filtreleri temizle' });
    expect(btn.className).toContain('bg-bg-primary');
    expect(btn.className).toContain('ring-border-primary');
    expect(btn.className).toContain('text-text-secondary');
  });

  it('destructive varyantı uygular', () => {
    render(
      <Button color="destructive" isDisabled>
        Sil
      </Button>,
    );
    const btn = screen.getByRole('button', { name: 'Sil' });
    expect(btn).toHaveProperty('disabled', true);
    expect(btn.className).toContain('bg-error-600');
  });
});
