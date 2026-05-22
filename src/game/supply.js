/** Supply: provinces connected to capital via owned territory */
export function computeSupplyReach(state, nationId) {
  const nation = state.nations.find((n) => n.id === nationId);
  if (!nation) return new Set();

  const capital = nation.capitalProvinceId;
  const owned = new Set(
    Object.entries(state.ownership)
      .filter(([, o]) => o === nationId)
      .map(([id]) => id)
  );

  if (!owned.has(capital)) return owned;

  const byId = Object.fromEntries(state.mapData.provinces.map((p) => [p.id, p]));
  const reachable = new Set();
  const queue = [capital];

  while (queue.length) {
    const id = queue.shift();
    if (reachable.has(id)) continue;
    if (!owned.has(id)) continue;
    reachable.add(id);
    const p = byId[id];
    if (!p) continue;
    for (const nid of p.neighbors) {
      if (owned.has(nid) && !reachable.has(nid)) queue.push(nid);
    }
  }
  return reachable;
}

export function divisionHasSupply(state, division) {
  const reach = computeSupplyReach(state, division.nationId);
  return reach.has(division.provinceId);
}
