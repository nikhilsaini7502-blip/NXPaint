import { HandLandmark, HandGesture, HandDetectionResult } from '../types/airdraw';
import { getLandmarkDistance } from './gestureRecognition';

export interface TrackingSettings {
  sensitivity: number; // 0.2 (strict) to 1.0 (loose/forgiving), default 0.6
  smoothing: number; // 0.1 (raw/instant) to 1.0 (ultra-silky), default 0.75
  depthTrigger: boolean; // push-to-write depth trigger
  depthThreshold: number; // z-depth for pen down
  minMoveDistance: number; // minimum distance in px to append point
}

export const DEFAULT_TRACKING_SETTINGS: TrackingSettings = {
  sensitivity: 0.6,
  smoothing: 0.75,
  depthTrigger: false,
  depthThreshold: -0.05,
  minMoveDistance: 3,
};

/**
 * Calculates exponential moving average alpha from the smoothing slider
 * Higher smoothing = lower alpha (more history weight = silky lines)
 * Lower smoothing = higher alpha (instantaneous tracking)
 */
export function calculateSmoothingAlpha(smoothing: number): number {
  const clamped = Math.max(0.1, Math.min(1.0, smoothing));
  // Map 0.1..1.0 -> alpha 0.95 (instant) down to 0.40 (buttery smooth)
  return 1.0 - clamped * 0.6;
}

/**
 * Checks finger extension scaled by sensitivity threshold.
 * Higher sensitivity requires less extension to trigger; lower requires fully straight finger.
 */
export function isFingerExtendedSensitively(
  landmarks: HandLandmark[],
  tipIdx: number,
  pipIdx: number,
  mcpIdx: number,
  sensitivity: number = 0.6
): boolean {
  if (landmarks.length < 21) return false;
  const wrist = landmarks[0];
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  const mcp = landmarks[mcpIdx];

  const distTipWrist = getLandmarkDistance(tip, wrist);
  const distPipWrist = getLandmarkDistance(pip, wrist);
  const distMcpWrist = getLandmarkDistance(mcp, wrist);

  // Scaled factor based on sensitivity:
  // sensitivity 1.0 -> factor 0.85 (very loose, easy to trigger)
  // sensitivity 0.2 -> factor 1.15 (strict, requires fully extended straight finger)
  const factor = 1.25 - sensitivity * 0.4;

  const extendedFromWrist = distTipWrist > distPipWrist * factor && distPipWrist > distMcpWrist;
  const abovePip = tip.y < pip.y * (1 + (1 - sensitivity) * 0.05);

  return extendedFromWrist || (abovePip && distTipWrist > distPipWrist * 0.9);
}

/**
 * Detects all 5 finger states applying the configurable sensitivity
 */
export function detectFingersWithSensitivity(
  landmarks: HandLandmark[],
  sensitivity: number = 0.6
) {
  if (landmarks.length < 21) {
    return { thumb: false, index: false, middle: false, ring: false, pinky: false };
  }

  const index = isFingerExtendedSensitively(landmarks, 8, 6, 5, sensitivity);
  const middle = isFingerExtendedSensitively(landmarks, 12, 10, 9, sensitivity);
  const ring = isFingerExtendedSensitively(landmarks, 16, 14, 13, sensitivity);
  const pinky = isFingerExtendedSensitively(landmarks, 20, 18, 17, sensitivity);

  // Thumb
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const thumbThreshold = 1.3 - sensitivity * 0.25;
  const thumb = getLandmarkDistance(thumbTip, landmarks[17]) > getLandmarkDistance(thumbIp, landmarks[17]) * thumbThreshold;

  return { thumb, index, middle, ring, pinky };
}

/**
 * Classifies gesture with sensitivity and optional depth/push-to-write trigger
 */
export function classifyGestureSensitively(
  landmarks: HandLandmark[],
  settings: TrackingSettings = DEFAULT_TRACKING_SETTINGS
): { gesture: HandGesture; isPenDown: boolean } {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: 'NONE', isPenDown: false };
  }

  const fingers = detectFingersWithSensitivity(landmarks, settings.sensitivity);
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  // Check Depth / Push-to-Write if enabled
  // Landmark z is negative when closer to the camera
  let isPenDown = true;
  if (settings.depthTrigger && indexTip.z !== undefined) {
    // If fingertip is pushed forward beyond threshold
    isPenDown = indexTip.z < settings.depthThreshold;
  }

  // 1. FIST ERASER (All primary fingers folded)
  if (!fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
    if (fingers.thumb && thumbTip.y < landmarks[2].y) {
      return { gesture: 'THUMBS_UP', isPenDown: false };
    }
    return { gesture: 'FIST_ERASE', isPenDown: false };
  }

  // 2. OPEN PALM (All 4-5 fingers extended) -> Sleep / Stop trigger
  if (fingers.index && fingers.middle && fingers.ring && fingers.pinky) {
    return { gesture: 'OPEN_PALM', isPenDown: false };
  }

  // 3. PEACE SIGN (Index + Middle extended alone) -> Hover / Select
  if (fingers.index && fingers.middle && !fingers.ring && !fingers.pinky) {
    return { gesture: 'SELECT', isPenDown: false };
  }

  // 4. DRAW (Index finger extended alone)
  if (fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
    return { gesture: 'DRAW', isPenDown };
  }

  // Default fallback if index is extended
  if (fingers.index && !fingers.ring && !fingers.pinky) {
    return { gesture: 'DRAW', isPenDown };
  }

  return { gesture: 'NONE', isPenDown: false };
}
