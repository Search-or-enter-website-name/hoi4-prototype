import { createInitialState } from './state.js';
import { getLegalMoves } from './moves.js';
import { applyMove, completePromotion } from './applyMove.js?v=5';
import { colorOf, opponent } from './constants.js';
import { renderBoard } from './ui/board.js';
import { renderStatus, overlayMessage } from './ui/status.js';
import { playEffect, scheduleEffectCleanup } from './ui/effects.js';
import { pickAIMove } from './ai/engine.js?v=5';

let state = null;
let effectCleanup = null;
let effectClearTimer = null;
let aiThinking = false;

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg = document.getElementById('overlay-msg');
const promoModal = document.getElementById('promo-modal');
const newGameBtn = document.getElementById('new-game');
const overlayRestart = document.getElementById('overlay-restart');
const fxLayer = document.getElementById('fx-layer');
const startScreen = document.getElementById('start-screen');
const startPlayBtn = document.getElementById('start-play');
const difficultyField = document.getElementById('difficulty-field');
const modeRadios = document.querySelectorAll('input[name="mode"]');

function aiColor() {
  return state ? opponent(state.playerColor) : 'b';
}

function isAITurn() {
  return state?.gameMode === 'ai' && state.turn === aiColor() && state.status === 'playing';
}

function isPlayerTurn() {
  return state?.status === 'playing' && state.turn === state.playerColor;
}

function effectForMove(move, newState) {
  if (newState.status === 'checkmate') {
    const isCap = move.flags === 'capture' || move.flags === 'enpassant';
    return {
      type: 'checkmate',
      from: move.from,
      to: move.to,
      capture: isCap,
      captured: isCap ? move.captured : null,
      capturedSq: isCap ? (move.flags === 'enpassant' ? move.capturedSq : move.to) : null,
    };
  }
  if (move.flags === 'capture' || move.flags === 'enpassant') {
    return {
      type: 'capture',
      from: move.from,
      to: move.to,
      captured: move.captured,
      capturedSq: move.flags === 'enpassant' ? move.capturedSq : move.to,
    };
  }
  return { type: 'move', from: move.from, to: move.to };
}

function clearEffectTimers() {
  if (effectClearTimer) {
    clearTimeout(effectClearTimer);
    effectClearTimer = null;
  }
  if (effectCleanup) {
    effectCleanup();
    effectCleanup = null;
  }
}

function render(playFx = false) {
  if (!state) return;

  renderBoard(boardEl, state, onSquareClick);
  renderStatus(statusEl, state, { thinking: aiThinking });

  const msg = overlayMessage(state);
  if (msg) {
    overlayTitle.textContent = msg.title;
    overlayMsg.textContent = msg.msg;
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
  }

  const humanPromo = state.pendingPromotion && isPlayerTurn();
  if (humanPromo) {
    promoModal.classList.remove('hidden');
  } else {
    promoModal.classList.add('hidden');
  }

  if (playFx && state.lastEffect) {
    clearEffectTimers();
    effectCleanup = playEffect(state.lastEffect, boardEl, overlay, fxLayer);
    effectClearTimer = scheduleEffectCleanup(() => {
      if (effectCleanup) effectCleanup();
      effectCleanup = null;
      state = { ...state, lastEffect: null };
      effectClearTimer = null;
    });
  }
}

function applyMoveWithEffect(move, isAI = false) {
  const prevHistory = state.history.length;
  const next = applyMove(state, move, { autoQueen: isAI });

  if (next.pendingPromotion && !isAI) {
    state = next;
    render(false);
    return;
  }
  if (next.history.length === prevHistory) return;

  state = { ...next, lastEffect: effectForMove(move, next) };
  render(true);
  scheduleAITurn();
}

function scheduleAITurn() {
  if (!isAITurn() || state.pendingPromotion) return;

  aiThinking = true;
  render(false);

  window.setTimeout(() => {
    const move = pickAIMove(state);
    aiThinking = false;
    if (!move || state.status !== 'playing') {
      render(false);
      return;
    }
    applyMoveWithEffect(move, true);
  }, 400);
}

function onSquareClick(sq) {
  if (!state || state.status !== 'playing' || state.pendingPromotion) return;
  if (state.gameMode === 'ai' && !isPlayerTurn()) return;

  const { board, turn, selected } = state;
  const piece = board[sq];

  if (selected !== null && selected !== sq) {
    const moves = getLegalMoves(state, selected);
    const move = moves.find((m) => m.to === sq);
    if (move) {
      applyMoveWithEffect(move, false);
      return;
    }
  }

  if (selected === sq) {
    state = { ...state, selected: null, legalTargets: [] };
    render(false);
    return;
  }

  if (piece && colorOf(piece) === turn) {
    const moves = getLegalMoves(state, sq);
    state = {
      ...state,
      selected: sq,
      legalTargets: moves.map((m) => m.to),
    };
    render(false);
    return;
  }

  if (selected !== null) {
    state = { ...state, selected: null, legalTargets: [] };
    render(false);
  }
}

function onPromotion(pieceType) {
  if (!state.pendingPromotion || !isPlayerTurn()) return;
  const { move } = state.pendingPromotion;
  const next = completePromotion(state, pieceType);
  if (next.history.length === state.history.length) return;
  state = { ...next, lastEffect: effectForMove(move, next) };
  render(true);
  scheduleAITurn();
}

function readStartOptions() {
  const color = document.querySelector('input[name="color"]:checked')?.value || 'w';
  const mode = document.querySelector('input[name="mode"]:checked')?.value || 'ai';
  const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value || 'easy';
  return {
    gameMode: mode,
    playerColor: color,
    difficulty,
  };
}

function startGame() {
  clearEffectTimers();
  aiThinking = false;
  const opts = readStartOptions();
  state = createInitialState(opts);
  startScreen.classList.add('hidden');
  boardEl.classList.toggle('board-flipped', opts.gameMode === 'ai' && opts.playerColor === 'b');
  render(false);
  scheduleAITurn();
}

function showStartScreen() {
  clearEffectTimers();
  aiThinking = false;
  state = null;
  startScreen.classList.remove('hidden');
  overlay.classList.add('hidden');
  promoModal.classList.add('hidden');
}

function updateDifficultyVisibility() {
  const mode = document.querySelector('input[name="mode"]:checked')?.value;
  if (difficultyField) {
    difficultyField.classList.toggle('hidden', mode === 'hotseat');
  }
}

newGameBtn.addEventListener('click', showStartScreen);
overlayRestart.addEventListener('click', showStartScreen);
startPlayBtn.addEventListener('click', startGame);

modeRadios.forEach((r) => r.addEventListener('change', updateDifficultyVisibility));

promoModal.querySelectorAll('[data-promo]').forEach((btn) => {
  btn.addEventListener('click', () => {
    onPromotion(btn.dataset.promo);
  });
});

updateDifficultyVisibility();
showStartScreen();
