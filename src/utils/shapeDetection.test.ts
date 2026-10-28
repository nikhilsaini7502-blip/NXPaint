import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateCentroid, 
  getBoundingBox, 
  isClosedLoop, 
  detectCircle, 
  detectRectangle,
  recognizeShape 
} from './shapeDetection';
import { Point } from '../types/airdraw';

test('calculateCentroid returns correct center', () => {
  const points: Point[] = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];
  const center = calculateCentroid(points);
  assert.equal(center.x, 50);
  assert.equal(center.y, 50);
});

test('getBoundingBox calculates accurate min/max dimensions', () => {
  const points: Point[] = [
    { x: 10, y: 20 },
    { x: 80, y: 100 },
    { x: 50, y: 60 },
  ];
  const bbox = getBoundingBox(points);
  assert.equal(bbox.minX, 10);
  assert.equal(bbox.maxX, 80);
  assert.equal(bbox.width, 70);
  assert.equal(bbox.minY, 20);
  assert.equal(bbox.maxY, 100);
  assert.equal(bbox.height, 80);
});

test('detectCircle identifies circular points and snaps clean circle', () => {
  // Generate points on a circle with radius 50 at (100, 100) with slight jitter
  const circlePoints: Point[] = [];
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const jitter = (Math.sin(i * 3) * 2);
    circlePoints.push({
      x: 100 + Math.cos(angle) * (50 + jitter),
      y: 100 + Math.sin(angle) * (50 + jitter),
    });
  }

  const detected = detectCircle(circlePoints);
  assert.ok(detected !== null);
  assert.equal(detected?.type, 'circle');
  assert.ok(detected?.confidence > 0.8);
});

test('recognizeShape detects rectangle on closed 4-corner box', () => {
  const boxPoints: Point[] = [
    { x: 50, y: 50 },
    { x: 150, y: 50 },
    { x: 150, y: 150 },
    { x: 50, y: 150 },
    { x: 50, y: 50 },
  ];
  // Subdivide to have enough points
  const densePoints: Point[] = [];
  for (let i = 0; i < boxPoints.length - 1; i++) {
    for (let k = 0; k < 4; k++) {
      const t = k / 4;
      densePoints.push({
        x: boxPoints[i].x * (1 - t) + boxPoints[i + 1].x * t,
        y: boxPoints[i].y * (1 - t) + boxPoints[i + 1].y * t,
      });
    }
  }
  densePoints.push(boxPoints[0]);

  const rect = detectRectangle(densePoints);
  assert.ok(rect !== null);
  assert.equal(rect?.type, 'rectangle');
});
