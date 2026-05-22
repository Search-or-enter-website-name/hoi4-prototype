import { getTechBonuses } from './research.js';

const TERRAIN = {
  plains: { attack: 1, defense: 1 },
  forest: { attack: 0.9, defense: 1.15 },
  mountain: { attack: 0.75, defense: 1.3 },
};

const DIVISION_TYPE = {
  infantry: { attack: 1, defense: 1 },
  motorized: { attack: 1.18, defense: 0.95 },
};

function terrainMod(terrain, isAttack) {
  const t = TERRAIN[terrain] || TERRAIN.plains;
  return isAttack ? t.attack : t.defense;
}

function roll() {
  return 0.9 + Math.random() * 0.2;
}

export function resolveBattle(attacker, defender, terrain, defenderEntrenched, modifiers = {}) {
  const {
    atkTech = 1,
    defTech = 1,
    warSupportAtk = 1,
    fortLevel = 0,
    attackerSupplied = true,
    defenderSupplied = true,
  } = modifiers;

  const atkType = DIVISION_TYPE[attacker.type] || DIVISION_TYPE.infantry;
  const defType = DIVISION_TYPE[defender.type] || DIVISION_TYPE.infantry;

  let atkPower =
    attacker.strength *
    (attacker.organization / 100) *
    terrainMod(terrain, true) *
    atkType.attack *
    atkTech *
    warSupportAtk *
    roll();
  if (!attackerSupplied) atkPower *= 0.65;

  let defMod = terrainMod(terrain, false) * defType.defense * defTech;
  if (defenderEntrenched) defMod *= 1.12;
  defMod *= 1 + fortLevel * 0.15;
  if (!defenderSupplied) defMod *= 0.7;

  const defPower = defender.strength * (defender.organization / 100) * defMod * roll();

  const attackerWins = atkPower >= defPower;
  const dmg = (winner, loser) => {
    const factor = winner ? 0.35 : 0.5;
    return {
      strength: Math.max(0, loser.strength - Math.round(loser.strength * factor)),
      organization: Math.max(0, loser.organization - Math.round(15 + Math.random() * 20)),
    };
  };

  let newAtk = { ...attacker };
  let newDef = { ...defender };

  if (attackerWins) {
    const d = dmg(true, defender);
    newDef = { ...defender, ...d, movedThisTurn: true, entrenched: false };
    const aDmg = dmg(false, attacker);
    newAtk = {
      ...attacker,
      strength: Math.max(1, attacker.strength - Math.round(aDmg.strength * 0.3)),
      organization: Math.max(10, attacker.organization - 8),
      movedThisTurn: true,
      entrenched: false,
    };
  } else {
    const d = dmg(true, attacker);
    newAtk = { ...attacker, ...d, movedThisTurn: true, entrenched: false };
    const dDmg = dmg(false, defender);
    newDef = {
      ...defender,
      strength: Math.max(1, defender.strength - Math.round(dDmg.strength * 0.2)),
      organization: Math.max(10, defender.organization - 5),
      entrenched: true,
    };
  }

  return {
    attackerWins,
    atkPower: Math.round(atkPower),
    defPower: Math.round(defPower),
    attacker: newAtk,
    defender: newDef,
  };
}
