import React, { useState } from 'react';
import { DrawingLayer, Stroke } from '../types/airdraw';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  ArrowDownToLine,
  Edit2,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { sound } from '../utils/audioFeedback';

interface LayerPanelProps {
  layers: DrawingLayer[];
  activeLayerId: string;
  setActiveLayerId: (id: string) => void;
  strokes: Stroke[];
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
  onAddLayer: () => void;
  onRemoveLayer: (id: string) => void;
  onRenameLayer: (id: string, name: string) => void;
  onMoveLayer: (index: number, direction: 'up' | 'down') => void;
  onDuplicateLayer: (id: string) => void;
  onMergeDown: (id: string) => void;
  onClearLayerStrokes: (id: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  activeLayerId,
  setActiveLayerId,
  strokes,
  onToggleVisibility,
  onToggleLock,
  onChangeOpacity,
  onAddLayer,
  onRemoveLayer,
  onRenameLayer,
  onMoveLayer,
  onDuplicateLayer,
  onMergeDown,
  onClearLayerStrokes,
  isOpen,
  setIsOpen,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');

  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[layers.length - 1];

  const handleStartRename = (layer: DrawingLayer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(layer.id);
    setEditName(layer.name);
  };

  const handleSaveRename = (id: string) => {
    if (editName.trim()) {
      onRenameLayer(id, editName.trim());
    }
    setEditingId(null);
  };

  // Render layer list from top-to-bottom (highest index rendered on top)
  const reversedLayers = [...layers].map((layer, originalIndex) => ({
    layer,
    originalIndex,
  })).reverse();

  return (
    <div className="fixed top-20 right-4 z-40 flex flex-col items-end pointer-events-auto">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl backdrop-blur-xl border transition-all text-xs font-mono font-medium shadow-xl ${
          isOpen
            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-cyan-500/20'
            : 'bg-slate-950/80 text-slate-300 border-cyan-500/25 hover:border-cyan-400 hover:text-white'
        }`}
        title="Toggle Layer Management Dock"
      >
        <Layers className="w-4 h-4 text-cyan-400" />
        <span>LAYERS ({layers.length})</span>
        {activeLayer && (
          <span className="hidden sm:inline-block max-w-[90px] truncate text-[10px] text-cyan-300/80 bg-slate-900/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
            {activeLayer.name}
          </span>
        )}
      </button>

      {/* Expanded Floating Layer Manager Drawer */}
      {isOpen && (
        <div className="mt-2 w-80 sm:w-96 rounded-3xl backdrop-blur-2xl bg-slate-950/90 border border-cyan-500/30 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(0,240,255,0.15)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-cyan-500/20 bg-slate-900/70">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="font-mono font-bold text-xs text-white tracking-wide">
                LAYER COMPOSITION
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  onAddLayer();
                  sound.playShapeSnap();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-400/40 text-[11px] font-mono font-bold transition-all"
                title="Add New Layer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>NEW</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                title="Close Layers Panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Layer Warning Banner */}
          {activeLayer && (!activeLayer.visible || activeLayer.locked) && (
            <div className="flex items-center gap-2 p-2.5 bg-amber-950/60 border-b border-amber-500/30 text-amber-300 text-[11px] font-mono">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <span>
                {activeLayer.locked
                  ? 'Active layer is LOCKED. Unlock to draw in air.'
                  : 'Active layer is HIDDEN. Unhide to see new strokes.'}
              </span>
            </div>
          )}

          {/* Layer List */}
          <div className="max-h-72 overflow-y-auto p-2 space-y-1.5 font-mono text-xs">
            {reversedLayers.map(({ layer, originalIndex }) => {
              const isActive = layer.id === activeLayerId;
              const layerStrokes = strokes.filter(
                (s) => (s.layerId || 'layer-neon-fx') === layer.id
              );

              return (
                <div
                  key={layer.id}
                  onClick={() => setActiveLayerId(layer.id)}
                  className={`group relative p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isActive
                      ? 'bg-cyan-500/15 border-cyan-400 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Row 1: Visibility, Lock, Name, Badges, Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* Visibility Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleVisibility(layer.id);
                        }}
                        className={`p-1 rounded-lg transition-colors ${
                          layer.visible
                            ? 'text-cyan-400 hover:text-cyan-300'
                            : 'text-slate-600 hover:text-slate-400'
                        }`}
                        title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                      >
                        {layer.visible ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>

                      {/* Lock Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLock(layer.id);
                        }}
                        className={`p-1 rounded-lg transition-colors ${
                          layer.locked
                            ? 'text-rose-400 hover:text-rose-300'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title={layer.locked ? 'Unlock Layer' : 'Lock Layer (Prevents changes)'}
                      >
                        {layer.locked ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                        )}
                      </button>

                      {/* Layer Name / Inline Edit */}
                      {editingId === layer.id ? (
                        <div
                          className="flex items-center gap-1 flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(layer.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            autoFocus
                            className="w-full px-2 py-0.5 rounded bg-slate-950 border border-cyan-400 text-white text-xs focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveRename(layer.id)}
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1.5 flex-1 min-w-0"
                          onDoubleClick={(e) => handleStartRename(layer, e)}
                        >
                          <span
                            className={`truncate font-medium text-xs ${
                              isActive ? 'text-white font-bold' : 'text-slate-300'
                            } ${!layer.visible ? 'line-through opacity-40' : ''}`}
                          >
                            {layer.name}
                          </span>
                          <button
                            onClick={(e) => handleStartRename(layer, e)}
                            className="opacity-0 group-hover:opacity-70 hover:opacity-100 text-slate-400 hover:text-white p-0.5"
                            title="Rename Layer"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Stroke count & Layer Action icons */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950/60 border border-slate-800 text-slate-400">
                        {layerStrokes.length} str
                      </span>

                      {/* Move Up */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveLayer(originalIndex, 'up');
                        }}
                        disabled={originalIndex === layers.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20"
                        title="Move Layer Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveLayer(originalIndex, 'down');
                        }}
                        disabled={originalIndex === 0}
                        className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20"
                        title="Move Layer Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Duplicate */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateLayer(layer.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-cyan-300"
                        title="Duplicate Layer"
                      >
                        <Copy className="w-3 h-3" />
                      </button>

                      {/* Merge Down */}
                      {originalIndex > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMergeDown(layer.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-purple-300"
                          title="Merge Down"
                        >
                          <ArrowDownToLine className="w-3 h-3" />
                        </button>
                      )}

                      {/* Delete */}
                      {layers.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveLayer(layer.id);
                          }}
                          className="p-1 rounded text-slate-500 hover:text-rose-400"
                          title="Delete Layer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Opacity Slider */}
                  <div
                    className="flex items-center gap-2 pt-1 border-t border-slate-800/40 text-[10px] text-slate-400"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Opacity</span>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={Math.round(layer.opacity * 100)}
                      onChange={(e) =>
                        onChangeOpacity(layer.id, parseInt(e.target.value, 10) / 100)
                      }
                      className="flex-1 accent-cyan-400 cursor-pointer h-1 bg-slate-800 rounded-lg"
                    />
                    <span className="w-8 text-right font-mono">
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-cyan-500/20 bg-slate-900/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Active: <b className="text-cyan-300">{activeLayer?.name}</b></span>
            <button
              onClick={() => {
                if (activeLayer) onClearLayerStrokes(activeLayer.id);
              }}
              className="text-red-400 hover:text-red-300 underline"
            >
              Clear Current Layer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
