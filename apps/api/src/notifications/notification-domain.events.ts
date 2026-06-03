/** EventEmitter2 string adları — domain servisleri ile aynı sözleşme */
export const NOTIFICATION_DOMAIN_EVENT = {
  ROLE_ASSIGNED: 'role.assigned',
  CONSENT_VERSION_PUBLISHED: 'consent.version_published',
} as const;

export type RoleAssignedPayload = {
  userId: string;
  roleName: string;
  roleCode: string;
};

export type ConsentVersionPublishedPayload = {
  versionId: string;
};
