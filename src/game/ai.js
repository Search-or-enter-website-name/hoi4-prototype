import { nationsAtWar } from './state.js';

function aiDivisions(state, nationId) {
  return state.divisions.filter(
    (d) => d.nationId === nationId && d.strength > 0 && !d.movedThisTurn
  );
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateAIOrders(state) {
  const aiNations = state.scenario.aiNations || [];
  let orders = [...state.orders];

  for (const nationId of aiNations) {
    const nation = state.nations.find((n) => n.id === nationId);
    const divs = aiDivisions(state, nationId);

    for (const div of divs) {
      if (orders.some((o) => o.divisionId === div.id)) continue;

      const prov = state.mapData.provinces.find((p) => p.id === div.provinceId);
      if (!prov) continue;

      const enemyNeighbors = prov.neighbors.filter((nid) => {
        const owner = state.ownership[nid];
        if (owner === nationId) return false;
        return !nation?.atWar || nationsAtWar(state, nationId, owner);
      });

      const friendlyNeighbors = prov.neighbors.filter(
        (nid) => state.ownership[nid] === nationId && nid !== div.provinceId
      );

      if (enemyNeighbors.length > 0 && (nation?.atWar || Math.random() < 0.3)) {
        orders.push({
          type: 'attack',
          divisionId: div.id,
          targetProvinceId: randomItem(enemyNeighbors),
        });
        continue;
      }

      if (friendlyNeighbors.length > 0 && Math.random() < 0.35) {
        orders.push({
          type: 'move',
          divisionId: div.id,
          targetProvinceId: randomItem(friendlyNeighbors),
        });
      }
    }
  }

  return { ...state, orders };
}
