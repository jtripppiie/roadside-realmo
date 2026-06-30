(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.14.4';
  const DISPLAY_BUILD = 'Build 2026-06-29.60';
  const BEAR_START_SPEED = 82;
  const BEAR_LATE_SPEED = 132;
  const GROUND_Y = 576 * 0.82;
  const computerMode = new URLSearchParams(window.location.search).get('computerMode') === '1';
  const CAMEO_ASSETS = {
    daniel: {
      src: 'assets/hockey-smash/sprites/alaskan_girl.webp',
      label: 'Nice shot!',
    },
    sofie: {
      src: 'assets/hockey-smash/sprites/alaskan_boy.webp',
      label: 'Nice moves!',
    },
  };
  let cameoNode = null;
  let cameoSprite = null;
  let cameoLabel = null;

  function api() { return window.RTA_HOCKEY_SMASH; }
  function getState() {
    const state = api()?.getState?.();
    if (!state || !state.player || ['splash', 'transition', 'tryAgain'].includes(state.mode)) return null;
    return state;
  }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function difficultyFor(state) { return clamp(Number(state?.difficulty) || ((state?.time || 0) / 140), 0, 1); }
  function character() { return api()?.getPlayerConfig?.()?.character || getState()?.playerCharacter || 'daniel'; }

  function syncFinalReleaseState() {
    const badge = document.getElementById('hockey-build-badge');
    if (badge && badge.textContent !== `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`) {
      badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    }
    if (api()?.getVersion) api().getVersion = () => DISPLAY_VERSION;

    if (!computerMode) return;
    const overlay = document.getElementById('hockey-player-overlay');
    if (!overlay) return;
    overlay.hidden = true;
    overlay.style.display = 'none';
    document.body.classList.add('hockey-canvas-player-only');
  }

  function slowBearsAgain(state) {
    if (!Array.isArray(state?.entities)) return;
    const difficulty = difficultyFor(state);
    const speed = BEAR_START_SPEED + (BEAR_LATE_SPEED - BEAR_START_SPEED) * difficulty;
    state.entities.forEach((entity) => {
      if (!entity || entity.dead || entity.type !== 'bear') return;
      entity.vx = -speed;
      entity._bearFinalSpeed = Number(speed.toFixed(1));
    });
  }

  function removeFinalCastEntities(state) {
    if (!Array.isArray(state?.entities)) return;
    state.entities = state.entities.filter((entity) => {
      if (!entity || entity.dead) return false;
      if (entity.fromFinalCastPass) return false;
      return !['alaskanBoy', 'alaskanGirl'].includes(entity.type);
    });
  }

  function wildlifeStageHasStarted(state) {
    if (!state) return false;
    const time = Number(state.time) || 0;
    const hasWildlife = Array.isArray(state.entities) && state.entities.some((entity) => entity && !entity.dead && ['bear', 'moose', 'chargingMoose'].includes(entity.type));
    return hasWildlife || time > 32;
  }

  function ensureCameoNode() {
    if (cameoNode?.isConnected) return cameoNode;
    const game = document.getElementById('hockey-game');
    if (!game) return null;
    if (getComputedStyle(game).position === 'static') game.style.position = 'relative';

    cameoNode = document.createElement('div');
    cameoNode.className = 'hockey-sideline-cameo';
    cameoNode.dataset.hockeySidelineCameo = 'v0.14.4';
    cameoNode.setAttribute('aria-hidden', 'true');
    Object.assign(cameoNode.style, {
      position: 'absolute',
      right: '2.2%',
      bottom: '13.5%',
      zIndex: '8',
      width: 'clamp(54px, 8vw, 92px)',
      pointerEvents: 'none',
      filter: 'drop-shadow(0 8px 12px rgba(0,0,0,.34))',
      transform: 'translateY(0)',
      transition: 'opacity 180ms ease, transform 180ms ease',
    });

    cameoSprite = document.createElement('img');
    cameoSprite.alt = '';
    Object.assign(cameoSprite.style, {
      display: 'block',
      width: '100%',
      height: 'auto',
      objectFit: 'contain',
    });

    cameoLabel = document.createElement('span');
    Object.assign(cameoLabel.style, {
      position: 'absolute',
      left: '50%',
      top: '-1.3rem',
      transform: 'translateX(-50%)',
      padding: '.2rem .44rem',
      border: '2px solid rgba(255,255,255,.92)',
      borderRadius: '999px',
      background: 'rgba(15,23,42,.86)',
      color: '#dbeafe',
      font: '900 12px/1.05 system-ui,sans-serif',
      whiteSpace: 'nowrap',
      textShadow: '0 1px 3px rgba(0,0,0,.65)',
    });

    cameoNode.appendChild(cameoSprite);
    cameoNode.appendChild(cameoLabel);
    game.appendChild(cameoNode);
    return cameoNode;
  }

  function syncSidelineCameo(state) {
    const node = ensureCameoNode();
    if (!node) return;
    const shouldShow = Boolean(state && wildlifeStageHasStarted(state));
    node.hidden = !shouldShow;
    node.style.opacity = shouldShow ? '1' : '0';
    node.style.transform = shouldShow ? 'translateY(0)' : 'translateY(8px)';
    if (!shouldShow) return;

    const config = CAMEO_ASSETS[character() === 'sofie' ? 'sofie' : 'daniel'];
    if (cameoSprite && cameoSprite.src !== new URL(config.src, window.location.href).href) cameoSprite.src = config.src;
    if (cameoLabel) cameoLabel.textContent = config.label;
  }

  function loop() {
    syncFinalReleaseState();
    const state = getState();
    if (state) {
      removeFinalCastEntities(state);
      slowBearsAgain(state);
      syncSidelineCameo(state);
    } else {
      syncSidelineCameo(null);
    }
    window.requestAnimationFrame(loop);
  }

  function ready() {
    const badge = document.getElementById('hockey-build-badge');
    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api()?.getVersion) api().getVersion = () => DISPLAY_VERSION;
    document.body.dataset.hockeyButtonDebug = 'v0.14.4';
    syncFinalReleaseState();
    window.HOCKEY_BOOT_LOG?.log?.('v0114', 'v0.14.4 keeps bears slow and converts Alaskan cast to harmless sideline cameos.');
    window.requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
