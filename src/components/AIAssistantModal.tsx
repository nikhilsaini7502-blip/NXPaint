import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Sparkles, 
  Calculator, 
  Palette, 
  FileText, 
  Copy, 
  Check, 
  Loader2, 
  Send 
} from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  getCanvasSnapshot: () => string | null;
}

type AIAction = 'sketch-transform' | 'solve-math' | 'explain-diagram' | 'custom';

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  getCanvasSnapshot,
}) => {
  const [activeAction, setActiveAction] = useState<AIAction>('sketch-transform');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Capture canvas snapshot when modal opens
  React.useEffect(() => {
    if (isOpen) {
      const snap = getCanvasSnapshot();
      setPreviewImage(snap);
      setAnalysisResult(null);
    }
  }, [isOpen, getCanvasSnapshot]);

  if (!isOpen) return null;

  const handleRunAI = async () => {
    const snap = previewImage || getCanvasSnapshot();
    if (!snap) {
      alert('Draw something on the canvas first!');
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: snap,
          promptType: activeAction === 'custom' ? 'sketch-transform' : activeAction,
          customPrompt: activeAction === 'custom' ? customPrompt : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysisResult(data.analysis);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } else {
        setAnalysisResult(`Error: ${data.error || 'Failed to analyze sketch.'}`);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setAnalysisResult(`Network or server error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-950 border border-cyan-500/40 shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cyan-500/20 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-400 text-purple-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide font-mono flex items-center gap-2">
                GEMINI 3.8 VISION STUDIO
              </h2>
              <p className="text-xs text-cyan-400 font-mono">
                Multimodal AI analysis of your mid-air gesture artwork
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close AI Studio"
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Action Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              {
                id: 'sketch-transform',
                label: 'Art Masterpiece',
                desc: 'Prompt & Concept Art',
                icon: <Palette className="w-4 h-4 text-purple-400" />,
              },
              {
                id: 'solve-math',
                label: 'Solve Math',
                desc: 'Handwritten equations',
                icon: <Calculator className="w-4 h-4 text-emerald-400" />,
              },
              {
                id: 'explain-diagram',
                label: 'Explain Diagram',
                desc: 'Flowcharts & wireframes',
                icon: <FileText className="w-4 h-4 text-blue-400" />,
              },
              {
                id: 'custom',
                label: 'Custom Prompt',
                desc: 'Ask anything',
                icon: <Send className="w-4 h-4 text-pink-400" />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveAction(tab.id as AIAction)}
                className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                  activeAction === tab.id
                    ? 'border-cyan-400 bg-cyan-500/15 shadow-lg shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {tab.icon}
                  <span className="font-mono text-xs font-bold text-white">{tab.label}</span>
                </div>
                <span className="text-[10px] text-slate-400">{tab.desc}</span>
              </button>
            ))}
          </div>

          {/* Custom Prompt Input if Selected */}
          {activeAction === 'custom' && (
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300">Your Prompt for Gemini:</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Rate this drawing out of 10, explain what style it uses, and suggest improvements..."
                className="w-full h-20 p-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {/* Preview & Result Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Captured Sketch Preview */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono text-slate-400">DRAWING CAPTURE</span>
              <div className="relative aspect-video rounded-2xl bg-black border border-slate-800 overflow-hidden flex items-center justify-center">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Captured Air Drawing"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-500 font-mono">No drawing detected</span>
                )}
              </div>
            </div>

            {/* AI Output Result Box */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400">GEMINI INSIGHT</span>
                {analysisResult && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
              <div className="relative aspect-video rounded-2xl bg-slate-900/60 border border-cyan-500/30 p-3 overflow-y-auto text-xs font-mono text-slate-200 leading-relaxed whitespace-pre-wrap">
                {isLoading ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-cyan-400">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                    <span className="text-[11px] tracking-wide animate-pulse">
                      Analyzing pixels with Gemini 3.8 Flash...
                    </span>
                  </div>
                ) : analysisResult ? (
                  analysisResult
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                    <Sparkles className="w-6 h-6 mb-2 opacity-30" />
                    <span>Click &quot;Analyze with Gemini&quot; below to generate instant multimodal intelligence.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cyan-500/20 bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            Powered by Google GenAI SDK &amp; Gemini 3.8 Flash
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
            >
              Close
            </button>
            <button
              onClick={handleRunAI}
              disabled={isLoading || !previewImage}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-mono text-xs font-bold shadow-lg shadow-cyan-500/25 hover:opacity-95 disabled:opacity-40 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze with Gemini</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
