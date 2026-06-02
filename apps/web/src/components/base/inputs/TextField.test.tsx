import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TextField } from './TextField';

describe('<TextField>', () => {
  it('etiket ve giriş alanını birlikte gösterir', () => {
    render(<TextField label="E-posta" hint="Kurumsal adres" name="email" />);
    expect(screen.getByText('E-posta')).toBeDefined();
    expect(screen.getByText('Kurumsal adres')).toBeDefined();
    expect(screen.getByRole('textbox')).toBeDefined();
  });
});
