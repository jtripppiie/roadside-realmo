# Hockey Smash

Current playable version: **Hockey Smash v0.5.0**

Live GitHub Pages preview:

```text
https://jtripppiie.github.io/roadside-realmo/
```

## Current Status

Hockey Smash is now the primary public playable mode in this existing repo. The project is reusing the repo's static GitHub Pages infrastructure, canvas setup, docs, verification scripts, and asset organization instead of creating a new repository.

The old Roadside Realm files remain in the background as useful historical infrastructure, but they are no longer the main launch experience.

## What This Prototype Includes

- Hockey Smash splash screen and visible `Hockey Smash v0.5.0` version text.
- Play button with a short "Entering Hockey Smash..." transition.
- Full browser-viewport gameplay screen.
- 1024x576 landscape-first canvas layout.
- Ground line at `canvasHeight * 0.60`.
- Daniel fixed-screen side-scroller movement.
- Left/right movement only for v0.5.0.
- Responsive jump, hold-to-slide speed boost, and hockey stick combo attack.
- One health bar with brief invincibility after damage.
- Try Again screen when health reaches zero.
- Summer Soldotna-inspired background and sidewalk collision layer.
- Asset fallback placeholders when sprites/images are missing.
- Bears, moose, salmon hazards, Mom/Sister interruption bubbles, a major salmon run, and Dad boss with dad joke attacks.
- Mobile landscape-first layout with temporary portrait rotate hint.
- D-pad and action controls that do not scroll the page during gameplay.

## How To Run Locally

No build step is required.

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080/
```

## Controls

Keyboard:

- Move left: `ArrowLeft` or `A`
- Move right: `ArrowRight` or `D`
- Jump: `ArrowUp`, `W`, or `Space`
- Slide/speed boost: `Shift` or `S`
- Hockey stick: `F` or `Enter`

Touch:

- Bottom-left D-pad: left/right movement.
- Bottom-right buttons: Jump, Slide, Stick.

## Main Files

- `index.html`: Hockey Smash public shell.
- `style.css`: full-screen layout, splash, HUD, canvas scaling, and mobile controls.
- `script.js`: app bootstrap.
- `js/games/hockey-smash.js`: Hockey Smash runtime, state machine, player movement, hazards, Dad boss, rendering, and asset fallbacks.
- `assets/`: expected Hockey Smash sprite/background files.
- `docs/hockey-smash-design.md`: design target and scope.
- `docs/hockey-smash-workflow.md`: manual development workflow.
- `docs/hockey-smash-dev-checklist.md`: quick dev checklist.

## Asset Paths

Expected assets are `.png` files in `assets/`:

```text
assets/roadside-realm/backgrounds/soldotna_cityscape_background_01_1920x1080.png
assets/roadside-realm/backgrounds/soldotna_cityscape_background_02_1920x1080.png
assets/roadside-realm/backgrounds/soldotna_cityscape_background_03_1920x1080.png
assets/roadside-realm/backgrounds/soldotna_cityscape_background_04_1920x1080.png
assets/roadside-realm/backgrounds/soldotna_cityscape_background_05_1920x1080.png
assets/player_hockey_sprite_96x96.png
assets/roadside-realm/sprites/salmon.png
assets/roadside-realm/sprites/bear.png
assets/roadside-realm/sprites/moose.png
assets/roadside-realm/sprites/dad.png
assets/roadside-realm/sprites/mom.png
assets/roadside-realm/sprites/mom_text.png
assets/roadside-realm/sprites/sister.png
assets/roadside-realm/sprites/sister_text.png
```

Missing assets do not crash the game. The runtime draws labeled placeholders and logs missing paths to the developer console.

## Verification

Run:

```bash
npm run verify
```

This checks JavaScript syntax and validates the Hockey Smash launch shell, docs, version text, and expected asset path definitions.

## Known Limitations

- Daniel uses one static 96x96 sprite path; walking animation is future work.
- Placeholder drawings stand in for any missing final art.
- The first level is fixed-screen only; there is no camera-following long level yet.
- Dad boss, salmon run, and interruption timing are tuned for a first prototype, not final balance.
