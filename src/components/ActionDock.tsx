import { Mic, Plus, FileText, Square } from 'lucide-react';

interface ActionDockProps {
  isListening: boolean;
  audioLevel?: number;
  onMicClick: () => void;
  onNewTaskClick: () => void;
  onNewNoteClick: () => void;
}

export const ActionDock = ({
  isListening,
  audioLevel = 0,
  onMicClick,
  onNewTaskClick,
  onNewNoteClick,
}: ActionDockProps) => {
  const handleMicTrigger = () => {
    // Haptic feedback trigger
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(50);
      } catch {
        // Safe ignore
      }
    }
    onMicClick();
  };

  return (
    <div className="fixed pb-safe bottom-4 inset-x-0 mx-auto max-w-sm px-4 z-40 pointer-events-none">
      <div className="backdrop-blur-2xl bg-zinc-950/80 border border-white/15 rounded-full p-2 px-5 shadow-[0_16px_48px_0_rgba(0,0,0,0.8)] flex items-center justify-between pointer-events-auto">
        {/* Left Flank: New Quick Task (+) */}
        <button
          type="button"
          onClick={onNewTaskClick}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-zinc-400 hover:text-zinc-100 rounded-2xl active:scale-95 transition-all group"
          aria-label="New Quick Task"
        >
          <div className="w-8 h-8 rounded-xl backdrop-blur-md bg-white/[0.05] group-hover:bg-white/[0.1] border border-white/10 group-hover:border-white/20 flex items-center justify-center text-zinc-200 shadow-sm transition-all">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold tracking-tight text-zinc-400 group-hover:text-zinc-200">Task</span>
        </button>

        {/* Center: Prominent Mic Button with Glassy Glow */}
        <div className="relative -mt-6">
          {/* Radar pulse animation layer when listening */}
          {isListening && (
            <>
              <span className="absolute -inset-2 rounded-full bg-rose-500/40 animate-ping pointer-events-none" />
              <span className="absolute -inset-1 rounded-full bg-rose-500/30 animate-pulse pointer-events-none" />
            </>
          )}

          <button
            type="button"
            onClick={handleMicTrigger}
            className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all active:scale-90 border border-white/25 ${
              isListening
                ? 'bg-gradient-to-tr from-rose-700 to-rose-500 text-white shadow-rose-600/50 ring-4 ring-rose-500/30'
                : 'bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-500 hover:brightness-110 text-white shadow-rose-500/35 hover:shadow-rose-500/50'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Start voice transcription'}
          >
            {isListening ? (
              <div className="flex flex-col items-center justify-center">
                {/* Live wave / decibel visualizer simulator */}
                <div className="flex items-center gap-0.5 h-4 mb-0.5">
                  {[0.4, 0.9, 0.6, 1.0, 0.5].map((multiplier, idx) => {
                    const dynamicScale = Math.max(0.2, (audioLevel || 0.4) * multiplier);
                    return (
                      <span
                        key={idx}
                        className="w-1 bg-white rounded-full transition-all duration-75"
                        style={{
                          height: `${Math.min(16, Math.max(4, dynamicScale * 16))}px`,
                        }}
                      />
                    );
                  })}
                </div>
                <Square className="w-3 h-3 fill-current text-white/90" />
              </div>
            ) : (
              <Mic className="w-6 h-6 stroke-[2.2]" />
            )}
          </button>
        </div>

        {/* Right Flank: Quick Scratchpad Note */}
        <button
          type="button"
          onClick={onNewNoteClick}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-zinc-400 hover:text-zinc-100 rounded-2xl active:scale-95 transition-all group"
          aria-label="Quick Scratchpad Note"
        >
          <div className="w-8 h-8 rounded-xl backdrop-blur-md bg-white/[0.05] group-hover:bg-white/[0.1] border border-white/10 group-hover:border-white/20 flex items-center justify-center text-zinc-200 shadow-sm transition-all">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold tracking-tight text-zinc-400 group-hover:text-zinc-200">Note</span>
        </button>
      </div>
    </div>
  );
};
