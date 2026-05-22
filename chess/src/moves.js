import {
  SLIDER_DIRS, KNIGHT_OFFSETS, KING_OFFSETS, PAWN_PUSH, PAWN_START_RANK, PROMO_RANK,
  fileOf, rankOf, sq, inBounds, colorOf, typeOf, opponent,
} from './constants.js';
import { inCheck, isSquareAttacked } from './rules.js';
import { applyMoveRaw } from './boardOps.js';

function findKing(board, color) {
  const k = `${color}K`;
  for (let i = 0; i < 64; i++) {
    if (board[i] === k) return i;
  }
  return -1;
}

function pseudoMovesForPiece(state, from) {
  const { board, turn, castling, enPassant } = state;
  const piece = board[from];
  if (!piece || colorOf(piece) !== turn) return [];

  const moves = [];
  const f = fileOf(from);
  const r = rankOf(from);
  const t = typeOf(piece);

  if (t === 'P') {
    const push = PAWN_PUSH[turn];
    const one = from + push;
    if (inBounds(fileOf(one), rankOf(one)) && !board[one]) {
      moves.push({ from, to: one, flags: 'quiet' });
      const two = from + 2 * push;
      if (rankOf(from) === PAWN_START_RANK[turn] && !board[two]) {
        moves.push({ from, to: two, flags: 'double' });
      }
    }
    for (const df of [-1, 1]) {
      const capSq = sq(f + df, r + (turn === 'w' ? -1 : 1));
      if (!inBounds(f + df, r + (turn === 'w' ? -1 : 1))) continue;
      const target = board[capSq];
      if (target && colorOf(target) === opponent(turn)) {
        moves.push({ from, to: capSq, flags: 'capture', captured: target });
      } else if (enPassant === capSq) {
        const capturedSq = capSq - push;
        moves.push({
          from, to: capSq, flags: 'enpassant',
          captured: board[capturedSq], capturedSq,
        });
      }
    }
    return moves;
  }

  if (t === 'N') {
    for (const [df, dr] of KNIGHT_OFFSETS) {
      const nf = f + df;
      const nr = r + dr;
      if (!inBounds(nf, nr)) continue;
      const to = sq(nf, nr);
      const target = board[to];
      if (!target) moves.push({ from, to, flags: 'quiet' });
      else if (colorOf(target) === opponent(turn)) {
        moves.push({ from, to, flags: 'capture', captured: target });
      }
    }
    return moves;
  }

  if (t === 'K') {
    for (const [df, dr] of KING_OFFSETS) {
      const nf = f + df;
      const nr = r + dr;
      if (!inBounds(nf, nr)) continue;
      const to = sq(nf, nr);
      const target = board[to];
      if (!target) moves.push({ from, to, flags: 'quiet' });
      else if (colorOf(target) === opponent(turn)) {
        moves.push({ from, to, flags: 'capture', captured: target });
      }
    }
    // Castling
    const rank = turn === 'w' ? 7 : 0;
    const kingSq = sq(4, rank);
    if (from === kingSq) {
      if (castling[`${turn}K`] && !board[sq(5, rank)] && !board[sq(6, rank)] &&
          board[sq(7, rank)] === `${turn}R`) {
        moves.push({ from, to: sq(6, rank), flags: 'castle-k' });
      }
      if (castling[`${turn}Q`] && !board[sq(3, rank)] && !board[sq(2, rank)] && !board[sq(1, rank)] &&
          board[sq(0, rank)] === `${turn}R`) {
        moves.push({ from, to: sq(2, rank), flags: 'castle-q' });
      }
    }
    return moves;
  }

  const dirs = t === 'R' ? SLIDER_DIRS.rook : t === 'B' ? SLIDER_DIRS.bishop : SLIDER_DIRS.queen;
  for (const [df, dr] of dirs) {
    let nf = f + df;
    let nr = r + dr;
    while (inBounds(nf, nr)) {
      const to = sq(nf, nr);
      const target = board[to];
      if (!target) {
        moves.push({ from, to, flags: 'quiet' });
      } else {
        if (colorOf(target) === opponent(turn)) {
          moves.push({ from, to, flags: 'capture', captured: target });
        }
        break;
      }
      nf += df;
      nr += dr;
    }
  }
  return moves;
}

function filterLegal(state, moves) {
  const { board, turn } = state;
  return moves.filter((m) => {
    const next = applyMoveRaw(state, m);
    return !inCheck(next.board, turn);
  });
}

function filterCastling(state, moves) {
  const { board, turn } = state;
  const kingSq = findKing(board, turn);
  if (inCheck(board, turn)) {
    return moves.filter((m) => !m.flags.startsWith('castle'));
  }
  return moves.filter((m) => {
    if (!m.flags.startsWith('castle')) return true;
    const step = m.flags === 'castle-k' ? 1 : -1;
    const f = fileOf(kingSq);
    const r = rankOf(kingSq);
    const mid = sq(f + step, r);
    const end = m.to;
    return !isSquareAttacked(board, kingSq, opponent(turn)) &&
      !isSquareAttacked(board, mid, opponent(turn)) &&
      !isSquareAttacked(board, end, opponent(turn));
  });
}

export function getLegalMoves(state, from) {
  const pseudo = pseudoMovesForPiece(state, from);
  const noCastleThroughCheck = filterCastling(state, pseudo);
  return filterLegal(state, noCastleThroughCheck);
}

export function getAllLegalMoves(state) {
  const { board, turn } = state;
  const all = [];
  for (let i = 0; i < 64; i++) {
    if (board[i] && colorOf(board[i]) === turn) {
      all.push(...getLegalMoves(state, i));
    }
  }
  return all;
}

export function isCheckmate(state) {
  if (state.status !== 'playing') return false;
  return inCheck(state.board, state.turn) && getAllLegalMoves(state).length === 0;
}

export function isStalemate(state) {
  if (state.status !== 'playing') return false;
  return !inCheck(state.board, state.turn) && getAllLegalMoves(state).length === 0;
}

export function needsPromotion(state, move) {
  const piece = state.board[move.from];
  if (!piece || typeOf(piece) !== 'P') return false;
  const r = rankOf(move.to);
  return r === PROMO_RANK[colorOf(piece)];
}
