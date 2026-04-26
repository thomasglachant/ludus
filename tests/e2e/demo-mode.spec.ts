import { expect, test, type Page } from '@playwright/test';

const enabledBaseUrl = process.env.E2E_DEMO_ENABLED_BASE_URL ?? 'http://127.0.0.1:4173';
const disabledBaseUrl = process.env.E2E_DEMO_DISABLED_BASE_URL ?? 'http://127.0.0.1:4174';
const baseBuildingIds = [
  'domus',
  'canteen',
  'dormitory',
  'trainingGround',
  'pleasureHall',
  'infirmary',
];

async function openFresh(page: Page, url: string) {
  await page.goto(new URL(url).origin);
  await page.evaluate(() => localStorage.clear());
  await page.goto(url);
}

test('creates a new game and opens the map-first shell with owned level 1 buildings', async ({
  page,
}) => {
  await openFresh(page, disabledBaseUrl);
  await page.getByTestId('main-menu-new-game').click();

  await expect(page.getByTestId('new-game-screen')).toBeVisible();
  await page.getByTestId('new-game-owner-name').fill('Aulus');
  await page.getByTestId('new-game-ludus-name').fill('Ludus Primus');
  await page.getByTestId('new-game-submit').click();

  await expect(page.getByTestId('map-container')).toBeVisible();

  for (const buildingId of baseBuildingIds) {
    const building = page.getByTestId(`map-building-${buildingId}`);

    await expect(building).toBeVisible();
    await expect(building).toHaveAttribute('data-building-purchased', 'true');
    await expect(building).toHaveAttribute('data-building-level', '1');
  }
});

test('plays the MVP smoke path through market, save, load and arena access', async ({ page }) => {
  await openFresh(page, disabledBaseUrl);
  await page.getByTestId('main-menu-new-game').click();

  await page.getByTestId('new-game-owner-name').fill('Aulus');
  await page.getByTestId('new-game-ludus-name').fill('Ludus Primus');
  await page.getByTestId('new-game-submit').click();

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(
    page.getByText(/No gladiators yet\.|Aucun gladiateur pour le moment\./),
  ).toBeVisible();

  await page.getByTestId('navigation-market').click();
  await expect(page.getByTestId('market-modal')).toBeVisible();
  await expect(page.locator('[data-testid^="market-candidate-"]')).toHaveCount(5);
  await expect(page.getByTestId('market-empty-owned')).toBeVisible();

  await page.getByTestId('market-buy-market-1-1-1').click();

  await expect(page.getByTestId('market-owned-market-1-1-1')).toBeVisible();
  await expect(page.locator('[data-testid^="market-candidate-"]')).toHaveCount(4);
  await expect(page.getByTestId('market-capacity-full-state')).toBeVisible();

  await page.getByRole('button', { name: /Close|Fermer/ }).click();
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('gladiator-card-market-1-1-1')).toBeVisible();
  await expect(page.getByTestId('save-status')).toHaveCount(0);

  await page.getByTestId('topbar-save-button').click();
  await expect(page.getByTestId('save-status')).toHaveCount(0);

  await page.getByTestId('topbar-menu-button').click();
  await page.getByTestId('main-menu-load-game').click();
  await expect(page.locator('[data-testid^="local-save-card-"]')).toHaveCount(1);
  await page.locator('[data-testid^="local-load-button-"]').first().click();

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('gladiator-card-market-1-1-1')).toBeVisible();

  await page.getByTestId('navigation-arena').click();
  await expect(page.getByTestId('arena-panel')).toBeVisible();
});

test('demo mode is visible when enabled', async ({ page }) => {
  await openFresh(page, enabledBaseUrl);
  await page.getByTestId('main-menu-load-game').click();

  await expect(page.getByTestId('load-game-screen')).toBeVisible();
  await expect(page.getByTestId('load-mode-demo')).toBeVisible();

  await page.getByTestId('load-mode-demo').click();

  await expect(page.getByTestId('demo-save-card-demo-early-ludus')).toBeVisible();
  await expect(page.getByTestId('demo-save-card-demo-mid-ludus')).toBeVisible();
  await expect(page.getByTestId('demo-save-card-demo-advanced-ludus')).toBeVisible();
});

test('demo mode is hidden when disabled', async ({ page }) => {
  await openFresh(page, disabledBaseUrl);
  await page.getByTestId('main-menu-load-game').click();

  await expect(page.getByTestId('load-game-screen')).toBeVisible();
  await expect(page.getByTestId('load-mode-demo')).toHaveCount(0);

  await page.goto(`${disabledBaseUrl}/dev/demo/demo-early-ludus`);

  await expect(page.getByTestId('dev-demo-unavailable')).toBeVisible();
  await expect(page.getByTestId('map-container')).toHaveCount(0);

  await page.goto(`${disabledBaseUrl}/dev/debug-dashboard`);

  await expect(page.getByTestId('debug-dashboard-unavailable')).toBeVisible();
});

test('loads the early demo directly', async ({ page }) => {
  await openFresh(page, `${enabledBaseUrl}/dev/demo/demo-early-ludus`);

  const map = page.getByTestId('map-container');
  const domus = page.getByTestId('map-building-domus');

  await expect(map).toBeVisible();
  await expect(map).toHaveAttribute('data-time-of-day', 'day');
  await expect(domus).toBeVisible();
  await expect(domus).toHaveAttribute(
    'data-asset',
    /\/assets\/pixel-art\/buildings\/domus\/level-3\/exterior\.svg/,
  );
  await expect(page.getByTestId('gladiator-list')).toBeVisible();
  await expect(page.getByTestId('gladiator-card-glad-demo-early-marcus')).toBeVisible();
  await expect(page.getByTestId('topbar-treasury')).toContainText('850');

  const demoSaveStorageValue = await page.evaluate(() =>
    localStorage.getItem('ludus:save:demo-early-ludus'),
  );

  expect(demoSaveStorageValue).toBeNull();
});

test('loads the mid demo directly', async ({ page }) => {
  await openFresh(page, `${enabledBaseUrl}/dev/demo/demo-mid-ludus`);

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('gladiator-card-glad-demo-mid-gaius')).toBeVisible();
  await expect(page.getByTestId('map-special-location-market')).toBeVisible();
  await expect(page.getByTestId('map-special-location-arena')).toBeVisible();
});

test('loads the advanced demo directly', async ({ page }) => {
  await openFresh(page, `${enabledBaseUrl}/dev/demo/demo-advanced-ludus`);

  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('gladiator-card-glad-demo-adv-maximus')).toBeVisible();
  await expect(page.getByTestId('gladiator-card-glad-demo-adv-syrianus')).toBeAttached();
  await expect(page.getByTestId('topbar-treasury')).toContainText('12 000');

  await page.getByTestId('speed-pause').click();
  await expect(page.getByTestId('topbar-time')).toContainText(/Night|Nuit/);
});

test('advances the advanced demo into Sunday arena resolution', async ({ page }) => {
  await openFresh(page, `${enabledBaseUrl}/dev/demo/demo-advanced-ludus`);

  await expect(page.getByTestId('map-container')).toBeVisible();
  await page.getByTestId('speed-x16').click();
  await expect(page.getByTestId('topbar-time')).toContainText(/Sunday|Dimanche/, {
    timeout: 15_000,
  });
  await page.getByTestId('speed-pause').click();
  await page.getByTestId('navigation-arena').click();

  await expect(page.getByTestId('arena-panel')).toBeVisible();
  await expect(page.getByTestId('arena-summary')).toBeVisible();
  await expect(page.getByTestId('arena-current-combat')).toBeVisible();
  await expect(page.getByTestId('arena-combat-log')).toBeVisible();

  await page.getByTestId('arena-open-combat-presentation').click();
  await expect(page.getByTestId('combat-screen')).toBeVisible();
  await expect(page.getByTestId('combat-stage')).toBeVisible();
  await expect(page.getByTestId('combat-screen-log')).toContainText(/Arena gates|Portes/);
  await page.getByRole('button', { name: /Advance turn|Avancer le tour/ }).click();
  await expect(page.getByTestId('combat-screen-log')).toContainText(/Turn 1|Tour 1/);
});
