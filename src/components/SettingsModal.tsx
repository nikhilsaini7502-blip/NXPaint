import React from 'react';
import { TrackingSettings, DEFAULT_TRACKING_SETTINGS, calculateSmoothingAlpha } from '../utils/sensitivityConfig';
import { HandDetectionResult } from '../types/airdraw';
import {
  Sliders,
  Sparkles,
  RotateCcw,
  X,
  PenTool,
  Check,
  HelpCircle,
  Activity,
  Zap,
  Target
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TrackingSettings;
  onUpdateSettings: (newSettings: TrackingSettings) => void;
  handDetection: HandDetectionResult | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  handDetection,
}) => {
  if (!isOpen) return null;

  const currentAlpha = calculateSmoothingAlpha(settings.smoothing).toFixed(2);
  const fingers = handDetection?.fingersExtended || {
    thumb: false,
    index: false,
    middle: false,
    ring: false,
    pinky: false,
  };

  const rawZ = handDetection?.rawZ ?? 0;
  const isPenDown = handDetection?.isPenDown ?? true;

  // Preset Configurations
  const applyPreset = (preset: 'handwriting' | 'fluid' | 'responsive') => {
    if (preset === 'handwriting') {
      onUpdateSettings({
        sensitivity: 0.65,
        smoothing: 0.40,
        depthTrigger: true,
        depthThreshold: -0.04,
        minMoveDistance: 2,
      });
    } else if (preset === 'fluid') {
      onUpdateSettings({
        sensitivity: 0.60,
        smoothing: 0.75,
        depthTrigger: false,
        depthThreshold: -0.05,
        minMoveDistance: 3,
      });
    } else if (preset === 'responsive') {
      onUpdateSettings({
        sensitivity: 0.80,
        smoothing: 0.20,
        depthTrigger: false,
        depthThreshold: -0.05,
        minMoveDistance: 1,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        data-testid="settings-modal"
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-slate-900/95 border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 text-slate-100 flex flex-col gap-5"
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono tracking-wide text-white flex items-center gap-2">
                TRACKING & SENSITIVITY SETTINGS
              </h2>
              <p className="text-xs text-slate-400">
                Tune gesture detection thresholds, anti-jitter smoothing, and pen-up controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Settings"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QUICK PRESETS */}
        <div>
          <label className="text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase block mb-2">
            Recommended Writing Presets
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
            <button
              onClick={() => applyPreset('handwriting')}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                settings.depthTrigger && settings.smoothing <= 0.45
                  ? 'bg-cyan-500/20 border-cyan-400 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-cyan-400" />
                  Handwriting
                </span>
                {settings.depthTrigger && settings.smoothing <= 0.45 && (
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Air-Tap depth enabled for separate letters & words without connecting lines.
              </p>
            </button>

            <button
              onClick={() => applyPreset('fluid')}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                !settings.depthTrigger && settings.smoothing >= 0.7
                  ? 'bg-purple-500/20 border-purple-400 shadow-md shadow-purple-500/10'
                  : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Fluid Art
                </span>
                {!settings.depthTrigger && settings.smoothing >= 0.7 && (
                  <Check className="w-3.5 h-3.5 text-purple-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Buttery neon ribbon stabilization. Zero tremor for fluid artistic sweeps.
              </p>
            </button>

            <button
              onClick={() => applyPreset('responsive')}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                !settings.depthTrigger && settings.smoothing <= 0.3
                  ? 'bg-emerald-500/20 border-emerald-400 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  Ultra Fast
                </span>
                {!settings.depthTrigger && settings.smoothing <= 0.3 && (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Instant 1:1 tracking with minimal filter. Instant stroke response.
              </p>
            </button>
          </div>
        </div>

        {/* CORE SLIDERS */}
        <div className="flex flex-col gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
          {/* 1. GESTURE SENSITIVITY SLIDER */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="sensitivity-range" className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-2">
                <span>GESTURE DETECTION SENSITIVITY</span>
              </label>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                {Math.round(settings.sensitivity * 100)}% (
                {settings.sensitivity < 0.4 ? 'Strict' : settings.sensitivity > 0.75 ? 'Forgiving' : 'Balanced'}
                )
              </span>
            </div>
            <input
              id="sensitivity-range"
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={settings.sensitivity}
              onChange={(e) =>
                onUpdateSettings({ ...settings, sensitivity: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>Strict (Finger must be fully straight)</span>
              <span>Forgiving (Easier trigger)</span>
            </div>
          </div>

          {/* 2. STROKE SMOOTHING SLIDER */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="smoothing-range" className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-2">
                <span>ANTI-JITTER STROKE SMOOTHING</span>
              </label>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                {Math.round(settings.smoothing * 100)}% (α = {currentAlpha})
              </span>
            </div>
            <input
              id="smoothing-range"
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={settings.smoothing}
              onChange={(e) =>
                onUpdateSettings({ ...settings, smoothing: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>Crisp / Sharp (Best for handwriting & letters)</span>
              <span>Silky Curves (Anti-tremor)</span>
            </div>
          </div>

          {/* 3. MINIMUM MOVEMENT DEADZONE */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="deadzone-range" className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-2">
                <span>HAND TREMOR DEADZONE</span>
              </label>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {settings.minMoveDistance} px
              </span>
            </div>
            <input
              id="deadzone-range"
              type="range"
              min="1"
              max="10"
              step="1"
              value={settings.minMoveDistance}
              onChange={(e) =>
                onUpdateSettings({ ...settings, minMoveDistance: parseInt(e.target.value) })
              }
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Prevents ink puddling when holding hand still between letters or dotting an &apos;i&apos;.
            </p>
          </div>
        </div>

        {/* FINGER WRITING ASSIST: AIR-TAP DEPTH (PUSH-TO-WRITE) */}
        <div className="bg-slate-950/60 p-4 rounded-2xl border border-cyan-500/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Air-Tap Depth (Push-to-Write)
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  HANDWRITING FIX
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Push your fingertip slightly toward the screen to write ink. Pull back to lift pen between letters without connecting lines!
              </p>
            </div>

            <button
              onClick={() => onUpdateSettings({ ...settings, depthTrigger: !settings.depthTrigger })}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all border ${
                settings.depthTrigger
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {settings.depthTrigger ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {settings.depthTrigger && (
            <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Push Depth Threshold:</span>
                <span className="text-cyan-400 font-bold">{settings.depthThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-0.12"
                max="-0.01"
                step="0.01"
                value={settings.depthThreshold}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, depthThreshold: parseFloat(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Requires deeper push</span>
                <span>Gentle push</span>
              </div>
            </div>
          )}
        </div>

        {/* LIVE SENSOR TELEMETRY & FEEDBACK MONITOR */}
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              LIVE FINGER & DEPTH TELEMETRY
            </span>
            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
              isPenDown ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
            }`}>
              {isPenDown ? 'PEN DOWN (INKING)' : 'PEN UP (HOVER)'}
            </span>
          </div>

          {/* Finger detection pills */}
          <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono">
            {[
              { label: 'Thumb', active: fingers.thumb },
              { label: 'Index', active: fingers.index },
              { label: 'Middle', active: fingers.middle },
              { label: 'Ring', active: fingers.ring },
              { label: 'Pinky', active: fingers.pinky },
            ].map((f) => (
              <div
                key={f.label}
                className={`py-1 rounded-lg border font-bold transition-all ${
                  f.active
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm'
                    : 'bg-slate-900 text-slate-600 border-slate-800'
                }`}
              >
                {f.label}: {f.active ? 'EXT' : 'FOLD'}
              </div>
            ))}
          </div>

          {/* Live Z Depth meter */}
          {settings.depthTrigger && (
            <div className="mt-1 flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Z-Depth: {rawZ ? rawZ.toFixed(3) : '0.000'}</span>
                <span>Threshold: {settings.depthThreshold.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full transition-all duration-75 ${isPenDown ? 'bg-emerald-400' : 'bg-cyan-500'}`}
                  style={{
                    width: `${Math.min(100, Math.max(0, ((-rawZ) / 0.15) * 100))}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            onClick={() => onUpdateSettings(DEFAULT_TRACKING_SETTINGS)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-lg shadow-cyan-500/20"
          >
            Apply & Done
          </button>
        </div>
      </div>
    </div>
  );
};
