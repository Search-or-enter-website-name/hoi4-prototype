/** Square index: a1=0 … h8=63 (file + rank*8) */
export const FILES = 'abcdefgh';

export const PIECE_UNICODE = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

export const SLIDER_DIRS = {
  rook: [[1, 0], [-1, 0], [0, 1], [0, -1]],
  bishop: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
  queen: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
};

export const KNIGHT_OFFSETS = [
  [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2],
];

export const KING_OFFSETS = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
];

/** Rank 0 = black back rank; white advances toward rank 0 */
export const PAWN_PUSH = { w: -8, b: 8 };
export const PAWN_START_RANK = { w: 6, b: 1 };
export const PROMO_RANK = { w: 0, b: 7 };

export function fileOf(sq) {
  return sq % 8;
}

export function rankOf(sq) {
  return Math.floor(sq / 8);
}

export function sq(file, rank) {
  return rank * 8 + file;
}

export function inBounds(file, rank) {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8;
}

export function colorOf(piece) {
  return piece ? piece[0] : null;
}

export function typeOf(piece) {
  return piece ? piece[1] : null;
}

export function opponent(color) {
  return color === 'w' ? 'b' : 'w';
}

/** Standard starting position */
export const START_BOARD = [
  'bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR',
  'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP',
  null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null,
  null, null, null, null, null, null, null, null,
  'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP',
  'wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR',
];

export const START_CASTLING = { wK: true, wQ: true, bK: true, bQ: true };
