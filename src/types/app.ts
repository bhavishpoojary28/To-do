export type ItemType = 'task' | 'note';

export type FilterType = 'all' | 'tasks' | 'notes' | 'voice';

export interface CaptureItem {
  id: string; // UUID
  type: ItemType;
  title: string;
  content: string;
  tags: string[];
  isCompleted: boolean; // for tasks
  reminderAt: string | null; // ISO timestamp
  isNotified?: boolean; // true once notification has fired
  audioDuration: number | null; // in seconds
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export interface VoiceTranscriberState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  audioDuration: number;
}
