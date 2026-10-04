/**
 * Notification service supporting Service Worker Mobile Screen Notifications,
 * Web Notifications API, hardware haptics, and synthesized Web Audio chime alerts.
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register Service Worker for system-level lock screen and status bar notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    return reg;
  } catch (err) {
    console.warn('Service Worker registration error:', err);
    return null;
  }
}

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerServiceWorker();
    }
    return permission;
  } catch (error) {
    console.warn('Failed to request notification permission:', error);
    return Notification.permission;
  }
}

/**
 * Synthesizes an audible reminder chime using Web Audio API.
 * Zero external audio files required, works offline and on mobile.
 */
export function playNotificationChime(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtx) return;

    const ctx = new AudioCtx();

    // Pleasant three-tone melodic chime: F5 (698.46Hz) -> A5 (880Hz) -> C6 (1046.50Hz)
    const tones = [
      { freq: 698.46, start: 0, duration: 0.18 },
      { freq: 880.0, start: 0.14, duration: 0.22 },
      { freq: 1046.5, start: 0.28, duration: 0.45 },
    ];

    tones.forEach((tone) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(tone.freq, ctx.currentTime + tone.start);

      // Envelope: quick attack and smooth natural exponential decay
      gain.gain.setValueAtTime(0.001, ctx.currentTime + tone.start);
      gain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + tone.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + tone.start + tone.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + tone.start);
      osc.stop(ctx.currentTime + tone.start + tone.duration);
    });

    // Auto-close audio context after tones finish
    setTimeout(() => {
      if (ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    }, 1200);
  } catch (err) {
    console.warn('Could not play notification audio chime:', err);
  }
}

/**
 * Mobile haptic vibration pattern for notifications:
 * double pulse followed by a long pulse
 */
export function triggerHapticNotification(): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([300, 100, 300, 100, 500]);
    } catch {
      // Safe fallback
    }
  }
}

/**
 * Dispatches a native mobile screen notification (appears in system drawer & lock screen)
 */
export async function sendMobileNotification(
  title: string,
  options: { body: string; tag?: string; data?: Record<string, unknown> }
): Promise<boolean> {
  // Always trigger sound and vibration
  playNotificationChime();
  triggerHapticNotification();

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  // 1. Preferred Mobile Method: ServiceWorkerRegistration.showNotification
  // This is required on mobile browsers to show system lock screen & status bar notification
  if ('serviceWorker' in navigator) {
    try {
      const reg = swRegistration || (await navigator.serviceWorker.ready);
      if (reg && reg.showNotification) {
        await (reg.showNotification as (t: string, o?: unknown) => Promise<void>)(title, {
          body: options.body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: options.tag || 'task-reminder',
          vibrate: [300, 100, 300, 100, 500],
          renotify: true,
          requireInteraction: true,
          data: options.data || {},
        });
        return true;
      }
    } catch (swError) {
      console.warn('ServiceWorker showNotification failed, trying fallback:', swError);
    }
  }

  // 2. Desktop / standard fallback
  try {
    const notification = new Notification(title, {
      body: options.body,
      icon: '/favicon.svg',
      tag: options.tag || 'task-reminder',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (e) {
    console.warn('Could not construct native Notification:', e);
    return false;
  }
}
