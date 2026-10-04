import type { CaptureItem } from '../types/app';

const STORAGE_KEY = 'fast_capture_items_v1';

export const INITIAL_SEED_ITEMS: CaptureItem[] = [
  {
    id: 'seed-task-1',
    type: 'task',
    title: 'Review quarterly architecture sprint',
    content: 'Completed migration checklist, pruned stale dependencies, and validated benchmark numbers.',
    tags: ['Sprint', 'Arch'],
    isCompleted: true,
    reminderAt: null,
    audioDuration: null,
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now() - 14400000,
  },
  {
    id: 'seed-note-1',
    type: 'note',
    title: 'Design Sync: Mobile Haptic Capture',
    content: 'Agreed on thumb-zone navigation. When microphone records, trigger 50ms haptic feedback. Auto-stop transcription after 3.5 seconds of dead air. Spoken punctuation tags must automatically convert to commas and periods.',
    tags: ['VoiceDraft', 'Mobile', 'Design'],
    isCompleted: false,
    reminderAt: null,
    audioDuration: 48,
    createdAt: Date.now() - 10800000, // 3 hours ago
    updatedAt: Date.now() - 10800000,
  },
  {
    id: 'seed-task-2',
    type: 'task',
    title: 'Submit release build for staging deployment',
    content: 'Verify voice transcribing engine on iOS Safari and Android Chrome. Ensure offline fallback works cleanly.',
    tags: ['Deploy', 'QA', 'Urgent'],
    isCompleted: false,
    reminderAt: new Date(Date.now() + 21600000).toISOString(), // 6 hours in the future
    audioDuration: null,
    createdAt: Date.now() - 7200000, // 2 hours ago
    updatedAt: Date.now() - 7200000,
  },
];

/**
 * Synchronous read to load capture items from local storage.
 * Seamlessly initializes with the 3 seed items on first launch.
 */
export function loadItems(): CaptureItem[] {
  try {
    if (typeof window === 'undefined') return INITIAL_SEED_ITEMS;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveItems(INITIAL_SEED_ITEMS);
      return INITIAL_SEED_ITEMS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    // If empty array or invalid, seed defaults
    saveItems(INITIAL_SEED_ITEMS);
    return INITIAL_SEED_ITEMS;
  } catch (error) {
    console.error('Failed to load items from storage:', error);
    return INITIAL_SEED_ITEMS;
  }
}

/**
 * Synchronously persist items to storage
 */
export function saveItems(items: CaptureItem[]): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to persist items to storage:', error);
  }
}

/**
 * Generate a standard UUID v4
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
