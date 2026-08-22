// src/utils/permissions.ts
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';


/**
 * Request all runtime permissions required by the app.
 * Call this function early (e.g., in App.tsx useEffect) so the user sees the system dialogs.
 */
export async function requestAllPermissions() {
  if (!Capacitor.isNativePlatform()) {
    return; // Web permissions are handled by the browser when APIs are used
  }

  // Camera permission (needed for QR scanner / photo capture)
  try {
    const camPerm = await Camera.requestPermissions();
    console.log('Camera permission', camPerm);
  } catch (e) {
    console.error('Camera permission error', e);
  }

  // Storage permission (READ/WRITE_EXTERNAL_STORAGE) – required on Android < 33
  if (Capacitor.getPlatform() === 'android') {
    try {
      const storagePerm = await Filesystem.requestPermissions();
      console.log('Storage permission', storagePerm);
    } catch (e) {
      console.error('Storage permission error', e);
    }
  }

  // Location permission – used for location‑based farm features
  try {
    const locPerm = await Geolocation.requestPermissions();
    console.log('Location permission', locPerm);
  } catch (e) {
    console.error('Location permission error', e);
  }

  // Notification permission – Android 13+ requires explicit grant
  try {
    const notifResult = await PushNotifications.requestPermissions();
    console.log('Notification permission result', notifResult);
  } catch (e) {
    console.error('Notification permission error', e);
  }
}
