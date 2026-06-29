(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.12.2';
  const DISPLAY_BUILD = 'Build 2026-06-29.37';

  function onReady() {
    const api = window.RTA_HOCKEY_SMASH;
    const badge = document.getElementById('hockey-build-badge');
    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api?.getVersion) api.getVersion = () => DISPLAY_VERSION;
    document.body.dataset.hockeyTouchControls = 'v0.12.2';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();
