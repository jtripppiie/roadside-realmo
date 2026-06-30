(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.14.35';
  const DISPLAY_BUILD = 'Build 2026-06-30.91';
  const W = 1024;
  const H = 576;
  const GROUND_Y = H * 0.82;
  const EAGLE_Y = GROUND_Y - 126;
  const EAGLE_WIDTH = 88;
  const EAGLE_HEIGHT = 58;
  const EAGLE_DAMAGE = 9;
  const DUCK_HEIGHT = 66;

  const EAGLE_FRAME_SOURCES = [
    'assets/hockey-smash/sprites/eagle_wings_up.webp',
    'assets/hockey-smash/sprites/eagle_mid_flap.webp',
    'assets/hockey-smash/sprites/eagle_wings_down.webp',
    'assets/hockey-smash/sprites/eagle-up-flap.webp',
    'assets/hockey-smash/sprites/eagle-mid-flap.webp',
    'assets/hockey-smash/sprites/eagle-down-flap.webp',
    'assets/hockey-smash/sprites/eagle-up.webp',
    'assets/hockey-smash/sprites/eagle.webp',
    'assets/hockey-smash/sprites/eagle-down.webp',
    'assets/hockey-smash/sprites/eagle-1.webp',
    'assets/hockey-smash/sprites/eagle-2.webp',
    'assets/hockey-smash/sprites/eagle-3.webp',
  ];

  let duckHeld = false;
  let eagleLayer = null;
  const eagleNodes = new Map();
  const eagleFrames = [];

  function api() { return window.RTA_HOCKEY_SMASH; }
  function state() {
    const s = api()?.getState?.();
    if (!s || !s.player || ['splash', 'transition', 'tryAgain'].includes(s.mode)) return null;
    if (!Array.isArray(s.entities)) s.entities = [];
    if (!Array.isArray(s.effects)) s.effects = [];
    return s;
  }
  function overlap(a, b) { return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y; }
  function playerName(s) { return api()?.getPlayerConfig?.()?.name || s?.player?.name || 'Daniel'; }

  function lockBuildBadge() {
    const badge = document.getElementById('hockey-build-badge');
    const label = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (badge && badge.textContent !== label) badge.textContent = label;
    if (api()?.getVersion) api().getVersion = () => DISPLAY_VERSION;
  }

  function preloadEagleFrames() {
    if (eagleFrames.length) return;
    EAGLE_FRAME_SOURCES.forEach((src) => {
      const image = new Image();
      const frame = { src, image, ready: false, failed: false };
      image.decoding = 'async';
      image.onload = () => { frame.ready = true; };
      image.onerror = () => { frame.failed = true; };
      image.src = src;
      eagleFrames.push(frame);
    });
  }

  function availableEagleFrames() {
    const ready = eagleFrames.filter((frame) => frame.ready && !frame.failed);
    return ready.length ? ready : eagleFrames.filter((frame) => frame.src.includes('eagle_mid_flap'));
  }

  function currentEagleFrame(now) {
    const frames = availableEagleFrames();
    if (!frames.length) return EAGLE_FRAME_SOURCES[1];
    return frames[Math.floor(now / 105) % frames.length].src;
  }

  function flapTransform(entity, now) {
    const frameCount = availableEagleFrames().length;
    if (frameCount > 1) return 'translate(-50%, -50%)';
    const flap = Math.sin((now + (entity._eagleOffset || 0)) / 78);
    const scaleY = 1 + flap * 0.09;
    const rotate = flap * 3.5;
    return `translate(-50%, -50%) rotate(${rotate.toFixed(2)}deg) scaleY(${scaleY.toFixed(3)})`;
  }

  function setDuckHeld(active) {
    if (duckHeld === active) return;
    duckHeld = active;
    document.body.classList.toggle('hockey-duck-active', duckHeld);
    const s = state();
    if (s?.player) {
      s.player.ducking = duckHeld;
      s.player.isDucking = duckHeld;
      s.message = duckHeld ? `${playerName(s)} ducks under the fly-by!` : s.message;
      const status = document.getElementById('hockey-status');
      if (status && duckHeld) status.textContent = s.message;
    }
  }

  function bindDuckKey() {
    if (document.body.dataset.hockeyDuckKeyBound === 'v0.14.35') return;
    document.body.dataset.hockeyDuckKeyBound = 'v0.14.35';

    window.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown') return;
      const s = state();
      if (!s) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setDuckHeld(true);
    }, { capture: true, passive: false });

    window.addEventListener('keyup', (event) => {
      if (event.key !== 'ArrowDown') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setDuckHeld(false);
    }, { capture: true, passive: false });

    window.addEventListener('blur', () => setDuckHeld(false));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) setDuckHeld(false);
    });
  }

  function normalPlayerHeight(player) {
    if (!player._duckNormalHeight || player._duckNormalHeight < 90) {
      player._duckNormalHeight = Math.max(104, player.height || 108);
    }
    return player._duckNormalHeight;
  }

  function applyDuckShape(s) {
    const player = s?.player;
    if (!player) return;
    const normalHeight = normalPlayerHeight(player);
    const bottom = player.y + player.height;
    const grounded = Boolean(player.grounded) || bottom >= GROUND_Y - 5;

    if (duckHeld && grounded) {
      player.ducking = true;
      player.isDucking = true;
      if (player.height !== DUCK_HEIGHT) {
        player.height = DUCK_HEIGHT;
        player.y = Math.min(GROUND_Y - DUCK_HEIGHT, bottom - DUCK_HEIGHT);
      }
      return;
    }

    player.ducking = false;
    player.isDucking = false;
    if (player.height !== normalHeight) {
      player.y = Math.min(GROUND_Y - normalHeight, bottom - normalHeight);
      player.height = normalHeight;
    }
  }

  function playerStandingBox(player) {
    const normalHeight = normalPlayerHeight(player);
    return {
      x: player.x + 18,
      y: GROUND_Y - normalHeight + 10,
      width: player.width - 36,
      height: normalHeight - 18,
    };
  }

  function playerDuckBox(player) {
    return {
      x: player.x + 18,
      y: player.y + 8,
      width: player.width - 36,
      height: Math.max(22, player.height - 10),
    };
  }

  function eagleBox(entity) {
    return {
      x: entity.x + 8,
      y: entity.y + 8,
      width: entity.width - 16,
      height: entity.height - 16,
    };
  }

  function tuneEagle(entity, now) {
    if (!entity || entity.dead || entity.type !== 'bird') return;
    if (!entity._eagleOffset) entity._eagleOffset = Math.random() * 800;
    entity.y = EAGLE_Y + Math.sin((now + entity._eagleOffset) / 280) * 7;
    entity.width = Math.max(entity.width || 0, EAGLE_WIDTH);
    entity.height = Math.max(entity.height || 0, EAGLE_HEIGHT);
    entity.vx = -Math.max(300, Math.abs(entity.vx || 330));
    entity.damage = 0;
    entity.maxHp = Math.max(entity.maxHp || 1, entity.hp || 1);
    entity._eagleManaged = true;
  }

  function damageFromEagle(s, entity) {
    const p = s.player;
    const ducking = Boolean(duckHeld || p.ducking || p.isDucking || document.body.classList.contains('hockey-duck-active'));
    const bird = eagleBox(entity);
    const standing = playerStandingBox(p);
    const ducked = playerDuckBox(p);

    if (ducking) {
      if (overlap(bird, standing) && !overlap(bird, ducked) && !entity._duckClearShown) {
        entity._duckClearShown = true;
        s.effects.push({ x: p.x + p.width / 2, y: p.y - 14, text: 'DUCKED!', life: 0.55 });
        s.message = `${playerName(s)} ducked under the eagle!`;
        const status = document.getElementById('hockey-status');
        if (status) status.textContent = s.message;
        window.RTA_HOCKEY_SMASH_SCORE?.recordDodge?.({ state: s, entity });
      }
      return;
    }

    if (!overlap(bird, standing) || p.invincible > 0) return;

    p.health = Math.max(0, p.health - EAGLE_DAMAGE);
    p.invincible = 0.82;
    entity._duckClearShown = true;
    s.effects.push({ x: p.x + p.width / 2, y: p.y - 18, text: 'EAGLE HIT!', life: 0.55 });
    s.message = `Eagle clipped ${playerName(s)}! Press Down Arrow to duck.`;
    const health = document.getElementById('hockey-health');
    if (health) {
      health.value = p.health;
      health.textContent = `${p.health} health`;
    }
    const status = document.getElementById('hockey-status');
    if (status) status.textContent = s.message;
    window.RTA_HOCKEY_SMASH_SCORE?.recordDamage?.({ state: s, amount: EAGLE_DAMAGE, source: 'eagle' });
  }

  function ensureEagleLayer() {
    if (eagleLayer?.isConnected) return eagleLayer;
    eagleLayer = document.createElement('div');
    eagleLayer.className = 'hockey-eagle-layer';
    eagleLayer.setAttribute('aria-hidden', 'true');
    Object.assign(eagleLayer.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: '0',
      height: '0',
      zIndex: '14',
      pointerEvents: 'none',
    });
    document.body.appendChild(eagleLayer);
    return eagleLayer;
  }

  function idForEagle(entity) {
    if (!entity._eagleDomId) entity._eagleDomId = `eagle-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return entity._eagleDomId;
  }

  function syncEagleSprites(s, now) {
    const layer = ensureEagleLayer();
    const canvas = document.getElementById('hockey-canvas');
    const rect = canvas?.getBoundingClientRect?.();
    if (!layer || !rect?.width || !rect?.height || !Array.isArray(s?.entities)) {
      eagleNodes.forEach((node) => node.remove());
      eagleNodes.clear();
      return;
    }

    const alive = new Set();
    const sx = rect.width / W;
    const sy = rect.height / H;
    const frame = currentEagleFrame(now);

    s.entities.forEach((entity) => {
      if (!entity || entity.dead || entity.type !== 'bird') return;
      const id = idForEagle(entity);
      alive.add(id);
      let node = eagleNodes.get(id);
      if (!node) {
        node = document.createElement('img');
        node.alt = '';
        node.className = 'hockey-eagle-flap-sprite';
        Object.assign(node.style, {
          position: 'fixed',
          pointerEvents: 'none',
          objectFit: 'contain',
          filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.32))',
          transformOrigin: '50% 50%',
        });
        layer.appendChild(node);
        eagleNodes.set(id, node);
      }
      if (!node.src.endsWith(frame)) node.src = frame;
      node.style.left = `${rect.left + (entity.x + entity.width / 2) * sx}px`;
      node.style.top = `${rect.top + (entity.y + entity.height / 2) * sy}px`;
      node.style.width = `${entity.width * sx}px`;
      node.style.height = `${entity.height * sy}px`;
      node.style.opacity = entity.x > W || entity.x + entity.width < 0 ? '0' : '1';
      node.style.transform = flapTransform(entity, now);
    });

    eagleNodes.forEach((node, id) => {
      if (!alive.has(id)) {
        node.remove();
        eagleNodes.delete(id);
      }
    });
  }

  function eagleLoop(now) {
    lockBuildBadge();
    const s = state();
    if (s) {
      applyDuckShape(s);
      s.entities.forEach((entity) => {
        tuneEagle(entity, now);
        if (entity?.type === 'bird' && !entity.dead) damageFromEagle(s, entity);
      });
      syncEagleSprites(s, now);
    } else {
      setDuckHeld(false);
      syncEagleSprites(null, now || performance.now());
    }
    window.requestAnimationFrame(eagleLoop);
  }

  function ready() {
    lockBuildBadge();
    document.body.dataset.hockeyEagles = 'v0.14.35';
    preloadEagleFrames();
    bindDuckKey();
    window.HOCKEY_BOOT_LOG?.log?.('eagles', 'Low eagle fly-bys loaded. Down Arrow squashes the real canvas player; eagle frames flap when present, and the single-frame fallback pulses.');
    window.requestAnimationFrame(eagleLoop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
