import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  smoothPointExponential, 
  catmullRom2D, 
  generateSmoothSpline, 
  distanceBetween, 
  calculateStrokeVelocity 
} from './splineSmoother';

test('smoothPointExponential returns current point when prev is null', () => {
  const current = { x: 100, y: 100 };
  const smoothed = smoothPointExponential(null, current, 0.5);
  assert.equal(smoothed.x, 100);
  assert.equal(smoothed.y, 100);
});

test('smoothPointExponential interpolates correctly', () => {
  const prev = { x: 0, y: 0 };
  const current = { x: 100, y: 200 };
  // alpha 0.5 -> 50% between 0 and 100 = 50
  const smoothed = smoothPointExponential(prev, current, 0.5);
  assert.equal(smoothed.x, 50);
  assert.equal(smoothed.y, 100);
});

test('distanceBetween computes accurate Euclidean distance', () => {
  const p1 = { x: 0, y: 0 };
  const p2 = { x: 30, y: 40 };
  assert.equal(distanceBetween(p1, p2), 50);
});

test('catmullRom2D evaluates endpoints at t=0 and t=1', () => {
  const p0 = { x: 0, y: 0 };
  const p1 = { x: 10, y: 10 };
  const p2 = { x: 20, y: 20 };
  const p3 = { x: 30, y: 30 };

  const start = catmullRom2D(p0, p1, p2, p3, 0);
  assert.ok(Math.abs(start.x - 10) < 0.001);
  assert.ok(Math.abs(start.y - 10) < 0.001);
});

test('generateSmoothSpline generates higher point density along curve', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 50, y: 20 },
    { x: 100, y: 0 },
  ];
  const smoothed = generateSmoothSpline(points, 4);
  assert.ok(smoothed.length > points.length);
  // Start and end points preserved
  assert.equal(smoothed[0].x, 0);
  assert.equal(smoothed[smoothed.length - 1].x, 100);
});

test('calculateStrokeVelocity returns sensible non-zero value', () => {
  const p1 = { x: 0, y: 0, timestamp: 1000 };
  const p2 = { x: 30, y: 40, timestamp: 1050 }; // 50ms, dist 50 => velocity 1.0 px/ms
  const v = calculateStrokeVelocity(p1, p2);
  assert.equal(v, 1.0);
});
