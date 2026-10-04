import { Bell, Check, Clock, Volume2 } from 'lucide-react';
import type { CaptureItem } from '../types/app';
import { playNotificationChime } from '../utils/notifications';

interface TaskAlertModalProps {
  item: CaptureItem | null;
  onClose: () => void;
  onComplete: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
}

export const TaskAlertModal = ({
  item,
  onClose,
  onComplete,
  onSnooze,
}: TaskAlertModalProps) => {
  if (!item) return null;

  const handleComplete = () => {
    onComplete(item.id);
    onClose();
  };

  const handleSnooze = (minutes: number) => {
    onSnooze(item.id, minutes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm backdrop-blur-3xl bg-zinc-950/90 border border-rose-500/40 rounded-3xl p-6 shadow-[0_20px_60px_0_rgba(244,63,94,0.35)] space-y-5 text-center relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 animate-pulse" />

        {/* Ringing Bell Animation with Neon Aura */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-rose-500/35 animate-ping" />
          <span className="absolute inset-2 rounded-full bg-rose-500/25 animate-pulse" />
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-xl shadow-rose-500/40 text-white border border-white/20">
            <Bell className="w-7 h-7 animate-bounce stroke-[2.2]" />
          </div>
        </div>

        {/* Header Content */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold uppercase tracking-wider shadow-sm">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>Task Due Now</span>
          </div>

          <h3 className="text-lg font-black text-zinc-100 tracking-tight break-words px-2">
            {item.title}
          </h3>

          {item.content && (
            <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed px-2">
              {item.content}
            </p>
          )}
        </div>

        {/* Sound replay button */}
        <button
          type="button"
          onClick={playNotificationChime}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-3.5 py-1.5 rounded-full backdrop-blur-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 active:scale-95 transition-all shadow-sm"
        >
          <Volume2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Play Chime Again</span>
        </button>

        {/* Cool Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Complete Button */}
          <button
            type="button"
            onClick={handleComplete}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:brightness-110 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all border border-emerald-300/40"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Mark Complete</span>
          </button>

          {/* Snooze Presets with Glass Sheen */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSnooze(5)}
              className="py-2.5 px-3 rounded-2xl backdrop-blur-md bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Snooze 5m</span>
            </button>
            <button
              type="button"
              onClick={() => handleSnooze(15)}
              className="py-2.5 px-3 rounded-2xl backdrop-blur-md bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Snooze 15m</span>
            </button>
          </div>

          {/* Dismiss */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
