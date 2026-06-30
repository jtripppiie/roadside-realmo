(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.14.34';
  const DISPLAY_BUILD = 'Build 2026-06-30.90';

  function api() { return window.RTA_HOCKEY_SMASH; }

  function currentName(state) {
    return api()?.getPlayerConfig?.()?.name || state?.playerName || state?.player?.name || 'Daniel';
  }

  function homeworkLine(state) {
    return `${currentName(state)}, do your homework!`;
  }

  function lockBuildBadge() {
    const badge = document.getElementById('hockey-build-badge');
    const label = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (badge && badge.textContent !== label) badge.textContent = label;
    if (api()?.getVersion) api().getVersion = () => DISPLAY_VERSION;
  }

  function state() {
    const s = api()?.getState?.();
    if (!s || !s.player || ['splash', 'transition', 'tryAgain'].includes(s.mode)) return null;
    if (!Array.isArray(s.entities)) s.entities = [];
    return s;
  }

  function forceDadHomeworkLine(s) {
    const line = homeworkLine(s);
    s.entities.forEach((entity) => {
      if (!entity || entity.dead || entity.type !== 'dad') return;
      entity.bubble = line;
      entity.prettyBubble = line;
      entity.message = `Dad says: ${line}`;
    });

    if (s.dad && !s.dad.dead) {
      s.dad.bubble = line;
      s.dad.prettyBubble = line;
      s.dad.message = `Dad says: ${line}`;
    }

    document.querySelectorAll('.hockey-pretty-bubble').forEach((node) => {
      const text = node.textContent || '';
      if (/packed snacks|slapshot|skate like|watch the moose/i.test(text)) node.textContent = line;
    });
  }

  function loop() {
    lockBuildBadge();
    const s = state();
    if (s) forceDadHomeworkLine(s);
    window.requestAnimationFrame(loop);
  }

  function ready() {
    document.body.dataset.hockeyDadHomework = 'v0.14.34';
    lockBuildBadge();
    window.HOCKEY_BOOT_LOG?.log?.('dad-homework', 'Dad bubble forced to "<name>, do your homework!".');
    window.requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
