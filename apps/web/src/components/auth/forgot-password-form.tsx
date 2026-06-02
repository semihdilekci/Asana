'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { PasswordResetRequestSchema } from '@leanmgmt/shared-schemas';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert, Button, ButtonLink, Card, inputClassName } from '@/components/base';
import { apiClient, type ApiErrorBody } from '@/lib/api-client';

type FormValues = z.infer<typeof PasswordResetRequestSchema>;

function isApiError(data: unknown): data is ApiErrorBody {
  return typeof data === 'object' && data !== null && 'error' in data;
}

export function ForgotPasswordForm() {
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(PasswordResetRequestSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: FormValues): Promise<void> {
    setFormError(null);
    try {
      await apiClient.post('/api/v1/auth/password-reset-request', values);
      setDone(true);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown } };
      const data = ax.response?.data;
      if (isApiError(data)) {
        setFormError(data.error.message);
      } else {
        setFormError('İstek gönderilemedi. Lütfen tekrar deneyin.');
      }
    }
  }

  if (done) {
    return (
      <Card className="p-[var(--space-6)] shadow-md">
        <h1 className="mb-[var(--space-2)] text-lg font-semibold text-text-primary">
          E-posta gönderildi
        </h1>
        <p className="mb-[var(--space-6)] text-sm text-text-tertiary">
          Eğer bu email sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.
        </p>
        <ButtonLink href="/login" color="secondary" className="inline-block text-center">
          Girişe dön
        </ButtonLink>
      </Card>
    );
  }

  return (
    <Card className="p-[var(--space-6)] shadow-md">
      <h1 className="mb-[var(--space-2)] font-display text-xl font-semibold text-text-primary">
        Şifre sıfırlama
      </h1>
      <p className="mb-[var(--space-6)] text-sm text-text-tertiary">
        Hesabınıza kayıtlı e-posta adresini girin; size bağlantı göndereceğiz.
      </p>

      <form
        className="flex flex-col gap-[var(--space-4)]"
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
      >
        {formError ? <Alert variant="error">{formError}</Alert> : null}

        <div className="flex flex-col gap-[var(--space-1)]">
          <label htmlFor="fp-email" className="text-sm font-medium text-text-secondary">
            E-posta
          </label>
          <input
            id="fp-email"
            type="email"
            autoComplete="email"
            className={inputClassName()}
            {...form.register('email')}
          />
          {form.formState.errors.email?.message ? (
            <p className="text-sm text-error-600">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <Button
          type="submit"
          color="primary"
          className="w-full"
          isDisabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Gönderiliyor…' : 'Bağlantı gönder'}
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
