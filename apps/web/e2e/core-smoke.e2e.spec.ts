import { test, expect } from '@playwright/test';

const SUPERADMIN_EMAIL = 'superadmin@leanmgmt.local';
/** auth.e2e şifre sıfırlama testi sonrası güncel şifre olabilir */
const SUPERADMIN_PASSWORDS = ['NewAdminPass456!@#', 'AdminPass123!@#'] as const;

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

async function loginAsSuperadmin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('E-posta').fill(SUPERADMIN_EMAIL);
  for (const password of SUPERADMIN_PASSWORDS) {
    await page.getByLabel('Şifre', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Giriş yap' }).click();
    try {
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 8_000 });
      return;
    } catch {
      if (password === SUPERADMIN_PASSWORDS[SUPERADMIN_PASSWORDS.length - 1]) {
        throw new Error('Superadmin girişi başarısız (bilinen şifreler denendi)');
      }
      await page.goto('/login');
      await page.getByLabel('E-posta').fill(SUPERADMIN_EMAIL);
    }
  }
}

test('çekirdek smoke: login → dashboard → users → roles → admin → profile → logout', async ({
  page,
}) => {
  await loginAsSuperadmin(page);
  await expect(page.getByText(/Lean Management platformuna hoş geldiniz/)).toBeVisible();

  await page
    .getByRole('navigation', { name: 'Ana menü' })
    .getByRole('link', { name: 'Kullanıcılar' })
    .click();
  await expect(page).toHaveURL(/\/users/);

  await page
    .getByRole('navigation', { name: 'Ana menü' })
    .getByRole('link', { name: 'Roller' })
    .click();
  await expect(page).toHaveURL(/\/roles/);

  await page
    .getByRole('navigation', { name: 'Ana menü' })
    .getByRole('link', { name: 'Yönetim' })
    .click();
  await expect(page).toHaveURL(/\/admin/);

  await page.goto('/admin/audit-logs');
  await expect(page).toHaveURL(/\/admin\/audit-logs/);

  await page.goto('/admin/system-settings');
  await expect(page).toHaveURL(/\/admin\/system-settings/);

  await page.goto('/profile');
  await expect(page).toHaveURL(/\/profile/);

  await page.getByRole('button', { name: 'Çıkış' }).click();
  await expect(page).toHaveURL(/\/login/);
});
