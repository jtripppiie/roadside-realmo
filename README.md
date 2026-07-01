# Hockey Smash

Hockey Smash is now the v2 canvas/world-state version of the game.

The old layered v1 runtime has been removed from the live entry point. The root page redirects to the v2 harness:

```text
/
dev/hockey-smash-v2.html
```

## Current Shape

V2 keeps gameplay objects in one system:

```text
input -> world state -> update systems -> canvas renderer
```

The active runtime files are:

- `dev/hockey-smash-v2.html`: playable v2 harness and current game entry.
- `js/games/hockey-smash-world-v2.js`: world state, phases, tuning, player/entity factories.
- `js/games/hockey-smash-renderer-v2.js`: canvas renderer for world entities, player, effects, and bubbles.
- `index.html`: redirects the public root to the v2 harness.

## Gameplay In V2

Implemented now:

- compact splash/start screen
- player name input
- Daniel/Sofie character selection
- fullscreen toggle
- keyboard and touch controls
- `?debug=1` debug mode with FPS, hitbox, and god-mode toggles
- parallax-ready background layers
- sun/moon day-night cycle with a night-sky filter
- countdown
- salmon run
- animated ground landing markers for falling salmon
- catch 20 salmon to unlock encounters
- centralized difficulty controller with gentle encounter ramping
- Mom, Dad, dance instructor, bear, moose, Alaska cameo previews
- simple stick/throw projectile preview
- responsive phone and landscape layouts

Current controls:

```text
A / Left Arrow   move left
D / Right Arrow  move right
W / Up / Space   jump
S / Shift        slide
F / Enter        stick / throw
```

Stick/throw projectiles always fire to the right.

Debug mode is off by default. Add `?debug=1` to the v2 URL, then use:

```text
~  show/hide debug overlay
H  show/hide hitboxes
G  toggle god mode
```

## Current Tuning

```text
walkSpeed: 360
slideSpeed: 575
salmonSpawnSeconds: 1.12
salmonFallVelocity: 235
salmonFallVelocityRange: 45
salmonFallGravity: 275
```

Mom is rendered proportionally to the tall sprite:

```text
width: 49
height: 132
```

Bear and moose do not show speech bubbles.

Encounter difficulty is centralized in the v2 world state. It starts gently:

```text
level: 1
maxActiveThreats: 1
maxActiveWildlife: 1
spawn window: 1.8s-3.2s
speedMultiplier: 1
```

During encounters, the difficulty level increases every 45 seconds and speed/spawn pacing ramp slowly. Wildlife remains capped at one active wildlife entity.

## Background Asset Targets

Placeholder parallax assets live in:

```text
assets/hockey-smash/backgrounds/parallax/
```

Current target files:

```text
hockey-smash-parallax-mountains-bg-1536x576.png
hockey-smash-parallax-soldotna-storefronts-mid-1536x320.png
hockey-smash-parallax-nelson-engineering-sign-1536x320.svg
hockey-smash-parallax-sidewalk-front-1536x170.png
hockey-smash-parallax-skyline-far-1536x576.svg
hockey-smash-parallax-trees-mid-1536x320.svg
hockey-smash-parallax-snowbank-front-1536x170.svg
```

Each placeholder includes its exact filename and dimensions inside the SVG.

## Local Run

No build step is required.

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

or:

```text
http://localhost:8000/dev/hockey-smash-v2.html
```

## Verification

```bash
npm run verify
```

Optional browser automation:

```bash
npm run test:browser
```

`npm run verify` checks syntax, confirms the v2 runtime files/assets/docs exist, confirms the old v1 runtime files are gone, and sanity-checks the v2 world factories.

## Docs

Maintained docs:

- `docs/hockey-smash-v2-architecture.md`
- `docs/hockey-smash-v2-migration-checklist.md`
- `docs/hockey-smash-v2-progress.md`

Old dungeon and v1 layered-runtime docs were removed during the v2 cleanup.
