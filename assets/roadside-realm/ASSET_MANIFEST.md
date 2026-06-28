# Roadside Realm Asset Manifest

Generated starter asset set for Roadside Realm.

The game design still supports canvas-drawn art. These files are optional production assets that can be used when image-based sprites or illustrations are desired.

## Current Standing

The game is currently in **playable preview plus starter asset** state:

- Design plan: strong and build-ready.
- Summary docs: maintained.
- Optional image spec: complete.
- Starter image assets: generated and placed in project folders.
- Playable implementation: underway on `main`.
- Some production assets are now loaded by the canvas renderer with runtime chroma-key cleanup.

## Generated Assets

### Sprites

| File | Purpose | Dimensions | Notes |
|---|---|---:|---|
| `sprites/realm-sprite-signpost-ogre.png` | Main boss sprite sheet | 2172x724 | RGBA PNG, 6 poses in one row. |
| `sprites/realm-sprite-moonlit-warden.png` | Secret guardian sprite sheet | 2172x724 | RGBA PNG, 6 poses in one row. |

Frame order for both sprite sheets:

```text
idle, alert, hit, attack, defeated, special
```

Recommended frame width:

```text
sheet width / 6 = 362px per frame
```

Use the full sheet height unless the implementation later trims consistent frame boxes.

### Items

| File | Purpose | Dimensions | Notes |
|---|---|---:|---|
| `items/realm-items-core.png` | Core item glyph sheet | 2172x724 | RGBA PNG, 8 item icons in one row. |

Item order:

```text
Rusty Road Key,
Mapstone,
Moon Toll Token,
Apple Juice Potion,
Snack Charm,
Postcard Shield,
Compass Sticker,
Lucky Toll Coin
```

Recommended icon width:

```text
sheet width / 8 = 271.5px per icon
```

For implementation, either draw from this sheet with approximate cell boxes or crop/normalize individual icons later.

### Tiles

| File | Purpose | Dimensions | Notes |
|---|---|---:|---|
| `tiles/realm-tile-hidden-moon-scratch.png` | Hidden wall clue overlay | 1254x1254 | RGBA PNG. |

### Endings

| File | Purpose | Dimensions | Notes |
|---|---|---:|---|
| `endings/realm-ending-true-route.png` | True ending illustration | 1672x941 | RGB PNG. |

### Sources

The original generated green-screen files are preserved in `source/`:

```text
source/realm-sprite-signpost-ogre-source.png
source/realm-sprite-moonlit-warden-source.png
source/realm-items-core-source.png
source/realm-tile-hidden-moon-scratch-source.png
```

These are useful if the chroma-key removal needs to be redone.

## Transparency Notes

The transparent assets were produced from green-screen images using `ffmpeg` and the `colorkey` filter. They are valid RGBA PNG files.

Because chroma-keyed PNGs can retain green in hidden RGB channels, some preview tools may display green even when the alpha channel is correct. Validate in an actual canvas or with alpha extraction before assuming transparency failed.

## Generation Prompts

The assets were generated with the built-in image generation tool using the art direction from `docs/roadside-realm-image-spec.md`.

Prompt themes:

- handmade roadside fantasy arcade panel
- thick dark outlines
- family-friendly, cozy weird, not horror
- no readable text
- no watermark
- no real brands
- chroma-key green only for source sprites/icons

## Next Recommended Asset Work

If these become production assets, do this before final implementation:

1. Normalize sprite sheets to exact frame dimensions.
2. Crop item sheet into individual icons or define exact source rectangles.
3. Compress PNGs or export WebP copies if the service worker budget needs it.
4. Add any used files to the service worker cache list.
5. Test high contrast mode with image outlines or canvas overlays.
