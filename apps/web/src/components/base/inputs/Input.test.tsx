import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Input } from './Input';

describe('<Input>', () => {
  it('aria-label ile erişilebilir metin kutusu render eder', () => {
    render(<Input aria-label="Sicil" placeholder="12345678" />);
    const field = screen.getByRole('textbox', { name: 'Sicil' });
    expect(field.getAttribute('placeholder')).toBe('12345678');
    expect(field.className).toContain('rounded-md');
  });
});
