# Roadside Realm Build Progress

This file tracks implementation progress so work can continue safely across sessions.

## 2026-06-28 Checkpoint: Hockey Smash v0.5.0 Pivot

The public-facing game has pivoted to **Hockey Smash v0.5.0** inside this existing repo. Roadside Realm files remain in the background as reusable infrastructure and history, but the main launch screen now presents Hockey Smash only.

Implemented:

- Replaced the public launch shell with `Hockey Smash`.
- Added visible `Hockey Smash v0.5.0` version text.
- Added Play button and 2.4-second `Entering Hockey Smash...` transition.
- Added full browser-viewport gameplay screen.
- Added 1024x576 landscape-first canvas scaling.
- Added fixed ground line at `canvasHeight * 0.60`.
- Added Daniel movement, jump, hold-to-slide speed boost, and hockey stick combo.
- Added player health bar, invincibility window, and Try Again screen.
- Added no-scroll gameplay mode through `body.hockey-playing`.
- Added bottom-left D-pad and bottom-right Jump/Slide/Stick buttons.
- Added temporary mobile portrait rotate hint.
- Added asset fallback placeholders for missing sprites and scenery.
- Added first prototype hazards: salmon, bears, moose, Mom/Sister interruption bubbles, salmon run, Dad mower intro, Dad boss, and dad joke attacks.
- Added Hockey Smash design, workflow, and dev checklist docs.
- Added static Hockey Smash verifier.

Key files:

- `index.html`
- `style.css`
- `script.js`
- `js/games/hockey-smash.js`
- `scripts/verify-hockey-smash.js`
- `docs/hockey-smash-design.md`
- `docs/hockey-smash-workflow.md`
- `docs/hockey-smash-dev-checklist.md`

Known limitations:

- Final art assets are not required yet; missing assets render as labeled placeholders.
- This is a fixed-screen prototype, not a scrolling level.
- Balance and spawn timing need real playtesting.
- Roadside Realm docs remain for historical continuity and should be cleaned up only after Hockey Smash stabilizes.

## 2026-06-28 Checkpoint: Hockey Smash Portrait And Splash Fix

Follow-up stabilization after the v0.5.0 pivot:

- Made the rotate guidance visible on the splash screen and transition screen, not only after gameplay starts.
- Tightened portrait splash spacing so the title, Play button, and rotate note are visible as an actual splash screen.
- Reworked portrait controls so Jump, Slide, and Stick stay in a compact horizontal action row instead of stacking vertically.
- Kept D-pad left/right at the bottom in portrait with smaller thumb targets.
- Updated static verification to fail if the rotate guidance is missing.

## 2026-06-28 Checkpoint: Hockey Smash Visible Build Badge

- Added a persistent top-right overlay badge: `Hockey Smash v0.5.0 · Build 2026-06-28.5`.
- The badge appears on splash, transition, gameplay, and retry screens so GitHub Pages cache state is visible without opening devtools.
- Updated static verification to fail if the visible build badge is missing or stale.

## 2026-06-28 Checkpoint: Black Loading Splash And Soldotna Backgrounds

- Replaced the fragile illustrated splash with a black loading screen that says `Loading...`.
- Kept the Play button on the loading screen so the prototype still starts intentionally.
- Wired the real 1920x1080 Soldotna cityscape backgrounds into the canvas.
- Background sequence starts with `soldotna_cityscape_background_01_1920x1080.png`, then advances through `02`, `03`, `04`, and `05` during later play/boss phases.
- Updated Hockey Smash docs and static verification to use the actual asset paths under `assets/roadside-realm/`.

## Current Branch

`codex/roadside-realm-plan-assets`

Remote tracking branch:

`origin/codex/roadside-realm-plan-assets`

GitHub default branch:

`main`

GitHub Pages deployment plan:

Use `main` as the Pages source while Roadside Realm is under active construction, per the current repo policy. Every pushed checkpoint should land on `main` so the public preview tracks the build the user is reviewing.

## 2026-06-28 Checkpoint: App Shell And First Playable Slice

Started implementing Roadside Realm as the first static playable app in this repo.

Created:

- `index.html`
- `style.css`
- `script.js`
- `js/games/roadside-realm-data.js`
- `js/games/roadside-realm.js`
- `docs/roadside-realm-progress.md`

Implemented so far:

- Visible version badge: `App v0.1.0 · Roadside Realm 0.1.0`.
- Roadside Realm game data version: `0.1.0`.
- Save wrapper version: `1`.
- Placeholder splash/title screen.
- Required credit: "Made by TripperDeeLabs."
- Options toggles for reduced motion, high contrast, large text, and sound.
- Continue/reset save visibility on splash.
- Canvas-based first-person view.
- Directional pad controls.
- Keyboard controls.
- Basic map data for Map Kiosk Dungeon and Forgotten Underpass.
- Movement, turning, collision, inspect, item pickup, healing, combat, save, reset, normal ending, and true-ending gate.
- LocalStorage save key: `rtaRoadsideRealmSave`.
- Versioned local save wrapper with backward compatibility for the first raw-state save shape.
- Load-time state normalization for bad map IDs, bad coordinates, invalid facing, and invalid HP.
- Local-only debug mode behind `?realmDebug=1`.
- Debug panel fields: version, save version, map ID, position, facing, tile/event ahead, HP, inventory, counters, flags, and ending eligibility.
- Debug buttons: heal player, give Mapstone, give Moon Toll Token, jump main, jump Underpass, jump boss, jump exit, reveal current map, reset save, and log state.
- Local debug console logging categories for movement, inspect, combat, items, map transitions, saves, loads, endings, and errors.
- Input lock around action handling to reduce accidental double processing.
- Hidden wall now transitions into the Forgotten Underpass after the secret switch opens it.

Known limitations in this checkpoint:

- Rendering is a simple first-pass canvas view, not final dungeon art.
- Signpost Ogre, Moonlit Warden, item sheet, and moon-scratch assets are wired in, but normal enemy sprites still use primitive canvas placeholders.
- Mansion add-on is documented but not implemented.
- Boss Big Spin telegraph is not implemented yet.
- Service worker does not exist yet because the repo did not have one.
- No automated tests yet.
- This is not V1.0. Keep the version at `0.1.0` until main path, hidden room, hidden layer, mansion path, endings, save/load, controls, accessibility, and QA all pass.

Validation performed:

- `node --check script.js`
- `node --check js/games/roadside-realm-data.js`
- `node --check js/games/roadside-realm.js`
- Roadside Realm data validation script for map dimensions, event bounds, item IDs, and monster IDs.
- Reachability checks for start to key, key to boss path, boss to Mapstone, secret switch to hidden wall, and Underpass entry to Moon Toll Token.
- Local HTTP smoke check on port `4173`:
  - `/` returned `200 text/html`
  - `/style.css` returned `200 text/css`
  - `/js/games/roadside-realm-data.js` returned `200 text/javascript`
  - `/js/games/roadside-realm.js` returned `200 text/javascript`
  - `/assets/roadside-realm/sprites/realm-sprite-signpost-ogre.png` returned `200 image/png`

Next recommended work:

1. Do a browser console pass through splash, movement, inspect, combat, save/load, and ending screens.
2. Add Signpost Ogre Big Spin logic.
3. Implement the Never-Finished Mansion map and Impossible Route ending path.
4. Add a QA doc with manual normal, secret, mansion, save/load, and mobile routes.
5. Improve normal enemy sprite graphics.
6. Add service worker only after the static app paths settle.

## 2026-06-28 Checkpoint: Deeper Route Preview

This checkpoint expands the public preview from the first playable shell into the first deeper-route build.

Version changes:

- Visible version badge: `App v0.2.0 · Roadside Realm 0.2.0`.
- Roadside Realm game data version: `0.2.0`.
- Save wrapper remains version `1`.

Implemented in this checkpoint:

- Added the Never-Finished Mansion map.
- Added the Hidden Conservatory map.
- Added Underpass painted-door event that unlocks the mansion when the player has the Moon Toll Token.
- Added Blueprint Key.
- Added Blueprint Warden.
- Added Star Map Fragment.
- Added Glass Rose.
- Added Blueprint Study locked door.
- Added hidden Conservatory wallpaper seam.
- Added Impossible Route Ending.
- Added Impossible Route Ending + Glass Rose summary copy.
- Added debug buttons for Star Map Fragment, Glass Rose, and mansion jump.
- Added Signpost Ogre Big Spin telegraph.
- Added Big Spin retreat behavior: stepping backward while the Ogre is winding up makes the spin miss.
- Updated objective text for mansion and deeper secret progress.
- Updated score formula to reward Impossible Route and Glass Rose completion.

Validation performed:

- `node --check script.js`
- `node --check js/games/roadside-realm-data.js`
- `node --check js/games/roadside-realm.js`
- Data validation for map dimensions, event bounds, item IDs, required item IDs, monster IDs, and target map IDs.
- Reachability checks for:
  - main start to Rusty Road Key
  - key to boss path
  - boss to Mapstone
  - secret switch to hidden wall
  - Underpass entry to Moon Toll Token
  - Underpass entry to mansion door
  - mansion entry to stair button
  - mansion entry to Blueprint Key
  - Blueprint Key path to Star Map Fragment
  - mansion path to Conservatory seam
  - Conservatory entry to Glass Rose

Known limitations after this checkpoint:

- Mansion content is a compact first implementation, not final expanded room-by-room polish.
- Blueprint Warden uses the fallback monster drawing, not a custom sprite yet.
- Mansion and Conservatory use the existing canvas palette rather than a distinct final art theme.
- Boss Big Spin is implemented, but needs browser-play QA for timing and feel.
- No service worker yet.
- This is still not V1.0.

Next recommended work:

1. Browser-play the normal, Secret Star, Impossible Route, and Glass Rose routes using debug mode.
2. Improve mansion-specific canvas visuals.
3. Add custom primitive sprites for Dust Goblin, Map Bat, Toll Troll, and Blueprint Warden.
4. Add service worker/cache only after preview paths settle.
5. Expand the QA checklist with pass/fail notes from real browser testing.

## 2026-06-28 Checkpoint: Visual Polish Preview

This checkpoint improves the public preview's visual readability without adding new asset files or new systems.

Version changes:

- Visible version badge: `App v0.2.1 · Roadside Realm 0.2.1`.
- Roadside Realm game data version: `0.2.1`.
- Save wrapper remains version `1`.

Implemented in this checkpoint:

- Added map-specific canvas palettes for:
  - Map Kiosk Dungeon
  - Forgotten Underpass
  - Never-Finished Mansion
  - Hidden Conservatory
- Added a room/map banner inside the canvas.
- Added painted mansion door rendering.
- Added hidden Conservatory glass-path rendering.
- Replaced generic fallback monster block with distinct primitive silhouettes for:
  - Dust Goblin
  - Map Bat
  - Toll Troll
  - Blueprint Warden
- Kept Signpost Ogre and Moonlit Warden wired to generated sprite assets.

Known limitations after this checkpoint:

- Browser console QA still needs a real browser environment.
- Primitive sprites are improved placeholders, not final production sprite sheets.
- Mansion room layout is still compact and needs final expansion/polish.

## 2026-06-28 Checkpoint: Retro Dungeon Feel Pass

This checkpoint responds to the preview not feeling enough like an old-school first-person dungeon crawler. It keeps Roadside Realm original and avoids copying protected QuestLord content, while pushing the broad genre language closer to a classic grid-based RPG.

Version changes:

- Visible version badge: `App v0.2.2 · Roadside Realm 0.2.2`.
- Roadside Realm game data version: `0.2.2`.
- Save wrapper remains version `1`.

Implemented in this checkpoint:

- Reworked the play screen into a darker, chunkier RPG console frame.
- Added thicker viewport border treatment.
- Tightened the HUD/status strip.
- Restyled inventory/log panels as compact RPG side panels.
- Restyled D-pad and command buttons with heavier borders and pressed-control feel.
- Replaced the flat canvas corridor with a deeper perspective tunnel made from side wall panels and nested depth frames.
- Added a stronger front-wall rendering for blocked tiles.
- Added an open-passage rendering for walkable corridors.
- Kept the original Roadside Realm story, items, maps, and art direction intact.

Known limitations after this checkpoint:

- Still needs true browser screenshot review on desktop and mobile.
- Canvas perspective is hand-drawn rather than raycasted.
- It is closer to the old-school dungeon crawler feel, but still not final art direction.

## 2026-06-28 Checkpoint: Depth-Aware Viewport Pass

This checkpoint makes the first-person dungeon view read more like a grid-based crawler by using the map ahead of the player, not only the immediate tile.

Version changes:

- Visible version badge: `App v0.2.3 · Roadside Realm 0.2.3`.
- Roadside Realm game data version: `0.2.3`.
- Save wrapper remains version `1`.

Implemented in this checkpoint:

- Added a three-cell sightline renderer for the canvas view.
- Added depth-scaled wall, door, hidden scratch, item, monster, exit, mansion door, and Conservatory doorway rendering.
- Open corridors now show farther passage frames instead of always drawing the same nearest rectangle.
- Farther monsters/items are drawn smaller when visible down a corridor.
- Locked doors and hidden walls scale with distance.
- Kept movement/collision rules unchanged; this is a visual interpretation of the existing grid state.

Validation performed:

- `node --check script.js`
- `node --check js/games/roadside-realm-data.js`
- `node --check js/games/roadside-realm.js`
- Data validation for maps/events/items/monsters/target maps.
- Reachability checks for main, secret, mansion, and Conservatory routes.

Known limitations after this checkpoint:

- Sightline depth is three cells, not a full raycaster.
- Side passages are not drawn yet.
- Browser screenshot QA is still needed.

## 2026-06-28 Checkpoint: Side-Passage View Pass

This checkpoint adds left/right corridor awareness to the first-person renderer.

Version changes:

- Visible version badge: `App v0.2.4 · Roadside Realm 0.2.4`.
- Roadside Realm game data version: `0.2.4`.
- Save wrapper remains version `1`.

Implemented in this checkpoint:

- Added side-vector helpers based on current facing direction.
- Added side-cell checks for the visible three-cell sightline.
- Side passages now draw when walkable cells exist to the left or right of visible corridor cells.
- Locked doors and unopened hidden walls do not appear as open side passages.
- This improves maze readability without changing movement, collision, map data, save format, or combat.

Validation required:

- Run the normal syntax/data/path checks.
- Browser-play a few turns in corridors with side branches to confirm openings read correctly.

## 2026-06-28 Checkpoint: Pixel Dungeon Art Direction Pass

This checkpoint responds to the reference image showing a classic pixel-art first-person dungeon crawler screen with gray stone walls, torch lighting, tiled floor, centered enemy, and chunky bottom controls.

Version changes:

- Visible version badge: `App v0.2.5 · Roadside Realm 0.2.5`.
- Roadside Realm game data version: `0.2.5`.
- Save wrapper remains version `1`.

Implemented in this checkpoint:

- Reworked the canvas corridor toward gray block masonry.
- Added repeated stone courses and staggered brick seams on wall panels.
- Added ceiling block hints.
- Added floor tile rows and perspective tile lines.
- Added a left-wall torch with warm radial glow.
- Strengthened the bottom control deck with darker framed, arcade-like command buttons.
- Preserved original Roadside Realm theme and content while moving the broad visual language closer to the provided dungeon crawler reference.

Known limitations after this checkpoint:

- Still needs browser screenshot review because this environment does not have a local browser.
- Monsters are still mixed between generated sprites and primitive silhouettes.
- The whole screen is not yet a single 224x336-style portrait viewport; the layout remains responsive web-first.

## 2026-06-28 Checkpoint: Canvas RPG Kit-Inspired HUD Systems

This checkpoint uses the newly added Canvas RPG Kit reference folders and pasted transcript as implementation inspiration only. The folders are local reference material and are ignored by git so the project does not publish tutorial source/assets or add a build system.

Reference folders seen locally:

- `Canvas RPG Kit - Starting Code/`
- `Canvas RPG Kit - YouTube Ending Code/`

Version changes:

- Visible version badge: `App v0.2.6 · Roadside Realm 0.2.6`.
- Roadside Realm game data version: `0.2.6`.
- Roadside Realm art metadata version: `0.2.6`.
- Save wrapper remains version `1`.

Implemented in this checkpoint:

- Added `js/games/roadside-realm-art.js`.
- Added `window.RTA_ROADSIDE_REALM_ART` sprite/icon metadata for items and monsters.
- Added a lightweight local `emitRealmEvent(type, detail)` hook for engine-style event flow.
- Added item pickup cards over the canvas.
- Inventory chips now include small pixel-style icon cells from art metadata.
- Added `.realm-pixel-art` and `crisp-edges` image rendering hints.
- Added `.gitignore` entries for the two local Canvas RPG Kit reference folders.

Rules kept from the project plan:

- No Vite.
- No npm dependency.
- No ES-module migration.
- No external asset loading.
- No copying tutorial assets into the shipped app.

Known limitations after this checkpoint:

- The event hook currently feeds debug logging only; later passes can attach save, HUD, and animation listeners.
- Sprite metadata is structural; most icons still render as simple glyphs.

## Checkpoint: WarClass-Inspired Asset Safety Pass

This checkpoint reviews the newly shared `haasva/WarClass-test` reference repo and the newly added local Roadside Realm images. WarClass is useful as inspiration for dense HTML/CSS RPG interface design, cell-based first-person movement, interactable overlays, and immediate RPG feedback. Its README states that most assets are placeholders from other games, so Roadside Realm must borrow structure and feel only, not assets or protected content.

Version changes:

- Visible version badge: `App v0.2.7 · Roadside Realm 0.2.7`.
- Roadside Realm game data version: `0.2.7`.
- Roadside Realm art metadata version: `0.2.7`.
- Save wrapper remains version `1`.

Implemented in this checkpoint:

- Added image asset paths and item-sheet order to `window.RTA_ROADSIDE_REALM_ART`.
- Added runtime chroma-key drawing for local sprite sheets so green-screen pixels are removed safely at render time.
- Applied keyed drawing to Signpost Ogre, Moonlit Warden, item-sheet icons, and the moon-scratch overlay.
- Updated QA to check `main`, `0.2.7`, and green-screen-free sprite rendering.
- Added `.gitignore` protection for the unpacked `APKPure_3.20.7005_apkpure.com/` reference folder.

Rules kept from the project plan:

- WarClass is used heavily for interface and interaction inspiration only.
- No WarClass assets, placeholder assets, or copied protected content are imported.
- No WebGL, npm, build step, backend, analytics, GPS, or external asset loading added.
- Roadside Realm remains original and static-GitHub-Pages friendly.

## Checkpoint: Soldotna Creek Wayside Optional Level

This checkpoint adds an original optional level inspired by Soldotna, Alaska. The design borrows stable public-place cues like the Kenai River, spruce-trail atmosphere, fishing/wayside identity, and midnight-sun glow without recreating real private locations, real businesses, or a literal town map.

Version changes:

- Visible version badge: `App v0.2.8 · Roadside Realm 0.2.8`.
- Roadside Realm game data version: `0.2.8`.
- Roadside Realm art metadata version: `0.2.8`.
- Save wrapper remains version `1`.

Implemented in this checkpoint:

- Added `soldotna-wayside`, displayed as `Soldotna Creek Wayside`.
- Added a blue river-route gate in the main dungeon that opens after the Mapstone.
- Added a safe return route back to the main dungeon.
- Added `Spruce Signling` and `River Current Sprite` encounters.
- Added `Midnight Sun Snack` as a healing item.
- Added `Kenai River Charm` as the wayside reward and score bonus.
- Added a distinct blue-green canvas palette and river-route gate drawing.
- Added a debug jump for the Soldotna level.
- Added a development cheatsheet overlay available from the Help button or by pressing `Ctrl` three times quickly.
- Updated QA with a Soldotna route test.

Rules kept from the project plan:

- This is an optional scenic detour, not a blocker for normal, secret, mansion, or conservatory endings.
- The level is inspired by place-feel only and remains original Roadside Realm fantasy.

## Checkpoint: WarClass-Inspired First-Person Visual Overhaul

This checkpoint responds directly to the need for Roadside Realm to feel much closer in ambition to `haasva/WarClass-test` while staying original and static-site friendly. WarClass was studied for CSS perspective, dense RPG HUD layout, pixel/grain treatment, party/status panels, encounter presentation, and menu density. No WarClass assets, copied sprites, sounds, or placeholder art were imported.

Version changes:

- Visible version badge: `App v0.3.0 · Roadside Realm 0.3.0`.
- Roadside Realm game data version: `0.3.0`.
- Roadside Realm art metadata version: `0.3.0`.
- Save wrapper remains version `1`.

Implemented in this checkpoint:

- Added a DOM/CSS first-person `realm-neo-view` above the canvas fallback.
- Added layered sky, ceiling, floor, side walls, far wall, doors, objects, enemy silhouettes, crosshair, caption, grain, and vignette.
- Added state-driven visual classes for walls, locked doors, hidden walls, mansion doors, river gates, glass paths, exits, monsters, and items.
- Added a dense RPG party strip with HP meter, route state, threat state, facing state, and front-tile state.
- Added side-panel room scanner and gear deck readouts.
- Expanded README with current version, controls, visual direction, run instructions, known limitations, and WarClass asset-safety note.
- Added `CHANGELOG.md`.

Rules kept from the project plan:

- The game remains vanilla HTML/CSS/JavaScript.
- The existing canvas renderer remains available as a fallback.
- No dependencies, backend, analytics, tracking, GPS, or external asset loading were added.

## Checkpoint: Release Quality And Real Verification Pass

This checkpoint responds to the preview feeling like an engineering-only `0.7.0`. The priority is turning the build into an honest `0.8.0`: more playable, more visually intentional, more mobile-friendly, and verified by a real action-based route rather than debug jumps.

Version changes:

- Visible version badge: `App v0.8.0 · Roadside Realm 0.8.0`.
- Roadside Realm game data version: `0.8.0`.
- Roadside Realm art metadata version: `0.8.0`.
- Save wrapper remains version `1`.

Implemented in this checkpoint:

- Hardened DOM rendering with safe text/HTML setters so a missing display node cannot stop the game loop.
- Added runtime error capture for browser errors and unhandled promise rejections.
- Added position/facing/step-driven scene signatures to the visible first-person viewport so movement is obvious and testable.
- Split Computer Mode into real playthrough verification and debug-only deep regression checks.
- Real Computer Mode now starts a new quest and uses normal action handlers to move, turn, inspect, collect the key, collect the potion, fight the Signpost Ogre, dodge Big Spin, use healing, collect the Mapstone, and reach the normal ending.
- Debug Deep Check Mode uses `?computerMode=1&debugDeep=1` and is clearly labeled as separate from real playthrough proof.
- Improved the first-person viewport with stronger route signage, torch/glow framing, encounter/object labels, scanline treatment, and deeper atmospheric layering.
- Improved mobile layout with sticky thumb controls immediately under the viewport, compact stats, larger touch targets, and a responsive verification overlay.
- Added `package.json`, Playwright browser test scaffolding, and local Node verification scripts.

Verification notes:

- `npm run verify` runs syntax, data, and VM-based Computer Mode checks.
- Browser verification can be performed from GitHub Pages by opening `https://jtripppiie.github.io/roadside-realmo/?computerMode=1&speed=fast` and waiting for `Status: PASSED` with `Mode: real-playthrough`.
- Debug deep verification can be performed with `https://jtripppiie.github.io/roadside-realmo/?computerMode=1&speed=fast&debugDeep=1`.
- Playwright browser verification is scaffolded with `npm run test:browser`; install dev dependencies and Chromium first with `npm install` and `npm run test:browser:install`.
- In this workspace, `npm run test:browser` was attempted and returned `playwright: not found` because dev dependencies are not installed.

## Checkpoint: Playable Canvas Layout And Mobile Controls Stabilization

This checkpoint pauses feature work and fixes the basic playability layer. The broken behavior was that mobile controls were styled as page-flow/sticky controls, so the D-pad could move with document scrolling and feel visually present but disconnected from a game viewport. The earlier verification also did not explicitly prove the D-pad buttons were present and using the same action path as keyboard input.

Files changed:

- `js/games/roadside-realm.js`
- `style.css`
- `README.md`
- `docs/roadside-realm-progress.md`
- `docs/roadside-realm-qa.md`

What changed:

- Added a `realm-playing` body state while the game screen is active.
- Locked the mobile play viewport while Roadside Realm is being played.
- Changed mobile `.realm-control-deck` from sticky page layout to fixed overlay positioning.
- Added `touch-action: none` and selection prevention to D-pad/action controls.
- Added hold-to-repeat behavior for forward, backward, turn left, and turn right.
- Routed touch/pointer D-pad input through the same action dispatcher used by keyboard controls.
- Added visible `lastInputResult` status text so blocked movement is visibly different from missing input.
- Added Computer Mode checks for D-pad/action button presence, shared forward/back/left/right input, visible blocked-move feedback, scene sizing signature, and runtime errors.

How movement is wired now:

```text
keyboard key or data-action button
-> action ID
-> dispatchSharedInput/action handler
-> rotate, attemptMove, inspect, attack, use item, map, save, or help
-> render DOM, viewport, debug panel, and computer report
```

Keyboard test:

1. Start Roadside Realm.
2. Use `ArrowUp/W`, `ArrowDown/S`, `ArrowLeft/A`, and `ArrowRight/D`.
3. Confirm movement/facing changes and the front status reports the latest input.

Mobile test:

1. Open a narrow viewport or a phone.
2. Start a new quest.
3. Confirm the D-pad is fixed at the bottom of the game viewport and does not scroll with the page.
4. Tap and hold left, right, up, and down.
5. Confirm the page does not scroll when tapping controls.
6. Rotate to landscape and confirm the canvas is not tiny or stretched and the fixed controls remain usable.

Debug/computer mode:

- `?realmDebug=1` shows the live debug panel, including the latest input result.
- `?computerMode=1&speed=fast` runs the real playthrough check and now validates shared input and D-pad presence before the route.
- `?computerMode=1&speed=fast&debugDeep=1` remains the deep route regression check.

Known limitations:

- Browser Playwright checks require dependencies to be installed locally.
- A real-device mobile pass is still recommended after pushing, because VM verification cannot physically feel thumb ergonomics.
