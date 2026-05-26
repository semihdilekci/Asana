import { type Job, Worker } from 'bullmq';
import Handlebars from 'handlebars';
import Redis from 'ioredis';
import type { PrismaClient } from '@leanmgmt/prisma-client';
import {
  isNotificationEmailTemplateTestJob,
  OUTBOUND_EMAIL_JOB_KIND_TEMPLATE_TEST,
  type NotificationOutboundEmailJobData,
} from '@leanmgmt/shared-types';
import {
  bytesToNodeBuffer,
  decryptAes256GcmDeterministic,
  resolveTransactionalFromAddress,
  sendMailViaSmtpFromEnv,
} from '@leanmgmt/shared-utils';

export type NotificationEmailJobData = {
  notificationId: string;
};

function requireHexKey(name: string): Buffer {
  const v = process.env[name];
  if (!v || v.length !== 64 || !/^[0-9a-fA-F]+$/i.test(v)) {
    throw new Error(`${name} zorunlu: 64 hex (worker e-posta için PII decrypt)`);
  }
  return Buffer.from(v, 'hex');
}

function decryptUserEmail(emailEncrypted: Uint8Array): string {
  const key = requireHexKey('APP_PII_ENCRYPTION_KEY');
  return decryptAes256GcmDeterministic(bytesToNodeBuffer(emailEncrypted), key, 'user:email:v1');
}

function metaString(meta: unknown, key: string): string {
  if (!meta || typeof meta !== 'object') return '';
  const v = (meta as Record<string, unknown>)[key];
  if (typeof v === 'string') return v;
  if (v == null) return '';
  return String(v);
}

type EmailTemplateTestJobPayload = Extract<
  NotificationOutboundEmailJobData,
  { kind: typeof OUTBOUND_EMAIL_JOB_KIND_TEMPLATE_TEST }
>;

/**
 * Admin şablon testi — DB bildirimi yok; SMTP/ noop worker ortamında uygulanır.
 */
export async function runEmailTemplateTestSendJob(
  job: Job<EmailTemplateTestJobPayload>,
): Promise<void> {
  const { toEmail, subject, html, text } = job.data;
  const mode = (process.env.EMAIL_SENDING_MODE ?? 'noop').toLowerCase();
  if (mode === 'noop') {
    return;
  }

  if (mode !== 'smtp') {
    throw new Error(`unsupported_email_mode:${mode}`);
  }

  if (!resolveTransactionalFromAddress()) {
    throw new Error('email_from_missing');
  }

  if (!process.env.SMTP_HOST?.trim()) {
    throw new Error('smtp_host_missing');
  }

  await sendMailViaSmtpFromEnv({
    to: toEmail,
    subject,
    html,
    text,
  });
}

export async function runNotificationEmailJob(
  prisma: PrismaClient,
  job: Job<NotificationEmailJobData>,
): Promise<void> {
  const { notificationId } = job.data;
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification || notification.channel !== 'EMAIL') {
    return;
  }
  if (notification.deliveryStatus !== 'PENDING') {
    return;
  }

  const template = await prisma.emailTemplate.findUnique({
    where: { eventType: notification.eventType },
  });
  if (!template) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        deliveryStatus: 'FAILED',
        deliveryFailureReason: 'email_template_missing',
      },
    });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: notification.userId } });
  if (!user?.isActive) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        deliveryStatus: 'FAILED',
        deliveryFailureReason: 'user_inactive_or_missing',
      },
    });
    return;
  }

  let to: string;
  try {
    to = decryptUserEmail(user.emailEncrypted as unknown as Uint8Array);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        deliveryStatus: 'FAILED',
        deliveryFailureReason: `email_decrypt_failed:${msg.slice(0, 200)}`,
      },
    });
    return;
  }

  const meta = notification.metadata;
  const baseUrl = process.env.WEB_APP_BASE_URL ?? 'http://localhost:3000';
  const vars: Record<string, string> = {
    firstName: user.firstName,
    displayId: metaString(meta, 'displayId'),
    taskTitle: metaString(meta, 'taskTitle'),
    processId: metaString(meta, 'processId'),
    taskId: metaString(meta, 'taskId'),
    resetLink: metaString(meta, 'resetLink'),
    loginUrl: metaString(meta, 'loginUrl') || `${baseUrl}/login`,
    digestDate: metaString(meta, 'digestDate'),
    digestBodyHtml: metaString(meta, 'digestBodyHtml'),
    digestBodyText: metaString(meta, 'digestBodyText'),
    daysRemaining: metaString(meta, 'daysRemaining'),
    version: metaString(meta, 'version'),
    roleName: metaString(meta, 'roleName'),
    roleCode: metaString(meta, 'roleCode'),
  };

  const subject = Handlebars.compile(template.subjectTemplate, { noEscape: true })(vars);
  const html = Handlebars.compile(template.htmlBodyTemplate, { noEscape: true })(vars);
  const text = Handlebars.compile(template.textBodyTemplate, { noEscape: true })(vars);

  const mode = (process.env.EMAIL_SENDING_MODE ?? 'noop').toLowerCase();
  const from = resolveTransactionalFromAddress();

  if (mode === 'noop') {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        deliveryStatus: 'SENT',
        sentAt: new Date(),
        deliveryFailureReason: null,
      },
    });
    return;
  }

  if (mode !== 'smtp') {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        deliveryStatus: 'FAILED',
        deliveryFailureReason: `unsupported_email_mode:${mode}`,
      },
    });
    return;
  }

  if (!from) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        deliveryStatus: 'FAILED',
        deliveryFailureReason: 'email_from_missing',
      },
    });
    return;
  }

  const host = process.env.SMTP_HOST?.trim();
  if (!host) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        deliveryStatus: 'FAILED',
        deliveryFailureReason: 'smtp_host_missing',
      },
    });
    return;
  }

  const maxAttempts = typeof job.opts.attempts === 'number' ? job.opts.attempts : 3;

  try {
    await sendMailViaSmtpFromEnv({
      to,
      subject,
      html,
      text,
    });

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        deliveryStatus: 'SENT',
        sentAt: new Date(),
        deliveryFailureReason: null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (job.attemptsMade >= maxAttempts) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          deliveryStatus: 'FAILED',
          deliveryFailureReason: msg.slice(0, 500),
        },
      });
      return;
    }
    throw e;
  }
}

export async function processOutboundEmailJob(
  prisma: PrismaClient,
  job: Job<NotificationOutboundEmailJobData>,
): Promise<void> {
  if (isNotificationEmailTemplateTestJob(job.data)) {
    await runEmailTemplateTestSendJob(job as Job<EmailTemplateTestJobPayload>);
    return;
  }
  await runNotificationEmailJob(prisma, job as Job<NotificationEmailJobData>);
}

export async function startNotificationEmailWorker(
  prisma: PrismaClient,
): Promise<() => Promise<void>> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('REDIS_URL yok — bildirim e-posta worker başlatılmadı');
    return async () => undefined;
  }
  const queueName = process.env.NOTIFICATION_EMAIL_QUEUE_NAME ?? 'notification-email-outbound';
  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const worker = new Worker<NotificationOutboundEmailJobData>(
    queueName,
    async (job) => {
      await processOutboundEmailJob(prisma, job);
    },
    { connection },
  );
  return async () => {
    await worker.close();
    await connection.quit();
  };
}
