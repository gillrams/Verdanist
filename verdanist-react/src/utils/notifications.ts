// src/utils/notifications.ts
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export interface NotificationPrefs {
  notifTemp: boolean;
  notifRH: boolean;
  notifPump: boolean;
}

const PREFS_KEY = 'verdanist_notif_prefs';
const VAPID_PUBLIC_KEY = 'BGvyI-g9Fca9_9i3iEy56U5YbHT7unGIRpO1Rj3ZzLEtPKH6uWW9Ppv7uPs-HRJr2EDhZekqNycV6skTP8UMD2w';

// Throttle tracking (for foreground fallback)
const lastNotified: Record<string, number> = {};
const COOLDOWN_MS = 10 * 60 * 1000;

export function getNotifPrefs(): NotificationPrefs {
  try {
    const saved = localStorage.getItem(PREFS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading notif prefs', e);
  }
  return { notifTemp: false, notifRH: false, notifPump: false };
}

export function saveNotifPrefs(prefs: NotificationPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// Convert url base64 to Uint8Array for push manager
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorkerAndSubscribe(userId: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    // ---- NATIVE ANDROID PUSH NOTIFICATIONS (CAPACITOR) ----
    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        return false;
      }

      await PushNotifications.register();

      // We wait for the registration event to get the token
      return new Promise<boolean>((resolve) => {
        PushNotifications.addListener('registration', async (token) => {
          console.log('[Native Push] Push registration success, token:', token.value);
          const { error } = await supabase.from('push_subscriptions').upsert({
            user_id: userId,
            endpoint: token.value, // for FCM, endpoint is the token
            p256dh: 'android_fcm',
            auth: 'android_fcm'
          }, { onConflict: 'endpoint' });

          if (error) {
            console.error('[Native Push] Error saving token to DB:', error);
            resolve(false);
          } else {
            resolve(true);
          }
        });

        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('[Native Push] Error on registration:', JSON.stringify(error));
          resolve(false);
        });
      });
    } catch (error) {
      console.error('[Native Push] Setup failed:', error);
      return false;
    }
  } else {
    // ---- WEB PUSH NOTIFICATIONS (SERVICE WORKER) ----
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Browser Anda tidak mendukung web push notifications.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      // Save to Supabase
      const subJson = JSON.parse(JSON.stringify(subscription));
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth
      }, { onConflict: 'endpoint' });

      if (error) {
        console.error('Error saving subscription to DB:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }
}

// Keep the old foreground notification for immediate local feedback if needed, 
// though the background edge function will handle it for closed apps.
export function sendNotification(id: string, title: string, options?: NotificationOptions, ignoreCooldown = false) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = Date.now();
  if (!ignoreCooldown) {
    const lastTime = lastNotified[id] || 0;
    if (now - lastTime < COOLDOWN_MS) return;
  }
  try {
    if (navigator.serviceWorker) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, { icon: '/favicon.svg', badge: '/favicon.svg', ...options });
      }).catch(err => {
        // Fallback for browsers that don't support service worker notifications
        new Notification(title, { icon: '/favicon.svg', badge: '/favicon.svg', ...options });
      });
    } else {
      new Notification(title, { icon: '/favicon.svg', badge: '/favicon.svg', ...options });
    }
    lastNotified[id] = now;
  } catch (e) {
    console.error('Error sending foreground notification', e);
  }
}
