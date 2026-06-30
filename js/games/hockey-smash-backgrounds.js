(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.14.28';
  const DISPLAY_BUILD = 'Build 2026-06-30.84';
  const FIRST_BACKGROUND = 'assets/hockey-smash/backgrounds/soldotna_cityscape_background_01_1280x720.webp';
  const FIRST_BACKGROUND_CACHE = `${FIRST_BACKGROUND}?v=20260630.84`;
  const LOCKED_BACKGROUND_KEYS = ['background01', 'background02', 'background03', 'background04', 'background05'];
  const params = new URLSearchParams(window.location.search);
  const computerMode = params.get('computerMode') === '1';

  const firstBackgroundImage = new Image();
  firstBackgroundImage.decoding = 'async';
  firstBackgroundImage.src = FIRST_BACKGROUND_CACHE;

  function lockEngineBackgroundAssets(api) {
    if (!api?.assets) return;
    LOCKED_BACKGROUND_KEYS.forEach((key) => {
      api.assets[key] = FIRST_BACKGROUND_CACHE;
    });
  }

  function removeLegacyStageBackground() {
    document.body.classList.remove('hockey-stage-background-active');
    document.querySelectorAll('.hockey-stage-background').forEach((node) => node.remove());
  }

  function onReady() {
    const api = window.RTA_HOCKEY_SMASH;
    const badge = document.getElementById('hockey-build-badge');
    const playerOverlay = document.getElementById('hockey-player-overlay');

    lockEngineBackgroundAssets(api);
    removeLegacyStageBackground();

    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api?.getVersion) api.getVersion = () => DISPLAY_VERSION;

    if (computerMode && playerOverlay) {
      playerOverlay.hidden = true;
      playerOverlay.style.display = 'none';
      document.body.classList.add('hockey-canvas-player-only');
    }

    function keepSingleBackground() {
      lockEngineBackgroundAssets(api);
      removeLegacyStageBackground();
      document.body.dataset.hockeySingleBackgroundReady = firstBackgroundImage.complete && firstBackgroundImage.naturalWidth ? 'true' : 'loading';
      window.requestAnimationFrame(keepSingleBackground);
    }

    keepSingleBackground();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
