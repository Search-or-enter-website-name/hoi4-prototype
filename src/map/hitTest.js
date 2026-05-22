/** Point-in-polygon (ray casting) */
export function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function polygonArea(points) {
  let area = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    area += (xj + xi) * (yj - yi);
  }
  return Math.abs(area / 2);
}

/** Prefer smallest containing province (fixes overlaps on irregular map). */
export function provinceAtPoint(provinces, x, y) {
  let best = null;
  let bestArea = Infinity;
  for (const p of provinces) {
    if (!pointInPolygon(x, y, p.points)) continue;
    const area = polygonArea(p.points);
    if (area < bestArea) {
      bestArea = area;
      best = p.id;
    }
  }
  return best;
}

export function provinceCenter(points) {
  let sx = 0;
  let sy = 0;
  for (const [x, y] of points) {
    sx += x;
    sy += y;
  }
  return { x: sx / points.length, y: sy / points.length };
}
