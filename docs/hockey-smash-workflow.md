# Hockey Smash Workflow

## Project Overview

Hockey Smash is a static browser canvas game served through GitHub Pages. The current public checkpoint is **Hockey Smash v0.13.4 · Build 2026-06-29.50**.

The game is intentionally static:

- No backend.
- No accounts.
- No build step required to play locally.
- Vanilla HTML, CSS, and JavaScript.
- Local sprite/background assets.

## Current Public URLs

Normal play:

```text
https://jtripppiie.github.io/hockey-smash/
```

Fresh cache-bust preview:

```text
https://jtripppiie.github.io/hockey-smash/?fresh=0134
```

Computer Play / Watch Mode:

```text
https://jtripppiie.github.io/hockey-smash/?computerMode=1
```

Debug Computer Play:

```text
https://jtripppiie.github.io/hockey-smash/?computerMode=1&debug=1
```

## File Map

- `index.html`: public Hockey Smash shell, visible build badge, splash customization controls, controls, HUD, canvas, and script/css loading order.
- `hockey-smash.css`: single CSS manifest loaded by `index.html`; imports all CSS layers with the current cache key.
- `style.css`: splash, transition, gameplay viewport, HUD, controls, and no-scroll layout.
- `hockey-smash-polish.css`: player overlay, debug hiding, mobile polish, and victory overlay styling.
- `hockey-smash-touch.css`: touch-control reliability and pressed-button visual feedback.
- `hockey-smash-custom.css`: character selector and player-name input styling.
- `hockey-smash-v09.css`: fullscreen, entity overlay, and landscape-phone layout overrides.
- `hockey-smash-v094.css`, `hockey-smash-v095.css`, `hockey-smash-v0111.css`: later layout/HUD polish layers.
- `script.js`: starts the game on `DOMContentLoaded`.
- `js/games/hockey-smash.js`: original core runtime, state machine, input set, base movement, spawns, collision, rendering, and asset fallbacks.
- `js/games/hockey-smash-polish.js`: polish layer and legacy Computer Mode D-pad helper behavior.
- `js/games/hockey-smash-v091.js`: road-section progression and Computer Play duplicate-player guard.
- `js/games/hockey-smash-v095.js`: later gameplay/presentation patch layer.
- `js/games/hockey-smash-v096.js`: smooth movement controller for normal play and Computer Mode.
- `js/games/hockey-smash-v099.js`: Computer Mode entity sizing pass.
- `js/games/hockey-smash-v0100.js`: Game Over / Try Again flow.
- `js/games/hockey-smash-v0102.js`: moving gameplay encounter pass.
- `js/games/hockey-smash-v0103.js`: Daniel puck and Sofie pointe-shoe projectile layer.
- `js/games/hockey-smash-v0104.js`: distance, score, combo, high score, difficulty, floating text, and run summary layer.
- `js/games/hockey-smash-v0105.js`: touch-control release marker.
- `js/games/hockey-smash-v0106.js`: player customization, Daniel/Sofie mode labels, and character-specific action labels.
- `js/games/hockey-smash-v0107.js`: gameplay repair marker.
- `js/games/hockey-smash-v0108.js`: later gameplay/presentation repair layer.
- `js/games/hockey-smash-v0109.js`: final safety/release layer; owns dev unlock, debug button logs, accidental shake lock, 10-second countdown, and right-side-only salmon guard.
- `assets/hockey-smash/`: Hockey Smash art files.
- `scripts/verify-hockey-smash.js`: static launch/docs/file verifier.
- `scripts/verify-hockey-smash-actions.js`: non-browser action verifier for core movement and stick behavior.
- `docs/hockey-smash-qa.md`: manual QA routes.
- `docs/hockey-smash-dev-checklist.md`: short checkpoint checklist.
- `docs/hockey-smash-kid-handoff.md`: beginner handoff guide.

## Local Run Command

```bash
python3 -m http.server 8080
```

Open:

```text
http://localhost:8080/
```

Computer Play locally:

```text
http://localhost:8080/?computerMode=1
```

## Version Update Checklist

When changing visible behavior:

1. Update the visible badge in `index.html`.
2. Update cache keys in `index.html`.
3. Update the latest overlay script version/build labels, especially the file loaded last.
4. Update `package.json` if the project package version changes.
5. Update `scripts/verify-hockey-smash.js` so stale versions fail verification.
6. Update `README.md`.
7. Update `CHANGELOG.md`.
8. Update `docs/hockey-smash-qa.md`.
9. Update `docs/hockey-smash-dev-checklist.md`.
10. Update `docs/hockey-smash-kid-handoff.md` if file responsibilities or safe-edit guidance changed.
11. Update this workflow file if file responsibilities or QA expectations changed.
12. Update `docs/hockey-smash-progress.md` when the change is a major checkpoint or needs long-term history.

## Current v0.13.4 Behavior Notes

- Normal play starts with splash customization, then a transition screen, then gameplay.
- After gameplay appears, a 10-second countdown gives the player time to practice controls.
- During the countdown, the player can move, jump, slide, and attack, but hazards are removed or held back.
- After the countdown, normal hazards begin.
- Salmon/fish should come from the right side only.
- Daniel mode is **Hockey Smash** and uses hockey puck/stick language.
- Sofie mode is **Dance Smash** and uses pointe-shoe language/projectiles.
- Normal players should not see Watch Computer Play or the debug log.
- Triple-tapping the splash image unlocks dev mode.
- `?debug=1`, `?dev=1`, and `?computerMode=1` auto-enable dev mode.
- Computer Mode skips the 10-second practice countdown so testing starts quickly.

## Gameplay Tuning Locations

Core tuning begins in `js/games/hockey-smash.js`:

- `TUNING.walkSpeed`
- `TUNING.slideSpeed`
- `TUNING.jumpVelocity`
- `TUNING.gravity`
- `TUNING.groundRatio`
- spawn timers inside `createState`
- hazard damage inside spawn helpers
- Dad health inside `updateBoss`

Newer feel/tuning is layered in:

- `js/games/hockey-smash-v096.js`: smooth movement speed, acceleration, jump buffer, coyote time, slide timing.
- `js/games/hockey-smash-v0102.js`: moving encounter order, size, speed, health, damage, and speech bubble text.
- `js/games/hockey-smash-v0103.js`: puck/pointe-shoe speed, projectile damage, cooldown, and fish dodge damage.
- `js/games/hockey-smash-v0104.js`: score, combo, floating text, high score, and run-summary behavior.
- `js/games/hockey-smash-v0106.js`: Daniel/Sofie title, action label, sprite, and player-name behavior.
- `js/games/hockey-smash-v0109.js`: dev-mode visibility, start countdown length, countdown hazard hold, and salmon right-side-only guard.

## Control Mapping Locations

Core controls:

- Keyboard mapping: `keyToAction` in `js/games/hockey-smash.js`.
- Touch/pointer buttons: `[data-action]` buttons in `index.html`.
- Shared action behavior: `jump`, `swingStick`, and the `keys` set in `js/games/hockey-smash.js`.

Newer controls:

- Smooth movement input ownership: `js/games/hockey-smash-v096.js`.
- Computer Mode smooth-input bridge: `syncComputerModeInput` in `js/games/hockey-smash-v096.js`.
- Puck/pointe-shoe action input: `bindStickLaunchers` in `js/games/hockey-smash-v0103.js`.
- Dev button logging: `js/games/hockey-smash-v0109.js`.

## Computer Mode Rule

Computer Mode is useful only if it exercises the same gameplay systems as normal play. Do not add future gameplay only to Computer Mode or only to normal play unless the difference is intentional and documented.

Before calling Computer Mode good, check:

1. Smooth movement is active.
2. Moving encounters are active.
3. Fish dodge rules are active.
4. Puck/pointe-shoe action is active.
5. Try Again still appears when health reaches zero.
6. Computer Mode starts quickly and does not wait through the 10-second normal-play countdown.

## Mobile Layout Test

1. Open the game in a phone-sized viewport.
2. Start gameplay.
3. Confirm the portrait rotate hint appears briefly.
4. Rotate to landscape.
5. Confirm the D-pad and action controls are fixed at the bottom corners.
6. Confirm the player is not covered by controls.
7. Confirm the page does not scroll while using controls.
8. Confirm the 10-second countdown message does not block the controls.

## Updating Docs

Update these when behavior changes:

- `README.md`
- `CHANGELOG.md`
- `docs/hockey-smash-qa.md`
- `docs/hockey-smash-dev-checklist.md`
- `docs/hockey-smash-workflow.md`
- `docs/hockey-smash-kid-handoff.md`
- `docs/hockey-smash-progress.md` when the change is a major checkpoint or needs long-term history.
