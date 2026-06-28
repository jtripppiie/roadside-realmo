# Roadside Realm QA Routes

Use this checklist for every pushed preview checkpoint. Roadside Realm is not V1.0 until these routes pass in a browser without normal-play console errors.

## Current Preview

- App version: `v0.8.0`
- Game version: `0.8.0`
- Save version: `1`
- Preview branch: `main`
- GitHub Pages URL: `https://jtripppiie.github.io/roadside-realmo/`
- Debug URL: `https://jtripppiie.github.io/roadside-realmo/?realmDebug=1`
- Computer Mode URL: `https://jtripppiie.github.io/roadside-realmo/?computerMode=1`
- Fast Computer Mode URL: `https://jtripppiie.github.io/roadside-realmo/?computerMode=1&speed=fast`
- Debug Deep Check URL: `https://jtripppiie.github.io/roadside-realmo/?computerMode=1&speed=fast&debugDeep=1`

## Launch Route

1. Open the Pages URL.
2. Confirm the Roadside Realm splash screen appears.
3. Confirm the visible version reads `App v0.8.0 · Roadside Realm 0.8.0`.
4. Confirm Start New Quest works.
5. Confirm the canvas renders.
6. Confirm the D-pad, action buttons, inventory, log, and objective are visible.
7. Confirm the DOM/CSS first-person viewport shows layered walls, floor, ceiling, far wall, grain, and vignette.
8. Confirm the party strip, room scanner, gear deck, inventory, log, and status meters update after movement.
9. Pick up an item and confirm the pickup card appears briefly.
10. Press Help and confirm the development cheatsheet overlay opens and closes.
11. Press `Ctrl` three times quickly and confirm the cheatsheet toggles.
12. Confirm Signpost Ogre and Moonlit Warden sprite art does not show green-screen backing.
13. Confirm no console errors appear.

## Computer Mode Verification

1. Open `https://jtripppiie.github.io/roadside-realmo/?computerMode=1&speed=fast`.
2. Wait for the Auto Play Verification overlay.
3. Confirm it reports `Status: PASSED`.
4. Confirm it shows zero runtime errors.
5. Confirm the status includes `Mode: real-playthrough`.
6. Confirm the pass list includes launch, initial render, forward movement, turning, scene signature change, item pickup, inspect feedback, walking to the potion, walking to the Signpost Ogre, real combat, Mapstone pickup, normal ending, HUD/scene checks, and zero runtime errors.
7. Confirm it reaches `Ending: normal`.
8. If it reports `FAILED`, copy the failed line and browser console error before continuing feature work.

## Debug Deep Check Verification

1. Open `https://jtripppiie.github.io/roadside-realmo/?computerMode=1&speed=fast&debugDeep=1`.
2. Confirm the overlay reports `Mode: debug-deep-check`.
3. Confirm it reports `Status: PASSED`.
4. Confirm it checks the Forgotten Underpass, Never-Finished Mansion, Hidden Conservatory, and Glass Rose ending.
5. Do not treat this mode as proof that the normal game is playable; Real Computer Mode is the playable-route gate.

## Local Verification Commands

Run before pushing a release-quality checkpoint:

```bash
npm run verify
```

Optional browser automation:

```bash
npm install
npm run test:browser:install
npm run test:browser
```

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

## Soldotna Wayside Route Test

1. Defeat the Signpost Ogre and collect the Mapstone.
2. Return to the blue river-route wall in the main dungeon.
3. Confirm the route blocks entry before Mapstone and opens after Mapstone.
4. Enter Soldotna Creek Wayside.
5. Defeat the Spruce Signling.
6. Collect the Midnight Sun Snack.
7. Defeat the River Current Sprite.
8. Collect the Kenai River Charm.
9. Return to the main dungeon.
10. Confirm the map, log, inventory, and score remain stable.

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
3. Confirm the D-pad stays fixed to the game viewport and does not scroll with the page.
4. Hold left and confirm the player keeps turning left.
5. Hold right and confirm the player keeps turning right.
6. Hold up and down and confirm movement repeats or reports blocked movement.
7. Confirm tapping controls does not scroll the browser page.
8. Rotate to landscape and confirm the fixed controls remain usable.
9. Confirm the canvas/viewport is not tiny, stretched, or weirdly cropped.
10. Test keyboard controls on desktop.
11. Confirm the canvas has an accessible label.
12. Confirm the live status and log update outside the canvas.
13. Toggle reduced motion, high contrast, and large text.
14. Confirm controls remain readable and do not overlap.

## Playable Controls Stabilization Route

1. Open the game without debug mode and start a new quest.
2. Use keyboard `ArrowUp/W`, `ArrowDown/S`, `ArrowLeft/A`, and `ArrowRight/D`.
3. Confirm each keyboard input updates position/facing or reports a blocked move in the visible status.
4. Open `?realmDebug=1`.
5. Confirm the debug panel shows `Last Input`.
6. Try to walk into a wall and confirm `Last Input` starts with `Blocked:`.
7. Open `?computerMode=1&speed=fast`.
8. Confirm Real Computer Mode includes D-pad/action button presence, forward movement, backward movement, left/right turning, blocked-movement feedback, scene signature, normal ending, and zero runtime errors.

## Current Known Gaps

- Mansion visuals need a distinct art pass.
- Blueprint Warden needs a custom sprite.
- Normal enemies need better sprite graphics.
- Browser-play QA still needs pass/fail notes.
- Service worker/cache is not added yet.
- Real-device mobile QA is still recommended after every pushed controls/layout change.
