'use client';

import { useEffect, useRef } from 'react';

import Image from 'next/image';

import { STEP_LABEL_MAP } from '@/lib/step-labels';
import { useDocumentDownloadUrlQuery } from '@/lib/queries/documents';
import type { ProcessTaskItem } from '@/lib/queries/processes';

interface KtiFormPayload {
  companyId?: string;
  companyName?: string;
  description?: string;
  savingAmount?: number;
  beforePhotoDocumentIds?: string[];
  afterPhotoDocumentIds?: string[];
}

function parseFormPayload(data: unknown): KtiFormPayload | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  return data as KtiFormPayload;
}

function DocumentCard({ documentId, label }: { documentId: string; label: string }) {
  const { data: url, isLoading, isError } = useDocumentDownloadUrlQuery(documentId, true);

  if (isLoading) {
    return (
      <div className="flex h-28 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-neutral-100)] text-xs text-[var(--color-neutral-500)]">
        Yükleniyor…
      </div>
    );
  }

  if (isError || !url) {
    return (
      <div className="flex h-28 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] text-xs text-[var(--color-danger-600)]">
        Önizleme alınamadı
      </div>
    );
  }

  const lower = url.toLowerCase();
  const isImage =
    lower.includes('.jpg') ||
    lower.includes('.jpeg') ||
    lower.includes('.png') ||
    lower.includes('.webp') ||
    lower.includes('image/');

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] transition-colors hover:border-[var(--color-primary-400)]"
      title={`${label} — indir / aç`}
    >
      {isImage ? (
        <Image
          src={url}
          alt={label}
          width={320}
          height={200}
          unoptimized
          className="h-32 w-full object-cover"
        />
      ) : (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-[var(--color-neutral-500)]">
          {/* Dosya ikonu */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <span className="text-xs">Dosya</span>
        </div>
      )}
      <div className="border-t border-[var(--color-neutral-200)] bg-[var(--color-neutral-0)] px-[var(--space-2)] py-[var(--space-1)]">
        <span className="text-xs font-medium text-[var(--color-primary-700)] group-hover:underline">
          ↓ İndir / Aç
        </span>
      </div>
    </a>
  );
}

export interface KtiFormDataModalProps {
  task: ProcessTaskItem;
  onClose: () => void;
}

export function KtiFormDataModal({ task, onClose }: KtiFormDataModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    // Cleanup'ta el.close() çağırmıyoruz: React Strict Mode cleanup → close() event
    // → onClose → parent unmount → modal hiç görünmez.
    if (el && !el.open) el.showModal();
  }, []);

  const payload = parseFormPayload(task.formData);
  const stepDisplayLabel = STEP_LABEL_MAP[task.stepKey] ?? task.stepKey;

  return (
    <dialog
      ref={ref}
      className="max-h-[90vh] w-[min(100vw-2rem,42rem)] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--color-neutral-0)] p-[var(--space-5)] shadow-lg backdrop:bg-black/40"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <h2 className="text-lg font-semibold text-[var(--color-neutral-900)]">
        {stepDisplayLabel} — Form Detayı
      </h2>
      <p className="mt-1 text-xs text-[var(--color-neutral-500)]">Salt okunur görünüm</p>

      {payload ? (
        <div className="mt-[var(--space-5)] space-y-[var(--space-5)]">
          {/* Şirket */}
          {payload.companyName ? (
            <div>
              <p className="mb-[var(--space-1)] text-sm font-medium text-[var(--color-neutral-900)]">
                Şirket
              </p>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] px-[var(--space-3)] py-[var(--space-2)] text-sm text-[var(--color-neutral-800)]">
                {payload.companyName}
              </div>
            </div>
          ) : null}

          {/* Açıklama */}
          {payload.description !== undefined ? (
            <div>
              <p className="mb-[var(--space-1)] text-sm font-medium text-[var(--color-neutral-900)]">
                Açıklama
              </p>
              <div className="min-h-[6rem] rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] px-[var(--space-3)] py-[var(--space-2)] text-sm whitespace-pre-wrap text-[var(--color-neutral-800)]">
                {payload.description}
              </div>
            </div>
          ) : null}

          {/* Kazanç tutarı */}
          {payload.savingAmount !== undefined ? (
            <div>
              <p className="mb-[var(--space-1)] text-sm font-medium text-[var(--color-neutral-900)]">
                Kazanç tutarı (TL)
              </p>
              <div className="flex items-center gap-2">
                <div className="rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] px-[var(--space-3)] py-[var(--space-2)] text-sm text-[var(--color-neutral-800)]">
                  {payload.savingAmount.toLocaleString('tr-TR')}
                </div>
                <span className="text-sm text-[var(--color-neutral-600)]">TL</span>
              </div>
            </div>
          ) : null}

          {/* Öncesi fotoğraflar */}
          {payload.beforePhotoDocumentIds && payload.beforePhotoDocumentIds.length > 0 ? (
            <div>
              <p className="mb-[var(--space-2)] text-sm font-medium text-[var(--color-neutral-900)]">
                Öncesi fotoğraflar{' '}
                <span className="font-normal text-[var(--color-neutral-500)]">
                  ({payload.beforePhotoDocumentIds.length} dosya)
                </span>
              </p>
              <ul className="grid gap-[var(--space-3)] sm:grid-cols-2">
                {payload.beforePhotoDocumentIds.map((id) => (
                  <li key={id}>
                    <DocumentCard documentId={id} label="Öncesi fotoğraf" />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Sonrası fotoğraflar */}
          {payload.afterPhotoDocumentIds && payload.afterPhotoDocumentIds.length > 0 ? (
            <div>
              <p className="mb-[var(--space-2)] text-sm font-medium text-[var(--color-neutral-900)]">
                Sonrası fotoğraflar{' '}
                <span className="font-normal text-[var(--color-neutral-500)]">
                  ({payload.afterPhotoDocumentIds.length} dosya)
                </span>
              </p>
              <ul className="grid gap-[var(--space-3)] sm:grid-cols-2">
                {payload.afterPhotoDocumentIds.map((id) => (
                  <li key={id}>
                    <DocumentCard documentId={id} label="Sonrası fotoğraf" />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Hiç alan yoksa */}
          {!payload.companyName &&
          payload.description === undefined &&
          payload.savingAmount === undefined &&
          !payload.beforePhotoDocumentIds?.length &&
          !payload.afterPhotoDocumentIds?.length ? (
            <p className="text-sm text-[var(--color-neutral-500)]">Form verisi mevcut değil.</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-[var(--space-4)] text-sm text-[var(--color-neutral-500)]">
          Form verisi mevcut değil.
        </p>
      )}

      <div className="mt-[var(--space-5)] flex justify-end">
        <button type="button" className="ls-btn ls-btn--primary ls-btn--sm" onClick={onClose}>
          Kapat
        </button>
      </div>
    </dialog>
  );
}
