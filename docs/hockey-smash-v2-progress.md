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
```

Important safety notes:

- input listeners are local to the dev harness page
- no input listener was added to the live game
- no current-game state is read or patched

Status:

```text
complete, development-only
```

## Current Live Game Impact

None intended.

The v2 world and renderer are passive files. They only expose future helper objects on `window` if a page explicitly loads them. The real game page does not currently load them.

The new dev harness is a separate page under `dev/`. It is not loaded by the live game.

## Next Step

### Step 5: Add v2 salmon update loop inside the isolated harness

Recommended work:

- spawn salmon inside the v2 dev harness
- update salmon positions using v2 world units
- collect salmon when the player overlaps them
- show salmon count in the dev readout
- keep all logic inside the v2 harness/world path

Rules for Step 5:

- do not modify `index.html`
- do not replace the real game
- do not load current-game patch layers
- do not touch the live salmon-run implementation

## Later Steps

1. Add v2 salmon update loop inside the isolated harness.
2. Prove 20-salmon gate in v2.
3. Add v2 Mom/Dad/family entity previews.
4. Add v2 wildlife entity previews.
5. Add v2 cameos as canvas/world entities.
6. Only then discuss wiring a v2 piece into the real game.

## Do Not Do Yet

Do not migrate these into the current game yet:

- player rendering
- salmon-run controller
- current countdown
- current Sofie overlay
- current Alaska cameo overlay
- current projectile system
- current stage-flow file

Those changes should wait until the v2 harness proves the isolated model works.
