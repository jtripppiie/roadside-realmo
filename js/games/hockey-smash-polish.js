(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.5.6';
  const DISPLAY_BUILD = 'Build 2026-06-29.3';
  const params = new URLSearchParams(window.location.search);
  const computerMode = params.get('computerMode') === '1';
  const DESIGN_WIDTH = 1024;
  const DESIGN_HEIGHT = 576;

  function onReady() {
    document.body.classList.toggle('hockey-computer-mode', computerMode);

    const api = window.RTA_HOCKEY_SMASH;
    const game = document.getElementById('hockey-game');
    const canvas = document.getElementById('hockey-canvas');
    const badge = document.getElementById('hockey-build-badge');

    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api?.getVersion) api.getVersion = () => DISPLAY_VERSION;
    if (!api || !game) return;

    let playerOverlay = document.getElementById('hockey-player-overlay');
    if (!playerOverlay) {
      playerOverlay = document.createElement('div');
      playerOverlay.id = 'hockey-player-overlay';
      playerOverlay.className = 'hockey-player-overlay';
      playerOverlay.setAttribute('aria-hidden', 'true');

      const playerSprite = document.createElement('img');
      playerSprite.className = 'hockey-player-overlay__sprite';
      playerSprite.src = 'assets/hockey-smash/sprites/hockey-player.png';
      playerSprite.alt = '';

      const playerLabel = document.createElement('span');
      playerLabel.className = 'hockey-player-overlay__label';
      playerLabel.textContent = 'DANIEL';

      playerOverlay.appendChild(playerSprite);
      playerOverlay.appendChild(playerLabel);
      game.appendChild(playerOverlay);
    }

    const finish = document.createElement('section');
    finish.id = 'hockey-finish';
    finish.className = 'hockey-finish';
    finish.hidden = true;
    finish.setAttribute('aria-live', 'assertive');

    const card = document.createElement('div');
    card.className = 'hockey-finish__card';

    const eyebrow = document.createElement('p');
    eyebrow.className = 'hockey-eyebrow';
    eyebrow.textContent = 'Victory';

    const heading = document.createElement('h2');
    heading.textContent = 'You won!';

    const copy = document.createElement('p');
    copy.textContent = 'Daniel survived the salmon run, cleared the sidewalk, and finished the final challenge.';

    const button = document.createElement('button');
    button.className = 'hockey-button hockey-button--primary';
    button.type = 'button';
    button.textContent = 'Play Again';

    card.appendChild(eyebrow);
    card.appendChild(heading);
    card.appendChild(copy);
    card.appendChild(button);
    finish.appendChild(card);
    game.appendChild(finish);

    let finishShown = false;

    button.addEventListener('click', () => {
      finishShown = false;
      finish.hidden = true;
      const retry = document.getElementById('hockey-retry');
      if (retry) retry.click();
    });

    function syncPlayerOverlay(state) {
      if (computerMode || !canvas) return;
      if (!state?.player || state.mode === 'splash' || state.mode === 'transition' || state.mode === 'tryAgain') return;

      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const player = state.player;
      const scaleX = rect.width / DESIGN_WIDTH;
      const scaleY = rect.height / DESIGN_HEIGHT;
      playerOverlay.hidden = false;
      playerOverlay.style.display = 'block';
      playerOverlay.style.left = `${rect.left + player.x * scaleX}px`;
      playerOverlay.style.top = `${rect.top + player.y * scaleY}px`;
      playerOverlay.style.width = `${Math.max(112, player.width * scaleX)}px`;
      playerOverlay.style.height = `${Math.max(136, player.height * scaleY)}px`;
      playerOverlay.style.zIndex = '9999';
      playerOverlay.dataset.facing = player.facing < 0 ? 'left' : 'right';
    }

    function watchNormalMode() {
      const state = api.getState?.();
      syncPlayerOverlay(state);

      if (!computerMode && !finishShown && state?.dad && state.dad.hp <= 0) {
        finishShown = true;
        finish.hidden = false;
        const status = document.getElementById('hockey-status');
        if (status) status.textContent = 'Victory! Final challenge cleared.';
      }
      window.requestAnimationFrame(watchNormalMode);
    }

    watchNormalMode();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
