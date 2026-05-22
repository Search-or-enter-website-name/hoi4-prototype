import { fileOf, rankOf, typeOf } from './constants.js';
import { applyMoveRaw } from './boardOps.js?v=5';
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

function resolvePromotion(state, move, promotionPiece, autoQueen) {
  if (!needsPromotion(state, move)) return null;
  if (promotionPiece) return promotionPiece;
  if (autoQueen) return `${state.turn}Q`;
  return null;
}

export function applyMove(state, move, options = {}) {
  const promotionPiece = options.promotionPiece ?? null;
  const autoQueen = options.autoQueen ?? false;

  if (state.status !== 'playing' || state.pendingPromotion) return state;

  const legal = getAllLegalMoves(state).some(
    (m) => m.from === move.from && m.to === move.to && m.flags === move.flags
  );
  if (!legal) return state;

  const promo = resolvePromotion(state, move, promotionPiece, autoQueen);

  if (needsPromotion(state, move) && !promo) {
    return {
      ...state,
      pendingPromotion: { move: { ...move } },
      selected: null,
      legalTargets: [],
    };
  }

  let next = applyMoveRaw(state, move, promo);
  next.history = [...state.history, formatMove(move, promo)];
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
    { promotionPiece: piece }
  );
}
