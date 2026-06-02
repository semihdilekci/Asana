import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

const MANAGER_EMAIL = 'seed.manager@leanmgmt.local';
const MANAGER_PASSWORD = 'ManagerPass123!@#';
const NO_IMPERSONATION_EMAIL = 'integration_process@leanmgmt.local';
const NO_IMPERSONATION_PASSWORD = 'OnlyProc123!@#';
const SUPERADMIN_EMAIL = 'superadmin@leanmgmt.local';
const SUPERADMIN_PASSWORDS = ['NewAdminPass456!@#', 'AdminPass123!@#'] as const;

const IMPERSONATION_TARGET_SEARCH = 'E2E';
const PROC_USER_SEARCH = 'Proc';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

type ApiAuth = {
  accessToken: string;
  csrfToken: string;
  cookie: string;
};

function parseSetCookie(setCookie: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!setCookie) return out;
  for (const part of setCookie.split(/,(?=\s*\w+=)/)) {
    const [pair] = part.split(';');
    const eq = pair.indexOf('=');
    if (eq === -1) continue;
    out[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
  return out;
}

async function apiLogin(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<ApiAuth> {
  const res = await request.post('/api/v1/auth/login', {
    data: { email, password },
  });
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as {
    success: boolean;
    data: { accessToken: string; csrfToken: string };
  };
  const cookies = parseSetCookie(res.headers()['set-cookie']);
  return {
    accessToken: body.data.accessToken,
    csrfToken: body.data.csrfToken,
    cookie: `refresh_token=${cookies.refresh_token ?? ''}; csrf_token=${cookies.csrf_token ?? ''}`,
  };
}

function authHeaders(auth: ApiAuth, includeCsrf = true): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${auth.accessToken}`,
    Cookie: auth.cookie,
  };
  if (includeCsrf) {
    headers['X-CSRF-Token'] = auth.csrfToken;
  }
  return headers;
}

async function findUserIdBySearch(
  request: APIRequestContext,
  auth: ApiAuth,
  search: string,
): Promise<string> {
  const res = await request.get('/api/v1/users', {
    headers: authHeaders(auth),
    params: { search, limit: 5, isActive: 'true' },
  });
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as {
    success: boolean;
    data: { items: Array<{ id: string }> };
  };
  const id = body.data.items[0]?.id;
  expect(id).toBeTruthy();
  return id!;
}

async function loginInBrowser(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('E-posta').fill(email);
  await page.getByLabel('Şifre', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Giriş yap' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function loginSuperadminInBrowser(page: Page): Promise<void> {
  for (const password of SUPERADMIN_PASSWORDS) {
    await page.goto('/login');
    await page.getByLabel('E-posta').fill(SUPERADMIN_EMAIL);
    await page.getByLabel('Şifre', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Giriş yap' }).click();
    try {
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
      return;
    } catch {
      /* auth.e2e şifre sıfırlama sonrası yeni şifre denenir */
    }
  }
  throw new Error('Superadmin girişi başarısız');
}

test('USER_IMPERSONATION yokken header ismi tıklanamaz', async ({ page }) => {
  await loginInBrowser(page, NO_IMPERSONATION_EMAIL, NO_IMPERSONATION_PASSWORD);
  const headerName = page.locator('header').getByText('Proc Only', { exact: true });
  await expect(headerName).toBeVisible();
  expect(await headerName.evaluate((el) => el.tagName)).toBe('SPAN');
  await expect(page.getByRole('button', { name: 'Proc Only' })).toHaveCount(0);
});

test('API: yetkisiz kullanıcı impersonate start 403', async ({ request }) => {
  const managerAuth = await apiLogin(request, MANAGER_EMAIL, MANAGER_PASSWORD);
  const targetId = await findUserIdBySearch(request, managerAuth, IMPERSONATION_TARGET_SEARCH);
  const noPermAuth = await apiLogin(request, NO_IMPERSONATION_EMAIL, NO_IMPERSONATION_PASSWORD);
  const res = await request.post('/api/v1/auth/impersonate/start', {
    headers: authHeaders(noPermAuth),
    data: { targetUserId: targetId },
  });
  expect(res.status()).toBe(403);
  const body = (await res.json()) as { error: { code: string } };
  expect(body.error.code).toBe('PERMISSION_DENIED');
});

test('API: impersonate start CSRF header yok → 403', async ({ request }) => {
  const auth = await apiLogin(request, MANAGER_EMAIL, MANAGER_PASSWORD);
  const targetId = await findUserIdBySearch(request, auth, IMPERSONATION_TARGET_SEARCH);
  const res = await request.post('/api/v1/auth/impersonate/start', {
    headers: authHeaders(auth, false),
    data: { targetUserId: targetId },
  });
  expect(res.status()).toBe(403);
  const body = (await res.json()) as { error: { code: string } };
  expect(body.error.code).toBe('CSRF_TOKEN_INVALID');
});

test('API: kendisi ve superadmin hedefi reddedilir', async ({ request }) => {
  const managerAuth = await apiLogin(request, MANAGER_EMAIL, MANAGER_PASSWORD);
  const meRes = await request.get('/api/v1/auth/me', {
    headers: authHeaders(managerAuth),
  });
  expect(meRes.ok()).toBeTruthy();
  const meBody = (await meRes.json()) as { data: { id: string } };
  const managerId = meBody.data.id;

  const superAuth = await apiLogin(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORDS[1]);
  const superMeRes = await request.get('/api/v1/auth/me', {
    headers: authHeaders(superAuth),
  });
  if (!superMeRes.ok()) {
    const fallback = await apiLogin(request, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORDS[0]);
    const fallbackMe = await request.get('/api/v1/auth/me', {
      headers: authHeaders(fallback),
    });
    expect(fallbackMe.ok()).toBeTruthy();
    const superId = ((await fallbackMe.json()) as { data: { id: string } }).data.id;

    const selfRes = await request.post('/api/v1/auth/impersonate/start', {
      headers: authHeaders(managerAuth),
      data: { targetUserId: managerId },
    });
    expect(selfRes.status()).toBe(403);
    expect(((await selfRes.json()) as { error: { code: string } }).error.code).toBe(
      'AUTH_IMPERSONATION_FORBIDDEN',
    );

    const superRes = await request.post('/api/v1/auth/impersonate/start', {
      headers: authHeaders(managerAuth),
      data: { targetUserId: superId },
    });
    expect(superRes.status()).toBe(403);
    expect(((await superRes.json()) as { error: { code: string } }).error.code).toBe(
      'AUTH_IMPERSONATION_FORBIDDEN',
    );
    return;
  }

  const superId = ((await superMeRes.json()) as { data: { id: string } }).data.id;

  const selfRes = await request.post('/api/v1/auth/impersonate/start', {
    headers: authHeaders(managerAuth),
    data: { targetUserId: managerId },
  });
  expect(selfRes.status()).toBe(403);

  const superRes = await request.post('/api/v1/auth/impersonate/start', {
    headers: authHeaders(managerAuth),
    data: { targetUserId: superId },
  });
  expect(superRes.status()).toBe(403);
});

test('tam impersonation akışı: start → mutating → audit badge → stop', async ({
  page,
  request,
}) => {
  await loginInBrowser(page, MANAGER_EMAIL, MANAGER_PASSWORD);
  await expect(page.getByRole('button', { name: 'Seed Manager' })).toBeVisible();

  await page.getByRole('button', { name: 'Seed Manager' }).click();
  await expect(page.getByRole('dialog', { name: 'Kullanıcı adına oturum aç' })).toBeVisible();
  await page.getByLabel('Kullanıcı ara').fill(IMPERSONATION_TARGET_SEARCH);

  const procUserId = await findUserIdBySearch(
    request,
    await apiLogin(request, MANAGER_EMAIL, MANAGER_PASSWORD),
    PROC_USER_SEARCH,
  );

  const [startResponse] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().includes('/api/v1/auth/impersonate/start') &&
        r.request().method() === 'POST' &&
        r.status() === 200,
    ),
    page.getByRole('row', { name: /E2E Hedef — oturum aç/ }).click(),
  ]);

  const startBody = (await startResponse.json()) as {
    data: { accessToken: string; csrfToken: string };
  };

  await expect(page.getByRole('button', { name: 'Kendi hesabıma dön' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'E2E Hedef' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Seed Manager' })).toHaveCount(0);

  const browserCookies = await page.context().cookies();
  const refreshCookie = browserCookies.find((c) => c.name === 'refresh_token')?.value ?? '';
  const csrfCookie = browserCookies.find((c) => c.name === 'csrf_token')?.value ?? '';

  const patchRes = await page.request.patch(`/api/v1/users/${procUserId}`, {
    headers: {
      Authorization: `Bearer ${startBody.data.accessToken}`,
      'X-CSRF-Token': startBody.data.csrfToken,
      Cookie: `refresh_token=${refreshCookie}; csrf_token=${csrfCookie}`,
    },
    data: { firstName: 'ProcE2E' },
  });
  if (!patchRes.ok()) {
    const errBody = await patchRes.text();
    throw new Error(`PATCH /users failed: ${patchRes.status()} ${errBody}`);
  }

  await page.getByRole('button', { name: 'Kendi hesabıma dön' }).click();
  await expect(page.getByRole('button', { name: 'Seed Manager' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'E2E Hedef' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Çıkış' }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

  await loginSuperadminInBrowser(page);
  await page.goto('/admin/audit-logs');
  await expect(page.getByRole('heading', { name: 'Denetim kayıtları' })).toBeVisible();

  await page.getByLabel('Aksiyon').fill('UPDATE_USER_ATTRIBUTE');
  await page.getByRole('button', { name: 'Uygula' }).click();

  await expect(page.getByText('Impersonation').first()).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByText(/Seed Manager · 00000003 \(E2E Hedef · 00000010 yerine\)/),
  ).toBeVisible();
});
