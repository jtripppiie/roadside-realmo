# Hockey Smash Kid Handoff Guide

This guide explains the game in plain language so a beginner can safely help later.

## Current Version

Current checkpoint: **Hockey Smash v0.14.4 · Build 2026-06-29.60**

Preview:

```text
https://jtripppiie.github.io/hockey-smash/?fresh=0144
```

## Big Idea

Hockey Smash is a browser game.

It uses:

- `HTML` for the page and buttons.
- `CSS` for layout, colors, size, and mobile controls.
- `JavaScript` for movement, enemies, score, countdowns, projectiles, falling-fish patterns, power-ups, cameos, and game rules.
- `Canvas` for drawing the game scene.

There is no server. There are no accounts. There is no build step to play the game locally.

## How The Files Load

Open `index.html` and scroll to the bottom. Script files load from top to bottom.

Think of the files like clear plastic sheets:

1. `js/games/hockey-smash.js` is the first drawing.
2. Later files add movement, score, projectiles, character labels, and safety fixes on top.
3. `js/games/hockey-smash-v0114.js` loads last as the v0.14.4 release layer.
4. `js/games/hockey-smash-v0115-parallax-starter.js` exists but is intentionally disabled until exact parallax assets are ready.

## Main Files

### `index.html`

Change this for the visible badge, script load order, CSS cache key, splash text, controls, canvas, HUD, and preload hints.

### `style.css`

Change this for compact splash layout, hero image size, title size, canvas size, HUD layout, and controls layout.

### `hockey-smash-custom.css`

Change this for Daniel/Sofie selector styling and player name input styling.

### `hockey-smash.css`

This is the CSS manifest. Update the cache key here whenever visible CSS or page behavior changes.

### `js/games/hockey-smash.js`

This is the original game brain. It owns the core state, player, old spawns, collision, drawing, health, and Try Again flow.

Be careful in this file because many later layers depend on it.

### `js/games/hockey-smash-v096.js`

This owns smooth movement, jump buffer, coyote time, slide timing, touch tracking, and Computer Mode input bridge.

### `js/games/hockey-smash-v0102.js`

This owns moving encounters.

Look here for:

- Bear movement.
- Moose movement.
- Mom/Sister movement from older layers.
- Difficulty ramp.
- `rain` fish.
- `heavyRain` fish.
- `fastRain` fish.
- `schoolRain` fish.
- Combo encounter spawns.

### `js/games/hockey-smash-v0103.js`

This owns charged projectiles and fish dodge rules.

Look here for:

- Daniel puck shots.
- Sofie pointe-shoe shots.
- Hold/release charge timing.
- Projectile speed.
- Projectile damage.
- Projectile arc/gravity.
- Hit feedback text.
- Falling-fish dodge rules.
- Safe puck-speed power-ups.

Important safety note: power-ups stay inside this layer instead of `state.entities`. The old core collision code damages the player when they overlap normal entities, so putting power-ups in `state.entities` could accidentally make a reward hurt the player.

### `js/games/hockey-smash-v0104.js`

This owns score, distance, combo, high score, floating text, and Try Again summary.

### `js/games/hockey-smash-v0106.js`

This owns Daniel/Sofie character settings, Hockey Smash vs Dance Smash labels, action label, player name, and character sprites.

### `js/games/hockey-smash-v0109.js`

This owns hidden dev mode, triple-tap unlock, debug logs, accidental shake lock, 10-second countdown, and the legacy sideways-salmon guard.

### `js/games/hockey-smash-v0110.js`

This adds double jump, fish splash warnings, one-big-animal pressure, and projectile hits for family/dance encounters.

### `js/games/hockey-smash-v0111.js` through `js/games/hockey-smash-v0114.js`

These are the newest small tuning layers. `v0111` adjusts pacing, `v0112` removes shake and slows bears, `v0113` stages the fish-dodge level before wildlife and suppresses people/cast hazards, and `v0114` loads last to keep the visible badge/version on v0.14.4 while adding harmless Alaskan boy/girl sideline cameos.

### `js/games/hockey-smash-v0115-parallax-starter.js`

This is a disabled parallax starter. Do not activate it until the exact parallax assets exist.

Required future assets:

```text
assets/hockey-smash/backgrounds/parallax-midground-loop.webp
assets/hockey-smash/backgrounds/parallax-foreground-loop.webp
```

Both should be `2048x576`, transparent, WebP, and seamless left-to-right.

## Where To Change Common Things

### Change charged shot feel

Open:

```text
js/games/hockey-smash-v0103.js
```

Look for:

```js
const PUCK_BASE_SPEED = 680;
const PUCK_MAX_CHARGE_MS = 720;
const PUCK_COOLDOWN_MS = 180;
const PUCK_ARC_GRAVITY = 680;
```

Change these numbers slowly and test after each change.

### Change falling-fish patterns

Open:

```text
js/games/hockey-smash-v0102.js
```

Look for the `WAVE` array and `applyVariant()`.

Use `WAVE` to add known pattern types.
Use `applyVariant()` to add random difficulty-based changes.

### Change salmon dodge rules

Open:

```text
js/games/hockey-smash-v0103.js
```

Look for:

```js
playerIsDodgingSalmon(player, entity)
```

That function decides whether a salmon was dodged or hit the player.

### Change staged level rules

Open:

```text
js/games/hockey-smash-v0113.js
```

This file controls the fish-dodge opening and the moose/bear Level 2 filter.

### Change the harmless Alaskan cameo

Open:

```text
js/games/hockey-smash-v0114.js
```

Look for `CAMEO_ASSETS`, `removeFinalCastEntities()`, and `syncSidelineCameo()`.

Do not put the cameo into `state.entities` unless you intentionally want it to become a collision/gameplay object.

### Change the countdown length

Open:

```text
js/games/hockey-smash-v0109.js
```

Find:

```js
const START_COUNTDOWN_SECONDS = 10;
```

### Make the splash smaller or larger

Open:

```text
style.css
hockey-smash-custom.css
```

## What To Test After Any Change

1. Splash screen loads.
2. Start Game works.
3. Countdown appears.
4. Tap shot works.
5. Charged shot works.
6. Charged shot arcs.
7. Daniel still fires pucks.
8. Sofie still throws pointe shoes.
9. Fish rain down from the top.
10. Falling fish can be dodged by moving out from under them.
11. schoolRain fish appears wider.
12. Level 2 focuses on moose and bears.
13. Alaskan boy/girl cameo does not chase, collide, block, or damage the player.
14. Power-up collection does not hurt the player.
15. Try Again works when health reaches zero.
16. Computer Mode still starts with `?computerMode=1`.
17. `npm run verify` passes.

## How To Add A New Feature Safely

1. Name the feature in plain English.
2. Decide which file should own it.
3. Add the smallest version that works.
4. Add comments near tricky parts.
5. Test normal play.
6. Test Computer Mode.
7. Update README and changelog.
8. Add QA checklist items.
9. Run `npm run verify`.
10. Push only when the game still starts.

## Current v0.14.4 Behavior To Preserve

- Splash screen is compact.
- Start Game leads to a 10-second safe countdown.
- Salmon/fish rain down from the top.
- Fish-dodge Level 1 comes before moose/bear Level 2.
- Daniel uses Hockey Smash / puck behavior.
- Sofie uses Dance Smash / pointe-shoe behavior.
- Action can be tapped for quick shots or held/released for charged shots.
- Falling fish are dodged by moving out from under them.
- schoolRain fish are wider and more dangerous.
- Alaskan boy/girl are harmless sideline cameos only.
- Safe power-ups can boost puck speed without damaging the player.
- Computer Mode still starts quickly and uses the same gameplay systems.
