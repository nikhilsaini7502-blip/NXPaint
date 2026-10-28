import React from 'react';
import { HandDetectionResult, ToolMode } from '../types/airdraw';
import { 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Activity, 
  Layers,
  Pause,
  Play,
  Sliders
} from 'lucide-react';

interface HUDOverlayProps {
  handDetection: HandDetectionResult | null;
  toolMode: ToolMode;
  strokeCount: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenGuide: () => void;
  onOpenSettings: () => void;
  isSimulated: boolean;
  onToggleSimulated: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  handDetection,
  toolMode,
  strokeCount,
  isMuted,
  onToggleMute,
  onOpenGuide,
  onOpenSettings,
  isSimulated,
  onToggleSimulated,
  isPaused,
  onTogglePause,
}) => {
  const gesture = handDetection?.gesture || 'NONE';
  const fingers = handDetection?.fingersExtended || {
    thumb: false,
    index: false,
    middle: false,
    ring: false,
    pinky: false,
  };

  // Human friendly gesture label and color
  const getGestureDetails = () => {
    if (isPaused) {
      return {
        title: 'SLEEP MODE (PAUSED)',
        sub: 'Show ☝️ Point or 👍 Thumbs Up to wake',
        color: 'text-amber-300 border-amber-500/60 bg-amber-950/70 shadow-amber-500/25',
        dot: 'bg-amber-400',
      };
    }

    switch (gesture) {
      case 'DRAW':
        return {
          title: 'AIR DRAW',
          sub: 'Index Finger Pointing',
          color: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/60 shadow-emerald-500/20',
          dot: 'bg-emerald-400',
        };
      case 'FIST_ERASE':
        return {
          title: 'AIR ERASER',
          sub: 'Closed Fist Pose (Erases middle or ends)',
          color: 'text-rose-400 border-rose-500/50 bg-rose-950/60 shadow-rose-500/20',
          dot: 'bg-rose-400',
        };
      case 'SELECT':
        return {
          title: 'HOVER / INSPECT',
          sub: 'Peace Sign (Index + Middle)',
          color: 'text-purple-400 border-purple-500/50 bg-purple-950/60 shadow-purple-500/20',
          dot: 'bg-purple-400',
        };
      case 'OPEN_PALM':
        return {
          title: 'STOP / SLEEP TRIGGER',
          sub: 'Open Palm Extended',
          color: 'text-amber-400 border-amber-500/50 bg-amber-950/60 shadow-amber-500/20',
          dot: 'bg-amber-400',
        };
      case 'THUMBS_UP':
        return {
          title: 'START / WAKE',
          sub: 'Thumbs Up Active',
          color: 'text-cyan-400 border-cyan-500/50 bg-cyan-950/60 shadow-cyan-500/20',
          dot: 'bg-cyan-400',
        };
      default:
        return {
          title: isSimulated ? 'MOUSE SIMULATION' : 'SEARCHING HAND',
          sub: isSimulated ? 'Click & Drag to Draw' : 'Show hand to camera',
          color: 'text-slate-300 border-slate-700/60 bg-slate-950/70 shadow-black',
          dot: 'bg-slate-500',
        };
    }
  };

  const gestureInfo = getGestureDetails();

  return (
    <div className="absolute inset-0 pointer-events-none z-35 flex flex-col justify-between p-4 md:p-6 overflow-hidden select-none">
      {/* TOP HEADER BAR */}
      <div className="flex items-center justify-between w-full">
        {/* Brand & Camera Status Inline */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h1 className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 text-base md:text-xl drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              AURADRAW XR
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              v2.5 PRO
            </span>
          </div>

          {/* Camera / Simulator Mode Toggle Button */}
          <button
            onClick={onToggleSimulated}
            className={`pointer-events-auto px-2.5 py-1 rounded-full text-[11px] font-mono font-medium backdrop-blur-md border transition-all flex items-center gap-1.5 shadow-md ${
              isSimulated
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
            title="Click to toggle between physical camera and simulated air drawing"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isSimulated ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
            <span>{isSimulated ? 'SIMULATOR ACTIVE' : 'WEBCAM ON'}</span>
          </button>

          {/* SLEEP / START TOGGLE BUTTON */}
          <button
            onClick={onTogglePause}
            className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-mono font-bold transition-all shadow-md ${
              isPaused
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/30 animate-pulse'
                : 'bg-slate-900/80 text-amber-400 border-amber-500/40 hover:bg-amber-500/20 hover:text-amber-300'
            }`}
            title="Toggle between Sleep Mode and Active Drawing"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'RESUME / WAKE' : 'SLEEP / PAUSE'}</span>
          </button>
        </div>

        {/* TOP CENTER GESTURE STATE BADGE */}
        <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-300">
          <div className={`w-2.5 h-2.5 rounded-full ${gestureInfo.dot} animate-pulse`} />
          <div className="flex flex-col">
            <span className="font-mono font-bold tracking-wider text-xs uppercase text-white">
              {gestureInfo.title}
            </span>
            <span className="text-[9px] text-cyan-400/80 font-mono tracking-tight">
              {gestureInfo.sub}
            </span>
          </div>
        </div>

        {/* TOP RIGHT CONTROLS */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Audio Feedback Button */}
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 rounded-xl backdrop-blur-md bg-slate-900/60 border border-cyan-500/20 text-cyan-300 hover:text-white hover:border-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/20"
            title="Toggle Synthesizer Feedback Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Gesture Guide Button */}
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:text-white transition-all text-xs font-mono font-medium shadow-lg hover:shadow-cyan-500/20"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">GESTURE MANUAL</span>
          </button>

          {/* Tracking & Sensitivity Settings Button */}
          <button
            onClick={onOpenSettings}
            data-testid="open-settings-button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/30 hover:text-white transition-all text-xs font-mono font-bold shadow-lg hover:shadow-cyan-500/25 animate-pulse-slow"
            title="Adjust Gesture Detection Sensitivity, Anti-Jitter Smoothing & Handwriting Pen-Up"
          >
            <Sliders className="w-4 h-4 text-cyan-300" />
            <span className="hidden sm:inline">SETTINGS</span>
          </button>
        </div>
      </div>

      {/* SLEEP MODE FULLSCREEN BANNER OVERLAY */}
      {isPaused && (
        <div className="self-center flex flex-col items-center justify-center pointer-events-auto -mt-16">
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-950/90 border border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col items-center gap-3 text-center max-w-sm sm:max-w-md backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold">
              <Pause className="w-3.5 h-3.5" />
              <span>SYSTEM IN SLEEP MODE</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white font-mono tracking-wider">
              DRAWING PAUSED
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Moving your hand on the screen will not leave any marks or erase anything.
            </p>
            <div className="flex flex-col gap-1.5 w-full bg-slate-900/70 p-3 rounded-2xl border border-slate-800 text-[11px] font-mono text-cyan-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">START GESTURE:</span>
                <span className="font-bold text-emerald-400">☝️ Point Index or 👍 Thumbs Up</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">STOP GESTURE:</span>
                <span className="font-bold text-amber-300">🖐️ Open Palm</span>
              </div>
            </div>
            <button
              onClick={onTogglePause}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-mono font-bold text-xs tracking-wider shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              CLICK OR SHOW ☝️ TO WAKE
            </button>
          </div>
        </div>
      )}

      {/* LOWER TELEMETRY DOCKS */}
      <div className="flex items-end justify-between w-full mb-36 px-2">
        {/* Left Telemetry: Finger Sensor Radar */}
        <div className="flex flex-col gap-2 p-3 rounded-2xl backdrop-blur-xl bg-slate-950/80 border border-cyan-500/25 text-xs font-mono text-slate-300 shadow-2xl max-w-xs">
          <div className="flex items-center justify-between gap-4 text-[11px] text-cyan-400 font-bold border-b border-cyan-500/20 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              SKELETON TELEMETRY
            </span>
            <span className="text-[10px] text-cyan-500/70 uppercase">
              {isPaused ? 'STANDBY' : handDetection ? 'TRACKED' : 'READY'}
            </span>
          </div>

          {/* Finger Sensor Array */}
          <div className="grid grid-cols-5 gap-1 text-center py-1">
            {[
              { label: 'THU', active: fingers.thumb },
              { label: 'IND', active: fingers.index },
              { label: 'MID', active: fingers.middle },
              { label: 'RNG', active: fingers.ring },
              { label: 'PIN', active: fingers.pinky },
            ].map((f) => (
              <div
                key={f.label}
                className={`flex flex-col items-center p-1 rounded border transition-all ${
                  f.active
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold shadow-sm shadow-cyan-500/20'
                    : 'border-slate-800 bg-slate-900/40 text-slate-600'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full mb-1 ${
                    f.active ? 'bg-cyan-400 animate-ping' : 'bg-slate-700'
                  }`}
                />
                <span className="text-[9px]">{f.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              Strokes: <b className="text-white ml-0.5">{strokeCount}</b>
            </span>
            <span>
              Status: <b className={isPaused ? 'text-amber-400' : 'text-emerald-400'}>
                {isPaused ? 'SLEEPING' : 'ACTIVE'}
              </b>
            </span>
          </div>
        </div>

        {/* Right Info: Air Gesture Hotkeys Quick Legend */}
        <div className="hidden lg:flex flex-col gap-1.5 p-3 rounded-2xl backdrop-blur-xl bg-slate-950/80 border border-cyan-500/25 text-slate-300 text-xs font-mono shadow-2xl">
          <div className="text-[10px] tracking-wider text-cyan-400 font-bold uppercase mb-0.5">
            GESTURE HOTKEYS (NO PINCH)
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px]">
              ☝ Point
            </span>
            <span>Draw in Air / Wake</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
              🖐️ Palm
            </span>
            <span>Stop / Enter Sleep Mode</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px]">
              ✊ Fist
            </span>
            <span>Enhanced Air Eraser (Middle &amp; Ends)</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px]">
              ✌ Peace
            </span>
            <span>Hover / Navigate Mode</span>
          </div>
        </div>
      </div>
    </div>
  );
};
