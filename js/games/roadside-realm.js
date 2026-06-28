(function () {
  const DATA = window.RTA_ROADSIDE_REALM_DATA;
  const ART = window.RTA_ROADSIDE_REALM_ART || { sprites: {}, monsterSprites: {}, layers: [] };
  const SAVE_VERSION = 1;
  const DEBUG = new URLSearchParams(window.location.search).get('realmDebug') === '1';
  const DIRECTIONS = ['north', 'east', 'south', 'west'];
  const VECTORS = {
    north: { x: 0, y: -1 },
    east: { x: 1, y: 0 },
    south: { x: 0, y: 1 },
    west: { x: -1, y: 0 },
  };

  let state = null;
  let elements = {};
  let inputLocked = false;
  let ctrlPresses = [];
  const keyedImageCache = new Map();
  const assets = {
    signpostOgre: loadImage('assets/roadside-realm/sprites/realm-sprite-signpost-ogre.png'),
    moonlitWarden: loadImage('assets/roadside-realm/sprites/realm-sprite-moonlit-warden.png'),
    items: loadImage('assets/roadside-realm/items/realm-items-core.png'),
    moonScratch: loadImage('assets/roadside-realm/tiles/realm-tile-hidden-moon-scratch.png'),
  };

  const ITEM_FRAMES = {
    'rusty-road-key': 0,
    mapstone: 1,
    'moon-toll-token': 2,
    'apple-juice-potion': 3,
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadImage(src) {
    const image = new Image();
    image.src = src;
    image.addEventListener('load', () => render());
    return image;
  }

  function drawKeyedImage(ctx, image, sx, sy, sw, sh, dx, dy, dw, dh) {
    if (!image?.complete || !image.naturalWidth) return false;
    const cacheKey = `${image.src}|${sx}|${sy}|${sw}|${sh}`;
    let canvas = keyedImageCache.get(cacheKey);

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(sw));
      canvas.height = Math.max(1, Math.round(sh));
      const keyCtx = canvas.getContext('2d');
      keyCtx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

      try {
        const imageData = keyCtx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
          const red = pixels[i];
          const green = pixels[i + 1];
          const blue = pixels[i + 2];
          if (green > 130 && green > red * 1.35 && green > blue * 1.35) {
            pixels[i + 3] = 0;
          }
        }
        keyCtx.putImageData(imageData, 0, 0);
      } catch (error) {
        debugLog('error', { message: 'Unable to apply chroma key to local sprite.', error: String(error) });
      }

      keyedImageCache.set(cacheKey, canvas);
    }

    ctx.drawImage(canvas, dx, dy, dw, dh);
    return true;
  }

  function createDefaultState() {
    return {
      schemaVersion: 1,
      mode: 'TITLE',
      player: {
        mapId: DATA.start.mapId,
        x: DATA.start.x,
        y: DATA.start.y,
        facing: DATA.start.facing,
        hp: 18,
        maxHp: 18,
        attack: 4,
        defense: 1,
        level: 1,
        xp: 0,
        gold: 0,
        inventory: [],
      },
      flags: {
        tollGateOpen: false,
        secretSwitchPressed: false,
        secretWallOpen: false,
        mapstoneFound: false,
        bossDefeated: false,
        underpassFound: false,
        neverFinishedMansionUnlocked: false,
        neverFinishedMansionEntered: false,
        stairButtonPressed: false,
        blueprintWardenDefeated: false,
        blueprintStudyUnlocked: false,
        starMapFragmentFound: false,
        soldotnaWaysideFound: false,
        kenaiRiverCharmFound: false,
        hiddenConservatoryOpen: false,
        glassRoseFound: false,
        trueEndingUnlocked: false,
        impossibleRouteEndingUnlocked: false,
      },
      counters: {
        steps: 0,
        monstersDefeated: 0,
        treasuresFound: 0,
        secretsFound: 0,
        defeats: 0,
      },
      monsters: clone(DATA.monsters),
      collectedItems: {},
      discovered: {},
      log: [],
      ending: null,
      showMap: false,
      lastAction: 'idle',
      debug: DEBUG,
    };
  }

  function start() {
    cacheElements();
    bindEvents();
    applyStoredOptions();
    const dataErrors = validateData();
    state = loadGame() || createDefaultState();
    state.debug = DEBUG;
    if (dataErrors.length) {
      addLog(`Roadside Realm data warning: ${dataErrors[0]}`);
      debugLog('error', { dataErrors });
    }
    showSplash();
    render();
  }

  function cacheElements() {
    elements = {
      body: document.body,
      splash: document.getElementById('realm-splash'),
      play: document.getElementById('realm-play'),
      summary: document.getElementById('realm-summary'),
      start: document.getElementById('realm-start'),
      continue: document.getElementById('realm-continue'),
      resetSave: document.getElementById('realm-reset-save'),
      canvas: document.getElementById('realm-canvas'),
      pickupCard: document.getElementById('realm-pickup-card'),
      pickupIcon: document.getElementById('realm-pickup-icon'),
      pickupTitle: document.getElementById('realm-pickup-title'),
      pickupText: document.getElementById('realm-pickup-text'),
      neoView: document.getElementById('realm-neo-view'),
      neoDoor: document.getElementById('realm-neo-door'),
      neoObject: document.getElementById('realm-neo-object'),
      neoEntity: document.getElementById('realm-neo-entity'),
      neoEntityIcon: document.getElementById('realm-neo-entity-icon'),
      neoLocation: document.getElementById('realm-neo-location'),
      neoAhead: document.getElementById('realm-neo-ahead'),
      helpOverlay: document.getElementById('realm-help-overlay'),
      helpClose: document.getElementById('realm-help-close'),
      objective: document.getElementById('realm-objective'),
      hpMeter: document.getElementById('realm-hp-meter'),
      routeState: document.getElementById('realm-route-state'),
      threatState: document.getElementById('realm-threat-state'),
      facingState: document.getElementById('realm-facing-state'),
      frontState: document.getElementById('realm-front-state'),
      roomName: document.getElementById('realm-room-name'),
      roomCoords: document.getElementById('realm-room-coords'),
      roomAhead: document.getElementById('realm-room-ahead'),
      activeCharm: document.getElementById('realm-active-charm'),
      activeRelic: document.getElementById('realm-active-relic'),
      hp: document.getElementById('realm-hp'),
      atk: document.getElementById('realm-atk'),
      def: document.getElementById('realm-def'),
      level: document.getElementById('realm-level'),
      gold: document.getElementById('realm-gold'),
      inventory: document.getElementById('realm-inventory'),
      log: document.getElementById('realm-log'),
      live: document.getElementById('realm-live'),
      summaryTitle: document.getElementById('realm-summary-title'),
      summaryCopy: document.getElementById('realm-summary-copy'),
      summaryStats: document.getElementById('realm-summary-stats'),
      summaryNew: document.getElementById('realm-summary-new'),
      summaryMenu: document.getElementById('realm-summary-menu'),
      debug: document.getElementById('realm-debug'),
      debugStatus: document.getElementById('realm-debug-status'),
      options: {
        motion: document.getElementById('realm-option-motion'),
        contrast: document.getElementById('realm-option-contrast'),
        largeText: document.getElementById('realm-option-large-text'),
        sound: document.getElementById('realm-option-sound'),
      },
    };
  }

  function bindEvents() {
    elements.start.addEventListener('click', () => newGame());
    elements.continue.addEventListener('click', () => continueGame());
    elements.resetSave.addEventListener('click', () => resetGame());
    elements.summaryNew.addEventListener('click', () => newGame());
    elements.summaryMenu.addEventListener('click', () => showSplash());
    elements.helpClose.addEventListener('click', () => toggleHelp(false));

    document.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', () => handleAction(button.dataset.action));
    });

    document.querySelectorAll('[data-debug-action]').forEach((button) => {
      button.addEventListener('click', () => handleDebugAction(button.dataset.debugAction));
    });

    Object.entries(elements.options).forEach(([key, input]) => {
      input.addEventListener('change', () => {
        localStorage.setItem(`realmOption:${key}`, input.checked ? '1' : '0');
        applyOptions();
      });
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Control') {
        if (event.repeat) return;
        handleCtrlCheatSheetShortcut();
        return;
      }
      if (!elements.helpOverlay.hidden) {
        if (event.key === 'Escape') toggleHelp(false);
        return;
      }
      if (!elements.play || elements.play.hidden) return;
      const action = keyToAction(event.key);
      if (!action) return;
      event.preventDefault();
      handleAction(action);
    });
  }

  function keyToAction(key) {
    const keys = {
      ArrowUp: 'forward',
      w: 'forward',
      W: 'forward',
      ArrowDown: 'backward',
      s: 'backward',
      S: 'backward',
      ArrowLeft: 'turnLeft',
      a: 'turnLeft',
      A: 'turnLeft',
      ArrowRight: 'turnRight',
      d: 'turnRight',
      D: 'turnRight',
      Enter: 'inspect',
      ' ': 'inspect',
      f: 'attack',
      F: 'attack',
      i: 'useItem',
      I: 'useItem',
      m: 'toggleMap',
      M: 'toggleMap',
    };
    return keys[key] || null;
  }

  function applyStoredOptions() {
    Object.entries(elements.options).forEach(([key, input]) => {
      input.checked = localStorage.getItem(`realmOption:${key}`) === '1';
    });
    applyOptions();
  }

  function applyOptions() {
    elements.body.classList.toggle('realm-reduced-motion', elements.options.motion.checked);
    elements.body.classList.toggle('realm-high-contrast', elements.options.contrast.checked);
    elements.body.classList.toggle('realm-large-text', elements.options.largeText.checked);
  }

  function newGame() {
    state = createDefaultState();
    addLog('The map kiosk glows behind you.');
    revealCurrentTile();
    showPlay();
    saveGame();
    render();
  }

  function continueGame() {
    state = loadGame() || createDefaultState();
    showPlay();
    render();
  }

  function resetGame() {
    localStorage.removeItem(DATA.saveKey);
    state = createDefaultState();
    showSplash();
    render();
  }

  function showSplash() {
    elements.splash.hidden = false;
    elements.play.hidden = true;
    elements.summary.hidden = true;
    const hasSave = Boolean(loadGame());
    elements.continue.hidden = !hasSave;
    elements.resetSave.hidden = !hasSave;
  }

  function showPlay() {
    state.mode = 'EXPLORING';
    elements.splash.hidden = true;
    elements.play.hidden = false;
    elements.summary.hidden = true;
  }

  function handleAction(action) {
    if (action === 'showSplash') return showSplash();
    if (!state || elements.play.hidden || state.ending) return;
    if (inputLocked) return;
    inputLocked = true;
    try {
      state.lastAction = action;
      if (action === 'turnLeft') rotate(-1);
      if (action === 'turnRight') rotate(1);
      if (action === 'forward') attemptMove(1);
      if (action === 'backward') attemptMove(-1);
      if (action === 'inspect') inspect();
      if (action === 'attack') attack();
      if (action === 'useItem') useItem();
      if (action === 'toggleMap') {
        state.showMap = !state.showMap;
        addLog(state.showMap ? 'You unfold the tiny route map.' : 'You tuck the route map away.');
        debugLog('map', { showMap: state.showMap });
      }
      if (action === 'save') {
        saveGame();
        addLog('Quest saved on this device.');
      }
      if (action === 'toggleHelp') toggleHelp();
    } finally {
      inputLocked = false;
      render();
    }
  }

  function handleCtrlCheatSheetShortcut() {
    const now = Date.now();
    ctrlPresses = ctrlPresses.filter((time) => now - time < 1200);
    ctrlPresses.push(now);
    if (ctrlPresses.length >= 3) {
      ctrlPresses = [];
      toggleHelp();
    }
  }

  function toggleHelp(force) {
    const shouldOpen = typeof force === 'boolean' ? force : elements.helpOverlay.hidden;
    elements.helpOverlay.hidden = !shouldOpen;
    if (shouldOpen) elements.helpClose.focus();
  }

  function rotate(delta) {
    const index = DIRECTIONS.indexOf(state.player.facing);
    state.player.facing = DIRECTIONS[(index + delta + DIRECTIONS.length) % DIRECTIONS.length];
    addLog(delta < 0 ? 'You turn left.' : 'You turn right.');
    debugLog('move', { action: delta < 0 ? 'turnLeft' : 'turnRight', facing: state.player.facing });
  }

  function attemptMove(dir) {
    const target = tileAhead(dir);
    const dodgedSpin = dir < 0 && dodgePendingOgreSpin();
    const from = { mapId: state.player.mapId, x: state.player.x, y: state.player.y };
    const check = canEnter(target);
    if (!check.ok) {
      addLog(check.message);
      debugLog('move', { blocked: true, from, target, message: check.message });
      return;
    }

    state.player.x = target.x;
    state.player.y = target.y;
    state.counters.steps += 1;
    revealCurrentTile();
    addLog(dir > 0 ? 'You step forward.' : 'You step back.');
    if (dodgedSpin) addLog('The Big Spin clips empty air.');
    resolveEnterEvent(target);
    debugLog('move', { from, to: { mapId: state.player.mapId, x: state.player.x, y: state.player.y }, facing: state.player.facing });
    saveGame();
  }

  function dodgePendingOgreSpin() {
    const target = tileAhead(1);
    const event = getEvent(currentMap(), target.x, target.y);
    if (event?.type !== 'monster') return false;
    const monster = state.monsters[event.monsterId];
    if (monster?.type !== 'signpost-ogre' || !monster.pendingSpin) return false;
    monster.pendingSpin = false;
    debugLog('combat', { monsterId: monster.id, dodgedBigSpin: true });
    return true;
  }

  function canEnter(target) {
    const map = currentMap();
    const tile = getTile(map, target.x, target.y);
    if (!tile || tile === '#') return { ok: false, message: 'A wall blocks the way.' };
    const event = getEvent(map, target.x, target.y);
    if (event?.type === 'lockedDoor' && !state.flags[event.flag]) {
      if (!hasItem(event.requiredItem)) return { ok: false, message: event.lockedText };
      state.flags[event.flag] = true;
      addLog(event.unlockText);
      return { ok: true };
    }
    if (event?.type === 'hiddenWall' && !state.flags[event.flag]) {
      if (!state.flags[event.requiredFlag]) return { ok: false, message: event.blockedText };
      state.flags[event.flag] = true;
      state.counters.secretsFound += 1;
      addLog(event.text);
      return { ok: true };
    }
    if (event?.type === 'mansionDoor') {
      if (!hasItem(event.requiredItem)) return { ok: false, message: event.blockedText };
      state.flags.neverFinishedMansionUnlocked = true;
      return { ok: true };
    }
    if (event?.type === 'soldotnaGate') {
      if (!hasItem(event.requiredItem)) return { ok: false, message: event.blockedText };
      state.flags.soldotnaWaysideFound = true;
      return { ok: true };
    }
    if (event?.type === 'hiddenConservatory' && !state.flags[event.flag]) {
      if (!hasItem(event.requiredItem)) return { ok: false, message: event.blockedText };
      state.flags[event.flag] = true;
      state.counters.secretsFound += 1;
      addLog(event.text);
      return { ok: true };
    }
    if (event?.type === 'monster') {
      const monster = state.monsters[event.monsterId];
      if (monster && monster.hp > 0) return { ok: false, message: monster.text };
    }
    return { ok: true };
  }

  function resolveEnterEvent(position) {
    const map = currentMap();
    const event = getEvent(map, position.x, position.y);
    if (!event) return;

    if (event.type === 'item') {
      if (event.requiresFlag && !state.flags[event.requiresFlag]) {
        addLog(event.blockedText);
        return;
      }
      grantItem(event.itemId, event.text);
    }

    if (event.type === 'secretSwitch' && !state.flags[event.flag]) {
      state.flags[event.flag] = true;
      addLog(event.text);
    }

    if (event.type === 'heal') {
      const before = state.player.hp;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + event.healAmount);
      addLog(`${event.text} +${state.player.hp - before} HP.`);
    }

    if (event.type === 'return') {
      addLog(event.text);
      if (state.player.mapId === 'forgotten-underpass') state.flags.underpassFound = true;
      state.player.mapId = event.mapId;
      state.player.x = event.x;
      state.player.y = event.y;
      state.player.facing = event.facing;
      revealCurrentTile();
      debugLog('map-transition', { mapId: state.player.mapId, x: state.player.x, y: state.player.y });
    }

    if (event.type === 'hiddenWall' && state.flags[event.flag]) {
      addLog('A stairway drops into the Forgotten Underpass.');
      state.flags.underpassFound = true;
      state.player.mapId = 'forgotten-underpass';
      state.player.x = DATA.maps['forgotten-underpass'].start.x;
      state.player.y = DATA.maps['forgotten-underpass'].start.y;
      state.player.facing = DATA.maps['forgotten-underpass'].start.facing;
      revealCurrentTile();
      debugLog('map-transition', { mapId: state.player.mapId, x: state.player.x, y: state.player.y });
    }

    if (event.type === 'mansionDoor' && hasItem(event.requiredItem)) {
      addLog(event.text);
      state.flags.neverFinishedMansionUnlocked = true;
      state.flags.neverFinishedMansionEntered = true;
      state.player.mapId = event.mapId;
      state.player.x = event.x;
      state.player.y = event.y;
      state.player.facing = event.facing;
      revealCurrentTile();
      debugLog('map-transition', { mapId: state.player.mapId, x: state.player.x, y: state.player.y });
    }

    if (event.type === 'soldotnaGate' && hasItem(event.requiredItem)) {
      addLog(event.text);
      state.flags.soldotnaWaysideFound = true;
      state.player.mapId = event.mapId;
      state.player.x = event.x;
      state.player.y = event.y;
      state.player.facing = event.facing;
      revealCurrentTile();
      debugLog('map-transition', { mapId: state.player.mapId, x: state.player.x, y: state.player.y });
    }

    if (event.type === 'hiddenConservatory' && state.flags[event.flag]) {
      state.player.mapId = event.mapId;
      state.player.x = event.x;
      state.player.y = event.y;
      state.player.facing = event.facing;
      revealCurrentTile();
      debugLog('map-transition', { mapId: state.player.mapId, x: state.player.x, y: state.player.y });
    }

    if (event.type === 'exit' && hasItem(event.requiredItem)) {
      win();
    }
  }

  function inspect() {
    const target = tileAhead(1);
    const map = currentMap();
    const event = getEvent(map, target.x, target.y);
    const tile = getTile(map, target.x, target.y);
    if (event?.type === 'exit') {
      addLog(hasItem(event.requiredItem) ? 'The route glows. Step forward to leave the Roadside Realm.' : event.blockedText);
      debugLog('inspect', { target, event });
      return;
    }
    if (event?.type === 'hiddenWall') {
      addLog(state.flags[event.requiredFlag] ? 'The wall has a tiny moon-shaped scratch near the base.' : event.blockedText);
      debugLog('inspect', { target, event });
      return;
    }
    if (event?.type === 'mansionDoor') {
      addLog(hasItem(event.requiredItem) ? event.text : event.blockedText);
      debugLog('inspect', { target, event });
      return;
    }
    if (event?.type === 'soldotnaGate') {
      addLog(hasItem(event.requiredItem) ? event.text : event.blockedText);
      debugLog('inspect', { target, event });
      return;
    }
    if (event?.type === 'hiddenConservatory') {
      addLog(hasItem(event.requiredItem) ? 'Upside-down wallpaper curls away from a hidden glass hallway.' : event.blockedText);
      debugLog('inspect', { target, event });
      return;
    }
    if (event?.type === 'monster') {
      const monster = state.monsters[event.monsterId];
      addLog(monster && monster.hp > 0 ? `${monster.name} watches you, waiting.` : 'The path is clear now.');
      debugLog('inspect', { target, event, monster });
      return;
    }
    if (event?.type === 'lockedDoor') {
      addLog(state.flags[event.flag] ? 'The Toll Gate stands open.' : event.lockedText);
      debugLog('inspect', { target, event });
      return;
    }
    if (tile === '#') {
      addLog('A dusty wall. Nothing unusual.');
      debugLog('inspect', { target, tile });
      return;
    }
    addLog('The floor tiles look like pieces of an old road map.');
    debugLog('inspect', { target, tile, event });
  }

  function attack() {
    const target = tileAhead(1);
    const event = getEvent(currentMap(), target.x, target.y);
    if (event?.type !== 'monster') {
      addLog("There's nothing to attack here.");
      debugLog('combat', { noTarget: true, target });
      return;
    }
    const monster = state.monsters[event.monsterId];
    if (!monster || monster.hp <= 0) {
      addLog('The path is already clear.');
      debugLog('combat', { alreadyClear: true, target });
      return;
    }

    const dealt = rollDamage(state.player.attack, monster.defense);
    monster.hp = Math.max(0, monster.hp - dealt);
    addLog(`You bonk the ${monster.name} for ${dealt}.`);
    debugLog('combat', { monsterId: monster.id, dealt, remainingHp: monster.hp });
    if (monster.hp <= 0) {
      defeatMonster(monster);
      saveGame();
      return;
    }

    resolveMonsterTurn(monster);
    saveGame();
  }

  function resolveMonsterTurn(monster) {
    if (monster.type === 'map-bat' && Math.random() < 0.25) {
      addLog('The Map Bat flutters past, missing entirely.');
      return;
    }
    if (monster.type === 'signpost-ogre') {
      if (monster.pendingSpin) {
        monster.pendingSpin = false;
        const taken = rollDamage(monster.attack + 3, state.player.defense);
        state.player.hp = Math.max(0, state.player.hp - taken);
        addLog(`The Big Spin clips you for ${taken}.`);
        debugLog('combat', { monsterId: monster.id, bigSpin: true, taken, playerHp: state.player.hp });
        if (state.player.hp <= 0) defeatPlayer();
        return;
      }
      monster.turnCount = (monster.turnCount || 0) + 1;
      if (monster.turnCount % 3 === 0) {
        monster.pendingSpin = true;
        addLog('The Signpost Ogre winds up a Big Spin. Step back or brace yourself.');
        debugLog('combat', { monsterId: monster.id, telegraph: true });
        return;
      }
    }
    const taken = rollDamage(monster.attack, state.player.defense);
    state.player.hp = Math.max(0, state.player.hp - taken);
    addLog(`The ${monster.name} bumps you for ${taken}.`);
    debugLog('combat', { monsterId: monster.id, taken, playerHp: state.player.hp });
    if (state.player.hp <= 0) defeatPlayer();
  }

  function defeatMonster(monster) {
    state.counters.monstersDefeated += 1;
    state.player.xp += monster.xp;
    state.player.gold += monster.gold;
    addLog(`The ${monster.name} clears the path.`);
    if (monster.boss) {
      state.flags.bossDefeated = true;
      addLog("The Signpost Ogre's arrows clatter to the ground. The Mapstone can be claimed.");
    }
    if (monster.type === 'moonlit-warden') {
      state.flags.trueEndingUnlocked = true;
    }
    if (monster.type === 'blueprint-warden') {
      state.flags.blueprintWardenDefeated = true;
      addLog('The Blueprint Warden unfolds into a quiet stack of harmless floor plans.');
    }
    debugLog('combat', { defeated: monster.id, flags: state.flags });
  }

  function defeatPlayer() {
    state.counters.defeats += 1;
    state.player.hp = Math.max(5, Math.floor(state.player.maxHp / 2));
    const start = DATA.maps[DATA.startMap].start;
    state.player.mapId = DATA.startMap;
    state.player.x = start.x;
    state.player.y = start.y;
    state.player.facing = start.facing;
    addLog(`You wake up beside the glowing map kiosk with ${state.player.hp} HP.`);
    debugLog('combat', { defeatedPlayer: true, player: state.player });
  }

  function useItem() {
    const itemId = state.player.inventory.find((id) => DATA.items[id]?.type === 'consumable');
    if (!itemId) {
      addLog('No usable item right now.');
      debugLog('item', { useFailed: 'empty' });
      return;
    }
    const item = DATA.items[itemId];
    if (state.player.hp >= state.player.maxHp) {
      addLog('You are already at full HP.');
      debugLog('item', { useFailed: 'fullHp' });
      return;
    }
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + item.heal);
    state.player.inventory = state.player.inventory.filter((id) => id !== itemId);
    addLog(`You use ${item.name}. +${item.heal} HP.`);
    debugLog('item', { used: itemId, playerHp: state.player.hp });
    saveGame();
  }

  function grantItem(itemId, text) {
    const map = currentMap();
    const key = `${state.player.mapId}:${state.player.x},${state.player.y}`;
    if (state.collectedItems[key]) return;
    const item = DATA.items[itemId];
    if (!item) {
      addLog('The item flickers out before you can grab it.');
      debugLog('error', { missingItem: itemId, key });
      return;
    }
    state.collectedItems[key] = true;
    state.player.inventory.push(itemId);
    state.counters.treasuresFound += 1;
    if (itemId === 'mapstone') state.flags.mapstoneFound = true;
    if (itemId === 'moon-toll-token') state.flags.trueEndingUnlocked = true;
    if (itemId === 'star-map-fragment') {
      state.flags.starMapFragmentFound = true;
      state.flags.impossibleRouteEndingUnlocked = true;
    }
    if (itemId === 'glass-rose') state.flags.glassRoseFound = true;
    if (itemId === 'kenai-river-charm') state.flags.kenaiRiverCharmFound = true;
    addLog(text || `You found ${item.name}.`);
    showPickupCard(itemId, item);
    emitRealmEvent('item-collected', { itemId, itemName: item.name, mapId: map.id, x: state.player.x, y: state.player.y });
    debugLog('item', { pickedUp: itemId, key, inventory: state.player.inventory });
    if (map.id === 'forgotten-underpass' && itemId === 'moon-toll-token') {
      addLog('A secret star appears on your map.');
    }
  }

  function win() {
    if (hasItem('star-map-fragment') && state.flags.impossibleRouteEndingUnlocked) {
      state.ending = hasItem('glass-rose') ? 'glass' : 'impossible';
    } else if (hasItem('moon-toll-token') && state.flags.trueEndingUnlocked) {
      state.ending = 'true';
    } else {
      state.ending = 'normal';
    }
    debugLog('ending', { ending: state.ending, score: calculateScore() });
    saveGame();
    showSummary();
  }

  function showSummary() {
    elements.splash.hidden = true;
    elements.play.hidden = true;
    elements.summary.hidden = false;
    const score = calculateScore();
    const endingCopy = {
      normal: {
        title: 'Route Restored',
        copy: 'You escaped the Roadside Realm with the Mapstone. The route is restored, and someone in the car earns first snack pick.',
        label: 'Normal Route',
      },
      true: {
        title: 'Secret Star Ending',
        copy: 'You restored the moonlit route through the Forgotten Underpass. The Roadside Realm stamps your map with a secret star.',
        label: 'Secret Star Route',
      },
      impossible: {
        title: 'Impossible Route Ending',
        copy: 'You carried the Mapstone, Moon Toll Token, and Star Map Fragment back to the kiosk. A mansion hallway folds itself into the map, revealing a road that should not fit anywhere.',
        label: 'Impossible Route',
      },
      glass: {
        title: 'Impossible Route Ending',
        copy: 'You carried the Mapstone, Moon Toll Token, Star Map Fragment, and Glass Rose back to the kiosk. The hidden Conservatory leaves a silver bloom on your map.',
        label: 'Impossible Route + Glass Rose',
      },
    }[state.ending || 'normal'];
    elements.summaryTitle.textContent = endingCopy.title;
    elements.summaryCopy.textContent = endingCopy.copy;
    const stats = [
      ['Ending', endingCopy.label],
      ['Score', score],
      ['Steps', state.counters.steps],
      ['Monsters', state.counters.monstersDefeated],
      ['Treasures', state.counters.treasuresFound],
      ['Secrets', state.counters.secretsFound],
      ['Defeats', state.counters.defeats],
    ];
    elements.summaryStats.innerHTML = stats.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
  }

  function calculateScore() {
    return Math.max(0,
      state.counters.monstersDefeated * 50
      + state.counters.treasuresFound * 100
      + state.counters.secretsFound * 250
      + (state.flags.bossDefeated ? 500 : 0)
      + (state.flags.trueEndingUnlocked ? 1000 : 0)
      + (state.flags.impossibleRouteEndingUnlocked ? 1200 : 0)
      + (state.flags.glassRoseFound ? 500 : 0)
      + (state.flags.kenaiRiverCharmFound ? 350 : 0)
      - state.counters.defeats * 100
    );
  }

  function rollDamage(attack, defense) {
    return Math.max(1, attack + Math.floor(Math.random() * 3) - defense);
  }

  function hasItem(itemId) {
    return state.player.inventory.includes(itemId);
  }

  function currentMap() {
    const map = DATA.maps[state.player.mapId];
    if (map) return map;
    addLog('The map flickers. Returning to the kiosk.');
    debugLog('error', { missingMap: state.player.mapId });
    state.player.mapId = DATA.start.mapId;
    state.player.x = DATA.start.x;
    state.player.y = DATA.start.y;
    state.player.facing = DATA.start.facing;
    return DATA.maps[DATA.start.mapId];
  }

  function getTile(map, x, y) {
    return map.tiles[y]?.[x] || null;
  }

  function getEvent(map, x, y) {
    return map.events[`${x},${y}`] || null;
  }

  function tileAhead(dir) {
    const vector = VECTORS[state.player.facing];
    return {
      x: state.player.x + vector.x * dir,
      y: state.player.y + vector.y * dir,
    };
  }

  function revealCurrentTile() {
    const key = `${state.player.mapId}:${state.player.x},${state.player.y}`;
    state.discovered[key] = true;
  }

  function addLog(message) {
    state.log.unshift(message);
    state.log = state.log.slice(0, 8);
  }

  function emitRealmEvent(type, detail = {}) {
    debugLog(type, detail);
  }

  function saveGame() {
    try {
      localStorage.setItem(DATA.saveKey, JSON.stringify({
        saveVersion: SAVE_VERSION,
        gameVersion: DATA.version,
        state,
      }));
      debugLog('save', { saveVersion: SAVE_VERSION, gameVersion: DATA.version });
    } catch (error) {
      addLog("Heads up: this device can't save progress right now.");
      debugLog('error', { saveFailed: error.message });
    }
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(DATA.saveKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const rawState = parsed.saveVersion ? parsed.state : parsed;
      const normalized = normalizeState(rawState);
      debugLog('load', { saveVersion: parsed.saveVersion || 'legacy', gameVersion: parsed.gameVersion || 'unknown' });
      return normalized;
    } catch (error) {
      debugLog('error', { loadFailed: error.message });
      return null;
    }
  }

  function normalizeState(rawState) {
    if (!rawState?.player) return null;
    const defaults = createDefaultState();
    const normalized = {
      ...defaults,
      ...rawState,
      player: { ...defaults.player, ...(rawState.player || {}) },
      flags: { ...defaults.flags, ...(rawState.flags || {}) },
      counters: { ...defaults.counters, ...(rawState.counters || {}) },
      monsters: { ...clone(DATA.monsters), ...(rawState.monsters || {}) },
      collectedItems: { ...(rawState.collectedItems || {}) },
      discovered: { ...(rawState.discovered || {}) },
      log: Array.isArray(rawState.log) ? rawState.log.slice(0, 8) : [],
      debug: DEBUG,
    };
    if (!DIRECTIONS.includes(normalized.player.facing)) normalized.player.facing = DATA.start.facing;
    if (!DATA.maps[normalized.player.mapId]) normalized.player.mapId = DATA.start.mapId;
    normalized.player.x = Number(normalized.player.x);
    normalized.player.y = Number(normalized.player.y);
    if (!Number.isFinite(normalized.player.x) || !Number.isFinite(normalized.player.y) || !isWalkableSaveTile(normalized)) {
      normalized.player.mapId = DATA.start.mapId;
      normalized.player.x = DATA.start.x;
      normalized.player.y = DATA.start.y;
      normalized.player.facing = DATA.start.facing;
      normalized.log.unshift('The map rearranged itself and placed you back at the kiosk.');
      normalized.log = normalized.log.slice(0, 8);
    }
    normalized.player.hp = Math.max(1, Math.min(Number(normalized.player.hp) || defaults.player.hp, normalized.player.maxHp));
    return normalized;
  }

  function isWalkableSaveTile(candidate) {
    const map = DATA.maps[candidate.player.mapId];
    const tile = map?.tiles[candidate.player.y]?.[candidate.player.x];
    if (!tile || tile === '#') return false;
    const event = map.events[`${candidate.player.x},${candidate.player.y}`];
    if (event?.type === 'hiddenWall') return Boolean(candidate.flags[event.flag]);
    return true;
  }

  function validateData() {
    const errors = [];
    if (!DATA?.maps || !Object.keys(DATA.maps).length) errors.push('No maps are defined.');
    Object.values(DATA.maps || {}).forEach((map) => {
      if (!map.id) errors.push('A map is missing an id.');
      if (!Array.isArray(map.tiles)) errors.push(`${map.id} is missing tiles.`);
      const width = map.tiles?.[0]?.length || 0;
      map.tiles?.forEach((row, index) => {
        if (row.length !== width) errors.push(`${map.id} row ${index} width mismatch.`);
      });
      Object.entries(map.events || {}).forEach(([coord, event]) => {
        const [x, y] = coord.split(',').map(Number);
        if (!Number.isFinite(x) || !Number.isFinite(y) || y < 0 || y >= map.tiles.length || x < 0 || x >= width) {
          errors.push(`${map.id} event ${coord} is out of bounds.`);
        }
        if (event.itemId && !DATA.items[event.itemId]) errors.push(`${map.id} event ${coord} references missing item ${event.itemId}.`);
        if (event.monsterId && !DATA.monsters[event.monsterId]) errors.push(`${map.id} event ${coord} references missing monster ${event.monsterId}.`);
      });
    });
    if (!DATA.items?.mapstone) errors.push('Mapstone item is missing.');
    if (!DATA.maps?.['forgotten-underpass']) errors.push('Forgotten Underpass map is missing.');
    return errors;
  }

  function render() {
    if (!state) return;
    renderDom();
    renderCanvas();
    renderDebug();
  }

  function renderDom() {
    elements.hp.textContent = `${state.player.hp}/${state.player.maxHp}`;
    elements.atk.textContent = state.player.attack;
    elements.def.textContent = state.player.defense;
    elements.level.textContent = state.player.level;
    elements.gold.textContent = state.player.gold;
    elements.objective.textContent = objectiveText();
    elements.hpMeter.max = state.player.maxHp;
    elements.hpMeter.value = state.player.hp;
    elements.routeState.textContent = currentMap().name;
    elements.threatState.textContent = `Threat: ${threatText().toLowerCase()}`;
    elements.facingState.textContent = `Facing ${titleCase(state.player.facing)}`;
    elements.frontState.textContent = aheadDescription();
    elements.roomName.textContent = currentMap().name;
    elements.roomCoords.textContent = `${state.player.x},${state.player.y}`;
    elements.roomAhead.textContent = aheadDescription();
    elements.activeCharm.textContent = hasItem('kenai-river-charm') ? 'Kenai River Charm' : hasItem('moon-toll-token') ? 'Moon Toll Token' : 'Empty';
    elements.activeRelic.textContent = hasItem('mapstone') ? 'Mapstone' : 'None';
    elements.inventory.innerHTML = state.player.inventory.length
      ? state.player.inventory.map((id) => renderInventoryChip(id)).join('')
      : '<span class="realm-chip">No items yet</span>';
    elements.log.innerHTML = state.log.map((message) => `<li>${message}</li>`).join('');
    elements.live.textContent = `Facing ${state.player.facing}. ${aheadDescription()}`;
    renderNeoView();
  }

  function renderNeoView() {
    if (!elements.neoView) return;
    const map = currentMap();
    const target = tileAhead(1);
    const tile = getTile(map, target.x, target.y);
    const event = getEvent(map, target.x, target.y);
    const presentation = frontPresentation(tile, event, target);

    elements.neoView.className = [
      'realm-neo-view',
      `realm-neo-view--${map.id}`,
      `realm-neo-view--${presentation.kind}`,
      `realm-facing-${state.player.facing}`,
      inputLocked ? 'realm-neo-view--busy' : '',
      state.lastAction ? `realm-neo-view--action-${state.lastAction}` : '',
    ].filter(Boolean).join(' ');

    elements.neoDoor.className = `realm-neo__door realm-neo__door--${presentation.door || 'none'}`;
    elements.neoObject.className = `realm-neo__object realm-neo__object--${presentation.object || 'none'}`;
    elements.neoEntity.className = `realm-neo__entity realm-neo__entity--${presentation.entity || 'none'}`;
    elements.neoEntityIcon.textContent = presentation.icon || '';
    elements.neoLocation.textContent = map.name;
    elements.neoAhead.textContent = presentation.label;
  }

  function frontPresentation(tile, event, target) {
    if (!tile || tile === '#') return { kind: 'wall', label: 'Stone and old route lines', door: 'none', object: 'none', entity: 'none' };
    if (event?.type === 'lockedDoor' && !state.flags[event.flag]) return { kind: 'door', label: 'Locked Toll Gate', door: 'toll', object: 'none', entity: 'none' };
    if (event?.type === 'hiddenWall' && !state.flags[event.flag]) {
      return state.flags[event.requiredFlag]
        ? { kind: 'secret', label: 'Moon scratch wall', door: 'moon', object: 'moon', entity: 'none' }
        : { kind: 'wall', label: 'Hollow wall', door: 'none', object: 'none', entity: 'none' };
    }
    if (event?.type === 'mansionDoor') return { kind: 'gate', label: 'Painted mansion door', door: 'mansion', object: 'none', entity: 'none' };
    if (event?.type === 'soldotnaGate') return { kind: 'gate', label: 'Blue river route', door: 'river', object: 'river', entity: 'none' };
    if (event?.type === 'hiddenConservatory') return { kind: 'gate', label: 'Glass conservatory seam', door: 'glass', object: 'glass', entity: 'none' };
    if (event?.type === 'exit') return { kind: 'exit', label: hasItem('mapstone') ? 'Exit route glowing' : 'Dim kiosk exit', door: 'exit', object: 'route', entity: 'none' };
    if (event?.type === 'monster') {
      const monster = state.monsters[event.monsterId];
      if (monster?.hp > 0) {
        const sprite = ART.monsterSprites[monster.type] || {};
        return { kind: 'monster', label: `${monster.name} ahead`, door: 'none', object: 'none', entity: monster.type, icon: iconGlyph(sprite.icon || monster.type) };
      }
    }
    if (event?.type === 'item' && !state.collectedItems[`${state.player.mapId}:${targetKey(target)}`]) {
      const item = DATA.items[event.itemId];
      const sprite = ART.sprites[event.itemId] || {};
      return { kind: 'item', label: item?.name || 'Item ahead', door: 'none', object: sprite.icon || event.itemId, entity: 'none' };
    }
    if (event?.type === 'heal') return { kind: 'fountain', label: 'Healing fizz drain', door: 'none', object: 'heal', entity: 'none' };
    return { kind: 'open', label: 'Open route ahead', door: 'none', object: 'none', entity: 'none' };
  }

  function targetKey(target) {
    return `${target.x},${target.y}`;
  }

  function threatText() {
    const target = tileAhead(1);
    const event = getEvent(currentMap(), target.x, target.y);
    if (event?.type === 'monster') {
      const monster = state.monsters[event.monsterId];
      if (monster?.hp > 0) return monster.boss ? 'Boss' : 'Hostile';
    }
    if (state.player.hp <= Math.ceil(state.player.maxHp * 0.3)) return 'Low HP';
    return state.player.mapId.includes('mansion') || state.player.mapId.includes('underpass') ? 'Strange' : 'Calm';
  }

  function titleCase(value) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
  }

  function renderInventoryChip(itemId) {
    const item = DATA.items[itemId];
    const sprite = ART.sprites[itemId] || {};
    return [
      '<span class="realm-item-chip">',
      `<span class="realm-item-chip__icon" aria-hidden="true">${iconGlyph(sprite.icon || itemId)}</span>`,
      `<span>${item?.name || itemId}</span>`,
      '</span>',
    ].join('');
  }

  function showPickupCard(itemId, item) {
    if (!elements.pickupCard) return;
    const sprite = ART.sprites[itemId] || {};
    elements.pickupIcon.textContent = iconGlyph(sprite.icon || itemId);
    elements.pickupTitle.textContent = `Found: ${item.name}`;
    elements.pickupText.textContent = item.description || 'Added to your inventory.';
    elements.pickupCard.hidden = false;
    window.clearTimeout(showPickupCard.timer);
    showPickupCard.timer = window.setTimeout(() => {
      if (elements.pickupCard) elements.pickupCard.hidden = true;
    }, 2800);
  }

  function iconGlyph(icon) {
    const glyphs = {
      key: 'K',
      juice: '+',
      mapstone: 'M',
      'moon-token': 'C',
      'blueprint-key': 'B',
      'star-map': '*',
      'glass-rose': 'R',
      'sun-snack': '+',
      'river-charm': '~',
      'dust-goblin': 'G',
      'map-bat': 'B',
      'toll-troll': 'T',
      'signpost-ogre': 'O',
      'moonlit-warden': 'W',
      'blueprint-warden': 'P',
      'spruce-signling': 'S',
      'river-current-sprite': '~',
    };
    return glyphs[icon] || '?';
  }

  function renderDebug() {
    if (!elements.debug) return;
    elements.debug.hidden = !DEBUG;
    if (!DEBUG || !elements.debugStatus) return;
    const target = tileAhead(1);
    const map = currentMap();
    const event = getEvent(map, target.x, target.y);
    const tile = getTile(map, target.x, target.y);
    const ending = hasItem('mapstone')
      ? hasItem('star-map-fragment')
        ? hasItem('glass-rose')
          ? 'Impossible + Glass Rose eligible'
          : 'Impossible eligible'
        : hasItem('moon-toll-token') && state.flags.trueEndingUnlocked
          ? 'Secret Star eligible'
          : 'Normal eligible'
      : 'Not eligible';
    elements.debugStatus.textContent = [
      `Game: ${DATA.version} | Save: ${SAVE_VERSION}`,
      `Map: ${state.player.mapId}`,
      `Position: x=${state.player.x}, y=${state.player.y}`,
      `Facing: ${state.player.facing}`,
      `Ahead Tile: ${tile || 'void'}`,
      `Ahead Event: ${event ? event.type : 'none'}`,
      `HP: ${state.player.hp}/${state.player.maxHp}`,
      `Inventory: ${state.player.inventory.join(', ') || 'empty'}`,
      `Counters: ${JSON.stringify(state.counters)}`,
      `Flags: ${JSON.stringify(state.flags)}`,
      `Ending: ${ending}`,
    ].join('\n');
  }

  function handleDebugAction(action) {
    if (!DEBUG || !state) return;
    if (action === 'heal') state.player.hp = state.player.maxHp;
    if (action === 'giveMapstone') giveDebugItem('mapstone');
    if (action === 'giveMoonToken') {
      giveDebugItem('moon-toll-token');
      state.flags.trueEndingUnlocked = true;
    }
    if (action === 'giveStarMap') {
      giveDebugItem('star-map-fragment');
      state.flags.impossibleRouteEndingUnlocked = true;
    }
    if (action === 'giveGlassRose') giveDebugItem('glass-rose');
    if (action === 'jumpMain') jumpTo(DATA.start.mapId, DATA.start.x, DATA.start.y, DATA.start.facing);
    if (action === 'jumpUnderpass') {
      const start = DATA.maps['forgotten-underpass'].start;
      jumpTo('forgotten-underpass', start.x, start.y, start.facing);
    }
    if (action === 'jumpMansion') {
      const start = DATA.maps['never-finished-mansion'].start;
      jumpTo('never-finished-mansion', start.x, start.y, start.facing);
    }
    if (action === 'jumpSoldotna') {
      const start = DATA.maps['soldotna-wayside'].start;
      jumpTo('soldotna-wayside', start.x, start.y, start.facing);
    }
    if (action === 'jumpBoss') jumpTo('map-kiosk-dungeon', 5, 9, 'south');
    if (action === 'jumpExit') jumpTo('map-kiosk-dungeon', 1, 1, 'south');
    if (action === 'revealMap') revealCurrentMap();
    if (action === 'resetSave') {
      resetGame();
      debugLog('debug', { action });
      return;
    }
    if (action === 'logState') console.info('[RoadsideRealm:state]', clone(state));
    debugLog('debug', { action });
    saveGame();
    render();
  }

  function giveDebugItem(itemId) {
    if (!DATA.items[itemId] || state.player.inventory.includes(itemId)) return;
    state.player.inventory.push(itemId);
    if (itemId === 'mapstone') state.flags.mapstoneFound = true;
    if (itemId === 'star-map-fragment') state.flags.impossibleRouteEndingUnlocked = true;
    if (itemId === 'glass-rose') state.flags.glassRoseFound = true;
    addLog(`Debug: added ${DATA.items[itemId].name}.`);
  }

  function jumpTo(mapId, x, y, facing) {
    if (!DATA.maps[mapId]) return;
    state.player.mapId = mapId;
    state.player.x = x;
    state.player.y = y;
    state.player.facing = facing;
    revealCurrentTile();
    addLog(`Debug: jumped to ${DATA.maps[mapId].name}.`);
  }

  function revealCurrentMap() {
    const map = currentMap();
    map.tiles.forEach((row, y) => {
      Array.from(row).forEach((tile, x) => {
        if (tile !== '#') state.discovered[`${map.id}:${x},${y}`] = true;
      });
    });
    addLog(`Debug: revealed ${map.name}.`);
  }

  function debugLog(category, details) {
    if (!DEBUG) return;
    console.info(`[RoadsideRealm:${category}]`, details);
  }

  function objectiveText() {
    if (!hasItem('rusty-road-key')) return 'Find the Rusty Road Key for the Toll Gate.';
    if (!state.flags.tollGateOpen) return 'Return to the Toll Gate and unlock the route.';
    if (!state.flags.bossDefeated) return 'Defeat the Signpost Ogre and watch the signs.';
    if (!hasItem('mapstone')) return 'Claim the Mapstone beyond Signpost Court.';
    if (hasItem('moon-toll-token') && !hasItem('star-map-fragment') && state.flags.neverFinishedMansionUnlocked) return 'Explore the Never-Finished Mansion for the Star Map Fragment.';
    if (hasItem('star-map-fragment') && !hasItem('glass-rose')) return 'Return to the exit, or inspect the mansion wallpaper for one deeper secret.';
    if (hasItem('glass-rose')) return 'Return to the map kiosk exit with the impossible route restored.';
    if (hasItem('moon-toll-token')) return 'Return to the map kiosk exit for the secret route home.';
    return 'Return to the exit route near the map kiosk.';
  }

  function aheadDescription() {
    const target = tileAhead(1);
    const map = currentMap();
    const event = getEvent(map, target.x, target.y);
    const tile = getTile(map, target.x, target.y);
    if (!tile || tile === '#') return 'A wall is ahead.';
    if (event?.type === 'monster') {
      const monster = state.monsters[event.monsterId];
      if (monster?.hp > 0) return `${monster.name} blocks the way.`;
    }
    if (event?.type === 'lockedDoor' && !state.flags[event.flag]) return 'A locked Toll Gate is ahead.';
    if (event?.type === 'item') return `${DATA.items[event.itemId].name} is ahead.`;
    if (event?.type === 'exit') return 'The map kiosk exit is ahead.';
    if (event?.type === 'mansionDoor') return 'A painted mansion door is ahead.';
    if (event?.type === 'soldotnaGate') return 'A blue river route is ahead.';
    if (event?.type === 'hiddenConservatory') return 'A wallpaper seam is ahead.';
    return 'An open path is ahead.';
  }

  function renderCanvas() {
    const canvas = elements.canvas;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const map = currentMap();
    const target = tileAhead(1);
    const event = getEvent(map, target.x, target.y);
    const tile = getTile(map, target.x, target.y);
    const theme = themeForMap(map.id);

    ctx.clearRect(0, 0, w, h);
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.5);
    sky.addColorStop(0, theme.sky);
    sky.addColorStop(1, theme.shadow);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.5);
    const floor = ctx.createLinearGradient(0, h * 0.5, 0, h);
    floor.addColorStop(0, theme.floor);
    floor.addColorStop(1, theme.shadow);
    ctx.fillStyle = floor;
    ctx.fillRect(0, h * 0.5, w, h * 0.5);

    drawCorridor(ctx, tile, event, theme);
    drawRoomBanner(ctx, map.name, theme);
    drawCompass(ctx);
    if (state.showMap) drawMiniMap(ctx);
  }

  function themeForMap(mapId) {
    if (mapId === 'forgotten-underpass') {
      return { sky: '#121923', floor: '#263342', wall: '#4b5b68', accent: '#9de8ff', shadow: '#0b1018', mortar: '#1f2832' };
    }
    if (mapId === 'never-finished-mansion') {
      return { sky: '#2d2235', floor: '#3e3028', wall: '#726a75', accent: '#f3c64e', shadow: '#17111d', mortar: '#2d2632' };
    }
    if (mapId === 'hidden-conservatory') {
      return { sky: '#18342f', floor: '#2d4a3d', wall: '#607d67', accent: '#c9f7d5', shadow: '#0f1d1a', mortar: '#21372f' };
    }
    if (mapId === 'soldotna-wayside') {
      return { sky: '#17344f', floor: '#2f4b3f', wall: '#5f7f77', accent: '#6ed4ff', shadow: '#0d1c26', mortar: '#1f3a3a' };
    }
    return { sky: '#202532', floor: '#3f3f4e', wall: '#6f7378', accent: '#f3c64e', shadow: '#11131a', mortar: '#2d3036' };
  }

  function drawCorridor(ctx, tile, event, theme) {
    drawPerspectiveTunnel(ctx, theme);
    const cells = getViewCells();
    drawSidePassages(ctx, theme, cells);
    const blockedCell = cells.find((cell) => cell.blocked);
    const focusCell = cells.find((cell) => cell.event && shouldDrawEvent(cell));

    if (blockedCell && isSolidBlock(blockedCell)) {
      drawDepthWall(ctx, theme, blockedCell.depth);
      if (blockedCell.event?.type === 'lockedDoor' && !state.flags[blockedCell.event.flag]) drawTollGate(ctx, blockedCell.depth);
      if (blockedCell.event?.type === 'hiddenWall' && state.flags[blockedCell.event.requiredFlag]) drawMoonScratch(ctx, blockedCell.depth);
    }

    if (!blockedCell || blockedCell.depth > 1) drawOpenPassage(ctx, theme, blockedCell ? blockedCell.depth : 4);
    if (focusCell && (!blockedCell || focusCell.depth <= blockedCell.depth)) {
      if (focusCell.event.type === 'mansionDoor') drawMansionDoor(ctx, theme, focusCell.depth);
      if (focusCell.event.type === 'soldotnaGate') drawSoldotnaGate(ctx, theme, focusCell.depth);
      if (focusCell.event.type === 'hiddenConservatory') drawConservatoryDoor(ctx, theme, focusCell.depth);
      if (focusCell.event.type === 'monster') {
        const monster = state.monsters[focusCell.event.monsterId];
        if (monster?.hp > 0) drawMonster(ctx, monster, focusCell.depth);
      }
      if (focusCell.event.type === 'item') drawItem(ctx, focusCell.event.itemId, focusCell.depth);
      if (focusCell.event.type === 'exit') drawExit(ctx, focusCell.depth);
    }
  }

  function getViewCells() {
    const vector = VECTORS[state.player.facing];
    const map = currentMap();
    const cells = [];
    let viewBlocked = false;
    for (let depth = 1; depth <= 3; depth += 1) {
      const x = state.player.x + vector.x * depth;
      const y = state.player.y + vector.y * depth;
      const event = getEvent(map, x, y);
      const tile = getTile(map, x, y);
      const blocked = viewBlocked || isBlockedForView(tile, event);
      cells.push({ depth, x, y, tile, event, blocked });
      if (blocked) viewBlocked = true;
    }
    return cells;
  }

  function isBlockedForView(tile, event) {
    if (!tile || tile === '#') return true;
    if (event?.type === 'lockedDoor' && !state.flags[event.flag]) return true;
    if (event?.type === 'hiddenWall' && !state.flags[event.flag]) return true;
    if (event?.type === 'monster') {
      const monster = state.monsters[event.monsterId];
      return Boolean(monster && monster.hp > 0);
    }
    return false;
  }

  function isSolidBlock(cell) {
    if (!cell.tile || cell.tile === '#') return true;
    return ['lockedDoor', 'hiddenWall'].includes(cell.event?.type);
  }

  function shouldDrawEvent(cell) {
    if (cell.event.type === 'monster') {
      const monster = state.monsters[cell.event.monsterId];
      return Boolean(monster && monster.hp > 0);
    }
    if (cell.event.type === 'item') return !state.collectedItems[`${state.player.mapId}:${cell.x},${cell.y}`];
    return ['exit', 'mansionDoor', 'soldotnaGate', 'hiddenConservatory'].includes(cell.event.type);
  }

  function drawSidePassages(ctx, theme, cells) {
    const dirs = sideVectors();
    cells.forEach((cell) => {
      if (cell.depth > 3 || cell.blocked) return;
      const left = sideCell(cell, dirs.left);
      const right = sideCell(cell, dirs.right);
      if (left.open) drawSideOpening(ctx, theme, cell.depth, 'left');
      if (right.open) drawSideOpening(ctx, theme, cell.depth, 'right');
    });
  }

  function sideVectors() {
    const index = DIRECTIONS.indexOf(state.player.facing);
    return {
      left: VECTORS[DIRECTIONS[(index + DIRECTIONS.length - 1) % DIRECTIONS.length]],
      right: VECTORS[DIRECTIONS[(index + 1) % DIRECTIONS.length]],
    };
  }

  function sideCell(cell, vector) {
    const map = currentMap();
    const x = cell.x + vector.x;
    const y = cell.y + vector.y;
    const tile = getTile(map, x, y);
    const event = getEvent(map, x, y);
    return { x, y, tile, event, open: isOpenForView(tile, event) };
  }

  function isOpenForView(tile, event) {
    if (!tile || tile === '#') return false;
    if (event?.type === 'lockedDoor' && !state.flags[event.flag]) return false;
    if (event?.type === 'hiddenWall' && !state.flags[event.flag]) return false;
    return true;
  }

  function drawSideOpening(ctx, theme, depth, side) {
    const shapes = {
      1: {
        left: [[50, 88], [130, 52], [130, 368], [50, 332]],
        right: [[670, 88], [590, 52], [590, 368], [670, 332]],
      },
      2: {
        left: [[142, 116], [218, 96], [218, 310], [142, 286]],
        right: [[578, 116], [502, 96], [502, 310], [578, 286]],
      },
      3: {
        left: [[246, 154], [282, 142], [282, 262], [246, 244]],
        right: [[474, 154], [438, 142], [438, 262], [474, 244]],
      },
    };
    const points = shapes[depth]?.[side];
    if (!points) return;
    ctx.save();
    ctx.fillStyle = 'rgba(5, 7, 11, 0.68)';
    fillPoly(ctx, points);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = Math.max(2, 5 - depth);
    ctx.stroke();
    ctx.fillStyle = 'rgba(244,230,193,0.16)';
    const [p0, p1] = points;
    ctx.fillRect(Math.min(p0[0], p1[0]) + 8, (p0[1] + p1[1]) / 2, Math.max(10, Math.abs(p0[0] - p1[0]) - 16), Math.max(4, 12 - depth * 2));
    ctx.restore();
  }

  function drawPerspectiveTunnel(ctx, theme) {
    const near = { x: 52, y: 26, w: 616, h: 368 };
    const mid = { x: 142, y: 76, w: 436, h: 268 };
    const far = { x: 246, y: 132, w: 228, h: 154 };
    ctx.save();
    drawStonePanel(ctx, [[0, 0], [near.x, near.y], [near.x, near.y + near.h], [0, 420]], shade(theme.wall, -28), theme, 'left-near');
    drawStonePanel(ctx, [[720, 0], [near.x + near.w, near.y], [near.x + near.w, near.y + near.h], [720, 420]], shade(theme.wall, -28), theme, 'right-near');
    drawStonePanel(ctx, [[near.x, near.y], [mid.x, mid.y], [mid.x, mid.y + mid.h], [near.x, near.y + near.h]], shade(theme.wall, -12), theme, 'left-mid');
    drawStonePanel(ctx, [[near.x + near.w, near.y], [mid.x + mid.w, mid.y], [mid.x + mid.w, mid.y + mid.h], [near.x + near.w, near.y + near.h]], shade(theme.wall, -12), theme, 'right-mid');
    drawStonePanel(ctx, [[mid.x, mid.y], [far.x, far.y], [far.x, far.y + far.h], [mid.x, mid.y + mid.h]], shade(theme.wall, 4), theme, 'left-far');
    drawStonePanel(ctx, [[mid.x + mid.w, mid.y], [far.x + far.w, far.y], [far.x + far.w, far.y + far.h], [mid.x + mid.w, mid.y + mid.h]], shade(theme.wall, 4), theme, 'right-far');
    drawCeilingBlocks(ctx, theme, near, mid, far);
    drawFloorTiles(ctx, theme, near, mid, far);
    ctx.strokeStyle = 'rgba(244,230,193,0.22)';
    ctx.lineWidth = 4;
    [near, mid, far].forEach((rect) => ctx.strokeRect(rect.x, rect.y, rect.w, rect.h));
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(324, 420);
    ctx.lineTo(350, 292);
    ctx.moveTo(396, 420);
    ctx.lineTo(370, 292);
    ctx.stroke();
    drawTorch(ctx, theme);
    ctx.restore();
  }

  function drawStonePanel(ctx, points, fill, theme, key) {
    ctx.save();
    ctx.fillStyle = fill;
    fillPoly(ctx, points);
    ctx.clip();
    const minX = Math.min(...points.map(([x]) => x));
    const maxX = Math.max(...points.map(([x]) => x));
    const minY = Math.min(...points.map(([, y]) => y));
    const maxY = Math.max(...points.map(([, y]) => y));
    const rowH = key.includes('far') ? 22 : key.includes('mid') ? 30 : 38;
    const colW = key.includes('far') ? 48 : key.includes('mid') ? 62 : 78;
    ctx.strokeStyle = theme.mortar;
    ctx.lineWidth = 3;
    for (let y = minY - rowH; y <= maxY + rowH; y += rowH) {
      ctx.beginPath();
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y + (key.includes('left') ? 12 : -12));
      ctx.stroke();
    }
    let row = 0;
    for (let y = minY - rowH; y <= maxY + rowH; y += rowH) {
      const offset = row % 2 ? colW / 2 : 0;
      for (let x = minX - colW; x <= maxX + colW; x += colW) {
        ctx.beginPath();
        ctx.moveTo(x + offset, y);
        ctx.lineTo(x + offset + (key.includes('left') ? 18 : -18), y + rowH);
        ctx.stroke();
      }
      row += 1;
    }
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    for (let y = minY + 8; y <= maxY; y += rowH * 2) {
      ctx.fillRect(minX + 12, y, Math.max(18, (maxX - minX) * 0.12), 4);
    }
    ctx.restore();
  }

  function drawCeilingBlocks(ctx, theme, near, mid, far) {
    ctx.save();
    ctx.fillStyle = shade(theme.wall, -36);
    fillPoly(ctx, [[near.x, near.y], [near.x + near.w, near.y], [mid.x + mid.w, mid.y], [mid.x, mid.y]]);
    fillPoly(ctx, [[mid.x, mid.y], [mid.x + mid.w, mid.y], [far.x + far.w, far.y], [far.x, far.y]]);
    ctx.strokeStyle = theme.mortar;
    ctx.lineWidth = 3;
    [42, 62, 82, 102, 122].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(near.x + 40, y);
      ctx.lineTo(near.x + near.w - 40, y);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawFloorTiles(ctx, theme, near, mid, far) {
    ctx.save();
    ctx.fillStyle = shade(theme.floor, -8);
    fillPoly(ctx, [[near.x, near.y + near.h], [near.x + near.w, near.y + near.h], [mid.x + mid.w, mid.y + mid.h], [mid.x, mid.y + mid.h]]);
    fillPoly(ctx, [[mid.x, mid.y + mid.h], [mid.x + mid.w, mid.y + mid.h], [far.x + far.w, far.y + far.h], [far.x, far.y + far.h]]);
    ctx.strokeStyle = '#1b1e27';
    ctx.lineWidth = 4;
    [300, 324, 350, 380, 412].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(80, y);
      ctx.lineTo(640, y);
      ctx.stroke();
    });
    [260, 310, 360, 410, 460].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, 292);
      ctx.lineTo(x - 56, 420);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, 292);
      ctx.lineTo(x + 56, 420);
      ctx.stroke();
    });
    ctx.strokeStyle = theme.accent;
    ctx.globalAlpha = 0.42;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(338, 420);
    ctx.lineTo(356, 294);
    ctx.moveTo(382, 420);
    ctx.lineTo(364, 294);
    ctx.stroke();
    ctx.restore();
  }

  function drawTorch(ctx, theme) {
    ctx.save();
    const glow = ctx.createRadialGradient(134, 126, 4, 134, 126, 86);
    glow.addColorStop(0, 'rgba(255, 247, 89, 0.72)');
    glow.addColorStop(0.45, 'rgba(246, 166, 48, 0.22)');
    glow.addColorStop(1, 'rgba(246, 166, 48, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(42, 34, 190, 190);
    ctx.strokeStyle = '#1b1207';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(132, 146);
    ctx.lineTo(116, 196);
    ctx.stroke();
    ctx.fillStyle = '#70431a';
    ctx.fillRect(108, 192, 22, 42);
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.moveTo(132, 92);
    ctx.quadraticCurveTo(162, 124, 132, 158);
    ctx.quadraticCurveTo(104, 126, 132, 92);
    ctx.fill();
    ctx.fillStyle = '#fff95a';
    ctx.beginPath();
    ctx.moveTo(132, 110);
    ctx.quadraticCurveTo(148, 128, 130, 148);
    ctx.quadraticCurveTo(116, 128, 132, 110);
    ctx.fill();
    ctx.restore();
  }

  function depthRect(depth) {
    const rects = {
      1: { x: 128, y: 48, w: 464, h: 324 },
      2: { x: 218, y: 96, w: 284, h: 214 },
      3: { x: 282, y: 142, w: 156, h: 120 },
    };
    return rects[depth] || rects[1];
  }

  function drawDepthWall(ctx, theme, depth) {
    const rect = depthRect(depth);
    ctx.save();
    ctx.fillStyle = theme.wall;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = '#08090d';
    ctx.lineWidth = depth === 1 ? 8 : 5;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = 'rgba(244,230,193,0.32)';
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x + 14, rect.y + 14, rect.w - 28, rect.h - 28);
    drawWallTexture(ctx, rect.x, rect.y, rect.w, rect.h, theme);
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = 0.72;
    ctx.fillRect(rect.x + rect.w * 0.1, rect.y + rect.h * 0.1, rect.w * 0.2, Math.max(5, rect.h * 0.04));
    ctx.fillRect(rect.x + rect.w * 0.7, rect.y + rect.h * 0.86, rect.w * 0.18, Math.max(5, rect.h * 0.035));
    ctx.restore();
  }

  function drawOpenPassage(ctx, theme, maxDepth) {
    ctx.save();
    const rect = depthRect(Math.min(3, maxDepth - 1));
    ctx.fillStyle = 'rgba(8,9,13,0.50)';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(244,230,193,0.10)';
    ctx.fillRect(rect.x + rect.w * 0.25, rect.y + rect.h * 0.35, rect.w * 0.5, rect.h * 0.38);
    ctx.restore();
  }

  function fillPoly(ctx, points) {
    ctx.beginPath();
    points.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  }

  function shade(hex, amount) {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
    const b = Math.max(0, Math.min(255, (num & 255) + amount));
    return `rgb(${r}, ${g}, ${b})`;
  }

  function drawRoomBanner(ctx, name, theme) {
    ctx.save();
    ctx.fillStyle = 'rgba(23,25,31,0.72)';
    ctx.fillRect(18, 374, 300, 30);
    ctx.fillStyle = theme.accent;
    ctx.font = '800 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(name, 30, 394);
    ctx.restore();
  }

  function drawWallTexture(ctx, x, y, width, height, theme) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = theme?.mortar || '#17191f';
    const rowH = Math.max(18, height / 7);
    for (let ly = y + rowH; ly < y + height; ly += rowH) {
      ctx.beginPath();
      ctx.moveTo(x, ly);
      ctx.lineTo(x + width, ly);
      ctx.stroke();
    }
    let row = 0;
    for (let ly = y; ly < y + height; ly += rowH) {
      const colW = Math.max(34, width / 7);
      const offset = row % 2 ? colW / 2 : 0;
      for (let lx = x + offset; lx < x + width; lx += colW) {
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx, Math.min(y + height, ly + rowH));
        ctx.stroke();
      }
      row += 1;
    }
    ctx.restore();
  }

  function drawTollGate(ctx, depth = 1) {
    const rect = depthRect(depth);
    const barH = Math.max(12, rect.h * 0.1);
    const y = rect.y + rect.h * 0.48;
    const x = rect.x + rect.w * 0.07;
    const width = rect.w * 0.86;
    ctx.fillStyle = '#e56b2f';
    ctx.fillRect(x, y, width, barH);
    ctx.fillStyle = '#f4e6c1';
    for (let sx = x + 10; sx < x + width; sx += Math.max(20, width / 8)) {
      ctx.fillRect(sx, y, Math.max(10, width / 16), barH);
    }
  }

  function drawMansionDoor(ctx, theme, depth = 1) {
    const rect = depthRect(depth);
    const doorW = rect.w * 0.34;
    const doorH = rect.h * 0.74;
    const x = rect.x + (rect.w - doorW) / 2;
    const y = rect.y + rect.h * 0.18;
    ctx.save();
    ctx.fillStyle = '#3a2633';
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = Math.max(3, 6 - depth);
    ctx.fillRect(x, y, doorW, doorH);
    ctx.strokeRect(x, y, doorW, doorH);
    ctx.fillStyle = '#f4e6c1';
    ctx.fillRect(x + doorW * 0.43, y + doorH * 0.42, Math.max(6, doorW * 0.12), Math.max(6, doorW * 0.12));
    ctx.strokeStyle = 'rgba(244,230,193,0.5)';
    ctx.beginPath();
    ctx.moveTo(x + doorW * 0.18, y + doorH * 0.12);
    ctx.lineTo(x + doorW * 0.82, y + doorH * 0.12);
    ctx.moveTo(x + doorW * 0.18, y + doorH * 0.28);
    ctx.lineTo(x + doorW * 0.82, y + doorH * 0.28);
    ctx.stroke();
    ctx.restore();
  }

  function drawSoldotnaGate(ctx, theme, depth = 1) {
    const rect = depthRect(depth);
    const doorW = rect.w * 0.46;
    const doorH = rect.h * 0.58;
    const x = rect.x + (rect.w - doorW) / 2;
    const y = rect.y + rect.h * 0.24;
    ctx.save();
    ctx.fillStyle = 'rgba(18, 88, 126, 0.58)';
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = Math.max(3, 7 - depth);
    ctx.beginPath();
    ctx.moveTo(x, y + doorH * 0.22);
    ctx.bezierCurveTo(x + doorW * 0.24, y - doorH * 0.02, x + doorW * 0.76, y - doorH * 0.02, x + doorW, y + doorH * 0.22);
    ctx.lineTo(x + doorW, y + doorH);
    ctx.lineTo(x, y + doorH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#a9ecff';
    ctx.lineWidth = Math.max(2, 5 - depth);
    for (let i = 0; i < 3; i += 1) {
      const waveY = y + doorH * (0.38 + i * 0.15);
      ctx.beginPath();
      ctx.moveTo(x + doorW * 0.14, waveY);
      ctx.bezierCurveTo(x + doorW * 0.34, waveY - 18 / depth, x + doorW * 0.52, waveY + 18 / depth, x + doorW * 0.72, waveY);
      ctx.bezierCurveTo(x + doorW * 0.82, waveY - 10 / depth, x + doorW * 0.9, waveY - 8 / depth, x + doorW * 0.94, waveY);
      ctx.stroke();
    }

    ctx.fillStyle = '#f4e6c1';
    ctx.font = `800 ${Math.max(10, 17 - depth * 2)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('River route', x + doorW / 2, y + doorH + 24 / depth);
    ctx.restore();
  }

  function drawConservatoryDoor(ctx, theme, depth = 1) {
    const rect = depthRect(depth);
    const doorW = rect.w * 0.36;
    const doorH = rect.h * 0.72;
    const x = rect.x + (rect.w - doorW) / 2;
    const y = rect.y + rect.h * 0.18;
    ctx.save();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = Math.max(3, 6 - depth);
    ctx.beginPath();
    ctx.moveTo(x, y + doorH * 0.12);
    ctx.bezierCurveTo(x + doorW * 0.35, y - doorH * 0.1, x + doorW, y + doorH * 0.12, x + doorW, y + doorH * 0.45);
    ctx.lineTo(x + doorW, y + doorH);
    ctx.lineTo(x, y + doorH);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'rgba(201,247,213,0.16)';
    ctx.fill();
    ctx.fillStyle = '#c9f7d5';
    ctx.font = `800 ${Math.max(10, 18 - depth * 2)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Glass path', x + doorW / 2, y + doorH + 26 / depth);
    ctx.restore();
  }

  function drawMoonScratch(ctx, depth = 1) {
    const rect = depthRect(depth);
    if (assets.moonScratch.complete && assets.moonScratch.naturalWidth) {
      const size = rect.w * 0.36;
      drawKeyedImage(
        ctx,
        assets.moonScratch,
        0,
        0,
        assets.moonScratch.naturalWidth,
        assets.moonScratch.naturalHeight,
        rect.x + rect.w * 0.32,
        rect.y + rect.h * 0.26,
        size,
        size
      );
      return;
    }
    ctx.strokeStyle = '#8fd3ff';
    ctx.lineWidth = Math.max(3, 9 - depth * 2);
    [0, 34, 68].forEach((offset) => {
      ctx.beginPath();
      ctx.arc(rect.x + rect.w * 0.42 + offset / depth, rect.y + rect.h * 0.52, rect.w * 0.12, -1.1, 1.1);
      ctx.stroke();
    });
  }

  function drawMonster(ctx, monster, depth = 1) {
    const sprite = monster.type === 'signpost-ogre'
      ? assets.signpostOgre
      : monster.type === 'moonlit-warden'
        ? assets.moonlitWarden
        : null;
    if (sprite?.complete && sprite.naturalWidth) {
      const frameCount = 6;
      const frameWidth = sprite.naturalWidth / frameCount;
      let frame = 0;
      if (monster.hp <= monster.maxHp * 0.35) frame = 2;
      if (monster.boss && monster.hp <= monster.maxHp * 0.5) frame = 5;
      const scale = depth === 1 ? 1 : depth === 2 ? 0.68 : 0.46;
      const drawWidth = (monster.boss ? 255 : 225) * scale;
      const drawHeight = (monster.boss ? 208 : 225) * scale;
      const y = depth === 1 ? 112 : depth === 2 ? 145 : 174;
      drawKeyedImage(ctx, sprite, frame * frameWidth, 0, frameWidth, sprite.naturalHeight, 360 - drawWidth / 2, y, drawWidth, drawHeight);
      ctx.fillStyle = '#fff';
      ctx.font = `700 ${Math.max(11, 18 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(monster.name, 360, y + drawHeight + 22 * scale);
      ctx.fillText(`${monster.hp}/${monster.maxHp} HP`, 360, y + drawHeight + 46 * scale);
      return;
    }

    ctx.save();
    const scale = depth === 1 ? 1 : depth === 2 ? 0.68 : 0.46;
    ctx.translate(360, depth === 1 ? 245 : depth === 2 ? 228 : 214);
    ctx.scale(scale, scale);
    drawPrimitiveMonster(ctx, monster);
    ctx.fillStyle = '#fff';
    ctx.font = '700 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(monster.name, 0, 105);
    ctx.fillText(`${monster.hp}/${monster.maxHp} HP`, 0, 130);
    ctx.restore();
  }

  function drawPrimitiveMonster(ctx, monster) {
    ctx.strokeStyle = '#17191f';
    ctx.lineWidth = 6;
    if (monster.type === 'dust-goblin') {
      ctx.fillStyle = '#b99a62';
      ctx.beginPath();
      ctx.roundRect(-58, -38, 116, 84, 18);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f4e6c1';
      ctx.beginPath();
      ctx.moveTo(-28, -40);
      ctx.lineTo(-8, -78);
      ctx.lineTo(10, -40);
      ctx.moveTo(22, -40);
      ctx.lineTo(42, -74);
      ctx.lineTo(50, -35);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#17191f';
      ctx.beginPath();
      ctx.arc(-18, -10, 6, 0, Math.PI * 2);
      ctx.arc(20, -10, 6, 0, Math.PI * 2);
      ctx.fill();
      drawTinySign(ctx, -8, 36, 'KEY');
      return;
    }
    if (monster.type === 'map-bat') {
      ctx.fillStyle = '#f4e6c1';
      ctx.beginPath();
      ctx.moveTo(-120, -20);
      ctx.lineTo(-35, -72);
      ctx.lineTo(-20, -8);
      ctx.lineTo(-72, 26);
      ctx.closePath();
      ctx.moveTo(120, -20);
      ctx.lineTo(35, -72);
      ctx.lineTo(20, -8);
      ctx.lineTo(72, 26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#24314a';
      ctx.beginPath();
      ctx.arc(0, -12, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#8fd3ff';
      ctx.beginPath();
      ctx.arc(-10, -20, 5, 0, Math.PI * 2);
      ctx.arc(12, -20, 5, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if (monster.type === 'toll-troll') {
      ctx.fillStyle = '#3e8f68';
      ctx.beginPath();
      ctx.roundRect(-64, -82, 128, 140, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e56b2f';
      ctx.fillRect(-82, -18, 164, 22);
      ctx.strokeRect(-82, -18, 164, 22);
      drawTinySign(ctx, 0, -44, 'TOLL');
      return;
    }
    if (monster.type === 'blueprint-warden') {
      ctx.fillStyle = '#806f82';
      ctx.beginPath();
      ctx.roundRect(-72, -98, 144, 174, 10);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#f3c64e';
      ctx.lineWidth = 4;
      for (let y = -70; y <= 35; y += 28) {
        ctx.beginPath();
        ctx.moveTo(-48, y);
        ctx.lineTo(48, y + 10);
        ctx.stroke();
      }
      ctx.fillStyle = '#f3c64e';
      ctx.fillRect(-38, -16, 76, 28);
      ctx.strokeStyle = '#17191f';
      ctx.strokeRect(-38, -16, 76, 28);
      return;
    }
    ctx.fillStyle = monster.boss ? '#3e8f68' : monster.secret ? '#8fd3ff' : '#e56b2f';
    ctx.beginPath();
    ctx.roundRect(-70, -95, 140, 170, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f3c64e';
    ctx.beginPath();
    ctx.arc(0, -36, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTinySign(ctx, x, y, label) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#f3c64e';
    ctx.strokeStyle = '#17191f';
    ctx.lineWidth = 4;
    ctx.fillRect(-34, -14, 68, 28);
    ctx.strokeRect(-34, -14, 68, 28);
    ctx.fillStyle = '#17191f';
    ctx.font = '900 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 5);
    ctx.restore();
  }

  function drawItem(ctx, itemId, depth = 1) {
    const item = DATA.items[itemId];
    const scale = depth === 1 ? 1 : depth === 2 ? 0.68 : 0.46;
    const y = depth === 1 ? 142 : depth === 2 ? 170 : 190;
    if (assets.items.complete && assets.items.naturalWidth && ITEM_FRAMES[itemId] !== undefined) {
      const frameWidth = assets.items.naturalWidth / 8;
      const frame = ITEM_FRAMES[itemId];
      drawKeyedImage(ctx, assets.items, frame * frameWidth, 0, frameWidth, assets.items.naturalHeight, 360 - (136 * scale) / 2, y, 136 * scale, 136 * scale);
      ctx.fillStyle = '#fff';
      ctx.font = `800 ${Math.max(11, 18 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(item.name, 360, y + 168 * scale);
      return;
    }

    ctx.save();
    ctx.translate(360, depth === 1 ? 240 : depth === 2 ? 220 : 205);
    ctx.scale(scale, scale);
    ctx.fillStyle = itemId === 'moon-toll-token' ? '#8fd3ff' : '#f3c64e';
    ctx.strokeStyle = '#17191f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#17191f';
    ctx.font = '800 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.name, 0, 86);
    ctx.restore();
  }

  function drawExit(ctx, depth = 1) {
    const rect = depthRect(depth);
    ctx.strokeStyle = '#f3c64e';
    ctx.lineWidth = Math.max(4, 12 - depth * 2);
    ctx.beginPath();
    ctx.moveTo(rect.x + rect.w * 0.18, rect.y + rect.h * 0.9);
    ctx.bezierCurveTo(rect.x + rect.w * 0.35, rect.y + rect.h * 0.55, rect.x + rect.w * 0.65, rect.y + rect.h * 0.55, rect.x + rect.w * 0.82, rect.y + rect.h * 0.18);
    ctx.stroke();
  }

  function drawCompass(ctx) {
    ctx.save();
    ctx.translate(650, 58);
    ctx.fillStyle = 'rgba(23,25,31,0.72)';
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4e6c1';
    ctx.font = '700 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.player.facing.toUpperCase(), 0, 5);
    ctx.restore();
  }

  function drawMiniMap(ctx) {
    const map = currentMap();
    const cell = 11;
    ctx.save();
    ctx.translate(16, 16);
    ctx.fillStyle = 'rgba(23,25,31,0.8)';
    ctx.fillRect(0, 0, map.width * cell + 12, map.height * cell + 12);
    Object.keys(state.discovered).forEach((key) => {
      const [mapId, coords] = key.split(':');
      if (mapId !== map.id) return;
      const [x, y] = coords.split(',').map(Number);
      ctx.fillStyle = getTile(map, x, y) === '#' ? '#17191f' : '#f4e6c1';
      ctx.fillRect(6 + x * cell, 6 + y * cell, cell - 2, cell - 2);
    });
    ctx.fillStyle = '#e56b2f';
    ctx.fillRect(6 + state.player.x * cell, 6 + state.player.y * cell, cell - 2, cell - 2);
    ctx.restore();
  }

  window.RTA_ROADSIDE_REALM = { start };
})();
