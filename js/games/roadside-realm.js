(function () {
  const DATA = window.RTA_ROADSIDE_REALM_DATA;
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
        bossDefeated: false,
        trueEndingUnlocked: false,
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
      objective: document.getElementById('realm-objective'),
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
    } finally {
      inputLocked = false;
      render();
    }
  }

  function rotate(delta) {
    const index = DIRECTIONS.indexOf(state.player.facing);
    state.player.facing = DIRECTIONS[(index + delta + DIRECTIONS.length) % DIRECTIONS.length];
    addLog(delta < 0 ? 'You turn left.' : 'You turn right.');
    debugLog('move', { action: delta < 0 ? 'turnLeft' : 'turnRight', facing: state.player.facing });
  }

  function attemptMove(dir) {
    const target = tileAhead(dir);
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
    resolveEnterEvent(target);
    debugLog('move', { from, to: { mapId: state.player.mapId, x: state.player.x, y: state.player.y }, facing: state.player.facing });
    saveGame();
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
      state.player.mapId = event.mapId;
      state.player.x = event.x;
      state.player.y = event.y;
      state.player.facing = event.facing;
      revealCurrentTile();
      debugLog('map-transition', { mapId: state.player.mapId, x: state.player.x, y: state.player.y });
    }

    if (event.type === 'hiddenWall' && state.flags[event.flag]) {
      addLog('A stairway drops into the Forgotten Underpass.');
      state.player.mapId = 'forgotten-underpass';
      state.player.x = DATA.maps['forgotten-underpass'].start.x;
      state.player.y = DATA.maps['forgotten-underpass'].start.y;
      state.player.facing = DATA.maps['forgotten-underpass'].start.facing;
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

    if (monster.type === 'map-bat' && Math.random() < 0.25) {
      addLog('The Map Bat flutters past, missing entirely.');
      return;
    }

    const taken = rollDamage(monster.attack, state.player.defense);
    state.player.hp = Math.max(0, state.player.hp - taken);
    addLog(`The ${monster.name} bumps you for ${taken}.`);
    debugLog('combat', { monsterId: monster.id, taken, playerHp: state.player.hp });
    if (state.player.hp <= 0) defeatPlayer();
    saveGame();
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
    addLog(text || `You found ${item.name}.`);
    debugLog('item', { pickedUp: itemId, key, inventory: state.player.inventory });
    if (map.id === 'forgotten-underpass' && itemId === 'moon-toll-token') {
      addLog('A secret star appears on your map.');
    }
  }

  function win() {
    const trueEnding = hasItem('moon-toll-token') && state.flags.trueEndingUnlocked;
    state.ending = trueEnding ? 'true' : 'normal';
    debugLog('ending', { ending: state.ending, score: calculateScore() });
    saveGame();
    showSummary();
  }

  function showSummary() {
    elements.splash.hidden = true;
    elements.play.hidden = true;
    elements.summary.hidden = false;
    const score = calculateScore();
    const trueEnding = state.ending === 'true';
    elements.summaryTitle.textContent = trueEnding ? 'Secret Star Ending' : 'Route Restored';
    elements.summaryCopy.textContent = trueEnding
      ? 'You restored the moonlit route through the Forgotten Underpass. The Roadside Realm stamps your map with a secret star.'
      : 'You escaped the Roadside Realm with the Mapstone. The route is restored, and someone in the car earns first snack pick.';
    const stats = [
      ['Ending', trueEnding ? 'True Route' : 'Normal Route'],
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
    elements.inventory.innerHTML = state.player.inventory.length
      ? state.player.inventory.map((id) => `<span class="realm-chip">${DATA.items[id]?.name || id}</span>`).join('')
      : '<span class="realm-chip">No items yet</span>';
    elements.log.innerHTML = state.log.map((message) => `<li>${message}</li>`).join('');
    elements.live.textContent = `Facing ${state.player.facing}. ${aheadDescription()}`;
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
      ? hasItem('moon-toll-token') && state.flags.trueEndingUnlocked
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
    if (action === 'jumpMain') jumpTo(DATA.start.mapId, DATA.start.x, DATA.start.y, DATA.start.facing);
    if (action === 'jumpUnderpass') {
      const start = DATA.maps['forgotten-underpass'].start;
      jumpTo('forgotten-underpass', start.x, start.y, start.facing);
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

    ctx.clearRect(0, 0, w, h);
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.5);
    sky.addColorStop(0, map.id === 'forgotten-underpass' ? '#121923' : '#24314a');
    sky.addColorStop(1, '#17191f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.5);
    const floor = ctx.createLinearGradient(0, h * 0.5, 0, h);
    floor.addColorStop(0, map.id === 'forgotten-underpass' ? '#263342' : '#5b4632');
    floor.addColorStop(1, '#17191f');
    ctx.fillStyle = floor;
    ctx.fillRect(0, h * 0.5, w, h * 0.5);

    drawCorridor(ctx, tile, event);
    drawCompass(ctx);
    if (state.showMap) drawMiniMap(ctx);
  }

  function drawCorridor(ctx, tile, event) {
    const wall = '#7d7462';
    ctx.strokeStyle = 'rgba(244,230,193,0.25)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 420);
    ctx.lineTo(270, 230);
    ctx.lineTo(450, 230);
    ctx.lineTo(720, 420);
    ctx.stroke();

    if (!tile || tile === '#' || event?.type === 'lockedDoor' || event?.type === 'hiddenWall') {
      ctx.fillStyle = wall;
      ctx.fillRect(140, 55, 440, 310);
      ctx.strokeStyle = '#17191f';
      ctx.lineWidth = 5;
      ctx.strokeRect(140, 55, 440, 310);
      drawWallTexture(ctx, 140, 55, 440, 310);
      if (event?.type === 'lockedDoor' && !state.flags[event.flag]) drawTollGate(ctx);
      if (event?.type === 'hiddenWall' && state.flags[event.requiredFlag]) drawMoonScratch(ctx);
      return;
    }

    ctx.fillStyle = 'rgba(244,230,193,0.08)';
    ctx.fillRect(270, 125, 180, 175);
    if (event?.type === 'monster') {
      const monster = state.monsters[event.monsterId];
      if (monster?.hp > 0) drawMonster(ctx, monster);
    }
    if (event?.type === 'item') drawItem(ctx, event.itemId);
    if (event?.type === 'exit') drawExit(ctx);
  }

  function drawWallTexture(ctx, x, y, width, height) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#17191f';
    for (let row = 1; row < 5; row += 1) {
      const ly = y + (height / 5) * row;
      ctx.beginPath();
      ctx.moveTo(x, ly);
      ctx.lineTo(x + width, ly);
      ctx.stroke();
    }
    for (let col = 1; col < 7; col += 1) {
      const lx = x + (width / 7) * col;
      ctx.beginPath();
      ctx.moveTo(lx, y);
      ctx.lineTo(lx, y + height);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTollGate(ctx) {
    ctx.fillStyle = '#e56b2f';
    ctx.fillRect(170, 205, 380, 34);
    ctx.fillStyle = '#f4e6c1';
    for (let x = 180; x < 540; x += 48) {
      ctx.fillRect(x, 205, 24, 34);
    }
  }

  function drawMoonScratch(ctx) {
    if (assets.moonScratch.complete && assets.moonScratch.naturalWidth) {
      ctx.drawImage(assets.moonScratch, 278, 125, 164, 164);
      return;
    }
    ctx.strokeStyle = '#8fd3ff';
    ctx.lineWidth = 8;
    [0, 34, 68].forEach((offset) => {
      ctx.beginPath();
      ctx.arc(320 + offset, 215, 55, -1.1, 1.1);
      ctx.stroke();
    });
  }

  function drawMonster(ctx, monster) {
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
      const drawWidth = monster.boss ? 255 : 225;
      const drawHeight = monster.boss ? 208 : 225;
      ctx.drawImage(sprite, frame * frameWidth, 0, frameWidth, sprite.naturalHeight, 360 - drawWidth / 2, 112, drawWidth, drawHeight);
      ctx.fillStyle = '#fff';
      ctx.font = '700 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(monster.name, 360, 338);
      ctx.fillText(`${monster.hp}/${monster.maxHp} HP`, 360, 363);
      return;
    }

    ctx.save();
    ctx.translate(360, 245);
    ctx.fillStyle = monster.boss ? '#3e8f68' : monster.secret ? '#8fd3ff' : '#e56b2f';
    ctx.strokeStyle = '#17191f';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(-70, -95, 140, 170, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f3c64e';
    ctx.beginPath();
    ctx.arc(0, -36, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '700 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(monster.name, 0, 105);
    ctx.fillText(`${monster.hp}/${monster.maxHp} HP`, 0, 130);
    ctx.restore();
  }

  function drawItem(ctx, itemId) {
    const item = DATA.items[itemId];
    if (assets.items.complete && assets.items.naturalWidth && ITEM_FRAMES[itemId] !== undefined) {
      const frameWidth = assets.items.naturalWidth / 8;
      const frame = ITEM_FRAMES[itemId];
      ctx.drawImage(assets.items, frame * frameWidth, 0, frameWidth, assets.items.naturalHeight, 292, 142, 136, 136);
      ctx.fillStyle = '#fff';
      ctx.font = '800 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.name, 360, 310);
      return;
    }

    ctx.save();
    ctx.translate(360, 240);
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

  function drawExit(ctx) {
    ctx.strokeStyle = '#f3c64e';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(250, 330);
    ctx.bezierCurveTo(300, 245, 420, 245, 470, 125);
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
