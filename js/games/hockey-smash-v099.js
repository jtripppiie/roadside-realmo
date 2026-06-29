(function () {
  const DISPLAY_VERSION = 'Hockey Smash v0.9.9';
  const DISPLAY_BUILD = 'Build 2026-06-29.20';
  const GROUND_Y = 576 * 0.82;
  const params = new URLSearchParams(window.location.search);
  const computerMode = params.get('computerMode') === '1';

  const COMPUTER_SIZES = {
    salmon: { width: 56, height: 30, airborne: true },
    bear: { width: 108, height: 92, grounded: true },
    moose: { width: 136, height: 110, grounded: true },
    mom: { width: 72, height: 78, grounded: true },
    sister: { width: 72, height: 78, grounded: true },
    dad: { width: 98, height: 112, grounded: true },
    dadJoke: { width: 76, height: 42, airborne: true },
  };

  function onReady() {
    const api = window.RTA_HOCKEY_SMASH;
    const badge = document.getElementById('hockey-build-badge');
    if (badge) badge.textContent = `${DISPLAY_VERSION} · ${DISPLAY_BUILD}`;
    if (api?.getVersion) api.getVersion = () => DISPLAY_VERSION;
    if (!api || !computerMode) return;

    document.body.classList.add('hockey-computer-balanced-entities');

    const style = document.createElement('style');
    style.textContent = `
      body.hockey-computer-balanced-entities .hockey-entity-overlay {
        transform-origin: bottom center;
      }
      body.hockey-computer-balanced-entities .hockey-entity-overlay[data-type='salmon'] {
        z-index: 7;
      }
      body.hockey-computer-balanced-entities .hockey-entity-overlay[data-type='bear'],
      body.hockey-computer-balanced-entities .hockey-entity-overlay[data-type='moose'] {
        z-index: 8;
      }
      body.hockey-computer-balanced-entities .hockey-entity-overlay[data-type='dad'] {
        z-index: 9;
      }
      body.hockey-computer-balanced-entities .hockey-entity-overlay__label {
        font-size: 0.56rem;
        top: -1.15rem;
      }
    `;
    document.head.appendChild(style);

    function getState() {
      const state = api.getState?.();
      if (!state) return null;
      if (!Array.isArray(state.entities)) state.entities = [];
      return state;
    }

    function normalizeEntity(entity) {
      const spec = COMPUTER_SIZES[entity.type];
      if (!spec) return;
      const previousHeight = entity.height || spec.height;
      const footY = entity.y + previousHeight;
      entity.width = spec.width;
      entity.height = spec.height;
      if (spec.grounded) entity.y = GROUND_Y - spec.height;
      if (spec.airborne && entity.type === 'salmon') {
        entity.y = Math.max(205, Math.min(330, entity.y || 265));
      } else if (spec.airborne) {
        entity.y = Math.max(210, Math.min(310, entity.y || footY - spec.height));
      }
      entity.computerSized = true;
    }

    function normalizeDad(state) {
      if (!state.dad) return;
      const spec = COMPUTER_SIZES.dad;
      state.dad.width = spec.width;
      state.dad.height = spec.height;
      state.dad.y = GROUND_Y - spec.height;
      state.dad.computerSized = true;
    }

    function balanceComputerEntities() {
      const state = getState();
      if (state) {
        state.entities.forEach(normalizeEntity);
        normalizeDad(state);
      }
      window.requestAnimationFrame(balanceComputerEntities);
    }

    balanceComputerEntities();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
