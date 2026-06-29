(function () {
  const VERSION = 'Hockey Smash v0.5.0';
  const DESIGN_WIDTH = 1024;
  const DESIGN_HEIGHT = 576;
  const TRANSITION_MS = 2400;
  const ASSETS = {
    background01: 'assets/roadside-realm/backgrounds/soldotna_cityscape_background_01_1920x1080.png',
    background02: 'assets/roadside-realm/backgrounds/soldotna_cityscape_background_02_1920x1080.png',
    background03: 'assets/roadside-realm/backgrounds/soldotna_cityscape_background_03_1920x1080.png',
    background04: 'assets/roadside-realm/backgrounds/soldotna_cityscape_background_04_1920x1080.png',
    background05: 'assets/roadside-realm/backgrounds/soldotna_cityscape_background_05_1920x1080.png',
    daniel: 'assets/player_hockey_sprite_96x96.png',
    salmon: 'assets/roadside-realm/sprites/salmon.png',
    bear: 'assets/roadside-realm/sprites/bear.png',
    moose: 'assets/roadside-realm/sprites/moose.png',
    dadMower: 'assets/roadside-realm/sprites/dad.png',
    dad: 'assets/roadside-realm/sprites/dad.png',
    mom: 'assets/roadside-realm/sprites/mom.png',
    momText: 'assets/roadside-realm/sprites/mom_text.png',
    sister: 'assets/roadside-realm/sprites/sister.png',
    sisterText: 'assets/roadside-realm/sprites/sister_text.png',
  };
  const BACKGROUND_SEQUENCE = ['background01', 'background02', 'background03', 'background04', 'background05'];

  const TUNING = {
    walkSpeed: 285,
    slideSpeed: 455,
    jumpVelocity: 810,
    gravity: 2250,
    groundRatio: 0.60,
    comboWindow: 420,
    invincibleMs: 760,
  };

  const STATE = {
    SPLASH: 'splash',
    TRANSITION: 'transition',
    PLAYING: 'playing',
    BOSS_INTRO: 'bossIntro',
    BOSS_FIGHT: 'bossFight',
    TRY_AGAIN: 'tryAgain',
  };

  let state = null;
  let elements = {};
  let raf = 0;
  let lastFrame = 0;
  let transitionTimer = 0;
  const keys = new Set();
  const pointers = new Map();
  const images = {};
  const missingAssets = [];

  function start() {
    cacheElements();
    preloadAssets();
    bindEvents();
    showSplash();
    drawSplashPreview();
  }

  function cacheElements() {
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
      rotate: document.getElementById('hockey-rotate'),
    };
  }

  function preloadAssets() {
    Object.entries(ASSETS).forEach(([key, src]) => {
      const image = new Image();
      image.onload = () => render();
      image.onerror = () => {
        missingAssets.push(src);
        debugLog('asset', `Missing ${src}; using labeled placeholder.`);
      };
      image.src = src;
      images[key] = image;
    });
  }

  function bindEvents() {
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
      ' ': 'jump',
      Shift: 'slide',
      s: 'slide',
      S: 'slide',
      f: 'stick',
      F: 'stick',
      Enter: 'stick',
    }[key] || null;
  }

  function beginTransition() {
    showTransition();
    window.clearTimeout(transitionTimer);
    transitionTimer = window.setTimeout(startLevel, TRANSITION_MS);
  }

  function showSplash() {
    stopLoop();
    state = createState(STATE.SPLASH);
    elements.body.classList.remove('hockey-playing');
    elements.splash.hidden = false;
    elements.transition.hidden = true;
    elements.game.hidden = true;
    elements.tryAgain.hidden = true;
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
    const groundY = DESIGN_HEIGHT * TUNING.groundRatio;
    return {
      mode,
      time: 0,
      message: 'Daniel is ready.',
      salmonRunStarted: false,
      salmonRunTimer: 0,
      bossIntroTimer: 0,
      spawn: { wildlife: 1.4, salmon: 1.0, family: 4.5, dadJoke: 1.5 },
      player: {
        x: 132,
        y: groundY - 96,
        width: 96,
        height: 96,
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
    };
  }

  function loop(now) {
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
    if (!isGameplayActive()) return;
    state.time += dt;
    updatePlayer(dt);
    updateSpawns(dt);
    updateEntities(dt);
    updateBoss(dt);
    updateHud();
  }

  function updatePlayer(dt) {
    const player = state.player;
    const move = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    const speed = keys.has('slide') ? TUNING.slideSpeed : TUNING.walkSpeed;
    player.vx = move * speed;
    if (move) player.facing = move;
    player.x = clamp(player.x + player.vx * dt, 22, DESIGN_WIDTH - player.width - 22);
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

  function jump() {
    if (!isGameplayActive() || !state.player.grounded) return;
    state.player.vy = -TUNING.jumpVelocity;
    state.player.grounded = false;
    state.message = 'Daniel jumps.';
  }

  function swingStick() {
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
    const attack = attackBox();
    const damage = combo === 3 ? 3 : combo;
    state.entities.forEach((entity) => {
      if (entity.dead || !rectsOverlap(attack, entity)) return;
      entity.hp -= damage;
      state.effects.push({ x: entity.x, y: entity.y, text: 'SMASH!', life: 0.35 });
      if (entity.hp <= 0) {
        entity.dead = true;
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
    return {
      x: p.facing > 0 ? p.x + p.width - 8 : p.x - 58,
      y: p.y + 20,
      width: 66,
      height: 48,
    };
  }

  function updateSpawns(dt) {
    if (state.mode === STATE.BOSS_FIGHT) return;
    state.spawn.wildlife -= dt;
    state.spawn.salmon -= dt;
    state.spawn.family -= dt;

    if (state.spawn.wildlife <= 0) {
      spawnWildlife();
      state.spawn.wildlife = 2.2 + Math.random() * 2.4;
    }
    if (state.spawn.salmon <= 0) {
      spawnSalmon();
      state.spawn.salmon = state.salmonRunStarted ? 0.16 : 1.1 + Math.random() * 1.2;
    }
    if (state.spawn.family <= 0) {
      spawnFamily();
      state.spawn.family = 6 + Math.random() * 4;
    }

    if (state.time > 26 && !state.salmonRunStarted) {
      state.salmonRunStarted = true;
      state.salmonRunTimer = 6.5;
      state.message = 'Major salmon run!';
    }

    if (state.salmonRunStarted) {
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
    const type = Math.random() > 0.55 ? 'moose' : 'bear';
    const width = 96;
    state.entities.push({
      type,
      x: DESIGN_WIDTH + 40,
      y: DESIGN_HEIGHT * TUNING.groundRatio - 96,
      width,
      height: 96,
      vx: type === 'moose' ? -190 : -245,
      hp: type === 'moose' ? 4 : 3,
      damage: type === 'moose' ? 16 : 12,
    });
  }

  function spawnSalmon() {
    const fromLeft = Math.random() > 0.5;
    state.entities.push({
      type: 'salmon',
      x: fromLeft ? -90 : DESIGN_WIDTH + 90,
      y: DESIGN_HEIGHT * (0.33 + Math.random() * 0.18),
      width: 74,
      height: 42,
      vx: fromLeft ? 390 : -390,
      vy: -150 + Math.random() * 90,
      hp: 1,
      damage: 8,
      flip: fromLeft ? 1 : -1,
    });
  }

  function spawnFamily() {
    const type = Math.random() > 0.5 ? 'mom' : 'sister';
    state.entities.push({
      type,
      x: DESIGN_WIDTH - 160,
      y: DESIGN_HEIGHT * TUNING.groundRatio - 96,
      width: 96,
      height: 96,
      vx: 0,
      hp: 3,
      damage: 6,
      bubble: type === 'mom' ? 'Daniel, clean your room!' : 'Daniel, you smell!',
    });
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
    state.entities.forEach((entity) => {
      entity.x += (entity.vx || 0) * dt;
      entity.y += (entity.vy || 0) * dt;
      if (entity.type === 'salmon') entity.vy += 460 * dt;
      if (!entity.dead && rectsOverlap(entity, state.player)) damagePlayer(entity.damage || 8);
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
    if (!elements.canvas) return;
    const ctx = elements.canvas.getContext('2d');
    ctx.clearRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    drawBackground(ctx);
    drawGround(ctx);
    if (!state || state.mode === STATE.SPLASH || state.mode === STATE.TRANSITION) return;
    state.entities.forEach((entity) => drawEntity(ctx, entity));
    if (state.mode === STATE.BOSS_INTRO) drawSpriteOrPlaceholder(ctx, 'dadMower', DESIGN_WIDTH - 168, DESIGN_HEIGHT * TUNING.groundRatio - 96, 96, 96, 'DAD MOWER');
    if (state.dad && !state.dad.dead) drawDad(ctx);
    drawDaniel(ctx);
    drawEffects(ctx);
  }

  function drawSplashPreview() {
    if (!elements.canvas) return;
    render();
  }

  function drawBackground(ctx) {
    const key = backgroundKeyForState();
    const bg = images[key];
    if (bg?.complete && bg.naturalWidth) {
      drawCoverImage(ctx, bg, 0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
      return;
    }
    ctx.fillStyle = '#7ec9f2';
    ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    ctx.fillStyle = '#4f7f61';
    ctx.beginPath();
    ctx.moveTo(0, 258);
    ctx.lineTo(180, 140);
    ctx.lineTo(330, 262);
    ctx.lineTo(520, 130);
    ctx.lineTo(780, 266);
    ctx.lineTo(1024, 150);
    ctx.lineTo(1024, 576);
    ctx.lineTo(0, 576);
    ctx.fill();
    ctx.fillStyle = '#f9dc62';
    ctx.beginPath();
    ctx.arc(850, 84, 42, 0, Math.PI * 2);
    ctx.fill();
  }

  function backgroundKeyForState() {
    if (!state || state.mode === STATE.SPLASH || state.mode === STATE.TRANSITION) return BACKGROUND_SEQUENCE[0];
    if (state.mode === STATE.BOSS_FIGHT || state.dad) return 'background05';
    if (state.mode === STATE.BOSS_INTRO) return 'background04';
    if (state.salmonRunStarted) return 'background03';
    const index = Math.min(BACKGROUND_SEQUENCE.length - 1, Math.floor(state.time / 10));
    return BACKGROUND_SEQUENCE[index];
  }

  function drawCoverImage(ctx, image, x, y, width, height) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sw = width / scale;
    const sh = height / scale;
    const sx = (image.naturalWidth - sw) / 2;
    const sy = (image.naturalHeight - sh) / 2;
    ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
  }

  function drawGround(ctx) {
    const groundY = DESIGN_HEIGHT * TUNING.groundRatio;
    ctx.fillStyle = '#56606a';
    ctx.fillRect(0, groundY, DESIGN_WIDTH, DESIGN_HEIGHT - groundY);
    for (let x = 0; x < DESIGN_WIDTH; x += 96) {
      ctx.fillStyle = x % 192 ? '#a6a89e' : '#b8baae';
      ctx.fillRect(x, groundY, 96, 32);
      ctx.strokeStyle = '#74776f';
      ctx.strokeRect(x, groundY, 96, 32);
    }
  }

  function drawDaniel(ctx) {
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
    if (p.attackTimer > 0) {
      const box = attackBox();
      ctx.fillStyle = 'rgba(255, 242, 120, 0.45)';
      ctx.fillRect(box.x, box.y, box.width, box.height);
    }
  }

  function drawEntity(ctx, entity) {
    if (entity.type === 'dadJoke') {
      drawBubble(ctx, entity.x, entity.y, entity.width, entity.height, entity.bubble, '#fff7d6');
      return;
    }
    drawSpriteOrPlaceholder(ctx, entity.type, entity.x, entity.y, entity.width, entity.height, entity.type.toUpperCase());
    if (entity.bubble) drawBubble(ctx, entity.x - 178, entity.y - 26, 210, 58, entity.bubble, '#fff7d6');
  }

  function drawDad(ctx) {
    drawSpriteOrPlaceholder(ctx, 'dad', state.dad.x, state.dad.y, 96, 96, 'DAD');
    ctx.fillStyle = '#111';
    ctx.fillRect(state.dad.x, state.dad.y - 14, 96, 8);
    ctx.fillStyle = '#8dff7a';
    ctx.fillRect(state.dad.x, state.dad.y - 14, 96 * (state.dad.hp / state.dad.maxHp), 8);
  }

  function drawSpriteOrPlaceholder(ctx, key, x, y, width, height, label) {
    const image = images[key];
    if (image?.complete && image.naturalWidth) {
      ctx.drawImage(image, x, y, width, height);
      return;
    }
    ctx.fillStyle = '#f2d27a';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#18202a';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = '#18202a';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + width / 2, y + height / 2);
  }

  function drawBubble(ctx, x, y, width, height, text, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = '#15202c';
    ctx.lineWidth = 3;
    roundRect(ctx, x, y, width, height, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#15202c';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + width / 2, y + height / 2 + 5);
  }

  function drawEffects(ctx) {
    state.effects.forEach((effect) => {
      ctx.fillStyle = '#fff27a';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(effect.text, effect.x, effect.y);
    });
  }

  function updateHud() {
    elements.health.value = state.player.health;
    elements.health.textContent = `${state.player.health} health`;
    elements.status.textContent = state.message;
  }

  function updateRotateHint() {
    if (!elements.rotate || elements.game.hidden) return;
    const shouldShow = window.innerHeight > window.innerWidth && window.innerWidth < 760;
    elements.rotate.hidden = !shouldShow;
    if (shouldShow) window.setTimeout(() => { if (elements.rotate) elements.rotate.hidden = true; }, 2400);
  }

  function isGameplayActive() {
    return state && [STATE.PLAYING, STATE.BOSS_INTRO, STATE.BOSS_FIGHT].includes(state.mode);
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function clearMessage(type) {
    return {
      salmon: 'Salmon knocked away.',
      bear: 'Bear backs off.',
      moose: 'Moose clears the sidewalk.',
      mom: 'Room-cleaning bubble popped.',
      sister: 'Teasing bubble popped.',
      dadJoke: 'Dad joke destroyed.',
    }[type] || 'Hazard cleared.';
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
  }

  function debugLog(category, details) {
    console.info(`[HockeySmash:${category}]`, details);
  }

  window.RTA_HOCKEY_SMASH = {
    start,
    getState: () => state,
    getVersion: () => VERSION,
    getMissingAssets: () => missingAssets.slice(),
    assets: ASSETS,
    tuning: TUNING,
  };
})();
