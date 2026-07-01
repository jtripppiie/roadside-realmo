# Hockey Smash v2 Architecture Plan

## Purpose

This document describes the safer long-term direction for Hockey Smash. The previous game worked as a canvas game with many DOM overlay patches. That helped us move quickly, but it also made the game fragile because visual objects, gameplay objects, timers, and collision logic could live in different places.

The v2 direction is to move gameplay back into one game-world model:

```text
state -> systems -> canvas renderer
```

V2 is now the active Hockey Smash path. The root page routes to the v2 harness while the project keeps consolidating gameplay into the world-state/canvas-renderer model.

## Current Rule

Keep v2 as the single active gameplay path.

The old layered v1 runtime has been removed from the active repo. Future work should not reintroduce gameplay overlays that bypass world state. V2 should:

- keep player movement, salmon, encounters, projectiles, and temporary cues in world entities
- keep collisions and lifetimes in update systems
- keep rendering in the canvas renderer
- use DOM only for app UI and accessibility status
- keep `index.html` routing to the current v2 entry point until a deliberate file move is made

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
- Alaska boy/girl cameo
- projectiles
- speech bubbles attached to people when they make gameplay/context sense
- salmon landing markers
- weather visuals that belong inside the game world
- parallax background layers
- sun/moon sky objects and night-sky filter state
- lifetimes and timers for game-world objects
- object-to-object overlap checks
- player health, damage, invulnerability, and game-over phase
- cast appearance flags such as once-only Alaska kid cameos

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
  cast
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
  y: 340.32,
  width: 49,
  height: 132,
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
- no Alaska cameo, unless we explicitly decide it is background-only flavor

### Encounters

After 20 salmon are caught:

- bears can enter
- moose can enter
- Dad can enter
- Mom can appear briefly and say `[Name], clean your room!`
- Sofie mode can use the dance instructor
- cameos can appear as world entities

### Health And Game Over

Player health belongs to world state:

```js
player.health
player.maxHealth
player.invulnerable
```

The DOM may display the health bar and retry button, but it should not own damage, invulnerability timing, collision outcomes, or the `gameOver` phase.

### Cast Appearance Rules

One-off cast rules belong to world state. For example, Alaska kid cameos are tracked with cast flags so they appear at most once per run and then expire through world lifetimes or projectile dismissal.

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

## Current Acceptance Criteria

The current v2 build is acceptable if:

- `index.html` routes to `dev/hockey-smash-v2.html`
- v2 files expose a clear world/state shape
- player, salmon, encounters, projectiles, and temporary cues render through canvas/world state
- background depth is rendered with parallax-ready layers and day-night state
- splash, name input, character picker, fullscreen, touch controls, and HUD remain DOM UI
- syntax and Hockey Smash verification pass
- browser smoke tests cover root launch, start flow, and mobile layout
- old v1 runtime and dungeon-era files stay removed

## Important Guardrail

Do not continue adding game-world characters as DOM overlays. Use DOM for UI only. Use canvas/world state for gameplay.
