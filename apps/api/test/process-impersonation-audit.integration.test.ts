import { execSync } from 'node:child_process';
import path from 'node:path';

import cookie from '@fastify/cookie';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AssignmentMode } from '@leanmgmt/prisma-client';

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
    data: { accessToken: string; csrfToken: string };
  };
  const cookies = parseSetCookie(res.headers['set-cookie']);
  return {
    accessToken: json.data.accessToken,
    csrfToken: json.data.csrfToken,
    cookieHeader: `refresh_token=${cookies.refresh_token}; csrf_token=${cookies.csrf_token}`,
  };
}

describe('Process/task audit under impersonation', () => {
  let pg: StartedPostgreSqlContainer;
  let redis: StartedTestContainer;
  let app: NestFastifyApplication;
  const apiDir = path.join(__dirname, '..');

  beforeAll(async () => {
    pg = await new PostgreSqlContainer('postgres:16-alpine').start();
    redis = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start();

    const env = {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: pg.getConnectionUri(),
      REDIS_URL: `redis://${redis.getHost()}:${redis.getMappedPort(6379)}`,
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

  it('impersonation altında iptal ve görev tamamlama audit + UI alanları', async () => {
    const srv = app.getHttpAdapter().getInstance();
    const prisma = app.get(PrismaService);

    const managerRow = await prisma.user.findFirst({
      where: { firstName: 'Seed', lastName: 'Manager' },
    });
    const processManagerRole = await prisma.role.findFirst({
      where: { code: 'PROCESS_MANAGER' },
    });
    const procOnlyAssignment = await prisma.userRole.findFirst({
      where: { roleId: processManagerRole!.id },
      include: { user: { select: { id: true } } },
    });
    const procOnly = procOnlyAssignment?.user ?? null;
    const company = await prisma.company.findFirst();
    expect(managerRow).not.toBeNull();
    expect(procOnly).not.toBeNull();
    expect(company).not.toBeNull();

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
      payload: JSON.stringify({ targetUserId: procOnly!.id }),
    });
    expect(start.statusCode).toBe(200);
    const startJson = JSON.parse(start.body) as {
      data: { accessToken: string; csrfToken: string };
    };

    const authHeaders = {
      authorization: `Bearer ${startJson.data.accessToken}`,
      cookie: manager.cookieHeader,
      'x-csrf-token': startJson.data.csrfToken,
      'content-type': 'application/json',
    };

    const seqRows = await prisma.$queryRaw<[{ n: bigint }]>`
      SELECT nextval('process_seq_before_after_kaizen') AS n
    `;
    const cancelN = seqRows[0].n;
    const cancelDisplayId = `KTI-${String(cancelN).padStart(6, '0')}`;
    const cancelProc = await prisma.process.create({
      data: {
        processNumber: cancelN,
        processType: 'BEFORE_AFTER_KAIZEN',
        displayId: cancelDisplayId,
        startedByUserId: procOnly!.id,
        companyId: company!.id,
        status: 'IN_PROGRESS',
      },
    });
    const cancelTask = await prisma.task.create({
      data: {
        processId: cancelProc.id,
        stepKey: 'KTI_MANAGER_APPROVAL',
        stepOrder: 2,
        assignmentMode: AssignmentMode.SINGLE,
        status: 'PENDING',
      },
    });
    await prisma.taskAssignment.create({
      data: { taskId: cancelTask.id, userId: procOnly!.id, status: 'PENDING' },
    });

    const cancel = await srv.inject({
      method: 'POST',
      url: `/api/v1/processes/${cancelDisplayId}/cancel`,
      headers: authHeaders,
      payload: JSON.stringify({ reason: 'Integration test iptal gerekçesi yeterli uzunlukta' }),
    });
    expect(cancel.statusCode).toBe(204);

    const cancelLog = await prisma.auditLog.findFirst({
      where: { action: 'CANCEL_PROCESS', userId: managerRow!.id, entityId: cancelProc.id },
      orderBy: { timestamp: 'desc' },
    });
    expect(cancelLog).not.toBeNull();
    expect(cancelLog!.metadata).toMatchObject({ isImpersonation: true });

    const seqRows2 = await prisma.$queryRaw<[{ n: bigint }]>`
      SELECT nextval('process_seq_before_after_kaizen') AS n
    `;
    const completeN = seqRows2[0].n;
    const completeDisplayId = `KTI-${String(completeN).padStart(6, '0')}`;
    const completeProc = await prisma.process.create({
      data: {
        processNumber: completeN,
        processType: 'BEFORE_AFTER_KAIZEN',
        displayId: completeDisplayId,
        startedByUserId: procOnly!.id,
        companyId: company!.id,
        status: 'IN_PROGRESS',
      },
    });
    const approvalTask = await prisma.task.create({
      data: {
        processId: completeProc.id,
        stepKey: 'KTI_MANAGER_APPROVAL',
        stepOrder: 2,
        assignmentMode: AssignmentMode.SINGLE,
        status: 'PENDING',
      },
    });
    await prisma.taskAssignment.create({
      data: { taskId: approvalTask.id, userId: procOnly!.id, status: 'PENDING' },
    });

    const complete = await srv.inject({
      method: 'POST',
      url: `/api/v1/tasks/${approvalTask.id}/complete`,
      headers: authHeaders,
      payload: JSON.stringify({
        action: 'APPROVE',
        formData: { comment: 'Onay integration test' },
      }),
    });
    expect(complete.statusCode).toBe(200);

    const completeLog = await prisma.auditLog.findFirst({
      where: { action: 'COMPLETE_TASK', userId: managerRow!.id, entityId: approvalTask.id },
      orderBy: { timestamp: 'desc' },
    });
    expect(completeLog).not.toBeNull();
    expect(completeLog!.metadata).toMatchObject({
      isImpersonation: true,
      impersonatedUserId: procOnly!.id,
    });

    const completedTask = await prisma.task.findUnique({ where: { id: approvalTask.id } });
    expect(completedTask?.actionContext).toMatchObject({ actorUserId: managerRow!.id });

    const detail = await srv.inject({
      method: 'GET',
      url: `/api/v1/processes/${completeDisplayId}`,
      headers: { authorization: `Bearer ${startJson.data.accessToken}` },
    });
    expect(detail.statusCode).toBe(200);
    const detailJson = JSON.parse(detail.body) as {
      data: {
        tasks: Array<{
          stepKey: string;
          performedViaImpersonation?: boolean;
          performerDisplayLabel?: string;
        }>;
      };
    };
    const managerTask = detailJson.data.tasks.find((t) => t.stepKey === 'KTI_MANAGER_APPROVAL');
    expect(managerTask?.performedViaImpersonation).toBe(true);
    expect(managerTask?.performerDisplayLabel).toContain('yerine');
  });
});
