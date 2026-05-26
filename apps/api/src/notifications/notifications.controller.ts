import { Controller, Get, Header, HttpCode, Inject, Param, Post, Query } from '@nestjs/common';

import { NotificationListQuerySchema, type NotificationListQuery } from '@leanmgmt/shared-schemas';

import type { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { createZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

import { NotificationsService } from './notifications.service.js';

// Bildirim okuma / işaretleme endpoint'leri tüm kimlik doğrulanmış kullanıcılara açıktır.
// Ek permission gerekmez — her kullanıcı kendi bildirimlerini yönetebilir.
@Controller('notifications')
export class NotificationsController {
  constructor(
    @Inject(NotificationsService) private readonly notificationsService: NotificationsService,
  ) {}

  @Get('unread-count')
  @Header('Cache-Control', 'no-store')
  async unreadCount(@CurrentUser() actor: AuthenticatedUser) {
    return this.notificationsService.unreadInAppCount(actor);
  }

  @Post('mark-all-read')
  @HttpCode(200)
  async markAllRead(@CurrentUser() actor: AuthenticatedUser) {
    return this.notificationsService.markAllRead(actor);
  }

  @Post(':id/mark-read')
  @HttpCode(204)
  async markRead(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser): Promise<void> {
    await this.notificationsService.markRead(actor, id);
  }

  @Get()
  async list(
    @Query(createZodValidationPipe(NotificationListQuerySchema)) query: NotificationListQuery,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.notificationsService.listForActor(query, actor);
  }
}
