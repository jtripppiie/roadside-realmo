# Changelog

## 0.13.4 - Start Countdown And Right-Side Salmon Guard

- Shipped **Hockey Smash v0.13.4** with visible build badge `Build 2026-06-29.50`.
- Added a 10-second safe practice countdown after Start Game.
- Shows the gameplay screen and controls during the countdown so players can learn left, right, jump, slide, and action before hazards begin.
- Holds back salmon, wildlife, family interruptions, Dad jokes, and boss progression during the countdown.
- Skips the countdown in `?computerMode=1` so Computer Play and automated diagnostics still start quickly.
- Forces salmon/fish to enter from the right side only and move left toward the player.
- Added extra beginner-friendly comments in `js/games/hockey-smash-v0109.js` explaining dev mode, the countdown, spawn holds, and the salmon direction guard.
- Updated cache keys, package version, README, workflow docs, QA docs, dev checklist, progress notes, beginner handoff guide, and static verifier checks for `0.13.4`.

## 0.13.3 - Normal Splash And Dev-Only Computer Play

- Shipped **Hockey Smash v0.13.3** with visible build badge `Build 2026-06-29.49`.
- Kept normal players focused on Start Game only.
- Hid Watch Computer Play and the debug boot log unless dev mode is active.
- Added splash-image triple-tap unlock for dev mode.
- Kept `?debug=1`, `?dev=1`, and `?computerMode=1` as automatic dev-mode triggers.
- Added final safety checks for Sofie labels and accidental canvas shake.
- Updated cache keys, package version, and verification checks for `0.13.3`.

## 0.13.2 - Dance Smash And Pointe Shoe Projectiles

- Added Sofie/Dance Smash mode labels.
- Updated Sofie's action button to use a pointe-shoe action instead of hockey-stick language.
- Added pointe-shoe projectile behavior for Sofie while Daniel keeps puck behavior.
- Added shoe-specific hit feedback through the score/floating-text layer.

## 0.13.1 - Splash And Title Cleanup

- Fixed the public title language so the splash says **Hockey Smash**.
- Kept Fullscreen inside gameplay instead of showing it as a splash-screen action.
- Continued cache-key cleanup so deployed GitHub Pages checkpoints are easier to verify.

## 0.13.0 - CSS Manifest And Hidden Screen Repair

- Switched `index.html` to load one CSS entry point: `hockey-smash.css`.
- Moved individual CSS layer imports into the CSS manifest.
- Added hard `[hidden]` overrides so hidden splash/gameplay/transition/try-again screens cannot remain clickable.
- Preserved debug tools while keeping them out of normal player flow.

## 0.12.4 - Gameplay Control Stabilization

- Shipped **Hockey Smash v0.12.4** with visible build badge `Build 2026-06-29.39`.
- Reworked `js/games/hockey-smash-v096.js` as a less aggressive movement owner.
- Removed capture-phase control listeners, `stopImmediatePropagation()`, and the old click timing guard from the movement layer.
- Kept keyboard and touch controls writing to the same simple input state.
- Kept pointer tracking, pointer release, touch cancel, blur, and visibility reset behavior.
- Kept Computer Mode on the same movement path while avoiding the prior input fight.
- Added `js/games/hockey-smash-v0107.js` as the final gameplay repair marker for the visible badge and `getVersion()`.
- Updated cache keys, package version, and verifier checks for `0.12.4`.

## 0.12.3 - Player Name And Character Select

- Shipped **Hockey Smash v0.12.3** with visible build badge `Build 2026-06-29.38`.
- Added splash-screen player customization with a name input and Daniel/Sofie character selector.
- Added `hockey-smash-custom.css` for the customization UI.
- Added `js/games/hockey-smash-v0106.js` as the loaded-last player customization layer.
- Added `setPlayerConfig()` and `getPlayerConfig()` to `window.RTA_HOCKEY_SMASH`.
- Persists the selected name and character in `localStorage`.
- Uses `dancer-player.webp` for Sofie and `sister-spinning.webp` for Sofie's slide/spin state.
- Updates splash hero art, HUD name, player overlay label, overlay sprite, Try Again copy, Computer Play copy, status messages, and text bubbles with the selected player name.
- Updated cache keys, package version, README, and verifier checks for `0.12.3`.

## 0.12.2 - Touch Control Reliability

- Shipped **Hockey Smash v0.12.2** with visible build badge `Build 2026-06-29.37`.
- Reworked `js/games/hockey-smash-v096.js` so on-screen D-pad and action buttons use active pointer tracking instead of relying on fragile tap/click timing.
- Added release handling for `pointercancel`, `lostpointercapture`, `touchcancel`, window blur, and page visibility changes so directions do not get stuck.
- Kept keyboard controls on the same smooth movement path.
- Added `hockey-smash-touch.css` with `touch-action: none`, tap-highlight suppression, and pressed-button visual feedback.
- Added a final `js/games/hockey-smash-v0105.js` release marker so the visible badge and `getVersion()` settle on the newest checkpoint after all layered scripts load.
- Updated cache keys, package version, and verifier checks for `0.12.2`.

## 0.12.1 - Puck Variants, Floating Feedback, And Run Summary

- Shipped **Hockey Smash v0.12.1** with visible build badge `Build 2026-06-29.36`.
- Added powered puck variants in `js/games/hockey-smash-v0103.js`.
- Normal slapshots keep the base puck behavior.
- Slide pucks deal more damage and use a low blue visual treatment.
- Aerial slapshots deal the most damage and use a brighter gold visual treatment.
- Added floating feedback text from the score layer for puck hits, fish dodges, combo gains, and damage.
- Added a Try Again run summary with distance, score, best combo, puck hits, and fish dodges.
- Added peak combo, puck-hit, fish-dodge, and damage stats to the score layer.
- Updated cache keys, package version, and verifier checks for `0.12.1`.

## 0.12.0 - Score, Combo, High Score, And Difficulty Ramp

- Shipped **Hockey Smash v0.12.0** with visible build badge `Build 2026-06-29.35`.
- Added `js/games/hockey-smash-v0104.js` as the score, distance, combo, high-score, difficulty, and impact-shake layer.
- Added an in-game score HUD with distance, current score, combo, and high-score messaging.
- Saved high score with `localStorage` so replay attempts have a persistent target.
- Connected puck hits and fish dodges from `js/games/hockey-smash-v0103.js` into the score/combo system.
- Reset combo and triggered a short screen shake when Daniel takes damage.
- Updated `js/games/hockey-smash-v0102.js` so encounter spawn timing ramps up over time.
- Added simple fast/tank encounter variants for less predictable later gameplay.
- Bumped cache keys and package version to `0.12.0`.

## 0.11.8 - Puck Action And Computer Mode Parity

- Shipped **Hockey Smash v0.11.8** with visible build badge `Build 2026-06-29.33`.
- Added `js/games/hockey-smash-v0103.js` as the puck action and fish dodge layer.
- Let stick input also launch a puck that can hit moving bear/moose obstacles.
- Changed fish/salmon damage rules so fish require a jump or slide/duck dodge instead of always dealing normal contact damage.
- Updated `js/games/hockey-smash-v096.js` so Computer Mode no longer skips the newer smooth movement controller.
- Updated `js/games/hockey-smash-v0102.js` so Computer Mode uses the same moving encounter pass as normal play.
- Documented that Computer Mode should now differ mainly by driver: human input in normal play, autoplay input in Watch Mode.

## 0.11.7 - Normal Mode Jump And Salmon Pass

- Shipped **Hockey Smash v0.11.7** with visible build badge `Build 2026-06-29.32`.
- Stopped the older polish touch-control layer from intercepting normal-mode gameplay buttons.
- Let the smoother movement layer own normal-mode jump/slide input so the jump button works reliably.
- Made the normal-mode moving salmon wave start much sooner after play begins.

## 0.11.6 - Health HUD Override

- Shipped **Hockey Smash v0.11.6** with visible build badge `Build 2026-06-29.31`.
- Strengthened the playing-mode CSS selectors so older responsive HUD rules cannot keep the health meter on the right.
- Set the health HUD to the left side of the game frame and scaled it to about 15% larger.

## 0.11.5 - Optimized Road Backgrounds

- Shipped **Hockey Smash v0.11.5** with visible build badge `Build 2026-06-29.30`.
- Converted the five Soldotna road backgrounds from 1920x1080 PNG to 1280x720 WebP.
- Reduced each road background from about 2.5 MB to roughly 120-140 KB.
- Updated the canvas and stage-background loaders to use the optimized WebP files.
- Kept the original PNG files in place as source/reference art.

## 0.11.4 - Left Health HUD

- Shipped **Hockey Smash v0.11.4** with visible build badge `Build 2026-06-29.29`.
- Moved Daniel's in-game health meter from the right side of the canvas to the left.
- Increased the health HUD sizing by about 20% across desktop and mobile layouts.

## 0.11.3 - Lazy Background Loading

- Shipped **Hockey Smash v0.11.3** with visible build badge `Build 2026-06-29.28`.
- Kept only the first road background as an eager HTML preload.
- Deferred later road background image loads until the player reaches those sections.
- Kept drawing the last decoded background while the next one loads to avoid black flashes.
- Left the current full-scene art in place; recommended future replacement is game-sized full-scene WebP/JPEG sections rather than tiny tiles.

## 0.11.2 - Sliding And Sister Sprites

- Shipped **Hockey Smash v0.11.2** with visible build badge `Build 2026-06-29.27`.
- Swapped Daniel's overlay to `hockey-player-sliding.png` while the slide state is active.
- Swapped Sister's overlay to `sister-spinning.png`.
- Added Sister to the normal moving encounter wave so the spinning sprite appears during play.
- Preloaded the new gameplay sprites and refreshed the static verifier for the current v0.11.x files.

## 0.11.1 - In-Canvas Health HUD Layout

- Shipped **Hockey Smash v0.11.1** with visible build badge `Build 2026-06-29.26`.
- Added `hockey-smash-v0111.css` as a layout-only gameplay HUD polish file.
- Moved Daniel's health meter into the upper-right of the game/canvas area.
- Hid the in-game title/status HUD blocks so the game name no longer takes space above the canvas during play.
- Removed the portrait mobile canvas top margin so the game area starts higher on the screen.
- Kept movement, gameplay enemies, Computer Mode, and Try Again behavior unchanged.

## 0.11.0 - Smooth Movement Controller

- Shipped **Hockey Smash v0.11.0** with visible build badge `Build 2026-06-29.25`.
- Reworked the already-loaded movement file `js/games/hockey-smash-v096.js` into a clean smooth movement controller.
- Implemented the smooth-platformer idea inside Hockey Smash instead of importing the reference repository.
- Left/right now use held input with acceleration and deceleration.
- Jump now includes a short jump buffer, coyote-time forgiveness, and early-release jump cut-off.
- Slide is now a timed crouch/slide state with cooldown and a low stretched visual.
- Stick input is left to the core game so existing stick combat can still clear wildlife objects.
- Kept Computer Mode on the original driver so it remains useful for QA.
- Cache-busted the live page to load the v0.11.0 controller.

## 0.10.2 - Movement And Encounter Repair

- Shipped **Hockey Smash v0.10.2** with visible build badge `Build 2026-06-29.23`.
- Removed the v0.10.1 platformer-feel movement takeover from the live page because it could block the working control chain.
- Kept the earlier v0.9.7 smooth left/right and slide movement layer loaded.
- Added `js/games/hockey-smash-v0102.js` as a small repair layer that does not control movement.
- Added a visible starter gameplay cast in normal play: salmon/fish, Mom, bear, and moose spawn after play begins.
- Kept Game Over / Try Again and Computer Mode sizing loaded.

## 0.10.1 - Platformer Movement Feel

- Shipped **Hockey Smash v0.10.1** with visible build badge `Build 2026-06-29.22`.
- Reviewed `ZeroDayArcade/HTML5_Platformer` for movement inspiration: separate run, jump, attack, crouch, and hurt sprites are loaded up front, which makes the character state changes read clearly.
- Added `js/games/hockey-smash-v0101.js` as a loaded-last platformer-feel movement layer.
- Added acceleration and friction so left/right movement eases in and out instead of feeling like repeated button shoves.
- Added jump buffering and coyote-time forgiveness so the jump button is more responsive.
- Added variable jump height when the jump button is released early.
- Improved slide/crouch as a short controlled movement state with a lower, stretched visual.
- Kept Computer Mode, normal encounters, Game Over, and Try Again intact.

## 0.10.0 - Game Over And Try Again Flow

- Shipped **Hockey Smash v0.10.0** with visible build badge `Build 2026-06-29.21`.
- Added `js/games/hockey-smash-v0100.js` as a Game Over / retry flow.
- Watches Daniel's health during play and opens the existing **Try Again?** screen when health reaches zero.
- Stops movement/slide state under the overlay so the run does not continue invisibly.
- Makes the **Try Again** button reload the current page for a clean reset.
- Added focused overlay styling so the retry screen appears clearly on top of gameplay.

## 0.9.9 - Computer Mode Entity Sizing

- Shipped **Hockey Smash v0.9.9** with visible build badge `Build 2026-06-29.20`.
- Added `js/games/hockey-smash-v099.js` as a Computer Mode sizing pass.
- Normalized salmon/fish, bear, moose, Mom, Sister, Dad, and Dad joke dimensions in `?computerMode=1`.
- Kept fish smaller and airborne.
- Kept bear medium-large and moose larger than bear while still fitting the road area.
- Added a continuous sizing loop so newly spawned Computer Mode entities are corrected as they appear.

## 0.9.8 - Normal Gameplay Encounters

- Shipped **Hockey Smash v0.9.8** with visible build badge `Build 2026-06-29.19`.
- Added `js/games/hockey-smash-v098.js` as a normal-mode gameplay encounter pass.
- Brought Computer Mode-style characters into normal play as staged road-section encounters.
- Added fish/salmon dodge hazards.
- Added bear and moose obstacle encounters that can be cleared with stick attacks or dodged where appropriate.
- Added Mom and Sister interruption moments with speech bubbles and small health/slowdown effects.
- Added a late Dad challenge plus Dad joke hazard.
- Kept this as a first gameplay integration pass, not final level tuning.
