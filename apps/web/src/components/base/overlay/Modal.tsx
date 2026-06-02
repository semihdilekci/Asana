'use client';

import type { ReactNode } from 'react';
import {
  Dialog,
  Heading,
  Modal as AriaModal,
  ModalOverlay,
  type ModalOverlayProps,
} from 'react-aria-components';

import { cx, sortCx } from '@/utils/cx';

const modalStyles = sortCx({
  overlay:
    'fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-neutral-900/40 p-5 backdrop-blur-sm',
  modal: cx(
    'max-h-[calc(100vh-2.5rem)] w-full overflow-auto rounded-xl border-none bg-bg-primary p-6 shadow-xl outline-none',
    'entering:animate-in entering:fade-in entering:zoom-in-95 exiting:animate-out exiting:fade-out exiting:zoom-out-95',
  ),
  size: {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  },
  title: 'font-display text-xl font-bold text-text-primary',
  body: 'mt-3 text-sm text-text-tertiary',
  footer: 'mt-6 flex justify-end gap-2',
});

export type ModalSize = keyof typeof modalStyles.size;

export interface ModalProps extends Omit<ModalOverlayProps, 'children' | 'className'> {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  className?: string;
}

export function Modal({
  title,
  children,
  footer,
  size = 'md',
  className,
  ...overlayProps
}: ModalProps) {
  return (
    <ModalOverlay className={modalStyles.overlay} {...overlayProps}>
      <AriaModal className={cx(modalStyles.modal, modalStyles.size[size], className)}>
        <Dialog className="outline-none">
          <Heading slot="title" className={modalStyles.title}>
            {title}
          </Heading>
          <div className={modalStyles.body}>{children}</div>
          {footer ? <div className={modalStyles.footer}>{footer}</div> : null}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
}
