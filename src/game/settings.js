/** HOI4-inspired national laws and modifiers */

export const CONSCRIPTION_LAWS = {
  volunteer: {
    id: 'volunteer',
    name: 'Volunteer Only',
    manpowerCap: 150,
    dailyManpower: 2,
    stabilityMod: 5,
    warSupportMod: -10,
  },
  limited: {
    id: 'limited',
    name: 'Limited Conscription',
    manpowerCap: 350,
    dailyManpower: 6,
    stabilityMod: 0,
    warSupportMod: 0,
  },
  extensive: {
    id: 'extensive',
    name: 'Extensive Conscription',
    manpowerCap: 600,
    dailyManpower: 14,
    stabilityMod: -8,
    warSupportMod: 10,
  },
};

export const ECONOMY_LAWS = {
  civilian_economy: {
    id: 'civilian_economy',
    name: 'Civilian Economy',
    factoryOutput: 0.85,
    ppPerDay: 2,
    warSupportMod: -15,
  },
  early_mobilization: {
    id: 'early_mobilization',
    name: 'Early Mobilization',
    factoryOutput: 1,
    ppPerDay: 1.5,
    warSupportMod: 5,
  },
  war_economy: {
    id: 'war_economy',
    name: 'War Economy',
    factoryOutput: 1.2,
    ppPerDay: 1,
    warSupportMod: 15,
  },
};

export const TRADE_LAWS = {
  free_trade: { id: 'free_trade', name: 'Free Trade', resourceBonus: 1.1, stabilityMod: 5 },
  export_focus: { id: 'export_focus', name: 'Export Focus', resourceBonus: 1, stabilityMod: 0 },
  closed_economy: { id: 'closed_economy', name: 'Closed Economy', resourceBonus: 0.9, stabilityMod: -5 },
};

export function getLawModifiers(nation) {
  const con = CONSCRIPTION_LAWS[nation.conscriptionLaw] || CONSCRIPTION_LAWS.limited;
  const eco = ECONOMY_LAWS[nation.economyLaw] || ECONOMY_LAWS.early_mobilization;
  const trade = TRADE_LAWS[nation.tradeLaw] || TRADE_LAWS.export_focus;
  return { con, eco, trade };
}

export function applyLawChange(state, nationId, field, value) {
  const laws = {
    conscriptionLaw: CONSCRIPTION_LAWS,
    economyLaw: ECONOMY_LAWS,
    tradeLaw: TRADE_LAWS,
  };
  if (!laws[field]?.[value]) return state;
  const cost = 50;
  const nation = state.nations.find((n) => n.id === nationId);
  if (!nation || nation.politicalPower < cost || nation.id !== state.playerNationId) return state;

  return {
    ...state,
    nations: state.nations.map((n) =>
      n.id === nationId
        ? { ...n, [field]: value, politicalPower: n.politicalPower - cost }
        : n
    ),
    toast: `Law changed: ${laws[field][value].name} (−${cost} PP)`,
    toastUntil: performance.now() + 3000,
  };
}
