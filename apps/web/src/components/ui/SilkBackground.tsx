'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, type CSSProperties } from 'react';

import { cx } from '@/utils/cx';

import type { SilkProps } from './Silk';

const Silk = dynamic(() => import('./Silk').then((m) => ({ default: m.Silk })), {
  ssr: false,
});

export type SilkBackgroundProps = Omit<SilkProps, 'className' | 'style'> & {
  className?: string;
  style?: CSSProperties;
};

/** Kart/hero arka planı — SSR güvenli, reduced-motion'da statik gradient yeter */
export function SilkBackground({ className, style, ...silkProps }: SilkBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  const [allowMotion, setAllowMotion] = useState(true);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setAllowMotion(!mq.matches);
    const onChange = () => setAllowMotion(!mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (!mounted || !allowMotion) {
    return null;
  }

  return (
    <div
      className={cx('pointer-events-none absolute inset-0 z-0 overflow-hidden', className)}
      style={style}
      aria-hidden
    >
      <Silk {...silkProps} />
    </div>
  );
}
