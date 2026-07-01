# Hockey Smash v2 Progress Log

This file records the architectural cleanup steps so work can continue in small, reversible chunks.

## Ground Rule

The current live game remains the current live game until a specific integration step is reviewed.

V2 work is currently isolated. It should not be loaded by `index.html` yet.

## Completed

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

Controls:

```text
A / Left Arrow  -> left
D / Right Arrow -> right
W / Up / Space  -> jump
S / Shift       -> slide
F / Enter       -> shoot
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
- preview a Daniel/brother helper as a non-contact support entity
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
- allow v2 projectiles to clear wildlife
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

### Step 10: V2 projectile preview

Added inside:

```text
dev/hockey-smash-v2.html
```

Purpose:

- preview a simple projectile as a world entity
- use `F`, `Enter`, or the Shoot button to fire
- use canvas/world coordinates for projectile movement
- collide projectiles with damageable v2 entities
- clear targets when health reaches zero

Important safety notes:

- live projectile files were not changed
- no DOM projectile collision bridge was added
- projectile preview exists only in the dev harness page

Status:

```text
complete, development-only
```

## Current Live Game Impact

None intended.

The v2 world and renderer are passive files. They only expose future helper objects on `window` if a page explicitly loads them. The real game page does not currently load them.

The dev harness is a separate page under `dev/`. It is not loaded by the live game.

## Remaining Before Live Integration

Before any v2 code is loaded into the real page, verify the dev harness manually:

- Daniel renders and moves
- Sofie renders and moves
- jump works
- slide changes the player sprite key
- shoot creates a projectile
- countdown starts first
- salmon spawn only after countdown
- salmon collection increments once per salmon
- 20 salmon opens the encounter phase
- Mom appears as non-contact and expires
- Dad appears as a world entity
- dance instructor appears for Sofie
- brother helper appears as non-contact support
- bear and moose appear as world entities
- projectiles can clear damageable entities
- cameos are canvas/world entities, not DOM overlays

## Do Not Do Yet

Do not migrate these into the current game yet:

- player rendering
- salmon-run controller
- current countdown
- current Sofie overlay
- current Alaska cameo overlay
- current projectile system
- current stage-flow file

Those changes should wait until the v2 harness is manually tested and approved.
