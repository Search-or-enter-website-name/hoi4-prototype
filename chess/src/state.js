import { START_BOARD, START_CASTLING } from './constants.js';

export function createInitialState(options = {}) {
  const {
    gameMode = 'hotseat',
    playerColor = 'w',
    difficulty = 'easy',
  } = options;

  return {
    board: [...START_BOARD],
    turn: 'w',
    castling: { ...START_CASTLING },
    enPassant: null,
    halfmoveClock: 0,
    fullmoveNumber: 1,
    selected: null,
    legalTargets: [],
    pendingPromotion: null,
    lastMove: null,
    lastEffect: null,
    status: 'playing',
    history: [],
    gameMode,
    playerColor,
    difficulty,
  };
}

export function cloneState(state) {
  return {
    ...state,
    board: [...state.board],
    castling: { ...state.castling },
    legalTargets: [...(state.legalTargets || [])],
    history: [...state.history],
    lastMove: state.lastMove ? { ...state.lastMove } : null,
    pendingPromotion: state.pendingPromotion ? { ...state.pendingPromotion } : null,
    lastEffect: state.lastEffect ? { ...state.lastEffect } : null,
    gameMode: state.gameMode,
    playerColor: state.playerColor,
    difficulty: state.difficulty,
  };
}
