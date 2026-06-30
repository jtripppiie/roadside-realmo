(function () {
  const VERSION = 'Hockey Smash v0.14.42';
  const BUILD = 'Build 2026-06-30.98';
  const LABEL = `${VERSION} · ${BUILD}`;

  function writeVersion() {
    window.HOCKEY_SMASH_VERSION = VERSION;
    window.HOCKEY_SMASH_BUILD = BUILD;
    window.HOCKEY_SMASH_BUILD_LABEL = LABEL;

    const api = window.RTA_HOCKEY_SMASH;
    if (api) api.getVersion = () => VERSION;

    const badge = document.getElementById('hockey-build-badge');
    if (badge && badge.textContent !== LABEL) badge.textContent = LABEL;
  }

  function ready() {
    writeVersion();
    window.HOCKEY_BOOT_LOG?.log?.('version', `${LABEL} loaded from the single version source.`);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
