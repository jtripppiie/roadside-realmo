(function () {
  const params = new URLSearchParams(window.location.search);
  const computerMode = params.get('computerMode') === '1';
  const debugMode = params.get('debug') === '1' || params.get('dev') === '1';

  function onReady() {
    document.body.classList.toggle('hockey-computer-mode', computerMode);
    document.body.classList.toggle('hockey-debug-enabled', debugMode);
    document.body.classList.add('hockey-canvas-player-only');

    const shell = document.getElementById('hockey-smash');
    const game = document.getElementById('hockey-game');
    const target = shell || game;
    if (!target || !game) return;

    hideOldOverlayLayers();
    setupFullscreen(target);
    setupAutoplayPanel(game);
    setupFinishScreen(game);

    window.HOCKEY_BOOT_LOG?.log?.('polish', 'Clean UI polish loaded without owning version, badge, player input, or entity rendering.');
  }

  function hideOldOverlayLayers() {
    const playerOverlay = document.getElementById('hockey-player-overlay');
    if (playerOverlay) {
      playerOverlay.hidden = true;
      playerOverlay.style.display = 'none';
    }
    document.querySelectorAll('.hockey-entity-layer, .hockey-entity-overlay').forEach((node) => {
      node.hidden = true;
      node.style.display = 'none';
    });
  }

  function setupFullscreen(target) {
    const buttons = Array.from(document.querySelectorAll('[data-fullscreen-toggle]'));
    const fullscreenSupported = Boolean(target.requestFullscreen || target.webkitRequestFullscreen);
    document.body.classList.toggle('hockey-fullscreen-supported', fullscreenSupported);

    function isFullscreen() {
      return document.fullscreenElement === target || document.webkitFullscreenElement === target;
    }

    function updateButtons() {
      const active = isFullscreen();
      document.body.classList.toggle('hockey-fullscreen-active', active);
      buttons.forEach((button) => {
        button.hidden = !fullscreenSupported;
        button.textContent = active ? 'Exit Fullscreen' : 'Fullscreen';
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    async function requestFullscreen() {
      if (target.requestFullscreen) return target.requestFullscreen();
      if (target.webkitRequestFullscreen) return target.webkitRequestFullscreen();
      throw new Error('Fullscreen is not supported.');
    }

    async function exitFullscreen() {
      if (document.exitFullscreen) return document.exitFullscreen();
      if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    }

    buttons.forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          if (isFullscreen()) await exitFullscreen();
          else await requestFullscreen();
        } catch (error) {
          document.body.classList.add('hockey-fullscreen-failed');
          button.textContent = 'Use browser fullscreen';
        }
        updateButtons();
      });
    });

    document.addEventListener('fullscreenchange', updateButtons);
    document.addEventListener('webkitfullscreenchange', updateButtons);
    updateButtons();
  }

  function setupAutoplayPanel(game) {
    if (!computerMode || document.querySelector('.hockey-autoplay-panel')) return;
    const panel = document.createElement('aside');
    panel.className = 'hockey-autoplay-panel';
    panel.setAttribute('aria-live', 'polite');
    panel.innerHTML = `<p class="hockey-autoplay-panel__eyebrow">Computer Play</p><strong>Watch mode is active</strong><span>${debugMode ? 'Debug overlay is on.' : 'The player is being controlled by the computer.'}</span>`;
    game.appendChild(panel);
  }

  function setupFinishScreen(game) {
    if (document.getElementById('hockey-finish')) return;
    const finish = document.createElement('section');
    finish.id = 'hockey-finish';
    finish.className = 'hockey-finish';
    finish.hidden = true;
    finish.setAttribute('aria-live', 'assertive');
    finish.innerHTML = '<div class="hockey-finish__card"><p class="hockey-eyebrow">Victory</p><h2>You won!</h2><p>You survived the salmon run and cleared the sidewalk.</p><button class="hockey-button hockey-button--primary" type="button">Play Again</button></div>';
    finish.querySelector('button')?.addEventListener('click', () => {
      finish.hidden = true;
      document.getElementById('hockey-retry')?.click();
    });
    game.appendChild(finish);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();
