(function () {
  /*
   * Hockey Smash final safety / release layer.
   *
   * Think of the game as a stack of named layers:
   * 1. `js/games/hockey-smash.js` draws the first version of the game.
   * 2. The feature files add movement, encounters, projectiles, score, and UI.
   * 3. This file owns small safety rules, debug-mode guards, and countdown fixes.
   *
   * Kid-friendly rule: do not put a giant new game system here. If a feature gets
   * big, make a new file, name it clearly, load it after this one, and document it
   * in README.md, CHANGELOG.md, and docs/hockey-smash-kid-handoff.md.
   */
  const DISPLAY_VERSION = 'Hockey Smash v0.13.5';
  const DISPLAY_BUILD = 'Build 2026-06-29.51';
  const DEV_STORAGE_KEY = 'hockeySmashDevModeSession';
  const DEV_TAP_WINDOW_MS = 1500;
  const DEV_TAP_TARGET = 3;

  // The player asked for a short pause after Start Game so a new player can look
  // at the D-pad, Jump, Slide, and action buttons before enemies start moving.
  const START_COUNTDOWN_SECONDS = 10;

  // These are the things that can hurt or distract the player. During the
  // countdown, we remove these so the player has a safe practice moment.
  const HAZARD_TYPES = new Set(['salmon', 'bear', 'moose', 'dad', 'sister', 'teacher', 'danceInstructor', 'dadJoke']);

  // WeakMap lets us remember "when did this exact run start?" without writing a
  // permanent global variable into the core game state. New run = new state object.
  const countdownStartByState = new WeakMap();
  let devTapCount = 0;
  let firstDevTapAt = 0;
  let devModeEnabled = false;
  let countdownBadge = null;

  function actionFromTarget(target) {
    // Debug helper: turns a clicked/tapped button into a simple word like left,
    // right, jump, slide, or stick.
    return target?.closest?.('[data-action]')?.dataset?.action || 'none';
  }

  function describeTarget(target) {
    // Debug helper: writes down exactly which DOM element was touched.
    if (!target) return 'missing-target';
    const button = target.closest?.('[data-action]');
    if (button) return `[data-action=${button.dataset.action}] class=${button.className || 'none'}`;
    return `${target.tagName || 'unknown'}#${target.id || 'no-id'}.${target.className || 'no-class'}`;
  }

  function stateSummary() {
    // Debug helper: this is the short "where is the player right now?" line.
    const state = window.RTA_HOCKEY_SMASH?.getState?.();
    const player = state?.player;
    if (!state || !player) return 'state/player missing';
    const countdown = state.readyCountdownActive ? ` countdown=${Math.ceil(state.readyCountdownSeconds || 0)}` : '';
    return `mode=${state.mode} x=${Math.round(player.x)} y=${Math.round(player.y)} vx=${Math.round(player.vx || 0)} vy=${Math.round(player.vy || 0)} grounded=${player.grounded ? 1 : 0}${countdown}`;
  }

  function log(source, event, extra) {
    // Sends useful button/state notes to the hidden dev log.
    const message = `${event} action=${extra?.action || 'none'} ${extra?.detail || ''} | ${stateSummary()}`;
    window.HOCKEY_BOOT_LOG?.log?.(source, message);
  }

  function normalizeSofieLabels() {
    // Older layers can accidentally rewrite this button. This final pass keeps it
    // simple: the button should say Sofie, not a longer old label.
    document.querySelectorAll('[data-character="sofie"]').forEach((button) => {
      if (button.textContent.trim() !== 'Sofie') button.textContent = 'Sofie';
      button.setAttribute('aria-label', 'Choose Sofie');
    });
  }

  function lockAccidentalCameraShake() {
    // The score layer can shake the canvas for impact. That is cool only when it
    // is intentional. This removes accidental leftover transforms every frame.
    const canvas = document.getElementById('hockey-canvas');
    if (!canvas) return;
    if (canvas.dataset.shaking === 'true' || canvas.style.transform) {
      canvas.style.transform = '';
      delete canvas.dataset.shaking;
    }
  }

  function isComputerMode() {
    // Computer Mode is a test driver. It should not wait through the 10-second
    // practice countdown because automated testing should start quickly.
    return new URLSearchParams(window.location.search).get('computerMode') === '1';
  }

  function shouldAutoEnableDevMode() {
    // Dev mode appears only when asked for through the URL, Computer Mode, or a
    // same-tab session unlock. Normal players do not see debug controls.
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === '1' || params.get('dev') === '1' || params.get('computerMode') === '1') return true;
    try {
      return window.sessionStorage.getItem(DEV_STORAGE_KEY) === 'true';
    } catch (error) {
      return false;
    }
  }

  function setDevElementState(enabled) {
    // Show or hide developer-only UI without removing it from the page.
    const watch = document.getElementById('hockey-watch');
    if (watch) {
      watch.hidden = !enabled;
      watch.setAttribute('aria-hidden', enabled ? 'false' : 'true');
      if (enabled) watch.removeAttribute('tabindex');
      else watch.setAttribute('tabindex', '-1');
    }

    const bootLog = document.getElementById('hockey-boot-log');
    if (bootLog) {
      bootLog.hidden = !enabled;
      bootLog.setAttribute('aria-hidden', enabled ? 'false' : 'true');
    }
  }

  function enableDevMode(reason) {
    // This reveals Computer Play and the debug log after the secret splash-image
    // triple tap, or automatically for URLs like ?debug=1 and ?computerMode=1.
    devModeEnabled = true;
    document.body.classList.add('hockey-dev-mode');
    document.body.dataset.hockeyDevMode = 'true';
    setDevElementState(true);
    try {
      window.sessionStorage.setItem(DEV_STORAGE_KEY, 'true');
    } catch (error) {
      // sessionStorage can be unavailable in strict/private browsing contexts.
    }
    window.HOCKEY_BOOT_LOG?.log?.('dev', `Dev mode enabled: ${reason || 'manual unlock'}.`);
    window.HOCKEY_BOOT_LOG?.snapshot?.('dev-mode-enabled');
  }

  function disableDevModeByDefault() {
    // Normal players get the clean splash screen with only Start Game visible.
    devModeEnabled = false;
    document.body.classList.remove('hockey-dev-mode');
    document.body.dataset.hockeyDevMode = 'false';
    setDevElementState(false);
  }

  function bindDevModeUnlock() {
    // Secret dev unlock: tap/click the splash character image three times fast.
    const splashHero = document.getElementById('splash-hero');
    if (!splashHero || splashHero.dataset.devUnlockBound === 'true') return;
    splashHero.dataset.devUnlockBound = 'true';
    splashHero.title = 'Character preview';

    splashHero.addEventListener('pointerup', () => {
      if (devModeEnabled) return;
      const now = performance.now();
      if (!firstDevTapAt || now - firstDevTapAt > DEV_TAP_WINDOW_MS) {
        firstDevTapAt = now;
        devTapCount = 0;
      }
      devTapCount += 1;
      if (devTapCount >= DEV_TAP_TARGET) enableDevMode('splash image triple tap');
    }, { passive: true });
  }

  function ensureCountdownBadge() {
    // Make the countdown message only once, then reuse it every run. It lives in
    // the gameplay screen so the player can see the buttons while waiting.
    if (countdownBadge) return countdownBadge;
    const game = document.getElementById('hockey-game');
    if (!game) return null;
    if (!game.style.position) game.style.position = 'relative';

    countdownBadge = document.createElement('div');
    countdownBadge.id = 'hockey-start-countdown';
    countdownBadge.setAttribute('role', 'status');
    countdownBadge.setAttribute('aria-live', 'polite');
    countdownBadge.hidden = true;
    countdownBadge.style.cssText = [
      'position:absolute',
      'left:50%',
      'top:50%',
      'transform:translate(-50%,-50%)',
      'z-index:40',
      'min-width:min(520px,calc(100% - 2rem))',
      'padding:1rem 1.2rem',
      'border:3px solid #fff27a',
      'border-radius:22px',
      'background:rgba(5,8,13,.88)',
      'color:#fff2cf',
      'box-shadow:0 18px 48px rgba(0,0,0,.45)',
      'text-align:center',
      'font:900 clamp(1.1rem,3vw,2rem)/1.2 system-ui,sans-serif',
      'pointer-events:none',
    ].join(';');
    game.appendChild(countdownBadge);
    return countdownBadge;
  }

  function hideCountdownBadge() {
    // Hide the countdown and remove body flags used by debugging/CSS.
    const badge = ensureCountdownBadge();
    if (badge) badge.hidden = true;
    document.body.classList.remove('hockey-countdown-active');
    delete document.body.dataset.hockeyCountdown;
  }

  function showCountdownBadge(seconds) {
    // Put the big countdown number in the middle of the game screen.
    const badge = ensureCountdownBadge();
    const wholeSeconds = Math.max(1, Math.ceil(seconds));
    if (!badge) return;
    badge.hidden = false;
    badge.innerHTML = `<span style="display:block;color:#fff27a;font-size:1.15em;">${wholeSeconds}</span><span style="display:block;font-size:.52em;letter-spacing:.08em;text-transform:uppercase;">Practice the buttons before the salmon run starts</span>`;
    document.body.classList.add('hockey-countdown-active');
    document.body.dataset.hockeyCountdown = String(wholeSeconds);
  }

  function holdSpawnTimers(state) {
    // The old core game is always counting down spawn timers. During practice
    // mode, keep those timers safely above zero so nothing new appears.
    if (!state?.spawn) return;
    state.spawn.wildlife = Math.max(state.spawn.wildlife || 0, 0.75);
    state.spawn.salmon = Math.max(state.spawn.salmon || 0, 0.75);
    state.spawn.family = Math.max(state.spawn.family || 0, 0.75);
    state.spawn.dadJoke = Math.max(state.spawn.dadJoke || 0, 0.75);
  }

  function clearCountdownHazards(state) {
    // If an older layer already spawned a hazard, remove it during the countdown.
    // This makes the first ten seconds safe even if another script changes timing.
    if (!Array.isArray(state?.entities)) return;
    state.entities = state.entities.filter((entity) => !HAZARD_TYPES.has(entity?.type));
  }

  function runStartCountdown() {
    /*
     * Start countdown brain:
     * - Runs every animation frame.
     * - Starts only after the real gameplay state exists.
     * - Lets the player move/jump/slide/attack during the countdown.
     * - Blocks hazard spawns until the timer reaches zero.
     * - Skips Computer Mode so automated tests still begin quickly.
     */
    const state = window.RTA_HOCKEY_SMASH?.getState?.();
    if (!state?.player || state.mode !== 'playing' || isComputerMode()) {
      hideCountdownBadge();
      return;
    }

    if (!countdownStartByState.has(state)) {
      countdownStartByState.set(state, performance.now());
      state.readyDelayComplete = false;
      window.HOCKEY_BOOT_LOG?.log?.('countdown', '10-second practice countdown started.');
    }

    const elapsedSeconds = (performance.now() - countdownStartByState.get(state)) / 1000;
    const remainingSeconds = Math.max(0, START_COUNTDOWN_SECONDS - elapsedSeconds);

    if (remainingSeconds > 0) {
      // Keep progression at the start line. This prevents the salmon-run/boss
      // timeline from advancing while the player is only practicing controls.
      state.time = 0;
      state.salmonRunStarted = false;
      state.salmonRunTimer = 0;
      state.bossIntroTimer = 0;
      state.dad = null;
      state.readyCountdownActive = true;
      state.readyCountdownSeconds = remainingSeconds;
      state.readyDelayComplete = false;
      state.message = `Get ready: ${Math.ceil(remainingSeconds)} seconds. Practice the buttons!`;
      holdSpawnTimers(state);
      clearCountdownHazards(state);
      showCountdownBadge(remainingSeconds);
      return;
    }

    if (state.readyCountdownActive || !state.readyDelayComplete) {
      // Countdown finished. Release the normal spawn timers, but give the player
      // a tiny extra cushion before the first objects reach them.
      state.readyCountdownActive = false;
      state.readyCountdownSeconds = 0;
      state.readyDelayComplete = true;
      state.message = 'Go! Salmon incoming from the right!';
      if (state.spawn) {
        state.spawn.wildlife = Math.max(state.spawn.wildlife || 0, 1.1);
        state.spawn.salmon = Math.max(state.spawn.salmon || 0, 1.4);
        state.spawn.family = Math.max(state.spawn.family || 0, 3.5);
      }
      hideCountdownBadge();
      window.HOCKEY_BOOT_LOG?.log?.('countdown', 'Practice countdown complete. Hazards released.');
    }
  }

  function forceSalmonFromRight() {
    /*
     * Salmon direction guard:
     *
     * Older builds had a 50/50 chance to create sideways salmon from the left
     * or right. The current design lets rain-style fish fall from the top, while
     * preserving this guard for any older sideways salmon that still appear.
     *
     * This final layer watches all salmon and flips any accidental left-spawned
     * salmon back to the right side. That is safer than editing old core code
     * because older layers can still call the same spawn function.
     */
    const state = window.RTA_HOCKEY_SMASH?.getState?.();
    if (!Array.isArray(state?.entities)) return;
    const canvasWidth = document.getElementById('hockey-canvas')?.width || 1024;

    state.entities.forEach((entity) => {
      if (entity?.type !== 'salmon') return;
      if (entity.fallingFish) return;
      const cameFromLeft = entity.vx > 0 || entity.flip === 1;
      if (!cameFromLeft) return;
      entity.x = canvasWidth + 90 + Math.random() * 36;
      entity.vx = -Math.abs(entity.vx || 390);
      entity.flip = -1;
    });
  }

  function gameplaySafetyLoop() {
    // One small loop owns the two newest gameplay safety rules.
    runStartCountdown();
    forceSalmonFromRight();
    window.requestAnimationFrame(gameplaySafetyLoop);
  }

  function onReady() {
    // Final boot step for this layer. It updates the visible badge/version,
    // locks dev UI, starts debug logging, and begins safety loops.
    const api = window.RTA_HOCKEY_SMASH;
    const badge = document.getElementById('hockey-build-badge');
    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api?.getVersion) api.getVersion = () => DISPLAY_VERSION;
    document.body.dataset.hockeyButtonDebug = 'v0.13.5';

    normalizeSofieLabels();
    if (shouldAutoEnableDevMode()) enableDevMode('debug/dev URL or active session');
    else disableDevModeByDefault();
    bindDevModeUnlock();

    window.HOCKEY_BOOT_LOG?.log?.('safety', 'Normal splash hides dev controls. Triple-tap splash image to unlock dev mode. Start countdown and right-side salmon guard are active.');
    window.HOCKEY_BOOT_LOG?.snapshot?.('safety-ready');

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
      bindDevModeUnlock();
      setDevElementState(devModeEnabled);
      const state = window.RTA_HOCKEY_SMASH?.getState?.();
      if (devModeEnabled && state?.mode === 'playing') window.HOCKEY_BOOT_LOG?.log?.('heartbeat', stateSummary());
    }, 1500);

    function cameraSafetyLoop() {
      lockAccidentalCameraShake();
      window.requestAnimationFrame(cameraSafetyLoop);
    }
    window.requestAnimationFrame(cameraSafetyLoop);
    window.requestAnimationFrame(gameplaySafetyLoop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();
