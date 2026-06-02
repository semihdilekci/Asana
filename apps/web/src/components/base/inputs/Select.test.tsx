import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Select } from './Select';

describe('<Select>', () => {
  it('etiketli combobox render eder', () => {
    render(
      <Select
        label="Durum"
        options={[
          { id: 'active', label: 'Aktif' },
          { id: 'inactive', label: 'Pasif' },
        ]}
      />,
    );
    expect(screen.getByText('Durum')).toBeDefined();
    expect(screen.getByRole('button', { name: /durum/i })).toBeDefined();
  });
});
