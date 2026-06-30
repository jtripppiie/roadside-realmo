(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.9.0';
  const DISPLAY_BUILD = 'Build 2026-06-29.11';
  const params = new URLSearchParams(window.location.search);
  const computerMode = params.get('computerMode') === '1';
  const debugMode = params.get('debug') === '1';
  const DESIGN_WIDTH = 1024;
  const DESIGN_HEIGHT = 576;
  const CORE_GROUND_RATIO = 0.82;
  const VISUAL_GROUND_RATIO = 0.80;
  const DIRECT_MOVE_SPEED = 390;
  const DIRECT_TAP_STEP = 86;
  const JUMP_VISIBLE_MS = 440;
  const PLAYER_ASSETS = {
    normal: 'assets/hockey-smash/sprites/hockey-player.webp',
    sliding: 'assets/hockey-smash/sprites/hockey-player-sliding.webp',
  };
  const ENTITY_ASSETS = {
    salmon: 'assets/hockey-smash/sprites/salmon.webp',
    bear: 'assets/hockey-smash/sprites/bear.webp',
    moose: 'assets/hockey-smash/sprites/moose.webp',
    sister: 'assets/hockey-smash/sprites/sister-spinning.webp',
    danceInstructor: 'assets/hockey-smash/sprites/dance_instructor.webp',
    dad: 'assets/hockey-smash/sprites/dad.webp',
    dadJoke: 'assets/hockey-smash/sprites/dad.webp',
  };
  const ENTITY_WALK_ASSETS = {
    bear: [
      'assets/hockey-smash/sprites/bear-1.webp',
      'assets/hockey-smash/sprites/bear-2.webp',
    ],
    moose: [
      'assets/hockey-smash/sprites/moose-1.webp',
      'assets/hockey-smash/sprites/moose-2.webp',
      'assets/hockey-smash/sprites/moose-3.webp',
    ],
  };

  function onReady() {
    document.body.classList.toggle('hockey-computer-mode', computerMode);
    document.body.classList.toggle('hockey-debug-enabled', debugMode);

    const api = window.RTA_HOCKEY_SMASH;
    const shell = document.getElementById('hockey-smash');
    const game = document.getElementById('hockey-game');
    const canvas = document.getElementById('hockey-canvas');
    const badge = document.getElementById('hockey-build-badge');

    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api?.getVersion) api.getVersion = () => DISPLAY_VERSION;
    if (!api || !game) return;

    setupFullscreen(shell || game);

    let manualJumpLift = 0;
    let manualJumpUntil = 0;
    let playerOverlay = document.getElementById('hockey-player-overlay');
    if (!playerOverlay) {
      playerOverlay = document.createElement('div');
      playerOverlay.id = 'hockey-player-overlay';
      playerOverlay.className = 'hockey-player-overlay';
      playerOverlay.setAttribute('aria-hidden', 'true');

      const playerSprite = document.createElement('img');
      playerSprite.className = 'hockey-player-overlay__sprite';
      playerSprite.src = PLAYER_ASSETS.normal;
      playerSprite.alt = '';

      const playerLabel = document.createElement('span');
      playerLabel.className = 'hockey-player-overlay__label';
      playerLabel.textContent = 'DANIEL';

      playerOverlay.appendChild(playerSprite);
      playerOverlay.appendChild(playerLabel);
      game.appendChild(playerOverlay);
    }
    playerOverlay.hidden = true;
    playerOverlay.style.display = 'none';
    document.body.classList.add('hockey-canvas-player-only');

    const entityLayer = document.createElement('div');
    entityLayer.className = 'hockey-entity-layer';
    entityLayer.setAttribute('aria-hidden', 'true');
    entityLayer.hidden = true;
    game.appendChild(entityLayer);
    const entityNodes = new Map();

    // The later movement layer owns gameplay input in normal play. Keep this
    // older direct-touch helper out of the way so buttons do not double-fire
    // or swallow jump/slide state on mobile.
    if (computerMode) enhanceDpadControls();

    const autoplayPanel = createAutoplayPanel();
    if (autoplayPanel) game.appendChild(autoplayPanel);

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
        buttons.forEach((fullscreenButton) => {
          fullscreenButton.textContent = active ? 'Exit Fullscreen' : 'Fullscreen';
          fullscreenButton.setAttribute('aria-pressed', active ? 'true' : 'false');
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

      buttons.forEach((fullscreenButton) => {
        if (!fullscreenSupported) {
          fullscreenButton.hidden = true;
          return;
        }
        fullscreenButton.addEventListener('click', async (event) => {
          event.preventDefault();
          event.stopPropagation();
          try {
            if (isFullscreen()) await exitFullscreen();
            else await requestFullscreen();
          } catch (error) {
            document.body.classList.add('hockey-fullscreen-failed');
            fullscreenButton.textContent = 'Use browser fullscreen';
          }
          updateButtons();
        });
      });

      document.addEventListener('fullscreenchange', updateButtons);
      document.addEventListener('webkitfullscreenchange', updateButtons);
      updateButtons();
    }

    function createAutoplayPanel() {
      if (!computerMode) return null;
      const panel = document.createElement('aside');
      panel.className = 'hockey-autoplay-panel';
      panel.setAttribute('aria-live', 'polite');

      const label = document.createElement('p');
      label.className = 'hockey-autoplay-panel__eyebrow';
      label.textContent = 'Computer Play';

      const title = document.createElement('strong');
      title.textContent = 'Watch mode is active';

      const copy = document.createElement('span');
      copy.textContent = debugMode ? 'Debug overlay is on.' : 'Daniel is being controlled by the computer.';

      panel.appendChild(label);
      panel.appendChild(title);
      panel.appendChild(copy);
      return panel;
    }

    function isCompactViewport() {
      return window.matchMedia('(orientation: landscape) and (max-height: 560px), (orientation: portrait) and (max-width: 760px)').matches;
    }

    function enhanceDpadControls() {
      let activeMove = null;
      let lastMoveTime = 0;
      let directMoveRaf = 0;

      function getPlayableState() {
        const state = api.getState?.();
        if (!state || !state.player) return null;
        if (state.mode === 'tryAgain') return null;
        if (state.mode === 'splash' || state.mode === 'transition') state.mode = 'playing';
        return state;
      }

      function movePlayer(direction, distance) {
        const state = getPlayableState();
        if (!state) return;
        const player = state.player;
        const delta = direction === 'left' ? -distance : distance;
        player.x = Math.max(22, Math.min(DESIGN_WIDTH - player.width - 22, player.x + delta));
        player.vx = direction === 'left' ? -DIRECT_MOVE_SPEED : DIRECT_MOVE_SPEED;
        player.facing = direction === 'left' ? -1 : 1;
        state.message = direction === 'left' ? 'Daniel moves left.' : 'Daniel moves right.';
        syncPlayerOverlay(state);
      }

      function jumpPlayer() {
        const state = getPlayableState();
        if (!state) return;
        const player = state.player;
        const groundY = DESIGN_HEIGHT * CORE_GROUND_RATIO;
        player.y = Math.min(player.y, groundY - player.height - 4);
        player.vy = -(window.RTA_HOCKEY_SMASH?.tuning?.jumpVelocity || 810);
        player.grounded = false;
        manualJumpLift = isCompactViewport() ? 48 : 78;
        manualJumpUntil = performance.now() + JUMP_VISIBLE_MS;
        state.message = 'Daniel jumps.';
        syncPlayerOverlay(state);
      }

      function slidePlayer() {
        movePlayer(activeMove || 'right', DIRECT_TAP_STEP * 1.35);
      }

      function stickPlayer() {
        const state = getPlayableState();
        if (!state) return;
        state.player.attackTimer = 0.2;
        state.message = 'Daniel swings the stick.';
      }

      function directMoveLoop(now) {
        if (!activeMove) {
          directMoveRaf = 0;
          return;
        }
        const dt = Math.min(0.05, Math.max(0.016, (now - lastMoveTime) / 1000 || 0.016));
        lastMoveTime = now;
        movePlayer(activeMove, DIRECT_MOVE_SPEED * dt);
        directMoveRaf = window.requestAnimationFrame(directMoveLoop);
      }

      function startMove(action) {
        activeMove = action;
        lastMoveTime = performance.now();
        movePlayer(action, DIRECT_TAP_STEP);
        if (!directMoveRaf) directMoveRaf = window.requestAnimationFrame(directMoveLoop);
      }

      function stopMove() {
        const state = getPlayableState();
        if (state) state.player.vx = 0;
        activeMove = null;
      }

      function runAction(action) {
        if (action === 'left' || action === 'right') {
          startMove(action);
          return;
        }
        if (action === 'jump') jumpPlayer();
        if (action === 'slide') slidePlayer();
        if (action === 'stick') stickPlayer();
      }

      function getActionAtPoint(x, y) {
        const buttons = Array.from(document.querySelectorAll('[data-action]'));
        for (const actionButton of buttons) {
          const rect = actionButton.getBoundingClientRect();
          if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            return actionButton.dataset.action;
          }
        }
        return null;
      }

      function consumeEvent(event, action) {
        if (!action) return false;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        return true;
      }

      window.HOCKEY_SMASH_DPAD = {
        press(action) {
          runAction(action);
        },
        release() {
          stopMove();
        },
        move(direction, distance = DIRECT_TAP_STEP) {
          movePlayer(direction, distance);
        },
        jump() {
          jumpPlayer();
        },
      };

      document.querySelectorAll('[data-action]').forEach((actionButton) => {
        const action = actionButton.dataset.action;

        actionButton.addEventListener('pointerdown', (event) => {
          if (!consumeEvent(event, action)) return;
          actionButton.setPointerCapture?.(event.pointerId);
          runAction(action);
        }, { capture: true, passive: false });

        ['pointerup', 'pointercancel', 'lostpointercapture', 'pointerleave'].forEach((eventName) => {
          actionButton.addEventListener(eventName, () => {
            if (action === activeMove) stopMove();
          }, { capture: true });
        });

        actionButton.addEventListener('click', (event) => {
          if (!consumeEvent(event, action)) return;
          if (action === 'left' || action === 'right') movePlayer(action, DIRECT_TAP_STEP);
          if (action === 'jump') jumpPlayer();
          if (action === 'slide') slidePlayer();
          if (action === 'stick') stickPlayer();
        }, { capture: true });
      });

      document.addEventListener('pointerdown', (event) => {
        const action = getActionAtPoint(event.clientX, event.clientY);
        if (!consumeEvent(event, action)) return;
        runAction(action);
      }, { capture: true, passive: false });

      document.addEventListener('pointerup', () => stopMove(), { capture: true });
      document.addEventListener('pointercancel', () => stopMove(), { capture: true });

      document.addEventListener('click', (event) => {
        const action = getActionAtPoint(event.clientX, event.clientY);
        if (!consumeEvent(event, action)) return;
        if (action === 'left' || action === 'right') movePlayer(action, DIRECT_TAP_STEP);
        if (action === 'jump') jumpPlayer();
        if (action === 'slide') slidePlayer();
        if (action === 'stick') stickPlayer();
      }, { capture: true });
    }

    function syncPlayerOverlay() {
      if (playerOverlay) {
        playerOverlay.hidden = true;
        playerOverlay.style.display = 'none';
      }
    }

    function entityLabel(entity) {
      return {
        salmon: 'SALMON',
        bear: 'BEAR',
        moose: 'MOOSE',
        sister: 'SISTER',
        teacher: 'TEACHER',
        danceInstructor: 'DANCE INSTRUCTOR',
        dad: 'DAD',
        dadJoke: 'DAD JOKE',
      }[entity.type] || entity.type.toUpperCase();
    }

    function entityIsGrounded(type) {
      return ['bear', 'moose', 'sister', 'teacher', 'danceInstructor', 'dad'].includes(type);
    }

    function syncEntityOverlays(state) {
      entityLayer.hidden = true;
      entityLayer.style.display = 'none';
      entityNodes.forEach((node) => node.remove());
      entityNodes.clear();
      return;
      if (!canvas || !state || state.mode === 'tryAgain') return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const scaleX = rect.width / DESIGN_WIDTH;
      const scaleY = rect.height / DESIGN_HEIGHT;
      const compact = isCompactViewport();
      const activeKeys = new Set();
      const rawEntities = (state.entities || [])
        .filter((entity) => entity && !entity.dead && ENTITY_ASSETS[entity.type])
        .slice(0, compact ? 14 : 26);
      const dadEntity = state.dad && !state.dad.dead ? [state.dad] : [];
      const visibleEntities = rawEntities.concat(dadEntity);

      visibleEntities.forEach((entity, index) => {
        const key = entity === state.dad ? 'dad-boss' : `${entity.type}-${index}`;
        activeKeys.add(key);
        let node = entityNodes.get(key);
        if (!node) {
          node = document.createElement('div');
          node.className = 'hockey-entity-overlay';
          const img = document.createElement('img');
          img.alt = '';
          img.className = 'hockey-entity-overlay__sprite';
          const label = document.createElement('span');
          label.className = 'hockey-entity-overlay__label';
          node.appendChild(img);
          node.appendChild(label);
          entityLayer.appendChild(node);
          entityNodes.set(key, node);
        }

        const img = node.querySelector('img');
        const label = node.querySelector('span');
        const nextSrc = entityAssetSrc(entity, state);
        if (!img.src.endsWith(nextSrc)) img.src = nextSrc;
        label.textContent = entity.bubble || entityLabel(entity);
        node.dataset.type = entity.type;
        node.dataset.facing = entity.vx > 0 || entity.flip > 0 ? 'right' : 'left';

        const scale = compact ? 0.54 : 0.72;
        const minW = entity.type === 'salmon' ? 24 : compact ? 38 : 50;
        const minH = entity.type === 'salmon' ? 16 : compact ? 38 : 48;
        const width = Math.max(minW, entity.width * scaleX * scale);
        const height = Math.max(minH, entity.height * scaleY * scale);
        const centerX = rect.left + (entity.x + entity.width / 2) * scaleX;
        const feetY = entityIsGrounded(entity.type)
          ? rect.top + rect.height * VISUAL_GROUND_RATIO
          : rect.top + entity.y * scaleY + height;
        const top = feetY - height;
        const left = centerX - width / 2;

        node.style.left = `${left}px`;
        node.style.top = `${top}px`;
        node.style.width = `${width}px`;
        node.style.height = `${height}px`;
        node.hidden = left > window.innerWidth + 80 || left + width < -80 || top > window.innerHeight + 80;
      });

      entityNodes.forEach((node, key) => {
        if (!activeKeys.has(key)) {
          node.remove();
          entityNodes.delete(key);
        }
      });
    }

    function entityAssetSrc(entity, state) {
      const walkFrames = ENTITY_WALK_ASSETS[entity.type];
      if (!walkFrames) return ENTITY_ASSETS[entity.type];
      const frame = Math.floor((state?.time || 0) * 5) % walkFrames.length;
      return walkFrames[frame];
    }

    function watchNormalMode() {
      const state = api.getState?.();
      syncPlayerOverlay(state);
      syncEntityOverlays(state);

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
