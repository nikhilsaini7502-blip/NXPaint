import React, { useRef, useEffect, useCallback } from 'react';
import { Point, Stroke, BrushType, ToolMode, HandDetectionResult, BackdropMode, DrawingLayer } from '../types/airdraw';
import { smoothPointExponential, generateSmoothSpline, calculateStrokeVelocity } from '../utils/splineSmoother';
import { recognizeShape } from '../utils/shapeDetection';
import { canDrawOnLayer } from '../utils/layerManager';
import { eraseStrokes } from '../utils/strokeEraser';
import { sound } from '../utils/audioFeedback';
import { TrackingSettings, calculateSmoothingAlpha } from '../utils/sensitivityConfig';

interface AirCanvasProps {
  handDetection: HandDetectionResult | null;
  brushType: BrushType;
  brushColor: string;
  brushSize: number;
  toolMode: ToolMode;
  autoSnapShapes: boolean;
  backdropMode: BackdropMode;
  layers: DrawingLayer[];
  activeLayerId: string;
  strokes: Stroke[];
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
  undoStack: Stroke[][];
  setUndoStack: React.Dispatch<React.SetStateAction<Stroke[][]>>;
  redoStack: Stroke[][];
  setRedoStack: React.Dispatch<React.SetStateAction<Stroke[][]>>;
  isPaused: boolean;
  trackingSettings?: TrackingSettings;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export const AirCanvas: React.FC<AirCanvasProps> = ({
  handDetection,
  brushType,
  brushColor,
  brushSize,
  toolMode,
  autoSnapShapes,
  backdropMode,
  layers,
  activeLayerId,
  strokes,
  setStrokes,
  undoStack,
  setUndoStack,
  redoStack,
  setRedoStack,
  isPaused,
  trackingSettings,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync state into refs to avoid closure and dependency cycle issues
  const strokesRef = useRef<Stroke[]>(strokes);
  strokesRef.current = strokes;

  const layersRef = useRef<DrawingLayer[]>(layers);
  layersRef.current = layers;

  const activeLayerIdRef = useRef<string>(activeLayerId);
  activeLayerIdRef.current = activeLayerId;

  const isPausedRef = useRef<boolean>(isPaused);
  isPausedRef.current = isPaused;

  // Active drawing stroke
  const currentStrokeRef = useRef<Point[]>([]);
  const smoothedCursorRef = useRef<Point | null>(null);
  const isDrawingActiveRef = useRef<boolean>(false);
  const isErasingActiveRef = useRef<boolean>(false);
  const particlesRef = useRef<Particle[]>([]);
  const lastGestureRef = useRef<string>('NONE');

  // Push current strokes to undo stack safely
  const pushUndoState = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-40), [...strokesRef.current]]);
    setRedoStack([]); // Clear redo
  }, [setUndoStack, setRedoStack]);

  // Handle Window Resize
  useEffect(() => {
    const handleResize = () => {
      const c = canvasRef.current;
      const pc = particleCanvasRef.current;
      if (c && pc) {
        c.width = window.innerWidth;
        c.height = window.innerHeight;
        pc.width = window.innerWidth;
        pc.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Enhanced Eraser function that cuts lines through the middle and respects layers
  const performErase = useCallback(
    (x: number, y: number, radius: number) => {
      const erasableLayerIds = new Set(
        layersRef.current
          .filter((l) => l.visible && !l.locked)
          .map((l) => l.id)
      );

      setStrokes((prevStrokes) => {
        const { updatedStrokes, erasedAny } = eraseStrokes(
          prevStrokes,
          erasableLayerIds,
          x,
          y,
          radius
        );

        if (erasedAny) {
          // Spawn erasing particle sparks at intersection
          for (let i = 0; i < 4; i++) {
            particlesRef.current.push({
              x: x + (Math.random() - 0.5) * radius,
              y: y + (Math.random() - 0.5) * radius,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              color: '#FF0055',
              size: Math.random() * 3.5 + 1.5,
              alpha: 0.9,
              life: 0,
              maxLife: 20,
            });
          }
          return updatedStrokes;
        }

        return prevStrokes;
      });
    },
    [setStrokes]
  );

  // Spawn brush-specific particle effects
  const spawnBrushParticles = (p: Point, type: BrushType, color: string) => {
    if (type === 'fire') {
      for (let i = 0; i < 2; i++) {
        particlesRef.current.push({
          x: p.x + (Math.random() - 0.5) * 8,
          y: p.y + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 3 - 1,
          color: Math.random() > 0.4 ? '#FF5E00' : '#FFE600',
          size: Math.random() * 5 + 2,
          alpha: 1,
          life: 0,
          maxLife: 30,
        });
      }
    } else if (type === 'stardust') {
      if (Math.random() > 0.5) {
        particlesRef.current.push({
          x: p.x + (Math.random() - 0.5) * 16,
          y: p.y + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          color: '#FFFFFF',
          size: Math.random() * 3 + 1,
          alpha: 1,
          life: 0,
          maxLife: 40,
        });
      }
    } else if (type === 'neon') {
      if (Math.random() > 0.7) {
        particlesRef.current.push({
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          color: color,
          size: Math.random() * 2 + 1,
          alpha: 0.9,
          life: 0,
          maxLife: 25,
        });
      }
    }
  };

  // Finish active stroke and commit to stroke list
  const finishActiveStroke = useCallback(() => {
    isDrawingActiveRef.current = false;
    sound.updateDrawingHum(false);

    const pts = currentStrokeRef.current;
    if (pts.length > 2) {
      const activeLayer = layersRef.current.find((l) => l.id === activeLayerIdRef.current);
      if (!canDrawOnLayer(activeLayer)) {
        currentStrokeRef.current = [];
        return;
      }

      let finalPoints = pts;
      let isShape = false;
      let shapeType: 'circle' | 'rectangle' | 'triangle' | 'star' | 'arrow' | undefined = undefined;

      if (autoSnapShapes) {
        const candidate = recognizeShape(pts);
        if (candidate) {
          finalPoints = candidate.points;
          isShape = true;
          shapeType = candidate.type;
          sound.playShapeSnap();
        }
      }

      const newStroke: Stroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        layerId: activeLayerIdRef.current,
        points: finalPoints,
        color: brushColor,
        size: brushSize,
        brushType,
        isShape,
        shapeType,
        timestamp: Date.now(),
      };

      setStrokes((prev) => [...prev, newStroke]);
    }

    currentStrokeRef.current = [];
  }, [autoSnapShapes, brushColor, brushSize, brushType, setStrokes]);

  // Process Hand Detection Gestures and Drawing Updates
  useEffect(() => {
    if (!handDetection) {
      if (isDrawingActiveRef.current) {
        finishActiveStroke();
      }
      isErasingActiveRef.current = false;
      smoothedCursorRef.current = null;
      sound.updateDrawingHum(false);
      return;
    }

    const { gesture, cursorPos } = handDetection;
    const now = performance.now();

    const rawPoint: Point = {
      x: cursorPos.x,
      y: cursorPos.y,
      timestamp: now,
      pressure: 1.0,
    };

    const alpha = calculateSmoothingAlpha(trackingSettings?.smoothing ?? 0.75);
    const smoothed = smoothPointExponential(smoothedCursorRef.current, rawPoint, alpha);
    smoothedCursorRef.current = smoothed;

    // IF SYSTEM IS IN SLEEP MODE / PAUSED -> DO NOT DRAW OR ERASE ANYTHING!
    if (isPausedRef.current) {
      if (isDrawingActiveRef.current) {
        finishActiveStroke();
      }
      isErasingActiveRef.current = false;
      sound.updateDrawingHum(false);
      return;
    }

    // Audio cue on gesture transition
    if (gesture !== lastGestureRef.current) {
      if (gesture === 'FIST_ERASE') sound.playModeChange('eraser');
      else if (gesture === 'DRAW') sound.playModeChange('draw');
      lastGestureRef.current = gesture;
    }

    // CHECK FOR ERASER GESTURE (FIST) OR ERASER TOOL
    if (gesture === 'FIST_ERASE' || toolMode === 'eraser') {
      if (isDrawingActiveRef.current) {
        finishActiveStroke();
      }
      if (!isErasingActiveRef.current) {
        pushUndoState();
        isErasingActiveRef.current = true;
      }
      // Enhanced eraser cuts through lines in the middle
      performErase(smoothed.x, smoothed.y, brushSize * 2.5);
      sound.updateDrawingHum(false);
      return;
    } else {
      isErasingActiveRef.current = false;
    }

    // CHECK FOR HOVER / SELECT / PAUSE
    if (gesture === 'SELECT' || gesture === 'OPEN_PALM' || toolMode === 'select') {
      if (isDrawingActiveRef.current) {
        finishActiveStroke();
      }
      sound.updateDrawingHum(false);
      return;
    }

    // CHECK FOR DRAWING (Only DRAW gesture when pen is down)
    const isPenDown = handDetection.isPenDown !== false;
    const shouldDraw = gesture === 'DRAW' && toolMode === 'draw' && isPenDown;

    if (shouldDraw) {
      const activeLayer = layersRef.current.find((l) => l.id === activeLayerIdRef.current);
      if (!canDrawOnLayer(activeLayer)) {
        if (isDrawingActiveRef.current) {
          finishActiveStroke();
        }
        sound.updateDrawingHum(false);
        return;
      }

      if (!isDrawingActiveRef.current) {
        pushUndoState();
        isDrawingActiveRef.current = true;
        currentStrokeRef.current = [smoothed];
      } else {
        const prevPoints = currentStrokeRef.current;
        const lastPt = prevPoints[prevPoints.length - 1];
        const dx = smoothed.x - lastPt.x;
        const dy = smoothed.y - lastPt.y;
        const minDist = trackingSettings?.minMoveDistance ?? 3;
        if (dx * dx + dy * dy >= minDist * minDist) {
          currentStrokeRef.current.push(smoothed);
          spawnBrushParticles(smoothed, brushType, brushColor);

          const speed = calculateStrokeVelocity(lastPt, smoothed);
          sound.updateDrawingHum(true, speed);
        }
      }
    } else {
      if (isDrawingActiveRef.current) {
        finishActiveStroke();
      }
      sound.updateDrawingHum(false);
    }
  }, [
    handDetection,
    toolMode,
    brushSize,
    brushColor,
    brushType,
    finishActiveStroke,
    performErase,
    pushUndoState,
  ]);

  // Main Canvas Render Loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      const pCanvas = particleCanvasRef.current;
      if (!canvas || !pCanvas) return;

      const ctx = canvas.getContext('2d');
      const pCtx = pCanvas.getContext('2d');
      if (!ctx || !pCtx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);

      // Render strokes grouped by layer order
      const strokesByLayer = new Map<string, Stroke[]>();
      for (const s of strokes) {
        const lid = s.layerId || 'layer-neon-fx';
        if (!strokesByLayer.has(lid)) {
          strokesByLayer.set(lid, []);
        }
        strokesByLayer.get(lid)!.push(s);
      }

      // Draw layers from bottom to top
      for (const layer of layers) {
        if (!layer.visible) continue;

        ctx.save();
        ctx.globalAlpha = layer.opacity;

        const layerStrokes = strokesByLayer.get(layer.id) || [];
        for (const stroke of layerStrokes) {
          drawStroke(ctx, stroke.points, stroke.color, stroke.size, stroke.brushType);
        }

        // Draw in-progress stroke on the active layer
        if (layer.id === activeLayerId && currentStrokeRef.current.length > 1) {
          drawStroke(ctx, currentStrokeRef.current, brushColor, brushSize, brushType);
        }

        ctx.restore();
      }

      // Draw cursor reticle
      if (smoothedCursorRef.current) {
        drawCursorReticle(ctx, smoothedCursorRef.current);
      }

      // Draw particle effects
      updateAndDrawParticles(pCtx);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [strokes, layers, activeLayerId, brushColor, brushSize, brushType, toolMode, handDetection, isPaused]);

  // Render individual stroke with specific brush aesthetics
  const drawStroke = (
    ctx: CanvasRenderingContext2D,
    points: Point[],
    color: string,
    size: number,
    type: BrushType
  ) => {
    if (points.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const smoothPoints = generateSmoothSpline(points, 4);

    switch (type) {
      case 'neon': {
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = size * 2.8;
        ctx.lineWidth = size * 1.5;
        ctx.globalAlpha = (ctx.globalAlpha || 1.0) * 0.4;
        renderPath(ctx, smoothPoints);

        ctx.shadowBlur = size * 1.2;
        ctx.lineWidth = size;
        ctx.globalAlpha = (ctx.globalAlpha || 1.0) * 0.8;
        renderPath(ctx, smoothPoints);

        ctx.shadowBlur = 4;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = Math.max(1.5, size * 0.35);
        ctx.globalAlpha = 1.0;
        renderPath(ctx, smoothPoints);
        break;
      }

      case 'calligraphy': {
        ctx.fillStyle = color;
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];
          const speed = calculateStrokeVelocity(p1, p2);
          const currentWidth = Math.max(2, size / (1 + speed * 1.8));

          ctx.beginPath();
          ctx.arc(p1.x, p1.y, currentWidth / 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.lineWidth = currentWidth;
          ctx.strokeStyle = color;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
        break;
      }

      case 'rainbow': {
        for (let i = 0; i < smoothPoints.length - 1; i++) {
          const p1 = smoothPoints[i];
          const p2 = smoothPoints[i + 1];
          const hue = (i * 7 + Date.now() / 40) % 360;
          ctx.strokeStyle = `hsl(${hue}, 100%, 65%)`;
          ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
          ctx.shadowBlur = size * 0.8;
          ctx.lineWidth = size;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
        break;
      }

      case 'laser': {
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = size * 3;
        ctx.lineWidth = size * 1.8;
        ctx.globalAlpha = (ctx.globalAlpha || 1.0) * 0.5;
        renderPath(ctx, smoothPoints);

        ctx.strokeStyle = '#FFFFFF';
        ctx.shadowBlur = 6;
        ctx.lineWidth = Math.max(1, size * 0.3);
        ctx.globalAlpha = 1.0;
        renderPath(ctx, smoothPoints);
        break;
      }

      case 'highlighter': {
        ctx.strokeStyle = color;
        ctx.lineWidth = size * 2.2;
        ctx.globalAlpha = (ctx.globalAlpha || 1.0) * 0.35;
        ctx.lineCap = 'square';
        renderPath(ctx, smoothPoints);
        break;
      }

      case 'fire':
      case 'stardust':
      default: {
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = size;
        ctx.lineWidth = size;
        renderPath(ctx, smoothPoints);
        break;
      }
    }

    ctx.restore();
  };

  const renderPath = (ctx: CanvasRenderingContext2D, points: Point[]) => {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  };

  // Draw interactive holographic cursor / reticle
  const drawCursorReticle = (ctx: CanvasRenderingContext2D, pt: Point) => {
    ctx.save();
    const gesture = handDetection?.gesture || 'NONE';
    const isErase = gesture === 'FIST_ERASE' || toolMode === 'eraser';
    const isSelect = gesture === 'SELECT' || toolMode === 'select';

    // If asleep, show amber pause reticle
    if (isPaused) {
      ctx.strokeStyle = '#F59E0B';
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 16, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = '10px monospace';
      ctx.fillStyle = '#FBBF24';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', pt.x, pt.y + 28);
      ctx.restore();
      return;
    }

    const isPenDown = handDetection?.isPenDown ?? true;
    const isPenUpHover = !isPenDown && !isErase && !isSelect && gesture === 'DRAW';

    const cursorColor = isErase
      ? '#FF0055'
      : isSelect
      ? '#B026FF'
      : isPenUpHover
      ? '#38BDF8'
      : brushColor;

    ctx.strokeStyle = cursorColor;
    ctx.shadowColor = cursorColor;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;

    const radius = isErase ? brushSize * 2.5 : isSelect ? 14 : brushSize / 2 + 6;

    if (isPenUpHover) {
      // Dashed ring showing pen is lifted
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#38BDF8';
      ctx.textAlign = 'center';
      ctx.fillText('PEN UP (HOVER)', pt.x, pt.y + radius + 16);
    } else {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      if (!isErase) {
        const len = 5;
        ctx.beginPath();
        ctx.moveTo(pt.x - radius - len, pt.y);
        ctx.lineTo(pt.x - radius + 2, pt.y);
        ctx.moveTo(pt.x + radius - 2, pt.y);
        ctx.lineTo(pt.x + radius + len, pt.y);
        ctx.moveTo(pt.x, pt.y - radius - len);
        ctx.lineTo(pt.x, pt.y - radius + 2);
        ctx.moveTo(pt.x, pt.y + radius - 2);
        ctx.lineTo(pt.x, pt.y + radius + len);
        ctx.stroke();
      } else {
        // Draw cross inside eraser circle
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#FF0055';
        ctx.textAlign = 'center';
        ctx.fillText('ERASE', pt.x, pt.y + radius + 12);
      }
    }

    ctx.restore();
  };

  const updateAndDrawParticles = (pCtx: CanvasRenderingContext2D) => {
    const list = particlesRef.current;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        list.splice(i, 1);
        continue;
      }

      pCtx.save();
      pCtx.fillStyle = p.color;
      pCtx.shadowColor = p.color;
      pCtx.shadowBlur = 8;
      pCtx.globalAlpha = p.alpha;
      pCtx.beginPath();
      pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.restore();
    }
  };

  // Mouse / Touch Fallback handlers (for simulation mode)
  const isMouseDownRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPaused) return;

    isMouseDownRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    const pt: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      timestamp: performance.now(),
      pressure: 1.0,
    };
    smoothedCursorRef.current = pt;

    pushUndoState();

    if (toolMode === 'eraser') {
      performErase(pt.x, pt.y, brushSize * 2.5);
    } else {
      const activeLayer = layersRef.current.find((l) => l.id === activeLayerIdRef.current);
      if (canDrawOnLayer(activeLayer)) {
        isDrawingActiveRef.current = true;
        currentStrokeRef.current = [pt];
        sound.updateDrawingHum(true, 1.0);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pt: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      timestamp: performance.now(),
      pressure: 1.0,
    };
    smoothedCursorRef.current = pt;

    if (!isMouseDownRef.current || isPaused) return;

    if (toolMode === 'eraser') {
      performErase(pt.x, pt.y, brushSize * 2.5);
    } else if (isDrawingActiveRef.current) {
      currentStrokeRef.current.push(pt);
      spawnBrushParticles(pt, brushType, brushColor);
    }
  };

  const handlePointerUp = () => {
    isMouseDownRef.current = false;
    if (isDrawingActiveRef.current) {
      finishActiveStroke();
    }
    sound.updateDrawingHum(false);
  };

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto">
      <canvas
        ref={canvasRef}
        data-testid="air-drawing-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="absolute inset-0 w-full h-full cursor-crosshair z-20"
      />
      <canvas
        ref={particleCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-21"
      />
    </div>
  );
};
