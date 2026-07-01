# Hockey Smash v2 Migration Checklist

This checklist exists so the game can be cleaned up without breaking the current working version.

## Current Status

The current game is still the live game. The new v2 files are foundation only.

Live files still loaded by `index.html` include the existing canvas game and its support layers. The new file `js/games/hockey-smash-world-v2.js` is not loaded yet and should not affect gameplay.

## Hard Rule

Do not wire v2 into `index.html` until a specific migration step is reviewed.

A safe v2 commit may add:

- docs
- isolated v2 modules
- inactive test helpers
- notes/checklists

A safe v2 commit should not change:

- current script order
- current countdown
- current salmon run
- current character picker
- current controls
- current scoring
- current version-lock behavior
- current loaded gameplay files

## Recommended Migration Order

### 1. Document the current system

Before replacing anything, document what currently exists:

- which files are loaded by `index.html`
- which files draw to canvas
- which files create DOM overlays
- which files patch player state
- which files spawn entities
- which files write build/version info

### 2. Keep the v2 world isolated

`hockey-smash-world-v2.js` should remain a passive module at first.

It can define:

- phase names
- tuning constants
- sprite paths
- entity factory helpers
- player shape
- Mom shape
- cameo shape
- salmon-run target

It should not:

- start a game loop
- register input listeners
- create DOM nodes
- append elements to the page
- draw on the real canvas
- mutate `window.RTA_HOCKEY_SMASH`

### 3. Add a v2 renderer separately

Create a renderer file later, for example:

```text
js/games/hockey-smash-renderer-v2.js
```

That renderer should take a world object and a canvas context:

```js
renderWorld(ctx, world, imageCache)
```

It should not read random DOM state. It should only render the world it is given.

### 4. Add a v2 dev harness separately

Only after the v2 world and renderer exist, create a separate dev harness. Options:

- `dev/hockey-smash-v2.html`
- `tests/hockey-smash-v2-smoke.html`
- a local-only script not loaded by the production page

Do not replace the real game page yet.

### 5. Migrate the player first

First real migration should be player rendering.

Goal:

```text
Daniel and Sofie are both canvas-rendered from the same player object.
```

Acceptance criteria:

- choosing Daniel draws Daniel on canvas
- choosing Sofie draws Sofie on canvas
- no DOM player overlay is needed for gameplay
- player position, collision, and sprite match the same object
- countdown and salmon run still work

### 6. Migrate salmon second

Goal:

```text
salmon spawn, fall, collection, and scoring are owned by one system.
```

Acceptance criteria:

- opening phase starts with salmon only
- player must catch 20 salmon
- collected count increments once per salmon
- missed salmon does not break the run unless intentionally designed later
- no other file writes conflicting salmon contact values

### 7. Migrate stage controller third

Goal:

```text
one stage controller owns countdown -> salmonRun -> encounters.
```

Acceptance criteria:

- countdown happens first
- no game-world entities spawn during countdown
- salmon-only run starts after countdown
- encounters unlock only after 20 salmon
- snow/weather can run independently
- old mower-Dad path cannot hijack the staged run

### 8. Migrate family/cast entities fourth

Goal:

```text
Mom, Dad, Daniel/brother, and dance instructor are entities, not overlays.
```

Rules:

- Mom is stationary
- Mom appears briefly
- Mom only says `[Name], clean your room!`
- Mom is non-contact
- Dad can have his own rule later
- dance instructor appears only in Sofie mode unless intentionally changed
- Daniel/brother helper appears only when explicitly designed

### 9. Migrate wildlife fifth

Goal:

```text
bear and moose movement, rendering, and contact all come from entities.
```

Acceptance criteria:

- bear enters screen visibly
- moose enters screen visibly
- speeds are tuned in one place
- only one big animal at a time if that remains the rule
- no DOM collision bridge is involved

### 10. Migrate cameos sixth

Goal:

```text
Alaska boy/girl cameos are optional world entities, not DOM overlays.
```

Decision needed:

- Are cameos allowed during salmon run?
- Are cameos purely background flavor?
- Should Daniel mode show Alaskan girl and Sofie mode show Alaskan boy, or should that mapping be reversed?

Until answered, keep cameos outside the salmon-run requirement or clearly mark them as non-gameplay background flavor.

### 11. Migrate projectiles later

Projectiles are higher risk because they affect interaction rules. Do not migrate them first.

Goal:

```text
projectiles are entities in the same coordinate system as every target.
```

Acceptance criteria:

- no `getBoundingClientRect()` collision bridge for gameplay projectiles
- projectile position is in canvas world units
- projectile target checks use world hitboxes
- collision results are deterministic

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

## Branch/Commit Guidance

The user currently prefers direct work on `main`, but this v2 refactor is architectural. Keep commits very small and reversible.

Recommended commit style:

```text
Add isolated v2 world scaffold
Document v2 migration checklist
Add inactive v2 renderer scaffold
Add v2 smoke harness, not loaded by game
```

Avoid commits like:

```text
Rewrite game
Replace all gameplay
Fix everything
```

## First Real Integration Gate

Before any v2 code is loaded by the real page, verify:

- current game still starts
- countdown appears
- salmon fall after countdown
- 20 salmon unlocks encounters
- Sofie appears if selected
- Daniel appears if selected
- version badge is correct
- no lawnmower Dad appears during salmon run

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
