import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import path from 'node:path';

import cookie from '@fastify/cookie';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from '../src/prisma/prisma.service.js';

const PII_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const PII_PEPPER = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
const JWT_SECRET = 'dev-only-jwt-secret-min-32-characters-long!!';

function parseSetCookie(setCookie: string | string[] | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  for (const line of lines) {
    const [pair] = line.split(';');
    const eq = pair.indexOf('=');
    if (eq === -1) continue;
    out[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
  return out;
}

type LoginResult = {
  accessToken: string;
  csrfToken: string;
  cookieHeader: string;
  user: Record<string, unknown>;
};

async function login(
  srv: ReturnType<NestFastifyApplication['getHttpAdapter']['getInstance']>,
  email: string,
  password: string,
): Promise<LoginResult> {
  const res = await srv.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify({ email, password }),
  });
  expect(res.statusCode).toBe(200);
  const json = JSON.parse(res.body) as {
    success: boolean;
    data: { accessToken: string; csrfToken: string; user: Record<string, unknown> };
  };
  const cookies = parseSetCookie(res.headers['set-cookie']);
  return {
    accessToken: json.data.accessToken,
    csrfToken: json.data.csrfToken,
    cookieHeader: `refresh_token=${cookies.refresh_token}; csrf_token=${cookies.csrf_token}`,
    user: json.data.user,
  };
}

async function ensureUserConsent(
  prisma: PrismaService,
  userId: string,
  consentVersionId: string,
): Promise<void> {
  const signature = createHash('sha256')
    .update(`${userId}:${consentVersionId}:${PII_PEPPER}`)
    .digest('hex');
  await prisma.userConsent.upsert({
    where: { userId_consentVersionId: { userId, consentVersionId } },
    create: {
      userId,
      consentVersionId,
      ipHash: createHash('sha256').update('impersonation-test').digest('hex'),
      userAgent: 'integration-test',
      signature,
    },
    update: {},
  });
}

describe('Auth impersonation integration', () => {
  let pg: StartedPostgreSqlContainer;
  let redis: StartedTestContainer;
  let app: NestFastifyApplication;
  const apiDir = path.join(__dirname, '..');

  beforeAll(async () => {
    pg = await new PostgreSqlContainer('postgres:16-alpine').start();
    redis = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();

    const databaseUrl = pg.getConnectionUri();
    const redisUrl = `redis://${redis.getHost()}:${redis.getMappedPort(6379)}`;

    const env = {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: databaseUrl,
      REDIS_URL: redisUrl,
      APP_PII_ENCRYPTION_KEY: PII_KEY,
      APP_PII_PEPPER: PII_PEPPER,
      JWT_ACCESS_SECRET_CURRENT: JWT_SECRET,
      AUTH_EXPOSE_RESET_TOKEN: 'false',
      OIDC_ENABLED: 'false',
    };

    execSync('pnpm exec prisma migrate deploy', { cwd: apiDir, stdio: 'inherit', env });
    execSync('pnpm exec prisma db seed', { cwd: apiDir, stdio: 'inherit', env });

    Object.assign(process.env, env);

    const { AppModule } = await import('../src/app.module.js');
    app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
    await app.register(cookie as unknown as Parameters<NestFastifyApplication['register']>[0], {
      secret: 'test-cookie-signing-secret-min-32-chars___',
    });
    app.setGlobalPrefix('api/v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  }, 180_000);

  afterAll(async () => {
    if (app) await app.close();
    if (pg) await pg.stop();
    if (redis) await redis.stop();
  });

  it('USER_IMPERSONATION yok → start 403', async () => {
    const srv = app.getHttpAdapter().getInstance();
    const prisma = app.get(PrismaService);
    const target = await prisma.user.findFirst({
      where: { firstName: 'Rıza', lastName: 'Bekleyen' },
    });
    expect(target).not.toBeNull();

    const { accessToken, csrfToken, cookieHeader } = await login(
      srv,
      'integration_limited@leanmgmt.local',
      'OnlyLim123!@#',
    );

    const res = await srv.inject({
      method: 'POST',
      url: '/api/v1/auth/impersonate/start',
      headers: {
        authorization: `Bearer ${accessToken}`,
        cookie: cookieHeader,
        'x-csrf-token': csrfToken,
        'content-type': 'application/json',
      },
      payload: JSON.stringify({ targetUserId: target!.id }),
    });

    expect(res.statusCode).toBe(403);
    const json = JSON.parse(res.body) as { error: { code: string } };
    expect(json.error.code).toBe('PERMISSION_DENIED');
  });

  it('start → me (hedef) → stop → me (impersonator)', async () => {
    const srv = app.getHttpAdapter().getInstance();
    const prisma = app.get(PrismaService);
    const target = await prisma.user.findFirst({
      where: { firstName: 'Rıza', lastName: 'Bekleyen' },
    });
    expect(target).not.toBeNull();

    const manager = await login(srv, 'seed.manager@leanmgmt.local', 'ManagerPass123!@#');

    const start = await srv.inject({
      method: 'POST',
      url: '/api/v1/auth/impersonate/start',
      headers: {
        authorization: `Bearer ${manager.accessToken}`,
        cookie: manager.cookieHeader,
        'x-csrf-token': manager.csrfToken,
        'content-type': 'application/json',
      },
      payload: JSON.stringify({ targetUserId: target!.id }),
    });
    expect(start.statusCode).toBe(200);
    const startJson = JSON.parse(start.body) as {
      success: boolean;
      data: {
        accessToken: string;
        csrfToken: string;
        user: { id: string; firstName: string; impersonation: { active: boolean } };
      };
    };
    expect(startJson.data.user.id).toBe(target!.id);
    expect(startJson.data.user.firstName).toBe('Rıza');
    expect(startJson.data.user.impersonation.active).toBe(true);

    const meWhileImpersonating = await srv.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${startJson.data.accessToken}` },
    });
    expect(meWhileImpersonating.statusCode).toBe(200);
    const meJson = JSON.parse(meWhileImpersonating.body) as {
      data: { id: string; impersonation: { active: boolean; impersonator: { firstName: string } } };
    };
    expect(meJson.data.id).toBe(target!.id);
    expect(meJson.data.impersonation.active).toBe(true);
    expect(meJson.data.impersonation.impersonator.firstName).toBe('Seed');

    const stop = await srv.inject({
      method: 'POST',
      url: '/api/v1/auth/impersonate/stop',
      headers: {
        authorization: `Bearer ${startJson.data.accessToken}`,
        cookie: manager.cookieHeader,
        'x-csrf-token': startJson.data.csrfToken,
      },
    });
    expect(stop.statusCode).toBe(200);
    const stopJson = JSON.parse(stop.body) as {
      data: {
        user: { firstName: string; impersonation: { active: boolean } };
      };
    };
    expect(stopJson.data.user.firstName).toBe('Seed');
    expect(stopJson.data.user.impersonation.active).toBe(false);
  });

  it('kendisi, superadmin ve pasif hedef reddedilir', async () => {
    const srv = app.getHttpAdapter().getInstance();
    const prisma = app.get(PrismaService);

    const manager = await login(srv, 'seed.manager@leanmgmt.local', 'ManagerPass123!@#');
    const superadminUser = await prisma.user.findFirst({
      where: { userRoles: { some: { role: { code: 'SUPERADMIN' } } } },
    });
    expect(superadminUser).not.toBeNull();

    const managerRow = await prisma.user.findFirst({
      where: { firstName: 'Seed', lastName: 'Manager' },
    });
    expect(managerRow).not.toBeNull();

    const selfRes = await srv.inject({
      method: 'POST',
      url: '/api/v1/auth/impersonate/start',
      headers: {
        authorization: `Bearer ${manager.accessToken}`,
        cookie: manager.cookieHeader,
        'x-csrf-token': manager.csrfToken,
        'content-type': 'application/json',
      },
      payload: JSON.stringify({ targetUserId: managerRow!.id }),
    });
    expect(selfRes.statusCode).toBe(403);
    expect(JSON.parse(selfRes.body).error.code).toBe('AUTH_IMPERSONATION_FORBIDDEN');

    const superRes = await srv.inject({
      method: 'POST',
      url: '/api/v1/auth/impersonate/start',
      headers: {
        authorization: `Bearer ${manager.accessToken}`,
        cookie: manager.cookieHeader,
        'x-csrf-token': manager.csrfToken,
        'content-type': 'application/json',
      },
      payload: JSON.stringify({ targetUserId: superadminUser!.id }),
    });
    expect(superRes.statusCode).toBe(403);
    expect(JSON.parse(superRes.body).error.code).toBe('AUTH_IMPERSONATION_FORBIDDEN');

    const onlyProc = await prisma.user.findFirst({
      where: { firstName: 'Proc', lastName: 'Only' },
    });
    expect(onlyProc).not.toBeNull();
    await prisma.user.update({ where: { id: onlyProc!.id }, data: { isActive: false } });

    const inactiveRes = await srv.inject({
      method: 'POST',
      url: '/api/v1/auth/impersonate/start',
      headers: {
        authorization: `Bearer ${manager.accessToken}`,
        cookie: manager.cookieHeader,
        'x-csrf-token': manager.csrfToken,
        'content-type': 'application/json',
      },
      payload: JSON.stringify({ targetUserId: onlyProc!.id }),
    });
    expect(inactiveRes.statusCode).toBe(409);
    expect(JSON.parse(inactiveRes.body).error.code).toBe('AUTH_IMPERSONATION_TARGET_INACTIVE');
  });

  it('hedef bulunamadı → 404; aktif impersonation yokken stop/switch → 409', async () => {
    const srv = app.getHttpAdapter().getInstance();
    const manager = await login(srv, 'seed.manager@leanmgmt.local', 'ManagerPass123!@#');

    const notFound = await srv.inject({
      method: 'POST',
      url: '/api/v1/auth/impersonate/start',
      headers: {
        authorization: `Bearer ${manager.accessToken}`,
        cookie: manager.cookieHeader,
        'x-csrf-token': manager.csrfToken,
        'content-type': 'application/json',
      },
      payload: JSON.stringify({ targetUserId: '00000000-0000-4000-8000-000000000099' }),
    });
    expect(notFound.statusCode).toBe(404);
    expect(JSON.parse(notFound.body).error.code).toBe('AUTH_IMPERSONATION_TARGET_NOT_FOUND');

    const stop = await srv.inject({
      method: 'POST',
      url: '/api/v1/auth/impersonate/stop',
      headers: {
        authorization: `Bearer ${manager.accessToken}`,
        cookie: manager.cookieHeader,
        'x-csrf-token': manager.csrfToken,
      },
    });
    expect(stop.statusCode).toBe(409);
    expect(JSON.parse(stop.body).error.code).toBe('AUTH_IMPERSONATION_NOT_ACTIVE');

    const sw = await srv.inject({
      method: 'POST',
      url: '/api/v1/auth/impersonate/switch',
      headers: {
        authorization: `Bearer ${manager.accessToken}`,
        cookie: manager.cookieHeader,
        'x-csrf-token': manager.csrfToken,
        'content-type': 'application/json',
      },
      payload: JSON.stringify({ targetUserId: '00000000-0000-4000-8000-000000000099' }),
    });
    expect(sw.statusCode).toBe(409);
    expect(JSON.parse(sw.body).error.code).toBe('AUTH_IMPERSONATION_NOT_ACTIVE');
  });

  it('lifecycle audit — start ve stop kayıtları impersonator userId ile yazılır', async () => {
    const srv = app.getHttpAdapter().getInstance();
    const prisma = app.get(PrismaService);
    const target = await prisma.user.findFirst({
      where: { firstName: 'Rıza', lastName: 'Bekleyen' },
    });
    const managerRow = await prisma.user.findFirst({
      where: { firstName: 'Seed', lastName: 'Manager' },
    });
    expect(target).not.toBeNull();
    expect(managerRow).not.toBeNull();

    const manager = await login(srv, 'seed.manager@leanmgmt.local', 'ManagerPass123!@#');

    const start = await srv.inject({
      method: 'POST',
      url: '/api/v1/auth/impersonate/start',
      headers: {
        authorization: `Bearer ${manager.accessToken}`,
        cookie: manager.cookieHeader,
        'x-csrf-token': manager.csrfToken,
        'content-type': 'application/json',
      },
      payload: JSON.stringify({ targetUserId: target!.id }),
    });
    expect(start.statusCode).toBe(200);
    const startJson = JSON.parse(start.body) as {
      data: { accessToken: string; csrfToken: string };
    };

    const startedLog = await prisma.auditLog.findFirst({
      where: { action: 'IMPERSONATION_STARTED', userId: managerRow!.id },
      orderBy: { timestamp: 'desc' },
    });
    expect(startedLog).not.toBeNull();
    expect(startedLog!.entity).toBe('session');
    expect(startedLog!.metadata).toMatchObject({
      targetUserId: target!.id,
      targetDisplayName: 'Rıza Bekleyen',
    });

    const stop = await srv.inject({
      method: 'POST',
      url: '/api/v1/auth/impersonate/stop',
      headers: {
        authorization: `Bearer ${startJson.data.accessToken}`,
        cookie: manager.cookieHeader,
        'x-csrf-token': startJson.data.csrfToken,
      },
    });
    expect(stop.statusCode).toBe(200);

    const stoppedLog = await prisma.auditLog.findFirst({
      where: { action: 'IMPERSONATION_STOPPED', userId: managerRow!.id },
      orderBy: { timestamp: 'desc' },
    });
    expect(stoppedLog).not.toBeNull();
    expect(stoppedLog!.metadata).toMatchObject({
      targetUserId: target!.id,
    });
  });

  it('impersonation altında mutating aksiyon — audit userId impersonator + isImpersonation metadata', async () => {
    const srv = app.getHttpAdapter().getInstance();
    const prisma = app.get(PrismaService);

    const target = await prisma.user.findFirst({
      where: { firstName: 'Rıza', lastName: 'Bekleyen' },
    });
    const managerRow = await prisma.user.findFirst({
      where: { firstName: 'Seed', lastName: 'Manager' },
    });
    const patchTarget = await prisma.user.findFirst({
      where: { firstName: 'Proc', lastName: 'Only' },
    });
    const publishedConsent = await prisma.consentVersion.findFirst({
      where: { status: 'PUBLISHED' },
    });
    expect(target).not.toBeNull();
    expect(managerRow).not.toBeNull();
    expect(patchTarget).not.toBeNull();
    expect(publishedConsent).not.toBeNull();

    await prisma.user.update({ where: { id: patchTarget!.id }, data: { isActive: true } });
    await prisma.user.update({ where: { id: target!.id }, data: { isActive: true } });
    await ensureUserConsent(prisma, target!.id, publishedConsent!.id);

    const manager = await login(srv, 'seed.manager@leanmgmt.local', 'ManagerPass123!@#');

    const start = await srv.inject({
      method: 'POST',
      url: '/api/v1/auth/impersonate/start',
      headers: {
        authorization: `Bearer ${manager.accessToken}`,
        cookie: manager.cookieHeader,
        'x-csrf-token': manager.csrfToken,
        'content-type': 'application/json',
      },
      payload: JSON.stringify({ targetUserId: target!.id }),
    });
    expect(start.statusCode).toBe(200);
    const startJson = JSON.parse(start.body) as {
      data: { accessToken: string; csrfToken: string };
    };

    const patch = await srv.inject({
      method: 'PATCH',
      url: `/api/v1/users/${patchTarget!.id}`,
      headers: {
        authorization: `Bearer ${startJson.data.accessToken}`,
        cookie: manager.cookieHeader,
        'x-csrf-token': startJson.data.csrfToken,
        'content-type': 'application/json',
      },
      payload: JSON.stringify({ firstName: 'ProcUpdated' }),
    });
    expect(patch.statusCode).toBe(200);

    const mutatingLog = await prisma.auditLog.findFirst({
      where: {
        action: 'UPDATE_USER_ATTRIBUTE',
        userId: managerRow!.id,
        entityId: patchTarget!.id,
      },
      orderBy: { timestamp: 'desc' },
    });
    expect(mutatingLog).not.toBeNull();
    expect(mutatingLog!.metadata).toMatchObject({
      isImpersonation: true,
      impersonatedUserId: target!.id,
      impersonatedUserDisplayName: 'Rıza Bekleyen',
    });
  });

  it('impersonate/start CSRF header yok → 403', async () => {
    const srv = app.getHttpAdapter().getInstance();
    const prisma = app.get(PrismaService);
    const target = await prisma.user.findFirst({ where: { firstName: 'E2E', lastName: 'Hedef' } });
    expect(target).not.toBeNull();

    const manager = await login(srv, 'seed.manager@leanmgmt.local', 'ManagerPass123!@#');

    const res = await srv.inject({
      method: 'POST',
      url: '/api/v1/auth/impersonate/start',
      headers: {
        authorization: `Bearer ${manager.accessToken}`,
        cookie: manager.cookieHeader,
        'content-type': 'application/json',
      },
      payload: JSON.stringify({ targetUserId: target!.id }),
    });
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).error.code).toBe('CSRF_TOKEN_INVALID');
  });

  it('start/switch rate limit — 11. istek 429', async () => {
    const srv = app.getHttpAdapter().getInstance();
    const prisma = app.get(PrismaService);
    const targetA = await prisma.user.findFirst({ where: { firstName: 'E2E', lastName: 'Hedef' } });
    const targetB = await prisma.user.findFirst({
      where: { firstName: 'Rıza', lastName: 'Bekleyen' },
    });
    expect(targetA).not.toBeNull();
    expect(targetB).not.toBeNull();
    await prisma.user.update({ where: { id: targetA!.id }, data: { isActive: true } });
    await prisma.user.update({ where: { id: targetB!.id }, data: { isActive: true } });

    const manager = await login(srv, 'seed.manager@leanmgmt.local', 'ManagerPass123!@#');

    let accessToken = manager.accessToken;
    let csrfToken = manager.csrfToken;
    const targets = [targetA!.id, targetB!.id];

    for (let i = 0; i < 10; i += 1) {
      const targetUserId = targets[i % 2]!;
      const path = i === 0 ? '/api/v1/auth/impersonate/start' : '/api/v1/auth/impersonate/switch';
      const res = await srv.inject({
        method: 'POST',
        url: path,
        headers: {
          authorization: `Bearer ${accessToken}`,
          cookie: manager.cookieHeader,
          'x-csrf-token': csrfToken,
          'content-type': 'application/json',
        },
        payload: JSON.stringify({ targetUserId }),
      });
      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body) as {
        data: { accessToken: string; csrfToken: string };
      };
      accessToken = json.data.accessToken;
      csrfToken = json.data.csrfToken;
    }

    const limited = await srv.inject({
      method: 'POST',
      url: '/api/v1/auth/impersonate/switch',
      headers: {
        authorization: `Bearer ${accessToken}`,
        cookie: manager.cookieHeader,
        'x-csrf-token': csrfToken,
        'content-type': 'application/json',
      },
      payload: JSON.stringify({ targetUserId: targetA!.id }),
    });
    expect(limited.statusCode).toBe(429);

    await srv.inject({
      method: 'POST',
      url: '/api/v1/auth/impersonate/stop',
      headers: {
        authorization: `Bearer ${accessToken}`,
        cookie: manager.cookieHeader,
        'x-csrf-token': csrfToken,
      },
    });
  });
});
