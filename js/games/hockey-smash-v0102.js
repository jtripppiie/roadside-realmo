(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.11.7';
  const DISPLAY_BUILD = 'Build 2026-06-29.32';
  const DESIGN_WIDTH = 1024;
  const DESIGN_HEIGHT = 576;
  const GROUND_Y = DESIGN_HEIGHT * 0.82;
  const params = new URLSearchParams(window.location.search);
  const computerMode = params.get('computerMode') === '1';

  // This layer does not control Daniel.
  // It only adds moving gameplay objects to state.entities. The core game loop
  // already moves entities by vx * dt, checks overlap, updates health, and lets
  // the hockey stick clear wildlife objects.
  const WAVE = [
    {
      type: 'salmon',
      x: DESIGN_WIDTH + 120,
      y: 245,
      width: 74,
      height: 42,
      vx: -420,
      vy: -80,
      hp: 1,
      damage: 8,
      flip: -1,
      message: 'Fish flying in — jump or slide!'
    },
    {
      type: 'bear',
      x: DESIGN_WIDTH + 90,
      y: GROUND_Y - 104,
      width: 122,
      height: 104,
      vx: -245,
      hp: 2,
      maxHp: 2,
      damage: 12,
      message: 'Bear moving in — use the stick or jump!'
    },
    {
      type: 'salmon',
      x: -120,
      y: 285,
      width: 72,
      height: 40,
      vx: 410,
      vy: -60,
      hp: 1,
      damage: 8,
      flip: 1,
      message: 'Fish crossing back!'
    },
    {
      type: 'mom',
      x: DESIGN_WIDTH + 40,
      y: GROUND_Y - 88,
      width: 84,
      height: 88,
      vx: -145,
      hp: 2,
      damage: 5,
      bubble: 'Daniel, clean your room!',
      message: 'Mom interruption moving in!'
    },
    {
      type: 'sister',
      x: DESIGN_WIDTH + 70,
      y: GROUND_Y - 94,
      width: 84,
      height: 94,
      vx: -175,
      hp: 2,
      damage: 7,
      bubble: 'Spin move!',
      message: 'Sister spinning in!'
    },
    {
      type: 'moose',
      x: DESIGN_WIDTH + 120,
      y: GROUND_Y - 118,
      width: 146,
      height: 118,
      vx: -195,
      hp: 3,
      maxHp: 3,
      damage: 16,
      message: 'Moose moving in — use the stick or jump!'
    }
  ];

  function onReady() {
    const api = window.RTA_HOCKEY_SMASH;
    const badge = document.getElementById('hockey-build-badge');
    const status = document.getElementById('hockey-status');
    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api?.getVersion) api.getVersion = () => DISPLAY_VERSION;
    if (!api || computerMode) return;

    let nextSpawnAt = 0;
    let waveIndex = 0;
    let firstPlayableAt = 0;

    function getPlayableState() {
      const state = api.getState?.();
      if (!state || !state.player || state.mode === 'splash' || state.mode === 'transition' || state.mode === 'tryAgain') return null;
      if (!Array.isArray(state.entities)) state.entities = [];
      return state;
    }

    function activeMovingGameplayEntities(state) {
      return state.entities.filter((entity) => entity && !entity.dead && entity.fromMovingGameplayPass);
    }

    function spawnMovingEncounter(state) {
      const template = WAVE[waveIndex % WAVE.length];
      waveIndex += 1;
      const entity = {
        ...template,
        key: `moving-${template.type}-${Date.now()}-${waveIndex}`,
        fromMovingGameplayPass: true
      };
      state.entities.push(entity);
      state.message = template.message;
      if (status) status.textContent = template.message;
    }

    function runMovingGameplay() {
      const state = getPlayableState();
      if (state) {
        const now = performance.now();
        if (!firstPlayableAt) {
          firstPlayableAt = now;
          nextSpawnAt = now + 250;
        }
        if (now >= nextSpawnAt && activeMovingGameplayEntities(state).length < 2) {
          spawnMovingEncounter(state);
          nextSpawnAt = now + 1600;
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
