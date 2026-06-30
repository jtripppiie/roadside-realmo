(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.14.8 Family Combat';
  const DISPLAY_BUILD = 'Build 2026-06-30.64';
  const W = 1024;
  const H = 576;
  const GROUND_Y = H * 0.82;
  const BIG = new Set(['bear', 'moose', 'chargingMoose']);
  const FAMILY = new Set(['teacher', 'danceInstructor', 'sister', 'adultCoach', 'dad']);
  let eid = 0;
  let order = 0;

  function api() { return window.RTA_HOCKEY_SMASH; }
  function state() {
    const s = api()?.getState?.();
    if (!s || !s.player || ['splash', 'transition', 'tryAgain'].includes(s.mode)) return null;
    if (!Array.isArray(s.entities)) s.entities = [];
    if (!Array.isArray(s.effects)) s.effects = [];
    return s;
  }
  function name() { return api()?.getPlayerConfig?.().name || 'Daniel'; }
  function id(e) { return e._v139id || (e._v139id = `e${Date.now()}-${++eid}`); }
  function ord(e) { return e._v139order || (e._v139order = ++order); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function overlap(a, b) { return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y; }
  function effect(s, x, y, text, life = 0.42) { s.effects?.push?.({ x, y, text, life }); }
  function status(t) { const el = document.getElementById('hockey-status'); if (el && t) el.textContent = t; }
  function health(s) { const el = document.getElementById('hockey-health'); if (el && s?.player) { el.value = s.player.health; el.textContent = `${s.player.health} health`; } }
  function endRun(s) {
    s.mode = 'tryAgain';
    document.body.classList.remove('hockey-playing');
    const game = document.getElementById('hockey-game');
    const again = document.getElementById('hockey-try-again');
    if (game) game.hidden = true;
    if (again) again.hidden = false;
  }

  function bindDoubleJump() {
    if (document.body.dataset.doubleJumpBound === 'v0.13.9') return;
    document.body.dataset.doubleJumpBound = 'v0.13.9';
    window.addEventListener('keydown', (ev) => {
      if (ev.repeat || !['ArrowUp', 'w', 'W', 'j', 'J'].includes(ev.key || '')) return;
      doubleJump('keyboard');
    }, { capture: true });
    window.addEventListener('pointerdown', (ev) => {
      if (ev.target?.closest?.('[data-action]')?.dataset?.action === 'jump') doubleJump('button');
    }, { capture: true, passive: true });
  }
  function doubleJump(source) {
    const s = state();
    const p = s?.player;
    if (!s || !p || p.grounded || p._doubleJumpUsed) return;
    p._doubleJumpUsed = true;
    p.vy = Math.max(-980, Math.min(-720, (Number(p.vy) || 0) - 320));
    s.message = `${name()} double jumps higher!`;
    effect(s, p.x + p.width / 2, p.y - 12, 'DOUBLE JUMP!', 0.5);
    status(s.message);
    window.HOCKEY_BOOT_LOG?.log?.('family-combat', `Double jump from ${source}.`);
  }

  function tuneFamily(s, e) {
    if (!FAMILY.has(e?.type) || e.dead) return;
    ord(e);
    e._dodgeLayerResolved = true;
    if (e.type === 'adultCoach') e.type = 'danceInstructor';
    if (!e._v139family) {
      e._v139family = true;
      const hp = e.type === 'sister' ? 3 : 4;
      e.hp = Math.max(Number(e.hp) || 0, hp);
      e.maxHp = Math.max(Number(e.maxHp) || 0, hp);
    }
    if (e.type === 'danceInstructor') e.bubble = e.bubble || 'Point those toes!';
    if (e.type === 'teacher') e.bubble = e.bubble || 'Keep skating!';
    if (e.type === 'dad') e.bubble = e.bubble || 'You got this!';
    const delta = s.player.x + s.player.width / 2 - (e.x + e.width / 2);
    const speed = e.type === 'danceInstructor' ? 170 : 145;
    e.vx = Math.abs(delta) > 28 ? clamp(delta * 1.35, -speed, speed * 0.72) : 0;
  }

  function projectileBox(node) {
    const c = document.getElementById('hockey-canvas');
    if (!c || !node?.isConnected) return null;
    const cr = c.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    if (!cr.width || !cr.height || !r.width || !r.height) return null;
    return { x: (r.left - cr.left) / cr.width * W, y: (r.top - cr.top) / cr.height * H, width: r.width / cr.width * W, height: r.height / cr.height * H };
  }
  function shotPower(node) {
    const v = node.dataset.puckVariant || 'normal';
    if (node.dataset.charged === 'true' || v === 'aerial') return 4;
    return v === 'slide' ? 3 : 2;
  }
  function projectileFamilyHits(s) {
    const targets = s.entities.filter((e) => FAMILY.has(e?.type) && !e.dead);
    if (!targets.length) return;
    document.querySelectorAll('[data-projectile-type]').forEach((node) => {
      const box = projectileBox(node);
      if (!box) return;
      targets.forEach((e) => {
        const key = id(e);
        const hits = new Set((node.dataset.v139Hits || '').split(',').filter(Boolean));
        if (hits.has(key) || !overlap(box, e)) return;
        hits.add(key);
        node.dataset.v139Hits = Array.from(hits).join(',');
        const amount = shotPower(node);
        e.hp = Math.max(0, (Number(e.hp) || 1) - amount);
        effect(s, e.x + e.width / 2, e.y - 12, node.dataset.projectileType === 'pointe-shoe' ? 'SHOE HIT!' : 'PUCK HIT!');
        if (e.hp <= 0) {
          e.dead = true;
          s.message = `${e.type === 'danceInstructor' ? 'Dance instructor' : e.type === 'teacher' ? 'Teacher' : e.type === 'dad' ? 'Dad' : 'Sister'} cleared by the shot!`;
        } else {
          s.message = `Dance challenge HP ${e.hp}/${e.maxHp || 4}.`;
        }
        window.RTA_HOCKEY_SMASH_SCORE?.recordPuckHit?.({ state: s, target: e, destroyed: e.dead, puckVariant: node.dataset.puckVariant || 'normal', projectileType: node.dataset.projectileType || 'puck', damage: amount, charged: node.dataset.charged === 'true' });
        status(s.message);
      });
    });
  }

  function oneBigAnimal(s) {
    const active = s.entities.filter((e) => BIG.has(e?.type) && !e.dead).sort((a, b) => {
      const av = a.x < W;
      const bv = b.x < W;
      if (av !== bv) return av ? -1 : 1;
      return ord(a) - ord(b);
    });
    active.slice(1).forEach((e) => {
      e.dead = true;
      effect(s, clamp(e.x, 80, W - 80), Math.max(70, e.y - 10), 'ONE AT A TIME!');
    });
  }

  function warnNode(e) {
    if (e._v139warn?.isConnected) return e._v139warn;
    const n = document.createElement('div');
    n.dataset.hockeyFishWarning = id(e);
    n.setAttribute('aria-hidden', 'true');
    Object.assign(n.style, { position: 'fixed', left: '0', top: '0', width: '40px', height: '18px', zIndex: '7', pointerEvents: 'none', border: '3px solid rgba(255,242,122,.95)', borderRadius: '999px', background: 'rgba(251,113,133,.22)', boxShadow: '0 0 18px rgba(251,113,133,.72), inset 0 0 14px rgba(255,255,255,.32)', transform: 'translate(-50%,-50%) scale(1)' });
    document.body.appendChild(n);
    e._v139warn = n;
    return n;
  }
  function prepFish(e, s, now) {
    if (e._v139fish) return;
    e._v139fish = true;
    e._v139born = now;
    e._v139landX = clamp((e.x || 0) + (e.width || 70) / 2, 58, W - 58);
    e._v139radius = Math.max(58, Math.min(110, (e.width || 74) * 0.78));
    e.fallingFish = true;
    e.damage = 0;
    e.dodgeDamage = e.safeCollectible || e.collectibleSalmon ? 0 : (e.variant === 'schoolRain' || e.variant === 'heavyRain' ? 12 : 8);
    e.vx = 0;
    e.vy = 230 + (Number(s.difficulty) || 0) * 70;
    e._dodgeLayerResolved = true;
  }
  function placeWarning(e) {
    const n = warnNode(e);
    const c = document.getElementById('hockey-canvas');
    const r = c?.getBoundingClientRect?.();
    if (!r?.width || !r?.height) return;
    const sx = r.width / W;
    const sy = r.height / H;
    const progress = clamp(((e.y || 0) + (e.height || 42)) / GROUND_Y, 0, 1);
    Object.assign(n.style, { left: `${r.left + e._v139landX * sx}px`, top: `${r.top + (GROUND_Y - 8) * sy}px`, width: `${Math.max(38, e._v139radius * 2 * sx)}px`, height: `${Math.max(12, 24 * sy)}px`, opacity: String(0.45 + progress * 0.5), transform: `translate(-50%,-50%) scale(${(0.85 + progress * 0.45).toFixed(2)})` });
  }
  function splashHits(p, e) {
    const center = p.x + p.width / 2;
    const high = !p.grounded && p.y + p.height < GROUND_Y - 78;
    return Math.abs(center - e._v139landX) <= e._v139radius && !high;
  }
  function landFish(s, e) {
    const p = s.player;
    const landedOnPlayer = splashHits(p, e);
    e.dead = true;
    e._v139warn?.remove?.();

    if (e.safeCollectible || e.collectibleSalmon) {
      e.damage = 0;
      e.dodgeDamage = 0;
      if (overlap(p, e)) {
        s.message = `${name()} collected salmon! +${SALMON_POINTS}`;
        effect(s, e.x + e.width / 2, Math.max(70, e.y - 8), `+${SALMON_POINTS}`, 0.6);
        window.RTA_HOCKEY_SMASH_SCORE?.recordSalmonCollect?.({ state: s, entity: e, points: SALMON_POINTS });
        status(s.message);
      }
      return;
    }

    if (landedOnPlayer && p.invincible <= 0) {
      const amount = e.dodgeDamage || 8;
      p.health = Math.max(0, p.health - amount);
      p.invincible = 0.85;
      s.message = `Fish splashed ${name()} for ${amount} damage!`;
      effect(s, e._v139landX || e.x, GROUND_Y - 70, 'SPLASH HIT!');
      window.RTA_HOCKEY_SMASH_SCORE?.recordDamage?.({ state: s, amount, source: 'salmon' });
      health(s);
      if (p.health <= 0) endRun(s);
    } else {
      s.message = `${name()} dodged the splash zone!`;
      effect(s, e._v139landX || e.x, GROUND_Y - 70, 'SPLASH!');
      window.RTA_HOCKEY_SMASH_SCORE?.recordDodge?.({ state: s, entity: e });
    }
    status(s.message);
  }
  function fishLoop(s, now) {
    const ids = new Set();
    s.entities.forEach((e) => {
      if (!e || e.dead || e.type !== 'salmon') return;
      prepFish(e, s, now);
      ids.add(id(e));
      const age = Math.max(0, (now - e._v139born) / 1000);
      let speed = 230 + Math.min(520, age * 230) + (Number(s.difficulty) || 0) * 120;
      if (e.variant === 'fastRain') speed *= 1.18;
      if (e.variant === 'heavyRain' || e.variant === 'schoolRain') speed *= 0.92;
      e._dodgeLayerResolved = true;
      e.damage = 0;
      if (e.safeCollectible || e.collectibleSalmon) e.dodgeDamage = 0;
      e.fallingFish = true;
      e.vx = 0;
      e.vy = speed;
      e.x = e._v139landX - e.width / 2;
      placeWarning(e);
      if (e.y + e.height >= GROUND_Y - 6) landFish(s, e);
    });
    document.querySelectorAll('[data-hockey-fish-warning]').forEach((n) => { if (!ids.has(n.dataset.hockeyFishWarning)) n.remove(); });
  }

  function loop() {
    const s = state();
    if (s) {
      if (s.player.grounded) s.player._doubleJumpUsed = false;
      s.entities.forEach((e) => { if (e && !e.dead) { ord(e); tuneFamily(s, e); } });
      oneBigAnimal(s);
      fishLoop(s, performance.now());
      projectileFamilyHits(s);
      health(s);
    } else {
      document.querySelectorAll('[data-hockey-fish-warning]').forEach((n) => n.remove());
    }
    window.requestAnimationFrame(loop);
  }

  function ready() {
    const badge = document.getElementById('hockey-build-badge');
    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api()?.getVersion) api().getVersion = () => DISPLAY_VERSION;
    document.body.dataset.hockeyButtonDebug = 'v0.13.9';
    bindDoubleJump();
    window.HOCKEY_BOOT_LOG?.log?.('family-combat', 'Fish warnings, dance chase, shoe/puck family hits, single wildlife, double jump, and salmon collectible landing rules loaded.');
    window.requestAnimationFrame(loop);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
