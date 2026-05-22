import { getLawModifiers } from './settings.js';
import { tickResearch, getTechBonuses } from './research.js';

export function tickEconomy(state) {
  let s = tickResearch(state);

  s = {
    ...s,
    nations: s.nations.map((n) => {
      const { con, eco, trade } = getLawModifiers(n);
      let pp = n.politicalPower + eco.ppPerDay + (n.stability > 50 ? 0.5 : 0);
      let manpower = Math.min(
        con.manpowerCap,
        n.manpower + con.dailyManpower
      );
      let stability = clamp(n.stability + trade.stabilityMod * 0.01, 0, 100);
      let warSupport = clamp(
        n.warSupport + (n.atWar ? 0.15 : -0.05) + eco.warSupportMod * 0.01,
        0,
        100
      );

      const steel = (n.resources?.steel || 0) + countResource(s, n.id, 'steel') * 0.1 * trade.resourceBonus;
      const oil = (n.resources?.oil || 0) + countResource(s, n.id, 'oil') * 0.05 * trade.resourceBonus;

      let militaryFactories = n.militaryFactories;
      if (n.factoryProject === 'mil' && n.factoryProgress >= 100) {
        militaryFactories += 1;
        return {
          ...n,
          politicalPower: pp,
          manpower,
          stability,
          warSupport,
          resources: { ...n.resources, steel, oil },
          militaryFactories,
          factoryProject: null,
          factoryProgress: 0,
        };
      }

      let factoryProgress = n.factoryProgress || 0;
      if (n.factoryProject === 'mil') {
        factoryProgress += n.civilianFactories * 0.8 * eco.factoryOutput;
      }

      return {
        ...n,
        politicalPower: pp,
        manpower,
        stability,
        warSupport,
        resources: { ...n.resources, steel, oil },
        factoryProgress,
      };
    }),
  };

  return s;
}

function countResource(state, nationId, type) {
  let sum = 0;
  for (const p of state.mapData.provinces) {
    if (state.ownership[p.id] !== nationId) continue;
    sum += p.resources?.[type] || 0;
  }
  return sum;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function startFactoryProject(state, nationId, type) {
  const nation = state.nations.find((n) => n.id === nationId);
  if (!nation || nation.id !== state.playerNationId || nation.factoryProject) return state;
  if (type !== 'mil' || nation.politicalPower < 80) return state;

  return {
    ...state,
    nations: state.nations.map((n) =>
      n.id === nationId
        ? { ...n, politicalPower: n.politicalPower - 80, factoryProject: 'mil', factoryProgress: 0 }
        : n
    ),
    toast: 'Military factory construction started (civ factories building)',
    toastUntil: performance.now() + 3000,
  };
}

export function buildFort(state, provinceId) {
  const pid = provinceId;
  if (state.ownership[pid] !== state.playerNationId) return state;
  const nation = state.nations.find((n) => n.id === state.playerNationId);
  const meta = state.provinceMeta[pid] || { fortLevel: 0 };
  const { fortDiscount } = getTechBonuses(nation);
  const cost = Math.round(25 * (1 - fortDiscount));
  if (!nation || nation.politicalPower < cost || meta.fortLevel >= 3) return state;

  return {
    ...state,
    nations: state.nations.map((n) =>
      n.id === state.playerNationId ? { ...n, politicalPower: n.politicalPower - cost } : n
    ),
    provinceMeta: {
      ...state.provinceMeta,
      [pid]: { fortLevel: meta.fortLevel + 1 },
    },
    toast: `Fort in ${pid} upgraded to level ${meta.fortLevel + 1}`,
    toastUntil: performance.now() + 2500,
  };
}
