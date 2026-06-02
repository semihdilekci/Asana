import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card, CardHeader } from './Card';

describe('<Card>', () => {
  it('başlık ve içerik ile kart render eder', () => {
    render(
      <Card>
        <CardHeader title="Özet" subtitle="Son 30 gün" />
        <p>12 süreç</p>
      </Card>,
    );
    expect(screen.getByText('Özet')).toBeDefined();
    expect(screen.getByText('Son 30 gün')).toBeDefined();
    expect(screen.getByText('12 süreç')).toBeDefined();
  });

  it('interactive sınıfı hover geçişi için uygular', () => {
    const { container } = render(<Card interactive>içerik</Card>);
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain('hover:-translate-y-0.5');
  });
});
