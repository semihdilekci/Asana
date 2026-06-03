import { Inject, Injectable } from '@nestjs/common';
import type { AdminOrganizationSummary } from '@leanmgmt/shared-schemas';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminSummaryService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getOrganizationSummary(): Promise<AdminOrganizationSummary> {
    const activeUserCount = await this.prisma.user.count({
      where: { isActive: true, anonymizedAt: null },
    });
    return { activeUserCount };
  }
}
