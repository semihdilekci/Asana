import nodemailer from 'nodemailer';

/** İşlem e-postası gönderen adres — öncelik sırası (geriye dönük uyumluluk). */
export function resolveTransactionalFromAddress(): string {
  for (const key of ['EMAIL_FROM_ADDRESS', 'SMTP_FROM_ADDRESS', 'SES_FROM_ADDRESS'] as const) {
    const raw = process.env[key];
    const t = typeof raw === 'string' ? raw.trim() : '';
    if (t) return t;
  }
  return '';
}

export type TransactionalMailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type TransactionalMailWithFrom = TransactionalMailPayload & {
  from: string | { address: string; name: string };
};

export async function sendMailWithTransport(
  transport: nodemailer.Transporter,
  mail: TransactionalMailWithFrom,
): Promise<void> {
  await transport.sendMail({
    from: mail.from,
    to: mail.to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });
}

function buildFromHeader(address: string): string | { address: string; name: string } {
  const name = process.env.SMTP_FROM_NAME?.trim();
  if (!name) return address;
  return { address, name };
}

function parsePort(): number {
  const raw = process.env.SMTP_PORT ?? '587';
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 587;
}

function parseSecure(port: number): boolean {
  if (process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1') return true;
  if (process.env.SMTP_SECURE === 'false' || process.env.SMTP_SECURE === '0') return false;
  return port === 465;
}

/**
 * Kurumsal SMTP ile transactional mail gönderir (`apps/worker` outbound job’ları).
 * Ortam: SMTP_HOST zorunlu; kimlik doğrulama SMTP_USER + SMTP_PASSWORD ile (opsiyonel — relay).
 */
export async function sendMailViaSmtpFromEnv(payload: TransactionalMailPayload): Promise<void> {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) {
    throw new Error('SMTP_HOST zorunlu (EMAIL_SENDING_MODE=smtp)');
  }
  const port = parsePort();
  const secure = parseSecure(port);
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD ?? '';
  const fromAddr = resolveTransactionalFromAddress();
  if (!fromAddr) {
    throw new Error(
      'Gönderen adres zorunlu: EMAIL_FROM_ADDRESS, SMTP_FROM_ADDRESS veya SES_FROM_ADDRESS',
    );
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass: password } : undefined,
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
    },
  });
  const from = buildFromHeader(fromAddr);
  await sendMailWithTransport(transport, { ...payload, from });
}
