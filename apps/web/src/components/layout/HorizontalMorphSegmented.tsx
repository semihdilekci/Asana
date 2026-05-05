'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { MORPH_PILL_CONFIG } from '@/lib/morph-pill-config';

export type MorphSegmentItem = { value: string; label: string };

export type HorizontalMorphSegmentedDensity = 'default' | 'compact';

export type HorizontalMorphSegmentedProps = {
  items: MorphSegmentItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
  /** compact = ls-btn--sm ile aynı min-height / padding (görev listesi üst sekmeleri) */
  density?: HorizontalMorphSegmentedDensity;
};

type Geom = { lefts: number[]; widths: number[]; heights: number[] };

const DENSITY_TAB_CLASS: Record<HorizontalMorphSegmentedDensity, string> = {
  default:
    'rounded-[var(--radius-sm)] px-[var(--space-6)] py-[var(--space-4)] text-sm font-medium leading-snug',
  compact: 'ls-morph-segment-tab--btn-sm',
};

function tabButtonClass(active: boolean, density: HorizontalMorphSegmentedDensity): string {
  const base = `relative z-10 ${DENSITY_TAB_CLASS[density]} transition-[color] duration-[var(--dur-medium)]`;
  if (active) {
    return `${base} bg-transparent text-[var(--color-primary-800)]`;
  }
  return `${base} text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)]`;
}

export function HorizontalMorphSegmented({
  items,
  value,
  onChange,
  ariaLabel,
  className,
  density = 'default',
}: HorizontalMorphSegmentedProps) {
  const prefersReducedMotion = useReducedMotion();
  const navRef = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState<Geom | null>(null);
  const itemsKey = items.map((i) => i.value).join('|');

  const activeIndex = items.findIndex((i) => i.value === value);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const measure = () => {
      const els = [...nav.querySelectorAll<HTMLButtonElement>('[data-morph-segment-tab]')];
      if (els.length !== items.length) return;
      setGeometry({
        lefts: els.map((el) => el.offsetLeft),
        widths: els.map((el) => el.offsetWidth),
        heights: els.map((el) => el.offsetHeight),
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [items.length, itemsKey, value, density]);

  const prevIndexRef = useRef(-1);
  const [, forceUpdate] = useState(0);

  const fromIdx = prevIndexRef.current;
  const toIdx = activeIndex;

  const totalDuration =
    MORPH_PILL_CONFIG.d1 + MORPH_PILL_CONFIG.d2 + MORPH_PILL_CONFIG.d3 + MORPH_PILL_CONFIG.d4;

  const pillAnimate = useMemo(() => {
    if (!geometry || toIdx < 0 || !geometry.widths[toIdx]) {
      return {
        opacity: 0,
        x: 0,
        scaleX: 1,
        scaleY: 1,
        transition: { duration: 0.16, ease: 'easeOut' as const },
      };
    }

    const toLeft = geometry.lefts[toIdx]!;

    if (prefersReducedMotion || fromIdx < 0 || fromIdx === toIdx) {
      return {
        opacity: 1,
        x: toLeft,
        scaleX: 1,
        scaleY: 1,
        transition: { duration: 0.2, ease: 'easeOut' as const },
      };
    }

    const fromLeft = geometry.lefts[fromIdx]!;
    const fromW = Math.max(geometry.widths[fromIdx]!, 1);
    const direction = toLeft > fromLeft ? 1 : -1;
    const bridgeX = direction > 0 ? fromLeft : toLeft;
    const pixelSpan = Math.abs(toLeft - fromLeft);
    const stretchScaleX = (pixelSpan + fromW) / fromW;

    return {
      opacity: 1,
      x: [fromLeft, fromLeft, bridgeX, toLeft, toLeft],
      scaleY: [
        1,
        MORPH_PILL_CONFIG.squashX,
        MORPH_PILL_CONFIG.bridge,
        MORPH_PILL_CONFIG.overshoot,
        1,
      ],
      scaleX: [1, MORPH_PILL_CONFIG.squashY, stretchScaleX, MORPH_PILL_CONFIG.overshoot, 1],
      transformOrigin: direction > 0 ? ('left center' as const) : ('right center' as const),
      transition: {
        duration: totalDuration,
        times: [
          0,
          MORPH_PILL_CONFIG.d1 / totalDuration,
          (MORPH_PILL_CONFIG.d1 + MORPH_PILL_CONFIG.d2) / totalDuration,
          (MORPH_PILL_CONFIG.d1 + MORPH_PILL_CONFIG.d2 + MORPH_PILL_CONFIG.d3) / totalDuration,
          1,
        ],
        ease: [
          [0.4, 0, 0.6, 1],
          [0.55, 0, 0.1, 1],
          [0.34, 1.56, 0.64, 1],
          [0.4, 0, 0.2, 1],
        ] as const,
      },
    };
  }, [geometry, fromIdx, toIdx, prefersReducedMotion, totalDuration]);

  const pillWidth = geometry && toIdx >= 0 ? (geometry.widths[toIdx] ?? 1) : 1;
  const pillHeight = geometry && toIdx >= 0 ? (geometry.heights[toIdx] ?? 32) : 32;

  return (
    <div
      ref={navRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`ls-morph-segment-track relative inline-flex flex-nowrap items-stretch gap-[var(--space-2)] ${className ?? ''}`}
    >
      <motion.div
        aria-hidden
        className="ls-morph-segment-pill z-0"
        style={{ width: pillWidth, height: pillHeight }}
        initial={false}
        animate={pillAnimate}
      />
      {items.map((item, idx) => {
        const active = idx === activeIndex;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            data-morph-segment-tab
            aria-selected={active}
            id={`morph-segment-${item.value}`}
            className={tabButtonClass(active, density)}
            onClick={() => {
              if (idx === activeIndex) return;
              prevIndexRef.current = activeIndex;
              onChange(item.value);
              forceUpdate((n) => n + 1);
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
