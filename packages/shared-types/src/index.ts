export {
  Permission,
  PERMISSION_METADATA,
  filterKnownPermissionKeys,
  isKnownPermissionKey,
  type PermissionCategory,
  type PermissionMetadata,
} from './permission.js';
export { RoleRuleAttributeKey, RoleRuleConditionOperator } from './role-rule.js';
export {
  isNotificationEmailTemplateTestJob,
  OUTBOUND_EMAIL_JOB_KIND_TEMPLATE_TEST,
  type NotificationOutboundEmailJobData,
} from './email-outbound-job.js';

/** Geriye dönük — boş export kaldırılmasın */
export type Placeholder = { _brand: 'shared-types' };
