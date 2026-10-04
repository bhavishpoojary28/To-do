import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { ItemCard } from './components/ItemCard';
import { ActionDock } from './components/ActionDock';
import { VoiceCaptureOverlay } from './components/VoiceCaptureOverlay';
import { QuickEntryModal } from './components/QuickEntryModal';
import { TaskAlertModal } from './components/TaskAlertModal';
import { AppIconModal } from './components/AppIconModal';
import { useVoiceTranscriber } from './hooks/useVoiceTranscriber';
import { useReminderScheduler } from './hooks/useReminderScheduler';
import { loadItems, saveItems, generateUUID } from './utils/storage';
import {
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  sendMobileNotification,
  type NotificationPermissionState,
} from './utils/notifications';
import type { CaptureItem, FilterType, ItemType } from './types/app';
import { Inbox, Plus, Mic, CheckCircle2 } from 'lucide-react';

export function App() {
  const [items, setItems] = useState<CaptureItem[]>(() => loadItems());
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
  const [quickEntry, setQuickEntry] = useState<{ isOpen: boolean; type: ItemType }>({
    isOpen: false,
    type: 'task',
  });
  const [activeAlertItem, setActiveAlertItem] = useState<CaptureItem | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>(() =>
    getNotificationPermission()
  );
  const [activeIconUrl, setActiveIconUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fast_capture_icon') || '/favicon.svg';
    }
    return '/favicon.svg';
  });
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    audioDuration,
    audioLevel,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceTranscriber();

  // Save to persistent storage whenever items change
  useEffect(() => {
    saveItems(items);
  }, [items]);

  // Show transient toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  // Register service worker on mount for mobile screen notifications
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Sync active icon with browser link tags
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (favicon && activeIconUrl) favicon.href = activeIconUrl;
      const appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (appleIcon && activeIconUrl) appleIcon.href = activeIconUrl;
    }
  }, [activeIconUrl]);

  // Handle switching app icon
  const handleSelectIcon = useCallback(
    (url: string) => {
      setActiveIconUrl(url);
      try {
        localStorage.setItem('fast_capture_icon', url);
        if (typeof document !== 'undefined') {
          const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
          if (favicon) favicon.href = url;
          const appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
          if (appleIcon) appleIcon.href = url;
        }
        showToast('App icon updated successfully!');
      } catch (e) {
        console.warn('Icon save failed:', e);
      }
    },
    [showToast]
  );

  // Request Mobile Notification Permission
  const handleRequestPermission = useCallback(async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      showToast('Alerts enabled! You will receive mobile reminders.');
    } else if (perm === 'denied') {
      showToast('Notifications blocked. In-app chimes will still sound.');
    }
  }, [showToast]);

  // Test mobile screen / lock screen notification
  const handleTestNotification = useCallback(async () => {
    let perm = notificationPermission;
    if (perm !== 'granted') {
      perm = await requestNotificationPermission();
      setNotificationPermission(perm);
    }
    if (perm === 'granted') {
      showToast('📱 Lock your phone now! Lock-screen alert in 3s...');
      setTimeout(async () => {
        await sendMobileNotification('⏰ Mobile Screen Test Alert!', {
          body: 'Success! Your customized task reminders will alert your phone screen like this.',
          tag: 'test-mobile-screen',
        });
      }, 3000);
    } else {
      showToast('Please enable notifications to receive mobile screen alerts.');
    }
  }, [notificationPermission, showToast]);

  // When a reminder deadline arrives
  const handleTriggerReminder = useCallback((item: CaptureItem) => {
    setActiveAlertItem(item);
  }, []);

  // Mark task as notified
  const handleMarkNotified = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            isNotified: true,
            updatedAt: Date.now(),
          };
        }
        return item;
      })
    );
  }, []);

  // Continuous background monitoring for task deadlines
  useReminderScheduler({
    items,
    onTriggerReminder: handleTriggerReminder,
    onMarkNotified: handleMarkNotified,
  });

  // Snooze task reminder
  const handleSnooze = useCallback(
    (id: string, minutes: number) => {
      const snoozedDate = new Date(Date.now() + minutes * 60000).toISOString();
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              reminderAt: snoozedDate,
              isNotified: false,
              updatedAt: Date.now(),
            };
          }
          return item;
        })
      );
      showToast(`Task snoozed for ${minutes} minutes`);
    },
    [showToast]
  );

  // Toggle task completion
  const handleToggleComplete = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const nextCompleted = !item.isCompleted;
            return {
              ...item,
              isCompleted: nextCompleted,
              updatedAt: Date.now(),
            };
          }
          return item;
        })
      );
    },
    []
  );

  // Delete item
  const handleDelete = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      showToast('Item deleted');
    },
    [showToast]
  );

  // Set / modify reminder
  const handleSetReminder = useCallback((id: string, newDateIso: string | null) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            reminderAt: newDateIso,
            isNotified: false,
            updatedAt: Date.now(),
          };
        }
        return item;
      })
    );
  }, []);

  // Filter by tag click
  const handleTagClick = useCallback((tag: string) => {
    setSearchQuery(`#${tag}`);
  }, []);

  // Quick entry submission
  const handleQuickSave = useCallback(
    (data: {
      type: ItemType;
      title: string;
      content: string;
      tags: string[];
      reminderAt: string | null;
    }) => {
      const newItem: CaptureItem = {
        id: generateUUID(),
        type: data.type,
        title: data.title,
        content: data.content,
        tags: data.tags,
        isCompleted: false,
        reminderAt: data.reminderAt,
        isNotified: false,
        audioDuration: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setItems((prev) => [newItem, ...prev]);
      showToast(
        data.type === 'task'
          ? data.reminderAt
            ? 'Task created with reminder'
            : 'Task created'
          : 'Note saved'
      );
    },
    [showToast]
  );

  // Trigger voice capture
  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      setIsVoiceOverlayOpen(true);
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Voice Overlay Handlers
  const handleVoiceDiscard = useCallback(() => {
    stopListening();
    resetTranscript();
    setIsVoiceOverlayOpen(false);
  }, [stopListening, resetTranscript]);

  const handleVoiceSaveNote = useCallback(
    (text: string, duration: number) => {
      stopListening();
      setIsVoiceOverlayOpen(false);
      resetTranscript();

      const lines = text.split('\n');
      const firstLine = lines[0].trim();
      const title =
        firstLine.length > 50 ? `${firstLine.slice(0, 47)}...` : firstLine || 'Voice Note';
      const content = lines.length > 1 ? lines.slice(1).join('\n').trim() : text;

      const newNote: CaptureItem = {
        id: generateUUID(),
        type: 'note',
        title,
        content,
        tags: ['VoiceDraft'],
        isCompleted: false,
        reminderAt: null,
        isNotified: false,
        audioDuration: duration > 0 ? duration : null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setItems((prev) => [newNote, ...prev]);
      showToast('Voice note saved');
    },
    [stopListening, resetTranscript, showToast]
  );

  const handleVoiceConvertToTask = useCallback(
    (title: string, content: string, reminderAt: string | null, duration: number) => {
      stopListening();
      setIsVoiceOverlayOpen(false);
      resetTranscript();

      const newTask: CaptureItem = {
        id: generateUUID(),
        type: 'task',
        title: title || 'Transcribed Task',
        content,
        tags: ['VoiceDraft'],
        isCompleted: false,
        reminderAt,
        isNotified: false,
        audioDuration: duration > 0 ? duration : null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setItems((prev) => [newTask, ...prev]);
      showToast(reminderAt ? 'Task scheduled with reminder' : 'Task created from voice');
    },
    [stopListening, resetTranscript, showToast]
  );

  // Compute counts
  const counts = useMemo(() => {
    let tasks = 0;
    let notes = 0;
    let voice = 0;

    for (const item of items) {
      if (item.type === 'task') tasks++;
      if (item.type === 'note') notes++;
      if (item.audioDuration !== null || item.tags.includes('VoiceDraft')) voice++;
    }

    return {
      all: items.length,
      tasks,
      notes,
      voice,
    };
  }, [items]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Filter by type tab
    if (currentFilter === 'tasks') {
      result = result.filter((i) => i.type === 'task');
    } else if (currentFilter === 'notes') {
      result = result.filter((i) => i.type === 'note');
    } else if (currentFilter === 'voice') {
      result = result.filter((i) => i.audioDuration !== null || i.tags.includes('VoiceDraft'));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const isTagSearch = q.startsWith('#');
      const cleanTag = isTagSearch ? q.slice(1) : q;

      result = result.filter((item) => {
        if (isTagSearch) {
          return item.tags.some((t) => t.toLowerCase().includes(cleanTag));
        }
        return (
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
        );
      });
    }

    // Sort: Tasks that are active first, completed tasks last, newest createdAt first
    result.sort((a, b) => {
      if (a.type === 'task' && b.type === 'task') {
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1;
        }
      }
      return b.createdAt - a.createdAt;
    });

    return result;
  }, [items, currentFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased">
      {/* Dynamic Header & Filters with Notification Bell */}
      <Header
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        counts={counts}
        notificationPermission={notificationPermission}
        onRequestPermission={handleRequestPermission}
        onTestNotification={handleTestNotification}
        activeIconUrl={activeIconUrl}
        onOpenIconModal={() => setIsIconModalOpen(true)}
      />

      {/* Main Feed Container */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 pb-28">
        {/* Active Filter or Search Notice */}
        {searchQuery && (
          <div className="mb-3 flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800/80 px-3 py-1.5 rounded-xl">
            <span>
              Searching for: <span className="font-semibold text-zinc-200">&ldquo;{searchQuery}&rdquo;</span>
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-zinc-500 hover:text-zinc-300 font-medium"
            >
              Clear
            </button>
          </div>
        )}

        {/* Item Cards Feed */}
        {filteredItems.length > 0 ? (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDelete}
                onSetReminder={handleSetReminder}
                onTagClick={handleTagClick}
              />
            ))}
          </div>
        ) : (
          /* Glassy Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-3xl backdrop-blur-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-zinc-400 mb-4 shadow-xl">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-zinc-200 mb-1">
              {searchQuery ? 'No captures match your search' : 'No items in this view'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-xs mb-6">
              {searchQuery
                ? 'Try searching with different keywords or clearing your active search filter.'
                : 'Capture immediate tasks with custom lock-screen reminders, notes, or spoken thoughts.'}
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setQuickEntry({ isOpen: true, type: 'task' })}
                className="py-2.5 px-4 rounded-2xl backdrop-blur-md bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-bold text-zinc-200 flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-rose-400" />
                <span>New Task</span>
              </button>
              <button
                type="button"
                onClick={handleMicClick}
                className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-amber-500/20 hover:from-rose-500/30 hover:to-amber-500/30 border border-rose-500/40 text-xs font-bold text-rose-300 flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
              >
                <Mic className="w-3.5 h-3.5 text-rose-400" />
                <span>Voice Capture</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Safe-Area Action Dock */}
      <ActionDock
        isListening={isListening}
        audioLevel={audioLevel}
        onMicClick={handleMicClick}
        onNewTaskClick={() => setQuickEntry({ isOpen: true, type: 'task' })}
        onNewNoteClick={() => setQuickEntry({ isOpen: true, type: 'note' })}
      />

      {/* Immediate Voice Auto-Save Overlay */}
      <VoiceCaptureOverlay
        isOpen={isVoiceOverlayOpen}
        isListening={isListening}
        transcript={transcript}
        interimTranscript={interimTranscript}
        error={error}
        audioDuration={audioDuration}
        audioLevel={audioLevel}
        onStopListening={stopListening}
        onDiscard={handleVoiceDiscard}
        onSaveAsNote={handleVoiceSaveNote}
        onConvertToTask={handleVoiceConvertToTask}
      />

      {/* Quick Entry Modal for Tasks and Notes */}
      <QuickEntryModal
        isOpen={quickEntry.isOpen}
        type={quickEntry.type}
        onClose={() => setQuickEntry((prev) => ({ ...prev, isOpen: false }))}
        onSave={handleQuickSave}
      />

      {/* Interactive Ringing Task Alert Modal */}
      <TaskAlertModal
        item={activeAlertItem}
        onClose={() => setActiveAlertItem(null)}
        onComplete={(id) => {
          handleToggleComplete(id);
          setActiveAlertItem(null);
          showToast('Task marked complete!');
        }}
        onSnooze={handleSnooze}
      />

      {/* App Icon Customizer Modal */}
      <AppIconModal
        isOpen={isIconModalOpen}
        onClose={() => setIsIconModalOpen(false)}
        activeIconUrl={activeIconUrl}
        onSelectIcon={handleSelectIcon}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 inset-x-0 mx-auto w-fit z-50 px-4 py-2 bg-zinc-900/90 border border-zinc-700/80 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-medium text-zinc-200 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
