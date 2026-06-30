(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.14.0';
  const DISPLAY_BUILD = 'Build 2026-06-29.56';
  const BIG_TYPES = new Set(['bear', 'moose', 'chargingMoose']);
  const PERSON_TYPES = new Set(['teacher', 'danceInstructor', 'sister', 'adultCoach', 'dad']);
  const TUNING = {
    introSeconds: 20,
    fullRampSeconds: 115,
    bigStart: 0.58,
    bigEnd: 1.08,
    personStart: 0.62,
    personEnd: 1.12,
    chargeStart: 0.5,
    chargeEnd: 1.02,
    salmonStart: 0.82,
    salmonEnd: 1.12,
  };

  function api() {
    return window.RTA_HOCKEY_SMASH;
  }

  function getState() {
    const state = api()?.getState?.();
    if (!state || !state.player || ['splash', 'transition', 'tryAgain'].includes(state.mode)) return null;
    return state;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function difficultyFor(state) {
    const byClock = clamp(((state.time || 0) - TUNING.introSeconds) / TUNING.fullRampSeconds, 0, 1);
    const byScoreLayer = clamp(Number(state.difficulty) || 0, 0, 1);
    return Math.max(byClock, byScoreLayer * 0.85);
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function baseSpeedFor(entity) {
    if (entity.type === 'bear') return 205;
    if (entity.type === 'moose') return 165;
    if (entity.type === 'chargingMoose') return entity.charging ? 390 : 210;
    if (entity.type === 'danceInstructor') return 118;
    if (entity.type === 'teacher' || entity.type === 'adultCoach') return 108;
    if (entity.type === 'dad') return 104;
    if (entity.type === 'sister') return 132;
    if (entity.type === 'salmon') return Math.abs(entity.vy || 260);
    return Math.abs(entity.vx || 120);
  }

  function signFor(entity, fallback = -1) {
    if (entity.type === 'danceInstructor' || entity.type === 'teacher' || entity.type === 'adultCoach' || entity.type === 'sister' || entity.type === 'dad') {
      const state = getState();
      const player = state?.player;
      if (player) return player.x + player.width / 2 >= entity.x + entity.width / 2 ? 1 : -1;
    }
    if (entity.vx > 0) return 1;
    if (entity.vx < 0) return -1;
    return fallback;
  }

  function tuneBigAnimal(entity, difficulty) {
    const isCharging = entity.type === 'chargingMoose' && entity.charging;
    const start = isCharging ? TUNING.chargeStart : TUNING.bigStart;
    const end = isCharging ? TUNING.chargeEnd : TUNING.bigEnd;
    const target = baseSpeedFor(entity) * lerp(start, end, difficulty);
    entity.vx = -target;
    if (entity.type === 'chargingMoose') {
      entity.chargeSpeed = 390 * lerp(TUNING.chargeStart, TUNING.chargeEnd, difficulty);
    }
  }

  function tunePerson(entity, difficulty) {
    const target = baseSpeedFor(entity) * lerp(TUNING.personStart, TUNING.personEnd, difficulty);
    entity.vx = signFor(entity) * target;
  }

  function tuneFish(entity, difficulty) {
    if (!entity.fallingFish) return;
    const base = baseSpeedFor(entity);
    entity.vy = base * lerp(TUNING.salmonStart, TUNING.salmonEnd, difficulty);
  }

  function applyProgression() {
    const state = getState();
    if (!state || !Array.isArray(state.entities)) return;
    const difficulty = difficultyFor(state);
    state.entities.forEach((entity) => {
      if (!entity || entity.dead) return;
      if (BIG_TYPES.has(entity.type)) tuneBigAnimal(entity, difficulty);
      else if (PERSON_TYPES.has(entity.type)) tunePerson(entity, difficulty);
      else if (entity.type === 'salmon') tuneFish(entity, difficulty);
      entity._progressiveDifficulty = Number(difficulty.toFixed(2));
    });
  }

  function loop() {
    applyProgression();
    window.requestAnimationFrame(loop);
  }

  function ready() {
    const badge = document.getElementById('hockey-build-badge');
    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api()?.getVersion) api().getVersion = () => DISPLAY_VERSION;
    document.body.dataset.hockeyButtonDebug = 'v0.14.0';
    window.HOCKEY_BOOT_LOG?.log?.('pacing', 'Progressive pacing loaded: slower early bears/moose/people, harder late run.');
    window.requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
