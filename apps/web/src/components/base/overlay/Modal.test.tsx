import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '../buttons/button';
import { Modal } from './Modal';

describe('<Modal>', () => {
  it('açıkken başlık ve içeriği gösterir', () => {
    render(
      <Modal
        isOpen
        onOpenChange={vi.fn()}
        title="Onay"
        footer={<Button color="primary">Tamam</Button>}
      >
        Bu işlem geri alınamaz.
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Onay')).toBeDefined();
    expect(screen.getByText('Bu işlem geri alınamaz.')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Tamam' })).toBeDefined();
  });
});
