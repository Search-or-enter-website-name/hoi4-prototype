import { CONSCRIPTION_LAWS, ECONOMY_LAWS, TRADE_LAWS, applyLawChange } from '../game/settings.js';
import { TECHS, startResearch } from '../game/research.js';
import { startFactoryProject } from '../game/economy.js';

export function renderNationPanel(container, state, callbacks) {
  const n = state.nations.find((x) => x.id === state.playerNationId);
  if (!n) return;

  const wars = (state.scenario.wars || [])
    .filter((w) => w.attacker === n.id || w.defender === n.id)
    .map((w) => (w.attacker === n.id ? `vs ${w.defender}` : `vs ${w.attacker}`))
    .join(', ');

  let html = `
    <div class="stat-grid">
      <span>Political Power</span><strong>${Math.floor(n.politicalPower)}</strong>
      <span>Stability</span><strong>${Math.round(n.stability)}%</strong>
      <span>War Support</span><strong>${Math.round(n.warSupport)}%</strong>
      <span>Manpower</span><strong>${Math.floor(n.manpower)}</strong>
      <span>Victory Points</span><strong>${state.victoryPoints?.[n.id] ?? 0}</strong>
    </div>
    <p class="order-hint">At war: ${wars || 'peace'}</p>

    <div class="section">
      <strong>Industry</strong><br/>
      Civ: ${n.civilianFactories} | Mil: ${n.militaryFactories} | Dock: ${n.dockyards}<br/>
      Steel: ${Math.floor(n.resources?.steel || 0)} | Oil: ${Math.floor(n.resources?.oil || 0)}
      ${n.factoryProject ? `<br/><em>Building mil factory: ${Math.floor(n.factoryProgress)}%</em>` : ''}
      <button id="btn-build-mil" ${n.factoryProject || n.politicalPower < 80 ? 'disabled' : ''}>
        Build Military Factory (80 PP)
      </button>
    </div>

    <div class="section">
      <strong>Conscription (50 PP)</strong>
      ${lawSelect('conscriptionLaw', n.conscriptionLaw, CONSCRIPTION_LAWS)}
    </div>
    <div class="section">
      <strong>Economy (50 PP)</strong>
      ${lawSelect('economyLaw', n.economyLaw, ECONOMY_LAWS)}
    </div>
    <div class="section">
      <strong>Trade (50 PP)</strong>
      ${lawSelect('tradeLaw', n.tradeLaw, TRADE_LAWS)}
    </div>

    <div class="section">
      <strong>Research</strong>
      ${n.activeResearch ? `<p>Researching: ${TECHS[n.activeResearch]?.name} (${n.researchDaysLeft}d)</p>` : ''}
      <ul class="tech-list">
  `;

  for (const tech of Object.values(TECHS)) {
    if (tech.days === 0) continue;
    const done = n.researched?.includes(tech.id);
    const locked = tech.requires && !n.researched?.includes(tech.requires);
    html += `<li>
      ${tech.name} (${tech.days}d)
      ${done ? ' ✓' : locked ? ' (locked)' : ''}
      ${!done && !locked && !n.activeResearch ? `<button class="btn-tech" data-tech="${tech.id}">Start</button>` : ''}
    </li>`;
  }

  html += `</ul></div>`;

  container.innerHTML = html;

  container.querySelectorAll('select[data-law]').forEach((sel) => {
    sel.addEventListener('change', () => {
      callbacks.changeLaw(sel.dataset.law, sel.value);
    });
  });

  container.querySelector('#btn-build-mil')?.addEventListener('click', () => callbacks.buildFactory());
  container.querySelectorAll('.btn-tech').forEach((btn) => {
    btn.addEventListener('click', () => callbacks.startTech(btn.dataset.tech));
  });
}

function lawSelect(field, current, laws) {
  let opts = '';
  for (const law of Object.values(laws)) {
    opts += `<option value="${law.id}" ${law.id === current ? 'selected' : ''}>${law.name}</option>`;
  }
  return `<select data-law="${field}" class="law-select">${opts}</select>`;
}

export function applyPanelCallbacks(state, action, arg) {
  switch (action) {
    case 'changeLaw':
      return applyLawChange(state, state.playerNationId, arg.field, arg.value);
    case 'buildFactory':
      return startFactoryProject(state, state.playerNationId, 'mil');
    case 'startTech':
      return startResearch(state, state.playerNationId, arg);
    default:
      return state;
  }
}
