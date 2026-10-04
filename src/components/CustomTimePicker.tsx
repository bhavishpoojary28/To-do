import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
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
  onSelectTime?: (date: Date) => void;
  onClose?: () => void;
}

export const CustomTimePicker = ({
  initialDateIso,
  onSave,
  onCancel,
  embedded = false,
  onSelectTime,
  onClose,
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
  const [dialMode, setDialMode] = useState<'hours' | 'minutes'>('hours');
  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);

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

  // Set hour in 12-hour format
  const setHour12 = useCallback((h: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      const isPm = next.getHours() >= 12;
      let h24 = h % 12;
      if (isPm) h24 += 12;
      next.setHours(h24);
      return next;
    });
  }, []);

  // Set minute
  const setMinuteVal = useCallback((m: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setMinutes(m);
      return next;
    });
  }, []);

  // Toggle or set AM/PM
  const handleSetMeridiem = (target: 'AM' | 'PM') => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      const h = next.getHours();
      if (target === 'PM' && h < 12) {
        next.setHours(h + 12);
      } else if (target === 'AM' && h >= 12) {
        next.setHours(h - 12);
      }
      return next;
    });
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  // Convert pointer event into radial angle & update hour/minute
  const updateFromPointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      // Angle in degrees from 12 o'clock clockwise
      const rad = Math.atan2(dy, dx);
      let deg = (rad * 180) / Math.PI + 90;
      if (deg < 0) deg += 360;

      if (dialMode === 'hours') {
        let h = Math.round(deg / 30);
        if (h === 0) h = 12;
        setHour12(h);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(10);
        }
      } else {
        const m = Math.round(deg / 6) % 60;
        setMinuteVal(m);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(6);
        }
      }
    },
    [dialMode, setHour12, setMinuteVal]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    updateFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.preventDefault();
      updateFromPointer(e);
    }
  };

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (dialMode === 'hours') {
        setTimeout(() => {
          setDialMode('minutes');
        }, 150);
      }
    }
  };

  // Quick preset offsets from current moment
  const handleQuickAdd = (secondsOrMinutes: number, isSeconds = false) => {
    const ms = isSeconds ? secondsOrMinutes * 1000 : secondsOrMinutes * 60000;
    const next = new Date(Date.now() + ms);
    setSelectedDate(next);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12);
    }
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

  // Calculations for Clock Dial Positions (center is 128, 128 in a 256x256 circle)
  const dialRadius = 94;
  const centerCoord = 128;

  // Active Hand Angle in Radians
  const activeAngleDeg =
    dialMode === 'hours'
      ? currentHour12 * 30 - 90
      : currentMinutes * 6 - 90;
  const activeAngleRad = (activeAngleDeg * Math.PI) / 180;
  const handTipX = centerCoord + dialRadius * Math.cos(activeAngleRad);
  const handTipY = centerCoord + dialRadius * Math.sin(activeAngleRad);

  // Hour Dial Numbers: 1 to 12
  const hourNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  // Minute Dial Major Numbers: 00, 05, ..., 55
  const minuteNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // 60 Tick Marks for Minutes mode
  const minuteTicks = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {
      const deg = i * 6 - 90;
      const rad = (deg * Math.PI) / 180;
      const r = i % 5 === 0 ? 110 : 112;
      return {
        idx: i,
        isMajor: i % 5 === 0,
        x: centerCoord + r * Math.cos(rad),
        y: centerCoord + r * Math.sin(rad),
      };
    });
  }, []);

  // Relative preview calculation
  const preview = useMemo(() => {
    const iso = selectedDate.toISOString();
    const relative = formatRelativeReminder(iso);
    const full = formatFullDateTime(selectedDate);
    return { iso, relative, full };
  }, [selectedDate]);

  const handleConfirm = () => {
    onSave(preview.iso);
    onSelectTime?.(selectedDate);
    onClose?.();
  };

  const handleDismiss = () => {
    onCancel?.();
    onClose?.();
  };

  const handleClear = () => {
    onSave(null);
    onClose?.();
  };

  const containerClass = embedded
    ? 'relative overflow-hidden bg-zinc-950/85 backdrop-blur-2xl border border-rose-500/20 shadow-2xl shadow-rose-950/40 rounded-3xl p-4 sm:p-5 space-y-4 text-left'
    : 'relative overflow-hidden bg-zinc-950/85 backdrop-blur-2xl border border-rose-500/20 shadow-2xl shadow-rose-950/40 rounded-3xl p-6 space-y-4 text-left';

  return (
    <div className={containerClass}>
      {/* Ambient radial background glow behind dial */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-rose-500/30 to-amber-500/30 border border-rose-500/40 flex items-center justify-center text-rose-300">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black tracking-wider uppercase text-zinc-100">
            Customize Alert Time
          </span>
        </div>
        {(onCancel || onClose) && (
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-zinc-500 hover:text-zinc-200 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Presets Chips with energetic glowing styling */}
      <div className="relative space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Quick Presets
          </label>
          <span className="text-[10px] text-zinc-500 font-mono">Tap for instant alert</span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickAdd(30, true)}
            title="Alert in 30 seconds"
            className="border border-zinc-800 bg-zinc-900/60 hover:border-rose-500/40 hover:bg-rose-500/10 text-xs font-semibold rounded-xl py-2 px-1 text-center transition-all active:scale-95 text-zinc-300 hover:text-rose-300"
          >
            +30s
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd(1)}
            className="border border-zinc-800 bg-zinc-900/60 hover:border-rose-500/40 hover:bg-rose-500/10 text-xs font-semibold rounded-xl py-2 px-1 text-center transition-all active:scale-95 text-zinc-300 hover:text-rose-300"
          >
            +1m
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd(5)}
            className="border border-zinc-800 bg-zinc-900/60 hover:border-rose-500/40 hover:bg-rose-500/10 text-xs font-semibold rounded-xl py-2 px-1 text-center transition-all active:scale-95 text-zinc-300 hover:text-rose-300"
          >
            +5m
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd(15)}
            className="border border-zinc-800 bg-zinc-900/60 hover:border-rose-500/40 hover:bg-rose-500/10 text-xs font-semibold rounded-xl py-2 px-1 text-center transition-all active:scale-95 text-zinc-300 hover:text-rose-300"
          >
            +15m
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd(60)}
            className="border border-zinc-800 bg-zinc-900/60 hover:border-rose-500/40 hover:bg-rose-500/10 text-xs font-semibold rounded-xl py-2 px-1 text-center transition-all active:scale-95 text-zinc-300 hover:text-rose-300"
          >
            +1h
          </button>
        </div>
      </div>

      {/* Target Date Segmented Control */}
      <div className="relative space-y-1.5">
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

      {/* Digital Readout Header (Above Dial) */}
      <div className="relative pt-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Hour Mode Button */}
          <button
            type="button"
            onClick={() => setDialMode('hours')}
            className={`px-3.5 py-1 rounded-2xl font-mono text-4xl font-extrabold tracking-tight transition-all active:scale-95 ${
              dialMode === 'hours'
                ? 'bg-rose-500/20 text-white border-2 border-rose-400 shadow-[0_0_24px_rgba(244,63,94,0.4)]'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
            title="Click to select Hour on clock"
          >
            {String(currentHour12).padStart(2, '0')}
          </button>

          <span className="text-3xl font-extrabold text-zinc-500 animate-pulse font-mono">:</span>

          {/* Minute Mode Button */}
          <button
            type="button"
            onClick={() => setDialMode('minutes')}
            className={`px-3.5 py-1 rounded-2xl font-mono text-4xl font-extrabold tracking-tight transition-all active:scale-95 ${
              dialMode === 'minutes'
                ? 'bg-rose-500/20 text-white border-2 border-rose-400 shadow-[0_0_24px_rgba(244,63,94,0.4)]'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
            title="Click to select Minute on clock"
          >
            {String(currentMinutes).padStart(2, '0')}
          </button>
        </div>

        {/* Sleek Pill Toggle for AM / PM with active glowing pill */}
        <div className="flex items-center p-1 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-inner gap-1">
          <button
            type="button"
            onClick={() => handleSetMeridiem('AM')}
            className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all active:scale-95 ${
              currentMeridiem === 'AM'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => handleSetMeridiem('PM')}
            className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all active:scale-95 ${
              currentMeridiem === 'PM'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            PM
          </button>
        </div>
      </div>

      {/* Mode hint badge */}
      <div className="text-center">
        <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300">
          {dialMode === 'hours'
            ? 'Tap or drag hour hand (1 - 12)'
            : 'Tap or drag minute hand (00 - 59)'}
        </span>
      </div>

      {/* Analog Clock Face (SVG + Interactive Radial Dial) */}
      <div
        ref={dialRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setIsDragging(false)}
        className="w-64 h-64 mx-auto relative rounded-full bg-zinc-900/90 border border-zinc-800 shadow-[inset_0_4px_24px_rgba(0,0,0,0.8)] flex items-center justify-center select-none my-2 cursor-pointer touch-none"
      >
        {/* SVG Hand & Dial Graphics */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 256 256"
        >
          <defs>
            <linearGradient
              id="clockHandGradient"
              x1="128"
              y1="128"
              x2={handTipX}
              y2={handTipY}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="1" />
            </linearGradient>
            <filter id="dialGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="4"
                floodColor="#f43f5e"
                floodOpacity="0.7"
              />
            </filter>
          </defs>

          {/* Clock Dial Inner Decorative Rings */}
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
            fill="none"
          />
          <circle
            cx="128"
            cy="128"
            r="94"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
            strokeDasharray="3 3"
            fill="none"
          />

          {/* Minute Tick Marks in Minutes Mode */}
          {dialMode === 'minutes' &&
            minuteTicks.map((tick) => (
              <circle
                key={tick.idx}
                cx={tick.x}
                cy={tick.y}
                r={tick.isMajor ? '2' : '1'}
                fill={tick.isMajor ? '#a1a1aa' : '#52525b'}
                opacity={tick.isMajor ? 0.8 : 0.4}
              />
            ))}

          {/* Dynamic Hand Line reaching out to active selection */}
          <line
            x1="128"
            y1="128"
            x2={handTipX}
            y2={handTipY}
            stroke="url(#clockHandGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#dialGlow)"
          />

          {/* Center Pivot Dot */}
          <circle
            cx="128"
            cy="128"
            r="6"
            fill="#f43f5e"
            filter="url(#dialGlow)"
          />
          <circle cx="128" cy="128" r="2.5" fill="#ffffff" />

          {/* Luminous Circular Selector Head at Hand Tip */}
          <circle
            cx={handTipX}
            cy={handTipY}
            r="18"
            fill="rgba(244, 63, 94, 0.25)"
            stroke="#fb7185"
            strokeWidth="2"
            filter="url(#dialGlow)"
          />
          <circle
            cx={handTipX}
            cy={handTipY}
            r="3.5"
            fill="#ffffff"
          />
        </svg>

        {/* Radial Numbers on Clock Face */}
        {dialMode === 'hours'
          ? hourNumbers.map((num) => {
              const deg = num * 30 - 90;
              const rad = (deg * Math.PI) / 180;
              const x = centerCoord + dialRadius * Math.cos(rad);
              const y = centerCoord + dialRadius * Math.sin(rad);
              const isSelected = currentHour12 === num;

              return (
                <div
                  key={num}
                  style={{
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-sm font-bold transition-all pointer-events-none ${
                    isSelected
                      ? 'text-white font-black drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] scale-110'
                      : 'text-zinc-300'
                  }`}
                >
                  {num}
                </div>
              );
            })
          : minuteNumbers.map((min) => {
              const deg = min * 6 - 90;
              const rad = (deg * Math.PI) / 180;
              const x = centerCoord + dialRadius * Math.cos(rad);
              const y = centerCoord + dialRadius * Math.sin(rad);
              const isSelected = currentMinutes === min;

              return (
                <div
                  key={min}
                  style={{
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all pointer-events-none ${
                    isSelected
                      ? 'text-white font-black drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] scale-110'
                      : 'text-zinc-300'
                  }`}
                >
                  {String(min).padStart(2, '0')}
                </div>
              );
            })}
      </div>

      {/* Live Preview Card with Cyber Glow Backing */}
      <div className="relative p-3 rounded-2xl backdrop-blur-xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-zinc-900/50 border border-white/10 flex items-center gap-2.5">
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

      {/* Action Buttons */}
      <div className="relative flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleClear}
          className="py-3.5 px-4 rounded-2xl bg-white/[0.04] hover:bg-rose-950/30 border border-white/10 hover:border-rose-800/50 text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          className="flex-1 py-3.5 px-4 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Confirm Alert Time</span>
        </button>
      </div>
    </div>
  );
};
