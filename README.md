# Roadside Realmo

Roadside Realmo is the working repo for **Roadside Realm**, a static first-person road-fantasy dungeon crawler built with HTML, CSS, vanilla JavaScript, and local assets.

Current preview version: **0.3.0**

Live GitHub Pages preview:

```text
https://jtripppiie.github.io/roadside-realmo/
```

## Current Status

Roadside Realm is now a playable in-development browser game, not just a planning scaffold. The current `0.3.0` checkpoint adds a WarClass-inspired visual overhaul while keeping the game original and GitHub Pages friendly.

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

## Debug Mode

Use:

```text
?realmDebug=1
```

Debug mode includes position/state readouts and jump/give/heal helpers for testing main, secret, mansion, conservatory, and Soldotna routes.

## Known Limitations

- The WarClass-style viewport is a new DOM/CSS presentation layer; the canvas renderer still exists as a fallback.
- Enemy/NPC silhouettes are original symbolic placeholders and need more bespoke art.
- No sound pass has been done yet.
- QA still needs manual browser playthroughs after each larger visual/content change.

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
- `docs/roadside-realm-game-plan.md`: full V1.0 game plan
- `docs/roadside-realm-summary.md`: maintained quick summary
- `docs/roadside-realm-qa.md`: QA routes
- `docs/roadside-realm-progress.md`: build progress log
