# Hockey Smash Dev Checklist

## Current Checkpoint

- [ ] Confirm visible version says `Hockey Smash v0.11.8 · Build 2026-06-29.33`.
- [ ] Confirm `package.json` version is `0.11.8`.
- [ ] Confirm `index.html` cache keys use `0.11.8-20260629.33`.
- [ ] Confirm README, CHANGELOG, QA, workflow, and checklist docs are updated when behavior changes.

## Local Run

- [ ] Run the game locally with `python3 -m http.server 8080`.
- [ ] Open `http://localhost:8080/`.
- [ ] Confirm splash screen says `Hockey Slash 2`.
- [ ] Confirm Play starts the transition screen.
- [ ] Confirm the game fills the browser viewport.
- [ ] Confirm the page does not scroll during gameplay.

## Normal Controls

- [ ] Confirm Daniel moves left and right smoothly.
- [ ] Confirm Daniel jumps.
- [ ] Confirm slide/duck works.
- [ ] Confirm the stick button works.
- [ ] Confirm the puck visual appears from stick input.
- [ ] Confirm the health bar updates.
- [ ] Confirm mobile landscape layout works.
- [ ] Confirm the rotate overlay appears temporarily in portrait.

## Gameplay Encounters

- [ ] Confirm fish/salmon fly across the screen.
- [ ] Confirm fish can be avoided by jumping.
- [ ] Confirm fish can be avoided by sliding/ducking.
- [ ] Confirm missed fish lowers Daniel's health.
- [ ] Confirm bears move toward Daniel.
- [ ] Confirm moose move toward Daniel.
- [ ] Confirm bear/moose obstacles can be cleared during play.
- [ ] Confirm Mom can appear with a speech bubble.
- [ ] Confirm Sister can appear with a speech bubble/spin moment.
- [ ] Confirm Try Again appears when Daniel runs out of health.

## Computer Play / Watch Mode

- [ ] Open `http://localhost:8080/?computerMode=1`.
- [ ] Confirm Computer Mode starts automatically.
- [ ] Confirm Computer Mode cycles through right, left, jump, slide, and stick phases.
- [ ] Confirm Computer Mode uses the smooth movement controller.
- [ ] Confirm Computer Mode uses the moving encounter pass.
- [ ] Confirm Computer Mode can show fish, bear, moose, Mom, Sister, and puck action.
- [ ] Confirm the difference between normal mode and Computer Mode is the driver, not a separate gameplay path.

## Verification

- [ ] Run `npm run verify`.
- [ ] Run browser automation if Playwright is installed: `npm run test:browser`.
- [ ] Check the browser console for runtime errors.
