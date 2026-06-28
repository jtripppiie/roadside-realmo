# Roadside Realm QA Routes

Use this checklist for every pushed preview checkpoint. Roadside Realm is not V1.0 until these routes pass in a browser without normal-play console errors.

## Current Preview

- App version: `v0.2.2`
- Game version: `0.2.2`
- Save version: `1`
- Preview branch: `codex/roadside-realm-plan-assets`
- GitHub Pages URL: `https://jtripppiie.github.io/roadside-realmo/`
- Debug URL: `https://jtripppiie.github.io/roadside-realmo/?realmDebug=1`

## Launch Route

1. Open the Pages URL.
2. Confirm the Roadside Realm splash screen appears.
3. Confirm the visible version reads `App v0.2.2 · Roadside Realm 0.2.2`.
4. Confirm Start New Quest works.
5. Confirm the canvas renders.
6. Confirm the D-pad, action buttons, inventory, log, and objective are visible.
7. Confirm no console errors appear.

## Main Route Test

1. Start a new quest.
2. Move from the kiosk entry to the Rusty Road Key.
3. Collect the Rusty Road Key.
4. Return to the Toll Gate.
5. Unlock the Toll Gate.
6. Defeat the Dust Goblin.
7. Collect the Apple Juice Potion.
8. Defeat the Map Bat and Toll Troll.
9. Use healing if needed.
10. Fight the Signpost Ogre.
11. When Big Spin is telegraphed, step backward and confirm the log says it clips empty air.
12. Defeat the Signpost Ogre.
13. Collect the Mapstone.
14. Return to the kiosk exit.
15. Confirm the Route Restored ending appears.

## Secret Star Route Test

1. Complete the main route until the secret switch is reachable.
2. Trigger the loose map pin / secret switch.
3. Return to the moon-scratched hidden wall.
4. Open the hidden wall.
5. Confirm the player enters the Forgotten Underpass.
6. Collect the Moon Toll Token.
7. Return to the main dungeon.
8. Collect the Mapstone if not already collected.
9. Return to the kiosk exit.
10. Confirm the Secret Star Ending appears.

## Impossible Route Test

1. Enter the Forgotten Underpass with the Moon Toll Token.
2. Find the painted mansion door.
3. Enter the Never-Finished Mansion.
4. Press the stair button.
5. Collect the Blueprint Key.
6. Defeat the Blueprint Warden.
7. Unlock the Blueprint Study.
8. Collect the Star Map Fragment.
9. Return to the kiosk exit with the Mapstone.
10. Confirm the Impossible Route Ending appears.

## Hidden Conservatory Test

1. Collect the Star Map Fragment.
2. Return to the mansion wallpaper seam.
3. Enter the Hidden Conservatory.
4. Collect the Glass Rose.
5. Return to the kiosk exit with Mapstone, Moon Toll Token, Star Map Fragment, and Glass Rose.
6. Confirm the Impossible Route Ending includes the Glass Rose line.

## Debug Mode Test

1. Open the debug URL with `?realmDebug=1`.
2. Confirm the debug panel appears below the controls.
3. Confirm it shows map ID, position, facing, tile ahead, event ahead, HP, inventory, counters, flags, and ending eligibility.
4. Test Heal Player.
5. Test Give Mapstone.
6. Test Give Moon Toll Token.
7. Test Give Star Map Fragment.
8. Test Give Glass Rose.
9. Test Jump Main, Jump Underpass, Jump Mansion, Jump Boss, and Jump Exit.
10. Test Reveal Current Map.
11. Test Log State and confirm it only logs locally to the console.

## Save And Reset Test

1. Start a new quest.
2. Collect the Rusty Road Key.
3. Click Save.
4. Reload the page.
5. Confirm Continue Quest appears.
6. Continue and confirm the inventory still contains the key.
7. Enter the Underpass or Mansion and save again.
8. Reload and confirm the player returns to the saved map safely.
9. Use Reset Quest.
10. Confirm Continue Quest disappears.

## Mobile And Accessibility Test

1. Test portrait width around 375px.
2. Confirm the D-pad targets are large enough to tap.
3. Confirm no horizontal scrolling is required for the main controls.
4. Test keyboard controls on desktop.
5. Confirm the canvas has an accessible label.
6. Confirm the live status and log update outside the canvas.
7. Toggle reduced motion, high contrast, and large text.
8. Confirm controls remain readable and do not overlap.

## Current Known Gaps

- Mansion visuals need a distinct art pass.
- Blueprint Warden needs a custom sprite.
- Normal enemies need better sprite graphics.
- Browser-play QA still needs pass/fail notes.
- Service worker/cache is not added yet.
