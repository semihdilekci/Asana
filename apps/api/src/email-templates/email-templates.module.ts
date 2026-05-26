import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';

import { EmailTemplatesController } from './email-templates.controller.js';
import { EmailTemplatesService } from './email-templates.service.js';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [EmailTemplatesController],
  providers: [EmailTemplatesService],
  exports: [EmailTemplatesService],
})
export class EmailTemplatesModule {}
