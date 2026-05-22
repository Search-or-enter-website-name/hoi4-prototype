import { fileOf, rankOf, typeOf } from './constants.js';
import { applyMoveRaw } from './boardOps.js';
import { getAllLegalMoves, isCheckmate, isStalemate, needsPromotion } from './moves.js';
import { isInsufficientMaterial } from './rules.js';

function finalizeStatus(state) {
  if (isCheckmate(state)) {
    return { ...state, status: 'checkmate' };
  }
  if (isStalemate(state)) {
    return { ...state, status: 'stalemate' };
  }
  if (isInsufficientMaterial(state.board)) {
    return { ...state, status: 'draw' };
  }
  return state;
}

function formatMove(move, promo) {
  const files = 'abcdefgh';
  const from = `${files[fileOf(move.from)]}${rankOf(move.from) + 1}`;
  const to = `${files[fileOf(move.to)]}${rankOf(move.to) + 1}`;
  let s = `${from}-${to}`;
  if (move.flags === 'castle-k') s = 'O-O';
  if (move.flags === 'castle-q') s = 'O-O-O';
  if (promo) s += `=${typeOf(promo)}`;
  return s;
}

export function applyMove(state, move, promotionPiece = null) {
  if (state.status !== 'playing' || state.pendingPromotion) return state;

  const legal = getAllLegalMoves(state).some(
    (m) => m.from === move.from && m.to === move.to && m.flags === move.flags
  );
  if (!legal) return state;

  if (needsPromotion(state, move) && !promotionPiece) {
    return {
      ...state,
      pendingPromotion: { move: { ...move } },
      selected: null,
      legalTargets: [],
    };
  }

  const promo = needsPromotion(state, move) ? promotionPiece : null;
  let next = applyMoveRaw(state, move, promo);
  next.history = [...state.history, formatMove(move, promotionPiece)];
  next = finalizeStatus(next);
  return next;
}

export function completePromotion(state, pieceType) {
  if (!state.pendingPromotion) return state;
  const { move } = state.pendingPromotion;
  const piece = `${state.turn}${pieceType}`;
  return applyMove(
    { ...state, pendingPromotion: null },
    move,
    piece
  );
}
