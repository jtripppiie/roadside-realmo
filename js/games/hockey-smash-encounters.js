(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.13.7';
  const DISPLAY_BUILD = 'Build 2026-06-29.53';
  const DESIGN_WIDTH = 1024;
  const DESIGN_HEIGHT = 576;
  const GROUND_Y = DESIGN_HEIGHT * 0.82;
  const BASE_SPAWN_MS = 1600;
  const MIN_SPAWN_MS = 620;
  const SPAWN_JITTER_MS = 280;
  const COMBO_SPAWN_DELAY_MS = 420;
  const params = new URLSearchParams(window.location.search);
  const computerMode = params.get('computerMode') === '1';

  // This layer does not control the player.
  // It only adds moving gameplay objects to state.entities. The core game loop
  // already moves entities by vx * dt and checks overlap. Computer Mode uses
  // this same encounter pass so watch mode and normal play stay close together.
  const WAVE = [
    {
      type: 'salmon', x: 260, y: -72, width: 54, height: 31,
      vx: -45, vy: 440, hp: 1, damage: 0, dodgeDamage: 8, flip: -1,
      variant: 'rain', fallingFish: true, message: 'Fish raining down — dodge the splash zone!'
    },
    {
      type: 'bear', x: DESIGN_WIDTH + 90, y: GROUND_Y - 84, width: 96, height: 84,
      vx: -190, hp: 2, maxHp: 2, damage: 12,
      message: 'Bear moving in — use the stick and puck!'
    },
    {
      type: 'salmon', x: 500, y: -84, width: 58, height: 33,
      vx: 35, vy: 510, hp: 1, damage: 0, dodgeDamage: 8, flip: -1,
      variant: 'heavyRain', fallingFish: true, message: 'Heavy salmon drop — move out from under it!'
    },
    {
      type: 'salmon', x: 740, y: -64, width: 50, height: 29,
      vx: -20, vy: 560, hp: 1, damage: 0, dodgeDamage: 8, flip: -1,
      variant: 'fastRain', fallingFish: true, message: 'Fast fish drop — sidestep it!'
    },
    {
      type: 'salmon', x: 430, y: -92, width: 72, height: 34,
      vx: 55, vy: 470, hp: 1, damage: 0, dodgeDamage: 12, flip: -1,
      variant: 'schoolRain', fallingFish: true, message: 'Salmon SCHOOL raining down!'
    },
    {
      type: 'adultCoach', x: DESIGN_WIDTH + 40, y: GROUND_Y - 96, width: 90, height: 96,
      vx: -145, hp: 2, damage: 5, bubble: 'Point those toes!',
      message: 'Dance instructor challenge moving in!'
    },
    {
      type: 'sister', x: DESIGN_WIDTH + 70, y: GROUND_Y - 94, width: 84, height: 94,
      vx: -175, hp: 2, damage: 7, bubble: 'Spin move!',
      message: 'Sister spinning in!'
    },
    {
      type: 'moose', x: DESIGN_WIDTH + 120, y: GROUND_Y - 92, width: 112, height: 92,
      vx: -160, hp: 3, maxHp: 3, damage: 16,
      message: 'Moose moving in — use the stick and puck!'
    },
    {
      type: 'bird', x: DESIGN_WIDTH + 100, y: 132, width: 68, height: 52,
      vx: -360, vy: 0, hp: 1, maxHp: 1, damage: 6,
      message: 'Eagle flying across!'
    },
    {
      type: 'chargingMoose', x: DESIGN_WIDTH + 150, y: GROUND_Y - 118, width: 160, height: 118,
      vx: -260, hp: 4, maxHp: 4, damage: 18, chargeSpeed: 480,
      message: 'CHARGING MOOSE!'
    }
  ];

  function onReady() {
    const api = window.RTA_HOCKEY_SMASH;
    const badge = document.getElementById('hockey-build-badge');
    const status = document.getElementById('hockey-status');
    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api?.getVersion) api.getVersion = () => DISPLAY_VERSION;
    if (!api) return;

    let nextSpawnAt = 0;
    let waveIndex = 0;
    let firstPlayableAt = 0;
    let comboSpawnQueued = false;

    function getPlayableState() {
      const state = api.getState?.();
      if (!state || !state.player || state.mode === 'splash' || state.mode === 'transition' || state.mode === 'tryAgain') return null;
      if (!Array.isArray(state.entities)) state.entities = [];
      return state;
    }

    function activeMovingGameplayEntities(state) {
      return state.entities.filter((entity) => entity && !entity.dead && entity.fromMovingGameplayPass);
    }

    function difficultyFor(state, now) {
      const timedDifficulty = firstPlayableAt ? Math.min(1, (now - firstPlayableAt) / 120000) : 0;
      const scoreLayerDifficulty = Math.min(1, Math.max(0, Number(state.difficulty) || 0));
      return Math.max(timedDifficulty, scoreLayerDifficulty);
    }

    function forceRightSideSalmon(entity) {
      if (entity.type !== 'salmon' || entity.fallingFish) return entity;
      entity.x = Math.max(entity.x || 0, DESIGN_WIDTH + 72);
      entity.vx = -Math.abs(entity.vx || 420);
      entity.flip = -1;
      return entity;
    }

    function rainFishFromTop(entity, difficulty) {
      const drift = 70 + difficulty * 80;
      entity.fallingFish = true;
      entity.x = Math.max(24, Math.min(DESIGN_WIDTH - entity.width - 24, (entity.x || 0) + (Math.random() - 0.5) * 220));
      entity.y = -entity.height - Math.random() * 90;
      entity.vx = (Math.random() - 0.5) * drift;
      entity.vy = Math.abs(entity.vy || 460) + difficulty * 120;
      entity.flip = entity.vx < 0 ? -1 : 1;
      entity.damage = 0;
      entity.dodgeDamage = entity.dodgeDamage || 8;
      return entity;
    }

    function currentCharacter() {
      return api.getPlayerConfig?.()?.character || api.getState?.()?.playerCharacter || 'daniel';
    }

    function resolveModeEntity(entity) {
      if (entity.type !== 'adultCoach') return entity;
      const danceMode = currentCharacter() === 'sofie';
      if (!danceMode) return null;
      return {
        ...entity,
        type: 'danceInstructor',
        bubble: 'Point those toes!',
        message: 'Dance instructor challenge moving in!',
      };
    }

    function applyVariant(entity, difficulty) {
      const roll = Math.random();
      entity.difficulty = Number(difficulty.toFixed(2));
      entity.variant = entity.variant || 'normal';

      if (entity.type === 'salmon') {
        rainFishFromTop(entity, difficulty);
        if (entity.variant === 'heavyRain' || entity.variant === 'fastRain' || entity.variant === 'schoolRain') return entity;
        if (roll < 0.3 + difficulty * 0.4) {
          entity.variant = 'schoolRain';
          entity.width = Math.min(entity.width * 1.25, 90);
          entity.height = Math.max(entity.height || 31, 36);
          entity.dodgeDamage = 12;
          entity.message = 'Salmon SCHOOL raining down!';
          return entity;
        }
        if (roll < 0.55 + difficulty * 0.15) {
          entity.variant = 'heavyRain';
          entity.vy += 90;
          entity.message = 'Heavy salmon drop — move out from under it!';
          return entity;
        }
        if (roll < 0.7 + difficulty * 0.1) {
          entity.variant = 'fastRain';
          entity.vy *= 1.12 + difficulty * 0.18;
          entity.message = 'Fast fish drop — sidestep it!';
        }
        return entity;
      }

      if ((entity.type === 'bear' || entity.type === 'moose') && roll > 0.82 - difficulty * 0.24) {
        entity.variant = 'tank';
        entity.hp = (entity.hp || 1) + 1;
        entity.maxHp = Math.max(entity.maxHp || 1, entity.hp);
        entity.message = entity.type === 'moose' ? 'Big moose moving in — keep shooting pucks!' : 'Tough bear moving in — hit it again!';
        return entity;
      }

      if (entity.type === 'bird') {
        entity.variant = 'flyby';
        entity.vy = 0;
        entity.y = Math.max(84, Math.min(185, entity.y || 132));
        entity.vx = -Math.abs(entity.vx || 360) * (1 + difficulty * 0.18);
        entity.message = 'Eagle flying across!';
        return entity;
      }

      if (entity.type === 'chargingMoose') {
        entity.variant = 'charger';
        entity.maxHp = Math.max(entity.maxHp || 1, entity.hp || 4);
        entity.chargeSpeed = 480 + difficulty * 130;
        return entity;
      }

      if (roll < 0.18 + difficulty * 0.24) {
        entity.variant = 'fast';
        entity.vx *= 1.12 + difficulty * 0.22;
        entity.message = entity.type === 'sister' ? 'Fast spin move incoming!' : `${entity.type[0].toUpperCase()}${entity.type.slice(1)} speeding in!`;
      }

      return entity;
    }

    function spawnMovingEncounter(state, difficulty, options = {}) {
      const fishIntro = document.body.dataset.hockeyStagePhase === 'fish';
      const template = fishIntro
        ? WAVE.find((entry) => entry.type === 'salmon')
        : WAVE[waveIndex % WAVE.length];
      waveIndex += 1;
      const resolved = resolveModeEntity({
        ...template,
        key: `moving-${template.type}-${Date.now()}-${waveIndex}`,
        fromMovingGameplayPass: true,
        fromComputerMode: computerMode,
        comboSpawn: Boolean(options.comboSpawn)
      });
      if (!resolved) return;
      const entity = applyVariant(resolved, difficulty);
      state.entities.push(entity);
      state.message = entity.message || template.message;
      if (status) status.textContent = state.message;
      maybeQueueComboSpawn(difficulty);
    }

    function maybeQueueComboSpawn(difficulty) {
      // Complexity boost: later in a run, a second encounter can follow shortly
      // after the first one. The guard prevents runaway setTimeout chains.
      if (comboSpawnQueued || difficulty <= 0.08) return;
      if (Math.random() >= 0.16 + 0.18 * difficulty) return;
      comboSpawnQueued = true;
      window.setTimeout(() => {
        comboSpawnQueued = false;
        const state = getPlayableState();
        if (!state) return;
        const activeLimit = difficulty > 0.7 ? 3 : 2;
        if (activeMovingGameplayEntities(state).length >= activeLimit + 1) return;
        spawnMovingEncounter(state, difficulty * 0.8, { comboSpawn: true });
      }, COMBO_SPAWN_DELAY_MS);
    }

    function runMovingGameplay() {
      const state = getPlayableState();
      if (state) {
        const now = performance.now();
        if (!firstPlayableAt) {
          firstPlayableAt = now;
          nextSpawnAt = now + 250;
        }
        const difficulty = difficultyFor(state, now);
        state.difficulty = difficulty;
        const activeLimit = difficulty > 0.7 ? 3 : 2;
        if (now >= nextSpawnAt && activeMovingGameplayEntities(state).length < activeLimit) {
          spawnMovingEncounter(state, difficulty);
          const spawnInterval = Math.max(MIN_SPAWN_MS, BASE_SPAWN_MS * (1 - difficulty * 0.6));
          const jitter = Math.random() * SPAWN_JITTER_MS - SPAWN_JITTER_MS / 2;
          nextSpawnAt = now + spawnInterval + jitter;
        }
      }
      window.requestAnimationFrame(runMovingGameplay);
    }

    runMovingGameplay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
