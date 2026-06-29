(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.5.4';
  const DISPLAY_BUILD = 'Build 2026-06-29.1';
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

    const playerOverlay = document.createElement('img');
    playerOverlay.className = 'hockey-player-overlay';
    playerOverlay.src = 'assets/hockey-smash/sprites/hockey-player.png';
    playerOverlay.alt = '';
    playerOverlay.hidden = true;
    playerOverlay.setAttribute('aria-hidden', 'true');
    game.append(playerOverlay);

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

    card.append(eyebrow, heading, copy, button);
    finish.append(card);
    game.append(finish);

    let finishShown = false;

    button.addEventListener('click', () => {
      finishShown = false;
      finish.hidden = true;
      const retry = document.getElementById('hockey-retry');
      if (retry) retry.click();
    });

    function syncPlayerOverlay(state) {
      if (computerMode || !canvas || !state?.player || state.mode === 'splash' || state.mode === 'transition' || state.mode === 'tryAgain') {
        playerOverlay.hidden = true;
        return;
      }

      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        playerOverlay.hidden = true;
        return;
      }

      const player = state.player;
      const scaleX = rect.width / DESIGN_WIDTH;
      const scaleY = rect.height / DESIGN_HEIGHT;
      playerOverlay.hidden = false;
      playerOverlay.style.left = `${rect.left + player.x * scaleX}px`;
      playerOverlay.style.top = `${rect.top + player.y * scaleY}px`;
      playerOverlay.style.width = `${player.width * scaleX}px`;
      playerOverlay.style.height = `${player.height * scaleY}px`;
      playerOverlay.style.transform = player.facing < 0 ? 'scaleX(-1)' : 'scaleX(1)';
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
