/**
 * Formats an ISO date string into a user-friendly relative reminder badge
 * e.g., "In 2 hours", "Tomorrow 9:00 AM", "Today 4:30 PM", "In 35 mins"
 */
export function formatRelativeReminder(isoString: string): { label: string; isPast: boolean } {
  try {
    const target = new Date(isoString);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const isPast = diffMs < 0;

    const absDiffMinutes = Math.round(Math.abs(diffMs) / 60000);
    const absDiffHours = Math.round(Math.abs(diffMs) / 3600000);
    const absDiffDays = Math.round(Math.abs(diffMs) / 86400000);

    const timeStr = target.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    // Same calendar day check
    const isToday =
      target.getDate() === now.getDate() &&
      target.getMonth() === now.getMonth() &&
      target.getFullYear() === now.getFullYear();

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      target.getDate() === tomorrow.getDate() &&
      target.getMonth() === tomorrow.getMonth() &&
      target.getFullYear() === tomorrow.getFullYear();

    if (isPast) {
      if (absDiffMinutes < 60) return { label: `${absDiffMinutes}m ago`, isPast: true };
      if (isToday) return { label: `Today ${timeStr} (overdue)`, isPast: true };
      return { label: `Overdue (${target.toLocaleDateString([], { month: 'short', day: 'numeric' })})`, isPast: true };
    }

    if (absDiffMinutes < 60) {
      return { label: `In ${absDiffMinutes} min${absDiffMinutes === 1 ? '' : 's'}`, isPast: false };
    }

    if (isToday) {
      if (absDiffHours <= 3) {
        return { label: `In ${absDiffHours} hr${absDiffHours === 1 ? '' : 's'} (${timeStr})`, isPast: false };
      }
      return { label: `Today ${timeStr}`, isPast: false };
    }

    if (isTomorrow) {
      return { label: `Tomorrow ${timeStr}`, isPast: false };
    }

    if (absDiffDays < 7) {
      const dayName = target.toLocaleDateString([], { weekday: 'short' });
      return { label: `${dayName} ${timeStr}`, isPast: false };
    }

    return {
      label: `${target.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timeStr}`,
      isPast: false,
    };
  } catch {
    return { label: 'Invalid date', isPast: false };
  }
}

/**
 * Format timestamp into readable relative time (e.g. "Just now", "2m ago", "1h ago")
 */
export function formatCreatedAt(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

/**
 * Formats a Date object into human-friendly full date and time string
 * e.g., "Today at 3:45 PM", "Tomorrow at 9:00 AM", "Mon, Oct 5 at 11:30 AM"
 */
export function formatFullDateTime(date: Date): string {
  const now = new Date();
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  if (isToday) return `Today at ${timeStr}`;
  if (isTomorrow) return `Tomorrow at ${timeStr}`;

  return `${date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${timeStr}`;
}
