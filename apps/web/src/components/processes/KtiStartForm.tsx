'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { KtiStartBodySchema, type KtiStartInput } from '@leanmgmt/shared-schemas';
import { Permission } from '@leanmgmt/shared-types';

import { Alert, Button, Card, inputClassName } from '@/components/base';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import { useKtiStartMutation } from '@/lib/queries/processes';
import { useMasterDataListQuery } from '@/lib/queries/master-data';
import { useAuthStore } from '@/stores/auth-store';

export function KtiStartForm() {
  const router = useRouter();
  const user = useAuthStore((s) => s.currentUser);
  const [step, setStep] = useState<1 | 2>(1);
  const [cancelOpen, setCancelOpen] = useState(false);
  const ktiMutation = useKtiStartMutation();

  const { data: companiesData, isLoading: companiesLoading } = useMasterDataListQuery('companies', {
    isActive: 'true',
  });
  const companies = companiesData?.items ?? [];
  /** API yalnızca başlatanın şirketiyle eşleşen companyId kabul eder (KtiCompanyMismatch önlemi) */
  const companiesForUser = useMemo(
    () => (user?.company?.id ? companies.filter((c) => c.id === user.company!.id) : companies),
    [companies, user?.company?.id],
  );

  const defaultCompanyId = user?.company?.id ?? '';

  const form = useForm<KtiStartInput>({
    resolver: zodResolver(KtiStartBodySchema),
    defaultValues: {
      companyId: defaultCompanyId,
      beforePhotoDocumentIds: [],
      afterPhotoDocumentIds: [],
      savingAmount: 0,
      description: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (defaultCompanyId && !form.getValues('companyId')) {
      form.setValue('companyId', defaultCompanyId);
    }
  }, [defaultCompanyId, form]);

  const companyId = form.watch('companyId');
  const selectedCompanyName = useMemo(() => {
    const c = companiesForUser.find((x) => x.id === companyId);
    return c?.name ?? companyId;
  }, [companiesForUser, companyId]);

  const hasManager = Boolean(user?.manager);
  useUnsavedChangesWarning(form.formState.isDirty);

  const goNextFromStep1 = async () => {
    const ok = await form.trigger();
    if (!ok) return;
    if (!hasManager) {
      toast.error('Profilinizde yönetici atanmamış.');
      return;
    }
    setStep(2);
  };

  const goSubmit = async () => {
    const values = form.getValues();
    try {
      const res = await ktiMutation.mutateAsync(values);
      toast.success(`KTİ süreci başlatıldı — ${res.displayId}`);
      form.reset(values);
      router.push(`/processes/${encodeURIComponent(res.displayId)}`);
    } catch (e) {
      if (isAxiosError(e)) {
        const code = e.response?.data?.error?.code as string | undefined;
        if (code === 'DOCUMENT_SCAN_PENDING' || e.response?.status === 425) {
          toast.error('Dokümanlar hâlâ taramada, lütfen bekleyin.');
          return;
        }
        if (code === 'DOCUMENT_INFECTED') {
          toast.error('Enfekte doküman var, kaldırın ve tekrar deneyin.');
          return;
        }
        if (code === 'PROCESS_START_FORBIDDEN') {
          toast.error(e.response?.data?.error?.message ?? 'Bu işlem için yetkiniz yok.');
          router.push('/dashboard');
          return;
        }
        if (e.response?.status === 422) {
          toast.error(e.response?.data?.error?.message ?? 'İş kuralı hatası.');
          return;
        }
        toast.error(e.response?.data?.error?.message ?? 'Süreç başlatılamadı.');
        return;
      }
      toast.error('Süreç başlatılamadı.');
    }
  };

  const beforeIds = form.watch('beforePhotoDocumentIds');
  const afterIds = form.watch('afterPhotoDocumentIds');
  const savingAmount = form.watch('savingAmount');
  const description = form.watch('description');

  const step1Blocked = !hasManager || beforeIds.length < 1 || afterIds.length < 1;

  return (
    <div className="space-y-[var(--space-6)]">
      {!hasManager ? (
        <Alert variant="error">
          <p className="text-sm font-medium">Profilinizde yönetici atanmamış.</p>
          <p className="mt-[var(--space-2)] text-sm text-[var(--color-neutral-700)]">
            KTİ başlatmak için sistem yöneticinize başvurun.
          </p>
        </Alert>
      ) : null}

      <ol
        className="flex flex-wrap gap-[var(--space-4)] text-sm text-[var(--color-neutral-600)]"
        aria-label="Form adımları"
      >
        <li className={step === 1 ? 'font-semibold text-[var(--color-primary-700)]' : ''}>
          1. Bilgiler ve dosyalar
        </li>
        <li aria-hidden>›</li>
        <li className={step === 2 ? 'font-semibold text-[var(--color-primary-700)]' : ''}>
          2. Özet ve onay
        </li>
      </ol>

      {step === 1 ? (
        <Card className="space-y-[var(--space-5)] p-[var(--space-5)]">
          <div>
            <label
              htmlFor="kti-company"
              className="mb-[var(--space-1)] block text-sm font-medium text-[var(--color-neutral-900)]"
            >
              Şirket <span className="text-[var(--color-error-600)]">*</span>
            </label>
            {companiesLoading ? (
              <p className="text-sm text-[var(--color-neutral-500)]" role="status">
                Şirketler yükleniyor…
              </p>
            ) : (
              <select
                id="kti-company"
                className={inputClassName('md', 'w-full max-w-md')}
                disabled={!hasManager}
                aria-required
                {...form.register('companyId')}
              >
                <option value="">Şirket seçin</option>
                {companiesForUser.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            )}
            {form.formState.errors.companyId ? (
              <p className="mt-1 text-sm text-[var(--color-error-700)]">
                {form.formState.errors.companyId.message}
              </p>
            ) : null}
          </div>

          <PermissionGate
            permission={Permission.DOCUMENT_UPLOAD}
            fallback={
              <Alert variant="error" className="text-sm">
                Doküman yüklemek için <strong>DOCUMENT_UPLOAD</strong> yetkisi gerekir.
                Yöneticinizden talep edin.
              </Alert>
            }
          >
            <DocumentUpload
              label="Öncesi fotoğraflar *"
              value={beforeIds}
              onChange={(ids) =>
                form.setValue('beforePhotoDocumentIds', ids, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              disabled={!hasManager}
            />
            {form.formState.errors.beforePhotoDocumentIds ? (
              <p className="text-sm text-[var(--color-error-700)]">
                {form.formState.errors.beforePhotoDocumentIds.message as string}
              </p>
            ) : null}

            <DocumentUpload
              label="Sonrası fotoğraflar *"
              value={afterIds}
              onChange={(ids) =>
                form.setValue('afterPhotoDocumentIds', ids, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              disabled={!hasManager}
            />
            {form.formState.errors.afterPhotoDocumentIds ? (
              <p className="text-sm text-[var(--color-error-700)]">
                {form.formState.errors.afterPhotoDocumentIds.message as string}
              </p>
            ) : null}
          </PermissionGate>

          <div>
            <label
              htmlFor="kti-saving"
              className="mb-[var(--space-1)] block text-sm font-medium text-[var(--color-neutral-900)]"
            >
              Kazanç tutarı (TL) <span className="text-[var(--color-error-600)]">*</span>
            </label>
            <div className="flex max-w-xs items-center gap-2">
              <input
                id="kti-saving"
                type="number"
                min={0}
                step={1}
                className={inputClassName('md', 'w-full')}
                disabled={!hasManager}
                aria-required
                {...form.register('savingAmount', { valueAsNumber: true })}
              />
              <span className="text-sm text-[var(--color-neutral-600)]">TL</span>
            </div>
            {form.formState.errors.savingAmount ? (
              <p className="mt-1 text-sm text-[var(--color-error-700)]">
                {form.formState.errors.savingAmount.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="kti-desc"
              className="mb-[var(--space-1)] block text-sm font-medium text-[var(--color-neutral-900)]"
            >
              Açıklama <span className="text-[var(--color-error-600)]">*</span>
            </label>
            <textarea
              id="kti-desc"
              rows={6}
              maxLength={5000}
              placeholder="Yapılan iyileştirmeyi ve elde edilen faydayı açıklayın…"
              className={inputClassName('md', 'min-h-[8rem] w-full')}
              disabled={!hasManager}
              aria-required
              aria-describedby="kti-desc-count"
              {...form.register('description')}
            />
            <p id="kti-desc-count" className="mt-1 text-xs text-[var(--color-neutral-500)]">
              {description.length} / 5000
            </p>
            {form.formState.errors.description ? (
              <p className="mt-1 text-sm text-[var(--color-error-700)]">
                {form.formState.errors.description.message}
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="space-y-[var(--space-4)] p-[var(--space-5)]">
          <h2 className="text-lg font-semibold text-[var(--color-neutral-900)]">Özet</h2>
          <p className="text-sm text-[var(--color-neutral-600)]">
            Bilgileri kontrol edin. Süreci başlatmak için <strong>Onaylıyorum</strong> ile gönderin;
            başlatma sonrası süreç yöneticinize onaya düşer.
          </p>
          <dl className="grid gap-[var(--space-3)] text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--color-neutral-500)]">Şirket</dt>
              <dd className="text-[var(--color-neutral-900)]">{selectedCompanyName}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-neutral-500)]">Öncesi fotoğraf</dt>
              <dd className="text-[var(--color-neutral-900)]">{beforeIds.length} dosya (temiz)</dd>
            </div>
            <div>
              <dt className="text-[var(--color-neutral-500)]">Sonrası fotoğraf</dt>
              <dd className="text-[var(--color-neutral-900)]">{afterIds.length} dosya (temiz)</dd>
            </div>
            <div>
              <dt className="text-[var(--color-neutral-500)]">Kazanç</dt>
              <dd className="text-[var(--color-neutral-900)]">{savingAmount} TL</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[var(--color-neutral-500)]">Açıklama</dt>
              <dd className="whitespace-pre-wrap text-[var(--color-neutral-900)]">{description}</dd>
            </div>
          </dl>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)]">
        <Button
          color="secondary"
          size="md"
          onPress={() => {
            if (form.formState.isDirty) {
              setCancelOpen(true);
              return;
            }
            void router.push('/dashboard');
          }}
        >
          İptal
        </Button>
        <div className="flex flex-wrap gap-2">
          {step > 1 ? (
            <Button color="secondary" size="md" onPress={() => setStep(1)}>
              Geri
            </Button>
          ) : null}
          {step === 1 ? (
            <Button
              color="primary"
              isDisabled={step1Blocked}
              onPress={() => void goNextFromStep1()}
            >
              İleri
            </Button>
          ) : null}
          {step === 2 ? (
            <Button
              color="primary"
              isDisabled={ktiMutation.isPending}
              onPress={() => void goSubmit()}
            >
              {ktiMutation.isPending ? 'Gönderiliyor…' : 'Onaylıyorum'}
            </Button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Kaydedilmemiş değişiklikler"
        description="Formu terk etmek istediğinize emin misiniz?"
        confirmLabel="Evet, çık"
        destructive
        onConfirm={() => {
          void router.push('/dashboard');
        }}
      />
    </div>
  );
}
