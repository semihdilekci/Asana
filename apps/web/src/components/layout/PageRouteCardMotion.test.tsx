import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PageRouteCardMotion } from './PageRouteCardMotion';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

describe('PageRouteCardMotion', () => {
  it('içeriği sarmalayıcı ile render eder', () => {
    render(
      <PageRouteCardMotion>
        <div className="ls-card">Kart</div>
      </PageRouteCardMotion>,
    );

    expect(screen.getByText('Kart')).toBeTruthy();
    const wrap = document.querySelector('.page-route-card-motion');
    expect(wrap).not.toBeNull();
    expect(wrap?.classList.contains('w-full')).toBe(true);
  });
});
