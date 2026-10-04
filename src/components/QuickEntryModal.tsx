import { useState, useEffect, useRef, type KeyboardEvent, type FormEvent } from 'react';
import { X, CheckSquare, FileText, Clock, Tag, Sparkles, SlidersHorizontal } from 'lucide-react';
import type { ItemType } from '../types/app';
import { parseTaskDate } from '../utils/nlpDateParser';
import { formatRelativeReminder } from '../utils/date';
import { CustomTimePicker } from './CustomTimePicker';

interface QuickEntryModalProps {
  isOpen: boolean;
  type: ItemType;
  onClose: () => void;
  onSave: (data: {
    type: ItemType;
    title: string;
    content: string;
    tags: string[];
    reminderAt: string | null;
  }) => void;
}

export const QuickEntryModal = ({
  isOpen,
  type,
  onClose,
  onSave,
}: QuickEntryModalProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [reminderAt, setReminderAt] = useState<string | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setTagInput('');
      setTags([]);
      setReminderAt(null);
      setShowCustomPicker(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, type]);

  // If in task mode, automatically detect dates in title as user types
  useEffect(() => {
    if (type === 'task' && title && !reminderAt) {
      const parsed = parseTaskDate(title);
      if (parsed.reminderAt) {
        setReminderAt(parsed.reminderAt);
      }
    }
  }, [title, type, reminderAt]);

  if (!isOpen) return null;

  const handleAddTag = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleaned = tagInput.trim().replace(/^#/, '');
      if (cleaned && !tags.includes(cleaned)) {
        setTags([...tags, cleaned]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    // Check if remaining tag input exists
    let finalTags = [...tags];
    const cleanedTag = tagInput.trim().replace(/^#/, '');
    if (cleanedTag && !finalTags.includes(cleanedTag)) {
      finalTags.push(cleanedTag);
    }

    onSave({
      type,
      title: title.trim() || (type === 'task' ? 'Quick Task' : 'Scratchpad Note'),
      content: content.trim(),
      tags: finalTags,
      reminderAt: type === 'task' ? reminderAt : null,
    });
    onClose();
  };

  const reminderInfo = reminderAt ? formatRelativeReminder(reminderAt) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg backdrop-blur-3xl bg-zinc-950/90 border border-white/15 rounded-t-3xl sm:rounded-3xl p-5 shadow-[0_20px_60px_0_rgba(0,0,0,0.8)] space-y-4 max-h-[90vh] overflow-y-auto pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center border border-white/10 ${
                type === 'task'
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {type === 'task' ? <CheckSquare className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <h2 className="text-sm font-black text-zinc-100">
              {type === 'task' ? 'New Quick Task' : 'Quick Scratchpad Note'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Title
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'task' ? 'e.g., Deploy staging build tomorrow at 3 pm' : 'e.g., Architecture brainstorm'}
              className="w-full backdrop-blur-md bg-white/[0.04] border border-white/10 rounded-2xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-400/50 focus:bg-white/[0.07] transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              {type === 'task' ? 'Notes / Details (Optional)' : 'Content / Body'}
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={type === 'task' ? 'Additional context or checklist items...' : 'Write your raw thoughts, snippet, or scratchpad...'}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-600 transition-all resize-none"
            />
          </div>

          {/* Task Reminder configuration */}
          {type === 'task' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  Task Reminder
                </label>
                {reminderInfo && (
                  <button
                    type="button"
                    onClick={() => setReminderAt(null)}
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    Clear reminder
                  </button>
                )}
              </div>

              {reminderInfo && (
                <button
                  type="button"
                  onClick={() => setShowCustomPicker(true)}
                  className="w-full text-left p-2.5 bg-indigo-950/30 hover:bg-indigo-950/50 border border-indigo-700/40 rounded-xl flex items-center justify-between text-xs text-indigo-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-semibold text-zinc-300">Scheduled:</span>
                    <span className="font-mono font-medium text-zinc-100">{reminderInfo.label}</span>
                  </div>
                  <span className="text-[10px] text-indigo-400 hover:underline">Tap to customize</span>
                </button>
              )}

              {/* Quick Presets */}
              <div className="grid grid-cols-5 gap-1">
                <button
                  type="button"
                  onClick={() => setReminderAt(new Date(Date.now() + 60000).toISOString())}
                  className="py-1.5 px-1 text-[11px] font-semibold bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-800/60 rounded-xl text-rose-300 transition-colors"
                >
                  +1m
                </button>
                <button
                  type="button"
                  onClick={() => setReminderAt(new Date(Date.now() + 5 * 60000).toISOString())}
                  className="py-1.5 px-1 text-[11px] font-semibold bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 hover:border-rose-800/60 rounded-xl text-rose-300 transition-colors"
                >
                  +5m
                </button>
                <button
                  type="button"
                  onClick={() => setReminderAt(new Date(Date.now() + 15 * 60000).toISOString())}
                  className="py-1.5 px-1 text-[11px] font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 transition-colors"
                >
                  +15m
                </button>
                <button
                  type="button"
                  onClick={() => setReminderAt(new Date(Date.now() + 3600000).toISOString())}
                  className="py-1.5 px-1 text-[11px] font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 transition-colors"
                >
                  +1h
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tmrw = new Date();
                    tmrw.setDate(tmrw.getDate() + 1);
                    tmrw.setHours(9, 0, 0, 0);
                    setReminderAt(tmrw.toISOString());
                  }}
                  className="py-1.5 px-1 text-[11px] font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 transition-colors"
                >
                  Tmrw 9a
                </button>
              </div>

              {/* Toggle Custom Time Picker */}
              {!showCustomPicker ? (
                <button
                  type="button"
                  onClick={() => setShowCustomPicker(true)}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 text-xs font-semibold text-rose-300 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
                  <span>Customize Date, Hour & Minute...</span>
                </button>
              ) : (
                <CustomTimePicker
                  initialDateIso={reminderAt}
                  onSave={(iso) => {
                    setReminderAt(iso);
                    setShowCustomPicker(false);
                  }}
                  onCancel={() => setShowCustomPicker(false)}
                  embedded
                />
              )}
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Tags (Press enter to add)
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-zinc-900 border border-zinc-800 rounded-xl">
              {tags.map((t) => (
                <span
                  key={t}
                  className="text-xs bg-zinc-800 text-zinc-200 px-2 py-0.5 rounded-md flex items-center gap-1"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? 'Type tag and press enter...' : ''}
                className="bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none flex-1 min-w-[100px]"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 text-xs font-semibold rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() && !content.trim()}
              className={`py-3 px-6 text-xs font-black rounded-2xl transition-all shadow-xl active:scale-95 border ${
                type === 'task'
                  ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:brightness-110 text-white shadow-rose-500/30 border-rose-400/40'
                  : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 text-zinc-950 shadow-amber-500/30 border-amber-300/40'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              Save {type === 'task' ? 'Task' : 'Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
