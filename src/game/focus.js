/** National focus tree engine */

export async function loadFocusTree(nationId) {
  try {
    const res = await fetch(`./src/data/focuses/${nationId}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function canStartFocus(state, nation, focus, tree) {
  if (nation.activeFocus) return false;
  if (nation.completedFocuses?.includes(focus.id)) return false;
  if (focus.requires?.length) {
    for (const req of focus.requires) {
      if (!nation.completedFocuses?.includes(req)) return false;
    }
  }
  if (focus.mutuallyExclusive?.length) {
    for (const ex of focus.mutuallyExclusive) {
      if (nation.completedFocuses?.includes(ex)) return false;
    }
  }
  if (focus.requiresOwned?.length) {
    for (const pid of focus.requiresOwned) {
      if (state.ownership[pid] !== nation.id) return false;
    }
  }
  if (focus.requiresTargetOwned) {
    const { province, by } = focus.requiresTargetOwned;
    const owner = state.ownership[province];
    if (!owner || owner === nation.id) return false;
    if (by && owner !== by) return false;
  }
  if (focus.requiresEnemyOwned) {
    const owner = state.ownership[focus.requiresEnemyOwned];
    if (!owner || owner === nation.id || !isEnemy(state, nation.id, owner)) return false;
  }
  return true;
}

function isEnemy(state, a, b) {
  if (a === b) return false;
  const wars = state.scenario.wars || [];
  return wars.some(
    (w) => (w.attacker === a && w.defender === b) || (w.attacker === b && w.defender === a)
  );
}

export function startFocus(state, nationId, focusId, tree) {
  const focus = tree.focuses.find((f) => f.id === focusId);
  const nation = state.nations.find((n) => n.id === nationId);
  if (!focus || !nation || nation.id !== state.playerNationId) return state;
  if (!canStartFocus(state, nation, focus, tree)) return state;

  return {
    ...state,
    nations: state.nations.map((n) =>
      n.id === nationId
        ? { ...n, activeFocus: focusId, focusDaysLeft: focus.days }
        : n
    ),
    toast: `Focus started: ${focus.name} (${focus.days} days)`,
    toastUntil: performance.now() + 3000,
  };
}

export function tickFocus(state) {
  return {
    ...state,
    nations: state.nations.map((n) => {
      if (!n.activeFocus) return n;
      let left = n.focusDaysLeft - 1;
      if (left > 0) return { ...n, focusDaysLeft: left };
      return n;
    }),
  };
}

export function completeReadyFocuses(state, focusTrees) {
  let s = state;
  for (const nation of s.nations) {
    if (!nation.activeFocus || nation.focusDaysLeft > 0) continue;
    const tree = focusTrees[nation.id];
    if (!tree) {
      s = clearActiveFocus(s, nation.id);
      continue;
    }
    const focus = tree.focuses.find((f) => f.id === nation.activeFocus);
    if (!focus) {
      s = clearActiveFocus(s, nation.id);
      continue;
    }
    s = applyFocusEffects(s, nation.id, focus);
    s = {
      ...s,
      nations: s.nations.map((n) =>
        n.id === nation.id
          ? {
              ...n,
              completedFocuses: [...(n.completedFocuses || []), focus.id],
              activeFocus: null,
              focusDaysLeft: 0,
            }
          : n
      ),
      toast: `Focus complete: ${focus.name}`,
      toastUntil: performance.now() + 4000,
      battleLog: [`★ ${focus.name}`, ...(s.battleLog || [])].slice(0, 12),
    };
  }
  return s;
}

function clearActiveFocus(state, nationId) {
  return {
    ...state,
    nations: state.nations.map((n) =>
      n.id === nationId ? { ...n, activeFocus: null, focusDaysLeft: 0 } : n
    ),
  };
}

function applyFocusEffects(state, nationId, focus) {
  let s = state;
  for (const eff of focus.effects || []) {
    s = applyEffect(s, nationId, eff);
  }
  return s;
}

function applyEffect(state, nationId, eff) {
  switch (eff.type) {
    case 'pp':
      return mapNation(state, nationId, (n) => ({
        ...n,
        politicalPower: n.politicalPower + eff.value,
      }));
    case 'stability':
      return mapNation(state, nationId, (n) => ({
        ...n,
        stability: clamp(n.stability + eff.value, 0, 100),
      }));
    case 'war_support':
      return mapNation(state, nationId, (n) => ({
        ...n,
        warSupport: clamp(n.warSupport + eff.value, 0, 100),
      }));
    case 'manpower':
      return mapNation(state, nationId, (n) => ({
        ...n,
        manpower: n.manpower + eff.value,
      }));
    case 'civ_factory':
      return mapNation(state, nationId, (n) => ({
        ...n,
        civilianFactories: n.civilianFactories + eff.value,
      }));
    case 'mil_factory':
      return mapNation(state, nationId, (n) => ({
        ...n,
        militaryFactories: n.militaryFactories + eff.value,
      }));
    case 'annex_province':
      if (state.ownership[eff.province] && state.ownership[eff.province] !== nationId) {
        return {
          ...state,
          ownership: { ...state.ownership, [eff.province]: nationId },
          divisions: state.divisions.filter(
            (d) => d.provinceId !== eff.province || d.nationId === nationId
          ),
        };
      }
      return state;
    case 'declare_war':
      if (!state.scenario.wars.some((w) => w.attacker === nationId && w.defender === eff.target)) {
        return {
          ...state,
          scenario: {
            ...state.scenario,
            wars: [...state.scenario.wars, { attacker: nationId, defender: eff.target }],
          },
          nations: state.nations.map((n) =>
            n.id === nationId || n.id === eff.target ? { ...n, atWar: true } : n
          ),
        };
      }
      return state;
    case 'at_war':
      return mapNation(state, nationId, (n) => ({ ...n, atWar: eff.value }));
    default:
      return state;
  }
}

function mapNation(state, nationId, fn) {
  return {
    ...state,
    nations: state.nations.map((n) => (n.id === nationId ? fn(n) : n)),
  };
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
