(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.10.2';
  const DISPLAY_BUILD = 'Build 2026-06-29.23';
  const DESIGN_WIDTH = 1024;
  const GROUND_Y = 576 * 0.82;
  const params = new URLSearchParams(window.location.search);
  const computerMode = params.get('computerMode') === '1';

  // This file is a safety layer. It does NOT take over movement.
  // It only restores the visible gameplay pieces that should always appear.
  const STARTER_CAST = [
    { key: 'repair-salmon', type: 'salmon', x: 690, y: 275, width: 72, height: 40, vx: -0.9, hp: 1, message: 'Fish incoming — jump or slide!' },
    { key: 'repair-mom', type: 'mom', x: 570, y: GROUND_Y - 86, width: 82, height: 86, vx: 0, hp: 2, bubble: 'Daniel, clean your room!', message: 'Mom interruption!' },
    { key: 'repair-bear', type: 'bear', x: 805, y: GROUND_Y - 102, width: 120, height: 102, vx: -0.22, hp: 2, message: 'Bear crossing — use the stick!' },
    { key: 'repair-moose', type: 'moose', x: 930, y: GROUND_Y - 118, width: 145, height: 118, vx: -0.18, hp: 3, message: 'Moose on the road — slide or stick!' },
  ];

  function onReady() {
    const api = window.RTA_HOCKEY_SMASH;
    const badge = document.getElementById('hockey-build-badge');
    const status = document.getElementById('hockey-status');
    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api?.getVersion) api.getVersion = () => DISPLAY_VERSION;
    if (!api || computerMode) return;

    const spawned = new Set();
    let firstPlayableAt = 0;

    function getPlayableState() {
      const state = api.getState?.();
      if (!state || !state.player || state.mode === 'splash' || state.mode === 'transition' || state.mode === 'tryAgain') return null;
      if (!Array.isArray(state.entities)) state.entities = [];
      return state;
    }

    function hasEntity(state, key) {
      return state.entities.some((entity) => entity && entity.key === key && !entity.dead);
    }

    function spawn(state, encounter) {
      if (spawned.has(encounter.key) || hasEntity(state, encounter.key)) return;
      spawned.add(encounter.key);
      state.entities.push({
        key: encounter.key,
        type: encounter.type,
        x: encounter.x,
        y: encounter.y,
        width: encounter.width,
        height: encounter.height,
        vx: encounter.vx,
        hp: encounter.hp,
        bubble: encounter.bubble || '',
        fromRepairPass: true,
      });
      state.message = encounter.message;
      if (status) status.textContent = encounter.message;
    }

    function keepRepairCastVisible() {
      const state = getPlayableState();
      if (state) {
        if (!firstPlayableAt) firstPlayableAt = performance.now();
        const elapsed = performance.now() - firstPlayableAt;

        // Stagger the cast so the screen does not become a pile-up instantly.
        if (elapsed > 600) spawn(state, STARTER_CAST[0]);
        if (elapsed > 1900) spawn(state, STARTER_CAST[1]);
        if (elapsed > 3400) spawn(state, STARTER_CAST[2]);
        if (elapsed > 5200) spawn(state, STARTER_CAST[3]);

        // Give the repair-pass characters light drift so they feel alive.
        state.entities.forEach((entity) => {
          if (!entity?.fromRepairPass || entity.dead) return;
          entity.x += entity.vx || 0;
          if (entity.x < -150) entity.dead = true;
        });
      }
      window.requestAnimationFrame(keepRepairCastVisible);
    }

    keepRepairCastVisible();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
