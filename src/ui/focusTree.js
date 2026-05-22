import { canStartFocus, startFocus } from '../game/focus.js';

export function renderFocusTree(container, state, tree, callbacks) {
  if (!tree) {
    container.innerHTML = '<p class="order-hint">No focus tree for this nation.</p>';
    return;
  }

  const nation = state.nations.find((n) => n.id === state.playerNationId);
  const cols = Math.max(...tree.focuses.map((f) => f.x)) + 2;
  const rows = Math.max(...tree.focuses.map((f) => f.y)) + 2;

  let html = `
    <p class="order-hint">${nation?.activeFocus ? `Researching: <strong>${tree.focuses.find((f) => f.id === nation.activeFocus)?.name}</strong> (${nation.focusDaysLeft} days left)` : 'Select an available focus. Only one at a time.'}</p>
    <div class="focus-grid" style="grid-template-columns: repeat(${Math.min(cols, 4)}, minmax(140px, 1fr));">
  `;

  const cellMap = {};
  for (const f of tree.focuses) {
    const key = `${f.x}-${f.y}`;
    cellMap[key] = f;
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const f = cellMap[`${x}-${y}`];
      if (!f) {
        html += `<div class="focus-cell empty"></div>`;
        continue;
      }
      const done = nation.completedFocuses?.includes(f.id);
      const active = nation.activeFocus === f.id;
      const available = canStartFocus(state, nation, f, tree);
      let cls = 'focus-node';
      if (done) cls += ' done';
      else if (active) cls += ' active';
      else if (available) cls += ' available';
      else cls += ' locked';

      html += `
        <div class="focus-cell">
          <button class="${cls}" data-focus="${f.id}" ${!available || done || active || nation.activeFocus ? 'disabled' : ''} title="${f.desc || ''}">
            <span class="focus-name">${f.name}</span>
            <span class="focus-days">${f.days}d</span>
          </button>
        </div>
      `;
    }
  }

  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.focus-node.available').forEach((btn) => {
    btn.addEventListener('click', () => callbacks.startFocus(btn.dataset.focus));
  });
}
