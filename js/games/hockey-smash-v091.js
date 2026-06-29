(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.11.7';
  const DISPLAY_BUILD = 'Build 2026-06-29.32';
  const DESIGN_WIDTH = 1024;
  const RIGHT_EDGE = 810;
  const LEFT_ENTRY = 108;
  const LEFT_EDGE = 42;
  const RETURN_EDGE = 170;
  const STAGE_SECONDS = [0.5, 10.5, 20.5, 27.5, 34.5];
  const STAGE_BACKGROUNDS = [
    'assets/hockey-smash/backgrounds/soldotna_cityscape_background_01_1280x720.webp',
    'assets/hockey-smash/backgrounds/soldotna_cityscape_background_02_1280x720.webp',
    'assets/hockey-smash/backgrounds/soldotna_cityscape_background_03_1280x720.webp',
    'assets/hockey-smash/backgrounds/soldotna_cityscape_background_04_1280x720.webp',
    'assets/hockey-smash/backgrounds/soldotna_cityscape_background_05_1280x720.webp',
  ];
  const params = new URLSearchParams(window.location.search);
  const computerMode = params.get('computerMode') === '1';
  const preloadedBackgrounds = STAGE_BACKGROUNDS.map((src, index) => {
    const image = new Image();
    image.decoding = 'async';
    if (index === 0) image.src = src;
    return image;
  });

  function onReady() {
    const api = window.RTA_HOCKEY_SMASH;
    const badge = document.getElementById('hockey-build-badge');
    const playerOverlay = document.getElementById('hockey-player-overlay');
    const status = document.getElementById('hockey-status');
    const game = document.getElementById('hockey-game');
    const canvas = document.getElementById('hockey-canvas');

    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api?.getVersion) api.getVersion = () => DISPLAY_VERSION;
    if (!api) return;

    if (computerMode && playerOverlay) {
      playerOverlay.hidden = true;
      playerOverlay.style.display = 'none';
      document.body.classList.add('hockey-canvas-player-only');
    }

    const stageBackground = document.createElement('div');
    stageBackground.className = 'hockey-stage-background';
    stageBackground.setAttribute('aria-hidden', 'true');
    if (game && canvas && !computerMode) {
      game.insertBefore(stageBackground, canvas.nextSibling);
      document.body.classList.add('hockey-stage-background-active');
    }

    let stage = 0;
    let lastStageTime = 0;
    let renderedStage = 0;

    function getState() {
      const state = api.getState?.();
      if (!state || !state.player || state.mode === 'splash' || state.mode === 'transition' || state.mode === 'tryAgain') return null;
      return state;
    }

    function syncStageBackground() {
      if (!stageBackground || !canvas || computerMode) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const image = preloadedBackgrounds[stage];
      if (image && !image.src) image.src = STAGE_BACKGROUNDS[stage];
      if (image?.complete && image.naturalWidth) renderedStage = stage;
      stageBackground.style.left = `${rect.left}px`;
      stageBackground.style.top = `${rect.top}px`;
      stageBackground.style.width = `${rect.width}px`;
      stageBackground.style.height = `${rect.height}px`;
      stageBackground.style.backgroundImage = `url("${STAGE_BACKGROUNDS[renderedStage]}")`;
      stageBackground.dataset.stage = String(renderedStage + 1);
      stageBackground.dataset.targetStage = String(stage + 1);
      stageBackground.dataset.ready = renderedStage === stage ? 'true' : 'loading';
    }

    function setStage(state, nextStage, direction) {
      const now = performance.now();
      if (now - lastStageTime < 550) return;
      lastStageTime = now;
      stage = Math.max(0, Math.min(STAGE_SECONDS.length - 1, nextStage));
      state.travelStage = stage;
      state.time = STAGE_SECONDS[stage];
      state.salmonRunStarted = stage >= 2;
      if (stage >= 3 && state.mode !== 'bossFight') state.mode = 'bossIntro';
      if (stage < 3 && state.mode === 'bossIntro') state.mode = 'playing';
      syncStageBackground();
      state.player.x = direction === 'back' ? RIGHT_EDGE - 80 : LEFT_ENTRY;
      state.player.vx = 0;
      state.player.facing = direction === 'back' ? -1 : 1;
      state.message = `Road section ${stage + 1} of ${STAGE_SECONDS.length}. Keep moving!`;
      if (status) status.textContent = state.message;
    }

    function keepProgressing() {
      const state = getState();
      if (state) {
        if (typeof state.travelStage === 'number') stage = state.travelStage;
        const player = state.player;
        if (player.x >= RIGHT_EDGE && stage < STAGE_SECONDS.length - 1) setStage(state, stage + 1, 'forward');
        if (player.x <= LEFT_EDGE && stage > 0) setStage(state, stage - 1, 'back');
        if (player.x > DESIGN_WIDTH - player.width - 28 && stage >= STAGE_SECONDS.length - 1) {
          syncStageBackground();
          player.x = RETURN_EDGE;
          player.vx = 0;
          state.message = 'Daniel loops the road and keeps skating.';
          if (status) status.textContent = state.message;
        }
      }
      syncStageBackground();
      window.requestAnimationFrame(keepProgressing);
    }

    keepProgressing();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
