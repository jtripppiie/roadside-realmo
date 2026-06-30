(function () {
  const DESIGN_WIDTH = 1024;
  const DESIGN_HEIGHT = 576;
  const STORAGE_KEY = 'hockeySmashHighScoreNoDistance';
  const COMBO_TIMEOUT = 2.5;
  const SALMON_COLLECT_POINTS = 67;

  let api = null;
  let canvas = null;
  let scoreEl = null;
  let splashHighEl = null;
  let summaryEl = null;
  let originalCanvasTransform = '';
  let activeState = null;
  let lastFrame = performance.now();
  let metrics = createFreshMetrics();

  function createFreshMetrics() {
    return {
      survivalTime: 0,
      bonusScore: 0,
      score: 0,
      combo: 0,
      peakCombo: 0,
      comboTimer: 0,
      difficulty: 0,
      highScore: loadHighScore(),
      lastHealth: null,
      shake: 0,
      newHighScore: false,
      pucksHit: 0,
      fishDodged: 0,
      salmonCollected: 0,
      damageTaken: 0,
    };
  }

  function loadHighScore() {
    try {
      return Number(window.localStorage.getItem(STORAGE_KEY) || 0) || 0;
    } catch (error) {
      return 0;
    }
  }

  function saveHighScore(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    } catch (error) {
      // localStorage can be unavailable in private browsing or strict contexts.
    }
  }

  function onReady() {
    api = window.RTA_HOCKEY_SMASH;
    canvas = document.getElementById('hockey-canvas');
    originalCanvasTransform = canvas?.style?.transform || '';

    ensureScoreHud();
    ensureSummaryPanel();
    exposeScoreHooks();
    window.requestAnimationFrame(runScoreLayer);
  }

  function ensureScoreHud() {
    const hud = document.querySelector('.hockey-hud');
    scoreEl = document.getElementById('hockey-score');
    if (hud && !scoreEl) {
      scoreEl = document.createElement('div');
      scoreEl.id = 'hockey-score';
      scoreEl.className = 'hockey-score';
      const status = document.getElementById('hockey-status');
      hud.insertBefore(scoreEl, status || null);
    }

    if (scoreEl) {
      Object.assign(scoreEl.style, {
        fontWeight: '900',
        letterSpacing: '.03em',
        textShadow: '0 2px 6px rgba(0,0,0,.45)',
        whiteSpace: 'nowrap',
        transition: 'transform .16s ease, color .16s ease',
      });
    }

    const splashContent = document.querySelector('.hockey-splash__content');
    if (splashContent && !document.getElementById('hockey-high-score')) {
      splashHighEl = document.createElement('p');
      splashHighEl.id = 'hockey-high-score';
      splashHighEl.className = 'hockey-high-score';
      splashHighEl.textContent = `High Score: ${metrics.highScore}`;
      splashContent.appendChild(splashHighEl);
    } else {
      splashHighEl = document.getElementById('hockey-high-score');
    }
  }

  function ensureSummaryPanel() {
    const tryAgainCard = document.querySelector('#hockey-try-again > div');
    if (!tryAgainCard) return;
    summaryEl = document.getElementById('hockey-run-summary');
    if (!summaryEl) {
      summaryEl = document.createElement('div');
      summaryEl.id = 'hockey-run-summary';
      summaryEl.className = 'hockey-run-summary';
      tryAgainCard.insertBefore(summaryEl, tryAgainCard.querySelector('button') || null);
    }
    Object.assign(summaryEl.style, {
      display: 'grid',
      gap: '.35rem',
      margin: '1rem 0',
      padding: '.85rem',
      border: '2px solid rgba(255,255,255,.35)',
      borderRadius: '1rem',
      background: 'rgba(6,10,18,.58)',
      fontWeight: '900',
    });
  }

  function projectileHitLabel(payload = {}, destroyed = false) {
    if (payload.projectileType === 'pointe-shoe') {
      if (destroyed) return 'SHOE KO!';
      if (payload.puckVariant === 'aerial') return 'AIR SHOE!';
      if (payload.puckVariant === 'slide') return 'LOW SHOE!';
      return 'POINTE SHOE!';
    }
    if (destroyed) return 'KO!';
    if (payload.puckVariant === 'aerial') return 'AIR PUCK!';
    if (payload.puckVariant === 'slide') return 'LOW PUCK!';
    return 'PUCK!';
  }

  function exposeScoreHooks() {
    window.RTA_HOCKEY_SMASH_SCORE = {
      recordPuckHit(payload = {}) {
        const destroyed = Boolean(payload.destroyed);
        const aerialBonus = payload.puckVariant === 'aerial' ? 60 : payload.puckVariant === 'slide' ? 35 : 0;
        const label = projectileHitLabel(payload, destroyed);
        metrics.pucksHit += 1;
        addComboBonus((destroyed ? 200 : 80) + aerialBonus, label, payload.state, payload.target);
      },
      recordDodge(payload = {}) {
        metrics.fishDodged += 1;
        addComboBonus(70, 'DODGE!', payload.state, payload.entity || payload.state?.player);
      },
      recordSalmonCollect(payload = {}) {
        const points = Number(payload.points) || SALMON_COLLECT_POINTS;
        const state = payload.state || activeState;
        const entity = payload.entity || state?.player;
        metrics.salmonCollected += 1;
        metrics.bonusScore += points;
        if (state) {
          const playerName = window.RTA_HOCKEY_SMASH?.getPlayerConfig?.().name || 'Daniel';
          state.message = `${playerName} collected salmon! +${points}`;
          state.salmonCollected = metrics.salmonCollected;
        }
        createFloatingTextNear(state, entity, `+${points}`, '#fff27a');
        pulseScoreHud();
      },
      recordDamage(payload = {}) {
        const amount = Number(payload.amount) || 0;
        metrics.damageTaken += amount;
        resetCombo();
        const state = payload.state || activeState;
        const playerName = window.RTA_HOCKEY_SMASH?.getPlayerConfig?.().name || 'Daniel';
        if (state) state.message = payload.source === 'salmon' ? `Fish clipped ${playerName}. Combo reset!` : `${playerName} got hit. Combo reset!`;
        createFloatingTextNear(state, state?.player, amount ? `-${amount} HP` : 'HIT!', '#fb7185');
      },
      getMetrics() {
        return { ...metrics };
      },
    };
  }

  function addComboBonus(points, label, state, anchor) {
    metrics.combo = Math.min(5, metrics.combo + 1);
    metrics.peakCombo = Math.max(metrics.peakCombo, metrics.combo);
    metrics.comboTimer = COMBO_TIMEOUT;
    metrics.bonusScore += points * metrics.combo;
    const targetState = state || activeState;
    const targetAnchor = anchor || targetState?.player;
    if (targetState?.effects) {
      const player = targetState.player || { x: DESIGN_WIDTH / 2, y: 300, width: 50 };
      targetState.effects.push({
        x: player.x + player.width / 2,
        y: Math.max(80, player.y - 16),
        text: `${label} x${metrics.combo}`,
        life: 0.45,
      });
    }
    createFloatingTextNear(targetState, targetAnchor, `${label} x${metrics.combo}`, metrics.combo >= 3 ? '#facc15' : '#fff27a');
    pulseScoreHud();
  }

  function resetCombo() {
    metrics.combo = 0;
    metrics.comboTimer = 0;
    if (scoreEl) scoreEl.dataset.combo = '0';
  }

  function getState() {
    return api?.getState?.() || null;
  }

  function isPlayable(state) {
    return Boolean(state?.player) && !['splash', 'transition', 'tryAgain'].includes(state.mode);
  }

  function resetForState(state) {
    activeState = state;
    metrics = createFreshMetrics();
    metrics.lastHealth = state?.player?.health ?? null;
    if (summaryEl) summaryEl.hidden = true;
  }

  function runScoreLayer(now) {
    const dt = Math.min(0.05, Math.max(0.008, (now - lastFrame) / 1000 || 0.016));
    lastFrame = now;

    const state = getState();
    if (state && state !== activeState && state.player) resetForState(state);

    if (isPlayable(state)) {
      updateProgress(state, dt);
      detectDamage(state);
      clearScreenShake();
    } else {
      clearScreenShake();
    }

    updateHud(state);
    updateSummaryPanel(state);
    window.requestAnimationFrame(runScoreLayer);
  }

  function updateProgress(state, dt) {
    if (
      state?.readyCountdownActive ||
      (typeof state?.readyCountdownSeconds === 'number' && state.readyCountdownSeconds > 0.1)
    ) {
      if (metrics.comboTimer > 0) {
        metrics.comboTimer = Math.max(0, metrics.comboTimer - dt);
        if (metrics.comboTimer === 0) metrics.combo = 0;
      }
      return;
    }

    metrics.survivalTime += dt;
    metrics.difficulty = Math.min(1, metrics.survivalTime / 120);

    if (metrics.comboTimer > 0) {
      metrics.comboTimer = Math.max(0, metrics.comboTimer - dt);
      if (metrics.comboTimer === 0) metrics.combo = 0;
    }

    const baseScore = metrics.bonusScore + metrics.combo * 25;
    metrics.score = Math.max(metrics.score, baseScore);

    if (metrics.score > metrics.highScore) {
      metrics.highScore = metrics.score;
      metrics.newHighScore = true;
      saveHighScore(metrics.highScore);
    }

    state.score = metrics.score;
    state.difficulty = metrics.difficulty;
    state.peakCombo = metrics.peakCombo;
    state.pucksHit = metrics.pucksHit;
    state.fishDodged = metrics.fishDodged;
    state.salmonCollected = metrics.salmonCollected;
    state.player.combo = metrics.combo;
    state.player.comboTimer = metrics.comboTimer;
  }

  function detectDamage(state) {
    const health = state.player?.health;
    if (typeof health !== 'number') return;
    if (metrics.lastHealth != null && health < metrics.lastHealth) {
      window.RTA_HOCKEY_SMASH_SCORE?.recordDamage?.({ state, amount: metrics.lastHealth - health });
    }
    metrics.lastHealth = health;
  }

  function clearScreenShake() {
    if (!canvas) return;
    canvas.style.transform = originalCanvasTransform;
    delete canvas.dataset.shaking;
    metrics.shake = 0;
  }

  function updateHud(state) {
    if (scoreEl) {
      const comboText = metrics.combo > 1 ? ` | Combo x${metrics.combo}` : '';
      const highText = metrics.newHighScore ? ' | NEW HIGH!' : ` | High ${metrics.highScore}`;
      const progressionText = progressionLabel(metrics.highScore || metrics.score);
      scoreEl.textContent = `Score ${metrics.score} | Salmon: ${metrics.salmonCollected}${comboText}${highText} | ${progressionText}`;
      scoreEl.dataset.combo = String(metrics.combo);
      scoreEl.style.transform = metrics.combo > 1 ? 'scale(1.045)' : '';
    }
    if (splashHighEl) splashHighEl.textContent = `High Score: ${metrics.highScore}`;

    if (state?.mode === 'tryAgain' && metrics.score >= metrics.highScore) {
      saveHighScore(Math.max(metrics.highScore, metrics.score));
    }
  }

  function progressionLabel(score) {
    if (score >= 1000) return 'Rank: Trick Shot';
    if (score >= 500) return 'Rank: Fire Shot';
    return `Next Rank ${Math.max(0, 500 - score)}`;
  }

  function updateSummaryPanel(state) {
    if (!summaryEl) return;
    if (state?.mode !== 'tryAgain') {
      summaryEl.hidden = true;
      return;
    }
    summaryEl.hidden = false;
    summaryEl.innerHTML = `
      <strong>Run Summary</strong>
      <span>Score: ${metrics.score}${metrics.newHighScore ? ' — New High!' : ''}</span>
      <span>Best Combo: x${metrics.peakCombo}</span>
      <span>Projectile Hits: ${metrics.pucksHit}</span>
      <span>Salmon Collected: ${metrics.salmonCollected}</span>
    `;
  }

  function pulseScoreHud() {
    if (!scoreEl) return;
    scoreEl.style.transform = 'scale(1.08)';
    window.setTimeout(() => {
      if (scoreEl && metrics.combo <= 1) scoreEl.style.transform = '';
    }, 180);
  }

  function createFloatingTextNear(state, anchor, text, color) {
    if (!canvas || !state || !anchor) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const scaleX = rect.width / DESIGN_WIDTH;
    const scaleY = rect.height / DESIGN_HEIGHT;
    const el = document.createElement('div');
    el.className = 'hockey-floating-text';
    el.textContent = text;
    Object.assign(el.style, {
      position: 'fixed',
      left: `${rect.left + (anchor.x + (anchor.width || 0) / 2) * scaleX}px`,
      top: `${rect.top + Math.max(40, (anchor.y || 0) - 12) * scaleY}px`,
      zIndex: '99999',
      pointerEvents: 'none',
      color,
      fontWeight: '1000',
      letterSpacing: '.04em',
      textShadow: '0 2px 8px rgba(0,0,0,.85)',
      transform: 'translate(-50%, 0) scale(1)',
      opacity: '1',
      transition: 'transform 1.1s ease, opacity 1.1s ease',
    });
    document.body.appendChild(el);
    window.requestAnimationFrame(() => {
      el.style.transform = 'translate(-50%, -72px) scale(1.16)';
      el.style.opacity = '0';
    });
    window.setTimeout(() => el.remove(), 1300);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
})();
