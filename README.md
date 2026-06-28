# Roadside Realmo

Roadside Realmo is the working repo for **Roadside Realm**, a static first-person road-fantasy dungeon crawler built with HTML, CSS, vanilla JavaScript, and local assets.

Current preview version: **0.8.0**

Live GitHub Pages preview:

```text
https://jtripppiie.github.io/roadside-realmo/
```

## Current Status

Roadside Realm is now a playable in-development browser game, not just a planning scaffold. The current `0.8.0` checkpoint upgrades the release quality with real action-based Computer Mode verification, stronger first-person atmosphere, and a more mobile-friendly HUD.

The game includes:

- first-person grid movement
- canvas fallback renderer
- new DOM/CSS perspective viewport
- D-pad and keyboard controls
- inventory, log, stats, room scanner, and gear deck
- main dungeon, Forgotten Underpass, Never-Finished Mansion, Hidden Conservatory, and Soldotna Creek Wayside
- normal, secret, impossible, and Glass Rose ending paths
- local save/load
- debug mode with `?realmDebug=1`
- computer verification mode with `?computerMode=1`
- development cheatsheet overlay

## Visual Direction

The current visual target is a **WarClass-inspired but original roadside RPG interface**:

- dense retro RPG panels around the play area
- layered first-person viewport with ceiling, floor, side walls, far wall, gates, objects, enemy silhouettes, grain, and vignette
- darker, stranger roadside-dungeon atmosphere
- road-trip fantasy objects instead of copied medieval/fantasy assets
- local CSS/JS/PNG treatment only

WarClass was used as a serious reference for interface density, CSS perspective, pixel filter treatment, and first-person RPG presentation. **No WarClass art, sprites, sounds, or placeholder assets were copied.**

## How To Run

No build step is required.

Open `index.html` in a browser, or use any simple static server:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080/
```

## Controls

- Move forward: `ArrowUp` or `W`
- Move backward: `ArrowDown` or `S`
- Turn left: `ArrowLeft` or `A`
- Turn right: `ArrowRight` or `D`
- Inspect: `Enter` or `Space`
- Attack: `F`
- Use item: `I`
- Toggle map: `M`
- Development cheatsheet: Help button or press `Ctrl` three times quickly

## Playable Controls Stabilization

The current stabilization pass fixes the playable input layer before more features are added. The broken behavior was mobile-first: the D-pad and menu controls were still participating in page layout, so they could scroll with the document and feel detached from the game viewport.

Files changed for this pass:

- `js/games/roadside-realm.js`
- `style.css`
- `README.md`
- `docs/roadside-realm-progress.md`
- `docs/roadside-realm-qa.md`

Movement is now wired through one shared path. Keyboard shortcuts map to an action ID, D-pad/menu buttons use the same `data-action` ID, and both call the same runtime action handler. The visible status/debug readout now reports the last input result, so blocked walls/doors are distinguishable from broken input.

Keyboard test:

1. Start a new quest.
2. Press `ArrowUp` or `W` and confirm the position/status changes.
3. Press `ArrowDown` or `S` and confirm the player steps back.
4. Press `ArrowLeft`/`A` and `ArrowRight`/`D` and confirm facing changes.

Mobile test:

1. Open the game in a narrow mobile viewport.
2. Start a new quest.
3. Confirm the D-pad remains fixed to the bottom of the game viewport.
4. Tap and hold left/right/up/down and confirm each repeats movement or turning.
5. Confirm tapping controls does not scroll the browser page.
6. Rotate to landscape and confirm the controls remain fixed and usable.

## Debug Mode

Use:

```text
?realmDebug=1
```

Debug mode includes position/state readouts and jump/give/heal helpers for testing main, secret, mansion, conservatory, and Soldotna routes.

Debug mode now also shows the latest input result. Use that line to tell the difference between "input fired but movement was blocked" and "input did not reach the game."

## Verification Modes

Real Computer Mode uses the same action system as a player. It starts a new quest, walks the normal route, collects the Rusty Road Key and Apple Juice Potion, fights the Signpost Ogre, dodges Big Spin, uses a healing item if needed, collects the Mapstone, and reaches the normal ending.

```text
?computerMode=1
?computerMode=1&speed=fast
```

Debug Deep Check Mode is separate. It may jump to deeper states for regression checks, and it is not used as proof that the normal game is playable.

```text
?computerMode=1&debugDeep=1
?computerMode=1&speed=fast&debugDeep=1
```

Local verification commands:

```bash
npm run verify
```

Optional browser verification after installing Playwright:

```bash
npm install
npm run test:browser:install
npm run test:browser
```

## Known Limitations

- The WarClass-style viewport is a new DOM/CSS presentation layer; the canvas renderer still exists as a fallback.
- Enemy/NPC silhouettes are original symbolic placeholders and need more bespoke art.
- No sound pass has been done yet.
- QA still needs manual browser playthroughs after each larger visual/content change.
- Playwright browser verification is scaffolded, but dependencies are not committed; run `npm install` locally before `npm run test:browser`.

## Roadmap

- Replace placeholder enemy symbols with original Roadside Realm sprites.
- Add deeper WarClass-style menu tabs for quest, map, items, and route history.
- Add more room-specific art states and encounter presentation.
- Improve mobile fullscreen ergonomics.
- Complete V1.0 QA routes documented in `docs/roadside-realm-qa.md`.

## Repository Contents

- `index.html`: app shell and Roadside Realm markup
- `style.css`: layout, HUD, first-person viewport, responsive styling
- `script.js`: app bootstrap
- `js/games/roadside-realm-data.js`: maps, items, monsters, events
- `js/games/roadside-realm-art.js`: local art metadata
- `js/games/roadside-realm.js`: runtime state, movement, rendering, save/load, debug mode
- `assets/roadside-realm/`: local generated starter assets
- `scripts/`: local verification scripts
- `tests/`: optional Playwright browser verification
- `docs/roadside-realm-game-plan.md`: full V1.0 game plan
- `docs/roadside-realm-summary.md`: maintained quick summary
- `docs/roadside-realm-qa.md`: QA routes
- `docs/roadside-realm-progress.md`: build progress log
