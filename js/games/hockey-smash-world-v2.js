/*
 * Hockey Smash World v2 scaffold.
 *
 * This file is intentionally not loaded by index.html.
 * It defines the future game-world shape without changing current gameplay.
 */
(function () {
  const DESIGN_WIDTH = 1024;
  const DESIGN_HEIGHT = 576;
  const GROUND_Y = DESIGN_HEIGHT * 0.82;
  const SALMON_TARGET = 20;

  const PHASES = Object.freeze({
    COUNTDOWN: 'countdown',
    SALMON_RUN: 'salmonRun',
    ENCOUNTERS: 'encounters',
    GAME_OVER: 'gameOver',
  });

  const SPRITES = Object.freeze({
    daniel: 'assets/hockey-smash/sprites/hockey-player.webp',
    danielSlide: 'assets/hockey-smash/sprites/hockey-player-sliding.webp',
    sofie: 'assets/hockey-smash/sprites/dancer-player.webp',
    sofieSlide: 'assets/hockey-smash/sprites/sister-spinning.webp',
    salmon: 'assets/hockey-smash/sprites/salmon.webp',
    bear: 'assets/hockey-smash/sprites/bear.webp',
    moose: 'assets/hockey-smash/sprites/moose.webp',
    dad: 'assets/hockey-smash/sprites/dad.webp',
    mom: 'assets/hockey-smash/sprites/mom.webp',
    danceInstructor: 'assets/hockey-smash/sprites/dance_instructor.webp',
    alaskanBoy: 'assets/hockey-smash/sprites/alaskan_boy.webp',
    alaskanGirl: 'assets/hockey-smash/sprites/alaskan_girl.webp',
  });

  const DEFAULT_TUNING = Object.freeze({
    countdownSeconds: 10,
    gravity: 2250,
    walkSpeed: 285,
    slideSpeed: 455,
    jumpVelocity: 810,
    safeWindowSeconds: 0.76,
    salmonSpawnSeconds: 0.72,
    encounterSpawnSeconds: 2.2,
  });

  function createWorld(options = {}) {
    const character = options.character === 'sofie' ? 'sofie' : 'daniel';
    const fallbackName = character === 'sofie' ? 'Sofie' : 'Daniel';
    const name = cleanName(options.name, fallbackName);
    const tuning = { ...DEFAULT_TUNING, ...(options.tuning || {}) };

    return {
      version: 2,
      phase: PHASES.COUNTDOWN,
      elapsed: 0,
      countdownRemaining: tuning.countdownSeconds,
      salmonCaught: 0,
      salmonTarget: SALMON_TARGET,
      nextEntityId: 1,
      tuning,
      player: createPlayer({ character, name }),
      timers: {
        salmon: 0,
        encounter: tuning.encounterSpawnSeconds,
      },
      entities: [],
      effects: [],
      message: `Get ready, ${name}!`,
    };
  }

  function createPlayer({ character, name }) {
    return {
      id: 'player',
      type: 'player',
      character,
      name,
      sprite: character,
      x: 132,
      y: GROUND_Y - 108,
      width: 104,
      height: 108,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: true,
      slideActive: false,
      safeWindow: 0,
      score: 0,
    };
  }

  function createEntity(world, type, values = {}) {
    const entity = {
      id: `${type}-${world.nextEntityId}`,
      type,
      sprite: type,
      x: 0,
      y: 0,
      width: 48,
      height: 48,
      vx: 0,
      vy: 0,
      age: 0,
      ttl: null,
      collectible: false,
      nonContact: false,
      bubble: '',
      ...values,
    };
    world.nextEntityId += 1;
    return entity;
  }

  function createSalmon(world, values = {}) {
    return createEntity(world, 'salmon', {
      sprite: 'salmon',
      width: 54,
      height: 31,
      y: -60,
      collectible: true,
      nonContact: true,
      ...values,
    });
  }

  function createMom(world, values = {}) {
    return createEntity(world, 'mom', {
      sprite: 'mom',
      x: 112,
      y: GROUND_Y - 100,
      width: 92,
      height: 100,
      ttl: 4.8,
      nonContact: true,
      bubble: `${world.player.name}, clean your room!`,
      ...values,
    });
  }

  function createCameo(world, type, values = {}) {
    const safeType = type === 'alaskanBoy' ? 'alaskanBoy' : 'alaskanGirl';
    return createEntity(world, safeType, {
      sprite: safeType,
      width: 74,
      height: 92,
      y: GROUND_Y - 92,
      ttl: 6,
      nonContact: true,
      bubble: safeType === 'alaskanBoy' ? 'Alaska strong!' : 'You got this!',
      ...values,
    });
  }

  function advancePhase(world, nextPhase) {
    if (!Object.values(PHASES).includes(nextPhase)) return world;
    world.phase = nextPhase;
    if (nextPhase === PHASES.SALMON_RUN) world.message = `Salmon Run: catch 0/${world.salmonTarget}.`;
    if (nextPhase === PHASES.ENCOUNTERS) world.message = 'Salmon run complete — encounters unlocked.';
    return world;
  }

  function getSpriteForEntity(entity) {
    if (!entity) return '';
    if (entity.type === 'player' && entity.slideActive) return SPRITES[`${entity.character}Slide`] || SPRITES[entity.character];
    return SPRITES[entity.sprite] || SPRITES[entity.type] || '';
  }

  function cleanName(value, fallback) {
    const cleaned = String(value || '')
      .replace(/[<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 12);
    return cleaned || fallback || 'Daniel';
  }

  window.HOCKEY_SMASH_WORLD_V2 = Object.freeze({
    DESIGN_WIDTH,
    DESIGN_HEIGHT,
    GROUND_Y,
    SALMON_TARGET,
    PHASES,
    SPRITES,
    DEFAULT_TUNING,
    createWorld,
    createPlayer,
    createEntity,
    createSalmon,
    createMom,
    createCameo,
    advancePhase,
    getSpriteForEntity,
  });
})();
