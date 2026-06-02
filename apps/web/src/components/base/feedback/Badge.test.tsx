import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './Badge';

describe('<Badge>', () => {
  it('marka rengi ile sayaç gösterir', () => {
    render(<Badge color="brand">3</Badge>);
    const badge = screen.getByText('3');
    expect(badge.className).toContain('bg-brand-50');
    expect(badge.className).toContain('text-brand-700');
  });
});
