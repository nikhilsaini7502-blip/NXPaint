import React from 'react';
import { X, Hand, Sparkles, CheckCircle2 } from 'lucide-react';

interface GestureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GestureGuideModal: React.FC<GestureGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const GESTURE_ITEMS = [
    {
      emoji: '☝️',
      name: 'Air Draw (Pointing)',
      badge: 'DRAW MODE',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      description: 'Extend your index finger upwards while curling your other fingers. Move your hand to draw neon strokes in the air in real-time.',
    },
    {
      emoji: '✊',
      name: 'Closed Fist',
      badge: 'ENHANCED ERASER',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      description: 'Clench your hand into a fist. Cuts and wipes away strokes wherever your fist passes—even cutting lines directly through the middle into split segments!',
    },
    {
      emoji: '🖐️',
      name: 'Open Palm (Stop)',
      badge: 'SLEEP MODE',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'Spread all 5 fingers open to trigger Sleep Mode. Moving your hand on screen will not draw or erase anything until you wake it.',
    },
    {
      emoji: '👍',
      name: 'Thumbs Up (Start)',
      badge: 'WAKE SYSTEM',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      description: 'Give a thumbs up or point index finger to wake the system from Sleep Mode and immediately resume mid-air drawing.',
    },
    {
      emoji: '✌️',
      name: 'Peace Sign (V-Gesture)',
      badge: 'SELECT & HOVER',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      description: 'Raise your index and middle fingers together. Move your hand across the screen to hover without leaving any marks.',
    },
    {
      emoji: '⭕',
      name: 'Smart Shape Snap',
      badge: 'AUTO-GEOMETRY',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      description: 'Turn on SMART SHAPES on the toolbar. Draw a rough circle or rectangle in mid-air, and the app instantly snaps it to mathematical perfection with an audio chime.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-950 border border-cyan-500/40 shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cyan-500/20 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300">
              <Hand className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide font-mono">
                AIR GESTURE FLIGHT MANUAL
              </h2>
              <p className="text-xs text-cyan-400 font-mono">
                Control AuraDraw XR completely touch-free with your webcam
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Gesture Manual"
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Gestures */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 font-mono">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {GESTURE_ITEMS.map((item) => (
              <div
                key={item.name}
                className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{item.emoji}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{item.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pro Tips Box */}
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 space-y-2 mt-4 font-sans">
            <div className="font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase text-xs">
              <Sparkles className="w-4 h-4" /> Pro-Tips for Maximum Tracking Accuracy
            </div>
            <ul className="space-y-1 text-slate-300 text-xs list-disc list-inside">
              <li><b>Writing Words & Letters:</b> In Settings (⚙️), enable <i>Handwriting Preset</i> or <i>Air-Tap Depth</i> to write when pushed forward and lift pen when pulled back—preventing connecting lines between letters!</li>
              <li><b>Two-Finger Hover:</b> Spread index & middle (✌️ Peace Sign) to travel across the canvas without leaving ink marks.</li>
              <li>Keep your hand approximately 1.5 to 3 feet (45 to 90 cm) away from your webcam with good lighting.</li>
              <li>Toggle between <b>Webcam Live</b>, <b>Hologram Cyberpunk</b>, or <b>Dark Studio</b> modes using the backdrop buttons.</li>
              <li>If you don&apos;t have a webcam handy, click <b>SIMULATOR ACTIVE</b> at top-left to test effortlessly with your mouse or trackpad.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cyan-500/20 bg-slate-900/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-mono text-xs font-bold shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Got It, Let&apos;s Draw!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
