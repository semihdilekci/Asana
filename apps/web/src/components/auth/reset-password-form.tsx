'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { PasswordResetConfirmSchema } from '@leanmgmt/shared-schemas';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert, Button, ButtonLink, Card, inputClassName } from '@/components/base';
import { apiClient, type ApiErrorBody } from '@/lib/api-client';

const FormSchema = PasswordResetConfirmSchema;

type FormValues = z.infer<typeof FormSchema>;

function isApiError(data: unknown): data is ApiErrorBody {
  return typeof data === 'object' && data !== null && 'error' in data;
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') ?? '';
  const [formError, setFormError] = useState<string | null>(null);

  const defaultValues = useMemo(
    () => ({
      token: tokenFromUrl,
      newPassword: '',
    }),
    [tokenFromUrl],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues,
    values: defaultValues,
  });

  async function onSubmit(values: FormValues): Promise<void> {
    setFormError(null);
    try {
      await apiClient.post('/api/v1/auth/password-reset-confirm', values);
      router.replace('/login');
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown } };
      const data = ax.response?.data;
      if (isApiError(data)) {
        setFormError(data.error.message);
      } else {
        setFormError('Şifre güncellenemedi. Lütfen tekrar deneyin.');
      }
    }
  }

  if (!tokenFromUrl) {
    return (
      <Card className="p-[var(--space-6)] shadow-md" role="alert">
        <p className="mb-[var(--space-4)] text-sm text-text-secondary">
          Geçerli bir sıfırlama bağlantısı bulunamadı. E-postadaki bağlantıyı kullanın veya yeni
          talep oluşturun.
        </p>
        <ButtonLink href="/forgot-password" color="secondary">
          Şifre sıfırlama talebi
        </ButtonLink>
      </Card>
    );
  }

  return (
    <Card className="p-[var(--space-6)] shadow-md">
      <h1 className="mb-[var(--space-2)] text-xl font-semibold text-text-primary">
        Yeni şifre belirle
      </h1>
      <p className="mb-[var(--space-6)] text-sm text-text-tertiary">
        En az 12 karakter; büyük, küçük harf, rakam ve özel karakter içermelidir.
      </p>

      <form
        className="flex flex-col gap-[var(--space-4)]"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        {formError ? <Alert variant="error">{formError}</Alert> : null}

        <input type="hidden" {...form.register('token')} />

        <div className="flex flex-col gap-[var(--space-1)]">
          <label htmlFor="rp-password" className="text-sm font-medium text-text-secondary">
            Yeni şifre
          </label>
          <input
            id="rp-password"
            type="password"
            autoComplete="new-password"
            className={inputClassName()}
            aria-describedby="rp-password-hint"
            {...form.register('newPassword')}
          />
          <p id="rp-password-hint" className="text-xs text-text-tertiary">
            En az 12 karakter; büyük harf, küçük harf, rakam ve özel karakter zorunludur.
          </p>
          {form.formState.errors.newPassword?.message ? (
            <p className="text-sm text-error-600">{form.formState.errors.newPassword.message}</p>
          ) : null}
        </div>

        <Button
          type="submit"
          color="primary"
          className="w-full"
          isDisabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Kaydediliyor…' : 'Şifreyi güncelle'}
        </Button>

        <Link
          href="/login"
          className="text-center text-sm text-brand-600 underline decoration-brand-600 underline-offset-2"
        >
          Girişe dön
        </Link>
      </form>
    </Card>
  );
}
