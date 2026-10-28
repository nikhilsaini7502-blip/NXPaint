import test from 'node:test';
import assert from 'node:assert/strict';
import { distanceToSegment, eraseSingleStroke, eraseStrokes } from './strokeEraser';
import { Stroke } from '../types/airdraw';

test('distanceToSegment accurately computes perpendicular distance', () => {
  // Line segment from (0, 0) to (100, 0)
  // Point at (50, 20) -> distance should be 20
  const result = distanceToSegment(50, 20, 0, 0, 100, 0);
  assert.equal(result.distance, 20);
  assert.equal(result.closestX, 50);
  assert.equal(result.closestY, 0);
});

test('distanceToSegment clamps to endpoints outside segment', () => {
  // Point at (-10, 0) relative to (0, 0) -> (100, 0)
  const result = distanceToSegment(-10, 0, 0, 0, 100, 0);
  assert.equal(result.distance, 10);
  assert.equal(result.closestX, 0);
});

test('eraseSingleStroke splits a line into two strokes when erased from the middle', () => {
  // Horizontal line with 11 points from x=0 to x=100 at y=50
  const points = [];
  for (let x = 0; x <= 100; x += 10) {
    points.push({ x, y: 50 });
  }

  const stroke: Stroke = {
    id: 'test-stroke',
    layerId: 'layer-1',
    points,
    color: '#00F0FF',
    size: 5,
    brushType: 'neon',
    timestamp: 0,
  };

  // Erase at (50, 50) with radius 15 (covers x=40, 50, 60)
  const result = eraseSingleStroke(stroke, 50, 50, 15);

  // Must yield TWO separate strokes!
  assert.equal(result.length, 2);

  // First stroke should contain points x=0, 10, 20, 30
  assert.equal(result[0].points[0].x, 0);
  assert.equal(result[0].points[result[0].points.length - 1].x, 30);

  // Second stroke should contain points x=70, 80, 90, 100
  assert.equal(result[1].points[0].x, 70);
  assert.equal(result[1].points[result[1].points.length - 1].x, 100);
});

test('eraseSingleStroke completely removes stroke if entirely inside radius', () => {
  const points = [
    { x: 45, y: 50 },
    { x: 50, y: 50 },
    { x: 55, y: 50 },
  ];

  const stroke: Stroke = {
    id: 'small-stroke',
    layerId: 'layer-1',
    points,
    color: '#00F0FF',
    size: 5,
    brushType: 'neon',
    timestamp: 0,
  };

  const result = eraseSingleStroke(stroke, 50, 50, 20);
  assert.equal(result.length, 0);
});

test('eraseStrokes respects locked and hidden layers', () => {
  const strokeA: Stroke = {
    id: 's-locked',
    layerId: 'layer-locked',
    points: [{ x: 45, y: 50 }, { x: 55, y: 50 }],
    color: '#00F0FF',
    size: 5,
    brushType: 'neon',
    timestamp: 0,
  };

  const strokeB: Stroke = {
    id: 's-unlocked',
    layerId: 'layer-unlocked',
    points: [{ x: 45, y: 50 }, { x: 55, y: 50 }],
    color: '#FF0055',
    size: 5,
    brushType: 'neon',
    timestamp: 0,
  };

  const erasableLayers = new Set(['layer-unlocked']);
  const { updatedStrokes, erasedAny } = eraseStrokes(
    [strokeA, strokeB],
    erasableLayers,
    50,
    50,
    20
  );

  assert.equal(erasedAny, true);
  // strokeA must still exist untouched
  assert.equal(updatedStrokes.length, 1);
  assert.equal(updatedStrokes[0].id, 's-locked');
});
