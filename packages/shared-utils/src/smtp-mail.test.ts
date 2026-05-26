import { describe, expect, it, vi } from 'vitest';

describe('resolveTransactionalFromAddress', () => {
  it('EMAIL_FROM_ADDRESS önceliklidir', async () => {
    vi.stubEnv('EMAIL_FROM_ADDRESS', 'a@x.com');
    vi.stubEnv('SMTP_FROM_ADDRESS', 'b@x.com');
    vi.stubEnv('SES_FROM_ADDRESS', 'c@x.com');
    const { resolveTransactionalFromAddress } = await import('./smtp-mail.js');
    expect(resolveTransactionalFromAddress()).toBe('a@x.com');
    vi.unstubAllEnvs();
  });

  it('SMTP_FROM_ADDRESS SES önüne geçer', async () => {
    vi.stubEnv('EMAIL_FROM_ADDRESS', '');
    vi.stubEnv('SMTP_FROM_ADDRESS', 'smtp@x.com');
    vi.stubEnv('SES_FROM_ADDRESS', 'ses@x.com');
    const { resolveTransactionalFromAddress } = await import('./smtp-mail.js');
    expect(resolveTransactionalFromAddress()).toBe('smtp@x.com');
    vi.unstubAllEnvs();
  });
});

describe('sendMailViaSmtpFromEnv', () => {
  it('SMTP_HOST yoksa hata verir', async () => {
    vi.stubEnv('SMTP_HOST', '');
    vi.stubEnv('EMAIL_FROM_ADDRESS', 'from@x.com');
    const { sendMailViaSmtpFromEnv } = await import('./smtp-mail.js');
    await expect(
      sendMailViaSmtpFromEnv({
        to: 't@x.com',
        subject: 's',
        html: '<p>h</p>',
        text: 'h',
      }),
    ).rejects.toThrow(/SMTP_HOST/);
    vi.unstubAllEnvs();
  });

  it('jsonTransport ile gerçek SMTP ağı olmadan gönderir', async () => {
    const nodemailer = await import('nodemailer');
    const transport = nodemailer.default.createTransport({ jsonTransport: true });
    const sendSpy = vi.spyOn(transport, 'sendMail');

    const { sendMailWithTransport } = await import('./smtp-mail.js');
    await sendMailWithTransport(transport, {
      from: 'from@example.com',
      to: 'to@example.com',
      subject: 'Subj',
      html: '<p>x</p>',
      text: 'x',
    });

    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'to@example.com',
        subject: 'Subj',
      }),
    );
    sendSpy.mockRestore();
  });
});
