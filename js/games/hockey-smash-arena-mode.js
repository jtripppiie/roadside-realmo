(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.14.15 Arena Mode';
  const BUILD_LABEL = 'Hockey Smash v0.14.15 · Build 2026-06-30.71';
  const DESIGN_WIDTH = 1024;
  const ARENA_EDGE_PADDING = 22;
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
        content: ' · full screen';
      }
      .hockey-arena-rail {
        display: none !important;
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
    if (splashCopy) splashCopy.textContent = 'Use the whole single-screen arena: collect salmon, dodge hazards, and clear obstacles.';

    const modeNote = document.querySelector('.hockey-mode-note');
    if (modeNote) modeNote.textContent = 'No side-scrolling: use the full screen and survive the arena.';

    const hudSubtitle = document.querySelector('.hockey-hud__title span');
    if (hudSubtitle && !hudSubtitle.dataset.arenaText) {
      hudSubtitle.textContent = 'Full-screen arena';
      hudSubtitle.dataset.arenaText = 'true';
    }

    const left = document.querySelector('[data-action="left"]');
    if (left) left.setAttribute('aria-label', 'Move left');
    const right = document.querySelector('[data-action="right"]');
    if (right) right.setAttribute('aria-label', 'Move right');
  }

  function resetForRun(current) {
    activeState = current;
    initializedRun = false;
    lastMessageAt = 0;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function movementBounds(player) {
    return {
      min: ARENA_EDGE_PADDING,
      max: DESIGN_WIDTH - (player?.width || 0) - ARENA_EDGE_PADDING,
    };
  }

  function enforceArena(current) {
    if (!isPlayable(current)) return;
    const player = current.player;
    const bounds = movementBounds(player);

    if (!initializedRun) {
      player.x = clamp(ARENA_CENTER_X, bounds.min, bounds.max);
      player.facing = 1;
      initializedRun = true;
      current.arenaMode = true;
      current.message = 'Arena mode: use the whole screen. No running to the next screen.';
      lastMessageAt = performance.now();
    }

    const oldX = player.x;
    player.x = clamp(player.x, bounds.min, bounds.max);
    if (player.x !== oldX && Math.sign(player.vx || 0) === Math.sign(oldX - player.x)) player.vx = 0;
    current.arenaMode = true;
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
      hideArenaRails();
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
