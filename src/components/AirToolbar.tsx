import React from 'react';
import { BrushType, ToolMode, BackdropMode, Stroke } from '../types/airdraw';
import {
  PenTool,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Sparkles,
  Download,
  FlipHorizontal,
  Flame,
  Star,
  Zap,
  Highlighter,
  Feather,
  Shapes,
  Palette,
  Monitor
} from 'lucide-react';
import { sound } from '../utils/audioFeedback';

interface AirToolbarProps {
  brushType: BrushType;
  setBrushType: (b: BrushType) => void;
  brushColor: string;
  setBrushColor: (c: string) => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  toolMode: ToolMode;
  setToolMode: (m: ToolMode) => void;
  autoSnapShapes: boolean;
  setAutoSnapShapes: (s: boolean) => void;
  backdropMode: BackdropMode;
  setBackdropMode: (m: BackdropMode) => void;
  mirror: boolean;
  setMirror: (m: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClear: () => void;
  onOpenAI: () => void;
  onExport: () => void;
  onToggleLayers?: () => void;
  isLayerPanelOpen?: boolean;
  layerCount?: number;
}

const COLOR_PALETTE = [
  { name: 'Cyber Cyan', hex: '#00F0FF' },
  { name: 'Neon Green', hex: '#39FF14' },
  { name: 'Laser Pink', hex: '#FF007F' },
  { name: 'Solar Yellow', hex: '#FFE600' },
  { name: 'Electric Purple', hex: '#B026FF' },
  { name: 'Plasma Orange', hex: '#FF5E00' },
  { name: 'Holo White', hex: '#FFFFFF' },
];

const BRUSH_OPTIONS: { type: BrushType; label: string; icon: React.ReactNode }[] = [
  { type: 'neon', label: 'Neon Glow', icon: <Zap className="w-3.5 h-3.5" /> },
  { type: 'calligraphy', label: 'Calligraphy', icon: <Feather className="w-3.5 h-3.5" /> },
  { type: 'rainbow', label: 'Rainbow', icon: <Palette className="w-3.5 h-3.5" /> },
  { type: 'laser', label: 'Laser', icon: <PenTool className="w-3.5 h-3.5" /> },
  { type: 'fire', label: 'Fire', icon: <Flame className="w-3.5 h-3.5" /> },
  { type: 'stardust', label: 'Stardust', icon: <Star className="w-3.5 h-3.5" /> },
  { type: 'highlighter', label: 'Highlighter', icon: <Highlighter className="w-3.5 h-3.5" /> },
];

export const AirToolbar: React.FC<AirToolbarProps> = ({
  brushType,
  setBrushType,
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  toolMode,
  setToolMode,
  autoSnapShapes,
  setAutoSnapShapes,
  backdropMode,
  setBackdropMode,
  mirror,
  setMirror,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClear,
  onOpenAI,
  onExport,
  onToggleLayers,
  isLayerPanelOpen,
  layerCount,
}) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-5xl px-3 pointer-events-auto">
      <div className="flex flex-col gap-2 p-2.5 rounded-2xl backdrop-blur-2xl bg-slate-950/85 border border-cyan-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(0,240,255,0.15)]">
        {/* UPPER ROW: Mode Toggles, Colors, Brush Presets, AI Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/20 pb-2">
          {/* DRAW / ERASE PRIMARY MODES */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-cyan-500/20">
            <button
              onClick={() => {
                setToolMode('draw');
                sound.playModeChange('draw');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                toolMode === 'draw'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>DRAW</span>
            </button>
            <button
              onClick={() => {
                setToolMode('eraser');
                sound.playModeChange('eraser');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                toolMode === 'eraser'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>ERASER</span>
            </button>
          </div>

          {/* NEON COLOR PALETTE */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 px-2 py-1.5 rounded-xl border border-cyan-500/20 overflow-x-auto">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.hex}
                onClick={() => setBrushColor(c.hex)}
                style={{ backgroundColor: c.hex }}
                title={c.name}
                aria-label={`Select ${c.name} color`}
                className={`w-6 h-6 rounded-full transition-all relative ${
                  brushColor.toLowerCase() === c.hex.toLowerCase()
                    ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-950 shadow-lg'
                    : 'opacity-70 hover:opacity-100 hover:scale-110'
                }`}
              />
            ))}
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              title="Custom Hex Color"
              aria-label="Custom Hex Color"
              className="w-6 h-6 rounded-full cursor-pointer bg-transparent border-0 p-0 ml-1"
            />
          </div>

          {/* BRUSH TYPE SELECTOR */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-cyan-500/20 overflow-x-auto">
            {BRUSH_OPTIONS.map((b) => (
              <button
                key={b.type}
                onClick={() => setBrushType(b.type)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                  brushType === b.type
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold shadow-sm shadow-cyan-400/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {b.icon}
                <span>{b.label}</span>
              </button>
            ))}
          </div>

          {/* AI VISION STUDIO & LAYERS BUTTONS */}
          <div className="flex items-center gap-1.5">
            {onToggleLayers && (
              <button
                onClick={onToggleLayers}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all ${
                  isLayerPanelOpen
                    ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/80 text-slate-300 border-cyan-500/30 hover:border-cyan-400 hover:text-white'
                }`}
                title="Toggle Layers Panel"
              >
                <Shapes className="w-3.5 h-3.5 text-cyan-400" />
                <span>LAYERS {layerCount ? `(${layerCount})` : ''}</span>
              </button>
            )}

            <button
              onClick={onOpenAI}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-mono text-xs font-bold shadow-lg shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 animate-spin text-yellow-300" />
              <span>AI VISION</span>
            </button>
          </div>
        </div>

        {/* LOWER ROW: Brush Size, Shape Auto-snap, Backdrop, Undo/Redo, Clear, Export */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-300">
          {/* BRUSH SIZE SLIDER */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-cyan-400">SIZE</span>
            <input
              type="range"
              min="2"
              max="40"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
              className="w-20 sm:w-28 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              aria-label="Brush Size Slider"
            />
            <div
              className="rounded-full border border-white/50 flex-shrink-0"
              style={{
                width: Math.min(24, Math.max(6, brushSize)),
                height: Math.min(24, Math.max(6, brushSize)),
                backgroundColor: brushColor,
              }}
            />
          </div>

          {/* SMART SHAPE SNAPPING TOGGLE */}
          <button
            onClick={() => setAutoSnapShapes(!autoSnapShapes)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] transition-all ${
              autoSnapShapes
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-sm shadow-emerald-500/20 font-bold'
                : 'bg-slate-900/60 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Automatically snaps drawn circles and rectangles to clean geometry"
          >
            <Shapes className="w-3.5 h-3.5" />
            <span>SMART SHAPES {autoSnapShapes ? 'ON' : 'OFF'}</span>
          </button>

          {/* BACKDROP MODE SELECTOR */}
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-cyan-500/20">
            <Monitor className="w-3.5 h-3.5 text-cyan-400 ml-1 hidden md:block" />
            {(['webcam', 'hologram', 'dark', 'whiteboard', 'grid'] as BackdropMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setBackdropMode(mode)}
                className={`px-2 py-0.5 rounded-lg text-[10px] capitalize transition-all ${
                  backdropMode === mode
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* MIRROR TOGGLE */}
          <button
            onClick={() => setMirror(!mirror)}
            className={`p-1.5 rounded-xl border transition-all ${
              mirror
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                : 'bg-slate-900/60 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Mirror Camera Preview"
            aria-label="Mirror Camera Preview"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          {/* UNDO / REDO / CLEAR / EXPORT */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onUndo();
                sound.playUndo();
              }}
              disabled={!canUndo}
              aria-label="Undo Stroke"
              className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 disabled:opacity-30 disabled:pointer-events-none transition-all"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onRedo();
                sound.playUndo();
              }}
              disabled={!canRedo}
              aria-label="Redo Stroke"
              className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-400 disabled:opacity-30 disabled:pointer-events-none transition-all"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onClear();
                sound.playClear();
              }}
              aria-label="Clear Canvas"
              className="p-1.5 rounded-xl bg-slate-900/80 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
              title="Clear Canvas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onExport}
              aria-label="Download PNG Artwork"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 hover:text-white transition-all text-xs"
              title="Save Drawing to PNG"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SAVE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
