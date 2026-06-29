const fs = require('fs');

const requiredFiles = [
  'index.html',
  'style.css',
  'script.js',
  'js/games/hockey-smash.js',
  'README.md',
  'CHANGELOG.md',
  'docs/hockey-smash-design.md',
  'docs/hockey-smash-workflow.md',
  'docs/hockey-smash-dev-checklist.md',
  'docs/roadside-realm-progress.md',
  'docs/roadside-realm-qa.md',
];

const requiredAssetPaths = [
  'assets/roadside-realm/backgrounds/soldotna_cityscape_background_01_1920x1080.png',
  'assets/roadside-realm/backgrounds/soldotna_cityscape_background_02_1920x1080.png',
  'assets/roadside-realm/backgrounds/soldotna_cityscape_background_03_1920x1080.png',
  'assets/roadside-realm/backgrounds/soldotna_cityscape_background_04_1920x1080.png',
  'assets/roadside-realm/backgrounds/soldotna_cityscape_background_05_1920x1080.png',
  'assets/player_hockey_sprite_96x96.png',
  'assets/roadside-realm/sprites/salmon.png',
  'assets/roadside-realm/sprites/bear.png',
  'assets/roadside-realm/sprites/moose.png',
  'assets/roadside-realm/sprites/dad.png',
  'assets/roadside-realm/sprites/mom.png',
  'assets/roadside-realm/sprites/mom_text.png',
  'assets/roadside-realm/sprites/sister.png',
  'assets/roadside-realm/sprites/sister_text.png',
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
const css = read('style.css');
const readme = read('README.md');
const changelog = read('CHANGELOG.md');

[
  ['index.html', html],
  ['js/games/hockey-smash.js', js],
  ['README.md', readme],
  ['CHANGELOG.md', changelog],
].forEach(([file, content]) => {
  if (!content.includes('Hockey Smash v0.5.0')) errors.push(`${file} missing Hockey Smash v0.5.0.`);
});

if (!html.includes('Entering Hockey Smash')) errors.push('Transition text is missing.');
if (!html.includes('Loading...')) errors.push('Black loading splash text is missing.');
if (!html.includes('Rotate for the best gaming experience.')) errors.push('Rotate guidance is missing from the public UI.');
if (!html.includes('Hockey Smash v0.5.0 · Build 2026-06-28.5')) errors.push('Visible build overlay is missing or stale.');
if (!html.includes('id="hockey-canvas"')) errors.push('Hockey canvas is missing.');
if (!html.includes('data-action="left"') || !html.includes('data-action="right"')) errors.push('D-pad left/right actions are missing.');
if (!html.includes('data-action="jump"') || !html.includes('data-action="slide"') || !html.includes('data-action="stick"')) errors.push('Action buttons are missing.');
if (!css.includes('body.hockey-playing')) errors.push('No-scroll gameplay body class is missing.');
if (!css.includes('touch-action: none')) errors.push('Touch scroll prevention is missing.');
if (!js.includes('groundRatio: 0.60')) errors.push('Ground ratio must be 0.60.');
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

console.log('Hockey Smash static verification passed for v0.5.0.');
