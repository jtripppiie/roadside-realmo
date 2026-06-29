(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.12.9';
  const DISPLAY_BUILD = 'Build 2026-06-29.44';

  function actionFromTarget(target) {
    return target?.closest?.('[data-action]')?.dataset?.action || 'none';
  }

  function describeTarget(target) {
    if (!target) return 'missing-target';
    const button = target.closest?.('[data-action]');
    if (button) return `[data-action=${button.dataset.action}] class=${button.className || 'none'}`;
    return `${target.tagName || 'unknown'}#${target.id || 'no-id'}.${target.className || 'no-class'}`;
  }

  function stateSummary() {
    const state = window.RTA_HOCKEY_SMASH?.getState?.();
    const player = state?.player;
    if (!state || !player) return 'state/player missing';
    return `mode=${state.mode} x=${Math.round(player.x)} y=${Math.round(player.y)} vx=${Math.round(player.vx || 0)} vy=${Math.round(player.vy || 0)} grounded=${player.grounded ? 1 : 0}`;
  }

  function log(source, event, extra) {
    const message = `${event} action=${extra?.action || 'none'} ${extra?.detail || ''} | ${stateSummary()}`;
    window.HOCKEY_BOOT_LOG?.log?.(source, message);
  }

  function normalizeSofieLabels() {
    document.querySelectorAll('[data-character="sofie"]').forEach((button) => {
      if (button.textContent.trim() !== 'Sofie') button.textContent = 'Sofie';
      button.setAttribute('aria-label', 'Choose Sofie');
    });
  }

  function lockAccidentalCameraShake() {
    const canvas = document.getElementById('hockey-canvas');
    if (!canvas) return;
    if (document.body.classList.contains('hockey-earthquake-active')) return;
    if (canvas.dataset.shaking === 'true' || canvas.style.transform) {
      canvas.style.transform = '';
      delete canvas.dataset.shaking;
    }
  }

  function onReady() {
    const api = window.RTA_HOCKEY_SMASH;
    const badge = document.getElementById('hockey-build-badge');
    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api?.getVersion) api.getVersion = () => DISPLAY_VERSION;
    document.body.dataset.hockeyButtonDebug = 'v0.12.9';

    normalizeSofieLabels();
    window.HOCKEY_BOOT_LOG?.log?.('v0109', 'Sofie label normalized and accidental camera shake locked.');
    window.HOCKEY_BOOT_LOG?.snapshot?.('v0109-ready');

    ['pointerdown', 'pointerup', 'click', 'touchstart', 'touchend'].forEach((type) => {
      document.addEventListener(type, (event) => {
        const action = actionFromTarget(event.target);
        if (action === 'none') return;
        log('button', type, {
          action,
          detail: describeTarget(event.target),
        });
      }, { capture: true, passive: true });
    });

    window.setInterval(() => {
      normalizeSofieLabels();
      const state = window.RTA_HOCKEY_SMASH?.getState?.();
      if (state?.mode === 'playing') window.HOCKEY_BOOT_LOG?.log?.('heartbeat', stateSummary());
    }, 1500);

    function cameraSafetyLoop() {
      lockAccidentalCameraShake();
      window.requestAnimationFrame(cameraSafetyLoop);
    }
    window.requestAnimationFrame(cameraSafetyLoop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();
