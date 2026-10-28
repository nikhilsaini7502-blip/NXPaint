import { Point, Stroke } from '../types/airdraw';

/**
 * Calculates Euclidean distance from a point to a 2D line segment AB
 */
export function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): { distance: number; t: number; closestX: number; closestY: number } {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    const d = Math.hypot(px - ax, py - ay);
    return { distance: d, t: 0, closestX: ax, closestY: ay };
  }

  // Projection scalar t along segment AB, clamped to [0, 1]
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const closestX = ax + t * dx;
  const closestY = ay + t * dy;
  const distance = Math.hypot(px - closestX, py - closestY);

  return { distance, t, closestX, closestY };
}

/**
 * Checks if a point is within the eraser circle
 */
export function isPointInEraser(p: Point, ex: number, ey: number, radius: number): boolean {
  const dx = p.x - ex;
  const dy = p.y - ey;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * Erases portions of a stroke by cutting through segments and splitting
 * the stroke into multiple independent sub-strokes.
 * Allows erasing anywhere along the stroke (middle, start, or end).
 */
export function eraseSingleStroke(
  stroke: Stroke,
  ex: number,
  ey: number,
  radius: number
): Stroke[] {
  const points = stroke.points;
  if (!points || points.length < 2) return [];

  // Quick bounding box rejection
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  // If eraser circle is completely outside stroke bounding box + radius, keep stroke as is
  if (
    ex + radius < minX ||
    ex - radius > maxX ||
    ey + radius < minY ||
    ey - radius > maxY
  ) {
    return [stroke];
  }

  const resultStrokes: Stroke[] = [];
  let currentSegment: Point[] = [];

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const ptInside = isPointInEraser(pt, ex, ey, radius);

    if (!ptInside) {
      // Check if previous segment stepped through the eraser circle
      if (i > 0 && currentSegment.length > 0) {
        const prev = points[i - 1];
        const segCheck = distanceToSegment(ex, ey, prev.x, prev.y, pt.x, pt.y);
        if (segCheck.distance <= radius) {
          // The line segment cuts through the eraser circle!
          if (currentSegment.length >= 1) {
            const segPoints = currentSegment.length === 1
              ? [currentSegment[0], { ...currentSegment[0], x: currentSegment[0].x + 0.5 }]
              : [...currentSegment];
            resultStrokes.push({
              ...stroke,
              id: `${stroke.id}-part-${resultStrokes.length}-${Date.now()}`,
              points: segPoints,
            });
          }
          currentSegment = [];
        }
      }
      currentSegment.push(pt);
    } else {
      // Point is inside eraser circle -> cut stroke
      if (currentSegment.length >= 1) {
        const segPoints = currentSegment.length === 1
          ? [currentSegment[0], { ...currentSegment[0], x: currentSegment[0].x + 0.5 }]
          : [...currentSegment];
        resultStrokes.push({
          ...stroke,
          id: `${stroke.id}-part-${resultStrokes.length}-${Date.now()}`,
          points: segPoints,
        });
      }
      currentSegment = [];
    }
  }

  if (currentSegment.length >= 1) {
    const segPoints = currentSegment.length === 1
      ? [currentSegment[0], { ...currentSegment[0], x: currentSegment[0].x + 0.5 }]
      : [...currentSegment];
    resultStrokes.push({
      ...stroke,
      id: `${stroke.id}-part-${resultStrokes.length}-${Date.now()}`,
      points: segPoints,
    });
  }

  return resultStrokes;
}

/**
 * Erases across all strokes on visible, unlocked layers.
 * Splits strokes whenever eraser cuts through the middle.
 */
export function eraseStrokes(
  strokes: Stroke[],
  erasableLayerIds: Set<string>,
  ex: number,
  ey: number,
  radius: number
): { updatedStrokes: Stroke[]; erasedAny: boolean } {
  let erasedAny = false;
  const updatedStrokes: Stroke[] = [];

  for (const stroke of strokes) {
    const layerId = stroke.layerId || 'layer-neon-fx';
    if (!erasableLayerIds.has(layerId)) {
      // Locked or hidden layer: keep untouched
      updatedStrokes.push(stroke);
      continue;
    }

    const split = eraseSingleStroke(stroke, ex, ey, radius);
    if (split.length !== 1 || split[0].points.length !== stroke.points.length) {
      erasedAny = true;
    }

    for (const s of split) {
      if (s.points.length >= 2) {
        updatedStrokes.push(s);
      }
    }
  }

  return { updatedStrokes, erasedAny };
}
