import { START_BOARD, START_CASTLING } from './constants.js';

export function createInitialState() {
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
    status: 'playing',
    history: [],
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
  };
}
