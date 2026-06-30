(function () {
  const VERSION = 'Hockey Smash v0.14.46';
  const BUILD = 'Build 2026-06-30.102';
  const LABEL = `${VERSION} · ${BUILD}`;
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

  function ready() {
    writeVersion();
    watchBadge();
    window.setInterval(writeVersion, 500);
    window.HOCKEY_BOOT_LOG?.log?.('version', `${LABEL} loaded from the single version source.`);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
