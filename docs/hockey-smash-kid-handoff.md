# Hockey Smash Kid Handoff Guide

This guide explains the game in plain language so a beginner can safely help later.

## Current Version

Current checkpoint: **Hockey Smash v0.13.6 · Build 2026-06-29.52**

Preview:

```text
https://jtripppiie.github.io/hockey-smash/?fresh=0136
```

## Big Idea

Hockey Smash is a browser game.

It uses:

- `HTML` for the page and buttons.
- `CSS` for layout, colors, size, and mobile controls.
- `JavaScript` for movement, enemies, score, countdowns, projectiles, salmon patterns, power-ups, and game rules.
- `Canvas` for drawing the game scene.

There is no server. There are no accounts. There is no build step to play the game locally.

## How The Files Load

Open `index.html` and scroll to the bottom. Script files load from top to bottom.

Think of the files like clear plastic sheets:

1. `js/games/hockey-smash.js` is the first drawing.
2. Later files add movement, score, projectiles, character labels, and safety fixes on top.
3. `js/games/hockey-smash-v0110.js` loads last as the v0.13.6 release marker.

## Main Files

### `index.html`

Change this for the visible badge, script load order, CSS cache key, splash text, controls, canvas, and HUD.

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
- Mom/Sister movement.
- Difficulty ramp.
- `highArc` salmon.
- `low` salmon.
- `school` salmon.
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
- HighArc/low/school salmon dodge rules.
- Safe puck-speed power-ups.

Important safety note: power-ups stay inside this layer instead of `state.entities`. The old core collision code damages the player when they overlap normal entities, so putting power-ups in `state.entities` could accidentally make a reward hurt the player.

### `js/games/hockey-smash-v0104.js`

This owns score, distance, combo, high score, floating text, and Try Again summary.

### `js/games/hockey-smash-v0106.js`

This owns Daniel/Sofie character settings, Hockey Smash vs Dance Smash labels, action label, player name, and character sprites.

### `js/games/hockey-smash-v0109.js`

This owns hidden dev mode, triple-tap unlock, debug logs, accidental shake lock, 10-second countdown, and right-side-only salmon guard.

### `js/games/hockey-smash-v0110.js`

This tiny file loads last and keeps the visible badge/version on v0.13.6 after older layers boot.

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

### Change salmon patterns

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
9. highArc salmon can be jumped.
10. low salmon can be slid under.
11. school salmon appears wider.
12. Power-up collection does not hurt the player.
13. Try Again works when health reaches zero.
14. Computer Mode still starts with `?computerMode=1`.
15. `npm run verify` passes.

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

## Current v0.13.6 Behavior To Preserve

- Splash screen is compact.
- Start Game leads to a 10-second safe countdown.
- Salmon/fish enter from the right side only.
- Daniel uses Hockey Smash / puck behavior.
- Sofie uses Dance Smash / pointe-shoe behavior.
- Action can be tapped for quick shots or held/released for charged shots.
- highArc salmon require a high jump.
- low salmon require slide/duck.
- school salmon are wider and more dangerous.
- Safe power-ups can boost puck speed without damaging the player.
- Computer Mode still starts quickly and uses the same gameplay systems.
