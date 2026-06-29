const fs = require('fs');
const path = require('path');

const VERSION = 'Hockey Smash v0.13.5';
const BUILD = 'Build 2026-06-29.51';
const CACHE_KEY = '0.13.5-20260629.51';

const requiredFiles = [
  'index.html',
  'package.json',
  'script.js',
  'style.css',
  'hockey-smash.css',
  'hockey-smash-polish.css',
  'hockey-smash-touch.css',
  'hockey-smash-custom.css',
  'hockey-smash-v09.css',
  'hockey-smash-v094.css',
  'hockey-smash-v095.css',
  'hockey-smash-v0111.css',
  'js/games/hockey-smash.js',
  'js/games/hockey-smash-polish.js',
  'js/games/hockey-smash-v091.js',
  'js/games/hockey-smash-v095.js',
  'js/games/hockey-smash-v096.js',
  'js/games/hockey-smash-v099.js',
  'js/games/hockey-smash-v0100.js',
  'js/games/hockey-smash-v0102.js',
  'js/games/hockey-smash-v0103.js',
  'js/games/hockey-smash-v0104.js',
  'js/games/hockey-smash-v0105.js',
  'js/games/hockey-smash-v0106.js',
  'js/games/hockey-smash-v0107.js',
  'js/games/hockey-smash-v0108.js',
  'js/games/hockey-smash-v0109.js',
  'scripts/verify-hockey-smash-actions.js',
  'docs/hockey-smash-workflow.md',
  'docs/hockey-smash-dev-checklist.md',
  'docs/hockey-smash-qa.md',
  'docs/hockey-smash-progress.md',
  'docs/hockey-smash-kid-handoff.md',
  'assets/hockey-smash/backgrounds/soldotna_cityscape_background_01_1280x720.webp',
  'assets/hockey-smash/backgrounds/soldotna_cityscape_background_02_1280x720.webp',
  'assets/hockey-smash/backgrounds/soldotna_cityscape_background_03_1280x720.webp',
  'assets/hockey-smash/backgrounds/soldotna_cityscape_background_04_1280x720.webp',
  'assets/hockey-smash/backgrounds/soldotna_cityscape_background_05_1280x720.webp',
  'assets/hockey-smash/sprites/hockey-player.webp',
  'assets/hockey-smash/sprites/hockey-player-sliding.webp',
  'assets/hockey-smash/sprites/dancer-player.webp',
  'assets/hockey-smash/sprites/sister-spinning.webp',
  'assets/hockey-smash/sprites/splash.webp',
];

const errors = [];
function read(filePath) {
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing file: ${filePath}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

requiredFiles.forEach(read);
const html = read('index.html');
const pkg = read('package.json');
const cssManifest = read('hockey-smash.css');
const style = read('style.css');
const readme = read('README.md');
const changelog = read('CHANGELOG.md');
const workflow = read('docs/hockey-smash-workflow.md');
const checklist = read('docs/hockey-smash-dev-checklist.md');
const qa = read('docs/hockey-smash-qa.md');
const progress = read('docs/hockey-smash-progress.md');
const kidGuide = read('docs/hockey-smash-kid-handoff.md');
const core = read('js/games/hockey-smash.js');
const polish = read('js/games/hockey-smash-polish.js');
const touchCss = read('hockey-smash-touch.css');
const customCss = read('hockey-smash-custom.css');
const v096 = read('js/games/hockey-smash-v096.js');
const v0102 = read('js/games/hockey-smash-v0102.js');
const v0103 = read('js/games/hockey-smash-v0103.js');
const v0104 = read('js/games/hockey-smash-v0104.js');
const v0105 = read('js/games/hockey-smash-v0105.js');
const v0106 = read('js/games/hockey-smash-v0106.js');
const v0107 = read('js/games/hockey-smash-v0107.js');
const v0108 = read('js/games/hockey-smash-v0108.js');
const v0109 = read('js/games/hockey-smash-v0109.js');

if (!pkg.includes('"version": "0.13.5"')) errors.push('Package version is stale.');
if (!html.includes(`${VERSION} · ${BUILD}`)) errors.push('Build badge is stale.');
if (!html.includes(`hockey-smash.css?v=${CACHE_KEY}`)) errors.push('Single CSS manifest is not linked or cache-busted.');
if (!html.includes(`js/games/hockey-smash-v0109.js?v=${CACHE_KEY}`)) errors.push('Final script is not linked or cache-busted.');
if (!html.includes('<h1 id="hockey-title">Hockey Smash</h1>')) errors.push('Hockey splash title should say Hockey Smash.');
if (html.includes('Hockey Slash 2')) errors.push('Index should not say Hockey Slash 2.');
if (!html.includes('>Sofie</button>')) errors.push('Sofie button should say only Sofie.');
if (html.includes('Sofie the Dancer')) errors.push('Index still says Sofie the Dancer.');
if (html.includes('hockey-fullscreen-button')) errors.push('Splash fullscreen button should not be present.');
if (!html.includes('hockey-fullscreen-chip')) errors.push('Gameplay fullscreen chip should remain in the gameplay area.');
if (!html.includes('id="hockey-watch"') || !html.includes('aria-hidden="true"') || !html.includes('tabindex="-1"')) errors.push('Computer Play link should start disabled for normal play.');
if (html.includes('style.css?v=') || html.includes('hockey-smash-polish.css?v=') || html.includes('hockey-smash-touch.css?v=') || html.includes('hockey-smash-custom.css?v=')) errors.push('index.html should not load individual CSS layer links anymore.');
if (!html.includes('Cache-Control') || !html.includes('no-cache')) errors.push('No-cache meta tags are missing.');
['style.css', 'hockey-smash-polish.css', 'hockey-smash-touch.css', 'hockey-smash-custom.css', 'hockey-smash-v09.css', 'hockey-smash-v094.css', 'hockey-smash-v095.css', 'hockey-smash-v0111.css'].forEach((file) => {
  if (!cssManifest.includes(`${file}?v=${CACHE_KEY}`)) errors.push(`CSS manifest is missing ${file}.`);
});
if (!cssManifest.includes('[hidden]') || !cssManifest.includes('display: none !important') || !cssManifest.includes('pointer-events: none !important')) errors.push('Hidden screen hard override is missing.');
if (!cssManifest.includes('#hockey-watch') || !cssManifest.includes('body.hockey-dev-mode #hockey-watch') || !cssManifest.includes('body:not(.hockey-dev-mode) #hockey-boot-log')) errors.push('Dev-only CSS guards are missing.');
if (!style.includes('max-height: min(32vh, 285px)') || !style.includes('@media (max-height: 720px)') || !style.includes('overflow: hidden')) errors.push('Compact no-scroll splash sizing is missing from style.css.');
if (!customCss.includes('Hockey Smash v0.13.5') || !customCss.includes('padding: 0.4rem 0.78rem') || !customCss.includes('@media (orientation: portrait) and (max-width: 760px), (max-height: 720px)')) errors.push('Compact customization control sizing is missing.');
if (!html.includes('id="hockey-boot-log"')) errors.push('Boot debug overlay markup is missing.');
if (!html.includes('window.HOCKEY_BOOT_LOG')) errors.push('Boot debug API is missing.');
if (!html.includes('resource-error') || !html.includes('js-error') || !html.includes('promise-error')) errors.push('Boot debug error handlers are missing.');
if (!html.includes('Show splash') || !html.includes('Forced splash visible')) errors.push('Debug splash rescue is missing.');
if (!v0109.includes(VERSION) || !v0109.includes(BUILD)) errors.push('Final marker build label is stale.');
if (!v0109.includes('bindDevModeUnlock') || !v0109.includes('DEV_TAP_TARGET = 3') || !v0109.includes('enableDevMode') || !v0109.includes('hockey-dev-mode')) errors.push('Splash-image triple-tap dev unlock is missing.');
if (!v0109.includes('setDevElementState') || !v0109.includes('hockey-watch') || !v0109.includes('hockey-boot-log')) errors.push('Dev element state management is missing.');
if (!v0109.includes('normalizeSofieLabels') || !v0109.includes('lockAccidentalCameraShake')) errors.push('Sofie/camera repair helpers are missing.');
if (!v0109.includes('hockey-earthquake-active')) errors.push('Earthquake escape hatch for future intentional shake is missing.');
if (!v0109.includes('pointerdown') || !v0109.includes('pointerup') || !v0109.includes('touchstart')) errors.push('Button debug coverage is missing.');
if (!v0109.includes('stateSummary') || !v0109.includes('heartbeat')) errors.push('Button debug state output is missing.');
if (!v0109.includes('START_COUNTDOWN_SECONDS = 10') || !v0109.includes('runStartCountdown') || !v0109.includes('hockey-start-countdown') || !v0109.includes('Practice the buttons')) errors.push('Start-game 10-second practice countdown is missing.');
if (!v0109.includes('forceSalmonFromRight') || !v0109.includes('entity.vx = -Math.abs') || !v0109.includes('entity.flip = -1')) errors.push('Right-side-only salmon guard is missing.');
if (!v0109.includes('Kid-friendly rule') || !v0109.includes('Start countdown brain') || !v0109.includes('Salmon direction guard')) errors.push('Beginner comments are missing from final safety layer.');
if (!v0106.includes("gameTitle: 'Hockey Smash'")) errors.push('Daniel/Hockey mode title should be Hockey Smash.');
if (v0106.includes('Hockey Slash 2')) errors.push('Character config should not say Hockey Slash 2.');
if (!v0106.includes("label: 'Sofie'")) errors.push('Sofie character label should be Sofie.');
if (!v0106.includes("gameTitle: 'Dance Smash'") || !v0106.includes("transitionHeading: 'Entering Dance Smash...'") || !v0106.includes("actionText: '🩰'") || !v0106.includes("actionLabel: 'Throw pointe shoe'")) errors.push('Dance Smash transition/action button labels are missing.');
if (!v0106.includes('updateModeLabels') || !v0106.includes('data-action="stick"') || !v0106.includes('pointe-shoe')) errors.push('Character-specific action button update is missing.');
if (!v0103.includes('pointe-shoe') || !v0103.includes('throws a pointe shoe') || !v0103.includes('🩰')) errors.push('Sofie pointe shoe projectile is missing.');
if (!v0104.includes('projectileHitLabel') || !v0104.includes('POINTE SHOE') || !v0104.includes('Projectile Hits')) errors.push('Score feedback should support pointe shoe projectiles.');
if (!v096.includes('const activePointers = new Map()')) errors.push('Pointer tracking is missing from movement layer.');
if (!v096.includes('button.addEventListener(\'pointerdown\'')) errors.push('Button pointerdown handler is missing.');
if (!v096.includes('button.addEventListener(\'pointerup\'')) errors.push('Button pointerup handler is missing.');
if (!v096.includes('lostpointercapture')) errors.push('Lost pointer capture release handler is missing.');
if (!v096.includes('touchcancel')) errors.push('Touch cancel reset handler is missing.');
if (!v096.includes('window.addEventListener(\'blur\', resetAllInput)')) errors.push('Blur input reset is missing.');
if (v096.includes('stopImmediatePropagation')) errors.push('Movement layer should not stopImmediatePropagation anymore.');
if (v096.includes('capture: true')) errors.push('Movement layer should not use capture-phase control listeners anymore.');
if (v096.includes('lastPointerAt')) errors.push('Old click timing guard should be removed.');
if (!v096.includes('debug.textContent = `Input L:')) errors.push('Input debug helper is missing.');
if (!touchCss.includes('touch-action: none')) errors.push('Touch-action CSS is missing.');
if (!touchCss.includes('-webkit-tap-highlight-color: transparent')) errors.push('Tap highlight suppression is missing.');
if (!customCss.includes('.hockey-character-button') || !customCss.includes('#player-name')) errors.push('Customization CSS controls are missing.');
if (!html.includes('id="player-name"')) errors.push('Player name input is missing.');
if (!html.includes('data-character="sofie"')) errors.push('Sofie character button is missing.');
if (!v0106.includes('setPlayerConfig') || !v0106.includes('getPlayerConfig')) errors.push('Player config API is missing.');
if (!v0106.includes('dancer-player.webp') || !v0106.includes('sister-spinning.webp')) errors.push('Sofie dancer sprite config is missing.');
if (!v0103.includes('puckStatsForPlayer') || !v0103.includes('puck.damage')) errors.push('Projectile power variants are missing.');
if (!v0104.includes('createFloatingTextNear')) errors.push('Floating feedback text is missing.');
if (!v0102.includes('BASE_SPAWN_MS') || !v0102.includes('state.difficulty') || !v0102.includes('applyVariant')) errors.push('Difficulty ramp checks are stale.');
if (!v096.includes('RUN_ACCEL') || !v096.includes('COYOTE_MS') || !v096.includes('SLIDE_MS')) errors.push('Smooth movement checks are stale.');
if (core.includes('_1920x1080.png')) errors.push('Large background paths are still referenced.');

const docsToCheck = { readme, changelog, workflow, checklist, qa, progress, kidGuide };
Object.entries(docsToCheck).forEach(([name, text]) => {
  if (!text.includes('v0.13.5') && !text.includes('0.13.5')) errors.push(`${name} does not mention the current version.`);
});
if (!readme.includes('compact splash') || !readme.includes('10-second safe practice countdown') || !readme.includes('right side only') || !readme.includes('hockey-smash-kid-handoff.md')) errors.push('README does not document the compact splash, countdown, salmon direction, and beginner handoff guide.');
if (!changelog.includes('0.13.5 - Compact No-Scroll Splash')) errors.push('Changelog is missing the v0.13.5 entry.');
if (!workflow.includes('Current v0.13.5 Behavior Notes') || !workflow.includes('compact splash')) errors.push('Workflow doc is stale.');
if (!checklist.includes('Compact Splash') || !checklist.includes('fish/salmon fly in from the **right side only**')) errors.push('Dev checklist does not cover the latest gameplay/layout checks.');
if (!qa.includes('Compact Splash') || !qa.includes('right side only')) errors.push('QA doc does not cover the latest layout/gameplay checks.');
if (!progress.includes('Current Checkpoint: Hockey Smash v0.13.5') || !progress.includes('Compact No-Scroll Splash')) errors.push('Progress doc is stale.');
if (!kidGuide.includes('How The Files Load') || !kidGuide.includes('Change the countdown length') || !kidGuide.includes('Current v0.13.5 Behavior To Preserve')) errors.push('Beginner handoff guide is missing key sections.');

const textToScan = { html, cssManifest, core, polish, v0102, v0103, v0104, v0105, v0106, v0107, v0108, v0109 };
Object.entries(textToScan).forEach(([name, text]) => {
  const matches = text.matchAll(/assets\/hockey-smash\/sprites\/([^'"`]+)\.png/g);
  for (const match of matches) {
    const webpCounterpart = path.join('assets', 'hockey-smash', 'sprites', `${match[1]}.webp`);
    if (fs.existsSync(webpCounterpart)) {
      errors.push(`${name} still references ${match[0]} even though ${webpCounterpart} exists.`);
    }
  }
});

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`${VERSION} static verification passed.`);
