(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.10.1';
  const DISPLAY_BUILD = 'Build 2026-06-29.22';
  const DESIGN_WIDTH = 1024;
  const GROUND_RATIO = 0.82;
  const RUN_MAX_SPEED = 370;
  const RUN_ACCEL = 1850;
  const RUN_DECEL = 2450;
  const AIR_CONTROL = 0.74;
  const JUMP_SPEED = 855;
  const JUMP_BUFFER_MS = 145;
  const COYOTE_MS = 130;
  const CUT_JUMP_SPEED = 300;
  const SLIDE_SPEED = 560;
  const SLIDE_MS = 320;
  const SLIDE_COOLDOWN_MS = 430;
  const SLIDE_TRANSFORM = 'translateY(15px) scaleX(1.16) scaleY(0.68)';
  const params = new URLSearchParams(window.location.search);
  const computerMode = params.get('computerMode') === '1';

  function clamp(min, value, max) {
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
    const playerOverlay = document.getElementById('hockey-player-overlay');
    const status = document.getElementById('hockey-status');
    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api?.getVersion) api.getVersion = () => DISPLAY_VERSION;
    if (!api || computerMode) return;

    document.body.classList.add('hockey-platformer-feel');

    const originalStopImmediate = Event.prototype.stopImmediatePropagation;
    if (!Event.prototype.__hockeyPlatformerPatched) {
      Event.prototype.stopImmediatePropagation = function patchedStopImmediatePropagation() {
        const target = this.target;
        if (target?.closest?.('.hockey-controls [data-action]')) return;
        return originalStopImmediate.call(this);
      };
      Event.prototype.__hockeyPlatformerPatched = true;
    }

    const input = {
      left: false,
      right: false,
      jumpHeld: false,
      lastPointerAt: 0,
    };

    let vx = 0;
    let lastFrame = performance.now();
    let coyoteUntil = 0;
    let jumpBufferUntil = 0;
    let slideUntil = 0;
    let slideCooldownUntil = 0;
    let slideDirection = 1;

    function getPlayableState() {
      const state = api.getState?.();
      if (!state || !state.player || state.mode === 'splash' || state.mode === 'transition' || state.mode === 'tryAgain') return null;
      return state;
    }

    function playerGroundY(player) {
      return DESIGN_WIDTH ? 576 * GROUND_RATIO - player.height : 0;
    }

    function isGrounded(player) {
      return Boolean(player.grounded) || player.y >= playerGroundY(player) - 5;
    }

    function controlFromEvent(event) {
      return event.target?.closest?.('.hockey-controls [data-action]')?.dataset?.action || null;
    }

    function consume(event) {
      event.preventDefault();
      event.stopPropagation();
      originalStopImmediate.call(event);
    }

    function setSlideVisual(active) {
      document.body.classList.toggle('hockey-slide-active', active);
      if (!playerOverlay) return;
      playerOverlay.dataset.sliding = active ? 'true' : 'false';
      playerOverlay.style.transform = active ? SLIDE_TRANSFORM : '';
      playerOverlay.style.transformOrigin = active ? 'bottom center' : '';
    }

    function queueJump() {
      jumpBufferUntil = performance.now() + JUMP_BUFFER_MS;
      input.jumpHeld = true;
    }

    function releaseJump() {
      input.jumpHeld = false;
      const state = getPlayableState();
      const player = state?.player;
      if (player && player.vy < -CUT_JUMP_SPEED) {
        player.vy = -CUT_JUMP_SPEED;
      }
    }

    function startSlide() {
      const now = performance.now();
      const state = getPlayableState();
      if (!state || now < slideCooldownUntil) return;
      const player = state.player;
      slideDirection = input.left && !input.right ? -1 : input.right && !input.left ? 1 : player.facing < 0 ? -1 : 1;
      slideUntil = now + SLIDE_MS;
      slideCooldownUntil = now + SLIDE_COOLDOWN_MS;
      vx = slideDirection * SLIDE_SPEED;
      player.facing = slideDirection;
      player.vx = vx;
      state.message = 'Daniel slides!';
      if (status) status.textContent = state.message;
      setSlideVisual(true);
    }

    function setDirection(action, active) {
      if (action === 'left') input.left = active;
      if (action === 'right') input.right = active;
    }

    window.addEventListener('pointerdown', (event) => {
      const action = controlFromEvent(event);
      if (!action) return;
      consume(event);
      input.lastPointerAt = performance.now();
      event.target?.setPointerCapture?.(event.pointerId);
      if (action === 'left' || action === 'right') setDirection(action, true);
      if (action === 'jump') queueJump();
      if (action === 'slide') startSlide();
    }, { capture: true, passive: false });

    window.addEventListener('pointerup', (event) => {
      const action = controlFromEvent(event);
      if (action) consume(event);
      input.left = false;
      input.right = false;
      if (action === 'jump') releaseJump();
    }, { capture: true, passive: false });

    window.addEventListener('pointercancel', () => {
      input.left = false;
      input.right = false;
      releaseJump();
    }, { capture: true, passive: false });

    window.addEventListener('click', (event) => {
      const action = controlFromEvent(event);
      if (!action) return;
      consume(event);
      if (performance.now() - input.lastPointerAt < 360) return;
      if (action === 'left' || action === 'right') {
        setDirection(action, true);
        window.setTimeout(() => setDirection(action, false), 120);
      }
      if (action === 'jump') queueJump();
      if (action === 'slide') startSlide();
    }, { capture: true, passive: false });

    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') input.left = true;
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') input.right = true;
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w' || event.code === 'Space') queueJump();
      if (event.key === 'Shift' || event.key.toLowerCase() === 's') startSlide();
    }, { capture: true });

    window.addEventListener('keyup', (event) => {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') input.left = false;
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') input.right = false;
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w' || event.code === 'Space') releaseJump();
    }, { capture: true });

    function movementLoop(now) {
      const state = getPlayableState();
      const dt = clamp(0.008, (now - lastFrame) / 1000 || 0.016, 0.035);
      lastFrame = now;

      if (state?.player) {
        const player = state.player;
        const groundY = playerGroundY(player);
        const grounded = isGrounded(player);
        if (grounded) coyoteUntil = now + COYOTE_MS;

        const slideActive = now < slideUntil;
        const axis = (input.right ? 1 : 0) - (input.left ? 1 : 0);

        if (jumpBufferUntil > now && coyoteUntil > now && !slideActive) {
          player.y = Math.min(player.y, groundY - 3);
          player.vy = -JUMP_SPEED;
          player.grounded = false;
          jumpBufferUntil = 0;
          coyoteUntil = 0;
          state.message = 'Daniel jumps!';
          if (status) status.textContent = state.message;
        }

        if (slideActive) {
          vx = approach(vx, slideDirection * (SLIDE_SPEED * 0.68), RUN_DECEL * 0.38 * dt);
          player.facing = slideDirection;
          setSlideVisual(true);
        } else {
          setSlideVisual(false);
          const max = RUN_MAX_SPEED * (grounded ? 1 : AIR_CONTROL);
          const target = axis * max;
          const accel = axis ? RUN_ACCEL : RUN_DECEL;
          vx = approach(vx, target, accel * dt);
          if (axis) player.facing = axis < 0 ? -1 : 1;
        }

        if (Math.abs(vx) < 2 && !axis && !slideActive) vx = 0;
        player.vx = vx;
        player.x = clamp(22, player.x + vx * dt, DESIGN_WIDTH - player.width - 22);
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
