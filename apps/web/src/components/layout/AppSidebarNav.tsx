'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Permission } from '@leanmgmt/shared-types';

import { isNavActive } from '@/lib/app-sidebar-nav';
import { MORPH_PILL_CONFIG } from '@/lib/morph-pill-config';
import { useAuthStore } from '@/stores/auth-store';

type NavEntry = {
  href: string;
  label: string;
  permission?: Permission;
  anyOf?: Permission[];
};

const ALL_NAV: NavEntry[] = [
  { href: '/dashboard', label: 'Ana Sayfa' },
  { href: '/processes', label: 'Süreçler' },
  { href: '/tasks', label: 'Görevlerim' },
  { href: '/users', label: 'Kullanıcılar', permission: Permission.USER_LIST_VIEW },
  {
    href: '/master-data',
    label: 'Master Data',
    anyOf: [Permission.MASTER_DATA_VIEW, Permission.MASTER_DATA_MANAGE],
  },
  { href: '/roles', label: 'Roller', permission: Permission.ROLE_VIEW },
  {
    href: '/settings/notifications',
    label: 'Bildirim ayarları',
    permission: Permission.NOTIFICATION_READ,
  },
  {
    href: '/admin',
    label: 'Yönetim',
    anyOf: [
      Permission.AUDIT_LOG_VIEW,
      Permission.SYSTEM_SETTINGS_VIEW,
      Permission.SYSTEM_SETTINGS_EDIT,
      Permission.CONSENT_VERSION_VIEW,
      Permission.CONSENT_VERSION_EDIT,
      Permission.CONSENT_VERSION_PUBLISH,
      Permission.EMAIL_TEMPLATE_VIEW,
    ],
  },
];

function navLinkClass(active: boolean): string {
  if (active) {
    return [
      'ls-sidebar-nav-link ls-sidebar-nav-link--active',
      'flex items-center gap-[var(--space-4)] rounded-[var(--radius-md)] px-[var(--space-6)] py-[var(--space-5)] text-[var(--text-sm)] font-medium',
      'transition-[color] duration-[var(--dur-medium)]',
    ].join(' ');
  }
  return [
    'ls-sidebar-nav-link',
    'flex items-center gap-[var(--space-4)] rounded-[var(--radius-md)] px-[var(--space-6)] py-[var(--space-5)] text-[var(--text-sm)] font-medium text-[var(--color-sidebar-nav-idle)]',
    'transition-all duration-[var(--dur-medium)] hover:bg-[var(--color-hover)]',
  ].join(' ');
}

type NavGeometry = { tops: number[]; heights: number[] };

export type AppSidebarNavProps = {
  onNavigate?: () => void;
};

export function AppSidebarNav({ onNavigate }: AppSidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const permissionKey = useAuthStore((s) => (s.currentUser?.permissions ?? []).join('|'));

  const visible = useMemo(() => {
    const raw = useAuthStore.getState().currentUser?.permissions ?? [];
    const set = new Set(raw as Permission[]);
    return ALL_NAV.filter((item) => {
      if (item.permission) return set.has(item.permission);
      if (item.anyOf?.length) return item.anyOf.some((p) => set.has(p));
      return true;
    });
  }, [permissionKey]);

  const visibleKey = visible.map((v) => v.href).join('|');
  const activeIndex = visible.findIndex((item) => isNavActive(pathname, item.href));

  const navRef = useRef<HTMLElement>(null);
  const [geometry, setGeometry] = useState<NavGeometry | null>(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const measure = () => {
      const anchors = [...nav.querySelectorAll<HTMLAnchorElement>('[data-app-sidebar-link]')];
      if (anchors.length !== visible.length) return;
      setGeometry({
        tops: anchors.map((a) => a.offsetTop),
        heights: anchors.map((a) => a.offsetHeight),
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [visible.length, visibleKey, pathname]);

  const prevIndexRef = useRef(-1);
  const [, forceUpdate] = useState(0);

  const fromIdx = prevIndexRef.current;
  const toIdx = activeIndex;

  const totalDuration =
    MORPH_PILL_CONFIG.d1 + MORPH_PILL_CONFIG.d2 + MORPH_PILL_CONFIG.d3 + MORPH_PILL_CONFIG.d4;

  const pillAnimate = useMemo(() => {
    if (!geometry || toIdx < 0 || !geometry.heights[toIdx]) {
      return {
        opacity: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        transition: { duration: 0.16, ease: 'easeOut' as const },
      };
    }

    const toTop = geometry.tops[toIdx]!;

    if (prefersReducedMotion || fromIdx < 0 || fromIdx === toIdx) {
      return {
        opacity: 1,
        y: toTop,
        scaleX: 1,
        scaleY: 1,
        transition: { duration: 0.2, ease: 'easeOut' as const },
      };
    }

    const fromTop = geometry.tops[fromIdx]!;
    const fromH = Math.max(geometry.heights[fromIdx]!, 1);
    const direction = toTop > fromTop ? 1 : -1;
    const bridgeY = direction > 0 ? fromTop : toTop;
    const pixelSpan = Math.abs(toTop - fromTop);
    const stretchScaleY = (pixelSpan + fromH) / fromH;

    return {
      opacity: 1,
      y: [fromTop, fromTop, bridgeY, toTop, toTop],
      scaleX: [
        1,
        MORPH_PILL_CONFIG.squashX,
        MORPH_PILL_CONFIG.bridge,
        MORPH_PILL_CONFIG.overshoot,
        1,
      ],
      scaleY: [1, MORPH_PILL_CONFIG.squashY, stretchScaleY, MORPH_PILL_CONFIG.overshoot, 1],
      transformOrigin: direction > 0 ? ('top center' as const) : ('bottom center' as const),
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

  const pillHeight = geometry && toIdx >= 0 ? (geometry.heights[toIdx] ?? 44) : 44;

  return (
    <nav
      ref={navRef}
      aria-label="Ana menü"
      className="ls-sidebar-nav-with-morph-pill relative flex flex-col gap-[var(--space-2)] px-[var(--space-5)] pb-[var(--space-6)]"
    >
      <motion.div
        aria-hidden
        className="ls-sidebar-nav-morph-pill z-0"
        style={{ height: pillHeight }}
        initial={false}
        animate={pillAnimate}
      />
      {visible.map((item, idx) => {
        const active = idx === activeIndex;
        return (
          <Link
            key={item.href}
            href={item.href}
            data-app-sidebar-link
            className={`relative z-10 ${navLinkClass(active)}`}
            scroll={false}
            onClick={(e) => {
              if (idx === activeIndex) {
                onNavigate?.();
                return;
              }
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                return;
              }
              e.preventDefault();
              prevIndexRef.current = activeIndex;
              router.push(item.href);
              onNavigate?.();
              forceUpdate((n) => n + 1);
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
