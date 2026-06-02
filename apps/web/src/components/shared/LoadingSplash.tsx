'use client';

import { useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

import { Card } from '@/components/base';
import { ElectricBorder } from '@/components/ui/ElectricBorder';

const ELECTRIC_COLOR = '#7df9ff';
const BORDER_RADIUS = 16;

export type LoadingSplashVariant = 'fullscreen' | 'card' | 'compact';

export interface LoadingSplashProps {
  message?: string;
  srLabel?: string;
  variant?: LoadingSplashVariant;
  className?: string;
}

function SplashContent({ message, srLabel }: { message: string; srLabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-[var(--space-2)] px-[var(--space-6)] py-[var(--space-7)] text-center">
      <span className="sr-only">{srLabel ?? message}</span>
      <p
        className="text-sm font-medium tracking-wide text-[var(--color-neutral-700)] motion-safe:animate-pulse"
        aria-hidden
      >
        {message}
      </p>
    </div>
  );
}

function SplashFrame({ children, animated }: { children: ReactNode; animated: boolean }) {
  if (!animated) {
    return (
      <div
        className="rounded-[var(--radius-lg)] border-2 bg-[var(--color-surface-0)] shadow-[var(--shadow-sm)]"
        style={{ borderRadius: BORDER_RADIUS, borderColor: ELECTRIC_COLOR }}
      >
        {children}
      </div>
    );
  }

  return (
    <ElectricBorder
      color={ELECTRIC_COLOR}
      speed={1}
      chaos={0.1}
      borderRadius={BORDER_RADIUS}
      style={{ borderRadius: BORDER_RADIUS, width: '100%' }}
    >
      <div
        className="rounded-[var(--radius-lg)] bg-[var(--color-surface-0)]/95 backdrop-blur-[2px]"
        style={{ borderRadius: BORDER_RADIUS }}
      >
        {children}
      </div>
    </ElectricBorder>
  );
}

export function LoadingSplash({
  message = 'Yükleniyor…',
  srLabel,
  variant = 'card',
  className = '',
}: LoadingSplashProps) {
  const prefersReducedMotion = useReducedMotion();
  const animated = !prefersReducedMotion;

  const frame = (
    <SplashFrame animated={animated}>
      <SplashContent message={message} srLabel={srLabel} />
    </SplashFrame>
  );

  if (variant === 'fullscreen') {
    return (
      <div
        className={`flex min-h-screen w-full items-center justify-center bg-[var(--color-neutral-50)] ${className}`}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="w-full max-w-sm px-[var(--space-5)]">{frame}</div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`max-w-md ${className}`} role="status" aria-live="polite" aria-busy="true">
        {frame}
      </div>
    );
  }

  return (
    <Card
      className={`overflow-visible p-[var(--space-2)] shadow-[var(--shadow-md)] ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {frame}
    </Card>
  );
}
