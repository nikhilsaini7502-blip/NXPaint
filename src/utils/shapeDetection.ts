import { Point, ShapeCandidate } from '../types/airdraw';
import { distanceBetween } from './splineSmoother';

/**
 * Calculates centroid of a set of points
 */
export function calculateCentroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  let sumX = 0;
  let sumY = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
  }
  return {
    x: sumX / points.length,
    y: sumY / points.length,
  };
}

/**
 * Calculates bounding box of a set of points
 */
export function getBoundingBox(points: Point[]) {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

/**
 * Checks if a stroke is approximately a closed loop (start and end points are near each other)
 */
export function isClosedLoop(points: Point[], thresholdFraction: number = 0.25): boolean {
  if (points.length < 8) return false;
  const start = points[0];
  const end = points[points.length - 1];
  const bbox = getBoundingBox(points);
  const diag = Math.sqrt(bbox.width * bbox.width + bbox.height * bbox.height);
  const dist = distanceBetween(start, end);
  return dist < diag * thresholdFraction;
}

/**
 * Tests if points represent a circle by computing radius variance from centroid
 */
export function detectCircle(points: Point[]): ShapeCandidate | null {
  if (points.length < 12 || !isClosedLoop(points)) return null;

  const center = calculateCentroid(points);
  const distances = points.map(p => distanceBetween(p, center));
  const avgRadius = distances.reduce((a, b) => a + b, 0) / distances.length;
  
  if (avgRadius < 15) return null; // Too small

  // Calculate standard deviation of radius
  const variance = distances.reduce((acc, d) => acc + Math.pow(d - avgRadius, 2), 0) / distances.length;
  const stdDev = Math.sqrt(variance);
  const coeffOfVariation = stdDev / avgRadius;

  if (coeffOfVariation < 0.22) { // Low variation in distance to center = circle
    // Generate 36 clean circle points
    const cleanPoints: Point[] = [];
    const steps = 36;
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      cleanPoints.push({
        x: center.x + Math.cos(angle) * avgRadius,
        y: center.y + Math.sin(angle) * avgRadius,
      });
    }
    return {
      type: 'circle',
      confidence: 1 - coeffOfVariation,
      points: cleanPoints,
    };
  }

  return null;
}

/**
 * Tests if points represent a rectangle
 */
export function detectRectangle(points: Point[]): ShapeCandidate | null {
  if (points.length < 10 || !isClosedLoop(points)) return null;

  const bbox = getBoundingBox(points);
  if (bbox.width < 25 || bbox.height < 25) return null;

  // Generate 4 clean corners + close loop
  const rectPoints: Point[] = [
    { x: bbox.minX, y: bbox.minY },
    { x: bbox.maxX, y: bbox.minY },
    { x: bbox.maxX, y: bbox.maxY },
    { x: bbox.minX, y: bbox.maxY },
    { x: bbox.minX, y: bbox.minY },
  ];

  return {
    type: 'rectangle',
    confidence: 0.75,
    points: rectPoints,
  };
}

/**
 * Recognizes if stroke can be snapped to a geometric shape
 */
export function recognizeShape(points: Point[]): ShapeCandidate | null {
  if (points.length < 10) return null;

  // Try circle first
  const circle = detectCircle(points);
  if (circle) return circle;

  // Try rectangle if closed
  if (isClosedLoop(points)) {
    return detectRectangle(points);
  }

  return null;
}
