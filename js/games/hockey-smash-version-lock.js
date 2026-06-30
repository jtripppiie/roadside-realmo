(function () {
  const VERSION = 'Hockey Smash v0.14.49';
  const BUILD = 'Build 2026-06-30.105';
  const LABEL = `${VERSION} · ${BUILD}`;
  const DESIGN_WIDTH = 1024;
  const DESIGN_HEIGHT = 576;
  const SOFIE_SPRITE = 'assets/hockey-smash/sprites/dancer-player.webp';
  const SOFIE_SLIDE_SPRITE = 'assets/hockey-smash/sprites/sister-spinning.webp';
  let observerStarted = false;

  function writeVersion() {
    window.HOCKEY_SMASH_VERSION = VERSION;
    window.HOCKEY_SMASH_BUILD = BUILD;
    window.HOCKEY_SMASH_BUILD_LABEL = LABEL;

    const api = window.RTA_HOCKEY_SMASH;
    if (api) api.getVersion = () => VERSION;

    const badge = document.getElementById('hockey-build-badge');
    if (badge && badge.textContent !== LABEL) badge.textContent = LABEL;
  }

  function watchBadge() {
    if (observerStarted) return;
    const badge = document.getElementById('hockey-build-badge');
    if (!badge || !window.MutationObserver) return;
    observerStarted = true;
    const observer = new MutationObserver(() => writeVersion());
    observer.observe(badge, { childList: true, characterData: true, subtree: true });
  }

  function api() {
    return window.RTA_HOCKEY_SMASH;
  }

  function selectedCharacter() {
    return api()?.getPlayerConfig?.()?.character || document.body.dataset.hockeyCharacter || 'daniel';
  }

  function hideSofieOverlay() {
    const overlay = document.getElementById('hockey-player-overlay');
    if (!overlay) return;
    overlay.hidden = true;
    overlay.style.display = 'none';
  }

  function syncSofieOverlay() {
    const gameApi = api();
    const state = gameApi?.getState?.();
    const player = state?.player;
    const canvas = document.getElementById('hockey-canvas');
    const overlay = document.getElementById('hockey-player-overlay');
    const image = overlay?.querySelector?.('.hockey-player-overlay__sprite');
    const rect = canvas?.getBoundingClientRect?.();

    if (!overlay || !image || selectedCharacter() !== 'sofie' || !state || !player || ['splash', 'transition', 'tryAgain'].includes(state.mode) || !rect?.width || !rect?.height) {
      hideSofieOverlay();
      return;
    }

    const sliding = Boolean(player.ducking || player.isDucking || document.body.classList.contains('hockey-slide-active'));
    const nextSrc = sliding ? SOFIE_SLIDE_SPRITE : SOFIE_SPRITE;
    if (!image.src.endsWith(nextSrc)) image.src = nextSrc;

    const sx = rect.width / DESIGN_WIDTH;
    const sy = rect.height / DESIGN_HEIGHT;
    overlay.hidden = false;
    overlay.style.display = 'block';
    overlay.style.position = 'fixed';
    overlay.style.left = `${rect.left + player.x * sx}px`;
    overlay.style.top = `${rect.top + player.y * sy}px`;
    overlay.style.width = `${player.width * sx}px`;
    overlay.style.height = `${player.height * sy}px`;
    overlay.style.zIndex = '9999';
    overlay.style.pointerEvents = 'none';
    overlay.style.background = 'transparent';
    overlay.style.border = '0';
    overlay.style.boxShadow = 'none';

    image.style.display = 'block';
    image.style.width = '100%';
    image.style.height = '100%';
    image.style.objectFit = 'contain';

    const label = overlay.querySelector('.hockey-player-overlay__label');
    if (label) label.style.display = 'none';
  }

  function loop() {
    writeVersion();
    syncSofieOverlay();
    window.requestAnimationFrame(loop);
  }

  function ready() {
    writeVersion();
    watchBadge();
    window.HOCKEY_BOOT_LOG?.log?.('version', `${LABEL} loaded from the single version source. Sofie gameplay sprite restore is active.`);
    window.requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
