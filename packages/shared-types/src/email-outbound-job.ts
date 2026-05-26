/**
 * BullMQ `notification-email-outbound` kuyruğu — bildirim satırı veya admin şablon testi.
 * Legacy job'lar yalnızca `{ notificationId }` taşır; yeni test job'ları `kind` ile ayrılır.
 */
export const OUTBOUND_EMAIL_JOB_KIND_TEMPLATE_TEST = 'EMAIL_TEMPLATE_TEST' as const;

export type NotificationOutboundEmailJobData =
  | { notificationId: string }
  | {
      kind: typeof OUTBOUND_EMAIL_JOB_KIND_TEMPLATE_TEST;
      toEmail: string;
      subject: string;
      html: string;
      text: string;
    };

export function isNotificationEmailTemplateTestJob(
  data: NotificationOutboundEmailJobData,
): data is Extract<
  NotificationOutboundEmailJobData,
  { kind: typeof OUTBOUND_EMAIL_JOB_KIND_TEMPLATE_TEST }
> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'kind' in data &&
    (data as { kind?: string }).kind === OUTBOUND_EMAIL_JOB_KIND_TEMPLATE_TEST
  );
}
