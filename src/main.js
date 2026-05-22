import { createInitialState } from './game/state.js';
import { queueMove, queueAttack } from './game/orders.js';
import { processDay, reinforceDivision } from './game/tick.js';
import { formatGameOver } from './game/victory.js';
import { buildFort } from './game/economy.js';
import { drawMap } from './map/render.js';
import { provinceAtPoint } from './map/hitTest.js';
import { renderToolbar } from './ui/toolbar.js';
import { renderCommandDrawer, tryProvinceAction } from './ui/sidebar.js';
import { renderNationPanel, applyPanelCallbacks } from './ui/panel.js';
import { renderFocusTree } from './ui/focusTree.js';
import { loadFocusTree, startFocus } from './game/focus.js';

let state = null;
let mapData = null;
let scenario = null;

const PLAYABLE = [
  { id: 'germany', name: 'Germany', color: '#5a5a5a', focus: true },
  { id: 'france', name: 'France', color: '#4a6fa5', focus: true },
  { id: 'united_kingdom', name: 'United Kingdom', color: '#c41e3a', focus: true },
  { id: 'italy', name: 'Italy', color: '#3d8b5a', focus: true },
  { id: 'poland', name: 'Poland', color: '#b83c3c', focus: true },
  { id: 'soviet_union', name: 'Soviet Union', color: '#8b2e2e', focus: true },
  { id: 'czechoslovakia', name: 'Czechoslovakia', color: '#4a7c9e', focus: true },
  { id: 'austria', name: 'Austria', color: '#e8d4a8', focus: false },
  { id: 'hungary', name: 'Hungary', color: '#6b8e4e', focus: false },
  { id: 'romania', name: 'Romania', color: '#d4a84a', focus: false },
  { id: 'yugoslavia', name: 'Yugoslavia', color: '#5a8a6a', focus: false },
  { id: 'spain', name: 'Spain', color: '#c9a227', focus: false },
  { id: 'netherlands', name: 'Netherlands', color: '#e67e22', focus: false },
  { id: 'belgium', name: 'Belgium', color: '#f1c40f', focus: false },
  { id: 'lithuania', name: 'Lithuania', color: '#9b59b6', focus: false },
];

const canvas = document.getElementById('map');
const ctx = canvas.getContext('2d');
const toolbar = document.getElementById('toolbar');
const commandDrawer = document.getElementById('command-drawer');
const commandBody = document.getElementById('command-body');
const drawerHandle = document.getElementById('drawer-handle');
const govModal = document.getElementById('gov-modal');
const govBody = document.getElementById('gov-body');
const focusModal = document.getElementById('focus-modal');
const focusBody = document.getElementById('focus-body');
const toastEl = document.getElementById('toast');
const overlay = document.getElementById('overlay');
const startScreen = document.getElementById('start-screen');

function closeAllModals() {
  if (!state) return;
  state = { ...state, govModalOpen: false, focusModalOpen: false };
  govModal.classList.add('hidden');
  focusModal.classList.add('hidden');
}

function syncDrawerDOM() {
  if (!state) return;
  commandDrawer.classList.toggle('collapsed', !state.commandDrawerOpen);
  drawerHandle.setAttribute('aria-expanded', String(state.commandDrawerOpen));
  drawerHandle.textContent = state.commandDrawerOpen ? 'Command ▼' : 'Command ▲';
}

const callbacks = {
  setSpeed(speed) {
    if (!state || state.gameOver) return;
    state = { ...state, speed };
    renderAll();
  },
  toggleCommandDrawer() {
    if (!state) return;
    state = { ...state, commandDrawerOpen: !state.commandDrawerOpen };
    syncDrawerDOM();
    renderToolbar(toolbar, state, callbacks);
  },
  openGovModal() {
    if (!state) return;
    closeAllModals();
    state = { ...state, govModalOpen: true };
    govModal.classList.remove('hidden');
    renderNationPanel(govBody, state, callbacks);
    renderToolbar(toolbar, state, callbacks);
  },
  openFocusModal() {
    if (!state) return;
    closeAllModals();
    state = { ...state, focusModalOpen: true };
    focusModal.classList.remove('hidden');
    renderFocusTree(focusBody, state, state.focusTrees[state.playerNationId], callbacks);
    renderToolbar(toolbar, state, callbacks);
  },
  closeModals() {
    closeAllModals();
    renderToolbar(toolbar, state, callbacks);
  },
  selectDivision(id) {
    if (!state || state.gameOver) return;
    state = { ...state, selectedDivisionId: id };
    renderAll();
  },
  reinforce() {
    if (!state?.selectedDivisionId) return;
    state = reinforceDivision(state, state.selectedDivisionId);
    renderAll();
  },
  clearOrder() {
    if (!state?.selectedDivisionId) return;
    state = {
      ...state,
      orders: state.orders.filter((o) => o.divisionId !== state.selectedDivisionId),
    };
    renderAll();
  },
  buildFort() {
    if (!state?.selectedProvinceId) return;
    state = buildFort(state, state.selectedProvinceId);
    renderAll();
  },
  changeLaw(field, value) {
    state = applyPanelCallbacks(state, 'changeLaw', { field, value });
    renderAll();
  },
  buildFactory() {
    state = applyPanelCallbacks(state, 'buildFactory');
    renderAll();
  },
  startTech(techId) {
    state = applyPanelCallbacks(state, 'startTech', techId);
    renderAll();
  },
  startFocus(focusId) {
    const tree = state.focusTrees[state.playerNationId];
    if (!tree) return;
    state = startFocus(state, state.playerNationId, focusId, tree);
    renderAll();
  },
  toggleLog() {
    state = { ...state, logExpanded: !state.logExpanded };
    renderCommandDrawer(commandBody, state, callbacks);
  },
};

async function loadData() {
  const [mapRes, scenRes] = await Promise.all([
    fetch('./src/data/map.json'),
    fetch('./src/data/scenario.json'),
  ]);
  mapData = await mapRes.json();
  scenario = await scenRes.json();
}

async function loadFocusTrees() {
  const trees = {};
  const ids = ['germany', 'france', 'united_kingdom', 'italy', 'poland', 'soviet_union', 'czechoslovakia'];
  await Promise.all(
    ids.map(async (id) => {
      const t = await loadFocusTree(id);
      if (t) trees[id] = t;
    })
  );
  return trees;
}

async function startGame(playerNationId) {
  const ai = scenario.nations.map((n) => n.id).filter((id) => id !== playerNationId);
  const scen = { ...scenario, playerNationId, aiNations: ai };
  const focusTrees = await loadFocusTrees();
  state = createInitialState(mapData, scen, playerNationId);
  state.focusTrees = focusTrees;
  state.commandDrawerOpen = false;
  state.govModalOpen = false;
  state.focusModalOpen = false;
  state.hoverProvinceId = null;
  state.logExpanded = false;
  startScreen.classList.add('hidden');
  closeAllModals();
  syncDrawerDOM();
  renderAll();
}

function renderAll() {
  if (!state) return;
  drawMap(ctx, state, mapData);
  renderToolbar(toolbar, state, callbacks);
  if (state.commandDrawerOpen) {
    renderCommandDrawer(commandBody, state, callbacks);
  }
  if (state.govModalOpen) {
    renderNationPanel(govBody, state, callbacks);
  }
  if (state.focusModalOpen) {
    renderFocusTree(focusBody, state, state.focusTrees[state.playerNationId], callbacks);
  }
  updateToast();
  updateOverlay();
}

function updateToast() {
  if (state?.toast && performance.now() < state.toastUntil) {
    toastEl.textContent = state.toast;
    toastEl.classList.remove('hidden');
  } else {
    toastEl.classList.add('hidden');
  }
}

function updateOverlay() {
  const info = formatGameOver(state);
  if (!info) {
    overlay.classList.add('hidden');
    return;
  }
  overlay.classList.remove('hidden');
  document.getElementById('overlay-title').textContent = info.title;
  document.getElementById('overlay-msg').textContent = info.msg;
}

function canvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function redrawMapOnly() {
  if (state) drawMap(ctx, state, mapData);
}

canvas.addEventListener('mousemove', (e) => {
  if (!state || state.gameOver) return;
  const { x, y } = canvasCoords(e);
  const pid = provinceAtPoint(mapData.provinces, x, y);
  if (pid !== state.hoverProvinceId) {
    state = { ...state, hoverProvinceId: pid };
    redrawMapOnly();
  }
});

canvas.addEventListener('mouseleave', () => {
  if (!state || !state.hoverProvinceId) return;
  state = { ...state, hoverProvinceId: null };
  redrawMapOnly();
});

canvas.addEventListener('click', (e) => {
  if (!state || state.gameOver) return;
  const { x, y } = canvasCoords(e);
  const pid = provinceAtPoint(mapData.provinces, x, y);
  if (!pid) return;

  if (!state.commandDrawerOpen) {
    state = { ...state, commandDrawerOpen: true };
    syncDrawerDOM();
  }

  const divsHere = state.divisions.filter((d) => d.provinceId === pid && d.strength > 0);
  const playerDiv = divsHere.find((d) => d.nationId === state.playerNationId);

  if (state.selectedDivisionId) {
    const action = tryProvinceAction(state, pid);
    if (action) {
      if (action.type === 'move') state = queueMove(state, action.divisionId, action.targetProvinceId);
      else state = queueAttack(state, action.divisionId, action.targetProvinceId);
      renderAll();
      return;
    }
  }

  if (playerDiv) {
    state = { ...state, selectedProvinceId: pid, selectedDivisionId: playerDiv.id };
  } else {
    state = { ...state, selectedProvinceId: pid, selectedDivisionId: null };
  }
  renderAll();
});

drawerHandle.addEventListener('click', () => callbacks.toggleCommandDrawer());

document.querySelectorAll('[data-close]').forEach((el) => {
  el.addEventListener('click', () => callbacks.closeModals());
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state) callbacks.closeModals();
});

document.getElementById('overlay-restart').addEventListener('click', () => {
  if (state) startGame(state.playerNationId);
  else startScreen.classList.remove('hidden');
  overlay.classList.add('hidden');
});

function buildStartScreen() {
  const container = document.getElementById('nation-picks');
  container.innerHTML = PLAYABLE.map(
    (n) =>
      `<button class="pick-nation" data-nation="${n.id}" style="--c:${n.color}">${n.name}${n.focus ? ' ★' : ''}</button>`
  ).join('');
  container.querySelectorAll('.pick-nation').forEach((btn) => {
    btn.addEventListener('click', () => startGame(btn.dataset.nation));
  });
}

let lastTime = 0;
const TICK_MS = 1000;

function gameLoop(now) {
  if (state && state.speed > 0 && !state.gameOver) {
    const interval = TICK_MS / state.speed;
    if (now - lastTime >= interval) {
      lastTime = now;
      state = processDay(state);
      renderAll();
    }
  }
  updateToast();
  requestAnimationFrame(gameLoop);
}

loadData()
  .then(() => {
    buildStartScreen();
    return requestAnimationFrame(gameLoop);
  })
  .catch((err) => {
    console.error(err);
    document.querySelector('.start-card').innerHTML +=
      '<p style="color:#e94560">Load failed. Run: python3 -m http.server 8080</p>';
  });
