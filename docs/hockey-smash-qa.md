# Hockey Smash QA Routes

Hockey Smash is the primary public game in this repo. This QA file tracks the current public preview first, then the manual checks that matter before calling a checkpoint stable.

## Current Preview

- Public game: `Hockey Smash v0.13.4`
- Visible build badge: `Hockey Smash v0.13.4 · Build 2026-06-29.50`
- Package version: `0.13.4`
- Preview branch: `main`
- GitHub Pages URL: `https://jtripppiie.github.io/hockey-smash/`
- Fresh cache-bust URL: `https://jtripppiie.github.io/hockey-smash/?fresh=0134`
- Computer Play URL: `https://jtripppiie.github.io/hockey-smash/?computerMode=1`

## v0.13.4 Launch QA

### Launch Flow

1. Open `https://jtripppiie.github.io/hockey-smash/?fresh=0134`.
2. Confirm the top-right badge says `Hockey Smash v0.13.4 · Build 2026-06-29.50`.
3. Confirm the splash screen says `Hockey Smash`.
4. Confirm the splash shows Daniel/Sofie buttons and the player name input.
5. Confirm normal players see **Start Game** only, not Watch Computer Play.
6. Click **Start Game**.
7. Confirm the transition screen says `Entering Hockey Smash...` or `Entering Dance Smash...` depending on the selected character.
8. Confirm gameplay opens in a full browser-viewport screen.
9. Confirm the page does not anchor-jump or scroll during gameplay.

### 10-Second Start Countdown

1. Start normal play from the splash screen.
2. Confirm the gameplay screen appears.
3. Confirm a countdown appears near the middle of the game screen.
4. Confirm the countdown says `Practice the buttons before the salmon run starts`.
5. During the countdown, hold left and confirm the player moves left.
6. During the countdown, hold right and confirm the player moves right.
7. During the countdown, press Jump and confirm the player jumps.
8. During the countdown, press Slide and confirm the player slides/ducks.
9. During the countdown, press the character action button and confirm the action responds.
10. Confirm no salmon, bear, moose, Mom, Sister, Dad joke, or Dad boss reaches the player during the countdown.
11. Confirm hazards begin after the countdown finishes.
12. Confirm the first status after countdown says salmon are incoming from the right or similar.

### Normal Gameplay Controls

1. Use `A` / `ArrowLeft` and confirm the player moves left smoothly.
2. Use `D` / `ArrowRight` and confirm the player moves right smoothly.
3. Press `W`, `ArrowUp`, or `Space` and confirm the player jumps.
4. Press or hold `Shift` / `S` and confirm the player slides/ducks.
5. Press `F` or `Enter` and confirm the action triggers.
6. Confirm the mobile D-pad left/right works.
7. Confirm the mobile `J`, `S`, and action buttons work.
8. Confirm keyboard arrows and touch controls do not scroll the page.

### Daniel / Sofie Character QA

1. Select Daniel.
2. Confirm the splash title says `Hockey Smash`.
3. Confirm Daniel uses hockey-stick/puck language and behavior.
4. Select Sofie.
5. Confirm the splash title changes to `Dance Smash`.
6. Confirm the transition says `Entering Dance Smash...`.
7. Confirm Sofie's action button uses pointe-shoe language/visuals.
8. Confirm player name text appears in the HUD, overlay, status messages, Try Again text, and Mom/Sister bubbles.

### Moving Gameplay Encounters

1. Confirm fish/salmon fly in from the **right side only**.
2. Confirm jumping over fish counts as a dodge.
3. Confirm sliding/ducking under fish counts as a dodge.
4. Confirm missing a fish dodge damages the player.
5. Confirm bears move toward the player.
6. Confirm moose move toward the player.
7. Confirm stick/projectile action can clear bear/moose obstacles.
8. Confirm Mom can enter as a moving interruption with a speech bubble.
9. Confirm Sister can enter as a moving interruption with a speech bubble/spin moment.
10. Confirm the player's health meter updates when damage happens.
11. Confirm **Try Again?** appears when health reaches zero.

### Hidden Dev Mode

1. Open normal play at `https://jtripppiie.github.io/hockey-smash/?fresh=0134`.
2. Confirm Watch Computer Play is hidden.
3. Confirm the debug boot log is hidden.
4. Tap/click the splash image 3 times quickly.
5. Confirm Watch Computer Play appears.
6. Confirm the debug boot log appears.
7. Refresh without dev/debug parameters and confirm normal splash remains clean unless the same browser session still has dev mode unlocked.

### Computer Play / Watch Mode Parity

1. Open `https://jtripppiie.github.io/hockey-smash/?computerMode=1`.
2. Confirm the game starts automatically after the splash.
3. Confirm Computer Mode does **not** wait through the 10-second normal-play countdown.
4. Confirm the player moves through right, left, jump, slide, and action phases.
5. Confirm Computer Mode uses the smooth movement behavior, not only the older core movement.
6. Confirm fish/salmon, bear, moose, Mom, and Sister can appear under Computer Mode.
7. Confirm projectile action can appear under Computer Mode action phases.
8. Confirm Computer Mode looks close to normal play except that the computer is choosing the actions.

### Debug Overlay

Use diagnostics only when needed:

```text
https://jtripppiie.github.io/hockey-smash/?computerMode=1&debug=1
```

Checks:

1. Confirm the debug overlay appears when dev/debug mode is active.
2. Confirm it reports useful player/entity/countdown information.
3. Confirm no runtime error text appears during the basic Computer Play route.
4. Confirm the debug log stays away from the D-pad.

### Mobile

1. Test portrait on a phone-sized viewport.
2. Confirm `Rotate for the best gaming experience.` appears briefly.
3. Rotate to landscape and confirm the overlay disappears.
4. Confirm the D-pad stays bottom-left.
5. Confirm action buttons stay bottom-right.
6. Confirm dragging/tapping controls does not move the page.
7. Confirm the 10-second countdown message does not block the controls.

### Local Verification Commands

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

## Known QA Notes

- The current architecture is layered: the core runtime loads first, then later scripts patch or extend movement, HUD, encounters, Try Again, projectiles, character mode, dev tools, and final safety rules.
- The visible badge, package version, cache key, latest final safety layer, README, changelog, workflow docs, QA docs, checklist, progress docs, and beginner handoff guide should all agree on v0.13.4.
- Browser QA still matters because the game uses canvas, DOM overlays, pointer controls, localStorage, sessionStorage, and requestAnimationFrame loops.
