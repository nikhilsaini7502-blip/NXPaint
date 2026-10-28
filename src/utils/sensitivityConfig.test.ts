import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSmoothingAlpha,
  isFingerExtendedSensitively,
  detectFingersWithSensitivity,
  classifyGestureSensitively,
  DEFAULT_TRACKING_SETTINGS,
} from './sensitivityConfig';
import { HandLandmark } from '../types/airdraw';

function createHand(overrides: Partial<Record<number, Partial<HandLandmark>>> = {}): HandLandmark[] {
  const landmarks: HandLandmark[] = [];
  for (let i = 0; i < 21; i++) {
    landmarks.push({ x: 0.5, y: 0.8 - (i % 4) * 0.1, z: 0 });
  }
  landmarks[0] = { x: 0.5, y: 0.9, z: 0 };
  landmarks[5] = { x: 0.45, y: 0.6, z: 0 };
  landmarks[6] = { x: 0.45, y: 0.5, z: 0 };
  landmarks[7] = { x: 0.45, y: 0.4, z: 0 };
  landmarks[8] = { x: 0.45, y: 0.3, z: 0 }; // Index extended

  landmarks[9] = { x: 0.5, y: 0.6, z: 0 };
  landmarks[10] = { x: 0.5, y: 0.5, z: 0 };
  landmarks[11] = { x: 0.5, y: 0.4, z: 0 };
  landmarks[12] = { x: 0.5, y: 0.7, z: 0 }; // Middle folded

  landmarks[13] = { x: 0.55, y: 0.6, z: 0 };
  landmarks[14] = { x: 0.55, y: 0.5, z: 0 };
  landmarks[15] = { x: 0.55, y: 0.4, z: 0 };
  landmarks[16] = { x: 0.55, y: 0.7, z: 0 }; // Ring folded

  landmarks[17] = { x: 0.6, y: 0.6, z: 0 };
  landmarks[18] = { x: 0.6, y: 0.5, z: 0 };
  landmarks[19] = { x: 0.6, y: 0.4, z: 0 };
  landmarks[20] = { x: 0.6, y: 0.7, z: 0 }; // Pinky folded

  landmarks[2] = { x: 0.4, y: 0.7, z: 0 };
  landmarks[3] = { x: 0.38, y: 0.65, z: 0 };
  landmarks[4] = { x: 0.35, y: 0.6, z: 0 }; // Thumb

  for (const [key, val] of Object.entries(overrides)) {
    const idx = Number(key);
    landmarks[idx] = { ...landmarks[idx], ...val };
  }

  return landmarks;
}

test('calculateSmoothingAlpha maps smoothing slider to proper alpha range', () => {
  // Low smoothing (0.1) -> high alpha (near 0.94, instantaneous)
  const alphaLow = calculateSmoothingAlpha(0.1);
  assert.ok(alphaLow > 0.9);

  // High smoothing (1.0) -> low alpha (0.4, buttery smooth)
  const alphaHigh = calculateSmoothingAlpha(1.0);
  assert.ok(alphaHigh <= 0.45);
});

test('classifyGestureSensitively identifies DRAW with index finger', () => {
  const hand = createHand();
  const { gesture, isPenDown } = classifyGestureSensitively(hand, DEFAULT_TRACKING_SETTINGS);
  assert.equal(gesture, 'DRAW');
  assert.equal(isPenDown, true);
});

test('classifyGestureSensitively honors depth push-to-write trigger', () => {
  const settingsWithDepth = {
    ...DEFAULT_TRACKING_SETTINGS,
    depthTrigger: true,
    depthThreshold: -0.05,
  };

  // Hand not pushed forward (z = 0 > -0.05) -> Pen is UP (not drawing)
  const handResting = createHand({
    8: { x: 0.45, y: 0.3, z: 0.02 },
  });
  const resResting = classifyGestureSensitively(handResting, settingsWithDepth);
  assert.equal(resResting.gesture, 'DRAW');
  assert.equal(resResting.isPenDown, false);

  // Hand pushed forward (z = -0.10 < -0.05) -> Pen is DOWN (drawing!)
  const handPushed = createHand({
    8: { x: 0.45, y: 0.3, z: -0.10 },
  });
  const resPushed = classifyGestureSensitively(handPushed, settingsWithDepth);
  assert.equal(resPushed.gesture, 'DRAW');
  assert.equal(resPushed.isPenDown, true);
});
