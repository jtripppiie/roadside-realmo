(function () {
  const MAP_KIOSK_DUNGEON = {
    id: 'map-kiosk-dungeon',
    name: 'Map Kiosk Dungeon',
    width: 12,
    height: 12,
    start: { x: 1, y: 1, facing: 'south' },
    tiles: [
      '############',
      '#P........G#',
      '#.##.###.#.#',
      '#.K..#M..#.#',
      '#.##D#.#.#.#',
      '#....#.....#',
      '###.##T##.H#',
      '#S..#M.#...#',
      '#.#.#..#.#M#',
      '#.#...##.#.#',
      '#...#B.....#',
      '############',
    ],
    events: {
      '1,1': { type: 'exit', requiredItem: 'mapstone', blockedText: "There's nothing to go back to yet. The Mapstone is still missing." },
      '2,3': { type: 'item', itemId: 'rusty-road-key', text: 'A Rusty Road Key hangs from a bent route marker.' },
      '4,4': { type: 'lockedDoor', requiredItem: 'rusty-road-key', flag: 'tollGateOpen', lockedText: 'A striped Toll Gate blocks the way. It needs a key.', unlockText: 'The Rusty Road Key turns. The Toll Gate lifts with a friendly clank.' },
      '6,3': { type: 'monster', monsterId: 'dust-goblin-1' },
      '5,7': { type: 'monster', monsterId: 'map-bat-1' },
      '10,8': { type: 'monster', monsterId: 'toll-troll-1' },
      '6,6': { type: 'item', itemId: 'apple-juice-potion', text: 'A half-buried cooler holds one cold Apple Juice Potion.' },
      '2,9': { type: 'heal', healAmount: 6, text: 'A trickle of leftover soda fizzes near a drain grate.' },
      '5,10': { type: 'monster', monsterId: 'signpost-ogre-1' },
      '10,1': { type: 'item', itemId: 'mapstone', requiresFlag: 'bossDefeated', blockedText: 'The Mapstone is sealed until the Signpost Ogre is defeated.', text: 'The Mapstone hums like a tiny dashboard compass.' },
      '1,7': { type: 'secretSwitch', flag: 'secretSwitchPressed', text: 'You press a loose map pin. Somewhere, a hidden wall clicks.' },
      '10,6': { type: 'hiddenWall', requiredFlag: 'secretSwitchPressed', flag: 'secretWallOpen', text: 'A moon-shaped scratch glows. The wall slides open.', blockedText: 'A dusty wall. It sounds hollow when you knock.' },
    },
  };

  const FORGOTTEN_UNDERPASS = {
    id: 'forgotten-underpass',
    name: 'Forgotten Underpass',
    width: 7,
    height: 7,
    start: { x: 1, y: 1, facing: 'east' },
    tiles: [
      '#######',
      '#R..M##',
      '#.#.###',
      '#.#...#',
      '#.###G#',
      '#.....#',
      '#######',
    ],
    events: {
      '1,1': { type: 'return', mapId: 'map-kiosk-dungeon', x: 10, y: 6, facing: 'west', text: 'You climb back up into the kiosk dungeon.' },
      '4,1': { type: 'monster', monsterId: 'moonlit-warden-1' },
      '5,4': { type: 'item', itemId: 'moon-toll-token', text: 'A cold, silver Moon Toll Token sits beside a weathered lore sign.' },
    },
  };

  window.RTA_ROADSIDE_REALM_DATA = {
    version: '0.1.0',
    title: 'Roadside Realm',
    saveKey: 'rtaRoadsideRealmSave',
    startMap: 'map-kiosk-dungeon',
    start: { mapId: 'map-kiosk-dungeon', x: 1, y: 1, facing: 'south' },
    maps: {
      [MAP_KIOSK_DUNGEON.id]: MAP_KIOSK_DUNGEON,
      [FORGOTTEN_UNDERPASS.id]: FORGOTTEN_UNDERPASS,
    },
    items: {
      'rusty-road-key': { id: 'rusty-road-key', name: 'Rusty Road Key', type: 'quest', description: 'Opens the old Toll Gate.' },
      'apple-juice-potion': { id: 'apple-juice-potion', name: 'Apple Juice Potion', type: 'consumable', heal: 8, description: 'Restores 8 HP.' },
      mapstone: { id: 'mapstone', name: 'Mapstone', type: 'quest', description: 'The missing heart of the roadside map.' },
      'moon-toll-token': { id: 'moon-toll-token', name: 'Moon Toll Token', type: 'quest', description: 'A silver token from the Forgotten Underpass.' },
    },
    monsters: {
      'dust-goblin-1': { id: 'dust-goblin-1', type: 'dust-goblin', name: 'Dust Goblin', hp: 7, maxHp: 7, attack: 3, defense: 0, xp: 3, gold: 2, text: 'A Dust Goblin rattles an old motel key at you.' },
      'map-bat-1': { id: 'map-bat-1', type: 'map-bat', name: 'Map Bat', hp: 6, maxHp: 6, attack: 2, defense: 0, xp: 3, gold: 2, text: 'A Map Bat flutters out from behind a torn route sign.' },
      'toll-troll-1': { id: 'toll-troll-1', type: 'toll-troll', name: 'Toll Troll', hp: 12, maxHp: 12, attack: 4, defense: 1, xp: 5, gold: 4, text: 'A Toll Troll blocks the old service road, arms crossed.' },
      'signpost-ogre-1': { id: 'signpost-ogre-1', type: 'signpost-ogre', name: 'Signpost Ogre', hp: 26, maxHp: 26, attack: 5, defense: 1, xp: 8, gold: 8, boss: true, text: 'The Signpost Ogre spins its arrow-arms and blocks the goal corridor.' },
      'moonlit-warden-1': { id: 'moonlit-warden-1', type: 'moonlit-warden', name: 'Moonlit Warden', hp: 22, maxHp: 22, attack: 5, defense: 2, xp: 8, gold: 6, secret: true, text: 'The Moonlit Warden guards the route that does not appear on ordinary maps.' },
    },
  };
})();
