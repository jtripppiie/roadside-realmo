const fs = require('fs');

const DISPLAY_VERSION = 'Hockey Smash v0.11.7';
const DISPLAY_BUILD = 'Build 2026-06-29.32';
const DISPLAY_BADGE = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
const CACHE_KEY = '0.11.7-20260629.32';

const requiredFiles = [
  'index.html',
  'style.css',
  'hockey-smash-polish.css',
  'hockey-smash-v09.css',
  'hockey-smash-v094.css',
  'hockey-smash-v095.css',
  'hockey-smash-v0111.css',
  'script.js',
  'assets/hockey-smash/backgrounds/soldotna_cityscape_background_01_1280x720.webp',
  'assets/hockey-smash/backgrounds/soldotna_cityscape_background_02_1280x720.webp',
  'assets/hockey-smash/backgrounds/soldotna_cityscape_background_03_1280x720.webp',
  'assets/hockey-smash/backgrounds/soldotna_cityscape_background_04_1280x720.webp',
  'assets/hockey-smash/backgrounds/soldotna_cityscape_background_05_1280x720.webp',
  'assets/hockey-smash/sprites/hockey-player-sliding.png',
  'assets/hockey-smash/sprites/sister-spinning.png',
  'js/games/hockey-smash.js',
  'js/games/hockey-smash-polish.js',
  'js/games/hockey-smash-v091.js',
  'js/games/hockey-smash-v095.js',
  'js/games/hockey-smash-v096.js',
  'js/games/hockey-smash-v099.js',
  'js/games/hockey-smash-v0100.js',
  'js/games/hockey-smash-v0102.js',
  'package.json',
  'scripts/verify-hockey-smash-actions.js',
];

const errors = [];

function read(file) {
  if (!fs.existsSync(file)) {
    errors.push(`Missing required file: ${file}`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}

const html = read('index.html');
const polishJs = read('js/games/hockey-smash-polish.js');
const v091Js = read('js/games/hockey-smash-v091.js');
const v09Css = read('hockey-smash-v09.css');
const v094Css = read('hockey-smash-v094.css');
const v095Css = read('hockey-smash-v095.css');
const v095Js = read('js/games/hockey-smash-v095.js');
const v096Js = read('js/games/hockey-smash-v096.js');
const v0102Js = read('js/games/hockey-smash-v0102.js');
const packageJson = read('package.json');
requiredFiles.forEach((file) => read(file));

if (!packageJson.includes('"version": "0.11.7"')) errors.push('package.json version should be 0.11.7.');
if (!html.includes(DISPLAY_BADGE)) errors.push('Visible build overlay is missing or stale.');
if (!v0102Js.includes(DISPLAY_VERSION) || !v0102Js.includes(DISPLAY_BUILD)) errors.push('Loaded moving gameplay script should force the latest visible badge.');
if (!html.includes(`style.css?v=${CACHE_KEY}`)) errors.push('Core CSS should be cache-busted.');
if (!html.includes(`hockey-smash-polish.css?v=${CACHE_KEY}`)) errors.push('Polish CSS should be cache-busted.');
if (!html.includes(`hockey-smash-v09.css?v=${CACHE_KEY}`)) errors.push('v0.9 stylesheet should be cache-busted.');
if (!html.includes(`hockey-smash-v094.css?v=${CACHE_KEY}`)) errors.push('v0.9.4 Daniel alignment stylesheet should be cache-busted.');
if (!html.includes(`hockey-smash-v095.css?v=${CACHE_KEY}`)) errors.push('v0.9.5 jump/rotate stylesheet should be cache-busted.');
if (!html.includes(`hockey-smash-v0111.css?v=${CACHE_KEY}`)) errors.push('v0.11.1 layout stylesheet should be cache-busted.');
if (!html.includes(`js/games/hockey-smash-v096.js?v=${CACHE_KEY}`)) errors.push('v0.11 movement script should be linked and cache-busted.');
if (!html.includes(`js/games/hockey-smash-v0102.js?v=${CACHE_KEY}`)) errors.push('Moving gameplay script should be linked and cache-busted.');
if (!v096Js.includes('RUN_ACCEL')) errors.push('Acceleration-based movement is missing.');
if (!v096Js.includes('RUN_DECEL')) errors.push('Movement deceleration is missing.');
if (!v096Js.includes('COYOTE_MS')) errors.push('Coyote-time jumping is missing.');
if (!v096Js.includes('JUMP_BUFFER_MS')) errors.push('Jump buffering is missing.');
if (!v096Js.includes('SLIDE_SPEED')) errors.push('Slide speed tuning is missing.');
if (!v096Js.includes('SLIDE_MS')) errors.push('Slide duration is missing.');
if (!v096Js.includes('SLIDE_COOLDOWN_MS')) errors.push('Slide cooldown is missing.');
if (!v096Js.includes('SLIDE_TRANSFORM')) errors.push('Inline slide crouch visual is missing.');
if (!v096Js.includes('stopImmediatePropagation')) errors.push('Duplicate button event suppression is missing.');
if (!polishJs.includes("sliding: 'assets/hockey-smash/sprites/hockey-player-sliding.png'")) errors.push('Sliding Daniel sprite should be wired.');
if (!polishJs.includes("sister: 'assets/hockey-smash/sprites/sister-spinning.png'")) errors.push('Sister spinning sprite should be wired.');
if (!v0102Js.includes("type: 'sister'")) errors.push('Normal moving gameplay should spawn Sister.');
if (!v0102Js.includes('nextSpawnAt = now + 250')) errors.push('Normal moving gameplay should start fish encounters quickly.');
if (!read('js/games/hockey-smash-polish.js').includes('if (computerMode) enhanceDpadControls();')) errors.push('Older direct-touch polish controls should stay out of normal-mode input.');
if (!html.includes('rel="preload" as="image" href="assets/hockey-smash/backgrounds/soldotna_cityscape_background_01_1280x720.webp"')) errors.push('First optimized road background preload link is missing.');
if (html.includes('rel="preload" as="image" href="assets/hockey-smash/backgrounds/soldotna_cityscape_background_05_1280x720.webp"')) errors.push('Later road backgrounds should lazy-load instead of blocking startup.');
if (read('js/games/hockey-smash.js').includes('_1920x1080.png')) errors.push('Core background paths should use optimized WebP files.');
if (v091Js.includes('_1920x1080.png')) errors.push('Stage background paths should use optimized WebP files.');
if (!html.includes('rel="preload" as="image" href="assets/hockey-smash/sprites/hockey-player-sliding.png"')) errors.push('Sliding Daniel sprite should be preloaded.');
if (!html.includes('rel="preload" as="image" href="assets/hockey-smash/sprites/sister-spinning.png"')) errors.push('Sister spinning sprite should be preloaded.');
const v0111Css = read('hockey-smash-v0111.css');
if (!v0111Css.includes('body.hockey-playing .hockey-hud')) errors.push('Health HUD left positioning should override older playing-mode rules.');
if (!v0111Css.includes('left: calc((100vw - min(100vw, calc(100svh * 16 / 9))) / 2 + max(0.7rem, env(safe-area-inset-left)))')) errors.push('Health HUD should be anchored to the left side of the game frame.');
if (!v0111Css.includes('right: auto !important')) errors.push('Health HUD should disable older right-side anchors.');
if (!v0111Css.includes('width: clamp(173px, 28vw, 299px)')) errors.push('Health HUD should be about 15% larger.');
if (html.includes('border:3px solid rgba(255,242,122')) errors.push('Daniel debug border should be removed from inline style.');
if (!html.includes('border:0;border-radius:0;background:transparent;box-shadow:none')) errors.push('Daniel overlay should have no border/glow.');
if (html.includes('>Ready.</div>')) errors.push('Default Ready status text should be removed.');
if (!v09Css.includes('.hockey-status:empty')) errors.push('Empty status overlay should be hidden.');
if (!v094Css.includes('translateY(8px)')) errors.push('Daniel should be nudged down slightly.');
if (!v095Css.includes('transition: none !important')) errors.push('Jump overlay transition should be disabled.');
if (!v095Js.includes('enforceSplashStart')) errors.push('Normal-mode splash start guard is missing.');
if (!v091Js.includes('preloadedBackgrounds')) errors.push('Runtime background preloader is missing.');
if (!v091Js.includes('state.travelStage')) errors.push('Travel stage state is missing.');
if (!v091Js.includes('renderedStage')) errors.push('Stage background should keep the last decoded image while the next one loads.');
if (!read('js/games/hockey-smash.js').includes('DEFERRED_ASSETS')) errors.push('Core backgrounds should lazy-load after the first stage.');
if (!polishJs.includes('syncEntityOverlays')) errors.push('v0.9 entity overlay sync is missing.');
if (!html.includes('data-fullscreen-toggle')) errors.push('Fullscreen controls are missing.');
if (!html.includes('Watch Computer Play')) errors.push('Watch Computer Play button is missing.');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`${DISPLAY_VERSION} static verification passed for movement, lazy backgrounds, cache busting, and sprite wiring.`);
