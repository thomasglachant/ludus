import { expect, test } from '@playwright/test';

const enabledBaseUrl = process.env.E2E_DEMO_ENABLED_BASE_URL ?? 'http://127.0.0.1:4173';
const disabledBaseUrl = process.env.E2E_DEMO_DISABLED_BASE_URL ?? 'http://127.0.0.1:4174';

test('demo mode is visible when enabled', async ({ page }) => {
  await page.goto(enabledBaseUrl);
  await page.getByTestId('main-menu-load-game').click();

  await expect(page.getByTestId('load-game-screen')).toBeVisible();
  await expect(page.getByTestId('load-mode-demo')).toBeVisible();

  await page.getByTestId('load-mode-demo').click();

  await expect(page.getByTestId('demo-save-card-demo-early-ludus')).toBeVisible();
  await expect(page.getByTestId('demo-save-card-demo-mid-ludus')).toBeVisible();
  await expect(page.getByTestId('demo-save-card-demo-advanced-ludus')).toBeVisible();
});

test('demo mode is hidden when disabled', async ({ page }) => {
  await page.goto(disabledBaseUrl);
  await page.getByTestId('main-menu-load-game').click();

  await expect(page.getByTestId('load-game-screen')).toBeVisible();
  await expect(page.getByTestId('load-mode-demo')).toHaveCount(0);

  await page.goto(`${disabledBaseUrl}/dev/demo/demo-early-ludus`);

  await expect(page.getByTestId('dev-demo-unavailable')).toBeVisible();
  await expect(page.getByTestId('map-container')).toHaveCount(0);
});

test('loads the early demo directly', async ({ page }) => {
  await page.goto(`${enabledBaseUrl}/dev/demo/demo-early-ludus`);

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('map-building-domus')).toBeVisible();
  await expect(page.getByTestId('gladiator-list')).toBeVisible();
  await expect(page.getByTestId('gladiator-card-glad-demo-early-marcus')).toBeVisible();
  await expect(page.getByTestId('topbar-treasury')).toContainText('850');

  const demoSaveStorageValue = await page.evaluate(() =>
    localStorage.getItem('ludus:save:demo-early-ludus'),
  );

  expect(demoSaveStorageValue).toBeNull();
});

test('loads the mid demo directly', async ({ page }) => {
  await page.goto(`${enabledBaseUrl}/dev/demo/demo-mid-ludus`);

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('gladiator-card-glad-demo-mid-gaius')).toBeVisible();
  await expect(page.getByTestId('map-special-location-market')).toBeVisible();
  await expect(page.getByTestId('map-special-location-arena')).toBeVisible();
});

test('loads and resets the advanced demo directly', async ({ page }) => {
  await page.goto(`${enabledBaseUrl}/dev/demo/demo-advanced-ludus`);

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('gladiator-card-glad-demo-adv-maximus')).toBeVisible();
  await expect(page.getByTestId('gladiator-card-glad-demo-adv-felix')).toBeVisible();
  await expect(page.getByTestId('topbar-treasury')).toContainText('12000');

  await page.getByRole('button', { name: 'x1', exact: true }).click();
  await expect(page.getByTestId('topbar-time')).toContainText('18:30');
  await page.getByText(/Reset demo|Réinitialiser la démo/).click();

  await expect(page.getByTestId('topbar-treasury')).toContainText('12000');
  await expect(page.getByTestId('topbar-time')).toContainText('18:30');
});
