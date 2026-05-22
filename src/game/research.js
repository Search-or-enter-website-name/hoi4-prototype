export const TECHS = {
  infantry_weapons_1: {
    id: 'infantry_weapons_1',
    name: 'Infantry Weapons I',
    days: 0,
    attack: 1,
    defense: 1,
    orgRecover: 0,
  },
  infantry_weapons_2: {
    id: 'infantry_weapons_2',
    name: 'Infantry Weapons II',
    days: 60,
    attack: 1.12,
    defense: 1.08,
    orgRecover: 0,
    requires: 'infantry_weapons_1',
  },
  support_equipment: {
    id: 'support_equipment',
    name: 'Support Equipment',
    days: 45,
    attack: 1.05,
    defense: 1.05,
    orgRecover: 3,
    requires: 'infantry_weapons_1',
  },
  interwar_artillery: {
    id: 'interwar_artillery',
    name: 'Interwar Artillery',
    days: 70,
    attack: 1.15,
    defense: 1,
    orgRecover: 0,
    requires: 'infantry_weapons_2',
  },
  basic_fortification: {
    id: 'basic_fortification',
    name: 'Basic Fortification',
    days: 40,
    fortDiscount: 0.5,
    requires: 'infantry_weapons_1',
  },
};

export function getTechBonuses(nation) {
  let attack = 1;
  let defense = 1;
  let orgRecover = 0;
  let fortDiscount = 0;
  for (const tid of nation.researched || []) {
    const t = TECHS[tid];
    if (!t) continue;
    attack *= t.attack || 1;
    defense *= t.defense || 1;
    orgRecover += t.orgRecover || 0;
    fortDiscount = Math.max(fortDiscount, t.fortDiscount || 0);
  }
  return { attack, defense, orgRecover, fortDiscount };
}

export function startResearch(state, nationId, techId) {
  const tech = TECHS[techId];
  const nation = state.nations.find((n) => n.id === nationId);
  if (!tech || !nation || nation.id !== state.playerNationId) return state;
  if (nation.researched?.includes(techId)) return state;
  if (tech.requires && !nation.researched?.includes(tech.requires)) return state;
  if (nation.activeResearch) return state;

  return {
    ...state,
    nations: state.nations.map((n) =>
      n.id === nationId
        ? { ...n, activeResearch: techId, researchDaysLeft: tech.days }
        : n
    ),
  };
}

export function tickResearch(state) {
  return {
    ...state,
    nations: state.nations.map((n) => {
      if (!n.activeResearch) return n;
      let left = n.researchDaysLeft - 1;
      if (left > 0) return { ...n, researchDaysLeft: left };
      const researched = [...(n.researched || []), n.activeResearch];
      return {
        ...n,
        researched,
        activeResearch: null,
        researchDaysLeft: 0,
      };
    }),
  };
}
