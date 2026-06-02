import { test, expect } from '@playwright/test';

const SUPERADMIN_EMAIL = 'superadmin@leanmgmt.local';
const SUPERADMIN_PASSWORD = 'AdminPass123!@#';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

async function loginAsSuperadmin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('E-posta').fill(SUPERADMIN_EMAIL);
  await page.getByLabel('Şifre', { exact: true }).fill(SUPERADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Giriş yap' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test('sidebar: görevler sayfasına geçiş', async ({ page }) => {
  await loginAsSuperadmin(page);
  await page
    .getByRole('navigation', { name: 'Ana menü' })
    .getByRole('link', { name: 'Görevlerim' })
    .click();
  await expect(page).toHaveURL(/\/tasks/);
  await expect(
    page.getByRole('navigation', { name: 'Ana menü' }).getByRole('link', { name: 'Görevlerim' }),
  ).toHaveClass(/bg-brand-600/);
});

test('sidebar: kullanıcılar listesi', async ({ page }) => {
  await loginAsSuperadmin(page);
  await page
    .getByRole('navigation', { name: 'Ana menü' })
    .getByRole('link', { name: 'Kullanıcılar' })
    .click();
  await expect(page).toHaveURL(/\/users/);
});

test('oturumsuz /dashboard login yönlendirmesi', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});
