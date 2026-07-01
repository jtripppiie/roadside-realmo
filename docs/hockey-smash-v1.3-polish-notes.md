# Hockey Smash v1.3 Polish Notes

Date: 2026-07-01

## Goal

This pass makes the v2 runner feel more like a real playable release instead of a loose dev harness. The focus is not adding a new architecture; the focus is making the existing world-state/canvas architecture clearer, more survivable, and more charming.

## Version Target

```text
1.3.0
```

## Gameplay Changes

### Player Health

The player now has health in world state:

```js
player.maxHealth = 100;
player.health = 100;
player.invulnerable = 0;
```

Damageable encounter entities now subtract health instead of only showing a `BUMP!` effect. After taking damage, the player gets a short invulnerability window so a single overlap cannot drain the whole health bar.

Current damage examples:

```text
bear: 12
moose: 16
eagle: 10
Dad: 6
dance instructor: 7
```

When health reaches zero, the world phase advances to `gameOver`, a retry overlay appears, and the player can restart without reloading the page.

### Health HUD

The in-frame HUD now shows:

```text
Salmon count
Current phase / difficulty level
Player HP
Health bar
```

This fixes the mobile issue where scoring was only visible in the dev readout panel. The HUD is DOM because it is interface state, while the health value itself lives on `world.player`.

### Alaska Kid Cameos

The Alaska boy/girl cameo is now intentionally rare:

```text
one cameo per run
non-contact
10-15 second lifetime
dismissible by projectile
does not damage the player
```

The cameo still uses the existing mapping:

```text
Daniel mode -> Alaskan girl
Sofie mode -> Alaskan boy
```

The cameo is tracked through `world.cast.cameoSpawned` so repeated encounter rolls cannot flood the screen with kid cameos.

### Daniel Sister Support

Daniel now gets a sister support cameo as an encounter-world entity:

```text
type: sister
sprite: Sofie player sprite
non-contact
short supportive line: "Go Daniel!"
dismissible by projectile
```

This answers the missing-sister problem without adding a DOM overlay or inventing a separate asset. The sister cameo uses the existing Sofie art until dedicated support art exists.

### Sofie Dance Teacher

Sofie mode keeps the dance instructor, but the cast rotation now makes that encounter more visible. It is still a damageable moving person encounter and still uses:

```text
"Point those toes!"
```

The teacher respects active threat caps during normal gameplay.

### Dad Visibility

Dad is now early in the encounter rotation so he appears more reliably after Salmon Run completes. He remains a moving, damageable person encounter with a speech bubble.

## Visual Changes

### Entity Shadows

The canvas renderer now draws subtle ground shadows under players and most entities. These shadows make the sidewalk lane easier to read, especially in fullscreen landscape where the art fills the viewport.

### Hit Feedback

The player flickers briefly during invulnerability after taking damage. This is rendered in canvas and does not require any DOM gameplay overlay.

### Target Health Pips

Damageable entities with more than one HP show a small health pip after they have been hit. This makes bear, moose, Dad, and teacher encounters easier to understand.

## Architecture Notes

This pass preserves the v2 rule:

```text
input -> world state -> update systems -> canvas renderer
```

DOM owns:

```text
HUD
health bar display
retry overlay
buttons
debug panel
version badge
```

World/canvas owns:

```text
player health values
damage
invulnerability timer
Alaska kid cameo lifetime
cast appearance flags
sister/teacher/Dad entities
projectile dismissal
game-over phase
entity shadows
target health pips
hit flash
```

## Verification Coverage

`scripts/verify-hockey-smash.js` now checks:

- player health fields exist
- cast state exists
- health HUD exists
- retry overlay exists
- Daniel sister support exists
- Sofie teacher line exists
- Alaska kid cameo lasts 10-15 seconds
- Alaska kid cameo is dismissible and non-contact
- readable canvas shadows exist
- target health pip renderer exists

Playwright coverage now checks:

- health HUD starts at 100
- overlapping a damageable target reduces player health
- Daniel encounter dry run includes Dad and sister
- Sofie encounter dry run includes dance instructor
- Alaska kid cameo spawns only once
- Alaska kid cameo lifetime is 10-15 seconds
- Alaska kid cameo can be dismissed by projectile

## Known Tradeoffs

- The sister support cameo reuses the Sofie player sprite. This is intentional until a dedicated sister support pose exists.
- The retry overlay is intentionally small and functional; a future pass can add a richer game-over summary.
- Player health is tuned for forgiveness rather than difficulty. That matches the current “never frustrating” direction.

## Next Priorities

- Add dedicated sister support art.
- Add sound effects for damage, catch, clear, and game over.
- Add localStorage high scores once the survival loop is longer.
- Add warning markers before wildlife.
- Add a reduced-motion option before heavier particle work.
