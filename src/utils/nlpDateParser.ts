/**
 * Natural language regex parser to extract potential dates and times
 * from captured voice transcripts.
 */

export interface ParsedTaskResult {
  title: string;
  reminderAt: string | null;
  detectedPhrase: string | null;
}

export function parseTaskDate(rawText: string): ParsedTaskResult {
  if (!rawText || !rawText.trim()) {
    return { title: '', reminderAt: null, detectedPhrase: null };
  }

  const now = new Date();
  let reminderDate: Date | null = null;
  let detectedPhrase: string | null = null;
  let cleanedTitle = rawText.trim();

  // Pattern 1: "in X hour(s)" or "in X minute(s)"
  const relativeMatch = rawText.match(/\bin\s+(\d+)\s+(hour|hr|minute|min)s?\b/i);
  if (relativeMatch) {
    detectedPhrase = relativeMatch[0];
    const amount = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2].toLowerCase();

    const target = new Date();
    if (unit.startsWith('hour') || unit.startsWith('hr')) {
      target.setTime(now.getTime() + amount * 3600000);
    } else {
      target.setTime(now.getTime() + amount * 60000);
    }
    reminderDate = target;
  }

  // Pattern 2: "tomorrow at 3 pm", "tomorrow 9:30 am", "tomorrow morning", "tomorrow"
  if (!reminderDate) {
    const tomorrowMatch = rawText.match(
      /\btomorrow(?:\s+morning|\s+afternoon|\s+evening)?(?:\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?\b/i
    );
    if (tomorrowMatch) {
      detectedPhrase = tomorrowMatch[0];
      const target = new Date(now);
      target.setDate(target.getDate() + 1);

      let hour = 9;
      let minute = 0;

      if (tomorrowMatch[1]) {
        let h = parseInt(tomorrowMatch[1], 10);
        const m = tomorrowMatch[2] ? parseInt(tomorrowMatch[2], 10) : 0;
        const meridian = tomorrowMatch[3]?.toLowerCase();

        if (meridian === 'pm' && h < 12) h += 12;
        if (meridian === 'am' && h === 12) h = 0;

        hour = h;
        minute = m;
      } else {
        const lower = tomorrowMatch[0].toLowerCase();
        if (lower.includes('afternoon')) hour = 14;
        else if (lower.includes('evening')) hour = 18;
      }

      target.setHours(hour, minute, 0, 0);
      reminderDate = target;
    }
  }

  // Pattern 3: "today at 4 pm", "today 5:30 pm", "tonight at 8 pm", "tonight"
  if (!reminderDate) {
    const todayMatch = rawText.match(
      /\b(?:today|tonight)(?:\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?\b/i
    );
    if (todayMatch) {
      detectedPhrase = todayMatch[0];
      const target = new Date(now);
      let hour = todayMatch[0].toLowerCase().includes('tonight') ? 20 : 17;
      let minute = 0;

      if (todayMatch[1]) {
        let h = parseInt(todayMatch[1], 10);
        const m = todayMatch[2] ? parseInt(todayMatch[2], 10) : 0;
        const meridian = todayMatch[3]?.toLowerCase();

        if (meridian === 'pm' && h < 12) h += 12;
        if (meridian === 'am' && h === 12) h = 0;

        hour = h;
        minute = m;
      }

      target.setHours(hour, minute, 0, 0);
      // If time has already passed today, push to tomorrow same time
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      reminderDate = target;
    }
  }

  // Pattern 4: "at 5 pm", "at 10:30 am", "by 3 pm"
  if (!reminderDate) {
    const timeMatch = rawText.match(/\b(?:at|by)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    if (timeMatch) {
      detectedPhrase = timeMatch[0];
      const target = new Date(now);
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const meridian = timeMatch[3].toLowerCase();

      if (meridian === 'pm' && h < 12) h += 12;
      if (meridian === 'am' && h === 12) h = 0;

      target.setHours(h, m, 0, 0);
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      reminderDate = target;
    }
  }

  // Pattern 5: Day of week: "on Friday at 2 pm", "next Monday 10 am"
  if (!reminderDate) {
    const dayMatch = rawText.match(
      /\b(?:next\s+|on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?\b/i
    );
    if (dayMatch) {
      detectedPhrase = dayMatch[0];
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDayIndex = days.indexOf(dayMatch[1].toLowerCase());
      const currentDayIndex = now.getDay();

      let diffDays = targetDayIndex - currentDayIndex;
      if (diffDays <= 0) diffDays += 7;

      const target = new Date(now);
      target.setDate(target.getDate() + diffDays);

      let hour = 10;
      let minute = 0;
      if (dayMatch[2]) {
        let h = parseInt(dayMatch[2], 10);
        const m = dayMatch[3] ? parseInt(dayMatch[3], 10) : 0;
        const meridian = dayMatch[4]?.toLowerCase();
        if (meridian === 'pm' && h < 12) h += 12;
        if (meridian === 'am' && h === 12) h = 0;
        hour = h;
        minute = m;
      }
      target.setHours(hour, minute, 0, 0);
      reminderDate = target;
    }
  }

  // Remove the detected phrase from title for a clean title, or keep whole text if too short
  if (detectedPhrase && cleanedTitle.length > detectedPhrase.length + 4) {
    cleanedTitle = cleanedTitle
      .replace(detectedPhrase, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[,\s.-]+|[,\s.-]+$/g, '')
      .trim();
  }

  return {
    title: cleanedTitle || rawText.trim(),
    reminderAt: reminderDate ? reminderDate.toISOString() : null,
    detectedPhrase,
  };
}
