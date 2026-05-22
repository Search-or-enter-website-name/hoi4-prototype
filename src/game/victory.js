import { getNation, ownedCount, provinceCount, totalVP } from './state.js';

export function checkVictory(state) {
  if (state.gameOver) return state;

  const player = state.playerNationId;
  const total = provinceCount(state);
  const playerOwned = ownedCount(state, player);
  const threshold = Math.ceil(total * 0.65);

  const playerNation = getNation(state, player);
  const playerDivs = state.divisions.filter(
    (d) => d.nationId === player && d.strength > 0
  );

  const playerVP = state.victoryPoints?.[player] || 0;
  const allVP = totalVP(state);
  const vpThreshold = Math.ceil(allVP * 0.5);

  if (playerDivs.length === 0) {
    return { ...state, gameOver: 'defeat', speed: 0 };
  }

  const capitalId = playerNation.capitalProvinceId;
  if (state.ownership[capitalId] !== player) {
    return { ...state, gameOver: 'defeat', speed: 0 };
  }

  if (playerOwned >= threshold || playerVP >= vpThreshold) {
    return { ...state, gameOver: 'victory', speed: 0 };
  }

  for (const n of state.nations) {
    if (n.id === player) continue;
    if (state.ownership[n.capitalProvinceId] === player) {
      return { ...state, gameOver: 'victory', speed: 0 };
    }
  }

  return state;
}

export function formatGameOver(state) {
  if (state.gameOver === 'victory') {
    const vp = state.victoryPoints?.[state.playerNationId] || 0;
    return { title: 'Victory!', msg: `War won. Victory Points: ${vp}.` };
  }
  if (state.gameOver === 'defeat') {
    return { title: 'Defeat', msg: 'Capital lost or army destroyed.' };
  }
  return null;
}
