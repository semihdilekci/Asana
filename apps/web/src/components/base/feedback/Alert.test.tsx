import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Alert } from './Alert';

describe('<Alert>', () => {
  it('hata uyarısı role=alert ile render edilir', () => {
    render(
      <Alert variant="error" title="Kayıt başarısız">
        Lütfen alanları kontrol edin.
      </Alert>,
    );
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Kayıt başarısız');
    expect(alert.textContent).toContain('Lütfen alanları kontrol edin.');
  });
});
