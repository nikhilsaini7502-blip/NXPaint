export interface Point {
  x: number;
  y: number;
  z?: number;
  pressure?: number;
  timestamp?: number;
}

export type BrushType = 
  | 'neon'
  | 'calligraphy'
  | 'rainbow'
  | 'fire'
  | 'stardust'
  | 'highlighter'
  | 'laser';

export type ToolMode = 'draw' | 'eraser' | 'select' | 'laser';

export type BackdropMode = 'webcam' | 'hologram' | 'dark' | 'whiteboard' | 'grid';

export interface DrawingLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  colorTag?: string;
  createdAt: number;
}

export interface Stroke {
  id: string;
  layerId: string;
  points: Point[];
  color: string;
  size: number;
  brushType: BrushType;
  isShape?: boolean;
  shapeType?: 'circle' | 'rectangle' | 'triangle' | 'star' | 'arrow';
  timestamp: number;
}

export type HandGesture = 
  | 'DRAW'          // Index finger pointing up alone
  | 'SELECT'        // Index + Middle finger up (Peace sign / V)
  | 'FIST_ERASE'    // All fingers folded into a fist
  | 'OPEN_PALM'     // All 5 fingers extended (Sleep / Pause trigger)
  | 'THUMBS_UP'     // Thumbs up gesture (Start / Wake trigger)
  | 'NONE';

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandDetectionResult {
  landmarks: HandLandmark[];
  handedness?: 'Left' | 'Right';
  score?: number;
  gesture: HandGesture;
  cursorPos: { x: number; y: number };
  isPinching: boolean;
  pinchDistance: number;
  fingersExtended: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
  isPenDown?: boolean;
  rawZ?: number;
}

export interface ShapeCandidate {
  type: 'circle' | 'rectangle' | 'triangle' | 'star' | 'arrow';
  confidence: number;
  points: Point[];
}
