(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.12.5';
  const DISPLAY_BUILD = 'Build 2026-06-29.40';

  function onReady() {
    const api = window.RTA_HOCKEY_SMASH;
    const badge = document.getElementById('hockey-build-badge');
    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api?.getVersion) api.getVersion = () => DISPLAY_VERSION;
    document.body.dataset.hockeyDebugOverlay = 'v0.12.5';
    window.HOCKEY_BOOT_LOG?.log?.('v0108', 'Final debug-overlay release marker loaded.');
    window.HOCKEY_BOOT_LOG?.snapshot?.('v0108-ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();
