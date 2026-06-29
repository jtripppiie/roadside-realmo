(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.12.0';
  const DISPLAY_BUILD = 'Build 2026-06-29.35';
  const DESIGN_WIDTH = 1024;
  const GROUND_Y = 576 * 0.82;
  const RUN_SPEED = 360;
  const RUN_ACCEL = 1900;
  const RUN_DECEL = 2550;
  const AIR_CONTROL = 0.72;
  const JUMP_VELOCITY = 830;
  const JUMP_CUT_VELOCITY = 320;
  const COYOTE_MS = 120;
  const JUMP_BUFFER_MS = 140;
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

    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api?.getVersion) api.getVersion = () => DISPLAY_VERSION;
    if (!api) return;

    const input = {
      left: false,
      right: false,
      jumpHeld: false,
    };

    let smoothVx = 0;
    let lastFrame = performance.now();
    let lastGroundedAt = 0;
    let jumpBufferedAt = 0;
    let slideUntil = 0;
    let slideCooldownUntil = 0;
    let slideDirection = 1;
    let lastPointerAt = 0;
    let lastComputerPhase = '';
    let computerJumpQueued = false;
    let computerSlideQueued = false;

    function getState() {
      const state = api.getState?.();
      if (!state || !state.player) return null;
      if (state.mode === 'splash' || state.mode === 'transition' || state.mode === 'tryAgain') return null;
      return state;
    }

    function actionFromEvent(event) {
      return event.target?.closest?.('.hockey-controls [data-action]')?.dataset?.action || null;
    }

    function consume(event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }

    function setDirection(action, active) {
      if (action === 'left') input.left = active;
      if (action === 'right') input.right = active;
    }

    function setSlideVisual(active) {
      document.body.classList.toggle('hockey-slide-active', active);
      if (!playerOverlay) return;
      playerOverlay.dataset.sliding = active ? 'true' : 'false';
      playerOverlay.style.transform = active ? SLIDE_TRANSFORM : '';
      playerOverlay.style.transformOrigin = active ? 'bottom center' : '';
    }

    function isGrounded(player) {
      return Boolean(player.grounded) || player.y + player.height >= GROUND_Y - 5;
    }

    function queueJump() {
      jumpBufferedAt = performance.now();
      input.jumpHeld = true;
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

      input.left = phase === 'left';
      input.right = phase === 'right' || phase === 'slide';

      if (phase === 'jump' && !computerJumpQueued && isGrounded(state.player)) {
        queueJump();
        computerJumpQueued = true;
      }
      if (phase === 'slide' && !computerSlideQueued) {
        startSlide();
        computerSlideQueued = true;
      }
    }

    function controlKey(event) {
      const key = event.key;
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') return 'left';
      if (key === 'ArrowRight' || key === 'd' || key === 'D') return 'right';
      if (key === 'ArrowUp' || key === 'w' || key === 'W' || key === ' ') return 'jump';
      if (key === 'Shift' || key === 's' || key === 'S') return 'slide';
      return null;
    }

    window.addEventListener('pointerdown', (event) => {
      if (computerMode) return;
      const action = actionFromEvent(event);
      if (!action || action === 'stick') return;
      consume(event);
      lastPointerAt = performance.now();
      event.target?.setPointerCapture?.(event.pointerId);
      if (action === 'left' || action === 'right') setDirection(action, true);
      if (action === 'jump') queueJump();
      if (action === 'slide') startSlide();
    }, { capture: true, passive: false });

    window.addEventListener('pointerup', (event) => {
      if (computerMode) return;
      const action = actionFromEvent(event);
      if (!action || action === 'stick') return;
      consume(event);
      if (action === 'left' || action === 'right') setDirection(action, false);
      if (action === 'jump') releaseJump();
    }, { capture: true, passive: false });

    window.addEventListener('pointercancel', () => {
      if (computerMode) return;
      input.left = false;
      input.right = false;
      releaseJump();
    }, { capture: true, passive: false });

    window.addEventListener('click', (event) => {
      if (computerMode) return;
      const action = actionFromEvent(event);
      if (!action || action === 'stick') return;
      consume(event);
      if (performance.now() - lastPointerAt < 360) return;
      if (action === 'left' || action === 'right') {
        setDirection(action, true);
        window.setTimeout(() => setDirection(action, false), 120);
      }
      if (action === 'jump') queueJump();
      if (action === 'slide') startSlide();
    }, { capture: true, passive: false });

    window.addEventListener('keydown', (event) => {
      if (computerMode) return;
      const action = controlKey(event);
      if (!action) return;
      consume(event);
      if (action === 'left' || action === 'right') setDirection(action, true);
      if (action === 'jump' && !event.repeat) queueJump();
      if (action === 'slide' && !event.repeat) startSlide();
    }, { capture: true, passive: false });

    window.addEventListener('keyup', (event) => {
      if (computerMode) return;
      const action = controlKey(event);
      if (!action) return;
      consume(event);
      if (action === 'left' || action === 'right') setDirection(action, false);
      if (action === 'jump') releaseJump();
    }, { capture: true, passive: false });

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
          smoothVx = approach(smoothVx, slideDirection * 360, 900 * dt);
          player.facing = slideDirection;
          setSlideVisual(true);
        } else {
          setSlideVisual(false);
          const targetSpeed = axis * RUN_SPEED * (grounded ? 1 : AIR_CONTROL);
          smoothVx = approach(smoothVx, targetSpeed, (axis ? RUN_ACCEL : RUN_DECEL) * dt);
          if (axis) player.facing = axis < 0 ? -1 : 1;
        }

        if (!axis && !slideActive && Math.abs(smoothVx) < 4) smoothVx = 0;
        player.vx = smoothVx;
        player.x = clamp(player.x + smoothVx * dt, 22, DESIGN_WIDTH - player.width - 22);
      }

      window.requestAnimationFrame(movementLoop);
    }

    window.requestAnimationFrame(movementLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
