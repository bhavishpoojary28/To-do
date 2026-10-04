import { useState, useRef, type TouchEvent, type MouseEvent } from 'react';
import {
  Check,
  Clock,
  Mic,
  Tag,
  Trash2,
  AlertCircle,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import type { CaptureItem } from '../types/app';
import { formatRelativeReminder, formatCreatedAt } from '../utils/date';
import { CustomTimePicker } from './CustomTimePicker';

interface ItemCardProps {
  item: CaptureItem;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onSetReminder: (id: string, newDateIso: string | null) => void;
  onTagClick?: (tag: string) => void;
}

export const ItemCard = ({
  item,
  onToggleComplete,
  onDelete,
  onSetReminder,
  onTagClick,
}: ItemCardProps) => {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isTask = item.type === 'task';
  const reminderInfo = item.reminderAt ? formatRelativeReminder(item.reminderAt) : null;

  // Touch gesture handling for swipe-to-complete
  const handleTouchStart = (e: TouchEvent) => {
    if (!isTask) return;
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStartX === null || !isTask) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;
    // Allow dragging rightwards up to 90px
    if (diff > 0 && diff < 120) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isTask) return;
    if (swipeOffset > 60) {
      // Haptic feedback trigger
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(30);
        } catch {
          // Safe ignore
        }
      }
      onToggleComplete(item.id);
    }
    setSwipeOffset(0);
    setTouchStartX(null);
  };

  const handleReminderClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (item.reminderAt) {
      const confirmRemove = window.confirm(
        `Current reminder: ${reminderInfo?.label}\n\nWould you like to modify or clear this reminder? Click OK to modify/clear, Cancel to leave as is.`
      );
      if (confirmRemove) {
        setShowReminderPicker(true);
      }
    } else {
      setShowReminderPicker(true);
    }
  };

  return (
    <div className="relative group">
      {/* Background Swipe Reveal Indicator for Tasks */}
      {isTask && swipeOffset > 10 && (
        <div className="absolute inset-0 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center pl-5 text-emerald-400 font-semibold text-xs transition-opacity">
          <CheckCircle2 className="w-5 h-5 mr-2 animate-bounce" />
          <span>{item.isCompleted ? 'Mark Active' : 'Complete Task'}</span>
        </div>
      )}

      {/* Card Surface */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: swipeOffset > 0 ? `translateX(${swipeOffset}px)` : undefined,
          transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
        className={`backdrop-blur-2xl bg-zinc-900/65 border border-white/10 rounded-3xl p-4.5 shadow-xl shadow-black/50 active:scale-[0.99] transition-all relative overflow-hidden ${
          item.isCompleted ? 'opacity-65 bg-zinc-950/40 border-white/5' : 'hover:border-white/20'
        }`}
      >
        {/* Top Header inside card */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Interactive check button for tasks or icon for notes */}
            {isTask ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComplete(item.id);
                }}
                className={`mt-0.5 w-5 h-5 rounded-xl flex items-center justify-center border transition-all shrink-0 active:scale-90 ${
                  item.isCompleted
                    ? 'bg-gradient-to-tr from-emerald-400 to-teal-500 border-emerald-400 text-zinc-950 shadow-md shadow-emerald-500/30'
                    : 'border-white/20 hover:border-rose-400 bg-white/[0.04]'
                }`}
                aria-label={item.isCompleted ? 'Mark incomplete' : 'Mark complete'}
              >
                {item.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            ) : (
              <div className="mt-0.5 w-5 h-5 rounded-xl flex items-center justify-center backdrop-blur-md bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
            )}

            {/* Title & dynamic strike-through */}
            <div className="flex-1 min-w-0">
              <h3
                className={`text-sm font-semibold tracking-tight text-zinc-100 break-words ${
                  item.isCompleted ? 'animate-strike text-zinc-400' : ''
                }`}
              >
                {item.title || '(Untitled Capture)'}
              </h3>

              {item.content && (
                <p
                  className={`mt-1 text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap line-clamp-3 select-text ${
                    item.isCompleted ? 'line-through text-zinc-500' : ''
                  }`}
                >
                  {item.content}
                </p>
              )}
            </div>
          </div>

          {/* Delete Action button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="text-zinc-600 hover:text-rose-400 p-1 rounded-lg hover:bg-zinc-800/80 transition-colors shrink-0"
            title="Delete capture"
            aria-label="Delete capture"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Footer Meta Row: Reminder chip, audio draft, tags, timestamp */}
        <div className="mt-3.5 pt-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Quick reminder chip */}
            {reminderInfo ? (
              <button
                type="button"
                onClick={handleReminderClick}
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md border transition-all active:scale-95 shadow-sm ${
                  reminderInfo.isPast
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/50'
                    : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/50 shadow-indigo-950/30'
                }`}
                title="Tap to customize time"
              >
                {reminderInfo.isPast ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                )}
                <span>{reminderInfo.label}</span>
              </button>
            ) : (
              isTask && (
                <button
                  type="button"
                  onClick={handleReminderClick}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded-full backdrop-blur-md bg-white/[0.03] border border-dashed border-white/10 hover:border-white/20 transition-all active:scale-95"
                >
                  <Clock className="w-3 h-3 text-rose-400" />
                  <span>+ Reminder</span>
                </button>
              )
            )}

            {/* Audio Draft Indicator */}
            {item.audioDuration !== null && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md bg-rose-950/30 border border-rose-500/30 text-rose-300">
                <Mic className="w-3 h-3 text-rose-400" />
                <span>{item.audioDuration}s audio</span>
              </span>
            )}

            {/* Tag chips */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {item.tags.map((tag, idx) => (
                  <button
                    key={`${tag}-${idx}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTagClick?.(tag);
                    }}
                    className="text-xs backdrop-blur-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 px-2.5 py-0.5 rounded-lg transition-all inline-flex items-center gap-1 active:scale-95"
                  >
                    <Tag className="w-2.5 h-2.5 text-zinc-400" />
                    <span>#{tag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Time created */}
          <div className="text-[10px] text-zinc-500 font-mono tracking-tight shrink-0">
            {formatCreatedAt(item.createdAt)}
          </div>
        </div>

        {/* Inline Custom Time Picker Tray */}
        {showReminderPicker && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-3 animate-in fade-in duration-150"
          >
            <CustomTimePicker
              initialDateIso={item.reminderAt}
              onSave={(newIso) => {
                onSetReminder(item.id, newIso);
                setShowReminderPicker(false);
              }}
              onCancel={() => setShowReminderPicker(false)}
              embedded
            />
          </div>
        )}
      </div>
    </div>
  );
};
