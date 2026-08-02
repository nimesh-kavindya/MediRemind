import toast from 'react-hot-toast';

export const getNotificationPermissionStatus = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('Browser does not support desktop notifications.');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;

    // Tone 1: C5 (523.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Tone 2: E5 (659.25Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.15);
    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.35, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.65);
  } catch (e) {
    console.warn('Audio chime playback failed:', e);
  }
};

export const scheduleLocalNotification = (title, options = {}, playSound = true) => {
  if (playSound) {
    playNotificationSound();
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const payloadOptions = {
        body: options.body || title,
        icon: options.icon || '/pwa-192x192.png',
        badge: options.badge || '/pwa-192x192.png',
        tag: options.tag || 'medication-reminder',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        ...options
      };

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, payloadOptions);
        }).catch(() => {
          new Notification(title, payloadOptions);
        });
      } else {
        const notification = new Notification(title, payloadOptions);
        notification.onclick = () => {
          window.focus();
          if (options.onClickUrl) {
            window.location.hash = options.onClickUrl;
          }
          notification.close();
        };
      }
    } catch (e) {
      console.warn('Browser Notification creation error:', e);
      toast(title, { icon: '🔔' });
    }
  } else {
    // Fallback to toast
    toast(title, { icon: '🔔' });
  }
};

