'use client';

import { useEffect, useState } from 'react';

const screens = {
  xxs: '320px',
  xs: '600px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export type BreakpointKey = keyof typeof screens;

/**
 * Verilen Tailwind viewport genişliğinin uygulanıp uygulanmadığını döner (min-width).
 * SSR'da `false` — hidrasyon uyumsuzluğunu önler.
 */
export function useBreakpoint(size: BreakpointKey): boolean {
  const query = `(min-width: ${screens[size]})`;

  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const breakpoint = window.matchMedia(query);
    setMatches(breakpoint.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    breakpoint.addEventListener('change', handleChange);
    return () => breakpoint.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}
