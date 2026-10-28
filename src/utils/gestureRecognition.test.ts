import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  getLandmarkDistance, 
  classifyGesture, 
  processHandLandmarks 
} from './gestureRecognition';
import { HandLandmark } from '../types/airdraw';

// Helper to construct a synthetic 21-landmark hand
function createHand(overrides: Partial<Record<number, Partial<HandLandmark>>> = {}): HandLandmark[] {
  const landmarks: HandLandmark[] = [];
  for (let i = 0; i < 21; i++) {
    // Base position around palm
    landmarks.push({ x: 0.5, y: 0.8 - (i % 4) * 0.1, z: 0 });
  }
  // Set wrist at 0
  landmarks[0] = { x: 0.5, y: 0.9, z: 0 };
  
  // MCP joints: 1, 5, 9, 13, 17
  landmarks[5] = { x: 0.45, y: 0.6, z: 0 };
  landmarks[6] = { x: 0.45, y: 0.5, z: 0 };
  landmarks[7] = { x: 0.45, y: 0.4, z: 0 };
  landmarks[8] = { x: 0.45, y: 0.3, z: 0 }; // Index Tip

  landmarks[9] = { x: 0.5, y: 0.6, z: 0 };
  landmarks[10] = { x: 0.5, y: 0.5, z: 0 };
  landmarks[11] = { x: 0.5, y: 0.4, z: 0 };
  landmarks[12] = { x: 0.5, y: 0.7, z: 0 }; // Middle folded by default

  landmarks[13] = { x: 0.55, y: 0.6, z: 0 };
  landmarks[14] = { x: 0.55, y: 0.5, z: 0 };
  landmarks[15] = { x: 0.55, y: 0.4, z: 0 };
  landmarks[16] = { x: 0.55, y: 0.7, z: 0 }; // Ring folded by default

  landmarks[17] = { x: 0.6, y: 0.6, z: 0 };
  landmarks[18] = { x: 0.6, y: 0.5, z: 0 };
  landmarks[19] = { x: 0.6, y: 0.4, z: 0 };
  landmarks[20] = { x: 0.6, y: 0.7, z: 0 }; // Pinky folded by default

  // Thumb
  landmarks[2] = { x: 0.4, y: 0.7, z: 0 };
  landmarks[3] = { x: 0.38, y: 0.65, z: 0 };
  landmarks[4] = { x: 0.35, y: 0.6, z: 0 }; // Thumb tip far from index tip

  for (const [key, val] of Object.entries(overrides)) {
    const idx = Number(key);
    landmarks[idx] = { ...landmarks[idx], ...val };
  }

  return landmarks;
}

test('getLandmarkDistance returns correct 3D distance', () => {
  const p1 = { x: 0, y: 0, z: 0 };
  const p2 = { x: 0, y: 3, z: 4 };
  assert.equal(getLandmarkDistance(p1, p2), 5);
});

test('classifyGesture detects DRAW when only index is extended', () => {
  const hand = createHand();
  const { gesture } = classifyGesture(hand);
  assert.equal(gesture, 'DRAW');
});

test('classifyGesture detects SELECT when index and middle are extended (V-sign)', () => {
  const hand = createHand({
    12: { x: 0.5, y: 0.3, z: 0 }, // Middle tip extended
  });
  const { gesture } = classifyGesture(hand);
  assert.equal(gesture, 'SELECT');
});

test('classifyGesture detects OPEN_PALM when all fingers are extended (Sleep / Pause trigger)', () => {
  const hand = createHand({
    12: { x: 0.5, y: 0.3, z: 0 },  // Middle extended
    16: { x: 0.55, y: 0.3, z: 0 }, // Ring extended
    20: { x: 0.6, y: 0.3, z: 0 },  // Pinky extended
  });
  const { gesture } = classifyGesture(hand);
  assert.equal(gesture, 'OPEN_PALM');
});

test('classifyGesture detects FIST_ERASE when all fingers are folded', () => {
  const hand = createHand({
    8: { x: 0.45, y: 0.7, z: 0 }, // Fold index tip down
  });
  const { gesture } = classifyGesture(hand);
  assert.equal(gesture, 'FIST_ERASE');
});

test('processHandLandmarks mirrors coordinates properly', () => {
  const hand = createHand({
    8: { x: 0.2, y: 0.4, z: 0 },
  });
  const result = processHandLandmarks(hand, 1000, 1000, true);
  // Mirror 0.2 -> 1 - 0.2 = 0.8 * 1000 = 800
  assert.equal(result.cursorPos.x, 800);
  assert.equal(result.cursorPos.y, 400);
});
