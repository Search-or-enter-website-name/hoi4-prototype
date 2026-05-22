import { divisionsInProvince, getFortLevel } from '../game/state.js';
import { canMove, canAttack } from '../game/orders.js';
import { divisionHasSupply } from '../game/supply.js';

export function renderCommandDrawer(container, state, callbacks) {
  const player = state.nations.find((n) => n.id === state.playerNationId);
  const pid = state.selectedProvinceId;
  const prov = state.mapData.provinces.find((p) => p.id === pid);
  const ownerId = pid ? state.ownership[pid] : null;
  const owner = state.nations.find((n) => n.id === ownerId);
  const divs = pid ? divisionsInProvince(state, pid) : [];
  const selDiv = state.divisions.find((d) => d.id === state.selectedDivisionId);
  const fort = pid ? getFortLevel(state, pid) : 0;

  let html = `
    <div class="drawer-meta">
      <span>MP <strong>${Math.floor(player?.manpower ?? 0)}</strong></span>
      <span>VP <strong>${state.victoryPoints?.[state.playerNationId] ?? 0}</strong></span>
    </div>
  `;

  if (!pid || !prov) {
    html += `<p class="order-hint">Click a province on the map. Hover to see names.</p>`;
  } else {
    const res = prov.resources || {};
    const resStr = Object.entries(res)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k} ${v}`)
      .join(', ') || '—';

    html += `<div class="drawer-columns">
      <div class="section">
        <strong>${prov.name}</strong><br/>
        ${owner?.name ?? '—'} · VP ${prov.vp || 0} · ${prov.terrain}<br/>
        Fort ${fort || 0} · ${resStr}<br/>
        ${ownerId === state.playerNationId ? '<em>Yours</em>' : '<em>Enemy</em>'}
        ${ownerId === state.playerNationId ? `<button id="btn-fort" ${player?.politicalPower < 25 ? 'disabled' : ''}>Upgrade fort</button>` : ''}
      </div>
      <div class="section">
        <strong>Divisions</strong>`;

    if (divs.length === 0) html += `<p class="order-hint">None</p>`;
    for (const d of divs) {
      const nation = state.nations.find((n) => n.id === d.nationId);
      const selected = d.id === state.selectedDivisionId;
      const sup = divisionHasSupply(state, d) ? '' : ' ⚠';
      html += `
        <div class="division-item ${selected ? 'selected' : ''}" data-div="${d.id}">
          ${nation?.name?.slice(0, 3)} ${d.type} — ${Math.round(d.strength)}/${Math.round(d.organization)}${sup}
        </div>`;
    }
    html += `</div></div>`;

    if (selDiv && selDiv.nationId === state.playerNationId) {
      const mpCost = selDiv.type === 'motorized' ? 15 : 10;
      html += `<div class="section">
        <strong>${selDiv.id}</strong> — ${selDiv.movedThisTurn ? 'acted' : 'click neighbor to order'}
        <button id="btn-reinforce" ${player?.manpower < mpCost || selDiv.strength >= 100 ? 'disabled' : ''}>Reinforce (−${mpCost})</button>
        <button id="btn-clear">Cancel order</button>
      </div>`;
    }
  }

  if (state.battleLog.length > 0) {
    const expanded = state.logExpanded;
    html += `<div class="section">
      <button type="button" class="log-toggle" id="btn-log-toggle">Reports ${expanded ? '▼' : '▶'}</button>`;
    if (expanded) {
      html += `<ul class="log-list">`;
      for (const line of state.battleLog.slice(0, 5)) html += `<li>${line}</li>`;
      html += `</ul>`;
    } else {
      html += `<p class="order-hint">${state.battleLog[0]}</p>`;
    }
    html += `</div>`;
  }

  container.innerHTML = html;

  container.querySelectorAll('.division-item').forEach((el) => {
    el.addEventListener('click', () => callbacks.selectDivision(el.dataset.div));
  });
  container.querySelector('#btn-reinforce')?.addEventListener('click', () => callbacks.reinforce());
  container.querySelector('#btn-clear')?.addEventListener('click', () => callbacks.clearOrder());
  container.querySelector('#btn-fort')?.addEventListener('click', () => callbacks.buildFort());
  container.querySelector('#btn-log-toggle')?.addEventListener('click', () => callbacks.toggleLog());
}

export function tryProvinceAction(state, targetProvinceId) {
  const selDiv = state.divisions.find((d) => d.id === state.selectedDivisionId);
  if (!selDiv || selDiv.nationId !== state.playerNationId) return null;
  if (canAttack(state, selDiv.id, targetProvinceId)) {
    return { type: 'attack', divisionId: selDiv.id, targetProvinceId };
  }
  if (canMove(state, selDiv.id, targetProvinceId)) {
    return { type: 'move', divisionId: selDiv.id, targetProvinceId };
  }
  return null;
}
