const fs = require('fs');
const path = require('path');

const VERSION = 'Hockey Smash v0.14.28';
const BUILD = 'Build 2026-06-30.84';
const CACHE_KEY = '0.14.28-20260630.84';

const requiredFiles = [
  'index.html',
  'package.json',
  'script.js',
  'style.css',
  'hockey-smash.css',
  'hockey-smash-polish.css',
  'hockey-smash-touch.css',
  'hockey-smash-custom.css',
  'hockey-smash-overlays.css',
  'hockey-smash-rotate.css',
  'hockey-smash-hud.css',
  'js/games/hockey-smash.js',
  'js/games/hockey-smash-polish.js',
  'js/games/hockey-smash-backgrounds.js',
  'js/games/hockey-smash-mobile-flow.js',
  'js/games/hockey-smash-input.js',
  'js/games/hockey-smash-computer-balance.js',
  'js/games/hockey-smash-game-over.js',
  'js/games/hockey-smash-encounters.js',
  'js/games/hockey-smash-projectiles.js',
  'js/games/hockey-smash-score.js',
  'js/games/hockey-smash-characters.js',
  'js/games/hockey-smash-weather.js',
  'js/games/hockey-smash-safety.js',
  'js/games/hockey-smash-family-combat.js',
  'js/games/hockey-smash-pacing.js',
  'js/games/hockey-smash-spotlight.js',
  'js/games/hockey-smash-stage-flow.js',
  'js/games/hockey-smash-release.js',
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

function requireText(label, text, needle, message) {
  if (!text.includes(needle)) errors.push(message || `${label} is missing ${needle}`);
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
const touchCss = read('hockey-smash-touch.css');
const customCss = read('hockey-smash-custom.css');
const inputLayer = read('js/games/hockey-smash-input.js');
const encountersLayer = read('js/games/hockey-smash-encounters.js');
const projectilesLayer = read('js/games/hockey-smash-projectiles.js');
const scoreLayer = read('js/games/hockey-smash-score.js');
const weather = read('js/games/hockey-smash-weather.js');
const charactersLayer = read('js/games/hockey-smash-characters.js');
const safetyLayer = read('js/games/hockey-smash-safety.js');
const familyLayer = read('js/games/hockey-smash-family-combat.js');
const pacingLayer = read('js/games/hockey-smash-pacing.js');
const spotlightLayer = read('js/games/hockey-smash-spotlight.js');
const stageFlowLayer = read('js/games/hockey-smash-stage-flow.js');
const releaseLayer = read('js/games/hockey-smash-release.js');

requireText('package.json', pkg, '"version": "0.14.28"', 'Package version is stale.');
requireText('index.html', html, `${VERSION} · ${BUILD}`, 'Build badge is stale.');
requireText('index.html', html, `hockey-smash.css?v=${CACHE_KEY}`, 'CSS manifest is not linked or cache-busted.');
requireText('index.html', html, `js/games/hockey-smash-release.js?v=${CACHE_KEY}`, 'Final release layer is not linked or cache-busted.');
requireText('index.html', html, `js/games/hockey-smash-weather.js?v=${CACHE_KEY}`, 'Weather layer is not linked or cache-busted.');
requireText('hockey-smash.css', cssManifest, `style.css?v=${CACHE_KEY}`, 'CSS manifest cache key is stale.');
requireText('hockey-smash.css', cssManifest, '[hidden]', 'Hidden screen hard override is missing.');
requireText('style.css', style, 'max-height: min(32vh, 285px)', 'Compact no-scroll splash sizing is missing from style.css.');
requireText('hockey-smash-custom.css', customCss, 'padding: 0.4rem 0.78rem', 'Compact customization control sizing is missing.');
requireText('js/games/hockey-smash-release.js', releaseLayer, VERSION, 'Final release layer version is stale.');
requireText('js/games/hockey-smash-release.js', releaseLayer, BUILD, 'Final release layer build is stale.');
requireText('js/games/hockey-smash-family-combat.js', familyLayer, 'doubleJump', 'Double-jump layer is missing.');
requireText('js/games/hockey-smash-pacing.js', pacingLayer, 'Progressive pacing', 'Progressive pacing layer is missing.');
requireText('js/games/hockey-smash-spotlight.js', spotlightLayer, 'slowBears', 'Bear-speed tuning layer is missing.');
requireText('js/games/hockey-smash-stage-flow.js', stageFlowLayer, 'Fish Dodge Level', 'Staged fish-dodge level is missing.');
requireText('js/games/hockey-smash-release.js', releaseLayer, 'BEAR_START_SPEED = 82', 'Final bear-speed tuning is missing.');
requireText('js/games/hockey-smash-safety.js', safetyLayer, 'START_COUNTDOWN_SECONDS = 10', 'Start-game 10-second practice countdown is missing.');
requireText('js/games/hockey-smash-safety.js', safetyLayer, 'forceSalmonFromRight', 'Right-side-only salmon guard is missing.');
requireText('js/games/hockey-smash-projectiles.js', projectilesLayer, 'PUCK_MAX_CHARGE_MS = 720', 'Stronger charge window is missing.');
requireText('js/games/hockey-smash-projectiles.js', projectilesLayer, 'PUCK_COOLDOWN_MS = 180', 'Faster charged-shot cooldown is missing.');
requireText('js/games/hockey-smash-projectiles.js', projectilesLayer, 'PUCK_BOUNCE_GRAVITY = 680', 'Bounce projectile gravity is missing.');
requireText('js/games/hockey-smash-projectiles.js', projectilesLayer, 'const shotDirection = 1', 'Projectiles should always fire to the right.');
requireText('js/games/hockey-smash-projectiles.js', projectilesLayer, 'puckSpeedBoostUntil', 'Safe puck-speed power-up state is missing.');
requireText('js/games/hockey-smash-projectiles.js', projectilesLayer, 'fallingFishReachedPlayer', 'Falling-fish dodge handling is missing.');
requireText('js/games/hockey-smash-encounters.js', encountersLayer, "variant: 'heavyRain'", 'Heavy falling-fish pattern is missing.');
requireText('js/games/hockey-smash-encounters.js', encountersLayer, "variant: 'schoolRain'", 'School falling-fish pattern is missing.');
requireText('js/games/hockey-smash-encounters.js', encountersLayer, 'danceInstructor', 'Dance instructor moving encounter is missing.');
requireText('js/games/hockey-smash.js', core, 'dance_instructor.webp', 'Dance instructor sprite is missing from core assets.');
requireText('js/games/hockey-smash-encounters.js', encountersLayer, 'maybeQueueComboSpawn', 'Combo encounter spawning is missing.');
requireText('js/games/hockey-smash-characters.js', charactersLayer, "gameTitle: 'Dance Smash'", 'Dance Smash labels are missing.');
requireText('js/games/hockey-smash-score.js', scoreLayer, 'Projectile Hits', 'Score feedback should support projectile hits.');
requireText('js/games/hockey-smash-projectiles.js', projectilesLayer, 'currentPuckType', 'Advanced puck type selection is missing.');
requireText('js/games/hockey-smash-projectiles.js', projectilesLayer, "'fire'", 'Fire puck behavior is missing.');
requireText('js/games/hockey-smash-projectiles.js', projectilesLayer, "'bounce'", 'Bounce puck behavior is missing.');
requireText('js/games/hockey-smash-encounters.js', encountersLayer, "'chargingMoose'", 'Charging moose encounter is missing.');
if (encountersLayer.includes("'icePatch'") || encountersLayer.includes('"icePatch"')) errors.push('Ice patch encounter should be removed from normal arena play.');
if (core.includes('makeWhiteTransparent')) errors.push('Player sprite should not be chroma-key processed in normal canvas rendering.');
if (core.includes("if (entity.type === 'salmon' || entity.type === 'bird') entity.vy += 460 * dt")) errors.push('Birds should not use falling-fish gravity.');
if (core.includes(") drawObstacleLabel(ctx, entity);") && !core.includes('if (isComputerMode() && (entity.type ===')) errors.push('Obstacle labels should be gated to computer/debug mode.');
if (read('js/games/hockey-smash-backgrounds.js').includes('Arena edge reached. Keep collecting salmon!')) errors.push('Arena edge layer should not teleport or loop the player.');
requireText('js/games/hockey-smash-encounters.js', encountersLayer, "'bird'", 'Bird encounter is missing.');
if (core.includes('drawIcePatch')) errors.push('Ice patch drawing should be removed from normal arena play.');
requireText('js/games/hockey-smash-score.js', scoreLayer, 'hockeyHighScore', 'Requested high-score storage key is missing.');
requireText('js/games/hockey-smash-weather.js', weather, 'RTA_HOCKEY_SMASH_WEATHER', 'Weather API is missing.');
requireText('js/games/hockey-smash-weather.js', weather, 'syncParallax', 'Weather parallax layer is missing.');
requireText('js/games/hockey-smash-input.js', inputLayer, 'const activePointers = new Map()', 'Pointer tracking is missing from movement layer.');
requireText('js/games/hockey-smash.js', core, "ArrowDown: 'slide'", 'Core keyboard controls must map ArrowDown to slide/duck.');
requireText('js/games/hockey-smash-input.js', inputLayer, "key === 'ArrowDown'", 'Enhanced keyboard controls must map ArrowDown to slide/duck.');
requireText('js/games/hockey-smash-projectiles.js', projectilesLayer, "rotate(0deg)", 'Pucks should render horizontally in normal play.');
requireText('js/games/hockey-smash-projectiles.js', projectilesLayer, "rotate(-6deg)", 'Pointe-shoe projectiles should render mostly horizontal.');
requireText('js/games/hockey-smash.js', core, 'isComputerMode() && p.attackTimer > 0', 'Attack debug box must be gated to computer/debug mode.');
requireText('js/games/hockey-smash.js', core, 'Clean your room!', 'Mom cleaning-room pop-up is missing from core family spawns.');
requireText('js/games/hockey-smash-release.js', releaseLayer, 'do your homework!', 'Dad personalized homework line is missing from release cast.');
requireText('js/games/hockey-smash-release.js', releaseLayer, 'Dad rides in:', 'Dad ride-in message is missing from release cast.');
requireText('js/games/hockey-smash-release.js', releaseLayer, 'dadRideInDone', 'Dad should be a one-time ride-in, not a repeating cast loop.');
requireText('js/games/hockey-smash-stage-flow.js', stageFlowLayer, 'document.body.dataset.hockeyStagePhase = info.phase', 'Stage phase flag is missing.');
requireText('js/games/hockey-smash-encounters.js', encountersLayer, "document.body.dataset.hockeyStagePhase === 'fish'", 'Moving encounters must respect fish-only intro phase.');
requireText('js/games/hockey-smash.js', core, 'spawn: { wildlife: 4.0, salmon: 0.35, family: 12.0, dadJoke: 12.0 }', 'Initial spawn timers should start with falling fish before other items.');
requireText('hockey-smash-touch.css', touchCss, 'touch-action: none', 'Touch-action CSS is missing.');
if (projectilesLayer.includes('puck.vy < -100')) errors.push('Projectile sprite rotation should not be tied to vertical velocity.');
if (projectilesLayer.includes('chargeFactor * -220')) errors.push('Normal puck/shoe shots should fly horizontally, not arc upward.');
if (html.includes('hockey-smash-powerups.js')) errors.push('Earthquake power-up layer should not be loaded.');
if (/earthquake|Earthquake|RTA_HOCKEY_SMASH_EARTHQUAKE|activateEarthquake|QUAKE/.test(projectilesLayer + releaseLayer + spotlightLayer + safetyLayer + scoreLayer)) errors.push('Earthquake mode should be removed from normal game layers.');
if (encountersLayer.includes('Eyes on the puck') || releaseLayer.includes('Eyes on the puck')) errors.push('Teacher puck dialogue should not appear in normal encounter/release layers.');
if (core.includes('teacher.png') || core.includes('mom_text.png') || core.includes('sister_text.png') || core.includes('sister.png')) errors.push('Core normal-play assets should not preload teacher/text PNGs.');
if (releaseLayer.includes("type: 'mom'") || stageFlowLayer.includes("'mom'") || pacingLayer.includes("'mom'") || safetyLayer.includes("'mom'") || familyLayer.includes("'mom'")) errors.push('Mom should be a stationary pop-up, not a moving/hazard/cast entity.');
if (core.includes('alaskan_boy.webp') || core.includes('alaskan_girl.webp') || releaseLayer.includes("type: 'alaskanBoy'") || releaseLayer.includes("type: 'alaskanGirl'")) errors.push('Alaska kids should only be static sideline cameos, not normal moving entities.');

const docsToCheck = { readme, changelog, workflow, checklist, qa, progress, kidGuide };
Object.entries(docsToCheck).forEach(([name, text]) => {
  if (!text.includes('v0.14.4') && !text.includes('0.14.4')) errors.push(`${name} does not mention the current version.`);
});
requireText('README.md', readme, 'charged', 'README does not document charged shots.');
requireText('README.md', readme, 'salmon', 'README does not document salmon gameplay.');
requireText('CHANGELOG.md', changelog, '0.14.4 - Cast QA And Controls', 'Changelog is missing the v0.14.4 entry.');

const textToScan = { html, cssManifest, core, encountersLayer, projectilesLayer, scoreLayer, charactersLayer, safetyLayer, familyLayer };
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
