(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.14.12 Arena Mode';
  const BUILD_LABEL = 'Hockey Smash v0.14.12 · Build 2026-06-30.68';
  const DESIGN_WIDTH = 1024;
  const ARENA_MIN_X = 250;
  const ARENA_MAX_X = 630;
  const ARENA_CENTER_X = 440;

  let activeState = null;
  let initializedRun = false;
  let styleNode = null;
  let lastMessageAt = 0;

  function api() {
    return window.RTA_HOCKEY_SMASH;
  }

  function state() {
    const current = api()?.getState?.();
    if (!current || !current.player || ['splash', 'transition'].includes(current.mode)) return null;
    return current;
  }

  function isPlayable(current) {
    return current && !['splash', 'transition', 'tryAgain'].includes(current.mode);
  }

  function ensureStyles() {
    if (styleNode?.isConnected) return;
    styleNode = document.createElement('style');
    styleNode.textContent = `
      body[data-hockey-arena-mode="true"] .hockey-hud__title span::after {
        content: ' · one arena';
      }
      .hockey-arena-rail {
        position: fixed;
        top: 0;
        width: 4px;
        height: 0;
        z-index: 6;
        pointer-events: none;
        border-radius: 999px;
        background: rgba(255,242,122,.5);
        box-shadow: 0 0 16px rgba(255,242,122,.55);
        opacity: .45;
      }
    `;
    document.head.appendChild(styleNode);
  }

  function syncBuildBadge() {
    const badge = document.getElementById('hockey-build-badge');
    if (badge && badge.textContent !== BUILD_LABEL) badge.textContent = BUILD_LABEL;
    if (api()?.getVersion) api().getVersion = () => DISPLAY_VERSION;
  }

  function syncCopy() {
    const splashCopy = document.querySelector('.hockey-splash__copy');
    if (splashCopy) splashCopy.textContent = 'Hold your ground in one arena: collect salmon, dodge hazards, and clear obstacles.';

    const modeNote = document.querySelector('.hockey-mode-note');
    if (modeNote) modeNote.textContent = 'No side-scrolling: survive the single-screen arena.';

    const hudSubtitle = document.querySelector('.hockey-hud__title span');
    if (hudSubtitle && !hudSubtitle.dataset.arenaText) {
      hudSubtitle.textContent = 'Single-screen arena';
      hudSubtitle.dataset.arenaText = 'true';
    }

    const left = document.querySelector('[data-action="left"]');
    if (left) left.setAttribute('aria-label', 'Dodge left');
    const right = document.querySelector('[data-action="right"]');
    if (right) right.setAttribute('aria-label', 'Dodge right');
  }

  function resetForRun(current) {
    activeState = current;
    initializedRun = false;
    lastMessageAt = 0;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function enforceArena(current) {
    if (!isPlayable(current)) return;
    const player = current.player;

    if (!initializedRun) {
      player.x = ARENA_CENTER_X;
      player.facing = 1;
      initializedRun = true;
      current.arenaMode = true;
      current.message = 'Arena mode: dodge, collect, and shoot. No running to the next screen.';
      lastMessageAt = performance.now();
    }

    const oldX = player.x;
    player.x = clamp(player.x, ARENA_MIN_X, ARENA_MAX_X);
    if (player.x !== oldX && Math.sign(player.vx || 0) === Math.sign(oldX - player.x)) player.vx = 0;
    current.arenaMode = true;
  }

  function syncArenaRails() {
    const canvas = document.getElementById('hockey-canvas');
    const rect = canvas?.getBoundingClientRect?.();
    if (!rect?.width || !rect?.height) return;
    const scaleX = rect.width / DESIGN_WIDTH;
    const railTop = rect.top + rect.height * 0.18;
    const railHeight = rect.height * 0.62;

    [['left', ARENA_MIN_X], ['right', ARENA_MAX_X + 144]].forEach(([side, worldX]) => {
      let rail = document.querySelector(`.hockey-arena-rail[data-side="${side}"]`);
      if (!rail) {
        rail = document.createElement('div');
        rail.className = 'hockey-arena-rail';
        rail.dataset.side = side;
        document.body.appendChild(rail);
      }
      rail.style.left = `${rect.left + worldX * scaleX}px`;
      rail.style.top = `${railTop}px`;
      rail.style.height = `${railHeight}px`;
      rail.hidden = false;
    });
  }

  function hideArenaRails() {
    document.querySelectorAll('.hockey-arena-rail').forEach((rail) => { rail.hidden = true; });
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return mins ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`;
  }

  function rewriteScoreHud(current) {
    const scoreEl = document.getElementById('hockey-score');
    if (!scoreEl || !current?.player) return;
    const timeText = `Time ${formatTime(current.time)}`;
    if (/^Distance \d+m/.test(scoreEl.textContent || '')) {
      scoreEl.textContent = scoreEl.textContent.replace(/^Distance \d+m/, timeText);
    } else if (!/^Time /.test(scoreEl.textContent || '')) {
      scoreEl.textContent = `${timeText} | ${scoreEl.textContent || 'Score 0 | Salmon: 0'}`;
    }
  }

  function rewriteSummary() {
    const summary = document.getElementById('hockey-run-summary');
    const current = api()?.getState?.();
    if (!summary || current?.mode !== 'tryAgain') return;
    summary.innerHTML = summary.innerHTML.replace(/<span>Distance: .*?<\/span>/, `<span>Time Survived: ${formatTime(current.time)}</span>`);
  }

  function maybeKeepArenaMessage(current) {
    if (!isPlayable(current) || !lastMessageAt) return;
    const status = document.getElementById('hockey-status');
    if (!status) return;
    if (performance.now() - lastMessageAt < 2200 && /Arena mode/.test(current.message || '')) {
      status.textContent = current.message;
    }
  }

  function loop() {
    ensureStyles();
    syncBuildBadge();
    syncCopy();
    document.body.dataset.hockeyArenaMode = 'true';

    const current = state();
    if (current && current !== activeState) resetForRun(current);

    if (isPlayable(current)) {
      enforceArena(current);
      syncArenaRails();
      rewriteScoreHud(current);
      maybeKeepArenaMessage(current);
    } else {
      hideArenaRails();
      rewriteSummary();
    }

    window.requestAnimationFrame(loop);
  }

  window.requestAnimationFrame(loop);
})();
