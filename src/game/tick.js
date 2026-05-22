import { resolveBattle } from './combat.js';
import { divisionsInProvince, getFortLevel, computeVP, getNation } from './state.js';
import { checkVictory } from './victory.js';
import { generateAIOrders } from './ai.js';
import { tickEconomy } from './economy.js';
import { tickFocus, completeReadyFocuses } from './focus.js';
import { getTechBonuses } from './research.js';
import { divisionHasSupply } from './supply.js';

function advanceDate(date) {
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let { year, month, day } = date;
  day++;
  if (day > daysInMonth[month - 1]) {
    day = 1;
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  return { year, month, day };
}

function processAttack(state, order) {
  const div = state.divisions.find((d) => d.id === order.divisionId);
  if (!div || div.strength <= 0) return state;

  const targetId = order.targetProvinceId;
  const prov = state.mapData.provinces.find((p) => p.id === targetId);
  const terrain = prov?.terrain || 'plains';
  const fortLevel = getFortLevel(state, targetId);

  const defenders = divisionsInProvince(state, targetId).filter(
    (d) => d.nationId !== div.nationId && d.strength > 0
  );

  const atkNation = getNation(state, div.nationId);
  const atkTech = getTechBonuses(atkNation);
  const warMod = atkNation?.atWar ? 1 + (atkNation.warSupport || 0) / 200 : 1;

  let s = { ...state };
  let msg = '';

  if (defenders.length === 0) {
    s = {
      ...s,
      ownership: { ...s.ownership, [targetId]: div.nationId },
      divisions: s.divisions.map((d) =>
        d.id === div.id
          ? { ...d, provinceId: targetId, movedThisTurn: true, entrenched: false }
          : d
      ),
    };
    msg = `Captured ${prov.name} (+${prov.vp || 0} VP)`;
  } else {
    const defender = defenders[0];
    const defNation = getNation(state, defender.nationId);
    const defTech = getTechBonuses(defNation);

    const result = resolveBattle(div, defender, terrain, defender.entrenched && !defender.movedThisTurn, {
      atkTech: atkTech.attack,
      defTech: defTech.defense,
      warSupportAtk: warMod,
      fortLevel,
      attackerSupplied: divisionHasSupply(state, div),
      defenderSupplied: divisionHasSupply(state, defender),
    });

    let divisions = s.divisions.map((d) => {
      if (d.id === result.attacker.id)
        return { ...result.attacker, provinceId: result.attackerWins ? targetId : d.provinceId };
      if (d.id === result.defender.id) return result.defender;
      return d;
    });

    divisions = divisions.filter((d) => d.strength > 0);

    if (
      result.attackerWins &&
      !divisions.some((d) => d.provinceId === targetId && d.nationId !== div.nationId && d.strength > 0)
    ) {
      s = { ...s, ownership: { ...s.ownership, [targetId]: div.nationId } };
    }

    s = { ...s, divisions };
    const sup = !divisionHasSupply(state, div) ? ' (out of supply!)' : '';
    msg = `${prov.name}: ${result.attackerWins ? 'Victory' : 'Defeat'} ${result.atkPower} vs ${result.defPower}${sup}`;
  }

  s = {
    ...s,
    victoryPoints: computeVP(s.ownership, s.mapData),
    toast: msg,
    toastUntil: performance.now() + 4000,
    battleLog: [msg, ...s.battleLog].slice(0, 10),
  };
  return s;
}

function processMove(state, order) {
  const div = state.divisions.find((d) => d.id === order.divisionId);
  if (!div) return state;

  return {
    ...state,
    divisions: state.divisions.map((d) =>
      d.id === div.id
        ? { ...d, provinceId: order.targetProvinceId, movedThisTurn: true, entrenched: false }
        : d
    ),
  };
}

function recoverOrg(state) {
  return {
    ...state,
    divisions: state.divisions.map((d) => {
      if (d.strength <= 0) return d;
      const onFriendly = state.ownership[d.provinceId] === d.nationId;
      const supplied = divisionHasSupply(state, d);
      const nation = getNation(state, d.nationId);
      const tech = getTechBonuses(nation);
      let gain = 5 + tech.orgRecover;
      if (!supplied) gain = Math.floor(gain * 0.4);
      if (!d.movedThisTurn && onFriendly) {
        return { ...d, organization: Math.min(100, d.organization + gain), entrenched: true };
      }
      return { ...d, movedThisTurn: false };
    }),
  };
}

export function processDay(state) {
  if (state.gameOver || state.speed === 0) return state;

  let s = tickFocus(state);
  s = completeReadyFocuses(s, s.focusTrees || {});
  s = { ...s, victoryPoints: computeVP(s.ownership, s.mapData, s.nations) };
  s = tickEconomy(s);
  s = generateAIOrders(s);

  for (const order of s.orders) {
    if (order.type === 'move') s = processMove(s, order);
    else if (order.type === 'attack') s = processAttack(s, order);
  }

  s = { ...s, orders: [], date: advanceDate(s.date) };
  s = recoverOrg(s);
  s = { ...s, victoryPoints: computeVP(s.ownership, s.mapData) };
  s = checkVictory(s);

  return s;
}

export function reinforceDivision(state, divisionId) {
  const div = state.divisions.find((d) => d.id === divisionId);
  if (!div || div.nationId !== state.playerNationId) return state;
  const nation = state.nations.find((n) => n.id === div.nationId);
  const cost = div.type === 'motorized' ? 15 : 10;
  if (!nation || nation.manpower < cost || div.strength >= 100) return state;

  return {
    ...state,
    nations: state.nations.map((n) =>
      n.id === nation.id ? { ...n, manpower: n.manpower - cost } : n
    ),
    divisions: state.divisions.map((d) =>
      d.id === divisionId ? { ...d, strength: Math.min(100, d.strength + 10) } : d
    ),
  };
}
