import { PAWN_PUSH, fileOf, rankOf, sq, colorOf, typeOf, opponent } from './constants.js';
import { cloneState } from './state.js';

function updateCastlingRights(castling, from, to, oldBoard) {
  const c = { ...castling };
  if (oldBoard[from] === 'wK' || oldBoard[to] === 'wK' || from === sq(4, 7) || to === sq(4, 7)) {
    c.wK = false;
    c.wQ = false;
  }
  if (oldBoard[from] === 'bK' || oldBoard[to] === 'bK' || from === sq(4, 0) || to === sq(4, 0)) {
    c.bK = false;
    c.bQ = false;
  }
  if (from === sq(0, 7) || to === sq(0, 7)) c.wQ = false;
  if (from === sq(7, 7) || to === sq(7, 7)) c.wK = false;
  if (from === sq(0, 0) || to === sq(0, 0)) c.bQ = false;
  if (from === sq(7, 0) || to === sq(7, 0)) c.bK = false;
  return c;
}

/** Apply move without promotion choice or game-end update */
export function applyMoveRaw(state, move, promotionPiece = null) {
  const next = cloneState(state);
  const { board, turn } = next;
  const piece = board[move.from];
  let captured = move.captured || null;

  board[move.from] = null;
  next.enPassant = null;

  if (move.flags === 'enpassant') {
    board[move.capturedSq] = null;
    captured = move.captured;
    board[move.to] = piece;
    next.lastMove = { from: move.from, to: move.to };
  } else if (move.flags === 'castle-k') {
    const rank = turn === 'w' ? 7 : 0;
    board[sq(4, rank)] = null;
    board[sq(7, rank)] = null;
    board[sq(6, rank)] = piece;
    board[sq(5, rank)] = `${turn}R`;
    next.lastMove = { from: move.from, to: move.to, castle: 'k' };
  } else if (move.flags === 'castle-q') {
    const rank = turn === 'w' ? 7 : 0;
    board[sq(4, rank)] = null;
    board[sq(0, rank)] = null;
    board[sq(2, rank)] = piece;
    board[sq(3, rank)] = `${turn}R`;
    next.lastMove = { from: move.from, to: move.to, castle: 'q' };
  } else {
    const isPromotion = promotionPiece && typeOf(piece) === 'P';
    board[move.to] = isPromotion ? promotionPiece : piece;
    next.lastMove = { from: move.from, to: move.to };
  }

  if (move.flags === 'double') {
    next.enPassant = move.from + PAWN_PUSH[turn];
  }

  next.castling = updateCastlingRights(next.castling, move.from, move.to, state.board);

  if (typeOf(piece) === 'P' || captured) {
    next.halfmoveClock = 0;
  } else {
    next.halfmoveClock += 1;
  }

  if (turn === 'b') next.fullmoveNumber += 1;

  next.turn = opponent(turn);
  next.selected = null;
  next.legalTargets = [];

  return next;
}
