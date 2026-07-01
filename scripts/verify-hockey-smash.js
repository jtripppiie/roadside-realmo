const fs = require('fs');
const vm = require('vm');

const requiredFiles = [
  'index.html',
  'dev/hockey-smash-v2.html',
  'js/games/hockey-smash-world-v2.js',
  'js/games/hockey-smash-renderer-v2.js',
  'docs/hockey-smash-v2-architecture.md',
  'docs/hockey-smash-v2-migration-checklist.md',
  'docs/hockey-smash-v2-progress.md',
  'assets/hockey-smash/backgrounds/soldotna_cityscape_background_01_1280x720.webp',
  'assets/hockey-smash/backgrounds/sun.webp',
  'assets/hockey-smash/backgrounds/moon.webp',
  'assets/hockey-smash/backgrounds/parallax/PLACEHOLDER_ASSETS.md',
  'assets/hockey-smash/backgrounds/parallax/hockey-smash-parallax-mountains-bg-1536x576.png',
  'assets/hockey-smash/backgrounds/parallax/hockey-smash-parallax-soldotna-storefronts-mid-1536x320.png',
  'assets/hockey-smash/backgrounds/parallax/hockey-smash-parallax-nelson-engineering-sign-1536x320.svg',
  'assets/hockey-smash/backgrounds/parallax/hockey-smash-parallax-sidewalk-front-1536x170.png',
  'assets/hockey-smash/backgrounds/parallax/hockey-smash-parallax-town-foreground-1536x526.png',
  'assets/hockey-smash/backgrounds/parallax/hockey-smash-parallax-skyline-far-1536x576.svg',
  'assets/hockey-smash/backgrounds/parallax/hockey-smash-parallax-trees-mid-1536x320.svg',
  'assets/hockey-smash/backgrounds/parallax/hockey-smash-parallax-snowbank-front-1536x170.svg',
  'assets/hockey-smash/sprites/hockey-player.webp',
  'assets/hockey-smash/sprites/hockey-player-sliding.webp',
  'assets/hockey-smash/sprites/hockey-player-ducking.webp',
  'assets/hockey-smash/sprites/dancer-player.webp',
  'assets/hockey-smash/sprites/sister-spinning.webp',
  'assets/hockey-smash/sprites/salmon.webp',
  'assets/hockey-smash/sprites/bear-1.webp',
  'assets/hockey-smash/sprites/moose-1.webp',
  'assets/hockey-smash/sprites/eagle_top_flap.webp',
  'assets/hockey-smash/sprites/eagle_mid_flap.webp',
  'assets/hockey-smash/sprites/eagle_bottom_flap.webp',
  'assets/hockey-smash/sprites/mom.webp',
  'assets/hockey-smash/sprites/dad.webp',
  'assets/hockey-smash/sprites/dance_instructor.webp',
  'assets/hockey-smash/sprites/alaskan_boy.webp',
  'assets/hockey-smash/sprites/alaskan_girl.webp',
  'assets/hockey-smash/sprites/splash.webp',
];

const removedFiles = [
  'hockey-smash.css',
  'hockey-smash-touch.css',
  'style.css',
  'script.js',
  'js/games/hockey-smash.js',
  'js/games/hockey-smash-input.js',
  'js/games/hockey-smash-release.js',
  'scripts/verify-hockey-smash-actions.js',
  'js/games/hockey-smash-legacy-dungeon-data.js',
  'scripts/verify-hockey-smash-legacy-data.js',
  'scripts/verify-hockey-smash-legacy-vm.js',
  'docs/hockey-smash-game-plan.md',
  'docs/hockey-smash-summary.md',
  'docs/game-design.md',
  'docs/technical-plan.md',
];

const errors = [];

function read(filePath) {
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing file: ${filePath}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function requireText(label, text, needle, message) {
  if (!text.includes(needle)) errors.push(message || `${label} is missing ${needle}`);
}

requiredFiles.forEach(read);
removedFiles.forEach((filePath) => {
  if (fs.existsSync(filePath)) errors.push(`Old v1/legacy file still exists: ${filePath}`);
});

const html = read('index.html');
const harness = read('dev/hockey-smash-v2.html');
const worldSource = read('js/games/hockey-smash-world-v2.js');
const rendererSource = read('js/games/hockey-smash-renderer-v2.js');
const progress = read('docs/hockey-smash-v2-progress.md');
const checklist = read('docs/hockey-smash-v2-migration-checklist.md');
const architecture = read('docs/hockey-smash-v2-architecture.md');
const parallaxPlaceholders = read('assets/hockey-smash/backgrounds/parallax/PLACEHOLDER_ASSETS.md');

requireText('index.html', html, 'dev/hockey-smash-v2.html', 'Root page should route to v2.');
requireText('v2 harness', harness, 'id="v2-canvas"', 'V2 harness canvas is missing.');
requireText('v2 harness', harness, 'id="v2-player-name"', 'V2 name input is missing.');
requireText('v2 harness', harness, 'data-character="daniel"', 'Daniel selection is missing.');
requireText('v2 harness', harness, 'data-character="sofie"', 'Sofie selection is missing.');
requireText('v2 harness', harness, 'data-action="stick"', 'Stick action control is missing.');
requireText('v2 harness', harness, 'id="v2-fullscreen"', 'V2 fullscreen toggle is missing.');
requireText('v2 harness', harness, 'gameStarted', 'V2 harness should gate updates behind Start.');
requireText('v2 harness', harness, 'bubble: \'\'', 'Bear/moose speech bubbles should remain disabled.');
requireText('v2 harness', harness, 'spawnSalmonLandingMarker', 'V2 salmon landing marker spawn is missing.');
requireText('v2 harness', harness, 'predictSalmonLandingX', 'V2 salmon landing prediction is missing.');
requireText('v2 harness', harness, 'PARALLAX_LAYERS', 'V2 parallax layer config is missing.');
requireText('v2 harness', harness, 'hockey-smash-parallax-mountains-bg-1536x576.png', 'Generated mountain parallax layer is not wired.');
requireText('v2 harness', harness, 'hockey-smash-parallax-town-foreground-1536x526.png', 'Combined town foreground parallax layer is not wired.');
requireText('v2 harness', harness, 'mapParallaxLayers', 'V2 parallax preloading should be key-based.');
requireText('v2 harness', harness, 'updateEnvironment', 'V2 environment update loop is missing.');
requireText('v2 harness', harness, 'const direction = 1', 'V2 projectiles should fire right only.');
requireText('v2 harness', harness, 'spawnEagle', 'V2 eagle encounter spawn is missing.');
requireText('v2 harness', harness, 'player.duckActive', 'V2 Daniel duck state is missing.');
requireText('v2 harness', harness, 'world.environment.scrollX += (world.player.vx || 0)', 'V2 background scroll should follow player movement.');
requireText('v2 harness', harness, 'HOCKEY_SMASH_V2_DEV', 'V2 dev test hook is missing.');
requireText('v2 harness', harness, 'fireProjectile', 'V2 projectile dev test hook is missing.');
requireText('v2 harness', harness, 'new URLSearchParams(window.location.search).has(\'debug\')', 'V2 debug mode should be gated by ?debug=1.');
requireText('v2 harness', harness, 'handleDebugKey', 'V2 debug keyboard toggles are missing.');
requireText('v2 harness', harness, 'showHitboxes', 'V2 debug hitbox toggle is missing.');
requireText('v2 harness', harness, 'godMode', 'V2 debug god mode toggle is missing.');
requireText('v2 harness', harness, 'World.updateDifficulty(world, dt)', 'V2 harness should use centralized difficulty updates.');
requireText('v2 harness', harness, 'canSpawnEncounter', 'V2 encounter pacing should consult spawn caps.');
requireText('v2 harness', harness, 'countActiveWildlife', 'V2 wildlife cap helper is missing.');
requireText('v2 harness', harness, 'countActiveThreats', 'V2 active threat cap helper is missing.');
requireText('v2 harness', harness, 'HOCKEY_SMASH_WORLD_V2', 'V2 world script usage is missing.');
requireText('v2 harness', harness, 'HOCKEY_SMASH_RENDERER_V2', 'V2 renderer script usage is missing.');
requireText('v2 world', worldSource, 'salmonSpawnSeconds: 1.12', 'V2 salmon spawn tuning is missing.');
requireText('v2 world', worldSource, 'walkSpeed: 360', 'V2 player walk tuning is missing.');
requireText('v2 world', worldSource, 'slideSpeed: 575', 'V2 player slide tuning is missing.');
requireText('v2 world', worldSource, 'salmonFallVelocity: 235', 'V2 salmon fall velocity tuning is missing.');
requireText('v2 world', worldSource, 'salmonFallVelocityRange: 45', 'V2 salmon fall range tuning is missing.');
requireText('v2 world', worldSource, 'salmonFallGravity: 275', 'V2 salmon fall tuning is missing.');
requireText('v2 world', worldSource, 'createEnvironment', 'V2 environment state is missing.');
requireText('v2 world', worldSource, 'createDebugState', 'V2 world debug state factory is missing.');
requireText('v2 world', worldSource, 'lastCollision', 'V2 debug collision readout is missing.');
requireText('v2 world', worldSource, 'createDifficulty', 'V2 world difficulty state factory is missing.');
requireText('v2 world', worldSource, 'updateDifficulty', 'V2 world centralized difficulty updater is missing.');
requireText('v2 world', worldSource, 'maxActiveWildlife: 1', 'V2 difficulty should cap active wildlife at 1.');
requireText('v2 world', worldSource, 'maxActiveThreats: 1', 'V2 difficulty should start with 1 active threat.');
requireText('v2 world', worldSource, 'salmonPostGateSpawnMin: 1.3', 'V2 post-gate salmon difficulty tuning is missing.');
requireText('v2 world', worldSource, 'const height = 132', 'Proportional Mom height is missing.');
requireText('v2 world', worldSource, 'const width = 49', 'Proportional Mom width is missing.');
requireText('v2 world', worldSource, 'bear-1.webp', 'V2 bear sprite should use the numbered encounter art.');
requireText('v2 world', worldSource, 'moose-1.webp', 'V2 moose sprite should use the numbered encounter art.');
requireText('v2 world', worldSource, 'Hi, you\\\'re cute', 'V2 Alaska kid cameo line is stale.');
requireText('v2 renderer', rendererSource, 'renderWorld', 'V2 renderer API is missing.');
requireText('v2 renderer', rendererSource, 'renderParallaxBackground', 'V2 parallax renderer is missing.');
requireText('v2 renderer', rendererSource, 'renderNightFilter', 'V2 night sky filter is missing.');
requireText('v2 renderer', rendererSource, 'renderSunMoon', 'V2 sun/moon renderer is missing.');
requireText('v2 renderer', rendererSource, 'getEntitySpriteKey', 'V2 animated entity sprite selector is missing.');
requireText('v2 renderer', rendererSource, 'renderSalmonMarker', 'V2 salmon landing marker renderer is missing.');
requireText('v2 renderer', rendererSource, 'ripple', 'V2 animated salmon marker ripple is missing.');
requireText('v2 renderer', rendererSource, 'renderHitboxes', 'V2 debug hitbox renderer is missing.');
requireText('v2 progress docs', progress, 'V2 harness play shell and tuning pass', 'V2 progress docs are missing latest harness update.');
requireText('v2 progress docs', progress, 'salmon landing markers', 'V2 progress docs are missing salmon marker update.');
requireText('v2 checklist docs', checklist, 'Add v2 harness splash, mobile layout, fullscreen, and tuning', 'V2 checklist is missing latest harness update.');
requireText('v2 checklist docs', checklist, 'salmon landing markers', 'V2 checklist is missing salmon marker update.');
requireText('v2 architecture docs', architecture, 'width: 49', 'V2 architecture Mom dimensions are stale.');
requireText('v2 architecture docs', architecture, 'V2 is now the active Hockey Smash path', 'V2 architecture docs still describe the old isolated-only plan.');
requireText('parallax placeholders', parallaxPlaceholders, 'hockey-smash-parallax-skyline-far-1536x576.svg', 'Far parallax placeholder spec is missing.');
requireText('parallax placeholders', parallaxPlaceholders, 'hockey-smash-parallax-trees-mid-1536x320.svg', 'Mid parallax placeholder spec is missing.');
requireText('parallax placeholders', parallaxPlaceholders, 'hockey-smash-parallax-snowbank-front-1536x170.svg', 'Front parallax placeholder spec is missing.');
requireText('parallax placeholders', parallaxPlaceholders, 'hockey-smash-parallax-nelson-engineering-sign-1536x320.svg', 'Nelson Engineering parallax sign spec is missing.');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(worldSource, context);
const World = context.window.HOCKEY_SMASH_WORLD_V2;
if (!World) {
  errors.push('World v2 global was not created.');
} else {
  const world = World.createWorld({ character: 'sofie', name: 'Jamie' });
  const mom = World.createMom(world);
  const salmon = World.createSalmon(world);
  if (world.phase !== World.PHASES.COUNTDOWN) errors.push('V2 world should start in countdown.');
  if (world.player.name !== 'Jamie') errors.push('V2 world should preserve player name.');
  if (world.player.character !== 'sofie') errors.push('V2 world should preserve selected character.');
  if (world.salmonTarget !== 20) errors.push('V2 salmon target should be 20.');
  if (!world.difficulty || world.difficulty.level !== 1) errors.push('V2 difficulty state should start at level 1.');
  if (world.difficulty.maxActiveWildlife !== 1) errors.push('V2 active wildlife should start capped at 1.');
  World.advancePhase(world, World.PHASES.ENCOUNTERS);
  World.updateDifficulty(world, 46);
  if (world.difficulty.level < 2) errors.push('V2 difficulty level should ramp during encounters.');
  if (!world.environment || world.environment.cycleSeconds !== 96) errors.push('V2 environment cycle state is missing.');
  if (mom.width !== 49 || mom.height !== 132) errors.push('V2 Mom dimensions are not proportional.');
  if (!mom.nonContact) errors.push('V2 Mom should be non-contact.');
  if (salmon.width !== 54 || salmon.height !== 31) errors.push('V2 salmon dimensions changed unexpectedly.');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Hockey Smash v2 verification passed.');
