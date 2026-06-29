const fs = require('fs');

const DISPLAY_VERSION = 'Hockey Smash v0.5.4';
const DISPLAY_BUILD = 'Build 2026-06-29.1';
const DISPLAY_BADGE = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;

const requiredFiles = [
  'index.html',
  'style.css',
  'hockey-smash-polish.css',
  'script.js',
  'js/games/hockey-smash.js',
  'js/games/hockey-smash-polish.js',
  'README.md',
  'CHANGELOG.md',
  'docs/hockey-smash-design.md',
  'docs/hockey-smash-workflow.md',
  'docs/hockey-smash-dev-checklist.md',
  'docs/hockey-smash-progress.md',
  'docs/hockey-smash-qa.md',
  'scripts/verify-hockey-smash-actions.js',
];

const requiredAssetPaths = [
  'assets/hockey-smash/backgrounds/soldotna_cityscape_background_01_1920x1080.png',
  'assets/hockey-smash/backgrounds/soldotna_cityscape_background_02_1920x1080.png',
  'assets/hockey-smash/backgrounds/soldotna_cityscape_background_03_1920x1080.png',
  'assets/hockey-smash/backgrounds/soldotna_cityscape_background_04_1920x1080.png',
  'assets/hockey-smash/backgrounds/soldotna_cityscape_background_05_1920x1080.png',
  'assets/hockey-smash/sprites/hockey-player.png',
  'assets/hockey-smash/sprites/splash.png',
  'assets/hockey-smash/sprites/salmon.png',
  'assets/hockey-smash/sprites/bear.png',
  'assets/hockey-smash/sprites/moose.png',
  'assets/hockey-smash/sprites/dad.png',
  'assets/hockey-smash/sprites/mom.png',
  'assets/hockey-smash/sprites/mom_text.png',
  'assets/hockey-smash/sprites/sister.png',
  'assets/hockey-smash/sprites/sister_text.png',
];

const errors = [];

requiredFiles.forEach((file) => {
  if (!fs.existsSync(file)) errors.push(`Missing required file: ${file}`);
});

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

const html = read('index.html');
const js = read('js/games/hockey-smash.js');
const polishJs = read('js/games/hockey-smash-polish.js');
const css = read('style.css');
const polishCss = read('hockey-smash-polish.css');
const readme = read('README.md');
const changelog = read('CHANGELOG.md');
const packageJson = read('package.json');

[
  ['index.html', html],
  ['js/games/hockey-smash-polish.js', polishJs],
  ['README.md', readme],
  ['CHANGELOG.md', changelog],
].forEach(([file, content]) => {
  if (!content.includes(DISPLAY_VERSION)) errors.push(`${file} missing ${DISPLAY_VERSION}.`);
});

if (!packageJson.includes('"version": "0.5.4"')) errors.push('package.json version should be 0.5.4.');
if (!html.includes('Entering Hockey Smash')) errors.push('Transition text is missing.');
if (!html.includes('assets/hockey-smash/sprites/splash.png')) errors.push('Splash character image is missing.');
if (!html.includes('Hockey Slash 2')) errors.push('Splash title is missing.');
if (!html.includes("He's back with a vengance!")) errors.push('Splash tagline is missing.');
if (!html.includes('Rotate for the best gaming experience.')) errors.push('Rotate guidance is missing from the public UI.');
if (!html.includes(DISPLAY_BADGE)) errors.push('Visible build overlay is missing or stale.');
if (!polishJs.includes(DISPLAY_BADGE)) errors.push('Runtime polish script should force the latest visible badge.');
if (!polishJs.includes('api.getVersion = () => DISPLAY_VERSION')) errors.push('Runtime getVersion override should report the visible build version.');
if (!html.includes('id="hockey-canvas"')) errors.push('Hockey canvas is missing.');
if (!html.includes('id="hockey-debug"')) errors.push('Debug overlay is missing.');
if (!html.includes('hockey-smash-polish.css')) errors.push('Normal-mode polish stylesheet is missing from HTML.');
if (!html.includes('js/games/hockey-smash-polish.js')) errors.push('Normal-mode polish script is missing from HTML.');
if (html.includes('class="hockey-version"')) errors.push('Duplicate in-screen version label should be removed; keep version in the top-right badge.');
if (!html.includes('Survive the salmon run')) errors.push('HUD subtitle should replace the duplicate HUD version label.');
if (!html.includes('data-action="left"') || !html.includes('data-action="right"')) errors.push('D-pad left/right actions are missing.');
if (!html.includes('data-action="jump"') || !html.includes('data-action="slide"') || !html.includes('data-action="stick"')) errors.push('Action buttons are missing.');
if (!html.includes('aria-label="Jump">J</button>') || !html.includes('aria-label="Slide">S</button>')) errors.push('Compact J/S action labels are missing.');
if (!html.includes('aria-label="Hockey stick attack"') || !html.includes('🏒')) errors.push('Hockey stick button icon is missing.');
if (!css.includes('body.hockey-playing')) errors.push('No-scroll gameplay body class is missing.');
if (!css.includes('touch-action: none')) errors.push('Touch scroll prevention is missing.');
if (!polishCss.includes('body:not(.hockey-computer-mode) .hockey-debug')) errors.push('Normal mode should hide the debug overlay.');
if (!polishCss.includes('.hockey-player-overlay')) errors.push('Normal-mode player overlay CSS is missing.');
if (!polishCss.includes('drop-shadow')) errors.push('Player overlay visibility shadow is missing.');
if (!polishCss.includes('.hockey-finish')) errors.push('Victory overlay CSS is missing.');
if (!polishJs.includes('hockey-computer-mode')) errors.push('Computer mode body class hook is missing.');
if (!polishJs.includes('hockey-player-overlay')) errors.push('Normal-mode player overlay script is missing.');
if (!polishJs.includes('syncPlayerOverlay')) errors.push('Player overlay sync function is missing.');
if (!polishJs.includes('assets/hockey-smash/sprites/hockey-player.png')) errors.push('Player overlay must use the hockey-player sprite.');
if (!polishJs.includes('hockey-finish')) errors.push('Victory overlay script is missing.');
if (!polishJs.includes('Final challenge cleared')) errors.push('Victory status text is missing.');
if (!js.includes('groundRatio: 0.82')) errors.push('Ground ratio must be 0.82.');
if (!js.includes('isComputerMode')) errors.push('Computer mode hook is missing.');
if (!js.includes('updateDebugPanel')) errors.push('Debug panel update hook is missing.');
if (!js.includes('makeWhiteTransparent')) errors.push('Player sprite transparency processing is missing.');
if (!js.includes('drawObstacleLabel')) errors.push('Bear/moose obstacle label rendering is missing.');
if (!js.includes('clearedObstacle')) errors.push('Computer obstacle-clear result is missing.');
if (js.includes("'#4f7f61'") || js.includes("'#f9dc62'")) errors.push('Old fallback green mountains/sun should not render.');
if (js.includes("'#a6a89e'") || js.includes("'#b8baae'") || js.includes("'#74776f'")) errors.push('Code-drawn gray sidewalk should not render.');
if (!js.includes('STATE')) errors.push('Game state system is missing.');
if (!js.includes('drawSpriteOrPlaceholder')) errors.push('Asset fallback placeholder system is missing.');

requiredAssetPaths.forEach((assetPath) => {
  if (!js.includes(assetPath)) errors.push(`Runtime missing asset path definition: ${assetPath}`);
  if (!readme.includes(assetPath)) errors.push(`README missing asset path: ${assetPath}`);
});

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`${DISPLAY_VERSION} static verification passed for normal-mode player visibility polish.`);
