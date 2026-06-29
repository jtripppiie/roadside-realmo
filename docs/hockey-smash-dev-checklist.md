# Hockey Smash Dev Checklist

## Current Checkpoint

- [ ] Confirm visible version says `Hockey Smash v0.12.1 · Build 2026-06-29.36`.
- [ ] Confirm `package.json` version is `0.12.1`.
- [ ] Confirm `index.html` cache keys use `0.12.1-20260629.36`.
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

## Puck And Feedback Polish

- [ ] Confirm a normal stick action fires the standard puck.
- [ ] Confirm a slide stick action fires the low blue puck.
- [ ] Confirm an airborne stick action fires the stronger gold aerial puck.
- [ ] Confirm puck hits show floating text.
- [ ] Confirm fish dodges show floating text.
- [ ] Confirm damage shows floating text and resets combo.

## Score And Replay

- [ ] Confirm distance and score appear in the HUD.
- [ ] Confirm distance and score rise during play.
- [ ] Confirm combo feedback appears after skillful actions.
- [ ] Confirm combo resets when Daniel loses health.
- [ ] Confirm the high score persists after refresh.
- [ ] Confirm the canvas briefly shakes during impact feedback.
- [ ] Confirm the Try Again screen shows distance, score, best combo, puck hits, and fish dodges.

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
- [ ] Confirm encounter pace increases during a longer run.

## Computer Play / Watch Mode

- [ ] Open `http://localhost:8080/?computerMode=1`.
- [ ] Confirm Computer Mode starts automatically.
- [ ] Confirm Computer Mode cycles through right, left, jump, slide, and stick phases.
- [ ] Confirm Computer Mode uses the smooth movement controller.
- [ ] Confirm Computer Mode uses the moving encounter pass.
- [ ] Confirm Computer Mode uses the puck and score layers.
- [ ] Confirm the difference between normal mode and Computer Mode is the driver, not a separate gameplay path.

## Verification

- [ ] Run `npm run verify`.
- [ ] Run browser automation if Playwright is installed: `npm run test:browser`.
- [ ] Check the browser console for runtime errors.
