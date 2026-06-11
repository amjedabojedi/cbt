import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { ApiService } from './api';

// Show notifications even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Track which notification IDs we have already shown to avoid duplicates
const shownIds = new Set<number>();

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#059669',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function showLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null, // fire immediately
  });
}

let pollingInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Starts a background poll that fires a device notification for any unread
 * notification that hasn't been shown in this session yet.
 */
export function startNotificationPolling(intervalMs = 30_000) {
  if (pollingInterval) return; // already running

  const poll = async () => {
    try {
      if (!ApiService.hasAuthToken()) return;
      const unread = await ApiService.getUnreadNotifications() as any;
      const items: Array<{ id: number; title: string; body: string }> = Array.isArray(unread)
        ? unread
        : (unread?.data ?? []);

      for (const item of items) {
        if (!shownIds.has(item.id)) {
          shownIds.add(item.id);
          await showLocalNotification(item.title, item.body);
        }
      }
    } catch {
      // silently ignore network errors during polling
    }
  };

  // Run once immediately, then on interval
  poll();
  pollingInterval = setInterval(poll, intervalMs);
}

export function stopNotificationPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

/** Reset shown-IDs when the user logs out so they see notifications fresh on next login. */
export function resetShownNotifications() {
  shownIds.clear();
}
