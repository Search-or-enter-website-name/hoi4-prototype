export function renderToolbar(container, state, callbacks) {
  const player = state.nations.find((n) => n.id === state.playerNationId);
  const { date } = state;
  const dateStr = `${date.day} ${monthName(date.month)} ${date.year}`;

  container.innerHTML = `
    <span class="nation-badge" style="background:${player?.color}">${player?.name ?? '—'}</span>
    <span class="toolbar-stats">
      <span>${dateStr}</span>
      <span>PP <strong>${Math.floor(player?.politicalPower ?? 0)}</strong></span>
      <span>Stab <strong>${Math.round(player?.stability ?? 0)}%</strong></span>
      <span>WS <strong>${Math.round(player?.warSupport ?? 0)}%</strong></span>
    </span>
    <span class="toolbar-spacer"></span>
    <span class="speed-group">
      <button data-speed="0" class="${state.speed === 0 ? 'active' : ''}" title="Pause">⏸</button>
      <button data-speed="1" class="${state.speed === 1 ? 'active' : ''}">1</button>
      <button data-speed="2" class="${state.speed === 2 ? 'active' : ''}">2</button>
      <button data-speed="3" class="${state.speed === 3 ? 'active' : ''}">3</button>
      <button data-speed="5" class="${state.speed === 5 ? 'active' : ''}">5</button>
    </span>
    <button id="btn-command" class="${state.commandDrawerOpen ? 'active' : ''}">Command</button>
    <button id="btn-gov">Gov</button>
    <button id="btn-focus">Focus</button>
  `;

  container.querySelectorAll('[data-speed]').forEach((btn) => {
    btn.addEventListener('click', () => callbacks.setSpeed(Number(btn.dataset.speed)));
  });
  container.querySelector('#btn-command')?.addEventListener('click', () => callbacks.toggleCommandDrawer());
  container.querySelector('#btn-gov')?.addEventListener('click', () => callbacks.openGovModal());
  container.querySelector('#btn-focus')?.addEventListener('click', () => callbacks.openFocusModal());
}

function monthName(m) {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return names[m - 1] || '';
}
