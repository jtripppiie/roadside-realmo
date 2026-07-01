# Hockey Smash v2 Progress Log

This file records the architectural cleanup steps so work can continue in small, reversible chunks.

## Ground Rule

V2 is now the active Hockey Smash path. Keep gameplay in world state and canvas rendering; keep DOM for app UI, controls, and accessible status.

## Completed

### 2026-07-01: Stage 1.5 Debug Mode and Quality-of-Life

Changed:
- `dev/hockey-smash-v2.html`
- `js/games/hockey-smash-world-v2.js`
- `js/games/hockey-smash-renderer-v2.js`
- `scripts/verify-hockey-smash.js`
- `README.md`
- `docs/hockey-smash-next-polish-plan.md`
- `docs/hockey-smash-v2-progress.md`
- `docs/hockey-smash-v2-migration-checklist.md`

Gameplay impact:
- Debug mode is now opt-in with `?debug=1`.
- The debug overlay can show FPS, phase, salmon count, entity counts, threat/wildlife counts, player position/velocity, grounded state, projectile cooldown, and last collision.
- `~`, `H`, and `G` toggle the debug overlay, hitboxes, and god mode only when debug mode is enabled.
- Keyboard and touch action input now has edge-triggered `jumpPressed` and `stickPressed` flags for cleaner follow-up tuning.

Verification:
- `npm run verify`: passed
- `npm run test:browser`: not run
- manual browser check: not run

Known issues:
- Browser QA still needs an available local port because `8000` was occupied during the initial audit.

Next:
- Add centralized difficulty state and use it for encounter pacing.

### 2026-07-01: Stage 2 Centralized Difficulty Controller

Changed:
- `dev/hockey-smash-v2.html`
- `js/games/hockey-smash-world-v2.js`
- `scripts/verify-hockey-smash.js`
- `README.md`
- `docs/hockey-smash-v2-progress.md`
- `docs/hockey-smash-v2-migration-checklist.md`

Gameplay impact:
- Encounter pacing now reads from `world.difficulty` instead of hard-coded harness-only timers.
- Encounters start with one active threat and one active wildlife limit.
- Bear, moose, eagle, Dad, and dance instructor speeds use the centralized speed multiplier.
- Post-gate salmon timing now uses difficulty fields.
- Difficulty ramps gently only during the encounters phase.

Verification:
- `npm run verify`: passed
- `npm run test:browser`: not run
- manual browser check: not run

Known issues:
- Manual browser QA still needs a free local port.

Next:
- Continue with Soldotna parallax asset inventory and final layer wiring.

### Step 1: Isolated v2 world scaffold

Added:

```text
js/games/hockey-smash-world-v2.js
```

Purpose:

- define the future world shape
- define phase names
- define sprite keys
- define player/entity factories
- document Mom, salmon, and cameo shapes in code

Status:

```text
complete, not loaded by index.html
```

### Step 2: Isolated v2 renderer scaffold

Added:

```text
js/games/hockey-smash-renderer-v2.js
```

Purpose:

- render a v2 world object to a canvas context
- draw background, entities, player, effects, and simple bubbles
- keep rendering based on explicit world state instead of DOM overlays

Important safety notes:

- does not start its own animation loop
- does not register input listeners
- does not append DOM nodes
- does not patch `window.RTA_HOCKEY_SMASH`
- is not loaded by `index.html`

Status:

```text
complete, not loaded by index.html
```

### Step 3: Isolated v2 dev harness

Added:

```text
dev/hockey-smash-v2.html
```

Purpose:

- load only the v2 world scaffold and v2 renderer scaffold
- create a separate canvas that is not the live game canvas
- preview Daniel/Sofie from v2 state
- prove v2 can render without current-game patch layers

Important safety notes:

- does not modify `index.html`
- does not replace the live game
- does not load current-game patch layers
- does not use the live `#hockey-canvas`

Status:

```text
complete, development-only
```

### Step 4: Basic v2 input adapter in the dev harness

Added inside:

```text
dev/hockey-smash-v2.html
```

Purpose:

- map keyboard input to a small v2 input object
- map pointer/touch buttons to the same input object
- move the v2 player in the dev harness only
- test Daniel and Sofie as canvas-rendered player sprites
- align the action names with the live game: `jump`, `slide`, and `stick`

Controls:

```text
A / Left Arrow  -> left
D / Right Arrow -> right
W / Up / Space  -> jump
S / Shift       -> slide
F / Enter       -> stick / throw
```

Important safety notes:

- input listeners are local to the dev harness page
- no input listener was added to the live game
- no current-game state is read or patched

Status:

```text
complete, development-only
```

### Step 5: V2 salmon update loop inside the isolated harness

Added inside:

```text
dev/hockey-smash-v2.html
```

Purpose:

- spawn salmon only after the v2 dev countdown reaches `salmonRun`
- move salmon in canvas world coordinates
- apply falling acceleration to salmon
- collect salmon when the v2 player overlaps the salmon hitbox
- increment `world.salmonCaught` once per collected salmon
- show salmon count and active entity count in the readout
- show a `+SALMON` canvas effect on collection

Important safety notes:

- no live game file was touched for salmon behavior
- no live salmon-run logic was changed
- no current-game state is read or patched
- salmon loop exists only in the dev harness page

Status:

```text
complete, development-only
```

### Step 6: Prove 20-salmon gate in v2

Added inside:

```text
dev/hockey-smash-v2.html
```

Purpose:

- keep v2 in `countdown` first
- enter `salmonRun` after countdown
- keep encounter spawning locked during the salmon run
- switch to `encounters` only after `world.salmonCaught >= world.salmonTarget`
- show a `20 SALMON!` canvas effect when the gate opens

Important safety notes:

- the live stage-flow file was not changed
- the live salmon-run gate was not changed
- the v2 gate is development-only

Status:

```text
complete, development-only
```

### Step 7: V2 family/cast entity previews

Added inside:

```text
dev/hockey-smash-v2.html
```

Purpose:

- preview Mom as a timed, non-contact world entity
- preview Dad as a moving world entity
- preview dance instructor in Sofie mode
- render speech bubbles through the v2 canvas renderer

Rules represented:

- Mom is stationary
- Mom expires by timer
- Mom is non-contact
- Mom says `[Name], clean your room!`
- dance instructor is Sofie-specific in the harness

Status:

```text
complete, development-only
```

### Step 8: V2 wildlife previews

Added inside:

```text
dev/hockey-smash-v2.html
```

Purpose:

- preview bear as a canvas/world entity
- preview moose as a canvas/world entity
- give wildlife health values
- allow v2 stick/throw projectiles to clear wildlife
- keep wildlife movement in canvas world coordinates

Status:

```text
complete, development-only
```

### Step 9: V2 Alaska cameo previews

Added inside:

```text
dev/hockey-smash-v2.html
```

Purpose:

- preview Alaska boy/girl cameos as canvas/world entities
- keep cameos non-contact
- keep cameos timed with a lifetime
- avoid DOM overlay cameos in v2

Current mapping:

```text
Daniel mode -> Alaskan girl cameo
Sofie mode  -> Alaskan boy cameo
```

This mapping can still be changed before any live integration.

Status:

```text
complete, development-only
```

### Step 10: V2 stick/throw projectile preview

Added inside:

```text
dev/hockey-smash-v2.html
```

Purpose:

- preview a simple projectile as a world entity
- use `F`, `Enter`, or the Throw / Swing button to fire
- use canvas/world coordinates for projectile movement
- fire stick/throw projectiles to the right only
- collide projectiles with damageable v2 entities
- clear targets when health reaches zero
- keep the action name aligned with the live `stick` action

Important safety notes:

- live projectile files were not changed
- no DOM projectile collision bridge was added
- projectile preview exists only in the dev harness page
- projectile art is still a placeholder until dedicated puck/shoe/throw sprites are added

Status:

```text
complete, development-only
```

### Step 11: V2 harness play shell and tuning pass

Updated:

```text
dev/hockey-smash-v2.html
js/games/hockey-smash-world-v2.js
```

Purpose:

- add a compact v2 splash/start screen inside the isolated harness play area
- add v2-only player name input and Daniel/Sofie selection before the world starts
- move v2 touch controls into the gameplay frame instead of the side panel
- add a fullscreen toggle for the v2 harness frame
- make the harness responsive for narrow portrait phones and landscape phones
- keep the debug readout out of the splash until the game starts
- slow salmon falling behavior and make player movement more responsive
- add animated salmon landing markers on the ground so players can move toward falling fish early
- add parallax-ready background layers, sun/moon sky rendering, and a night-sky filter
- add placeholder parallax asset files with exact dimensions and filenames embedded in the artwork
- keep Mom proportional to the tall source sprite instead of stretching her wide

Current v2 tuning:

```text
walkSpeed: 360
slideSpeed: 575
salmonSpawnSeconds: 1.12
salmonFallVelocity: 235
salmonFallVelocityRange: 45
salmonFallGravity: 275
```

Current Mom preview shape:

```text
width: 49
height: 132
nonContact: true
stationary/timed: yes
```

Manual checks performed:

```text
npm run verify:syntax
Chromium smoke checks at 320x568, 360x640, 390x844, 844x390, and 1280x900
```

Important safety notes:

- v2 is now the active gameplay path
- `index.html` routes to the v2 harness page
- old v1 runtime files have been removed from the active repo

Status:

```text
complete, development-only
```

## Current Active Game Impact

V2 is the current playable direction. The root page routes to `dev/hockey-smash-v2.html`, and the old layered v1 runtime has been removed from the active repo.

## Remaining Manual Checks

Before publishing another milestone, verify the v2 harness manually:

- Daniel renders and moves
- Sofie renders and moves
- jump works
- slide changes the player sprite key
- stick/throw creates a projectile
- countdown starts first
- salmon spawn only after countdown
- salmon collection increments once per salmon
- 20 salmon opens the encounter phase
- Mom appears as non-contact and expires
- Dad appears as a world entity
- dance instructor appears for Sofie
- bear and moose appear as world entities
- projectiles can clear damageable entities
- cameos are canvas/world entities, not DOM overlays

## Do Not Reintroduce

Do not rebuild these as gameplay DOM overlays:

- player rendering
- salmon-run controller
- current countdown
- current Sofie overlay
- current Alaska cameo overlay
- current projectile system
- current stage-flow file

Those changes should wait until the v2 harness is manually tested and approved.
