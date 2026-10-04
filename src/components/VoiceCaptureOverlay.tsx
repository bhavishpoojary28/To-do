import { useState, useMemo, useEffect } from 'react';
import {
  Mic,
  X,
  FileText,
  CheckSquare,
  Sparkles,
  Calendar,
  AlertTriangle,
  SlidersHorizontal,
} from 'lucide-react';
import { parseTaskDate } from '../utils/nlpDateParser';
import { formatRelativeReminder } from '../utils/date';
import { CustomTimePicker } from './CustomTimePicker';

interface VoiceCaptureOverlayProps {
  isOpen: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  audioDuration: number;
  audioLevel: number;
  onStopListening: () => void;
  onDiscard: () => void;
  onSaveAsNote: (text: string, duration: number) => void;
  onConvertToTask: (title: string, content: string, reminderAt: string | null, duration: number) => void;
}

export const VoiceCaptureOverlay = ({
  isOpen,
  isListening,
  transcript,
  interimTranscript,
  error,
  audioDuration,
  audioLevel,
  onStopListening,
  onDiscard,
  onSaveAsNote,
  onConvertToTask,
}: VoiceCaptureOverlayProps) => {
  const [overrideReminderAt, setOverrideReminderAt] = useState<string | null | undefined>(undefined);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOverrideReminderAt(undefined);
      setShowCustomPicker(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fullText = (transcript + (interimTranscript ? ` ${interimTranscript}` : '')).trim();

  // Natural language date parsing preview
  const parsedData = useMemo(() => {
    return parseTaskDate(fullText);
  }, [fullText]);

  const effectiveReminderAt =
    overrideReminderAt !== undefined ? overrideReminderAt : parsedData.reminderAt;

  const reminderInfo = effectiveReminderAt
    ? formatRelativeReminder(effectiveReminderAt)
    : null;

  // Format audio seconds to MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveNote = () => {
    if (!fullText) return;
    onSaveAsNote(fullText, audioDuration);
  };

  const handleConvertToTask = () => {
    if (!fullText) return;
    onConvertToTask(
      parsedData.title,
      fullText,
      effectiveReminderAt,
      audioDuration
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 pb-safe pt-safe animate-in fade-in duration-200 overflow-y-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            {isListening && (
              <span className="absolute w-3 h-3 rounded-full bg-rose-500 animate-ping opacity-75" />
            )}
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isListening ? 'bg-rose-500' : 'bg-zinc-600'
              }`}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              {isListening ? 'Transcribing Live' : 'Paused / Ready'}
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-rose-400 font-semibold tabular-nums">
              {formatTimer(audioDuration)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onDiscard}
          className="p-2 text-zinc-400 hover:text-zinc-100 rounded-full hover:bg-zinc-800/80 transition-colors"
          aria-label="Discard recording"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area: Transcript stream */}
      <div className="flex-1 my-6 flex flex-col justify-center max-w-xl mx-auto w-full px-2">
        {/* Dynamic Waveform Visualizer */}
        <div className="flex items-center justify-center gap-1.5 h-12 mb-6">
          {[0.2, 0.5, 0.8, 1.0, 0.7, 0.9, 0.4, 0.6, 0.3, 0.8, 0.5].map((factor, i) => {
            const height = isListening
              ? Math.max(6, Math.min(48, (audioLevel || 0.35) * 60 * factor + 6))
              : 6;
            return (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-75 ${
                  isListening ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-zinc-800'
                }`}
                style={{ height: `${height}px` }}
              />
            );
          })}
        </div>

        {/* Streaming text */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 min-h-[140px] max-h-[260px] overflow-y-auto shadow-inner relative">
          {fullText ? (
            <div className="text-base sm:text-lg text-zinc-100 leading-relaxed font-medium break-words">
              <span>{transcript}</span>
              {interimTranscript && (
                <span className="text-rose-400/90 italic font-normal ml-1 animate-pulse">
                  {interimTranscript}
                </span>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-6">
              <Mic className="w-8 h-8 mb-2 text-zinc-600 animate-pulse" />
              <p className="text-sm font-medium">Listening to your voice...</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                Speak naturally. Say keywords like &ldquo;comma&rdquo;, &ldquo;period&rdquo;, or &ldquo;new line&rdquo; to format punctuation. Auto-stops after 3.5s silence.
              </p>
            </div>
          )}
        </div>

        {/* Error notification if microphone fails */}
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Smart detected date preview / customize trigger */}
        {fullText && (
          <div className="mt-3 space-y-2">
            {reminderInfo ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-700/40 text-xs text-indigo-300 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold text-zinc-200">Scheduled:</span>
                  <span className="inline-flex items-center gap-1 font-mono text-indigo-200 bg-indigo-900/50 px-2 py-0.5 rounded-md">
                    <Calendar className="w-3 h-3 text-indigo-400" />
                    {reminderInfo.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomPicker(!showCustomPicker)}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 underline"
                >
                  {showCustomPicker ? 'Close' : 'Customize'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustomPicker(!showCustomPicker)}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-rose-300 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
                <span>+ Add Customized Task Time</span>
              </button>
            )}

            {/* Custom Time Picker */}
            {showCustomPicker && (
              <div className="animate-in fade-in duration-150">
                <CustomTimePicker
                  initialDateIso={effectiveReminderAt}
                  onSave={(newIso) => {
                    setOverrideReminderAt(newIso);
                    setShowCustomPicker(false);
                  }}
                  onCancel={() => setShowCustomPicker(false)}
                  embedded
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Bar at Bottom */}
      <div className="max-w-xl mx-auto w-full space-y-3">
        {/* Toggle Stop / Resume if manually controlling */}
        {isListening && (
          <div className="text-center">
            <button
              type="button"
              onClick={onStopListening}
              className="text-xs text-zinc-400 hover:text-zinc-200 underline decoration-zinc-700 underline-offset-4"
            >
              Stop recording & review
            </button>
          </div>
        )}

        {/* Dual / Triple Action Bar */}
        <div className="grid grid-cols-3 gap-2">
          {/* Cancel / Discard */}
          <button
            type="button"
            onClick={onDiscard}
            className="py-3 px-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <X className="w-4 h-4" />
            <span>Discard</span>
          </button>

          {/* Save as Note */}
          <button
            type="button"
            disabled={!fullText}
            onClick={handleSaveNote}
            className={`py-3 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
              fullText
                ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-100 shadow-sm'
                : 'bg-zinc-900/50 border-zinc-900 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Save Note</span>
          </button>

          {/* Convert to Task */}
          <button
            type="button"
            disabled={!fullText}
            onClick={handleConvertToTask}
            className={`py-3 px-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
              fullText
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25 ring-1 ring-rose-400/40'
                : 'bg-zinc-900/50 border border-zinc-900 text-zinc-600 cursor-not-allowed'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>To Task</span>
          </button>
        </div>
      </div>
    </div>
  );
};
