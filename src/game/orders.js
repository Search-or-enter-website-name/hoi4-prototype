import { divisionsInProvince, nationsAtWar, getNation } from './state.js';

export function areAdjacent(mapData, a, b) {
  const prov = mapData.provinces.find((p) => p.id === a);
  return prov && prov.neighbors.includes(b);
}

export function canMove(state, divisionId, targetProvinceId) {
  const div = state.divisions.find((d) => d.id === divisionId);
  if (!div || div.nationId !== state.playerNationId) return false;
  if (div.movedThisTurn) return false;
  if (!areAdjacent(state.mapData, div.provinceId, targetProvinceId)) return false;
  if (state.ownership[targetProvinceId] !== div.nationId) return false;
  return true;
}

export function canAttack(state, divisionId, targetProvinceId) {
  const div = state.divisions.find((d) => d.id === divisionId);
  if (!div || div.nationId !== state.playerNationId) return false;
  if (div.movedThisTurn) return false;
  if (!areAdjacent(state.mapData, div.provinceId, targetProvinceId)) return false;
  if (state.ownership[targetProvinceId] === div.nationId) return false;
  const defender = state.ownership[targetProvinceId];
  const attackerNation = getNation(state, div.nationId);
  if (!nationsAtWar(state, div.nationId, defender)) return false;
  return true;
}

export function queueMove(state, divisionId, targetProvinceId) {
  if (!canMove(state, divisionId, targetProvinceId)) return state;
  const orders = state.orders.filter((o) => o.divisionId !== divisionId);
  orders.push({ type: 'move', divisionId, targetProvinceId });
  return { ...state, orders };
}

export function queueAttack(state, divisionId, targetProvinceId) {
  if (!canAttack(state, divisionId, targetProvinceId)) return state;
  const orders = state.orders.filter((o) => o.divisionId !== divisionId);
  orders.push({ type: 'attack', divisionId, targetProvinceId });
  return { ...state, orders };
}

export function hasDefenders(state, provinceId, nationId) {
  return divisionsInProvince(state, provinceId).some(
    (d) => d.nationId !== nationId && d.strength > 0
  );
}
