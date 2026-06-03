import type { Job } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@leanmgmt/prisma-client';
import { OUTBOUND_EMAIL_JOB_KIND_TEMPLATE_TEST } from '@leanmgmt/shared-types';
import { encryptAes256GcmDeterministic } from '@leanmgmt/shared-utils';

import {
  processOutboundEmailJob,
  runNotificationEmailJob,
} from './notification-email.processor.js';

const HEX_PII_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function makeJob(data: { notificationId: string }): Job {
  return {
    data,
    opts: { attempts: 3 },
    attemptsMade: 1,
  } as unknown as Job;
}

describe('runNotificationEmailJob', () => {
  it('bildirim yoksa güncelleme yapmaz', async () => {
    const update = vi.fn();
    const prisma = {
      notification: {
        findUnique: vi.fn().mockResolvedValue(null),
        update,
      },
    } as unknown as PrismaClient;
    await runNotificationEmailJob(prisma, makeJob({ notificationId: 'missing' }));
    expect(update).not.toHaveBeenCalled();
  });

  it('pasif kullanıcıda FAILED yazar', async () => {
    const update = vi.fn().mockResolvedValue({});
    const prisma = {
      notification: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'n1',
          channel: 'EMAIL',
          deliveryStatus: 'PENDING',
          userId: 'u1',
          eventType: 'ROLE_ASSIGNED',
          metadata: {},
        }),
        update,
      },
      emailTemplate: {
        findUnique: vi.fn().mockResolvedValue({
          subjectTemplate: 'S',
          htmlBodyTemplate: '<p>x</p>',
          textBodyTemplate: 'x',
        }),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({
          isActive: false,
          firstName: 'X',
          emailEncrypted: new Uint8Array(1),
        }),
      },
    } as unknown as PrismaClient;

    await runNotificationEmailJob(prisma, makeJob({ notificationId: 'n1' }));

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'n1' },
        data: expect.objectContaining({ deliveryStatus: 'FAILED' }),
      }),
    );
  });

  it('EMAIL_SENDING_MODE=smtp iken gönderen yoksa FAILED (email_from_missing)', async () => {
    const prevMode = process.env.EMAIL_SENDING_MODE;
    const prevFrom = process.env.EMAIL_FROM_ADDRESS;
    const prevKey = process.env.APP_PII_ENCRYPTION_KEY;
    process.env.APP_PII_ENCRYPTION_KEY = HEX_PII_KEY;
    process.env.EMAIL_SENDING_MODE = 'smtp';
    process.env.EMAIL_FROM_ADDRESS = '';

    const keyBuf = Buffer.from(HEX_PII_KEY, 'hex');
    const emailBuf = encryptAes256GcmDeterministic('user@test.com', keyBuf, 'user:email:v1');

    const update = vi.fn().mockResolvedValue({});
    const prisma = {
      notification: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'n1',
          channel: 'EMAIL',
          deliveryStatus: 'PENDING',
          userId: 'u1',
          eventType: 'ROLE_ASSIGNED',
          metadata: {},
        }),
        update,
      },
      emailTemplate: {
        findUnique: vi.fn().mockResolvedValue({
          subjectTemplate: 'S',
          htmlBodyTemplate: '<p>x</p>',
          textBodyTemplate: 'x',
        }),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue({
          isActive: true,
          firstName: 'A',
          emailEncrypted: new Uint8Array(emailBuf),
        }),
      },
    } as unknown as PrismaClient;

    await runNotificationEmailJob(prisma, makeJob({ notificationId: 'n1' }));

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deliveryStatus: 'FAILED',
          deliveryFailureReason: 'email_from_missing',
        }),
      }),
    );

    process.env.EMAIL_SENDING_MODE = prevMode;
    process.env.EMAIL_FROM_ADDRESS = prevFrom;
    process.env.APP_PII_ENCRYPTION_KEY = prevKey;
  });
});

describe('processOutboundEmailJob', () => {
  it('şablon test job noop modunda prisma kullanmaz', async () => {
    const prevMode = process.env.EMAIL_SENDING_MODE;
    process.env.EMAIL_SENDING_MODE = 'noop';
    const findUnique = vi.fn();
    const prisma = { notification: { findUnique } } as unknown as PrismaClient;
    const job = {
      data: {
        kind: OUTBOUND_EMAIL_JOB_KIND_TEMPLATE_TEST,
        toEmail: 'x@example.com',
        subject: 'S',
        html: '<p>x</p>',
        text: 'x',
      },
      opts: { attempts: 3 },
      attemptsMade: 0,
    } as unknown as Job;
    await processOutboundEmailJob(prisma, job);
    expect(findUnique).not.toHaveBeenCalled();
    process.env.EMAIL_SENDING_MODE = prevMode;
  });
});
