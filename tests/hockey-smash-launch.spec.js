const { test, expect } = require('@playwright/test');

test('Hockey Smash launches into a full viewport canvas game', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Hockey Slash 2');
  await expect(page.locator('.hockey-splash__tagline')).toHaveText("He's back with a vengance!");
  await expect(page.locator('.hockey-splash__hero')).toHaveAttribute('src', 'assets/hockey-smash/sprites/splash.png');
  await expect(page.locator('#hockey-build-badge')).toContainText('Hockey Smash v0.5.7 · Build 2026-06-29.4');
  await expect(page.locator('#hockey-watch')).toHaveAttribute('href', '?computerMode=1');
  await expect(page.locator('#hockey-watch')).toHaveText('Watch Computer Play');
  await expect(page.locator('.hockey-version')).toHaveCount(0);
  await page.locator('#hockey-play').click();
  await expect(page.locator('#hockey-transition')).toContainText('Entering Hockey Smash');
  await expect(page.locator('#hockey-game')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('.hockey-hud__title span')).toHaveText('Survive the salmon run');
  await expect(page.locator('#hockey-debug')).toBeHidden();
  await expect(page.locator('#hockey-player-overlay')).toBeVisible();
  await expect(page.locator('.hockey-player-overlay__sprite')).toHaveAttribute('src', 'assets/hockey-smash/sprites/hockey-player.png');
  await expect(page.locator('.hockey-player-overlay__label')).toHaveText('DANIEL');

  const state = await page.evaluate(() => window.RTA_HOCKEY_SMASH.getState());
  const version = await page.evaluate(() => window.RTA_HOCKEY_SMASH.getVersion());
  const bodyLocked = await page.evaluate(() => document.body.classList.contains('hockey-playing'));
  const overlayBox = await page.locator('#hockey-player-overlay').boundingBox();

  expect(version).toBe('Hockey Smash v0.5.7');
  expect(state.mode).toBe('playing');
  expect(state.player.health).toBe(100);
  expect(bodyLocked).toBe(true);
  expect(overlayBox?.width).toBeGreaterThan(80);
  expect(overlayBox?.height).toBeGreaterThan(100);

  const startX = state.player.x;
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(220);
  await page.keyboard.up('ArrowRight');
  const rightX = await page.evaluate(() => window.RTA_HOCKEY_SMASH.getState().player.x);
  expect(rightX).toBeGreaterThan(startX);

  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(220);
  await page.keyboard.up('ArrowLeft');
  const leftX = await page.evaluate(() => window.RTA_HOCKEY_SMASH.getState().player.x);
  expect(leftX).toBeLessThan(rightX);

  expect(consoleErrors).toEqual([]);
});

test('Computer Play is a player-facing watch mode without debug by default', async ({ page }) => {
  await page.goto('/?computerMode=1');
  await expect(page.locator('#hockey-build-badge')).toContainText('Hockey Smash v0.5.7 · Build 2026-06-29.4');
  await expect(page.locator('#hockey-game')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.hockey-autoplay-panel')).toContainText('Watch mode is active');
  await expect(page.locator('#hockey-debug')).toBeHidden();
  await expect(page.locator('#hockey-player-overlay')).toBeVisible();

  const computerEnabled = await page.evaluate(() => window.RTA_HOCKEY_SMASH.getState().computer.enabled);
  const version = await page.evaluate(() => window.RTA_HOCKEY_SMASH.getVersion());

  expect(computerEnabled).toBe(true);
  expect(version).toBe('Hockey Smash v0.5.7');
});
