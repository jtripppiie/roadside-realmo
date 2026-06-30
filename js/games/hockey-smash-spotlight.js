(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.14.1';
  const DISPLAY_BUILD = 'Build 2026-06-29.57';
  const W = 1024;
  const H = 576;
  const GROUND_Y = H * 0.82;
  const BEAR_BASE = 132;
  const BEAR_LATE = 188;
  const POWERUP_MS = 6500;
  let calmBoostUntil = 0;
  let boyNode = null;
  let boyLastLineAt = 0;

  function api() { return window.RTA_HOCKEY_SMASH; }
  function getState() {
    const s = api()?.getState?.();
    if (!s || !s.player || ['splash', 'transition', 'tryAgain'].includes(s.mode)) return null;
    if (!Array.isArray(s.effects)) s.effects = [];
    return s;
  }
  function playerConfig() { return api()?.getPlayerConfig?.() || { character: 'daniel', name: 'Daniel' }; }
  function isSofie() { return playerConfig().character === 'sofie'; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function difficulty(s) { return clamp(Number(s?.difficulty) || ((s?.time || 0) / 125), 0, 1); }
  function status(text) { const el = document.getElementById('hockey-status'); if (el && text) el.textContent = text; }
  function effect(s, x, y, text, life = 0.45) { s.effects?.push?.({ x, y, text, life }); }

  function activateCalmBoost(duration = POWERUP_MS) {
    const s = getState();
    if (!s) return;
    calmBoostUntil = performance.now() + Math.min(Math.max(Number(duration) || POWERUP_MS, 2500), 9000);
    resetCamera();
    s.message = 'Spotlight boost! Clear shot, no screen shake.';
    effect(s, s.player.x + s.player.width / 2, s.player.y - 20, 'SPOTLIGHT!', 0.6);
    status(s.message);
  }

  function calmBoostActive() {
    return performance.now() < calmBoostUntil;
  }

  function resetCamera() {
    const canvas = document.getElementById('hockey-canvas');
    if (canvas && canvas.style.transform) canvas.style.transform = '';
  }

  function slowBears(s) {
    const d = difficulty(s);
    const target = BEAR_BASE + (BEAR_LATE - BEAR_BASE) * d;
    (s.entities || []).forEach((e) => {
      if (!e || e.dead || e.type !== 'bear') return;
      e.vx = -target;
      e._bearTunedSlow = Number(target.toFixed(1));
    });
  }

  function ensureBoyNode() {
    if (boyNode?.isConnected) return boyNode;
    boyNode = document.createElement('div');
    boyNode.setAttribute('aria-hidden', 'true');
    boyNode.dataset.cuteBoyCameo = 'v0.14.1';
    boyNode.textContent = '💙 You got this!';
    Object.assign(boyNode.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      zIndex: '9',
      pointerEvents: 'none',
      padding: '.28rem .48rem',
      border: '2px solid rgba(255,255,255,.92)',
      borderRadius: '999px',
      background: 'rgba(30,41,59,.86)',
      color: '#dbeafe',
      font: '900 13px/1.1 system-ui,sans-serif',
      textShadow: '0 1px 3px rgba(0,0,0,.65)',
      boxShadow: '0 8px 22px rgba(0,0,0,.35), 0 0 18px rgba(147,197,253,.45)',
      transform: 'translate(-50%,-50%)',
      whiteSpace: 'nowrap',
    });
    document.body.appendChild(boyNode);
    return boyNode;
  }

  function hideBoyNode() {
    if (boyNode) boyNode.hidden = true;
  }

  function placeBoyCameo(s) {
    if (!isSofie()) {
      hideBoyNode();
      return;
    }
    const dancer = (s.entities || []).find((e) => e && !e.dead && e.type === 'danceInstructor');
    if (!dancer) {
      hideBoyNode();
      return;
    }
    const canvas = document.getElementById('hockey-canvas');
    const rect = canvas?.getBoundingClientRect?.();
    if (!rect?.width || !rect?.height) return;
    const node = ensureBoyNode();
    node.hidden = false;
    const x = dancer.x + dancer.width / 2 + 46;
    const y = dancer.y - 34;
    node.style.left = `${rect.left + x / W * rect.width}px`;
    node.style.top = `${rect.top + y / H * rect.height}px`;

    const now = performance.now();
    if (now - boyLastLineAt > 4500) {
      boyLastLineAt = now;
      effect(s, dancer.x + dancer.width / 2, dancer.y - 18, 'CUTE BOY CHEERS!', 0.5);
    }
  }

  function loop() {
    resetCamera();
    const s = getState();
    if (s) {
      slowBears(s);
      placeBoyCameo(s);
    } else {
      hideBoyNode();
    }
    window.requestAnimationFrame(loop);
  }

  function ready() {
    const badge = document.getElementById('hockey-build-badge');
    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api()?.getVersion) api().getVersion = () => DISPLAY_VERSION;
    document.body.dataset.hockeyButtonDebug = 'v0.14.1';
    window.HOCKEY_BOOT_LOG?.log?.('spotlight', 'Locks camera shake, slows bears more, and adds Sofie cute-boy dance cameo.');
    window.requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
