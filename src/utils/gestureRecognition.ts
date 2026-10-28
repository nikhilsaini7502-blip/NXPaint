import { HandLandmark, HandGesture, HandDetectionResult } from '../types/airdraw';
import { TrackingSettings, classifyGestureSensitively, detectFingersWithSensitivity } from './sensitivityConfig';

/**
 * Calculates Euclidean distance between two 3D landmarks
 */
export function getLandmarkDistance(p1: HandLandmark, p2: HandLandmark): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = (p2.z || 0) - (p1.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Checks whether each finger is extended based on joint positions
 */
export function detectFingersExtended(landmarks: HandLandmark[]) {
  if (landmarks.length < 21) {
    return { thumb: false, index: false, middle: false, ring: false, pinky: false };
  }

  const wrist = landmarks[0];

  // For Index, Middle, Ring, Pinky: tip must be farther from wrist than PIP joint
  // and tip.y should be above PIP.y in standard upright hand view
  const isExtended = (tipIdx: number, pipIdx: number, mcpIdx: number) => {
    const tip = landmarks[tipIdx];
    const pip = landmarks[pipIdx];
    const mcp = landmarks[mcpIdx];
    
    const distTipWrist = getLandmarkDistance(tip, wrist);
    const distPipWrist = getLandmarkDistance(pip, wrist);
    const distMcpWrist = getLandmarkDistance(mcp, wrist);

    // Tip is farther from wrist than PIP joint and MCP joint
    const fartherFromWrist = distTipWrist > distPipWrist && distPipWrist > distMcpWrist;
    // Tip y is higher (smaller y) than PIP in video coordinates
    const abovePip = tip.y < pip.y;

    return fartherFromWrist || (abovePip && distTipWrist > distPipWrist * 0.95);
  };

  const indexExtended = isExtended(8, 6, 5);
  const middleExtended = isExtended(12, 10, 9);
  const ringExtended = isExtended(16, 14, 13);
  const pinkyExtended = isExtended(20, 18, 17);

  // Thumb: check distance of thumb tip (4) from index MCP (5) and pinky MCP (17)
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const thumbMcp = landmarks[2];
  const thumbExtended = getLandmarkDistance(thumbTip, landmarks[17]) > getLandmarkDistance(thumbIp, landmarks[17]) * 1.15;

  return {
    thumb: thumbExtended,
    index: indexExtended,
    middle: middleExtended,
    ring: ringExtended,
    pinky: pinkyExtended,
  };
}

/**
 * Classifies the hand pose into a clear, actionable AirDraw gesture
 */
export function classifyGesture(landmarks: HandLandmark[]): {
  gesture: HandGesture;
} {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: 'NONE' };
  }

  const thumbTip = landmarks[4];
  const fingers = detectFingersExtended(landmarks);

  // 1. FIST (All 4 fingers index, middle, ring, pinky folded) -> Instant Eraser!
  if (!fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
    // Check if thumb is extended upwards alone -> THUMBS_UP (Start/Wake)
    if (fingers.thumb && thumbTip.y < landmarks[2].y) {
      return { gesture: 'THUMBS_UP' };
    }
    return { gesture: 'FIST_ERASE' };
  }

  // 2. OPEN PALM (All 5 or 4 fingers spread open) -> STOP / SLEEP MODE trigger!
  if (fingers.index && fingers.middle && fingers.ring && fingers.pinky) {
    return { gesture: 'OPEN_PALM' };
  }

  // 3. SELECT (Peace / V sign: Index and Middle extended, Ring and Pinky folded)
  if (fingers.index && fingers.middle && !fingers.ring && !fingers.pinky) {
    return { gesture: 'SELECT' };
  }

  // 4. DRAW (Index extended, Middle, Ring, Pinky folded) -> Mid-air drawing!
  if (fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
    return { gesture: 'DRAW' };
  }

  // Default fallback if index is extended and others not spread
  if (fingers.index && !fingers.ring && !fingers.pinky) {
    return { gesture: 'DRAW' };
  }

  return { gesture: 'NONE' };
}

/**
 * Parses raw landmarks into an augmented detection result with optional sensitivity settings
 */
export function processHandLandmarks(
  landmarks: HandLandmark[],
  videoWidth: number = 1280,
  videoHeight: number = 720,
  mirror: boolean = true,
  settings?: TrackingSettings
): HandDetectionResult {
  let gesture: HandGesture;
  let isPenDown = true;
  let fingers = detectFingersExtended(landmarks);

  if (settings) {
    const classification = classifyGestureSensitively(landmarks, settings);
    gesture = classification.gesture;
    isPenDown = classification.isPenDown;
    fingers = detectFingersWithSensitivity(landmarks, settings.sensitivity);
  } else {
    gesture = classifyGesture(landmarks).gesture;
  }

  // Cursor is the index fingertip (landmark 8)
  const targetLandmark = landmarks[8] || { x: 0.5, y: 0.5, z: 0 };

  // Mirror x coordinate so moving right on camera moves right on screen
  const normX = mirror ? 1 - targetLandmark.x : targetLandmark.x;
  const normY = targetLandmark.y;

  return {
    landmarks,
    gesture,
    cursorPos: {
      x: normX * videoWidth,
      y: normY * videoHeight,
    },
    isPinching: false,
    pinchDistance: 1,
    fingersExtended: fingers,
    isPenDown,
    rawZ: targetLandmark.z,
  };
}
