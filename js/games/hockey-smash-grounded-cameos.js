(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.14.7 Grounded Cameos';
  const DESIGN_WIDTH = 1024;
  const DESIGN_HEIGHT = 576;
  const GROUND_Y = DESIGN_HEIGHT * 0.82;
  const CAMEO_WORLD_X = 720;
  const CAMEO_WIDTH = 84;
  const CAMEO_HEIGHT = 96;
  const CAMEO_VISIBLE_MS = 8000;

  let activeState = null;
  let cameoStartedAt = 0;
  let cameoDone = false;
  let styleNode = null;

  function api() {
    return window.RTA_HOCKEY_SMASH;
  }

  function getState() {
    const state = api()?.getState?.();
    if (!state || !state.player || ['splash', 'transition', 'tryAgain'].includes(state.mode)) return null;
    return state;
  }

  function canvasRect() {
    return document.getElementById('hockey-canvas')?.getBoundingClientRect?.() || null;
  }

  function syncBuildBadge() {
    const text = 'Hockey Smash v0.14.7 · Build 2026-06-30.63';
    const badge = document.getElementById('hockey-build-badge');
    if (badge && badge.textContent !== text) badge.textContent = text;
    if (api()?.getVersion) api().getVersion = () => 'Hockey Smash v0.14.7';
  }

  function ensureOverrides() {
    if (styleNode?.isConnected) return;
    styleNode = document.createElement('style');
    styleNode.textContent = `
      .hockey-clean-room-bubble {
        left: calc(50% - 24px) !important;
        bottom: calc(100% + 8px) !important;
        transform: translateX(-50%) !important;
      }
    `;
    document.head.appendChild(styleNode);
  }

  function resetForState(state) {
    activeState = state;
    cameoStartedAt = 0;
    cameoDone = false;
  }

  function wildlifeStageHasStarted(state) {
    if (!state) return false;
    const time = Number(state.time) || 0;
    const hasWildlife = Array.isArray(state.entities) && state.entities.some((entity) => (
      entity && !entity.dead && ['bear', 'moose', 'chargingMoose'].includes(entity.type)
    ));
    return hasWildlife || time > 32;
  }

  function cameoShouldShow(state) {
    if (!state || cameoDone) return false;
    if (!wildlifeStageHasStarted(state)) return false;

    if (!cameoStartedAt) cameoStartedAt = performance.now();
    if (performance.now() - cameoStartedAt >= CAMEO_VISIBLE_MS) {
      cameoDone = true;
      return false;
    }
    return true;
  }

  function groundedPositionFor(node) {
    const rect = canvasRect();
    if (!rect?.width || !rect?.height || !node) return null;
    const scaleX = rect.width / DESIGN_WIDTH;
    const scaleY = rect.height / DESIGN_HEIGHT;
    const width = Math.max(62, CAMEO_WIDTH * scaleX);
    const height = Math.max(72, CAMEO_HEIGHT * scaleY);
    return {
      left: rect.left + CAMEO_WORLD_X * scaleX,
      top: rect.top + (GROUND_Y - CAMEO_HEIGHT) * scaleY,
      width,
      height,
    };
  }

  function hideAlaskaCameos() {
    document.querySelectorAll('.hockey-sideline-cameo').forEach((node) => {
      node.hidden = true;
      node.style.opacity = '0';
      node.style.display = 'none';
    });
  }

  function groundAlaskaCameo(state) {
    const shouldShow = cameoShouldShow(state);
    if (!shouldShow) {
      hideAlaskaCameos();
      return;
    }

    document.querySelectorAll('.hockey-sideline-cameo').forEach((node) => {
      const pos = groundedPositionFor(node);
      if (!pos) return;

      // The release layer creates the Alaska boy/girl as a sideline cameo.
      // Keep that behavior, but place it on the same ground baseline as Mom and the player.
      node.hidden = false;
      Object.assign(node.style, {
        display: 'block',
        opacity: '1',
        position: 'fixed',
        left: `${pos.left}px`,
        top: `${pos.top}px`,
        right: 'auto',
        bottom: 'auto',
        width: `${pos.width}px`,
        height: `${pos.height}px`,
        zIndex: '32',
        transform: 'translateY(0)',
        pointerEvents: 'none',
      });

      const sprite = node.querySelector('img');
      if (sprite) {
        Object.assign(sprite.style, {
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        });
      }

      const label = node.querySelector('span');
      if (label) label.textContent = "Hey, you're cute";
    });
  }

  function runAfterReleaseLayer() {
    const state = getState();
    if (state && state !== activeState) resetForState(state);
    if (!state) {
      activeState = null;
      hideAlaskaCameos();
      return;
    }
    groundAlaskaCameo(state);
  }

  function loop() {
    ensureOverrides();
    syncBuildBadge();

    // Run after the release layer's own requestAnimationFrame work so this file wins
    // when it limits the Alaska boy/girl cameo to one short appearance per run.
    window.setTimeout(runAfterReleaseLayer, 0);
    window.requestAnimationFrame(loop);
  }

  window.requestAnimationFrame(loop);
})();
