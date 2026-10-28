import { Point } from '../types/airdraw';

/**
 * Exponential moving average filter to eliminate sensor jitter and hand tremors
 */
export function smoothPointExponential(
  prev: Point | null,
  current: Point,
  alpha: number = 0.65
): Point {
  if (!prev) return current;
  return {
    x: prev.x * (1 - alpha) + current.x * alpha,
    y: prev.y * (1 - alpha) + current.y * alpha,
    z: prev.z !== undefined && current.z !== undefined ? prev.z * (1 - alpha) + current.z * alpha : current.z,
    timestamp: current.timestamp,
    pressure: current.pressure,
  };
}

/**
 * Catmull-Rom spline interpolation between p1 and p2 using control points p0 and p3.
 */
export function catmullRom2D(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const t2 = t * t;
  const t3 = t2 * t;

  const f0 = -0.5 * t3 + t2 - 0.5 * t;
  const f1 = 1.5 * t3 - 2.5 * t2 + 1.0;
  const f2 = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
  const f3 = 0.5 * t3 - 0.5 * t2;

  return {
    x: p0.x * f0 + p1.x * f1 + p2.x * f2 + p3.x * f3,
    y: p0.y * f0 + p1.y * f1 + p2.y * f2 + p3.y * f3,
  };
}

/**
 * Converts a sequence of discrete input points into a continuous, silky smooth curve.
 */
export function generateSmoothSpline(points: Point[], segmentsPerSpan: number = 4): Point[] {
  if (points.length < 3) return points;

  const result: Point[] = [];
  const count = points.length;

  for (let i = 0; i < count - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i + 2 < count ? points[i + 2] : p2;

    for (let s = 0; s < segmentsPerSpan; s++) {
      const t = s / segmentsPerSpan;
      result.push(catmullRom2D(p0, p1, p2, p3, t));
    }
  }

  result.push(points[count - 1]);
  return result;
}

/**
 * Calculates Euclidean distance between two points.
 */
export function distanceBetween(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates stroke velocity to dynamically taper brush width (calligraphy effect).
 */
export function calculateStrokeVelocity(p1: Point, p2: Point): number {
  const dist = distanceBetween(p1, p2);
  const dt = (p2.timestamp && p1.timestamp) ? Math.max(1, p2.timestamp - p1.timestamp) : 16;
  return dist / dt;
}
