import { createInitialState } from './state.js';
import { getLegalMoves } from './moves.js';
import { applyMove, completePromotion } from './applyMove.js';
import { colorOf } from './constants.js';
import { renderBoard } from './ui/board.js';
import { renderStatus, overlayMessage } from './ui/status.js';

let state = createInitialState();

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg = document.getElementById('overlay-msg');
const promoModal = document.getElementById('promo-modal');
const newGameBtn = document.getElementById('new-game');
const overlayRestart = document.getElementById('overlay-restart');

function render() {
  renderBoard(boardEl, state, onSquareClick);
  renderStatus(statusEl, state);

  const msg = overlayMessage(state);
  if (msg) {
    overlayTitle.textContent = msg.title;
    overlayMsg.textContent = msg.msg;
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
  }

  if (state.pendingPromotion) {
    promoModal.classList.remove('hidden');
  } else {
    promoModal.classList.add('hidden');
  }
}

function onSquareClick(sq) {
  if (state.status !== 'playing' || state.pendingPromotion) return;

  const { board, turn, selected } = state;
  const piece = board[sq];

  if (selected !== null && selected !== sq) {
    const moves = getLegalMoves(state, selected);
    const move = moves.find((m) => m.to === sq);
    if (move) {
      state = applyMove(state, move);
      render();
      return;
    }
  }

  if (selected === sq) {
    state = { ...state, selected: null, legalTargets: [] };
    render();
    return;
  }

  if (piece && colorOf(piece) === turn) {
    const moves = getLegalMoves(state, sq);
    state = {
      ...state,
      selected: sq,
      legalTargets: moves.map((m) => m.to),
    };
    render();
    return;
  }

  if (selected !== null) {
    state = { ...state, selected: null, legalTargets: [] };
    render();
  }
}

function onPromotion(pieceType) {
  if (!state.pendingPromotion) return;
  state = completePromotion(state, pieceType);
  render();
}

function newGame() {
  state = createInitialState();
  render();
}

newGameBtn.addEventListener('click', newGame);
overlayRestart.addEventListener('click', newGame);

promoModal.querySelectorAll('[data-promo]').forEach((btn) => {
  btn.addEventListener('click', () => {
    onPromotion(btn.dataset.promo);
  });
});

render();
