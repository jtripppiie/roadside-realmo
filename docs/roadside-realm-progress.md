# Roadside Realm Build Progress

This file tracks implementation progress so work can continue safely across sessions.

## Current Branch

`codex/roadside-realm-plan-assets`

Remote tracking branch:

`origin/codex/roadside-realm-plan-assets`

GitHub default branch:

`main`

GitHub Pages deployment plan:

Use `codex/roadside-realm-plan-assets` as the Pages source while Roadside Realm is under active construction, so the public preview tracks the current playable checkpoint without prematurely merging incomplete game work into `main`.

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
