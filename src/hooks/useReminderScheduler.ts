import { useEffect, useRef } from 'react';
import type { CaptureItem } from '../types/app';
import { sendMobileNotification } from '../utils/notifications';

interface UseReminderSchedulerProps {
  items: CaptureItem[];
  onTriggerReminder: (item: CaptureItem) => void;
  onMarkNotified: (id: string) => void;
}

export function useReminderScheduler({
  items,
  onTriggerReminder,
  onMarkNotified,
}: UseReminderSchedulerProps) {
  const firedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();

      items.forEach((item) => {
        if (
          item.type === 'task' &&
          !item.isCompleted &&
          item.reminderAt &&
          !item.isNotified &&
          !firedIdsRef.current.has(item.id)
        ) {
          const dueTime = new Date(item.reminderAt).getTime();

          // If current time is past or within 1 second of due time
          if (now >= dueTime) {
            firedIdsRef.current.add(item.id);

            // Send native mobile notification + chime sound + vibration
            sendMobileNotification(`⏰ Task Reminder: ${item.title}`, {
              body: item.content || 'Your scheduled task is due now!',
              tag: `reminder-${item.id}`,
            });

            // Mark as notified in state & persistent storage
            onMarkNotified(item.id);

            // Trigger in-app interactive modal alert
            onTriggerReminder(item);
          }
        }
      });
    };

    // Immediate check on mount or when items update
    checkReminders();

    // High frequency interval (every 1 second) to catch exact second/minute deadlines
    const timer = setInterval(checkReminders, 1000);

    // Also check immediately when app becomes visible or focused
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkReminders();
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', checkReminders);

    return () => {
      clearInterval(timer);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', checkReminders);
    };
  }, [items, onTriggerReminder, onMarkNotified]);
}
