(function () {
  const FISH_TARGET = 5;
  const FISH_MAX_SECONDS = 28;
  const FISH_TYPES = new Set(['salmon']);
  const WILDLIFE_TYPES = new Set(['bear', 'moose', 'chargingMoose', 'bird']);
  const PEOPLE_TYPES = new Set(['teacher', 'danceInstructor', 'sister', 'adultCoach', 'dad', 'mom', 'daniel']);
  const BOSS_TYPES = new Set(['dadJoke']);
  const phaseByState = new WeakMap();
  let wrappedScoreHooks = false;

  function api() { return window.RTA_HOCKEY_SMASH; }
  function getState() {
    const s = api()?.getState?.();
    if (!s || !s.player || ['splash', 'transition', 'tryAgain'].includes(s.mode)) return null;
    if (!Array.isArray(s.entities)) s.entities = [];
    if (!Array.isArray(s.effects)) s.effects = [];
    return s;
  }
  function status(text) {
    const el = document.getElementById('hockey-status');
    if (el && text) el.textContent = text;
  }
  function effect(s, x, y, text, life = 0.5) {
    s.effects?.push?.({ x, y, text, life });
  }
  function isStationaryMom(entity) {
    return entity && !entity.dead && entity.type === 'mom' && entity.stationarySupport;
  }
  function isAllowedEncounter(entity) {
    if (!entity || entity.dead) return false;
    if (BOSS_TYPES.has(entity.type)) return false;
    return WILDLIFE_TYPES.has(entity.type) || FISH_TYPES.has(entity.type) || PEOPLE_TYPES.has(entity.type) || isStationaryMom(entity);
  }

  function phaseInfo(s) {
    let info = phaseByState.get(s);
    if (!info) {
      info = { phase: 'mixed', startedAt: performance.now(), fishDodges: 0, announcedWildlife: false };
      phaseByState.set(s, info);
    }
    return info;
  }

  function wrapScoreHooks() {
    const score = window.RTA_HOCKEY_SMASH_SCORE;
    if (wrappedScoreHooks || !score?.recordDodge) return;
    wrappedScoreHooks = true;
    const originalDodge = score.recordDodge.bind(score);
    score.recordDodge = function wrappedRecordDodge(payload = {}) {
      const s = payload.state || getState();
      if (s && payload.entity?.type === 'salmon') {
        const info = phaseInfo(s);
        info.fishDodges += 1;
      }
      return originalDodge(payload);
    };
  }

  function mixedPhaseComplete(s, info) {
    const elapsed = (performance.now() - info.startedAt) / 1000;
    return info.fishDodges >= FISH_TARGET || elapsed >= FISH_MAX_SECONDS;
  }

  function holdOldTimeline(s) {
    if (s.mode === 'bossIntro' || s.mode === 'bossFight') s.mode = 'playing';
    s.salmonRunStarted = false;
    s.salmonRunTimer = 0;
    s.bossIntroTimer = 0;
    s.dad = null;
  }

  function keepAllowedEncounters(s) {
    s.entities = s.entities.filter(isAllowedEncounter);
    if (s.spawn) {
      s.spawn.family = Math.min(Math.max(s.spawn.family || 2.2, 1.6), 4.5);
      s.spawn.dadJoke = Math.max(s.spawn.dadJoke || 0, 12);
      s.spawn.wildlife = Math.min(Math.max(s.spawn.wildlife || 0.8, 0.6), 1.6);
      s.spawn.salmon = Math.min(Math.max(s.spawn.salmon || 0.7, 0.45), 1.8);
    }
  }

  function updateMixedPhaseMessage(s, info) {
    const elapsed = (performance.now() - info.startedAt) / 1000;
    const remaining = Math.max(0, Math.ceil(FISH_MAX_SECONDS - elapsed));
    const text = `Survive: salmon, moose, bears, and family incoming · ${remaining}s`;
    s.message = text;
    status(text);
  }

  function enterWildlifePhase(s, info) {
    info.phase = 'wildlife';
    info.announcedWildlife = true;
    keepAllowedEncounters(s);
    if (s.spawn) {
      s.spawn.wildlife = 0.8;
      s.spawn.salmon = 1.8;
      s.spawn.family = 2.2;
      s.spawn.dadJoke = 12;
    }
    s.message = 'Level 2: Moose, bears, and family are active!';
    effect(s, s.player.x + s.player.width / 2, s.player.y - 26, 'LEVEL 2!', 0.85);
    status(s.message);
  }

  function runStageRules() {
    wrapScoreHooks();
    const s = getState();
    if (!s) return;
    const info = phaseInfo(s);
    holdOldTimeline(s);
    document.body.dataset.hockeyStagePhase = info.phase;

    keepAllowedEncounters(s);
    if (info.phase === 'mixed') {
      updateMixedPhaseMessage(s, info);
      if (mixedPhaseComplete(s, info)) enterWildlifePhase(s, info);
      return;
    }

    if (!info.lastWildlifeStatusAt || performance.now() - info.lastWildlifeStatusAt > 3500) {
      info.lastWildlifeStatusAt = performance.now();
      s.message = 'Clear the moose, bears, and family challenges!';
      status(s.message);
    }
  }

  function loop() {
    runStageRules();
    window.requestAnimationFrame(loop);
  }

  function ready() {
    document.body.dataset.hockeyStageFlow = 'v0.14.45';
    window.HOCKEY_BOOT_LOG?.log?.('stage-flow', 'Stage flow no longer deletes wildlife/cast during the opening phase.');
    window.requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
