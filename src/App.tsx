import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CameraStream } from './components/CameraStream';
import { AirCanvas } from './components/AirCanvas';
import { HUDOverlay } from './components/HUDOverlay';
import { AirToolbar } from './components/AirToolbar';
import { AIAssistantModal } from './components/AIAssistantModal';
import { GestureGuideModal } from './components/GestureGuideModal';
import { LayerPanel } from './components/LayerPanel';
import { SettingsModal } from './components/SettingsModal';
import { TrackingSettings, DEFAULT_TRACKING_SETTINGS } from './utils/sensitivityConfig';
import { 
  BrushType, 
  ToolMode, 
  BackdropMode, 
  Stroke, 
  HandDetectionResult,
  DrawingLayer
} from './types/airdraw';
import {
  createDefaultLayers,
  addLayer,
  removeLayer,
  toggleLayerVisibility,
  toggleLayerLock,
  setLayerOpacity,
  renameLayer,
  moveLayer,
  duplicateLayer,
  mergeLayerDown,
} from './utils/layerManager';
import { sound } from './utils/audioFeedback';

export default function App() {
  // Drawing parameters
  const [brushType, setBrushType] = useState<BrushType>('neon');
  const [brushColor, setBrushColor] = useState<string>('#00F0FF');
  const [brushSize, setBrushSize] = useState<number>(12);
  const [toolMode, setToolMode] = useState<ToolMode>('draw');
  const [autoSnapShapes, setAutoSnapShapes] = useState<boolean>(true);
  const [backdropMode, setBackdropMode] = useState<BackdropMode>('hologram');
  const [mirror, setMirror] = useState<boolean>(true);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);

  // Layers System State
  const [layers, setLayers] = useState<DrawingLayer[]>(() => createDefaultLayers().layers);
  const [activeLayerId, setActiveLayerId] = useState<string>(() => createDefaultLayers().activeLayerId);
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState<boolean>(false);

  // Stroke history & undo/redo
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);

  // Sleep Mode / Pause State
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const lastSleepToggleTimeRef = useRef<number>(0);

  // Tracking state from camera
  const [handDetection, setHandDetection] = useState<HandDetectionResult | null>(null);

  // Modals, Settings & Audio
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [trackingSettings, setTrackingSettings] = useState<TrackingSettings>(() => DEFAULT_TRACKING_SETTINGS);

  // Auto-sleep on OPEN_PALM, Wake on THUMBS_UP or DRAW
  useEffect(() => {
    if (!handDetection) return;
    const now = Date.now();
    if (now - lastSleepToggleTimeRef.current < 800) return;

    if (!isPaused && handDetection.gesture === 'OPEN_PALM') {
      setIsPaused(true);
      lastSleepToggleTimeRef.current = now;
      sound.playClear();
    } else if (isPaused && (handDetection.gesture === 'THUMBS_UP' || handDetection.gesture === 'DRAW')) {
      setIsPaused(false);
      lastSleepToggleTimeRef.current = now;
      sound.playShapeSnap();
    }
  }, [handDetection, isPaused]);

  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      if (next) sound.playClear();
      else sound.playShapeSnap();
      return next;
    });
  }, []);

  // Undo action
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((old) => old.slice(0, old.length - 1));
    setRedoStack((old) => [...old, strokes]);
    setStrokes(prev);
  }, [undoStack, strokes]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((old) => old.slice(0, old.length - 1));
    setUndoStack((old) => [...old, strokes]);
    setStrokes(next);
  }, [redoStack, strokes]);

  // Clear all canvas strokes
  const handleClear = useCallback(() => {
    if (strokes.length === 0) return;
    setUndoStack((old) => [...old, strokes]);
    setRedoStack([]);
    setStrokes([]);
  }, [strokes]);

  // Layer Operations Handlers
  const handleToggleVisibility = useCallback((id: string) => {
    setLayers((prev) => toggleLayerVisibility(prev, id));
  }, []);

  const handleToggleLock = useCallback((id: string) => {
    setLayers((prev) => toggleLayerLock(prev, id));
  }, []);

  const handleChangeOpacity = useCallback((id: string, opacity: number) => {
    setLayers((prev) => setLayerOpacity(prev, id, opacity));
  }, []);

  const handleAddLayer = useCallback(() => {
    setLayers((prev) => {
      const { updatedLayers, newLayer } = addLayer(prev);
      setActiveLayerId(newLayer.id);
      return updatedLayers;
    });
  }, []);

  const handleRemoveLayer = useCallback((id: string) => {
    setUndoStack((old) => [...old, strokes]);
    const { updatedLayers, updatedStrokes, newActiveId } = removeLayer(layers, strokes, id);
    setLayers(updatedLayers);
    setStrokes(updatedStrokes);
    if (newActiveId) setActiveLayerId(newActiveId);
  }, [layers, strokes]);

  const handleRenameLayer = useCallback((id: string, name: string) => {
    setLayers((prev) => renameLayer(prev, id, name));
  }, []);

  const handleMoveLayer = useCallback((index: number, direction: 'up' | 'down') => {
    setLayers((prev) => moveLayer(prev, index, direction));
  }, []);

  const handleDuplicateLayer = useCallback((id: string) => {
    setUndoStack((old) => [...old, strokes]);
    const { updatedLayers, updatedStrokes, newLayerId } = duplicateLayer(layers, strokes, id);
    setLayers(updatedLayers);
    setStrokes(updatedStrokes);
    setActiveLayerId(newLayerId);
    sound.playShapeSnap();
  }, [layers, strokes]);

  const handleMergeDown = useCallback((id: string) => {
    const result = mergeLayerDown(layers, strokes, id);
    if (result) {
      setUndoStack((old) => [...old, strokes]);
      setLayers(result.updatedLayers);
      setStrokes(result.updatedStrokes);
      setActiveLayerId(result.mergedLayerId);
      sound.playUndo();
    }
  }, [layers, strokes]);

  const handleClearLayerStrokes = useCallback((id: string) => {
    setUndoStack((old) => [...old, strokes]);
    setStrokes((prev) => prev.filter((s) => (s.layerId || 'layer-neon-fx') !== id));
    sound.playClear();
  }, [strokes]);

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  // Keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePause();
      } else if (e.key.toLowerCase() === 'e') {
        setToolMode('eraser');
      } else if (e.key.toLowerCase() === 'd') {
        setToolMode('draw');
      } else if (e.key.toLowerCase() === 'l') {
        setIsLayerPanelOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'm') {
        handleToggleMute();
      } else if (e.key.toLowerCase() === 's') {
        setIsSettingsOpen((prev) => !prev);
      } else if (e.key === '?') {
        setIsGuideModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleToggleMute, handleTogglePause]);

  // Capture canvas image data URL respecting visible layers and opacity
  const getCanvasSnapshot = useCallback((): string | null => {
    const canvas = document.querySelector('canvas[data-testid="air-drawing-canvas"]') as HTMLCanvasElement;
    if (!canvas) return null;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return null;

    // Draw background
    if (backdropMode === 'whiteboard') {
      ctx.fillStyle = '#FFFFFF';
    } else {
      ctx.fillStyle = '#0a0d14';
    }
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Draw visible canvas
    ctx.drawImage(canvas, 0, 0);

    return exportCanvas.toDataURL('image/png');
  }, [backdropMode]);

  // Export artwork to PNG
  const handleExport = useCallback(() => {
    const dataUrl = getCanvasSnapshot();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = `auradraw-artwork-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, [getCanvasSnapshot]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans select-none">
      {/* 1. WEBCAM STREAM & AR SKELETON LAYER */}
      <CameraStream
        onHandDetected={setHandDetection}
        backdropMode={backdropMode}
        showSkeleton={showSkeleton}
        mirror={mirror}
        isSimulated={isSimulated}
        setIsSimulated={setIsSimulated}
        trackingSettings={trackingSettings}
      />

      {/* 2. REAL-TIME AIR DRAWING CANVAS */}
      <AirCanvas
        handDetection={handDetection}
        brushType={brushType}
        brushColor={brushColor}
        brushSize={brushSize}
        toolMode={toolMode}
        autoSnapShapes={autoSnapShapes}
        backdropMode={backdropMode}
        layers={layers}
        activeLayerId={activeLayerId}
        strokes={strokes}
        setStrokes={setStrokes}
        undoStack={undoStack}
        setUndoStack={setUndoStack}
        redoStack={redoStack}
        setRedoStack={setRedoStack}
        isPaused={isPaused}
        trackingSettings={trackingSettings}
      />

      {/* 3. SCI-FI HUD TELEMETRY OVERLAY */}
      <HUDOverlay
        handDetection={handDetection}
        toolMode={toolMode}
        strokeCount={strokes.length}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenGuide={() => setIsGuideModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isSimulated={isSimulated}
        onToggleSimulated={() => setIsSimulated(!isSimulated)}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
      />

      {/* 4. LAYER MANAGEMENT FLOATING PANEL */}
      <LayerPanel
        layers={layers}
        activeLayerId={activeLayerId}
        setActiveLayerId={setActiveLayerId}
        strokes={strokes}
        onToggleVisibility={handleToggleVisibility}
        onToggleLock={handleToggleLock}
        onChangeOpacity={handleChangeOpacity}
        onAddLayer={handleAddLayer}
        onRemoveLayer={handleRemoveLayer}
        onRenameLayer={handleRenameLayer}
        onMoveLayer={handleMoveLayer}
        onDuplicateLayer={handleDuplicateLayer}
        onMergeDown={handleMergeDown}
        onClearLayerStrokes={handleClearLayerStrokes}
        isOpen={isLayerPanelOpen}
        setIsOpen={setIsLayerPanelOpen}
      />

      {/* 5. FLOATING GLASS AIR TOOLBAR */}
      <AirToolbar
        brushType={brushType}
        setBrushType={setBrushType}
        brushColor={brushColor}
        setBrushColor={setBrushColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        toolMode={toolMode}
        setToolMode={setToolMode}
        autoSnapShapes={autoSnapShapes}
        setAutoSnapShapes={setAutoSnapShapes}
        backdropMode={backdropMode}
        setBackdropMode={setBackdropMode}
        mirror={mirror}
        setMirror={setMirror}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onClear={handleClear}
        onOpenAI={() => setIsAIModalOpen(true)}
        onExport={handleExport}
        onToggleLayers={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
        isLayerPanelOpen={isLayerPanelOpen}
        layerCount={layers.length}
      />

      {/* 6. GEMINI AI VISION STUDIO MODAL */}
      <AIAssistantModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        getCanvasSnapshot={getCanvasSnapshot}
      />

      {/* 7. GESTURE FLIGHT MANUAL MODAL */}
      <GestureGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* 8. TRACKING & SENSITIVITY SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={trackingSettings}
        onUpdateSettings={setTrackingSettings}
        handDetection={handDetection}
      />
    </div>
  );
}
