(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.10.0';
  const DISPLAY_BUILD = 'Build 2026-06-29.21';

  function onReady() {
    const api = window.RTA_HOCKEY_SMASH;
    const badge = document.getElementById('hockey-build-badge');
    const tryAgain = document.getElementById('hockey-try-again');
    const retryButton = document.getElementById('hockey-retry');
    const status = document.getElementById('hockey-status');
    const healthMeter = document.getElementById('hockey-health');

    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api?.getVersion) api.getVersion = () => DISPLAY_VERSION;
    if (!api || !tryAgain) return;

    const style = document.createElement('style');
    style.textContent = `
      body.hockey-game-over .hockey-controls {
        pointer-events: none;
        opacity: 0.42;
      }
      body.hockey-game-over #hockey-try-again {
        position: fixed;
        inset: 0;
        z-index: 60;
        display: grid;
        place-items: center;
        padding: clamp(1rem, 4vw, 3rem);
        background: rgba(5, 8, 13, 0.78);
        backdrop-filter: blur(8px);
      }
      body.hockey-game-over #hockey-try-again > div {
        width: min(92vw, 520px);
        border: 3px solid rgba(255, 242, 122, 0.55);
        border-radius: 18px;
        padding: clamp(1.2rem, 4vw, 2rem);
        background: rgba(16, 25, 35, 0.94);
        color: #fff8df;
        text-align: center;
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.52);
      }
      body.hockey-game-over #hockey-try-again h2 {
        margin: 0 0 0.6rem;
        font-size: clamp(2.2rem, 8vw, 4.6rem);
        line-height: 0.95;
      }
      body.hockey-game-over #hockey-try-again p:not(.hockey-eyebrow) {
        margin: 0 auto 1.1rem;
        max-width: 28rem;
        color: rgba(255, 242, 207, 0.9);
        line-height: 1.4;
      }
    `;
    document.head.appendChild(style);

    let shown = false;

    function getState() {
      return api.getState?.() || null;
    }

    function showRetry(state) {
      if (shown) return;
      shown = true;
      document.body.classList.add('hockey-game-over');
      document.body.classList.remove('hockey-slide-active');
      if (state?.player) {
        state.player.health = 0;
        state.player.vx = 0;
        state.player.vy = 0;
      }
      if (state) {
        state.mode = 'tryAgain';
        state.message = 'Daniel is out. Try again?';
      }
      if (healthMeter) healthMeter.value = 0;
      if (status) status.textContent = 'Daniel is out. Try again?';
      tryAgain.hidden = false;
      tryAgain.removeAttribute('hidden');
    }

    retryButton?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      window.location.reload();
    }, { capture: true });

    function watchGameOver() {
      const state = getState();
      if (state?.player && state.player.health <= 0) showRetry(state);
      if (state?.mode === 'tryAgain') showRetry(state);
      window.requestAnimationFrame(watchGameOver);
    }

    watchGameOver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
