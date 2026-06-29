const { test, expect } = require('@playwright/test');

test('Hockey Smash launches into a full viewport canvas game', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Loading...');
  await expect(page.locator('#hockey-build-badge')).toContainText('Build 2026-06-28.5');
  await expect(page.locator('.hockey-version')).toContainText('Hockey Smash v0.5.0');
  await page.locator('#hockey-play').click();
  await expect(page.locator('#hockey-transition')).toContainText('Entering Hockey Smash');
  await expect(page.locator('#hockey-game')).toBeVisible({ timeout: 4000 });

  const state = await page.evaluate(() => window.RTA_HOCKEY_SMASH.getState());
  const version = await page.evaluate(() => window.RTA_HOCKEY_SMASH.getVersion());
  const bodyLocked = await page.evaluate(() => document.body.classList.contains('hockey-playing'));

  expect(version).toBe('Hockey Smash v0.5.0');
  expect(state.mode).toBe('playing');
  expect(state.player.health).toBe(100);
  expect(bodyLocked).toBe(true);
  expect(consoleErrors).toEqual([]);
});
