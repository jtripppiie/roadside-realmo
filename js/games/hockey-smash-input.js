(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.12.4';
  const DISPLAY_BUILD = 'Build 2026-06-29.39';
  const DESIGN_WIDTH = 1024;
  const GROUND_Y = 576 * 0.82;
  const RUN_SPEED = 360;
  const RUN_ACCEL = 2100;
  const RUN_DECEL = 2800;
  const AIR_CONTROL = 0.76;
  const JUMP_VELOCITY = 830;
  const JUMP_CUT_VELOCITY = 320;
  const COYOTE_MS = 130;
  const JUMP_BUFFER_MS = 150;
  const SLIDE_SPEED = 560;
  const SLIDE_MS = 320;
  const SLIDE_COOLDOWN_MS = 430;
  const SLIDE_TRANSFORM = 'translateY(14px) scaleX(1.14) scaleY(0.70)';
  const params = new URLSearchParams(window.location.search);
  const computerMode = params.get('computerMode') === '1';

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function approach(value, target, amount) {
    if (value < target) return Math.min(target, value + amount);
    if (value > target) return Math.max(target, value - amount);
    return target;
  }

  function onReady() {
    const api = window.RTA_HOCKEY_SMASH;
    const badge = document.getElementById('hockey-build-badge');
    const status = document.getElementById('hockey-status');
    const playerOverlay = document.getElementById('hockey-player-overlay');
    const debug = document.getElementById('hockey-debug');

    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api?.getVersion) api.getVersion = () => DISPLAY_VERSION;
    if (!api) return;

    const input = {
      left: false,
      right: false,
      jumpHeld: false,
    };

    const activePointers = new Map();
    let smoothVx = 0;
    let lastFrame = performance.now();
    let lastGroundedAt = 0;
    let jumpBufferedAt = 0;
    let slideUntil = 0;
    let slideCooldownUntil = 0;
    let slideDirection = 1;
    let lastComputerPhase = '';
    let computerJumpQueued = false;
    let computerSlideQueued = false;

    function getState() {
      const state = api.getState?.();
      if (!state || !state.player) return null;
      if (state.mode === 'splash' || state.mode === 'transition' || state.mode === 'tryAgain') return null;
      return state;
    }

    function actionFromButtonTarget(target) {
      return target?.closest?.('.hockey-controls [data-action]')?.dataset?.action || null;
    }

    function markButton(action, active) {
      if (!action) return;
      document.querySelectorAll(`.hockey-controls [data-action="${action}"]`).forEach((button) => {
        button.classList.toggle('is-pressed', Boolean(active));
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    function setDirection(action, active) {
      if (action === 'left') input.left = active;
      if (action === 'right') input.right = active;
      markButton(action, active);
    }

    function resetDirections() {
      setDirection('left', false);
      setDirection('right', false);
    }

    function isGrounded(player) {
      return Boolean(player.grounded) || player.y + player.height >= GROUND_Y - 5;
    }

    function setSlideVisual(active) {
      document.body.classList.toggle('hockey-slide-active', active);
      if (!playerOverlay) return;
      playerOverlay.dataset.sliding = active ? 'true' : 'false';
      playerOverlay.style.transform = active ? SLIDE_TRANSFORM : '';
      playerOverlay.style.transformOrigin = active ? 'bottom center' : '';
    }

    function queueJump() {
      jumpBufferedAt = performance.now();
      input.jumpHeld = true;
      markButton('jump', true);
      window.setTimeout(() => markButton('jump', false), 120);
    }

    function releaseJump() {
      input.jumpHeld = false;
      const player = getState()?.player;
      if (player && player.vy < -JUMP_CUT_VELOCITY) player.vy = -JUMP_CUT_VELOCITY;
    }

    function startSlide() {
      const state = getState();
      if (!state) return;
      const now = performance.now();
      if (now < slideCooldownUntil) return;
      const player = state.player;
      slideDirection = input.left && !input.right ? -1 : input.right && !input.left ? 1 : player.facing < 0 ? -1 : 1;
      slideUntil = now + SLIDE_MS;
      slideCooldownUntil = now + SLIDE_COOLDOWN_MS;
      smoothVx = slideDirection * SLIDE_SPEED;
      player.facing = slideDirection;
      player.vx = smoothVx;
      state.message = 'Daniel slides!';
      if (status) status.textContent = state.message;
      setSlideVisual(true);
      markButton('slide', true);
      window.setTimeout(() => markButton('slide', false), SLIDE_MS);
    }

    function startAction(action, event) {
      if (!action || action === 'stick') return false;
      event?.preventDefault?.();
      if (action === 'left' || action === 'right') setDirection(action, true);
      if (action === 'jump') queueJump();
      if (action === 'slide') startSlide();
      return true;
    }

    function endAction(action, event) {
      if (!action || action === 'stick') return false;
      event?.preventDefault?.();
      if (action === 'left' || action === 'right') setDirection(action, false);
      if (action === 'jump') releaseJump();
      return true;
    }

    function resetAllInput() {
      activePointers.clear();
      resetDirections();
      releaseJump();
    }

    function controlKey(event) {
      const key = event.key;
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') return 'left';
      if (key === 'ArrowRight' || key === 'd' || key === 'D') return 'right';
      if (key === 'ArrowUp' || key === 'w' || key === 'W' || key === 'j' || key === 'J') return 'jump';
      if (key === 'ArrowDown' || key === 'Shift' || key === 's' || key === 'S') return 'slide';
      return null;
    }

    function syncComputerModeInput(state) {
      if (!computerMode) return;
      const phase = state.computer?.phaseName || 'manual';
      if (phase !== lastComputerPhase) {
        lastComputerPhase = phase;
        computerJumpQueued = false;
        computerSlideQueued = false;
        if (phase !== 'jump') releaseJump();
      }

      setDirection('left', phase === 'left');
      setDirection('right', phase === 'right' || phase === 'slide');

      if (phase === 'jump' && !computerJumpQueued && isGrounded(state.player)) {
        queueJump();
        computerJumpQueued = true;
      }
      if (phase === 'slide' && !computerSlideQueued) {
        startSlide();
        computerSlideQueued = true;
      }
      if (phase === 'stick' && state.player.lastSwing !== state.computer?.lastForcedSwing) {
        const now = performance.now();
        state.player.lastSwing = now;
        state.player.attackTimer = 0.18;
        if (state.computer) state.computer.lastForcedSwing = now;
      }
    }

    document.querySelectorAll('.hockey-controls [data-action]').forEach((button) => {
      const action = button.dataset.action;
      if (!action || action === 'stick') return;

      button.addEventListener('pointerdown', (event) => {
        if (computerMode) return;
        if (!startAction(action, event)) return;
        if (event.pointerId != null) activePointers.set(event.pointerId, action);
        button.setPointerCapture?.(event.pointerId);
      }, { passive: false });

      button.addEventListener('pointerup', (event) => {
        if (computerMode) return;
        const trackedAction = activePointers.get(event.pointerId) || action;
        endAction(trackedAction, event);
        activePointers.delete(event.pointerId);
      }, { passive: false });

      button.addEventListener('pointercancel', (event) => {
        if (computerMode) return;
        const trackedAction = activePointers.get(event.pointerId) || action;
        endAction(trackedAction, event);
        activePointers.delete(event.pointerId);
      }, { passive: false });

      button.addEventListener('lostpointercapture', (event) => {
        if (computerMode) return;
        const trackedAction = activePointers.get(event.pointerId);
        if (trackedAction) endAction(trackedAction, event);
        activePointers.delete(event.pointerId);
      });

      button.addEventListener('touchcancel', (event) => {
        if (computerMode) return;
        event.preventDefault();
        resetAllInput();
      }, { passive: false });
    });

    window.addEventListener('keydown', (event) => {
      if (computerMode) return;
      const action = controlKey(event);
      if (!action) return;
      event.preventDefault();
      if (action === 'left' || action === 'right') setDirection(action, true);
      if (action === 'jump' && !event.repeat) queueJump();
      if (action === 'slide' && !event.repeat) startSlide();
    });

    window.addEventListener('keyup', (event) => {
      if (computerMode) return;
      const action = controlKey(event);
      if (!action) return;
      event.preventDefault();
      if (action === 'left' || action === 'right') setDirection(action, false);
      if (action === 'jump') releaseJump();
    });

    window.addEventListener('pointerup', (event) => {
      const action = activePointers.get(event.pointerId);
      if (action) endAction(action, event);
      activePointers.delete(event.pointerId);
    }, { passive: false });

    window.addEventListener('pointercancel', (event) => {
      const action = activePointers.get(event.pointerId);
      if (action) endAction(action, event);
      activePointers.delete(event.pointerId);
    }, { passive: false });

    window.addEventListener('touchcancel', (event) => {
      event.preventDefault();
      resetAllInput();
    }, { passive: false });

    window.addEventListener('blur', resetAllInput);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) resetAllInput();
    });

    function movementLoop(now) {
      const state = getState();
      const dt = clamp((now - lastFrame) / 1000 || 0.016, 0.008, 0.034);
      lastFrame = now;

      if (state?.player) {
        syncComputerModeInput(state);
        const player = state.player;
        const grounded = isGrounded(player);
        if (grounded) lastGroundedAt = now;

        const jumpBuffered = now - jumpBufferedAt <= JUMP_BUFFER_MS;
        const coyoteReady = now - lastGroundedAt <= COYOTE_MS;
        if (jumpBuffered && coyoteReady) {
          player.y = Math.min(player.y, GROUND_Y - player.height - 2);
          player.vy = -JUMP_VELOCITY;
          player.grounded = false;
          jumpBufferedAt = 0;
          lastGroundedAt = 0;
          state.message = 'Daniel jumps!';
          if (status) status.textContent = state.message;
        }

        const slideActive = now < slideUntil;
        const axis = (input.right ? 1 : 0) - (input.left ? 1 : 0);

        if (slideActive) {
          smoothVx = approach(smoothVx, slideDirection * 380, 1100 * dt);
          player.facing = slideDirection;
          setSlideVisual(true);
        } else {
          setSlideVisual(false);
          const targetSpeed = axis * RUN_SPEED * (grounded ? 1 : AIR_CONTROL);
          smoothVx = approach(smoothVx, targetSpeed, (axis ? RUN_ACCEL : RUN_DECEL) * dt);
          if (axis) player.facing = axis < 0 ? -1 : 1;
        }

        if (!axis && !slideActive && Math.abs(smoothVx) < 5) smoothVx = 0;
        player.vx = smoothVx;
        player.x = clamp(player.x + smoothVx * dt, 22, DESIGN_WIDTH - player.width - 22);

        if (debug && document.body.classList.contains('hockey-debug-enabled')) {
          debug.textContent = `Input L:${input.left ? 1 : 0} R:${input.right ? 1 : 0} J:${input.jumpHeld ? 1 : 0} Axis:${axis} VX:${Math.round(player.vx)}`;
        }
      }

      window.requestAnimationFrame(movementLoop);
    }

    window.requestAnimationFrame(movementLoop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();
