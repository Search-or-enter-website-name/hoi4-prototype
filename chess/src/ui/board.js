import { FILES, PIECE_UNICODE, colorOf } from '../constants.js';
import { inCheck } from '../rules.js';

function findKingSq(board, color) {
  const k = `${color}K`;
  for (let i = 0; i < 64; i++) {
    if (board[i] === k) return i;
  }
  return -1;
}

export function renderBoard(container, state, onSquareClick) {
  const { board, selected, legalTargets, lastMove, turn } = state;
  const kingInCheck = inCheck(board, turn);
  const checkedKingSq = kingInCheck ? findKingSq(board, turn) : -1;

  container.innerHTML = '';
  container.setAttribute('role', 'grid');
  container.setAttribute('aria-label', 'Chess board');

  const coords = document.createElement('div');
  coords.className = 'board-with-coords';

  const rankLabels = document.createElement('div');
  rankLabels.className = 'rank-labels';
  for (let r = 8; r >= 1; r--) {
    const span = document.createElement('span');
    span.textContent = String(r);
    rankLabels.appendChild(span);
  }

  const gridWrap = document.createElement('div');
  gridWrap.className = 'grid-wrap';

  const fileLabels = document.createElement('div');
  fileLabels.className = 'file-labels';
  for (const f of FILES) {
    const span = document.createElement('span');
    span.textContent = f;
    fileLabels.appendChild(span);
  }

  const grid = document.createElement('div');
  grid.className = 'board-grid';
  if (state.gameMode === 'ai' && state.playerColor === 'b') {
    grid.classList.add('flipped');
  }

  for (let rank = 7; rank >= 0; rank--) {
    for (let file = 0; file < 8; file++) {
      const sq = rank * 8 + file;
      const light = (file + rank) % 2 === 0;
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = `square ${light ? 'light' : 'dark'}`;
      cell.dataset.sq = String(sq);
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `${FILES[file]}${rank + 1}`);

      if (selected === sq) cell.classList.add('selected');
      if (legalTargets.includes(sq)) cell.classList.add('legal');
      if (lastMove && (lastMove.from === sq || lastMove.to === sq)) cell.classList.add('last-move');
      if (sq === checkedKingSq) cell.classList.add('in-check');

      const piece = board[sq];
      if (piece) {
        const span = document.createElement('span');
        span.className = `piece ${colorOf(piece)}`;
        span.textContent = PIECE_UNICODE[piece];
        span.setAttribute('aria-hidden', 'true');
        cell.appendChild(span);
      }

      if (legalTargets.includes(sq) && !board[sq]) {
        const dot = document.createElement('span');
        dot.className = 'move-hint';
        cell.appendChild(dot);
      }

      cell.addEventListener('click', () => onSquareClick(sq));
      grid.appendChild(cell);
    }
  }

  gridWrap.appendChild(grid);
  gridWrap.appendChild(fileLabels);
  coords.appendChild(rankLabels);
  coords.appendChild(gridWrap);
  container.appendChild(coords);
}
