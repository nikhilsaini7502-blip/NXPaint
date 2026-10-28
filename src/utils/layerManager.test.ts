import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultLayers,
  canDrawOnLayer,
  addLayer,
  removeLayer,
  toggleLayerVisibility,
  toggleLayerLock,
  setLayerOpacity,
  renameLayer,
  moveLayer,
  duplicateLayer,
  mergeLayerDown,
} from './layerManager';
import { Stroke } from '../types/airdraw';

test('createDefaultLayers initializes 3 preset layers with top active', () => {
  const { layers, activeLayerId } = createDefaultLayers();
  assert.equal(layers.length, 3);
  assert.equal(activeLayerId, layers[2].id);
  assert.equal(layers[0].name, 'Draft Sketch');
  assert.equal(layers[1].name, 'Line Art');
  assert.equal(layers[2].name, 'Neon Glow FX');
});

test('canDrawOnLayer checks both visibility and lock state', () => {
  const layer = {
    id: 'l1',
    name: 'Test',
    visible: true,
    locked: false,
    opacity: 1,
    createdAt: 0,
  };

  assert.equal(canDrawOnLayer(layer), true);
  assert.equal(canDrawOnLayer({ ...layer, locked: true }), false);
  assert.equal(canDrawOnLayer({ ...layer, visible: false }), false);
  assert.equal(canDrawOnLayer(undefined), false);
});

test('toggleLayerVisibility and toggleLayerLock work correctly', () => {
  const { layers } = createDefaultLayers();
  const id = layers[0].id;

  const toggledVis = toggleLayerVisibility(layers, id);
  assert.equal(toggledVis[0].visible, false);

  const toggledLock = toggleLayerLock(layers, id);
  assert.equal(toggledLock[0].locked, true);
});

test('setLayerOpacity clamps opacity values between 0.05 and 1.0', () => {
  const { layers } = createDefaultLayers();
  const id = layers[0].id;

  const clampedLow = setLayerOpacity(layers, id, -0.5);
  assert.equal(clampedLow[0].opacity, 0.05);

  const clampedHigh = setLayerOpacity(layers, id, 1.8);
  assert.equal(clampedHigh[0].opacity, 1.0);

  const normal = setLayerOpacity(layers, id, 0.45);
  assert.equal(normal[0].opacity, 0.45);
});

test('moveLayer shifts layer order', () => {
  const { layers } = createDefaultLayers();
  // Move index 0 up to index 1
  const moved = moveLayer(layers, 0, 'up');
  assert.equal(moved[1].name, 'Draft Sketch');
});

test('duplicateLayer clones layer and its associated strokes', () => {
  const { layers } = createDefaultLayers();
  const testStroke: Stroke = {
    id: 's1',
    layerId: layers[0].id,
    points: [{ x: 10, y: 10 }],
    color: '#00F0FF',
    size: 5,
    brushType: 'neon',
    timestamp: 0,
  };

  const { updatedLayers, updatedStrokes, newLayerId } = duplicateLayer(
    layers,
    [testStroke],
    layers[0].id
  );

  assert.equal(updatedLayers.length, 4);
  assert.equal(updatedStrokes.length, 2);
  const clonedStroke = updatedStrokes.find((s) => s.layerId === newLayerId);
  assert.ok(clonedStroke !== undefined);
  assert.notEqual(clonedStroke?.id, 's1');
});

test('mergeLayerDown merges strokes into lower layer', () => {
  const { layers } = createDefaultLayers();
  const strokeUpper: Stroke = {
    id: 's2',
    layerId: layers[1].id,
    points: [{ x: 20, y: 20 }],
    color: '#FF0055',
    size: 10,
    brushType: 'laser',
    timestamp: 0,
  };

  const result = mergeLayerDown(layers, [strokeUpper], layers[1].id);
  assert.ok(result !== null);
  assert.equal(result?.updatedLayers.length, 2);
  assert.equal(result?.updatedStrokes[0].layerId, layers[0].id);
});
