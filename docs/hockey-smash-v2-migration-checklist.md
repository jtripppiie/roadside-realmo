# Hockey Smash v2 Migration Checklist

This checklist exists so the v2 game can keep being cleaned up without reintroducing the old layered runtime.

## Current Status

V2 is now the active Hockey Smash path.

`index.html` routes to the v2 harness page while the project continues consolidating gameplay into world state and canvas rendering.

Current v2 files:

```text
js/games/hockey-smash-world-v2.js
js/games/hockey-smash-renderer-v2.js
dev/hockey-smash-v2.html
```

## Hard Rule

Do not reintroduce the old v1 runtime or gameplay DOM overlays.

A safe v2 commit may add:

- docs
- v2 modules
- dev harness helpers
- browser tests
- notes/checklists

A safe v2 commit should keep gameplay objects in world state:

- player movement
- salmon and landing markers
- countdown and salmon gate
- current character picker
- current controls
- current scoring
- debug state and debug-only diagnostics
- current version-lock behavior
- current loaded gameplay files

## Completed Foundation Steps

### 1. Document the current direction

Done in:

```text
docs/hockey-smash-v2-architecture.md
docs/hockey-smash-v2-migration-checklist.md
docs/hockey-smash-v2-progress.md
```

### 2. Keep the v2 world isolated

Done in:

```text
js/games/hockey-smash-world-v2.js
```

The v2 world file defines:

- phase names
- tuning constants
- sprite paths
- entity factory helpers
- player shape
- Mom shape
- cameo shape
- salmon-run target

It does not:

- start a game loop
- register input listeners
- create DOM nodes
- append elements to the page
- draw on the real canvas
- mutate `window.RTA_HOCKEY_SMASH`

### 3. Add a v2 renderer separately

Done in:

```text
js/games/hockey-smash-renderer-v2.js
```

The renderer takes a world object and a canvas context:

```js
renderWorld(ctx, world, imageCache)
```

It renders from explicit world state. It does not start a loop, read previous v1 runtime state, or append DOM overlays.

### 4. Add a v2 dev harness with basic input adapter

Done in:

```text
dev/hockey-smash-v2.html
```

The dev harness:

- loads only the v2 world and renderer
- creates its own separate canvas
- previews Daniel and Sofie as canvas-rendered player sprites
- maps keyboard and pointer controls to a local v2 input object
- moves the v2 player in the harness only
- uses the same gameplay action names as the live controls: `jump`, `slide`, and `stick`
- does not touch the real game page

Controls:

```text
A / Left Arrow  -> left
D / Right Arrow -> right
W / Up / Space  -> jump
S / Shift       -> slide
F / Enter       -> stick / throw
```

### 5. Add v2 salmon loop inside the dev harness

Done in:

```text
dev/hockey-smash-v2.html
```

Implemented:

- salmon spawn in the v2 harness only
- salmon fall in canvas world units
- player overlaps salmon to collect it
- collected count increments once per salmon
- readout shows salmon count
- salmon behavior stays in v2 world/canvas flow

### 6. Prove 20-salmon gate in v2

Done in:

```text
dev/hockey-smash-v2.html
```

Implemented:

- countdown happens first
- no v2 encounter entities spawn during countdown
- salmon-only run starts after countdown
- encounters unlock only after 20 salmon
- dev harness readout shows the phase transition

### 7. Add v2 family/cast entity previews

Done in:

```text
dev/hockey-smash-v2.html
```

Implemented:

- Mom is stationary
- Mom appears briefly
- Mom only says `[Name], clean your room!`
- Mom is non-contact
- Dad appears as a world entity
- dance instructor appears in Sofie mode

### 8. Add v2 wildlife previews

Done in:

```text
dev/hockey-smash-v2.html
```

Implemented:

- bear enters screen visibly as a world entity
- moose enters screen visibly as a world entity
- speeds are tuned in the harness
- stick/throw projectiles can clear damageable wildlife
- no DOM collision bridge is involved

### 9. Add v2 cameos as world entities

Done in:

```text
dev/hockey-smash-v2.html
```

Implemented:

- Alaska boy/girl cameos are optional world entities
- cameos are non-contact
- cameos expire by lifetime
- no DOM overlay cameos are used in v2

Current mapping:

```text
Daniel mode -> Alaskan girl cameo
Sofie mode  -> Alaskan boy cameo
```

This mapping can still be changed before live integration.

### 10. Add v2 stick/throw projectile preview

Done in:

```text
dev/hockey-smash-v2.html
```

Implemented:

- projectiles are entities in the same coordinate system as every target
- the input action is `stick`, matching the active v2 action name
- UI labels it as Throw / Swing so Daniel and Sofie both make sense
- projectile position is in canvas world units
- projectiles fire to the right only
- projectile target checks use world hitboxes
- collision results are deterministic inside the dev harness
- live projectile files are untouched
- projectile art is still placeholder until dedicated puck/shoe/throw sprites are added

### 11. Add v2 harness splash, mobile layout, fullscreen, and tuning

Done in:

```text
dev/hockey-smash-v2.html
js/games/hockey-smash-world-v2.js
```

Implemented:

- compact v2 splash/start screen inside the isolated harness frame
- v2-only player name input
- v2-only Daniel/Sofie selection before Start
- fullscreen toggle for the v2 harness frame
- touch controls inside the gameplay frame after Start
- responsive portrait-phone and landscape-phone sizing
- debug overlay hidden until the harness starts
- slower salmon fall tuning
- animated salmon landing markers on the ground before each fish lands
- parallax-ready background layer config
- sun/moon sky rendering with a night-sky filter
- placeholder parallax asset files with exact filenames and dimensions
- faster player walk/slide tuning
- proportional Mom preview dimensions based on the tall Mom sprite

### 12. Add debug mode and diagnostic toggles

Done in:

```text
dev/hockey-smash-v2.html
js/games/hockey-smash-world-v2.js
js/games/hockey-smash-renderer-v2.js
scripts/verify-hockey-smash.js
```

Implemented:

- debug mode is off by default
- `?debug=1` creates an enabled world debug object
- `~` shows and hides the debug overlay
- `H` shows and hides hitboxes only when debug mode is enabled
- `G` toggles god mode only when debug mode is enabled
- the debug panel reports FPS, phase, salmon count, entities, active threats, active wildlife, difficulty, player position, player velocity, grounded state, projectile cooldown, and last collision
- hitboxes render in canvas through the v2 renderer
- gameplay entities remain in world/canvas state

### 13. Add centralized difficulty state

Done in:

```text
js/games/hockey-smash-world-v2.js
dev/hockey-smash-v2.html
scripts/verify-hockey-smash.js
```

Implemented:

- `world.difficulty` is created with the world
- `updateDifficulty(world, dt)` only ramps during `encounters`
- level starts at 1 and increases every 45 encounter seconds
- speed multiplier ramps slowly and is capped
- encounter spawn windows shrink gently over time
- active threat cap starts at 1
- active wildlife cap stays at 1
- bear, moose, eagle, Dad, and dance instructor spawns consult active caps
- post-gate salmon timing reads from difficulty state

Current tuning values:

```text
walkSpeed: 360
slideSpeed: 575
salmonSpawnSeconds: 1.12
salmonFallVelocity: 235
salmonFallVelocityRange: 45
salmonFallGravity: 275
```

Current v2 Mom preview:

```text
width: 49
height: 132
nonContact: true
ttl: 4.8
```

Validation performed:

```text
npm run verify:syntax
Chromium viewport checks: 320x568, 360x640, 390x844, 844x390, 1280x900
```

## DOM Overlay Audit Categories

Use this classification when deciding what to keep or move.

### Keep as DOM

- splash screen
- buttons
- text input
- HUD text
- countdown panel
- debug panel
- fullscreen toggle
- accessibility status text

### Move to canvas/world state

- Sofie gameplay sprite
- Alaska cameo
- speech bubbles attached to characters
- Mom/Dad/dance-instructor visuals
- projectiles
- any object that can move, expire, collide, or affect gameplay

## Versioning Rule

Only one file should own the visible build label.

Current version owner:

```text
js/games/hockey-smash-version-lock.js
```

No other gameplay file should write:

- `badge.textContent`
- `getVersion`
- `DISPLAY_VERSION`
- `DISPLAY_BUILD`

## Current V2 Verification Gate

Before publishing another milestone, verify:

- root routes into the v2 harness
- countdown appears
- salmon fall after countdown
- salmon landing markers appear on the ground
- sun/moon and parallax background render behind gameplay
- 20 salmon unlocks encounters
- Sofie appears if selected
- Daniel appears if selected
- version badge is correct
- no lawnmower Dad appears during salmon run
- v2 Daniel/Sofie movement works
- v2 salmon gate works
- v2 family/wildlife/cameo/projectile previews work

## Recommended Next Step

Manual test the v2 harness:

```text
dev/hockey-smash-v2.html
```

Keep improving the v2 harness behavior before moving the entry file out of `dev/`.

## Success Definition

The cleanup is successful when gameplay objects are no longer split between DOM and canvas.

The final architecture should feel boring:

```text
input changes state
systems update state
renderer draws state
DOM shows UI
```

Boring is good here. Boring means fewer surprise bugs.
