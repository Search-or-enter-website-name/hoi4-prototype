import { provinceCenter } from './hitTest.js';

function drawSea(ctx, mapData) {
  const sea = mapData.seaColor || '#2a5a6e';
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, mapData.width, mapData.height);

  ctx.fillStyle = mapData.landColor || '#2d4a3e';
  ctx.beginPath();
  for (const p of mapData.provinces) {
    const [first, ...rest] = p.points;
    ctx.moveTo(first[0], first[1]);
    for (const [x, y] of rest) ctx.lineTo(x, y);
    ctx.closePath();
  }
  ctx.fill();
}

function shouldShowLabel(p, state) {
  return (
    p.id === state.selectedProvinceId ||
    p.id === state.hoverProvinceId
  );
}

function shouldShowDivisionDetail(div, state, provinceId) {
  return (
    div.id === state.selectedDivisionId ||
    provinceId === state.selectedProvinceId ||
    provinceId === state.hoverProvinceId
  );
}

export function drawMap(ctx, state, mapData) {
  const { provinces } = mapData;
  const { ownership, nations, selectedProvinceId, hoverProvinceId } = state;

  drawSea(ctx, mapData);

  for (const p of provinces) {
    const ownerId = ownership[p.id];
    const nation = nations.find((n) => n.id === ownerId);
    const fill = nation ? nation.color : '#444';
    const isSelected = p.id === selectedProvinceId;
    const isHover = p.id === hoverProvinceId;

    ctx.beginPath();
    const [first, ...rest] = p.points;
    ctx.moveTo(first[0], first[1]);
    for (const [x, y] of rest) ctx.lineTo(x, y);
    ctx.closePath();

    ctx.fillStyle = isSelected || isHover ? lighten(fill, 35) : fill;
    ctx.globalAlpha = isSelected || isHover ? 1 : 0.88;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = isSelected ? '#fff' : isHover ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)';
    ctx.lineWidth = isSelected ? 2.5 : isHover ? 2 : 1;
    ctx.stroke();

    const fort = state.provinceMeta?.[p.id]?.fortLevel || 0;
    if (fort > 0) {
      const c = provinceCenter(p.points);
      ctx.beginPath();
      ctx.arc(c.x + 8, c.y - 8, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#c9a227';
      ctx.fill();
    }

    if (shouldShowLabel(p, state)) {
      const c = provinceCenter(p.points);
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      const tw = ctx.measureText(p.name).width;
      ctx.fillRect(c.x - tw / 2 - 4, c.y - 14, tw + 8, 16);
      ctx.fillStyle = '#fff';
      ctx.fillText(p.name, c.x, c.y - 2);
    }
  }

  drawOrders(ctx, state, mapData);
  drawDivisions(ctx, state, mapData);
}

function lighten(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amount;
  let g = ((n >> 8) & 0xff) + amount;
  let b = (n & 0xff) + amount;
  r = Math.min(255, r);
  g = Math.min(255, g);
  b = Math.min(255, b);
  return `rgb(${r},${g},${b})`;
}

function drawOrders(ctx, state, mapData) {
  const provinceById = Object.fromEntries(mapData.provinces.map((p) => [p.id, p]));

  for (const order of state.orders) {
    const div = state.divisions.find((d) => d.id === order.divisionId);
    if (!div) continue;
    const from = provinceById[div.provinceId];
    const to = provinceById[order.targetProvinceId];
    if (!from || !to) continue;

    const fc = provinceCenter(from.points);
    const tc = provinceCenter(to.points);

    ctx.beginPath();
    ctx.moveTo(fc.x, fc.y);
    ctx.lineTo(tc.x, tc.y);
    ctx.strokeStyle = order.type === 'attack' ? '#e94560' : '#7fdbda';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawDivisions(ctx, state, mapData) {
  const provinceById = Object.fromEntries(mapData.provinces.map((p) => [p.id, p]));

  for (const div of state.divisions) {
    const prov = provinceById[div.provinceId];
    if (!prov) continue;
    const c = provinceCenter(prov.points);
    const nation = state.nations.find((n) => n.id === div.nationId);
    const selected = state.selectedDivisionId === div.id;
    const showDetail = shouldShowDivisionDetail(div, state, div.provinceId);
    const r = showDetail ? 9 : 6;

    ctx.beginPath();
    ctx.arc(c.x, c.y - 10, r, 0, Math.PI * 2);
    ctx.fillStyle = nation ? nation.color : '#666';
    ctx.fill();
    ctx.strokeStyle = selected ? '#fff' : 'rgba(0,0,0,0.6)';
    ctx.lineWidth = selected ? 2.5 : 1;
    ctx.stroke();

    if (showDetail) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(div.strength), c.x, c.y - 7);
    }
  }
}
