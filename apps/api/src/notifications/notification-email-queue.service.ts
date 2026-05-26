import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import {
  OUTBOUND_EMAIL_JOB_KIND_TEMPLATE_TEST,
  type NotificationOutboundEmailJobData,
} from '@leanmgmt/shared-types';

import type { Env } from '../config/env.schema.js';

@Injectable()
export class NotificationEmailQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(NotificationEmailQueueService.name);
  private readonly connection: Redis;
  private readonly queue: Queue<NotificationOutboundEmailJobData>;

  constructor(@Inject(ConfigService) private readonly config: ConfigService<Env, true>) {
    const redisUrl = this.config.get('REDIS_URL', { infer: true });
    this.connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });
    const name = this.config.get('NOTIFICATION_EMAIL_QUEUE_NAME', { infer: true });
    this.queue = new Queue<NotificationOutboundEmailJobData>(name, {
      connection: this.connection,
    });
  }

  async enqueueEmail(notificationId: string): Promise<void> {
    await this.queue.add(
      'send-notification-email',
      { notificationId },
      {
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
    this.logger.log({ event: 'notification_email_enqueued', notificationId });
  }

  /**
   * Admin şablon testi — SMTP gönderimi `apps/worker` tarafında yapılır (API yalnız kuyruğa yazar).
   */
  async enqueueTemplateTestEmail(input: {
    toEmail: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<string | undefined> {
    const job = await this.queue.add(
      'send-template-test-email',
      {
        kind: OUTBOUND_EMAIL_JOB_KIND_TEMPLATE_TEST,
        toEmail: input.toEmail,
        subject: input.subject,
        html: input.html,
        text: input.text,
      },
      {
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
    const jobId = job.id ? String(job.id) : undefined;
    this.logger.log({ event: 'email_template_test_enqueued', toEmail: input.toEmail, jobId });
    return jobId;
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
    await this.connection.quit();
  }
}
