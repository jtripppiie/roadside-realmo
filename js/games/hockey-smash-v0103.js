(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.12.1';
  const DISPLAY_BUILD = 'Build 2026-06-29.36';
  const DESIGN_WIDTH = 1024;
  const DESIGN_HEIGHT = 576;
  const GROUND_Y = DESIGN_HEIGHT * 0.82;
  const PUCK_SPEED = 720;
  const PUCK_DAMAGE = 2;
  const PUCK_COOLDOWN_MS = 260;
  const FISH_DODGE_DAMAGE = 8;
  let api = null;
  let canvas = null;
  let status = null;
  let health = null;
  let lastFrame = performance.now();
  let lastPuckAt = 0;
  let lastSeenSwing = 0;
  let pucks = [];

  function onReady() {
    api = window.RTA_HOCKEY_SMASH;
    canvas = document.getElementById('hockey-canvas');
    status = document.getElementById('hockey-status');
    health = document.getElementById('hockey-health');
    const badge = document.getElementById('hockey-build-badge');
    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api?.getVersion) api.getVersion = () => DISPLAY_VERSION;
    if (!api || !canvas) return;
    bindStickLaunchers();
    window.requestAnimationFrame(runPuckAndDodgeLayer);
  }

  function bindStickLaunchers() {
    window.addEventListener('keydown', (event) => {
      if (!event.repeat && ['f', 'F', 'Enter'].includes(event.key)) firePuck();
    }, { capture: true });
    window.addEventListener('pointerdown', (event) => {
      if (actionFromEvent(event) === 'stick') firePuck();
    }, { capture: true, passive: true });
    window.addEventListener('click', (event) => {
      if (actionFromEvent(event) === 'stick') firePuck();
    }, { capture: true });
  }

  function notifyScoreLayer(method, payload) {
    window.RTA_HOCKEY_SMASH_SCORE?.[method]?.(payload);
  }

  function actionFromEvent(event) {
    return event.target?.closest?.('[data-action]')?.dataset?.action || null;
  }

  function getPlayableState() {
    const state = api?.getState?.();
    if (!state || !state.player || ['splash', 'transition', 'tryAgain'].includes(state.mode)) return null;
    return state;
  }

  function puckStatsForPlayer(player) {
    const sliding = document.body.classList.contains('hockey-slide-active') || document.getElementById('hockey-player-overlay')?.dataset?.sliding === 'true';
    const airborne = !player.grounded && player.y + player.height < GROUND_Y - 18;
    if (airborne) {
      return {
        variant: 'aerial',
        damage: 4,
        width: 36,
        height: 18,
        message: 'Daniel launches an aerial slapshot!',
        background: 'radial-gradient(circle at 35% 30%, #fff7a8 0 18%, #f59e0b 45%, #7c2d12 100%)',
        boxShadow: '0 0 0 2px rgba(255,255,255,.8), 0 0 22px rgba(250,204,21,.75)'
      };
    }
    if (sliding) {
      return {
        variant: 'slide',
        damage: 3,
        width: 34,
        height: 14,
        message: 'Daniel fires a low slide puck!',
        background: 'radial-gradient(circle at 35% 30%, #dbeafe 0 18%, #2563eb 46%, #0f172a 100%)',
        boxShadow: '0 0 0 2px rgba(255,255,255,.75), 0 0 18px rgba(96,165,250,.7)'
      };
    }
    return {
      variant: 'normal',
      damage: PUCK_DAMAGE,
      width: 30,
      height: 16,
      message: 'Daniel slaps a puck at the wildlife!',
      background: 'radial-gradient(circle at 35% 30%, #5b6370 0 12%, #1b2028 42%, #05070a 100%)',
      boxShadow: '0 0 0 2px rgba(255,255,255,.65), 0 8px 12px rgba(0,0,0,.25)'
    };
  }

  function firePuck() {
    const state = getPlayableState();
    if (!state) return;
    const now = performance.now();
    if (now - lastPuckAt < PUCK_COOLDOWN_MS) return;
    lastPuckAt = now;
    const player = state.player;
    const facing = player.facing < 0 ? -1 : 1;
    const puckStats = puckStatsForPlayer(player);
    pucks.push({
      x: facing > 0 ? player.x + player.width + 6 : player.x - 34,
      y: player.y + player.height * 0.48,
      width: puckStats.width,
      height: puckStats.height,
      vx: PUCK_SPEED * facing,
      life: 1.35,
      damage: puckStats.damage,
      variant: puckStats.variant,
      node: createPuckNode(puckStats),
    });
    state.message = puckStats.message;
    if (status) status.textContent = state.message;
  }

  function createPuckNode(puckStats) {
    const node = document.createElement('div');
    node.setAttribute('aria-hidden', 'true');
    node.dataset.puckVariant = puckStats.variant;
    Object.assign(node.style, {
      position: 'fixed', left: '0', top: '0', width: '20px', height: '10px',
      zIndex: '8', pointerEvents: 'none', borderRadius: '999px',
      background: puckStats.background,
      boxShadow: puckStats.boxShadow,
    });
    document.body.appendChild(node);
    return node;
  }

  function runPuckAndDodgeLayer(now) {
    const dt = Math.min(0.034, Math.max(0.008, (now - lastFrame) / 1000 || 0.016));
    lastFrame = now;
    const state = getPlayableState();
    if (!state) clearPucks();
    else {
      neutralizeSalmonDamage(state);
      launchFromCoreStickSwing(state);
      updatePucks(state, dt);
      handleSalmonDodgeRules(state);
      syncPuckNodes();
      syncHud(state);
    }
    window.requestAnimationFrame(runPuckAndDodgeLayer);
  }

  function launchFromCoreStickSwing(state) {
    const swingStamp = state.player?.lastSwing || 0;
    if (swingStamp && swingStamp !== lastSeenSwing) {
      lastSeenSwing = swingStamp;
      firePuck();
    }
  }

  function neutralizeSalmonDamage(state) {
    (state.entities || []).forEach((entity) => {
      if (entity?.type !== 'salmon') return;
      if (entity._dodgeLayerOriginalDamage == null) entity._dodgeLayerOriginalDamage = entity.damage || FISH_DODGE_DAMAGE;
      entity.dodgeDamage = entity.dodgeDamage || entity._dodgeLayerOriginalDamage || FISH_DODGE_DAMAGE;
      entity.damage = 0;
    });
  }

  function updatePucks(state, dt) {
    pucks.forEach((puck) => {
      puck.x += puck.vx * dt;
      puck.life -= dt;
      const target = (state.entities || []).find((entity) => {
        if (!entity || entity.dead) return false;
        if (!(entity.type === 'bear' || entity.type === 'moose')) return false;
        return rectsOverlap(puck, entity);
      });
      if (!target) return;
      target.hp -= puck.damage || PUCK_DAMAGE;
      puck.life = 0;
      state.effects?.push?.({ x: target.x + target.width / 2, y: target.y - 10, text: puck.variant === 'aerial' ? 'AIR PUCK!' : puck.variant === 'slide' ? 'LOW PUCK!' : 'PUCK!', life: 0.35 });
      const destroyed = target.hp <= 0;
      if (destroyed) {
        target.dead = true;
        if (state.computer?.results) state.computer.results.clearedObstacle = true;
        state.message = target.type === 'moose' ? 'Moose clears the sidewalk after the puck hit!' : 'Bear backs off after the puck hit!';
      } else {
        state.message = target.type === 'moose' ? 'Puck hit the moose. One more!' : 'Puck hit the bear!';
      }
      notifyScoreLayer('recordPuckHit', { state, target, destroyed, puckVariant: puck.variant, damage: puck.damage || PUCK_DAMAGE });
      if (status) status.textContent = state.message;
    });
    pucks = pucks.filter((puck) => {
      const alive = puck.life > 0 && puck.x > -80 && puck.x < DESIGN_WIDTH + 80;
      if (!alive) puck.node?.remove?.();
      return alive;
    });
  }

  function handleSalmonDodgeRules(state) {
    const player = state.player;
    (state.entities || []).forEach((entity) => {
      if (!entity || entity.dead || entity.type !== 'salmon' || entity._dodgeLayerResolved) return;
      if (!horizontalOverlap(player, entity)) return;
      entity._dodgeLayerResolved = true;
      if (playerIsDodgingSalmon(player)) {
        state.effects?.push?.({ x: player.x + player.width / 2, y: player.y - 10, text: 'DODGE!', life: 0.35 });
        state.message = 'Daniel dodged the fish!';
        notifyScoreLayer('recordDodge', { state, entity });
      } else {
        damagePlayerFromFish(state, entity.dodgeDamage || FISH_DODGE_DAMAGE);
      }
      if (status) status.textContent = state.message;
    });
  }

  function playerIsDodgingSalmon(player) {
    const sliding = document.body.classList.contains('hockey-slide-active') || document.getElementById('hockey-player-overlay')?.dataset?.sliding === 'true';
    const jumping = !player.grounded && player.y + player.height < GROUND_Y - 30;
    return sliding || jumping;
  }

  function damagePlayerFromFish(state, amount) {
    const player = state.player;
    if (player.invincible > 0) return;
    player.health = Math.max(0, player.health - amount);
    player.invincible = 0.85;
    state.message = 'Fish clipped Daniel. Duck or jump next time!';
    notifyScoreLayer('recordDamage', { state, amount, source: 'salmon' });
    if (player.health <= 0) showTryAgain(state);
  }

  function showTryAgain(state) {
    state.mode = 'tryAgain';
    document.body.classList.remove('hockey-playing');
    const game = document.getElementById('hockey-game');
    const tryAgain = document.getElementById('hockey-try-again');
    if (game) game.hidden = true;
    if (tryAgain) tryAgain.hidden = false;
    clearPucks();
  }

  function syncPuckNodes() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const scaleX = rect.width / DESIGN_WIDTH;
    const scaleY = rect.height / DESIGN_HEIGHT;
    pucks.forEach((puck) => {
      Object.assign(puck.node.style, {
        left: `${rect.left + puck.x * scaleX}px`,
        top: `${rect.top + puck.y * scaleY}px`,
        width: `${Math.max(14, puck.width * scaleX)}px`,
        height: `${Math.max(7, puck.height * scaleY)}px`,
      });
      puck.node.hidden = false;
    });
  }

  function clearPucks() {
    pucks.forEach((puck) => puck.node?.remove?.());
    pucks = [];
  }

  function syncHud(state) {
    if (!health || !state?.player) return;
    health.value = state.player.health;
    health.textContent = `${state.player.health} health`;
  }

  function horizontalOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x;
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();
