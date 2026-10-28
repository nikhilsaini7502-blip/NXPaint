import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandDetectionResult, BackdropMode, HandLandmark } from '../types/airdraw';
import { processHandLandmarks } from '../utils/gestureRecognition';
import { TrackingSettings } from '../utils/sensitivityConfig';
import { Camera, CameraOff, Sparkles, RefreshCw, AlertCircle, MousePointer } from 'lucide-react';

interface CameraStreamProps {
  onHandDetected: (result: HandDetectionResult | null) => void;
  backdropMode: BackdropMode;
  showSkeleton: boolean;
  mirror: boolean;
  isSimulated: boolean;
  setIsSimulated: (sim: boolean) => void;
  trackingSettings?: TrackingSettings;
}

// Connections between hand landmarks for skeleton rendering
const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [5, 9], [9, 13], [13, 17]
];

export const CameraStream: React.FC<CameraStreamProps> = ({
  onHandDetected,
  backdropMode,
  showSkeleton,
  mirror,
  isSimulated,
  setIsSimulated,
  trackingSettings,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const skeletonCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const trackingSettingsRef = useRef<TrackingSettings | undefined>(trackingSettings);
  trackingSettingsRef.current = trackingSettings;

  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasCameraStream, setHasCameraStream] = useState(false);
  const [fps, setFps] = useState(0);

  // Initialize MediaPipe HandLandmarker
  useEffect(() => {
    let isMounted = true;

    async function setupHandLandmarker() {
      try {
        setIsLoading(true);
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (!isMounted) return;

        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (isMounted) {
          landmarkerRef.current = landmarker;
          setIsLoading(false);
        }
      } catch (err: unknown) {
        console.warn('Failed to initialize GPU/MediaPipe task vision. Falling back to CPU/Simulated Mode:', err);
        if (isMounted) {
          setIsLoading(false);
          setIsSimulated(true);
        }
      }
    }

    setupHandLandmarker();

    return () => {
      isMounted = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, [setIsSimulated]);

  // Request Webcam Access
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setHasCameraStream(true);
        };
      }
    } catch (err: unknown) {
      const e = err as Error;
      console.warn('Webcam stream unavailable:', e.message);
      setCameraError(e.message || 'Webcam permission denied or camera not found');
      setHasCameraStream(false);
      setIsSimulated(true);
    }
  }, [setIsSimulated]);

  useEffect(() => {
    if (!isSimulated) {
      startCamera();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
        setHasCameraStream(false);
      }
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isSimulated, startCamera]);

  // Main Detection and Skeleton Render Loop
  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const renderLoop = () => {
      const now = performance.now();
      frameCount++;
      if (now - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = now;
      }

      const canvas = skeletonCanvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // REAL WEBCAM DETECTION
        if (
          !isSimulated &&
          landmarkerRef.current &&
          videoRef.current &&
          videoRef.current.readyState >= 2 &&
          videoRef.current.videoWidth > 0
        ) {
          const video = videoRef.current;
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          const detection = landmarkerRef.current.detectForVideo(video, now);

          if (detection && detection.landmarks && detection.landmarks.length > 0) {
            const rawLandmarks = detection.landmarks[0] as HandLandmark[];
            const processed = processHandLandmarks(
              rawLandmarks,
              canvas.width,
              canvas.height,
              mirror,
              trackingSettingsRef.current
            );

            onHandDetected(processed);

            if (showSkeleton) {
              drawHologramSkeleton(ctx, rawLandmarks, canvas.width, canvas.height, mirror, processed.gesture);
            }
          } else {
            onHandDetected(null);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isSimulated, mirror, showSkeleton, onHandDetected]);

  // Holographic Cyberpunk Hand Skeleton Renderer
  const drawHologramSkeleton = (
    ctx: CanvasRenderingContext2D,
    landmarks: HandLandmark[],
    width: number,
    height: number,
    isMirrored: boolean,
    gesture: string
  ) => {
    ctx.save();

    // Pick glowing color based on gesture state
    let glowColor = '#00F0FF'; // Cyber cyan default
    if (gesture === 'DRAW') glowColor = '#39FF14'; // Neon Green
    if (gesture === 'PINCH') glowColor = '#FFE600'; // Solar Yellow
    if (gesture === 'FIST_ERASE') glowColor = '#FF0055'; // Neon Pink / Red
    if (gesture === 'SELECT') glowColor = '#B026FF'; // Electric Purple

    // Transform points
    const pts = landmarks.map((lm) => ({
      x: (isMirrored ? 1 - lm.x : lm.x) * width,
      y: lm.y * height,
    }));

    // Draw cyber connections
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12;

    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = pts[startIdx];
      const p2 = pts[endIdx];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    // Draw glowing joint rings and nodes
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const isTip = [4, 8, 12, 16, 20].includes(i);
      const isIndexTip = i === 8;

      ctx.beginPath();
      ctx.arc(p.x, p.y, isIndexTip ? 7 : isTip ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = isIndexTip ? '#FFFFFF' : glowColor;
      ctx.shadowBlur = isIndexTip ? 20 : 8;
      ctx.fill();

      // Outer targeting pulse on index tip
      if (isIndexTip) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    ctx.restore();
  };

  // Determine backdrop visual style
  const getBackdropClass = () => {
    switch (backdropMode) {
      case 'hologram':
        return 'bg-gradient-to-br from-slate-950 via-cyan-950/20 to-black';
      case 'dark':
        return 'bg-neutral-950';
      case 'whiteboard':
        return 'bg-neutral-100';
      case 'grid':
        return 'bg-neutral-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]';
      case 'webcam':
      default:
        return 'bg-black';
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${getBackdropClass()}`}>
      {/* Real Webcam Video Stream */}
      {!isSimulated && (
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-500 ${
            mirror ? '-scale-x-100' : ''
          } ${
            backdropMode === 'webcam'
              ? 'opacity-90'
              : backdropMode === 'hologram'
              ? 'opacity-25 mix-blend-screen filter contrast-125'
              : 'opacity-0'
          }`}
        />
      )}

      {/* Hologram Skeleton Overlay Canvas */}
      <canvas
        ref={skeletonCanvasRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-cyan-400">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <Sparkles className="absolute inset-0 m-auto w-5 h-5 animate-pulse" />
          </div>
          <div className="font-mono text-sm tracking-wider uppercase">
            Initializing Vision Neural Engine...
          </div>
        </div>
      )}
    </div>
  );
};
