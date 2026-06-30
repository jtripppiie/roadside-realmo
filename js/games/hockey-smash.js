(function () {
  // Hockey Smash is wrapped in an IIFE so the game does not leak lots of
  // variables into the global browser scope. The only public API is at the
  // bottom: window.RTA_HOCKEY_SMASH.

  // These design constants are the "virtual screen" size. The canvas can scale
  // up or down with CSS, but all game math happens in this 1024x576 world.
  const VERSION = 'Hockey Smash v0.14.47';
  const DESIGN_WIDTH = 1024;
  const DESIGN_HEIGHT = 576;
  const TRANSITION_MS = 2400;

  // Every image used by the game lives here. Keeping paths in one object makes
  // it easy to verify assets and swap art without hunting through drawing code.
  const ASSETS = {
    splash: 'assets/hockey-smash/sprites/splash.webp',
    background01: 'assets/hockey-smash/backgrounds/soldotna_cityscape_background_01_1280x720.webp?v=20260630.84',
    background02: 'assets/hockey-smash/backgrounds/soldotna_cityscape_background_01_1280x720.webp?v=20260630.84',
    background03: 'assets/hockey-smash/backgrounds/soldotna_cityscape_background_01_1280x720.webp?v=20260630.84',
    background04: 'assets/hockey-smash/backgrounds/soldotna_cityscape_background_01_1280x720.webp?v=20260630.84',
    background05: 'assets/hockey-smash/backgrounds/soldotna_cityscape_background_01_1280x720.webp?v=20260630.84',
    daniel: 'assets/hockey-smash/sprites/hockey-player.webp',
    salmon: 'assets/hockey-smash/sprites/salmon.webp',
    bird: 'assets/hockey-smash/sprites/eagle_mid_flap.webp',
    bear: 'assets/hockey-smash/sprites/bear.webp',
    bearWalk1: 'assets/hockey-smash/sprites/bear-1.webp',
    bearWalk2: 'assets/hockey-smash/sprites/bear-2.webp',
    moose: 'assets/hockey-smash/sprites/moose.webp',
    mooseWalk1: 'assets/hockey-smash/sprites/moose-1.webp',
    mooseWalk2: 'assets/hockey-smash/sprites/moose-2.webp',
    mooseWalk3: 'assets/hockey-smash/sprites/moose-3.webp',
    dadMower: 'assets/hockey-smash/sprites/dad.webp',
    dad: 'assets/hockey-smash/sprites/dad.webp',
    mom: 'assets/hockey-smash/sprites/mom.webp',
    sister: 'assets/hockey-smash/sprites/sister-spinning.webp',
    danceInstructor: 'assets/hockey-smash/sprites/dance_instructor.webp',
  };
  const BACKGROUND_SEQUENCE = ['background01', 'background02', 'background03', 'background04', 'background05'];
  const DEFERRED_ASSETS = new Set();
  const WALK_FRAME_KEYS = {
    bear: ['bearWalk1', 'bearWalk2'],
    moose: ['mooseWalk1', 'mooseWalk2', 'mooseWalk3'],
    chargingMoose: ['mooseWalk1', 'mooseWalk2', 'mooseWalk3'],
  };

  // TUNING is the game's feel panel. If movement is too slow, jumps are too
  // floaty, or the ground feels wrong, start by changing these numbers.
  const TUNING = {
    walkSpeed: 285,
    slideSpeed: 455,
    jumpVelocity: 810,
    gravity: 2250,
    // The Soldotna backgrounds already include the sidewalk near the bottom of
    // the artwork. This shared ground line places every character's feet on
    // that sidewalk instead of floating over the storefronts.
    groundRatio: 0.82,
    comboWindow: 420,
    invincibleMs: 760,
  };

  // A small state machine keeps screens understandable: splash, transition,
  // playing, boss intro, boss fight, or try-again.
  const STATE = {
    SPLASH: 'splash',
    TRANSITION: 'transition',
    PLAYING: 'playing',
    BOSS_INTRO: 'bossIntro',
    BOSS_FIGHT: 'bossFight',
    TRY_AGAIN: 'tryAgain',
  };

  // Computer mode is a built-in tester. It presses virtual controls in this
  // order so we can see if right, left, jump, slide, and stick attacks work.
  const COMPUTER_PHASES = [
    { name: 'right', label: 'Move right', duration: 1.1, actions: ['right'] },
    { name: 'left', label: 'Move left', duration: 1.1, actions: ['left'] },
    { name: 'jump', label: 'Jump', duration: 0.9, actions: [] },
    { name: 'slide', label: 'Slide right', duration: 1.0, actions: ['right', 'slide'] },
    { name: 'stick', label: 'Stick swing', duration: 1.0, actions: ['stick'] },
  ];

  // Runtime variables. These change while the game runs.
  let state = null;
  let elements = {};
  let raf = 0;
  let lastFrame = 0;
  let transitionTimer = 0;
  const keys = new Set();
  const pointers = new Map();
  const images = {};
  const missingAssets = [];
  let lastReadyBackgroundKey = 'background01';

  function start() {
    // Boot order matters: find DOM nodes, start image loading, wire controls,
    // then show the splash screen.
    cacheElements();
    preloadAssets();
    bindEvents();
    showSplash();
    drawSplashPreview();
  }

  function cacheElements() {
    // Store DOM lookups once. Reusing these references is cleaner and faster
    // than calling document.getElementById all over the game loop.
    elements = {
      body: document.body,
      splash: document.getElementById('hockey-splash'),
      transition: document.getElementById('hockey-transition'),
      game: document.getElementById('hockey-game'),
      tryAgain: document.getElementById('hockey-try-again'),
      play: document.getElementById('hockey-play'),
      retry: document.getElementById('hockey-retry'),
      canvas: document.getElementById('hockey-canvas'),
      health: document.getElementById('hockey-health'),
      status: document.getElementById('hockey-status'),
      debug: document.getElementById('hockey-debug'),
      rotate: document.getElementById('hockey-rotate'),
    };
  }

  function preloadAssets() {
    // Images load asynchronously. When each image finishes, render once so the
    // player sees art appear as soon as the browser has it.
    Object.entries(ASSETS).forEach(([key, src]) => {
      if (!DEFERRED_ASSETS.has(key)) loadAsset(key, src);
    });
  }

  function loadAsset(key, src = ASSETS[key]) {
    if (!src || images[key]) return images[key];
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      render();
    };
    image.onerror = () => {
      missingAssets.push(src);
      debugLog('asset', `Missing ${src}; using labeled placeholder.`);
    };
    images[key] = image;
    image.src = src;
    return image;
  }

  function bindEvents() {
    // Keyboard and touch both write into the same `keys` Set. That means the
    // movement code does not care whether input came from WASD, arrow keys, or
    // on-screen buttons.
    elements.play.addEventListener('click', beginTransition);
    elements.retry.addEventListener('click', beginTransition);

    window.addEventListener('keydown', (event) => {
      const action = keyToAction(event.key);
      if (!action || !isGameplayActive()) return;
      event.preventDefault();
      if (action === 'jump') jump();
      if (action === 'stick') swingStick();
      keys.add(action);
    });

    window.addEventListener('keyup', (event) => {
      const action = keyToAction(event.key);
      if (!action) return;
      event.preventDefault();
      keys.delete(action);
    });

    document.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('pointerdown', (event) => {
        // preventDefault keeps mobile taps from scrolling/zooming the page.
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        const action = button.dataset.action;
        pointers.set(event.pointerId, action);
        keys.add(action);
        if (action === 'jump') jump();
        if (action === 'stick') swingStick();
      }, { passive: false });

      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => {
        button.addEventListener(type, (event) => {
          const action = pointers.get(event.pointerId);
          if (action) keys.delete(action);
          pointers.delete(event.pointerId);
        });
      });
    });

    window.addEventListener('resize', () => {
      updateRotateHint();
      render();
    });

    window.addEventListener('orientationchange', updateRotateHint);
    window.addEventListener('contextmenu', (event) => {
      if (isGameplayActive()) event.preventDefault();
    });
  }

  function keyToAction(key) {
    // Convert physical keyboard keys into game actions. After this point, the
    // game only thinks in actions: left, right, jump, slide, and stick.
    return {
      ArrowLeft: 'left',
      a: 'left',
      A: 'left',
      ArrowRight: 'right',
      d: 'right',
      D: 'right',
      ArrowUp: 'jump',
      w: 'jump',
      W: 'jump',
      j: 'jump',
      J: 'jump',
      ArrowDown: 'slide',
      Shift: 'slide',
      s: 'slide',
      S: 'slide',
      f: 'stick',
      F: 'stick',
      ' ': 'stick',
      Enter: 'stick',
    }[key] || null;
  }

  function beginTransition() {
    showTransition();
    window.clearTimeout(transitionTimer);
    transitionTimer = window.setTimeout(startLevel, isComputerMode() ? 900 : TRANSITION_MS);
  }

  function showSplash() {
    stopLoop();
    state = createState(STATE.SPLASH);
    elements.body.classList.remove('hockey-playing');
    elements.splash.hidden = false;
    elements.transition.hidden = true;
    elements.game.hidden = true;
    elements.tryAgain.hidden = true;
    if (elements.debug) elements.debug.textContent = isComputerMode() ? 'Computer mode armed.' : 'Debug waiting...';
    if (isComputerMode()) {
      window.setTimeout(() => {
        if (state?.mode === STATE.SPLASH) beginTransition();
      }, 1800);
    }
  }

  function showTransition() {
    stopLoop();
    state = createState(STATE.TRANSITION);
    elements.body.classList.add('hockey-playing');
    elements.splash.hidden = true;
    elements.transition.hidden = false;
    elements.game.hidden = true;
    elements.tryAgain.hidden = true;
  }

  function startLevel() {
    state = createState(STATE.PLAYING);
    elements.body.classList.add('hockey-playing');
    elements.splash.hidden = true;
    elements.transition.hidden = true;
    elements.tryAgain.hidden = true;
    elements.game.hidden = false;
    updateRotateHint();
    lastFrame = performance.now();
    loop(lastFrame);
  }

  function showTryAgain() {
    stopLoop();
    state.mode = STATE.TRY_AGAIN;
    elements.body.classList.remove('hockey-playing');
    elements.game.hidden = true;
    elements.tryAgain.hidden = false;
  }

  function createState(mode) {
    // This is the complete "new game" state. If a kid wants to add coins,
    // score, or power-ups, this is where those values would first appear.
    const groundY = DESIGN_HEIGHT * TUNING.groundRatio;
    return {
      mode,
      time: 0,
      message: 'Daniel is ready.',
      salmonRunStarted: false,
      salmonRunTimer: 0,
      bossIntroTimer: 0,
      spawn: { wildlife: 4.0, salmon: 0.35, family: 12.0, dadJoke: 12.0 },
      player: {
        x: 132,
        y: groundY - 108,
        width: 104,
        height: 108,
        vx: 0,
        vy: 0,
        facing: 1,
        grounded: true,
        health: 100,
        invincible: 0,
        combo: 0,
        lastSwing: 0,
        attackTimer: 0,
      },
      entities: [],
      effects: [],
      dad: null,
      computer: createComputerState(),
    };
  }

  function loop(now) {
    // requestAnimationFrame calls this around 60 times per second. `dt` means
    // "delta time": how many seconds passed since the previous frame. Movement
    // uses dt so the game speed stays consistent on fast and slow screens.
    const dt = Math.min(0.033, (now - lastFrame) / 1000 || 0);
    lastFrame = now;
    update(dt);
    render();
    raf = window.requestAnimationFrame(loop);
  }

  function stopLoop() {
    window.cancelAnimationFrame?.(raf);
    raf = 0;
    keys.clear();
    pointers.clear();
  }

  function update(dt) {
    // Update is the game brain. It changes numbers: positions, timers, health,
    // spawned obstacles, and debug text. Drawing happens later in render().
    if (!isGameplayActive()) return;
    state.time += dt;
    updateComputer(dt);
    updatePlayer(dt);
    updateSpawns(dt);
    updateEntities(dt);
    updateBoss(dt);
    updateHud();
  }

  function updatePlayer(dt) {
    const player = state.player;
    // Left is -1, right is +1, both or neither becomes 0. This tiny formula is
    // the whole side-scroller movement input.
    const move = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    const speed = keys.has('slide') ? TUNING.slideSpeed : TUNING.walkSpeed;
    player.vx = move * speed;
    if (move) player.facing = move;
    player.x = clamp(player.x + player.vx * dt, 22, DESIGN_WIDTH - player.width - 22);

    // Jumping is just vertical velocity plus gravity. Gravity pulls the player
    // down every frame until their feet reach the invisible ground line.
    player.vy += TUNING.gravity * dt;
    player.y += player.vy * dt;
    const groundY = DESIGN_HEIGHT * TUNING.groundRatio;
    if (player.y + player.height >= groundY) {
      player.y = groundY - player.height;
      player.vy = 0;
      player.grounded = true;
    }
    player.invincible = Math.max(0, player.invincible - dt);
    player.attackTimer = Math.max(0, player.attackTimer - dt);
  }

  function createComputerState() {
    // Computer mode stores pass/fail flags so the debug overlay can prove which
    // controls have actually moved the player.
    const enabled = isComputerMode();
    return {
      enabled,
      timer: 0,
      phaseIndex: 0,
      phaseName: enabled ? COMPUTER_PHASES[0].name : 'manual',
      phaseStartedX: 132,
      jumpFired: false,
      results: {
        movedRight: false,
        movedLeft: false,
        jumped: false,
        slid: false,
        swung: false,
        clearedObstacle: false,
      },
    };
  }

  function updateComputer(dt) {
    if (!state.computer?.enabled) return;
    const computer = state.computer;
    const phase = COMPUTER_PHASES[computer.phaseIndex];
    // The computer clears movement keys each frame, then presses the keys for
    // the current test phase. This uses the same key Set as real players.
    keys.delete('left');
    keys.delete('right');
    keys.delete('slide');
    phase.actions.forEach((action) => keys.add(action));

    if (phase.name === 'jump' && !computer.jumpFired && state.player.grounded) {
      jump();
    }

    if (phase.name === 'jump' && !computer.jumpFired && state.player.grounded) {
      jump();
      computer.jumpFired = true;
    }
    if (phase.name === 'stick' && !computer.jumpFired) {
      swingStick();
      computer.jumpFired = true;
    }

    const groundY = DESIGN_HEIGHT * TUNING.groundRatio;
    computer.results.movedRight ||= state.player.x > 132 + 34;
    computer.results.movedLeft ||= phase.name === 'left' && state.player.x < computer.phaseStartedX - 34;
    computer.results.jumped ||= state.player.y + state.player.height < groundY - 8;
    computer.results.slid ||= phase.name === 'slide' && Math.abs(state.player.vx) > TUNING.walkSpeed + 40;
    computer.results.swung ||= state.player.attackTimer > 0;
    state.message = `Computer test: ${phase.label}.`;

    computer.timer += dt;
    if (computer.timer < phase.duration) return;

    computer.phaseIndex = (computer.phaseIndex + 1) % COMPUTER_PHASES.length;
    computer.timer = 0;
    computer.phaseName = COMPUTER_PHASES[computer.phaseIndex].name;
    computer.phaseStartedX = state.player.x;
    computer.jumpFired = false;
  }

  function jump() {
    // Only jump from the ground. This avoids infinite air jumps.
    if (!isGameplayActive() || !state.player.grounded) return;
    state.player.vy = -TUNING.jumpVelocity;
    state.player.grounded = false;
    state.message = 'Daniel jumps.';
  }

  function swingStick() {
    // The stick has a simple combo counter: quick repeated swings build up to a
    // stronger third hit.
    if (!isGameplayActive()) return;
    const now = performance.now();
    const player = state.player;
    player.combo = now - player.lastSwing <= TUNING.comboWindow ? Math.min(3, player.combo + 1) : 1;
    player.lastSwing = now;
    player.attackTimer = 0.18;
    state.message = player.combo === 3 ? 'Combo finisher!' : `Stick swing ${player.combo}.`;
    resolveStickHits(player.combo);
  }

  function resolveStickHits(combo) {
    // Combat uses rectangle overlap. If the attack rectangle touches an
    // obstacle rectangle, that obstacle loses HP.
    const attack = attackBox();
    const damage = combo === 3 ? 3 : combo;
    state.entities.forEach((entity) => {
      if (entity.dead || !rectsOverlap(attack, entity)) return;
      entity.hp -= damage;
      state.effects.push({ x: entity.x, y: entity.y, text: 'SMASH!', life: 0.35 });
      if (entity.hp <= 0) {
        entity.dead = true;
        if (entity.type === 'bear' || entity.type === 'moose') state.computer.results.clearedObstacle = true;
        state.message = clearMessage(entity.type);
      }
    });
    if (state.dad && !state.dad.dead && rectsOverlap(attack, state.dad)) {
      state.dad.hp -= damage;
      state.effects.push({ x: state.dad.x + 18, y: state.dad.y - 12, text: 'DAD!', life: 0.35 });
      if (state.dad.hp <= 0) {
        state.dad.dead = true;
        state.message = 'Dad laughs, then admits defeat.';
      }
    }
  }

  function attackBox() {
    const p = state.player;
    // The attack box sits in front of the player and flips sides based on
    // facing. Make this bigger/smaller to change how forgiving stick hits feel.
    return {
      x: p.facing > 0 ? p.x + p.width - 12 : p.x - 92,
      y: p.y + 28,
      width: 104,
      height: 72,
    };
  }

  function stagedPhase() {
    return document.body.dataset.hockeyStagePhase || '';
  }

  function readyCountdownActive() {
    return Boolean(state?.readyCountdownActive || (typeof state?.readyCountdownSeconds === 'number' && state.readyCountdownSeconds > 0.1));
  }

  function updateSpawns(dt) {
    // Spawn timers count down to zero. When a timer reaches zero, we create a
    // new obstacle and reset that timer.
    if (state.mode === STATE.BOSS_FIGHT) return;
    const phase = stagedPhase();
    if (readyCountdownActive()) return;

    if (phase === 'salmonRun') {
      state.spawn.salmon -= dt;
      if (state.spawn.salmon <= 0) {
        spawnSalmon();
        state.spawn.salmon = 0.34 + Math.random() * 0.28;
      }
      return;
    }

    state.spawn.wildlife -= dt;
    state.spawn.salmon -= dt;
    state.spawn.family -= dt;

    if (state.spawn.wildlife <= 0) {
      spawnWildlife();
      state.spawn.wildlife = 2.2 + Math.random() * 2.4;
    }
    if (state.spawn.salmon <= 0) {
      spawnSalmon();
      state.spawn.salmon = 1.1 + Math.random() * 1.2;
    }
    if (state.spawn.family <= 0) {
      spawnFamily();
      state.spawn.family = 6 + Math.random() * 4;
    }

    if (!phase && state.time > 26 && !state.salmonRunStarted) {
      state.salmonRunStarted = true;
      state.salmonRunTimer = 6.5;
      state.message = 'Major salmon run!';
    }

    if (!phase && state.salmonRunStarted) {
      state.salmonRunTimer -= dt;
      if (state.salmonRunTimer <= 0) {
        state.mode = STATE.BOSS_INTRO;
        state.bossIntroTimer = 2.4;
        state.entities = state.entities.filter((entity) => entity.type !== 'salmon');
        state.message = 'A mower rumbles into view...';
      }
    }
  }

  function updateBoss(dt) {
    if (stagedPhase()) {
      state.dad = null;
      if (state.mode === STATE.BOSS_INTRO || state.mode === STATE.BOSS_FIGHT) state.mode = STATE.PLAYING;
      return;
    }
    if (state.mode === STATE.BOSS_INTRO) {
      state.bossIntroTimer -= dt;
      if (state.bossIntroTimer <= 0) {
        state.mode = STATE.BOSS_FIGHT;
        state.dad = { type: 'dad', x: DESIGN_WIDTH - 174, y: DESIGN_HEIGHT * TUNING.groundRatio - 96, width: 96, height: 96, hp: 18, maxHp: 18 };
        state.message = 'Dad boss: awkward jokes incoming.';
      }
    }
    if (state.mode !== STATE.BOSS_FIGHT || !state.dad || state.dad.dead) return;
    state.spawn.dadJoke -= dt;
    if (state.spawn.dadJoke <= 0) {
      spawnDadJoke();
      state.spawn.dadJoke = 1.45 + Math.random() * 1.2;
    }
  }

  function spawnWildlife() {
    // Bears and moose are the first true stick obstacles: they come from the
    // right, have HP, and should be cleared by swinging.
    const type = Math.random() > 0.55 ? 'moose' : 'bear';
    const width = type === 'moose' ? 112 : 96;
    const height = type === 'moose' ? 92 : 84;
    state.entities.push({
      type,
      x: DESIGN_WIDTH + 40,
      y: DESIGN_HEIGHT * TUNING.groundRatio - height,
      width,
      height,
      vx: type === 'moose' ? -160 : -190,
      hp: type === 'moose' ? 3 : 2,
      maxHp: type === 'moose' ? 3 : 2,
      damage: type === 'moose' ? 16 : 12,
    });
    state.message = `${type === 'moose' ? 'Moose' : 'Bear'} obstacle incoming. Swing the stick!`;
  }

  function spawnSalmon() {
    const width = 54;
    const height = 31;
    state.entities.push({
      type: 'salmon',
      x: 36 + Math.random() * (DESIGN_WIDTH - width - 72),
      y: -height - Math.random() * 90,
      width,
      height,
      vx: -80 + Math.random() * 160,
      vy: 420 + Math.random() * 150,
      hp: 1,
      damage: 0,
      dodgeDamage: 8,
      fallingFish: true,
      variant: 'rain',
      flip: Math.random() > 0.5 ? 1 : -1,
    });
  }

  function spawnFamily() {
    if (stagedPhase() === 'salmonRun') return;
    const type = modeAdultType();
    if (type === 'mom') {
      state.effects.push({
        x: DESIGN_WIDTH - 190,
        y: DESIGN_HEIGHT * TUNING.groundRatio - 132,
        text: 'Clean your room!',
        life: 2.2,
      });
      state.message = 'Mom says: Clean your room!';
      return;
    }
    const label = type === 'danceInstructor' ? 'Dance instructor' : 'Mom';
    state.entities.push({
      type,
      x: DESIGN_WIDTH - 160,
      y: DESIGN_HEIGHT * TUNING.groundRatio - 96,
      width: 96,
      height: 96,
      vx: -80,
      hp: 3,
      damage: 6,
      bubble: 'Point those toes!',
    });
    state.message = `${label} challenge incoming. Keep moving!`;
  }

  function modeAdultType() {
    const config = window.RTA_HOCKEY_SMASH?.getPlayerConfig?.();
    const character = config?.character || state?.playerCharacter || state?.player?.character || 'daniel';
    return character === 'sofie' ? 'danceInstructor' : 'mom';
  }

  function spawnDadJoke() {
    const jokes = ['Ice to meet you!', 'That was slapshot comedy!', 'Mow problems, mow jokes.'];
    state.entities.push({
      type: 'dadJoke',
      x: state.dad.x - 48,
      y: state.dad.y - 34,
      width: 185,
      height: 54,
      vx: -230,
      hp: 2,
      damage: 10,
      bubble: jokes[Math.floor(Math.random() * jokes.length)],
    });
  }

  function updateEntities(dt) {
    // Every entity moves by velocity. If it overlaps the player, it causes
    // damage. Dead or far-off entities get removed to keep the game light.
    state.entities.forEach((entity) => {
      if (entity.type === 'chargingMoose' && entity.x < 600 && !entity.charging) {
        entity.charging = true;
        entity.vx = -Math.abs(entity.chargeSpeed || 480);
        state.effects.push({ x: entity.x + entity.width / 2, y: entity.y - 16, text: 'CHARGE!', life: 0.45 });
      }
      entity.x += (entity.vx || 0) * dt;
      entity.y += (entity.vy || 0) * dt;
      if (entity.type === 'salmon') entity.vy += 460 * dt;
      if (!entity.dead && rectsOverlap(entity, state.player)) {
        damagePlayer(entity.damage ?? 8);
      }
    });
    state.entities = state.entities.filter((entity) => !entity.dead && entity.x > -260 && entity.x < DESIGN_WIDTH + 260 && entity.y < DESIGN_HEIGHT + 120);
    state.effects.forEach((effect) => { effect.life -= dt; effect.y -= 24 * dt; });
    state.effects = state.effects.filter((effect) => effect.life > 0);
  }

  function damagePlayer(amount) {
    if (state.player.invincible > 0) return;
    state.player.health = Math.max(0, state.player.health - amount);
    state.player.invincible = TUNING.invincibleMs / 1000;
    state.message = `Daniel takes ${amount} damage.`;
    if (state.player.health <= 0) showTryAgain();
  }

  function render() {
    // Render is the game artist. It reads the current state and paints the
    // screen from back to front: background, obstacles, boss, player, effects.
    if (!elements.canvas) return;
    const ctx = elements.canvas.getContext('2d');
    ctx.clearRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    drawBackground(ctx);
    drawGround(ctx);
    if (!state || state.mode === STATE.SPLASH || state.mode === STATE.TRANSITION) return;
    state.entities.forEach((entity) => drawEntity(ctx, entity));
    if (!stagedPhase() && state.mode === STATE.BOSS_INTRO) drawSpriteOrPlaceholder(ctx, 'dadMower', DESIGN_WIDTH - 168, DESIGN_HEIGHT * TUNING.groundRatio - 96, 96, 96, 'DAD MOWER');
    if (state.dad && !state.dad.dead) drawDad(ctx);
    drawDaniel(ctx);
    drawEffects(ctx);
  }

  function drawSplashPreview() {
    if (!elements.canvas) return;
    render();
  }

  function drawBackground(ctx) {
    // Backgrounds are 1920x1080 art files. drawCoverImage crops them like a CSS
    // background-size: cover image so the canvas is always filled.
    const key = backgroundKeyForState();
    loadAsset(key);
    const bg = images[key];
    if (bg?.complete && bg.naturalWidth) {
      lastReadyBackgroundKey = key;
      drawCoverImage(ctx, bg, 0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      return;
    }
    const fallbackBg = images[lastReadyBackgroundKey];
    if (fallbackBg?.complete && fallbackBg.naturalWidth) {
      drawCoverImage(ctx, fallbackBg, 0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      return;
    }
    ctx.fillStyle = '#7ec9f2';
    ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
  }

  function backgroundKeyForState() {
    return BACKGROUND_SEQUENCE[0];
  }

  function drawCoverImage(ctx, image, x, y, width, height) {
    // Canvas does not have object-fit: cover, so this helper calculates the
    // source crop manually before drawing.
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sw = width / scale;
    const sh = height / scale;
    const sx = (image.naturalWidth - sw) / 2;
    const sy = (image.naturalHeight - sh) / 2;
    ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
  }

  function drawGround(ctx) {
    // Collision still uses groundRatio; the visual floor is supplied by the background art.
  }

  function drawDaniel(ctx) {
    // Draw the player. When facing left, we flip the canvas horizontally and
    // draw the same sprite, instead of needing a second left-facing image.
    const p = state.player;
    ctx.save();
    if (p.invincible > 0 && Math.floor(performance.now() / 80) % 2 === 0) ctx.globalAlpha = 0.55;
    if (p.facing < 0) {
      ctx.translate(p.x + p.width, p.y);
      ctx.scale(-1, 1);
      drawSpriteOrPlaceholder(ctx, 'daniel', 0, 0, p.width, p.height, 'DANIEL');
    } else {
      drawSpriteOrPlaceholder(ctx, 'daniel', p.x, p.y, p.width, p.height, 'DANIEL');
    }
    ctx.restore();
    if (isComputerMode() && p.attackTimer > 0) {
      const box = attackBox();
      ctx.fillStyle = 'rgba(255, 242, 120, 0.45)';
      ctx.fillRect(box.x, box.y, box.width, box.height);
    }
  }

  function drawEntity(ctx, entity) {
    // Different entity types can draw differently. Dad jokes are speech bubbles;
    // wildlife and family use sprites.
    if (entity.type === 'dadJoke') {
      drawBubble(ctx, entity.x, entity.y, entity.width, entity.height, entity.bubble, '#fff7d6');
      return;
    }
    drawSpriteOrPlaceholder(ctx, entityAssetKey(entity), entity.x, entity.y, entity.width, entity.height, entity.type.toUpperCase());
    if (isComputerMode() && (entity.type === 'bear' || entity.type === 'moose' || entity.type === 'chargingMoose')) drawObstacleLabel(ctx, entity);
    if (entity.bubble) drawBubble(ctx, entity.x - 178, entity.y - 26, 210, 58, entity.bubble, '#fff7d6');
  }

  function entityAssetKey(entity) {
    const walkFrames = WALK_FRAME_KEYS[entity.type];
    if (!walkFrames) return entity.type;
    const frame = Math.floor((state?.time || 0) * 5) % walkFrames.length;
    return walkFrames[frame];
  }

  function drawObstacleLabel(ctx, entity) {
    // Obstacles teach the player what to do: "HIT IT" plus a small HP bar. Make
    // this visible in computer mode so debugging never depends on guessing.
    const hp = Math.max(0, entity.hp || 0);
    const max = Math.max(1, entity.maxHp || hp || 1);
    const barW = entity.width;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(entity.x, entity.y - 26, barW, 18);
    ctx.fillStyle = '#fff27a';
    ctx.fillRect(entity.x + 3, entity.y - 23, Math.max(0, (barW - 6) * (hp / max)), 12);
    ctx.fillStyle = '#111827';
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillText('HIT IT', entity.x + 8, entity.y - 13);
  }

  function drawDad(ctx) {
    drawSpriteOrPlaceholder(ctx, 'dad', state.dad.x, state.dad.y, state.dad.width, state.dad.height, 'DAD');
    drawBubble(ctx, state.dad.x - 210, state.dad.y - 24, 220, 58, 'Dad joke boss!', '#fff7d6');
  }

  function drawEffects(ctx) {
    state.effects.forEach((effect) => {
      ctx.save();
      ctx.globalAlpha = clamp(effect.life / 0.6, 0, 1);
      ctx.fillStyle = '#fff27a';
      ctx.font = '700 20px system-ui, sans-serif';
      ctx.fillText(effect.text, effect.x, effect.y);
      ctx.restore();
    });
  }

  function drawBubble(ctx, x, y, width, height, text, fill) {
    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 3;
    roundRect(ctx, x, y, width, height, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#111827';
    ctx.font = '700 14px system-ui, sans-serif';
    wrapText(ctx, text, x + 12, y + 24, width - 24, 16);
    ctx.restore();
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text).split(' ');
    let line = '';
    words.forEach((word, index) => {
      const test = `${line}${word} `;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line.trim(), x, y);
        line = `${word} `;
        y += lineHeight;
      } else {
        line = test;
      }
      if (index === words.length - 1) ctx.fillText(line.trim(), x, y);
    });
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function updateHud() {
    if (!elements.health || !state?.player) return;
    elements.health.value = state.player.health;
    elements.health.textContent = `${state.player.health} health`;
    if (elements.status) elements.status.textContent = state.message;
    if (elements.debug) {
      const computer = state.computer || {};
      elements.debug.textContent = [
        VERSION,
        `Mode: ${state.mode}`,
        `Player: ${Math.round(state.player.x)}, ${Math.round(state.player.y)}`,
        `Entities: ${state.entities.length}`,
        `Computer: ${computer.enabled ? computer.phaseName : 'off'}`,
        computer.enabled ? `Checks: R${+computer.results.movedRight} L${+computer.results.movedLeft} J${+computer.results.jumped} S${+computer.results.slid} A${+computer.results.swung} C${+computer.results.clearedObstacle}` : '',
      ].filter(Boolean).join(' | ');
    }
  }

  function clearMessage(type) {
    return {
      bear: 'Bear cleared!',
      moose: 'Moose cleared!',
      chargingMoose: 'Charging moose stopped!',
      salmon: 'Salmon swatted away!',
      mom: 'Mom says she will check later.',
      danceInstructor: 'Dance instructor gives a dramatic bow.',
      dadJoke: 'Dad joke blocked!',
    }[type] || 'Obstacle cleared!';
  }

  function updateRotateHint() {
    if (!elements.rotate) return;
    const narrow = window.innerWidth < 720 && window.innerHeight > window.innerWidth;
    elements.rotate.hidden = !narrow;
  }

  function isGameplayActive() {
    return state?.mode === STATE.PLAYING || state?.mode === STATE.BOSS_INTRO || state?.mode === STATE.BOSS_FIGHT;
  }

  function isComputerMode() {
    return new URLSearchParams(window.location.search).get('computerMode') === '1';
  }

  function debugLog(source, message) {
    if (window.HOCKEY_BOOT_LOG?.log) window.HOCKEY_BOOT_LOG.log(source, message);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  // Start once DOM is ready. This works whether the script loaded before or
  // after the browser finished parsing the document.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  // Small public API for add-on files and tests. Avoid exposing the whole module.
  window.RTA_HOCKEY_SMASH = {
    getState: () => state,
    getVersion: () => VERSION,
    tuning: TUNING,
    assets: ASSETS,
  };
})();
