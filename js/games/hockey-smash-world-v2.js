/*
 * Hockey Smash World v2.
 *
 * Defines the active game-world shape without owning DOM, rendering, or input.
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
    danielDuck: 'assets/hockey-smash/sprites/hockey-player-ducking.webp',
    sofie: 'assets/hockey-smash/sprites/dancer-player.webp',
    sofieSlide: 'assets/hockey-smash/sprites/sister-spinning.webp',
    salmon: 'assets/hockey-smash/sprites/salmon.webp',
    bear: 'assets/hockey-smash/sprites/bear-1.webp',
    moose: 'assets/hockey-smash/sprites/moose-1.webp',
    dad: 'assets/hockey-smash/sprites/dad.webp',
    mom: 'assets/hockey-smash/sprites/mom.webp',
    danceInstructor: 'assets/hockey-smash/sprites/dance_instructor.webp',
    alaskanBoy: 'assets/hockey-smash/sprites/alaskan_boy.webp',
    alaskanGirl: 'assets/hockey-smash/sprites/alaskan_girl.webp',
    eagle: 'assets/hockey-smash/sprites/eagle_mid_flap.webp',
    eagleTop: 'assets/hockey-smash/sprites/eagle_top_flap.webp',
    eagleMid: 'assets/hockey-smash/sprites/eagle_mid_flap.webp',
    eagleBottom: 'assets/hockey-smash/sprites/eagle_bottom_flap.webp',
  });

  const DEFAULT_TUNING = Object.freeze({
    countdownSeconds: 10,
    gravity: 2250,
    walkSpeed: 360,
    slideSpeed: 575,
    jumpVelocity: 810,
    safeWindowSeconds: 0.76,
    salmonSpawnSeconds: 1.12,
    salmonFallVelocity: 235,
    salmonFallVelocityRange: 45,
    salmonFallGravity: 275,
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
      debug: createDebugState(options.debug),
      difficulty: createDifficulty(options.difficulty || {}),
      environment: createEnvironment(options.environment || {}),
      entities: [],
      effects: [],
      message: `Get ready, ${name}!`,
    };
  }

  function createDebugState(enabled = false) {
    return {
      enabled: Boolean(enabled),
      showFPS: Boolean(enabled),
      showHitboxes: false,
      godMode: false,
      lastCollision: '',
      fps: 0,
      visible: Boolean(enabled),
    };
  }

  function createDifficulty(options = {}) {
    return {
      level: 1,
      elapsedInEncounters: 0,
      baseSpawnMin: 1.8,
      baseSpawnMax: 3.2,
      currentSpawnMin: 1.8,
      currentSpawnMax: 3.2,
      maxActiveThreats: 1,
      maxActiveWildlife: 1,
      speedMultiplier: 1,
      threatSpeedRampPerSecond: 0.0008,
      salmonPostGateSpawnMin: 1.3,
      salmonPostGateSpawnMax: 2.0,
      ...options,
    };
  }

  function updateDifficulty(world, dt) {
    if (!world || world.phase !== PHASES.ENCOUNTERS) return world;

    const difficulty = world.difficulty || createDifficulty();
    world.difficulty = difficulty;
    difficulty.elapsedInEncounters += dt;
    difficulty.level = 1 + Math.floor(difficulty.elapsedInEncounters / 45);

    const ramp = difficulty.elapsedInEncounters * difficulty.threatSpeedRampPerSecond;
    difficulty.speedMultiplier = Math.min(1.75, 1 + ramp);

    difficulty.currentSpawnMin = Math.max(1.05, difficulty.baseSpawnMin - difficulty.level * 0.08);
    difficulty.currentSpawnMax = Math.max(1.65, difficulty.baseSpawnMax - difficulty.level * 0.12);

    difficulty.maxActiveThreats = difficulty.level >= 4 ? 2 : 1;
    difficulty.maxActiveWildlife = 1;
    return world;
  }

  function createEnvironment(options = {}) {
    return {
      clock: Number(options.clock || 0),
      cycleSeconds: Number(options.cycleSeconds || 96),
      scrollX: Number(options.scrollX || 0),
      wind: Number(options.wind || 1),
      nightAmount: typeof options.nightAmount === 'number' ? Number(options.nightAmount) : null,
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
      duckActive: false,
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
    const height = 132;
    const width = 49;
    return createEntity(world, 'mom', {
      sprite: 'mom',
      x: 112,
      y: GROUND_Y - height,
      width,
      height,
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
      bubble: 'Hi, you\'re cute',
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
    if (entity.type === 'player' && entity.duckActive) return SPRITES.danielDuck || SPRITES.daniel;
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
    createDebugState,
    createDifficulty,
    updateDifficulty,
    createEnvironment,
    createPlayer,
    createEntity,
    createSalmon,
    createMom,
    createCameo,
    advancePhase,
    getSpriteForEntity,
  });
})();
