const fs = require('fs');
const vm = require('vm');

// This script "plays" Hockey Smash without a real browser. It builds a tiny
// fake DOM/canvas, loads the actual game file, presses the same keyboard events
// a player would press, and checks that the game state changes correctly.

const errors = [];
let now = 1000;
let rafCallback = null;

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(name) {
    this.values.add(name);
  }

  remove(name) {
    this.values.delete(name);
  }

  contains(name) {
    return this.values.has(name);
  }
}

class FakeElement {
  constructor(id) {
    this.id = id;
    this.hidden = false;
    this.textContent = '';
    this.value = 100;
    this.dataset = {};
    this.classList = new FakeClassList();
    this.listeners = {};
  }

  addEventListener(type, handler) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(handler);
  }

  dispatch(type, event = {}) {
    (this.listeners[type] || []).forEach((handler) => handler({
      preventDefault() {},
      pointerId: 1,
      ...event,
    }));
  }

  setPointerCapture() {}

  getContext() {
    return fakeContext();
  }
}

function fakeContext() {
  const context = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    globalAlpha: 1,
    clearRect() {},
    fillRect() {},
    strokeRect() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    arc() {},
    ellipse() {},
    fill() {},
    stroke() {},
    drawImage() {},
    fillText() {},
    save() {},
    restore() {},
    translate() {},
    scale() {},
    getImageData(x, y, width, height) {
      return { data: new Uint8ClampedArray(width * height * 4), width, height };
    },
    putImageData() {},
  };
  return context;
}

function makeElementMap() {
  const ids = [
    'hockey-splash',
    'hockey-transition',
    'hockey-game',
    'hockey-try-again',
    'hockey-play',
    'hockey-retry',
    'hockey-canvas',
    'hockey-health',
    'hockey-status',
    'hockey-debug',
    'hockey-rotate',
  ];
  return Object.fromEntries(ids.map((id) => [id, new FakeElement(id)]));
}

function makeButton(action) {
  const button = new FakeElement(`button-${action}`);
  button.dataset.action = action;
  return button;
}

function createHarness() {
  const elements = makeElementMap();
  const actionButtons = ['left', 'right', 'jump', 'slide', 'stick'].map(makeButton);
  const windowListeners = {};

  class FakeImage {
    constructor() {
      this.complete = false;
      this.naturalWidth = 16;
      this.naturalHeight = 16;
      this.onload = null;
      this.onerror = null;
    }

    set src(value) {
      this._src = value;
      this.complete = true;
      if (this.onload) this.onload();
    }

    get src() {
      return this._src;
    }
  }

  const context = {
    console,
    Image: FakeImage,
    Uint8ClampedArray,
    Math,
    URLSearchParams,
    performance: { now: () => now },
    document: {
      body: elements.body || new FakeElement('body'),
      getElementById: (id) => elements[id] || null,
      querySelectorAll: (selector) => (selector === '[data-action]' ? actionButtons : []),
      createElement: (tag) => {
        const element = new FakeElement(tag);
        element.width = 16;
        element.height = 16;
        return element;
      },
    },
    window: {
      innerHeight: 720,
      innerWidth: 1280,
      location: { search: '' },
      addEventListener(type, handler) {
        windowListeners[type] = windowListeners[type] || [];
        windowListeners[type].push(handler);
      },
      clearTimeout() {},
      setTimeout(handler) {
        handler();
        return 1;
      },
      requestAnimationFrame(handler) {
        rafCallback = handler;
        return 1;
      },
      cancelAnimationFrame() {},
    },
  };

  context.window.document = context.document;
  context.window.performance = context.performance;
  context.window.console = console;
  context.window.Image = FakeImage;
  context.window.URLSearchParams = URLSearchParams;

  vm.createContext(context);
  vm.runInContext(fs.readFileSync('js/games/hockey-smash.js', 'utf8'), context);

  function dispatchKey(type, key) {
    (windowListeners[type] || []).forEach((handler) => handler({
      key,
      preventDefault() {},
    }));
  }

  function frame(ms = 16.67) {
    now += ms;
    if (rafCallback) rafCallback(now);
  }

  function frames(count, ms = 16.67) {
    for (let index = 0; index < count; index += 1) frame(ms);
  }

  return { context, elements, dispatchKey, frame, frames };
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const harness = createHarness();
const api = harness.context.window.RTA_HOCKEY_SMASH;

api.start();
harness.elements['hockey-play'].dispatch('click');
harness.frame();

let state = api.getState();
assert(api.getVersion() === 'Hockey Smash v0.5.3', 'Version should be Hockey Smash v0.5.3.');
assert(state.mode === 'playing', 'Clicking Play should enter playing mode.');
assert(state.player.width === 104 && state.player.height === 108, 'Player should use the normal arena-play size.');
assert(api.tuning.groundRatio === 0.82, `Ground ratio should align actors to sidewalk: ${api.tuning.groundRatio}.`);

const groundY = api.tuning.groundRatio * 576;
assert(
  Math.abs(state.player.y + state.player.height - groundY) < 0.001,
  `Player feet should start on sidewalk ground line: feet=${state.player.y + state.player.height}, ground=${groundY}.`
);

const startX = state.player.x;
harness.dispatchKey('keydown', 'ArrowRight');
harness.frames(14);
harness.dispatchKey('keyup', 'ArrowRight');
state = api.getState();
const rightX = state.player.x;
assert(rightX > startX + 20, `Right movement failed: start=${startX}, right=${rightX}.`);

harness.dispatchKey('keydown', 'ArrowLeft');
harness.frames(14);
harness.dispatchKey('keyup', 'ArrowLeft');
state = api.getState();
const leftX = state.player.x;
assert(leftX < rightX - 20, `Left movement failed: right=${rightX}, left=${leftX}.`);

const groundedY = state.player.y;
harness.dispatchKey('keydown', 'ArrowUp');
harness.frames(5);
harness.dispatchKey('keyup', 'ArrowUp');
state = api.getState();
assert(state.player.y < groundedY - 10, `Jump failed: before=${groundedY}, after=${state.player.y}.`);
assert(state.player.y + state.player.height < groundY, 'Jump should lift the player above the ground line.');

harness.dispatchKey('keydown', 'ArrowRight');
harness.dispatchKey('keydown', 'Shift');
harness.frame();
state = api.getState();
assert(state.player.vx === api.tuning.slideSpeed, `Slide failed: vx=${state.player.vx}, expected=${api.tuning.slideSpeed}.`);
harness.dispatchKey('keyup', 'Shift');
harness.dispatchKey('keyup', 'ArrowRight');

harness.dispatchKey('keydown', 'ArrowRight');
harness.dispatchKey('keydown', 'ArrowDown');
harness.frame();
state = api.getState();
assert(state.player.vx === api.tuning.slideSpeed, `ArrowDown duck/slide failed: vx=${state.player.vx}, expected=${api.tuning.slideSpeed}.`);
harness.dispatchKey('keyup', 'ArrowDown');
harness.dispatchKey('keyup', 'ArrowRight');

state.player.facing = 1;
state.player.attackTimer = 0;
state.entities.push({
  type: 'bear',
  testObstacle: true,
  x: state.player.x + state.player.width - 4,
  y: state.player.y + 28,
  width: 84,
  height: 72,
  vx: 0,
  hp: 1,
  maxHp: 1,
  damage: 0,
});
harness.dispatchKey('keydown', 'F');
state = api.getState();
const bear = state.entities.find((entity) => entity.testObstacle);
assert(state.player.attackTimer > 0, 'Stick swing should start attack timer.');
assert(bear?.dead === true, 'Stick swing should clear a bear obstacle in range.');
assert(state.computer.results.clearedObstacle === true, 'Obstacle clear result should be tracked.');
harness.dispatchKey('keyup', 'F');

state.player.facing = 1;
state.player.attackTimer = 0;
state.entities.push({
  type: 'bear',
  testSpaceObstacle: true,
  x: state.player.x + state.player.width - 4,
  y: state.player.y + 28,
  width: 84,
  height: 72,
  vx: 0,
  hp: 1,
  maxHp: 1,
  damage: 0,
});
harness.dispatchKey('keydown', ' ');
state = api.getState();
const spaceBear = state.entities.find((entity) => entity.testSpaceObstacle);
assert(state.player.attackTimer > 0, 'Space bar should start the desktop action timer.');
assert(spaceBear?.dead === true, 'Space bar should clear a bear obstacle in range.');
harness.dispatchKey('keyup', ' ');

state = api.getState();
assert(harness.elements['hockey-debug'].textContent.includes('x='), 'Debug panel should show player x position.');
assert(harness.elements['hockey-debug'].textContent.includes('sprite=loaded'), 'Debug panel should report loaded player sprite.');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Hockey Smash action verification passed: right, left, jump, slide, stick, and bear obstacle clear.');
