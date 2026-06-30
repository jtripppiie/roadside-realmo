const { test, expect } = require('@playwright/test');

test('Hockey Smash v0.14.28 launches as a single-screen arena', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Hockey Smash');
  await expect(page.locator('#hockey-build-badge')).toContainText('Hockey Smash v0.14.28 · Build 2026-06-30.84');
  await expect(page.locator('#hockey-watch')).toHaveAttribute('href', '?computerMode=1');
  await page.locator('#hockey-play').click();
  await expect(page.locator('#hockey-game')).toBeVisible({ timeout: 6000 });
  await expect(page.locator('[data-fullscreen-toggle]').first()).toBeVisible();
  await expect(page.locator('#hockey-player-overlay')).toBeHidden();
  await expect(page.locator('.hockey-entity-layer')).toBeHidden();
  await expect(page.locator('.hockey-stage-background')).toHaveCount(0);
  await page.waitForTimeout(700);
  await expect(page.locator('.hockey-entity-overlay')).toHaveCount(0);

  const version = await page.evaluate(() => window.RTA_HOCKEY_SMASH.getVersion());
  expect(version).toBe('Hockey Smash v0.14.28');

  const normalSizing = await page.evaluate(() => {
    const state = window.RTA_HOCKEY_SMASH.getState();
    return {
      player: { width: state.player.width, height: state.player.height },
      hasIce: state.entities.some((entity) => entity?.type === 'icePatch'),
      maxSalmonWidth: Math.max(0, ...state.entities.filter((entity) => entity?.type === 'salmon').map((entity) => entity.width || 0)),
    };
  });
  expect(normalSizing.player.width).toBeLessThanOrEqual(110);
  expect(normalSizing.player.height).toBeLessThanOrEqual(112);
  expect(normalSizing.hasIce).toBe(false);
  expect(normalSizing.maxSalmonWidth).toBeLessThanOrEqual(90);

  await page.evaluate(() => {
    const state = window.RTA_HOCKEY_SMASH.getState();
    state.player.x = 822;
  });
  await page.waitForTimeout(700);
  const arena = await page.evaluate(() => {
    const state = window.RTA_HOCKEY_SMASH.getState();
    return { x: state.player.x, travelStage: state.travelStage, time: state.time };
  });
  expect(arena.travelStage || 0).toBe(0);
  expect(arena.x).toBeGreaterThan(800);
  expect(arena.x).toBeLessThanOrEqual(900);
  expect(arena.time).toBeGreaterThan(0);

  await page.evaluate(() => {
    const state = window.RTA_HOCKEY_SMASH.getState();
    state.player.x = -20;
  });
  await page.waitForTimeout(300);
  const leftEdge = await page.evaluate(() => {
    const state = window.RTA_HOCKEY_SMASH.getState();
    return { x: state.player.x, travelStage: state.travelStage };
  });
  expect(leftEdge.travelStage || 0).toBe(0);
  expect(leftEdge.x).toBeGreaterThanOrEqual(22);
  expect(leftEdge.x).toBeLessThan(80);

  await expect(page.locator('#hockey-status')).toContainText('Fish Dodge Level');

  expect(consoleErrors).toEqual([]);
});

test('Computer Play hides duplicate DOM Daniel overlay', async ({ page }) => {
  await page.goto('/?computerMode=1');
  await expect(page.locator('#hockey-build-badge')).toContainText('Hockey Smash v0.14.28 · Build 2026-06-30.84');
  await expect(page.locator('#hockey-game')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.hockey-autoplay-panel')).toContainText('Watch mode is active');

  const computerEnabled = await page.evaluate(() => window.RTA_HOCKEY_SMASH.getState().computer.enabled);
  const version = await page.evaluate(() => window.RTA_HOCKEY_SMASH.getVersion());
  const overlayHidden = await page.locator('#hockey-player-overlay').evaluate((node) => node.hidden || getComputedStyle(node).display === 'none');

  expect(computerEnabled).toBe(true);
  expect(version).toBe('Hockey Smash v0.14.28');
  expect(overlayHidden).toBe(true);
});

test('Desktop Space fires and dev shortcut spawns cast encounters', async ({ page }) => {
  await page.goto('/?debug=1');
  await page.locator('[data-character="sofie"]').click();
  await page.locator('#hockey-play').click();
  await expect(page.locator('#hockey-game')).toBeVisible({ timeout: 6000 });
  await expect(page.locator('#hockey-spawn-cast-debug')).toBeVisible();

  await page.keyboard.down('Space');
  await page.keyboard.up('Space');
  await expect(page.locator('[data-projectile-type]')).toHaveCount(1, { timeout: 2000 });

  const spawnedType = await page.evaluate(() => {
    window.RTA_HOCKEY_SMASH_CAST.spawnNow('danceInstructor');
    return window.RTA_HOCKEY_SMASH.getState().entities.find((entity) => entity.fromFinalCastPass)?.type;
  });

  expect(spawnedType).toBe('danceInstructor');
});

test('Portrait mobile layout keeps canvas and controls separated', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#hockey-play').click();
  await expect(page.locator('#hockey-game')).toBeVisible({ timeout: 6000 });

  const canvasBox = await page.locator('#hockey-canvas').boundingBox();
  const controlsBox = await page.locator('.hockey-controls').boundingBox();
  const version = await page.evaluate(() => window.RTA_HOCKEY_SMASH.getVersion());

  expect(version).toBe('Hockey Smash v0.14.28');
  expect(canvasBox?.y).toBeLessThan(180);
  expect(canvasBox?.height).toBeLessThan(260);
  expect(controlsBox?.y).toBeGreaterThan(canvasBox.y + canvasBox.height + 40);
});
