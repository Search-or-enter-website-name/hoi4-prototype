import { colorOf, typeOf } from '../constants.js';

const VALUES = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };

/** Positive score favors White */
export function evaluateBoard(board) {
  let score = 0;
  for (const p of board) {
    if (!p) continue;
    const v = VALUES[typeOf(p)] || 0;
    score += colorOf(p) === 'w' ? v : -v;
  }
  return score;
}

/** Score from the perspective of `forColor` */
export function evaluateFor(board, forColor) {
  const s = evaluateBoard(board);
  return forColor === 'w' ? s : -s;
}
