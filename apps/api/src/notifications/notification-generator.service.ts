import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import {
  NOTIFICATION_DOMAIN_EVENT,
  type ConsentVersionPublishedPayload,
  type RoleAssignedPayload,
} from './notification-domain.events.js';
import { NotificationsService } from './notifications.service.js';

@Injectable()
export class NotificationGeneratorService {
  constructor(@Inject(NotificationsService) private readonly notifications: NotificationsService) {}

  @OnEvent(NOTIFICATION_DOMAIN_EVENT.ROLE_ASSIGNED, { async: true })
  async handleRoleAssigned(payload: RoleAssignedPayload): Promise<void> {
    await this.notifications.createInAppAndEmailIfEnabled({
      userId: payload.userId,
      eventType: 'ROLE_ASSIGNED',
      title: 'Yeni rol atandı',
      body: `Size “${payload.roleName}” (${payload.roleCode}) rolü atandı.`,
      linkUrl: '/roles',
      metadata: { roleCode: payload.roleCode, roleName: payload.roleName },
    });
  }

  @OnEvent(NOTIFICATION_DOMAIN_EVENT.CONSENT_VERSION_PUBLISHED, { async: true })
  async handleConsentVersionPublished(payload: ConsentVersionPublishedPayload): Promise<void> {
    await this.notifications.broadcastConsentVersionPublished(payload.versionId);
  }
}
