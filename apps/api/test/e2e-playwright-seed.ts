import { createHash } from 'node:crypto';

import type { PrismaClient } from '@leanmgmt/prisma-client';

/**
 * Playwright E2E sunucusu (e2e-serve) ayağa kalkarken: seed yöneticiye yayınlanmış rıza kaydı.
 * Faz 14 sonrası BPM görev seed'i yok — çekirdek smoke journey prisma db seed ile yeterli.
 */
export async function runE2ePlaywrightSeed(prisma: PrismaClient): Promise<void> {
  const pepperHex = process.env.APP_PII_PEPPER;
  if (!pepperHex) {
    throw new Error('APP_PII_PEPPER eksik — e2e seed atlanamaz');
  }

  const manager = await prisma.user.findFirst({
    where: { firstName: 'Seed', lastName: 'Manager' },
  });
  if (!manager) {
    console.warn('[e2e-playwright-seed] seed manager yok, atlanıyor');
    return;
  }

  const cv = await prisma.consentVersion.findFirst({ where: { status: 'PUBLISHED' } });
  if (!cv) {
    return;
  }

  const existing = await prisma.userConsent.findUnique({
    where: { userId_consentVersionId: { userId: manager.id, consentVersionId: cv.id } },
  });
  if (existing) {
    return;
  }

  const sig = createHash('sha256').update(`${manager.id}:${cv.id}:${pepperHex}`).digest('hex');
  await prisma.userConsent.create({
    data: {
      userId: manager.id,
      consentVersionId: cv.id,
      ipHash: createHash('sha256').update('e2e-seed').digest('hex'),
      userAgent: 'e2e-playwright-seed',
      signature: sig,
    },
  });
  console.log('[e2e-playwright-seed] seed manager rıza kaydı oluşturuldu');
}
