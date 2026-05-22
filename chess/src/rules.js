import {
  SLIDER_DIRS, KNIGHT_OFFSETS, KING_OFFSETS,
  fileOf, rankOf, sq, inBounds, colorOf, typeOf, opponent,
} from './constants.js';

function findKing(board, color) {
  const k = `${color}K`;
  for (let i = 0; i < 64; i++) {
    if (board[i] === k) return i;
  }
  return -1;
}

function rayHits(board, from, target, dirs) {
  const ff = fileOf(from);
  const rr = rankOf(from);
  const tf = fileOf(target);
  const tr = rankOf(target);
  for (const [df, dr] of dirs) {
    let f = ff + df;
    let r = rr + dr;
    while (inBounds(f, r)) {
      if (f === tf && r === tr) return true;
      if (board[sq(f, r)]) break;
      f += df;
      r += dr;
    }
  }
  return false;
}

function pieceAttacksSquare(board, from, target, byColor) {
  const p = board[from];
  if (!p || colorOf(p) !== byColor) return false;
  const t = typeOf(p);
  const f = fileOf(from);
  const r = rankOf(from);
  const tf = fileOf(target);
  const tr = rankOf(target);

  if (t === 'N') {
    return Math.abs(tf - f) * Math.abs(tr - r) === 2;
  }
  if (t === 'K') {
    return Math.max(Math.abs(tf - f), Math.abs(tr - r)) === 1;
  }
  if (t === 'P') {
    const dir = byColor === 'w' ? 1 : -1;
    return tr === r + dir && Math.abs(tf - f) === 1;
  }
  if (t === 'R') return (f === tf || r === tr) && rayHits(board, from, target, SLIDER_DIRS.rook);
  if (t === 'B') return rayHits(board, from, target, SLIDER_DIRS.bishop);
  if (t === 'Q') {
    return rayHits(board, from, target, SLIDER_DIRS.rook) ||
      rayHits(board, from, target, SLIDER_DIRS.bishop);
  }
  return false;
}

/** Is square attacked by `byColor`? */
export function isSquareAttacked(board, square, byColor) {
  for (let i = 0; i < 64; i++) {
    if (pieceAttacksSquare(board, i, square, byColor)) return true;
  }
  return false;
}

export function inCheck(board, color) {
  const kingSq = findKing(board, color);
  if (kingSq < 0) return false;
  return isSquareAttacked(board, kingSq, opponent(color));
}

function pieceCount(board) {
  const pieces = [];
  for (const p of board) {
    if (p) pieces.push(p);
  }
  return pieces;
}

/** Insufficient material to checkmate */
export function isInsufficientMaterial(board) {
  const pieces = pieceCount(board).filter((p) => typeOf(p) !== 'K');
  if (pieces.length === 0) return true;

  if (pieces.length === 1) {
    const t = typeOf(pieces[0]);
    return t === 'B' || t === 'N';
  }

  if (pieces.length === 2) {
    const [a, b] = pieces;
    if (typeOf(a) === 'B' && typeOf(b) === 'B' && colorOf(a) !== colorOf(b)) {
      const sqA = board.indexOf(a);
      const sqB = board.indexOf(b);
      const lightA = (fileOf(sqA) + rankOf(sqA)) % 2 === 0;
      const lightB = (fileOf(sqB) + rankOf(sqB)) % 2 === 0;
      return lightA === lightB;
    }
    if ((typeOf(a) === 'B' && typeOf(b) === 'N') || (typeOf(a) === 'N' && typeOf(b) === 'B')) {
      return colorOf(a) !== colorOf(b);
    }
  }
  return false;
}
