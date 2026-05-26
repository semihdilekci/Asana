import { describe, expect, it } from 'vitest';

import {
  isNotificationEmailTemplateTestJob,
  OUTBOUND_EMAIL_JOB_KIND_TEMPLATE_TEST,
} from './email-outbound-job.js';

describe('isNotificationEmailTemplateTestJob', () => {
  it('şablon test job tanır', () => {
    const data = {
      kind: OUTBOUND_EMAIL_JOB_KIND_TEMPLATE_TEST,
      toEmail: 'a@b.com',
      subject: 'S',
      html: '<p>x</p>',
      text: 'x',
    };
    expect(isNotificationEmailTemplateTestJob(data)).toBe(true);
  });

  it('bildirim job şablon testi değildir', () => {
    expect(isNotificationEmailTemplateTestJob({ notificationId: 'n1' })).toBe(false);
  });
});
