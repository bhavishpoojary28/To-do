import { useState, useMemo, useEffect } from 'react';
import {
  Clock,
  Plus,
  Minus,
  Sparkles,
  Check,
  X,
  RotateCcw,
  Calendar,
  Zap,
} from 'lucide-react';
import { formatRelativeReminder, formatFullDateTime } from '../utils/date';

interface CustomTimePickerProps {
  initialDateIso?: string | null;
  onSave: (dateIso: string | null) => void;
  onCancel?: () => void;
  embedded?: boolean;
}

export const CustomTimePicker = ({
  initialDateIso,
  onSave,
  onCancel,
  embedded = false,
}: CustomTimePickerProps) => {
  // Initialize state based on initialDateIso or default to now + 5 mins
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (initialDateIso) {
      const d = new Date(initialDateIso);
      if (!isNaN(d.getTime())) return d;
    }
    const defaultDate = new Date();
    defaultDate.setMinutes(defaultDate.getMinutes() + 5);
    defaultDate.setSeconds(0, 0);
    return defaultDate;
  });

  const [dateMode, setDateMode] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [customDateStr, setCustomDateStr] = useState<string>('');

  // 12-Hour format state
  const hours24 = selectedDate.getHours();
  const currentHour12 = hours24 % 12 || 12;
  const currentMinutes = selectedDate.getMinutes();
  const currentMeridiem = hours24 >= 12 ? 'PM' : 'AM';

  // Sync date mode with selected date
  useEffect(() => {
    const now = new Date();
    const isToday =
      selectedDate.getDate() === now.getDate() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getFullYear() === now.getFullYear();

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      selectedDate.getDate() === tomorrow.getDate() &&
      selectedDate.getMonth() === tomorrow.getMonth() &&
      selectedDate.getFullYear() === tomorrow.getFullYear();

    if (isToday) {
      setDateMode('today');
    } else if (isTomorrow) {
      setDateMode('tomorrow');
    } else {
      setDateMode('custom');
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      setCustomDateStr(`${yyyy}-${mm}-${dd}`);
    }
  }, [selectedDate]);

  // Adjust hours in 12-hour format
  const handleHourChange = (delta: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      let h = next.getHours() + delta;
      if (h < 0) h = 23;
      if (h > 23) h = 0;
      next.setHours(h);
      return next;
    });
  };

  // Adjust minutes by any amount
  const handleMinuteChange = (delta: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      let m = next.getMinutes() + delta;
      if (m < 0) m = 59;
      if (m > 59) m = 0;
      next.setMinutes(m);
      return next;
    });
  };

  // Type any exact hour directly (1-12)
  const handleDirectHourInput = (val: string) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return;
    const clamped = Math.max(1, Math.min(12, parsed));
    setSelectedDate((prev) => {
      const next = new Date(prev);
      const isPm = next.getHours() >= 12;
      let h24 = clamped % 12;
      if (isPm) h24 += 12;
      next.setHours(h24);
      return next;
    });
  };

  // Type any exact minute directly (0-59)
  const handleDirectMinuteInput = (val: string) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return;
    const clamped = Math.max(0, Math.min(59, parsed));
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setMinutes(clamped);
      return next;
    });
  };

  // Set exact minutes (:00, :15, :30, :45)
  const handleSetExactMinutes = (min: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setMinutes(min);
      return next;
    });
  };

  // Toggle AM / PM
  const handleToggleMeridiem = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      const h = next.getHours();
      if (h >= 12) {
        next.setHours(h - 12);
      } else {
        next.setHours(h + 12);
      }
      return next;
    });
  };

  // Quick preset offsets from current moment (e.g. 30 seconds, 1 min, 5 min)
  const handleQuickAdd = (secondsOrMinutes: number, isSeconds = false) => {
    const ms = isSeconds ? secondsOrMinutes * 1000 : secondsOrMinutes * 60000;
    const next = new Date(Date.now() + ms);
    setSelectedDate(next);
  };

  // Date mode change
  const handleDateMode = (mode: 'today' | 'tomorrow' | 'custom') => {
    setDateMode(mode);
    const now = new Date();
    setSelectedDate((prev) => {
      const next = new Date(prev);
      if (mode === 'today') {
        next.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (mode === 'tomorrow') {
        const tmrw = new Date(now);
        tmrw.setDate(tmrw.getDate() + 1);
        next.setFullYear(tmrw.getFullYear(), tmrw.getMonth(), tmrw.getDate());
      }
      return next;
    });
  };

  const handleCustomDateInput = (val: string) => {
    setCustomDateStr(val);
    if (!val) return;
    const parts = val.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      setSelectedDate((prev) => {
        const next = new Date(prev);
        next.setFullYear(y, m, d);
        return next;
      });
    }
  };

  // Relative preview calculation
  const preview = useMemo(() => {
    const iso = selectedDate.toISOString();
    const relative = formatRelativeReminder(iso);
    const full = formatFullDateTime(selectedDate);
    return { iso, relative, full };
  }, [selectedDate]);

  const containerClass = embedded
    ? 'space-y-3.5 backdrop-blur-2xl bg-zinc-900/80 p-4 rounded-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]'
    : 'space-y-4 backdrop-blur-3xl bg-zinc-950/90 p-5 rounded-3xl border border-white/15 shadow-[0_16px_48px_0_rgba(0,0,0,0.6)]';

  return (
    <div className={containerClass}>
      {/* Glassy Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-rose-500/30 to-amber-500/30 border border-rose-500/40 flex items-center justify-center text-rose-300">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold tracking-tight text-zinc-100">
            Customize Alert Time
          </span>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Fast-Add Pills with Glass Sheen */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Quick Presets
          </label>
          <span className="text-[10px] text-zinc-500">Tap to set instantly</span>
        </div>

        <div className="grid grid-cols-6 gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickAdd(30, true)}
            title="Alert in 30 seconds (best for testing mobile lock screen)"
            className="py-1.5 px-1 text-[11px] font-bold rounded-xl backdrop-blur-md bg-gradient-to-b from-rose-500/25 to-rose-600/10 hover:from-rose-500/35 hover:to-rose-600/20 border border-rose-500/40 text-rose-300 shadow-sm active:scale-95 transition-all"
          >
            +30s
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd(1)}
            className="py-1.5 px-1 text-[11px] font-bold rounded-xl backdrop-blur-md bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 text-zinc-200 active:scale-95 transition-all"
          >
            +1m
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd(2)}
            className="py-1.5 px-1 text-[11px] font-bold rounded-xl backdrop-blur-md bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 text-zinc-200 active:scale-95 transition-all"
          >
            +2m
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd(5)}
            className="py-1.5 px-1 text-[11px] font-bold rounded-xl backdrop-blur-md bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 text-zinc-200 active:scale-95 transition-all"
          >
            +5m
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd(15)}
            className="py-1.5 px-1 text-[11px] font-bold rounded-xl backdrop-blur-md bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 text-zinc-200 active:scale-95 transition-all"
          >
            +15m
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd(60)}
            className="py-1.5 px-1 text-[11px] font-bold rounded-xl backdrop-blur-md bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 text-zinc-200 active:scale-95 transition-all"
          >
            +1h
          </button>
        </div>
      </div>

      {/* Glassy Date Segmented Switch */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Target Date
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl backdrop-blur-md bg-white/[0.03] border border-white/10">
          <button
            type="button"
            onClick={() => handleDateMode('today')}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
              dateMode === 'today'
                ? 'bg-gradient-to-r from-zinc-800 to-zinc-700 text-white shadow-md border border-white/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleDateMode('tomorrow')}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
              dateMode === 'tomorrow'
                ? 'bg-gradient-to-r from-zinc-800 to-zinc-700 text-white shadow-md border border-white/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            Tomorrow
          </button>
          <button
            type="button"
            onClick={() => handleDateMode('custom')}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              dateMode === 'custom'
                ? 'bg-gradient-to-r from-zinc-800 to-zinc-700 text-white shadow-md border border-white/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Calendar className="w-3 h-3 text-rose-400" />
            <span>Pick Date</span>
          </button>
        </div>

        {dateMode === 'custom' && (
          <input
            type="date"
            value={customDateStr}
            onChange={(e) => handleCustomDateInput(e.target.value)}
            className="w-full mt-1.5 py-2 px-3 text-xs rounded-xl backdrop-blur-md bg-white/[0.05] border border-white/15 text-zinc-100 focus:outline-none focus:border-rose-400/60 transition-colors"
          />
        )}
      </div>

      {/* Glassy Time Dial: Hour, Minute, & AM/PM */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Exact Time
        </label>

        <div className="grid grid-cols-3 gap-2 items-center">
          {/* Hour Box */}
          <div className="backdrop-blur-md bg-white/[0.03] border border-white/10 hover:border-white/20 rounded-2xl p-2.5 flex flex-col items-center transition-colors">
            <span className="text-[9px] text-zinc-400 font-bold tracking-wider">HOUR</span>
            <div className="flex items-center justify-between w-full mt-1.5">
              <button
                type="button"
                onClick={() => handleHourChange(-1)}
                className="w-7 h-7 rounded-xl backdrop-blur-md bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 flex items-center justify-center text-zinc-200 active:scale-90 transition-all"
                aria-label="Decrease hour"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min={1}
                max={12}
                value={currentHour12}
                onChange={(e) => handleDirectHourInput(e.target.value)}
                className="w-10 text-center font-mono text-xl font-black text-zinc-100 bg-transparent focus:outline-none focus:bg-white/10 rounded-lg selection:bg-rose-500/30"
              />
              <button
                type="button"
                onClick={() => handleHourChange(1)}
                className="w-7 h-7 rounded-xl backdrop-blur-md bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 flex items-center justify-center text-zinc-200 active:scale-90 transition-all"
                aria-label="Increase hour"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Minute Box */}
          <div className="backdrop-blur-md bg-white/[0.03] border border-white/10 hover:border-white/20 rounded-2xl p-2.5 flex flex-col items-center transition-colors">
            <span className="text-[9px] text-zinc-400 font-bold tracking-wider">MINUTE</span>
            <div className="flex items-center justify-between w-full mt-1.5">
              <button
                type="button"
                onClick={() => handleMinuteChange(-1)}
                className="w-7 h-7 rounded-xl backdrop-blur-md bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 flex items-center justify-center text-zinc-200 active:scale-90 transition-all"
                aria-label="Decrease 1 minute"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min={0}
                max={59}
                value={String(currentMinutes).padStart(2, '0')}
                onChange={(e) => handleDirectMinuteInput(e.target.value)}
                className="w-10 text-center font-mono text-xl font-black text-zinc-100 bg-transparent focus:outline-none focus:bg-white/10 rounded-lg selection:bg-rose-500/30"
              />
              <button
                type="button"
                onClick={() => handleMinuteChange(1)}
                className="w-7 h-7 rounded-xl backdrop-blur-md bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 flex items-center justify-center text-zinc-200 active:scale-90 transition-all"
                aria-label="Increase 1 minute"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* AM / PM Glass Pill */}
          <div className="backdrop-blur-md bg-white/[0.03] border border-white/10 hover:border-white/20 rounded-2xl p-2.5 flex flex-col items-center justify-center transition-colors">
            <span className="text-[9px] text-zinc-400 font-bold tracking-wider">PERIOD</span>
            <button
              type="button"
              onClick={handleToggleMeridiem}
              className="mt-1.5 w-full py-1.5 px-2 rounded-xl backdrop-blur-lg bg-gradient-to-tr from-rose-500/20 to-amber-500/20 hover:from-rose-500/30 hover:to-amber-500/30 text-rose-300 font-black text-base tracking-widest border border-rose-500/40 shadow-sm active:scale-90 transition-all"
            >
              {currentMeridiem}
            </button>
          </div>
        </div>

        {/* Quick Minute Anchors */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {[0, 15, 30, 45].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleSetExactMinutes(m)}
              className={`flex-1 py-1 text-[11px] font-mono rounded-xl border transition-all ${
                currentMinutes === m
                  ? 'bg-rose-500/30 border-rose-500/60 text-rose-200 font-bold shadow-sm'
                  : 'bg-white/[0.03] border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              :{String(m).padStart(2, '0')}
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview Card with Glass Backing */}
      <div className="p-3 rounded-2xl backdrop-blur-xl bg-gradient-to-r from-rose-950/30 via-indigo-950/20 to-zinc-900/40 border border-white/10 flex items-center gap-2.5">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-zinc-100 truncate">
            {preview.full}
          </div>
          <div className="text-[11px] text-zinc-400 font-mono">
            {preview.relative.label}
          </div>
        </div>
      </div>

      {/* Cool Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSave(null)}
          className="flex-1 py-2.5 px-3 rounded-2xl backdrop-blur-md bg-white/[0.04] hover:bg-rose-950/30 border border-white/10 hover:border-rose-800/50 text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>

        <button
          type="button"
          onClick={() => onSave(preview.iso)}
          className="flex-[2] py-2.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:brightness-110 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 border border-rose-400/40 active:scale-95 transition-all"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Set Custom Time</span>
        </button>
      </div>
    </div>
  );
};
