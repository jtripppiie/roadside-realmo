# Hockey Smash v2 Architecture Plan

## Purpose

This document describes the safer long-term direction for Hockey Smash. The current game works as a canvas game with many DOM overlay patches. That helped us move quickly, but it also made the game fragile because visual objects, gameplay objects, timers, and collision logic can live in different places.

The v2 direction is to move gameplay back into one game-world model:

```text
state -> systems -> canvas renderer
```

The current game must keep working while this is built. Nothing in this plan should be wired into `index.html` until a later, deliberate migration step.

## Current Rule

Do not replace the current game yet.

The v2 files should be treated as isolated foundation files until explicitly enabled. They should not:

- add script tags to `index.html`
- change current player movement
- change the countdown
- change the current salmon run
- change current collisions
- change current DOM overlays
- change build/version behavior

## Target Split

### DOM should own app UI

DOM is appropriate for:

- splash screen
- character picker
- name input
- start/retry buttons
- HUD text
- score labels
- countdown panel
- debug panel
- fullscreen button
- accessibility-only status text

### Canvas should own game-world objects

Canvas/world state should own:

- Daniel player sprite
- Sofie player sprite
- salmon
- bears
- moose
- Dad
- Mom
- dance instructor
- Daniel/brother helper
- Alaska boy/girl cameo
- projectiles
- speech bubbles attached to game objects
- weather visuals that belong inside the game world
- lifetimes and timers for game-world objects
- object-to-object overlap checks

## Why This Matters

The current game has multiple systems representing the same world:

```text
canvas state: positions, entities, player, salmon, hazards
DOM overlays: Sofie sprite, bubbles, cameos, countdown, some projectile visuals
```

When gameplay objects are DOM overlays, every frame needs a coordinate bridge between DOM pixels and canvas world units. That makes bugs more likely:

- object appears but cannot collide
- object collides but is not visible
- object stays forever because its DOM node has no world lifetime
- startup sequence is blocked by a patch layer
- script order changes the visible result

V2 should make one object responsible for movement, lifetime, rendering, and interaction.

## Proposed V2 Runtime Shape

The ideal runtime shape is:

```text
GameWorld
  phase
  player
  entities[]
  effects[]
  timers
  input
  messages
```

Example entity shape:

```js
{
  id: 'salmon-12',
  type: 'salmon',
  sprite: 'salmon',
  x: 320,
  y: 40,
  width: 54,
  height: 31,
  vx: 20,
  vy: 650,
  collectible: true,
  ttl: null
}
```

Example Mom entity:

```js
{
  id: 'mom-1',
  type: 'mom',
  sprite: 'mom',
  x: 112,
  y: 372,
  width: 92,
  height: 100,
  vx: 0,
  vy: 0,
  nonContact: true,
  ttl: 4.8,
  bubble: '[Name], clean your room!'
}
```

## Stage Flow Target

The intended game sequence should be represented by one stage controller:

```text
splash -> countdown -> salmonRun -> encounters -> gameOver/retry
```

### Countdown

The countdown can remain DOM because it is UI. During countdown, gameplay spawns should be paused.

### Salmon Run

The opening salmon run should be the first playable stage:

```text
catch 20 salmon before anything else enters
```

During this phase:

- salmon can fall
- snow/weather can happen
- no bear
- no moose
- no Dad
- no Mom
- no dance instructor
- no Daniel/brother helper
- no Alaska cameo, unless we explicitly decide it is background-only flavor

### Encounters

After 20 salmon are caught:

- bears can enter
- moose can enter
- Dad can enter
- Mom can appear briefly and say `[Name], clean your room!`
- Sofie mode can use the dance instructor
- Daniel/brother helper can appear if desired
- cameos can appear as world entities

## Migration Plan

### Step 1: Add isolated v2 world files

Create v2 files that are not loaded yet. These files should define the target state shape and pure update helpers.

### Step 2: Add a v2 renderer, still unloaded

Create a renderer that can draw a v2 world onto a canvas, but do not wire it into the current page yet.

### Step 3: Add a local test harness, not the real game

A separate test page or script can load the v2 world for development only. It should not replace the real game until reviewed.

### Step 4: Migrate one object at a time

Recommended order:

1. player renderer
2. Sofie/Daniel sprite selection
3. salmon entities
4. salmon-run stage gate
5. Mom as timed non-contact entity
6. Dad/dance instructor/family entities
7. bear/moose entities
8. cameos
9. projectiles
10. speech bubbles

### Step 5: Remove matching DOM overlays

Only remove a DOM overlay after the equivalent canvas/world entity is working.

## Non-Goals For The First V2 Commit

The first v2 commit should not fix all current gameplay bugs. It should only create a safe foundation.

Do not attempt to change:

- current `index.html` script loading
- current `hockey-smash.js` runtime
- current `hockey-smash-stage-flow.js`
- current countdown behavior
- current salmon-run behavior
- current Sofie overlay behavior

## Acceptance Criteria For The Isolated Foundation

The first safe foundation is acceptable if:

- current game remains unchanged
- no new v2 script is loaded by `index.html`
- docs explain the migration plan
- v2 file exposes a clear world/state shape
- v2 file can be syntax-checked later
- v2 file does not require the DOM to exist
- v2 file does not patch global current-game state

## Important Guardrail

Do not continue adding game-world characters as DOM overlays. Use DOM for UI only. Use canvas/world state for gameplay.
