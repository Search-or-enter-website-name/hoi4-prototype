import { opponent } from '../constants.js';
import { getAllLegalMoves, needsPromotion } from '../moves.js';
import { applyMove } from '../applyMove.js';
import { inCheck } from '../rules.js';
import { evaluateFor } from './evaluate.js';

const MATE = 100000;

function applyForSearch(state, move) {
  const promo = needsPromotion(state, move) ? `${state.turn}Q` : null;
  return applyMove(state, move, promo);
}

function terminalScore(state, aiColor) {
  const moves = getAllLegalMoves(state);
  if (moves.length > 0) return null;
  if (inCheck(state.board, state.turn)) {
    return state.turn === aiColor ? -MATE : MATE;
  }
  return 0;
}

function minimax(state, depth, alpha, beta, aiColor) {
  const terminal = terminalScore(state, aiColor);
  if (terminal !== null) return terminal;
  if (depth === 0) return evaluateFor(state.board, aiColor);

  const moves = orderMoves(state, getAllLegalMoves(state));
  const maximizing = state.turn === aiColor;

  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      const next = applyForSearch(state, m);
      const score = minimax(next, depth - 1, alpha, beta, aiColor);
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  let best = Infinity;
  for (const m of moves) {
    const next = applyForSearch(state, m);
    const score = minimax(next, depth - 1, alpha, beta, aiColor);
    best = Math.min(best, score);
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

function orderMoves(state, moves) {
  return [...moves].sort((a, b) => {
    const capA = a.flags === 'capture' || a.flags === 'enpassant' ? 1 : 0;
    const capB = b.flags === 'capture' || b.flags === 'enpassant' ? 1 : 0;
    return capB - capA;
  });
}

function pickEasy(state, aiColor) {
  const moves = getAllLegalMoves(state);
  if (!moves.length) return null;

  const captures = moves.filter((m) => m.flags === 'capture' || m.flags === 'enpassant');
  const checks = moves.filter((m) => {
    const next = applyForSearch(state, m);
    return inCheck(next.board, opponent(aiColor));
  });

  const pool = checks.length && Math.random() < 0.35
    ? checks
    : captures.length && Math.random() < 0.55
      ? captures
      : moves;

  return pool[Math.floor(Math.random() * pool.length)];
}

function pickHard(state, aiColor) {
  const moves = getAllLegalMoves(state);
  if (!moves.length) return null;

  const depth = 3;
  let bestMove = moves[0];
  let bestScore = -Infinity;
  const ordered = orderMoves(state, moves);

  for (const m of ordered) {
    const next = applyForSearch(state, m);
    const score = minimax(next, depth - 1, -Infinity, Infinity, aiColor);
    if (score > bestScore) {
      bestScore = score;
      bestMove = m;
    }
  }
  return bestMove;
}

export function pickAIMove(state) {
  if (!state.gameMode || state.gameMode !== 'ai') return null;
  const aiColor = opponent(state.playerColor);
  if (state.turn !== aiColor || state.status !== 'playing') return null;

  return state.difficulty === 'hard'
    ? pickHard(state, aiColor)
    : pickEasy(state, aiColor);
}
