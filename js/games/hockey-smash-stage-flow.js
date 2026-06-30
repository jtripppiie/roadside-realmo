(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.14.2';
  const DISPLAY_BUILD = 'Build 2026-06-29.58';
  const FISH_TARGET = 5;
  const FISH_MAX_SECONDS = 28;
  const FISH_TYPES = new Set(['salmon']);
  const WILDLIFE_TYPES = new Set(['bear', 'moose', 'chargingMoose', 'bird']);
  const PEOPLE_TYPES = new Set(['teacher', 'danceInstructor', 'sister', 'adultCoach', 'dad']);
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

  function phaseInfo(s) {
    let info = phaseByState.get(s);
    if (!info) {
      info = { phase: 'fish', startedAt: performance.now(), fishDodges: 0, announcedWildlife: false };
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
        if (info.phase === 'fish') info.fishDodges += 1;
      }
      return originalDodge(payload);
    };
  }

  function fishPhaseComplete(s, info) {
    const elapsed = (performance.now() - info.startedAt) / 1000;
    return info.fishDodges >= FISH_TARGET || elapsed >= FISH_MAX_SECONDS;
  }

  function holdOldTimeline(s) {
    // Prevent the older salmon-run/boss timeline from jumping ahead during the new staged intro.
    if (s.mode === 'bossIntro' || s.mode === 'bossFight') s.mode = 'playing';
    s.salmonRunStarted = false;
    s.salmonRunTimer = 0;
    s.bossIntroTimer = 0;
    s.dad = null;
  }

  function removeEntitiesForPhase(s, info) {
    if (info.phase === 'fish') {
      s.entities = s.entities.filter((entity) => {
        if (!entity || entity.dead) return false;
        return FISH_TYPES.has(entity.type);
      });
      if (s.spawn) {
        s.spawn.wildlife = Math.max(s.spawn.wildlife || 0, 3.5);
        s.spawn.family = Math.max(s.spawn.family || 0, 12);
        s.spawn.dadJoke = Math.max(s.spawn.dadJoke || 0, 9);
        s.spawn.salmon = Math.min(Math.max(s.spawn.salmon || 0.55, 0.35), 1.0);
      }
      return;
    }

    // Wildlife stage: keep wildlife, fish, and the family/cast encounters in the arena.
    s.entities = s.entities.filter((entity) => {
      if (!entity || entity.dead) return false;
      if (BOSS_TYPES.has(entity.type)) return false;
      return WILDLIFE_TYPES.has(entity.type) || FISH_TYPES.has(entity.type) || PEOPLE_TYPES.has(entity.type);
    });
    if (s.spawn) {
      s.spawn.family = Math.min(Math.max(s.spawn.family || 2.5, 1.8), 4.5);
      s.spawn.dadJoke = Math.max(s.spawn.dadJoke || 0, 12);
      s.spawn.wildlife = Math.min(Math.max(s.spawn.wildlife || 0.85, 0.65), 1.6);
      s.spawn.salmon = Math.max(s.spawn.salmon || 0, 1.8);
    }
  }

  function updateFishPhaseMessage(s, info) {
    const elapsed = (performance.now() - info.startedAt) / 1000;
    const remaining = Math.max(0, Math.ceil(FISH_MAX_SECONDS - elapsed));
    const text = `Fish Dodge Level: ${Math.min(info.fishDodges, FISH_TARGET)}/${FISH_TARGET} dodges · ${remaining}s`;
    s.message = text;
    status(text);
  }

  function enterWildlifePhase(s, info) {
    info.phase = 'wildlife';
    info.announcedWildlife = true;
    s.entities = s.entities.filter((entity) => entity?.type === 'salmon' && !entity.dead);
    if (s.spawn) {
      s.spawn.wildlife = 0.8;
      s.spawn.salmon = 2.2;
      s.spawn.family = 2.4;
      s.spawn.dadJoke = 12;
    }
    s.message = 'Level 2: Moose and bears incoming!';
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

    if (info.phase === 'fish') {
      removeEntitiesForPhase(s, info);
      updateFishPhaseMessage(s, info);
      if (fishPhaseComplete(s, info)) enterWildlifePhase(s, info);
      return;
    }

    removeEntitiesForPhase(s, info);
    if (!info.lastWildlifeStatusAt || performance.now() - info.lastWildlifeStatusAt > 3500) {
      info.lastWildlifeStatusAt = performance.now();
      s.message = 'Level 2: Clear the moose and bears!';
      status(s.message);
    }
  }

  function loop() {
    runStageRules();
    window.requestAnimationFrame(loop);
  }

  function ready() {
    const badge = document.getElementById('hockey-build-badge');
    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api()?.getVersion) api().getVersion = () => DISPLAY_VERSION;
    document.body.dataset.hockeyButtonDebug = 'v0.14.2';
    window.HOCKEY_BOOT_LOG?.log?.('stage-flow', 'Staged run loaded: fish dodge level first, then moose/bear level; people/cast suppressed as hazards.');
    window.requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
