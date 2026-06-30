(function () {
  const BEAR_START_SPEED = 78;
  const BEAR_LATE_SPEED = 124;
  const GROUND_Y = 576 * 0.82;
  const CAST_FIRST_DELAY_MS = 1600;
  const CAST_MIN_GAP_MS = 9000;
  const CAST_GAP_JITTER_MS = 3500;
  const CAST_START_TIME = 8;
  const BUBBLE_LINES = {
    mom: [
      'Helmet on, kiddo!',
      'Keep your head up!',
      'Use the whole sidewalk!',
      'Water break after this!',
    ],
    dad: [],
    daniel: [
      'I got your back!',
      'Hockey brother assist!',
      'Keep dancing!',
      'Stick side is clear!',
    ],
    danceInstructor: [
      'Point those toes!',
      'Big finish!',
      'Spot your turn!',
      'Graceful escape!',
    ],
    sister: [
      'Spin move!',
      'Too slow!',
      'Try catching this!',
      'I call rematch!',
    ],
  };

  let castIndex = 0;
  let castStarted = false;
  let nextCastAt = 0;
  let lastCastType = '';
  let lastBubbleLine = '';
  let castDebugButton = null;
  let bubbleLayer = null;
  const bubbleNodes = new Map();

  function api() { return window.RTA_HOCKEY_SMASH; }

  function getState() {
    const state = api()?.getState?.();
    if (!state || !state.player || ['splash', 'transition', 'tryAgain'].includes(state.mode)) return null;
    return state;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function difficultyFor(state) {
    return clamp(Number(state?.difficulty) || ((state?.time || 0) / 140), 0, 1);
  }

  function character() {
    return api()?.getPlayerConfig?.()?.character || getState()?.playerCharacter || 'daniel';
  }

  function playerName() {
    return api()?.getPlayerConfig?.()?.name || (character() === 'sofie' ? 'Sofie' : 'Daniel');
  }

  function syncFinalReleaseState() {
    const overlay = document.getElementById('hockey-player-overlay');
    if (!overlay) return;
    overlay.hidden = true;
    overlay.style.display = 'none';
    document.body.classList.add('hockey-canvas-player-only');
  }

  function slowBearsAgain(state) {
    if (!Array.isArray(state?.entities)) return;
    const difficulty = difficultyFor(state);
    const speed = BEAR_START_SPEED + (BEAR_LATE_SPEED - BEAR_START_SPEED) * difficulty;
    state.entities.forEach((entity) => {
      if (!entity || entity.dead || entity.type !== 'bear') return;
      entity.vx = -speed;
      entity._bearFinalSpeed = Number(speed.toFixed(1));
    });
  }

  function castForCurrentCharacter() {
    const shared = [
      { type: 'mom', width: 92, height: 100, speed: 82, hp: 3, damage: 5 },
      { type: 'dad', width: 92, height: 96, speed: 72, hp: 4, damage: 6 },
    ];
    if (character() === 'sofie') {
      return shared.concat(
        { type: 'daniel', width: 92, height: 104, speed: 86, hp: 3, damage: 4, role: 'brother' },
        { type: 'danceInstructor', width: 92, height: 100, speed: 92, hp: 4, damage: 7 }
      );
    }
    return shared;
  }

  function devModeActive() {
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === '1' || params.get('dev') === '1' || params.get('computerMode') === '1' || document.body.classList.contains('hockey-dev-mode');
  }

  function pickLine(type) {
    if (type === 'dad') return `${playerName()}, do your homework!`;
    const lines = BUBBLE_LINES[type] || [];
    if (!lines.length) return '';
    let line = lines[Math.floor(Math.random() * lines.length)];
    if (lines.length > 1 && line === lastBubbleLine) {
      line = lines[(lines.indexOf(line) + 1) % lines.length];
    }
    lastBubbleLine = line;
    return line;
  }

  function labelFor(type) {
    return {
      mom: 'Mom',
      dad: 'Dad',
      daniel: 'Brother',
      danceInstructor: 'Dance instructor',
      sister: 'Sister',
    }[type] || `${type[0].toUpperCase()}${type.slice(1)}`;
  }

  function templateMessage(type, bubble) {
    if (type === 'mom') return `Mom skates in: ${bubble}`;
    if (type === 'dad') return `Dad says: ${bubble}`;
    if (type === 'daniel') return `Brother Daniel: ${bubble}`;
    if (type === 'danceInstructor') return `Dance instructor: ${bubble}`;
    return `${labelFor(type)} challenge incoming.`;
  }

  function nextCastTemplate(options = {}) {
    const cast = castForCurrentCharacter();
    if (options.type) return cast.find((entry) => entry.type === options.type) || cast[0];
    if (!cast.length) return null;

    const start = castIndex % cast.length;
    for (let offset = 0; offset < cast.length; offset += 1) {
      const candidate = cast[(start + offset) % cast.length];
      if (candidate.type !== lastCastType) return candidate;
    }
    return cast[start];
  }

  function spawnCastEncounter(state, options = {}) {
    if (!Array.isArray(state?.entities)) return null;
    if (!options.force && !castStageHasStarted(state)) return null;
    const activeCast = state.entities.filter((entity) => entity && !entity.dead && entity.fromFinalCastPass);
    if (!options.force && activeCast.length >= 1) return null;

    const difficulty = difficultyFor(state);
    const template = nextCastTemplate(options);
    if (!template) return null;
    castIndex += 1;
    lastCastType = template.type;
    const speedBoost = 1 + difficulty * 0.18;
    const prettyBubble = pickLine(template.type) || `${playerName()}, keep moving!`;
    const entity = {
      ...template,
      bubble: '',
      prettyBubble,
      message: templateMessage(template.type, prettyBubble),
      key: `final-cast-${template.type}-${Date.now()}-${castIndex}`,
      x: 1024 + 80 + Math.random() * 120,
      y: GROUND_Y - template.height,
      vx: -template.speed * speedBoost,
      damage: template.damage || 5,
      maxHp: template.hp,
      fromFinalCastPass: true,
      fromMovingGameplayPass: true,
      variant: 'cast',
    };
    state.entities.push(entity);
    state.message = entity.message;
    const status = document.getElementById('hockey-status');
    if (status) status.textContent = entity.message;
    window.HOCKEY_BOOT_LOG?.log?.('cast', `Spawned ${entity.type}${options.force ? ' by debug shortcut' : ''}.`);
    return entity;
  }

  function runCastLogic(state) {
    if (!castStageHasStarted(state)) return;
    const now = performance.now();
    if (!castStarted) {
      castStarted = true;
      nextCastAt = now + CAST_FIRST_DELAY_MS;
    }
    if (now < nextCastAt) return;
    const spawned = spawnCastEncounter(state);
    if (spawned) nextCastAt = now + CAST_MIN_GAP_MS + Math.random() * CAST_GAP_JITTER_MS;
  }

  function castStageHasStarted(state) {
    if (!state) return false;
    return (Number(state.time) || 0) > CAST_START_TIME;
  }

  function removeSidelineCameo() {
    document.querySelectorAll('.hockey-sideline-cameo').forEach((node) => node.remove());
  }

  function ensureBubbleLayer() {
    if (bubbleLayer?.isConnected) return bubbleLayer;
    bubbleLayer = document.createElement('div');
    bubbleLayer.className = 'hockey-pretty-bubble-layer';
    bubbleLayer.setAttribute('aria-hidden', 'true');
    Object.assign(bubbleLayer.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: '0',
      height: '0',
      zIndex: '18',
      pointerEvents: 'none',
    });
    document.body.appendChild(bubbleLayer);
    return bubbleLayer;
  }

  function bubbleId(entity) {
    if (!entity._prettyBubbleId) entity._prettyBubbleId = `bubble-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return entity._prettyBubbleId;
  }

  function shouldPrettyBubble(entity) {
    return entity && !entity.dead && ['mom', 'dad', 'daniel', 'danceInstructor', 'sister', 'teacher', 'adultCoach'].includes(entity.type);
  }

  function normalizeBubble(entity) {
    if (!shouldPrettyBubble(entity)) return '';
    if (entity.type === 'dad') entity.prettyBubble = `${playerName()}, do your homework!`;
    if (!entity.prettyBubble) entity.prettyBubble = entity.bubble || pickLine(entity.type) || '';
    entity.bubble = '';
    return entity.prettyBubble;
  }

  function syncPrettyBubbles(state) {
    const layer = ensureBubbleLayer();
    const canvas = document.getElementById('hockey-canvas');
    const rect = canvas?.getBoundingClientRect?.();
    if (!layer || !rect?.width || !rect?.height || !Array.isArray(state?.entities)) {
      bubbleNodes.forEach((node) => node.remove());
      bubbleNodes.clear();
      return;
    }

    const alive = new Set();
    state.entities.forEach((entity) => {
      const text = normalizeBubble(entity);
      if (!text) return;
      const id = bubbleId(entity);
      alive.add(id);
      let node = bubbleNodes.get(id);
      if (!node) {
        node = document.createElement('div');
        node.className = 'hockey-pretty-bubble';
        Object.assign(node.style, {
          position: 'fixed',
          maxWidth: 'min(220px, 38vw)',
          padding: '.42rem .58rem',
          border: '3px solid rgba(21,32,44,.96)',
          borderRadius: '14px',
          background: 'rgba(255, 247, 214, .96)',
          color: '#15202c',
          font: '900 clamp(12px, 1.9vw, 16px)/1.12 system-ui, sans-serif',
          textAlign: 'center',
          textWrap: 'balance',
          boxShadow: '0 8px 18px rgba(0,0,0,.28)',
          transform: 'translate(-50%, -100%)',
          pointerEvents: 'none',
          whiteSpace: 'normal',
        });
        layer.appendChild(node);
        bubbleNodes.set(id, node);
      }
      node.textContent = text;
      const sx = rect.width / 1024;
      const sy = rect.height / 576;
      const left = rect.left + (entity.x + entity.width / 2) * sx;
      const top = rect.top + Math.max(18, entity.y - 12) * sy;
      node.style.left = `${clamp(left, rect.left + 74, rect.right - 74)}px`;
      node.style.top = `${clamp(top, rect.top + 38, rect.bottom - 24)}px`;
      node.style.opacity = entity.x > 1024 || entity.x + entity.width < 0 ? '0' : '1';
    });

    bubbleNodes.forEach((node, id) => {
      if (!alive.has(id)) {
        node.remove();
        bubbleNodes.delete(id);
      }
    });
  }

  function spawnCastNow(type) {
    const state = getState();
    if (!state) return null;
    return spawnCastEncounter(state, { force: true, type });
  }

  function exposeCastDebugApi() {
    window.RTA_HOCKEY_SMASH_CAST = {
      spawnNow: spawnCastNow,
      currentCast: () => castForCurrentCharacter().map((entry) => entry.type),
    };
  }

  function ensureCastDebugButton() {
    const game = document.getElementById('hockey-game');
    if (!game) return;
    if (!devModeActive()) {
      if (castDebugButton) castDebugButton.hidden = true;
      return;
    }
    if (castDebugButton?.isConnected) {
      castDebugButton.hidden = false;
      return;
    }
    castDebugButton = document.createElement('button');
    castDebugButton.id = 'hockey-spawn-cast-debug';
    castDebugButton.type = 'button';
    castDebugButton.textContent = 'Spawn Cast';
    castDebugButton.setAttribute('aria-label', 'Spawn cast encounter now');
    castDebugButton.style.cssText = [
      'position:absolute',
      'right:.75rem',
      'bottom:.75rem',
      'z-index:45',
      'padding:.45rem .65rem',
      'border:2px solid #fff27a',
      'border-radius:8px',
      'background:rgba(5,8,13,.86)',
      'color:#fff2cf',
      'font:800 12px/1 system-ui,sans-serif',
      'box-shadow:0 8px 18px rgba(0,0,0,.35)',
    ].join(';');
    castDebugButton.addEventListener('click', () => spawnCastNow());
    game.appendChild(castDebugButton);
  }

  function loop() {
    syncFinalReleaseState();
    exposeCastDebugApi();
    ensureCastDebugButton();
    removeSidelineCameo();
    const state = getState();
    if (state) {
      slowBearsAgain(state);
      runCastLogic(state);
      syncPrettyBubbles(state);
    } else {
      syncPrettyBubbles(null);
    }
    window.requestAnimationFrame(loop);
  }

  function ready() {
    document.body.dataset.hockeyRelease = 'v0.14.41';
    syncFinalReleaseState();
    exposeCastDebugApi();
    ensureCastDebugButton();
    removeSidelineCameo();
    window.HOCKEY_BOOT_LOG?.log?.('release', 'Mom now appears as the first early cast character.');
    window.requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
