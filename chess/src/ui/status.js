import { inCheck } from '../rules.js';

export function renderStatus(el, state, { thinking = false } = {}) {
  const { turn, status, history, gameMode, playerColor, difficulty } = state;
  let main = '';
  let sub = '';

  if (status === 'playing') {
    if (thinking) {
      main = 'Computer thinking…';
    } else if (gameMode === 'ai') {
      const yourTurn = turn === playerColor;
      main = yourTurn ? 'Your turn' : 'Computer to move';
      sub = `${difficulty === 'hard' ? 'Hard' : 'Easy'} AI · You are ${playerColor === 'w' ? 'White' : 'Black'}`;
    } else {
      const who = turn === 'w' ? 'White' : 'Black';
      main = `${who} to move`;
    }
    if (!thinking && inCheck(state.board, turn)) {
      sub = sub ? `${sub} · Check!` : 'Check!';
    }
  } else if (status === 'checkmate') {
    const winnerColor = turn === 'w' ? 'b' : 'w';
    const winnerName = winnerColor === 'w' ? 'White' : 'Black';
    if (gameMode === 'ai') {
      const youWin = winnerColor === playerColor;
      main = youWin ? 'Checkmate — you win!' : 'Checkmate — computer wins';
    } else {
      main = `Checkmate — ${winnerName} wins`;
    }
  } else if (status === 'stalemate') {
    main = 'Stalemate — draw';
  } else if (status === 'draw') {
    main = 'Draw — insufficient material';
  }

  const last = history.length ? history[history.length - 1] : '—';

  el.innerHTML = `
    <p class="status-main">${main}</p>
    ${sub ? `<p class="status-sub">${sub}</p>` : ''}
    <p class="status-last">Last move: <span>${last}</span></p>
  `;
}

export function overlayMessage(state) {
  if (state.status === 'checkmate') {
    const winnerColor = state.turn === 'w' ? 'b' : 'w';
    if (state.gameMode === 'ai') {
      const youWin = winnerColor === state.playerColor;
      return {
        title: 'Checkmate',
        msg: youWin ? 'You win!' : 'Computer wins.',
      };
    }
    const winner = winnerColor === 'w' ? 'White' : 'Black';
    return { title: 'Checkmate', msg: `${winner} wins!` };
  }
  if (state.status === 'stalemate') {
    return { title: 'Stalemate', msg: 'The game is a draw.' };
  }
  if (state.status === 'draw') {
    return { title: 'Draw', msg: 'Insufficient material to checkmate.' };
  }
  return null;
}
