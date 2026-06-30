(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.14.15 Single Background';
  const DISPLAY_BUILD = 'Build 2026-06-30.71';
  const DESIGN_WIDTH = 1024;
  const FIRST_BACKGROUND = 'assets/hockey-smash/backgrounds/soldotna_cityscape_background_01_1280x720.webp';
  const params = new URLSearchParams(window.location.search);
  const computerMode = params.get('computerMode') === '1';

  const firstBackgroundImage = new Image();
  firstBackgroundImage.decoding = 'async';
  firstBackgroundImage.src = FIRST_BACKGROUND;

  function onReady() {
    const api = window.RTA_HOCKEY_SMASH;
    const badge = document.getElementById('hockey-build-badge');
    const playerOverlay = document.getElementById('hockey-player-overlay');
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

    function getState() {
      const state = api.getState?.();
      if (!state || !state.player || state.mode === 'splash' || state.mode === 'transition' || state.mode === 'tryAgain') return null;
      return state;
    }

    function syncSingleBackground() {
      if (!stageBackground || !canvas || computerMode) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      stageBackground.style.left = `${rect.left}px`;
      stageBackground.style.top = `${rect.top}px`;
      stageBackground.style.width = `${rect.width}px`;
      stageBackground.style.height = `${rect.height}px`;
      stageBackground.style.backgroundImage = `url("${FIRST_BACKGROUND}")`;
      stageBackground.dataset.stage = '1';
      stageBackground.dataset.targetStage = '1';
      stageBackground.dataset.ready = firstBackgroundImage.complete && firstBackgroundImage.naturalWidth ? 'true' : 'loading';
    }

    function keepSingleScreen() {
      const state = getState();
      if (state) {
        // Single-screen arena rule: never change road/background sections.
        state.travelStage = 0;
        state.backgroundStage = 0;
        state.currentBackground = FIRST_BACKGROUND;
        state.salmonRunStarted = true;
        if (state.mode === 'bossIntro') state.mode = 'playing';
      }

      syncSingleBackground();
      window.requestAnimationFrame(keepSingleScreen);
    }

    keepSingleScreen();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
