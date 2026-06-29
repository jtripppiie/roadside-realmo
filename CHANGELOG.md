# Changelog

## 0.9.1 - Continuous Road Progression And Computer Player Cleanup

- Shipped **Hockey Smash v0.9.1** with visible build badge `Build 2026-06-29.12`.
- Added `js/games/hockey-smash-v091.js` as a focused gameplay override.
- Hid the DOM Daniel overlay during Computer Play so the canvas-controlled computer player is not duplicated.
- Added continuous road-section progression: when Daniel reaches the right edge, the game advances to the next Soldotna background section and places Daniel back on the left.
- Added backtracking support from the left edge to the previous road section.
- Added final-section looping so Daniel is no longer hard-stopped at the first background.
- Updated package metadata, README, static verification, and browser tests.

## 0.9.0 - Character Overlays, Fullscreen, And Mobile Playability

- Shipped **Hockey Smash v0.9.0** with visible build badge `Build 2026-06-29.11`.
- Added fullscreen controls on the splash screen and during gameplay.
- Added a dedicated `hockey-smash-v09.css` stylesheet for v0.9 fullscreen, entity overlay, and landscape-phone layout work.
- Added visible DOM overlays synced to live game state for salmon/fish, bears, moose, Mom, Sister, Dad, and Dad jokes.
- Kept Daniel visible through the existing player overlay and scaled him down on compact mobile layouts.
- Added a visible jump impulse so the mobile `J` button clearly moves Daniel upward.
- Preserved D-pad fallback movement and Watch Computer Play mode.
- Updated README, static verification, and browser tests for the v0.9 milestone.

## 0.5.11 - Portrait Mobile Layout Fix

- Shipped **Hockey Smash v0.5.11** with visible build badge `Build 2026-06-29.8`.
- Added portrait-specific gameplay layout so the HUD, canvas, Daniel, and controls no longer stack into each other on phones.
- Compacted the mobile HUD and hid the oversized Ready/status panel in portrait play.
- Positioned the canvas near the top of the portrait viewport and kept controls separated below it.
- Relaxed D-pad movement state checks so the buttons can move Daniel even if the game still reports a Ready/transition state.
- Added portrait browser test coverage for canvas/control separation and D-pad movement.

## 0.5.10 - Document-Level D-pad Hit Testing

- Shipped **Hockey Smash v0.5.10** with visible build badge `Build 2026-06-29.7`.
- Added document-level D-pad hit testing so movement can trigger even if the button's own listener is not receiving the event.
- Added a global `window.HOCKEY_SMASH_DPAD` fallback API for direct movement calls.
- Increased the D-pad tap movement step so a press should be visibly obvious.
- Updated browser tests and static verification for the global D-pad fallback.

## 0.5.9 - Direct D-pad Movement Fallback

- Shipped **Hockey Smash v0.5.9** with visible build badge `Build 2026-06-29.6`.
- Added a direct D-pad movement fallback that mutates the live game state when the left/right buttons are pressed.
- Added pointer capture and hold-to-move behavior for the on-screen directional buttons.
- Kept the visible Daniel overlay synced after direct D-pad movement.
- Updated browser tests and static verification so D-pad clicks must change Daniel's x-position.

## 0.5.8 - Normal Movement And Road Anchoring

- Shipped **Hockey Smash v0.5.8** with visible build badge `Build 2026-06-29.5`.
- Lowered Daniel's normal-mode overlay so his feet anchor to the visible road/sidewalk area instead of floating near the sign.
- Centered the overlay on the real player state and preserved jump lift.
- Added tap-to-move impulse handling so quick D-pad taps visibly move Daniel instead of requiring a long press.
- Softened the emergency yellow marker styling so it reads more like a gameplay marker while the sprite presentation stabilizes.
- Updated browser tests and static verification for normal movement and player-overlay position syncing.

## 0.5.7 - Player-Facing Computer Play Mode

- Shipped **Hockey Smash v0.5.7** with visible build badge `Build 2026-06-29.4`.
- Added a splash-screen **Watch Computer Play** entry point that launches `?computerMode=1`.
- Reframed Computer Mode as a watch/autoplay play mode instead of only a debug route.
- Hid the diagnostic overlay by default unless `&debug=1` is present.
- Added a player-facing Computer Play panel during autoplay.
- Updated verification and browser tests so the watch mode is treated as a supported game path.

## 0.5.4 - Normal Mode Player Visibility

- Shipped **Hockey Smash v0.5.4** with visible build badge `Build 2026-06-29.1`.
- Added a normal-mode player overlay using `assets/hockey-smash/sprites/hockey-player.png` so Daniel is visible outside `?computerMode=1`.
- Kept the overlay synced to the real game-state player position and facing.
- Updated the runtime visible badge and `getVersion()` reporting to match the latest visible checkpoint.
- Updated browser and static verification to fail if the latest badge or player overlay is missing.
