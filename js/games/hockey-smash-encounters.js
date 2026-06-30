(function () {
  const DESIGN_WIDTH = 1024;
  const DESIGN_HEIGHT = 576;
  const GROUND_Y = DESIGN_HEIGHT * 0.82;
  const BASE_SPAWN_MS = 3600;
  const MIN_SPAWN_MS = 2100;
  const SALMON_RUN_SPAWN_MS = 780;
  const SALMON_RUN_JITTER_MS = 320;
  const SPAWN_JITTER_MS = 850;
  const COMBO_SPAWN_DELAY_MS = 1350;
  const RECENT_TYPE_LIMIT = 3;
  const params = new URLSearchParams(window.location.search);
  const computerMode = params.get('computerMode') === '1';

  const WAVE = [
    { type: 'salmon', x: 260, y: -72, width: 54, height: 31, vx: -45, vy: 560, hp: 1, damage: 0, flip: -1, variant: 'rain', fallingFish: true, message: 'Fish raining down — catch the salmon!' },
    { type: 'bear', x: DESIGN_WIDTH + 120, y: GROUND_Y - 84, width: 96, height: 84, vx: -170, hp: 2, maxHp: 2, damage: 12, message: 'Bear moving in — use the stick and puck!' },
    { type: 'bird', x: DESIGN_WIDTH + 140, y: 132, width: 68, height: 52, vx: -330, vy: 0, hp: 1, maxHp: 1, damage: 6, message: 'Eagle flying across!' },
    { type: 'moose', x: DESIGN_WIDTH + 145, y: GROUND_Y - 92, width: 112, height: 92, vx: -145, hp: 3, maxHp: 3, damage: 16, message: 'Moose moving in — use the stick and puck!' },
    { type: 'salmon', x: 500, y: -84, width: 58, height: 33, vx: 35, vy: 620, hp: 1, damage: 0, flip: -1, variant: 'heavyRain', fallingFish: true, message: 'Heavy salmon drop — catch it fast!' },
    { type: 'adultCoach', x: DESIGN_WIDTH + 150, y: GROUND_Y - 96, width: 90, height: 96, vx: -120, hp: 2, damage: 5, bubble: 'Point those toes!', message: 'Dance instructor challenge moving in!' },
    { type: 'sister', x: DESIGN_WIDTH + 160, y: GROUND_Y - 94, width: 84, height: 94, vx: -140, hp: 2, damage: 7, bubble: 'Spin move!', message: 'Sister spinning in!' },
    { type: 'salmon', x: 740, y: -64, width: 50, height: 29, vx: -20, vy: 680, hp: 1, damage: 0, flip: -1, variant: 'fastRain', fallingFish: true, message: 'Fast fish drop — catch it!' },
    { type: 'chargingMoose', x: DESIGN_WIDTH + 180, y: GROUND_Y - 118, width: 160, height: 118, vx: -220, hp: 4, maxHp: 4, damage: 18, chargeSpeed: 420, message: 'CHARGING MOOSE!' }
  ];

  const BUBBLE_LINES = {
    danceInstructor: ['Point those toes!', 'Big finish!', 'Spot your turn!', 'Graceful escape!'],
    sister: ['Spin move!', 'You missed me!', 'Too slow!', 'Try catching this!'],
  };

  function onReady() {
    const api = window.RTA_HOCKEY_SMASH;
    const status = document.getElementById('hockey-status');
    if (!api) return;

    let nextSpawnAt = 0;
    let waveIndex = 0;
    let salmonRunIndex = 0;
    let firstPlayableAt = 0;
    let comboSpawnQueued = false;
    let lastBubbleLine = '';
    const recentTypes = [];

    function getPlayableState() {
      const state = api.getState?.();
      if (!state || !state.player || state.mode === 'splash' || state.mode === 'transition' || state.mode === 'tryAgain') return null;
      if (!Array.isArray(state.entities)) state.entities = [];
      return state;
    }

    function stagePhase() {
      return document.body.dataset.hockeyStagePhase || 'salmonRun';
    }

    function salmonRunActive() {
      return stagePhase() === 'salmonRun';
    }

    function activeCrowdEntities(state) {
      if (salmonRunActive()) return [];
      return state.entities.filter((entity) => {
        if (!entity || entity.dead) return false;
        if (entity.safeCollectible || entity.collectibleSalmon || entity.stationarySupport || entity.nonContact) return false;
        return ['bear', 'moose', 'chargingMoose', 'bird', 'dad', 'sister', 'teacher', 'danceInstructor', 'adultCoach', 'daniel'].includes(entity.type);
      });
    }

    function difficultyFor(state, now) {
      const timedDifficulty = firstPlayableAt ? Math.min(1, (now - firstPlayableAt) / 135000) : 0;
      const scoreLayerDifficulty = Math.min(1, Math.max(0, Number(state.difficulty) || 0));
      return Math.max(timedDifficulty, scoreLayerDifficulty * 0.85);
    }

    function currentCharacter() {
      return api.getPlayerConfig?.()?.character || api.getState?.()?.playerCharacter || 'daniel';
    }

    function pickBubbleLine(type) {
      const lines = BUBBLE_LINES[type] || [];
      if (!lines.length) return '';
      let line = lines[Math.floor(Math.random() * lines.length)];
      if (lines.length > 1 && line === lastBubbleLine) {
        line = lines[(lines.indexOf(line) + 1) % lines.length];
      }
      lastBubbleLine = line;
      return line;
    }

    function rememberType(type) {
      recentTypes.push(type);
      while (recentTypes.length > RECENT_TYPE_LIMIT) recentTypes.shift();
    }

    function resolveModeEntity(entity) {
      if (entity.type !== 'adultCoach') return entity;
      if (currentCharacter() === 'sofie') {
        return { ...entity, type: 'danceInstructor', bubble: pickBubbleLine('danceInstructor') || 'Point those toes!', message: 'Dance instructor challenge moving in!' };
      }
      return null;
    }

    function pickSalmonTemplate() {
      const salmonTemplates = WAVE.filter((entry) => entry.type === 'salmon');
      const template = salmonTemplates[salmonRunIndex % salmonTemplates.length] || WAVE[0];
      salmonRunIndex += 1;
      return template;
    }

    function pickWaveTemplate() {
      if (salmonRunActive()) return pickSalmonTemplate();
      for (let attempts = 0; attempts < WAVE.length; attempts += 1) {
        const template = WAVE[waveIndex % WAVE.length];
        const resolvedType = template.type === 'adultCoach' ? (currentCharacter() === 'sofie' ? 'danceInstructor' : 'skip') : template.type;
        waveIndex += 1;
        if (resolvedType === 'skip') continue;
        if (!recentTypes.includes(resolvedType) || attempts >= WAVE.length - 1) return template;
      }
      return WAVE.find((entry) => entry.type === 'salmon');
    }

    function rainFishFromTop(entity, difficulty) {
      const drift = 55 + difficulty * 70;
      entity.fallingFish = true;
      entity.x = Math.max(24, Math.min(DESIGN_WIDTH - entity.width - 24, (entity.x || 0) + (Math.random() - 0.5) * 180));
      entity.y = -entity.height - Math.random() * 120;
      entity.vx = (Math.random() - 0.5) * drift;
      entity.vy = Math.abs(entity.vy || 560) + difficulty * 150;
      entity.flip = entity.vx < 0 ? -1 : 1;
      entity.damage = 0;
      entity.collectibleSalmon = true;
      entity.safeCollectible = true;
      return entity;
    }

    function applyVariant(entity, difficulty) {
      const roll = Math.random();
      entity.difficulty = Number(difficulty.toFixed(2));
      entity.variant = entity.variant || 'normal';

      if (entity.type === 'salmon') {
        rainFishFromTop(entity, difficulty);
        if (salmonRunActive()) {
          entity.message = 'Salmon run — catch 20 before the road opens!';
          entity.vy *= 1.08;
          return entity;
        }
        if (entity.variant === 'heavyRain' || entity.variant === 'fastRain' || entity.variant === 'schoolRain') return entity;
        if (roll < 0.18 + difficulty * 0.26) {
          entity.variant = 'schoolRain';
          entity.width = Math.min(entity.width * 1.2, 84);
          entity.height = Math.max(entity.height || 31, 36);
          entity.message = 'Salmon school overhead — catch one!';
          return entity;
        }
        if (roll < 0.42 + difficulty * 0.12) {
          entity.variant = 'heavyRain';
          entity.vy += 100;
          entity.message = 'Heavy salmon drop — catch it fast!';
          return entity;
        }
        if (roll < 0.6 + difficulty * 0.08) {
          entity.variant = 'fastRain';
          entity.vy *= 1.14 + difficulty * 0.18;
          entity.message = 'Fast fish drop — catch it!';
        }
        return entity;
      }

      if ((entity.type === 'bear' || entity.type === 'moose') && roll > 0.9 - difficulty * 0.16) {
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
        entity.vx = -Math.abs(entity.vx || 330) * (1 + difficulty * 0.14);
        entity.message = 'Eagle flying across!';
        return entity;
      }

      if (entity.type === 'chargingMoose') {
        entity.variant = 'charger';
        entity.maxHp = Math.max(entity.maxHp || 1, entity.hp || 4);
        entity.chargeSpeed = 420 + difficulty * 95;
        return entity;
      }

      if (entity.type === 'sister') entity.bubble = pickBubbleLine('sister') || entity.bubble;
      if (roll < 0.1 + difficulty * 0.16) {
        entity.variant = 'fast';
        entity.vx *= 1.08 + difficulty * 0.16;
        entity.message = entity.type === 'sister' ? 'Fast spin move incoming!' : `${entity.type[0].toUpperCase()}${entity.type.slice(1)} speeding in!`;
      }
      return entity;
    }

    function spawnMovingEncounter(state, difficulty, options = {}) {
      const template = pickWaveTemplate();
      if (!template) return;
      const resolved = resolveModeEntity({
        ...template,
        key: `moving-${template.type}-${Date.now()}-${waveIndex}-${salmonRunIndex}`,
        fromMovingGameplayPass: true,
        fromComputerMode: computerMode,
        comboSpawn: Boolean(options.comboSpawn)
      });
      if (!resolved) return;
      const entity = applyVariant(resolved, difficulty);
      rememberType(entity.type);
      state.entities.push(entity);
      state.message = entity.message || template.message;
      if (status) status.textContent = state.message;
      if (!salmonRunActive()) maybeQueueComboSpawn(difficulty);
    }

    function maybeQueueComboSpawn(difficulty) {
      if (comboSpawnQueued || difficulty <= 0.55) return;
      if (Math.random() >= 0.045 + 0.055 * difficulty) return;
      comboSpawnQueued = true;
      window.setTimeout(() => {
        comboSpawnQueued = false;
        const state = getPlayableState();
        if (!state || salmonRunActive()) return;
        const activeLimit = difficulty > 0.82 ? 2 : 1;
        if (activeCrowdEntities(state).length >= activeLimit) return;
        spawnMovingEncounter(state, difficulty * 0.75, { comboSpawn: true });
      }, COMBO_SPAWN_DELAY_MS);
    }

    function runMovingGameplay() {
      const state = getPlayableState();
      if (state) {
        const now = performance.now();
        if (!firstPlayableAt) {
          firstPlayableAt = now;
          nextSpawnAt = now + 500;
        }
        const difficulty = difficultyFor(state, now);
        state.difficulty = difficulty;
        const activeLimit = difficulty > 0.82 ? 2 : 1;
        if (now >= nextSpawnAt && activeCrowdEntities(state).length < activeLimit) {
          spawnMovingEncounter(state, difficulty);
          if (salmonRunActive()) {
            nextSpawnAt = now + SALMON_RUN_SPAWN_MS + Math.random() * SALMON_RUN_JITTER_MS;
          } else {
            const spawnInterval = Math.max(MIN_SPAWN_MS, BASE_SPAWN_MS * (1 - difficulty * 0.35));
            const jitter = Math.random() * SPAWN_JITTER_MS - SPAWN_JITTER_MS / 2;
            nextSpawnAt = now + spawnInterval + jitter;
          }
        }
      }
      window.requestAnimationFrame(runMovingGameplay);
    }

    runMovingGameplay();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();
