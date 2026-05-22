import { inCheck } from '../rules.js';

export function renderStatus(el, state) {
  const { turn, status, history } = state;
  let main = '';
  let sub = '';

  if (status === 'playing') {
    const who = turn === 'w' ? 'White' : 'Black';
    main = `${who} to move`;
    if (inCheck(state.board, turn)) {
      sub = 'Check!';
    }
  } else if (status === 'checkmate') {
    const winner = turn === 'w' ? 'Black' : 'White';
    main = `Checkmate — ${winner} wins`;
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
    const winner = state.turn === 'w' ? 'Black' : 'White';
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
