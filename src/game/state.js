export function nationsAtWar(state, a, b) {
  const wars = state.scenario.wars || [];
  return wars.some(
    (w) =>
      (w.attacker === a && w.defender === b) ||
      (w.attacker === b && w.defender === a)
  );
}

export function createInitialState(mapData, scenario, playerNationId) {
  const nations = scenario.nations.map((n) => ({
    ...n,
    atWar: n.atWar ?? false,
    completedFocuses: n.completedFocuses || [],
    activeFocus: null,
    focusDaysLeft: 0,
  }));
  const ownership = { ...scenario.initialOwnership };
  const provinceMeta = {};
  for (const p of mapData.provinces) {
    provinceMeta[p.id] = {
      fortLevel: scenario.initialForts?.[p.id] || 0,
    };
  }
  const divisions = scenario.divisions.map((d) => ({
    type: 'infantry',
    ...d,
    movedThisTurn: false,
    entrenched: false,
  }));

  return {
    mapData,
    scenario,
    nations,
    ownership,
    provinceMeta,
    divisions,
    orders: [],
    selectedProvinceId: null,
    selectedDivisionId: null,
    playerNationId: playerNationId || scenario.playerNationId,
    date: { ...scenario.startDate },
    speed: 0,
    gameOver: null,
    battleLog: [],
    toast: null,
    toastUntil: 0,
    victoryPoints: computeVP(ownership, mapData, nations),
    focusTrees: {},
    showPanel: false,
    showFocus: false,
  };
}

export function computeVP(ownership, mapData, nations) {
  const vp = {};
  for (const n of nations) vp[n.id] = 0;
  for (const p of mapData.provinces) {
    const owner = ownership[p.id];
    if (owner && vp[owner] !== undefined) vp[owner] += p.vp || 1;
  }
  return vp;
}

export function getNation(state, id) {
  return state.nations.find((n) => n.id === id);
}

export function divisionsInProvince(state, provinceId) {
  return state.divisions.filter((d) => d.provinceId === provinceId && d.strength > 0);
}

export function provinceCount(state) {
  return state.mapData.provinces.length;
}

export function ownedCount(state, nationId) {
  return Object.values(state.ownership).filter((o) => o === nationId).length;
}

export function getFortLevel(state, provinceId) {
  return state.provinceMeta[provinceId]?.fortLevel || 0;
}

export function totalVP(state) {
  return Object.values(state.victoryPoints || {}).reduce((a, b) => a + b, 0);
}
