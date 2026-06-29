const { test, expect } = require('@playwright/test');

test('Hockey Smash v0.9 launches with player and entity overlay support', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Hockey Slash 2');
  await expect(page.locator('#hockey-build-badge')).toContainText('Hockey Smash v0.9.0 · Build 2026-06-29.11');
  await expect(page.locator('[data-fullscreen-toggle]').first()).toBeVisible();
  await expect(page.locator('#hockey-watch')).toHaveAttribute('href', '?computerMode=1');
  await page.locator('#hockey-play').click();
  await expect(page.locator('#hockey-game')).toBeVisible({ timeout: 4000 });
  await expect(page.locator('#hockey-player-overlay')).toBeVisible();
  await expect(page.locator('.hockey-entity-layer')).toHaveCount(1);

  const version = await page.evaluate(() => window.RTA_HOCKEY_SMASH.getVersion());
  const bodyLocked = await page.evaluate(() => document.body.classList.contains('hockey-playing'));
  const overlayBox = await page.locator('#hockey-player-overlay').boundingBox();

  expect(version).toBe('Hockey Smash v0.9.0');
  expect(bodyLocked).toBe(true);
  expect(overlayBox?.width).toBeGreaterThan(40);
  expect(overlayBox?.height).toBeGreaterThan(50);

  const beforeJumpTop = overlayBox.y;
  await page.evaluate(() => window.HOCKEY_SMASH_DPAD.jump());
  await page.waitForTimeout(120);
  const afterJumpBox = await page.locator('#hockey-player-overlay').boundingBox();
  expect(afterJumpBox?.y).toBeLessThan(beforeJumpTop);

  await page.evaluate(() => {
    const state = window.RTA_HOCKEY_SMASH.getState();
    state.entities.push({ type: 'salmon', x: 340, y: 190, width: 74, height: 42, vx: 0, hp: 1 });
    state.entities.push({ type: 'bear', x: 470, y: 360, width: 132, height: 112, vx: -1, hp: 2 });
    state.entities.push({ type: 'moose', x: 650, y: 352, width: 150, height: 120, vx: -1, hp: 3 });
    state.entities.push({ type: 'mom', x: 760, y: 376, width: 96, height: 96, vx: 0, hp: 3, bubble: 'Daniel, clean your room!' });
  });
  await page.waitForTimeout(160);
  await expect(page.locator('.hockey-entity-overlay[data-type="salmon"]')).toHaveCount(1);
  await expect(page.locator('.hockey-entity-overlay[data-type="bear"]')).toHaveCount(1);
  await expect(page.locator('.hockey-entity-overlay[data-type="moose"]')).toHaveCount(1);
  await expect(page.locator('.hockey-entity-overlay[data-type="mom"]')).toHaveCount(1);

  const beforeX = await page.evaluate(() => window.RTA_HOCKEY_SMASH.getState().player.x);
  await page.locator('[data-action="right"]').click();
  await page.waitForTimeout(260);
  const afterX = await page.evaluate(() => window.RTA_HOCKEY_SMASH.getState().player.x);
  expect(afterX).toBeGreaterThan(beforeX + 20);

  expect(consoleErrors).toEqual([]);
});

test('Computer Play remains a player-facing watch mode', async ({ page }) => {
  await page.goto('/?computerMode=1');
  await expect(page.locator('#hockey-build-badge')).toContainText('Hockey Smash v0.9.0 · Build 2026-06-29.11');
  await expect(page.locator('#hockey-game')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.hockey-autoplay-panel')).toContainText('Watch mode is active');
  await expect(page.locator('#hockey-debug')).toBeHidden();
  await expect(page.locator('#hockey-player-overlay')).toBeVisible();

  const computerEnabled = await page.evaluate(() => window.RTA_HOCKEY_SMASH.getState().computer.enabled);
  const version = await page.evaluate(() => window.RTA_HOCKEY_SMASH.getVersion());

  expect(computerEnabled).toBe(true);
  expect(version).toBe('Hockey Smash v0.9.0');
});

test('Portrait mobile layout keeps canvas and controls separated', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#hockey-play').click();
  await expect(page.locator('#hockey-game')).toBeVisible({ timeout: 4000 });

  const canvasBox = await page.locator('#hockey-canvas').boundingBox();
  const controlsBox = await page.locator('.hockey-controls').boundingBox();
  const version = await page.evaluate(() => window.RTA_HOCKEY_SMASH.getVersion());

  expect(version).toBe('Hockey Smash v0.9.0');
  expect(canvasBox?.y).toBeLessThan(180);
  expect(canvasBox?.height).toBeLessThan(260);
  expect(controlsBox?.y).toBeGreaterThan(canvasBox.y + canvasBox.height + 40);
});
