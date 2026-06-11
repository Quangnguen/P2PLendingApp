/**
 * usePushNotification — Quản lý Firebase Cloud Messaging
 *
 * Setup:
 *   npm install @react-native-firebase/app @react-native-firebase/messaging
 *   npx react-native run-android
 *
 * Sau khi cài, import hook này vào App.tsx hoặc màn hình chính.
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationApi } from '../api/notification.api';
import { STORAGE_KEYS } from '../utils/constants';

// ─── Lazy import để tránh crash khi chưa cài firebase ──────────────────────

let messaging: any = null;
try {
  messaging = require('@react-native-firebase/messaging').default;
} catch {
  console.warn('[FCM] @react-native-firebase/messaging not installed — push disabled');
}

// ───────────────────────────────────────────────────────────────────────────

type UsePushOptions = {
  onNotification?: (data: Record<string, any>) => void;
  enabled?: boolean; // chỉ setup khi user đã đăng nhập
};

export function usePushNotification({ onNotification, enabled = true }: UsePushOptions = {}) {
  useEffect(() => {
    if (!messaging || !enabled) return;

    const setup = async () => {
      // 1. Xin quyền (iOS)
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (!enabled) {
          console.warn('[FCM] Permission denied on iOS');
          return;
        }
      }

      // 2. Lấy FCM token — chỉ đăng ký với backend khi user đã login
      const fcmToken = await messaging().getToken();
      const authToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (fcmToken && authToken) {
        await notificationApi.registerDeviceToken(fcmToken, Platform.OS === 'ios' ? 'IOS' : 'ANDROID');
      }

      // 3. Khi token refresh → gửi lại (chỉ khi đã login)
      messaging().onTokenRefresh(async (newToken: string) => {
        const currentToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (currentToken) {
          await notificationApi.registerDeviceToken(newToken, Platform.OS === 'ios' ? 'IOS' : 'ANDROID');
        }
      });

      // 4. Foreground notification
      const unsubForeground = messaging().onMessage(async (remoteMessage: any) => {
        console.log('[FCM] Foreground message:', remoteMessage.notification?.title);
        onNotification?.(remoteMessage.data ?? {});
      });

      // 5. Background / Quit — user bấm vào notification
      messaging().onNotificationOpenedApp((remoteMessage: any) => {
        console.log('[FCM] Opened from background:', remoteMessage.data);
        onNotification?.(remoteMessage.data ?? {});
      });

      // App mở từ quit state
      const initial = await messaging().getInitialNotification();
      if (initial) {
        console.log('[FCM] Opened from quit state:', initial.data);
        onNotification?.(initial.data ?? {});
      }

      return unsubForeground;
    };

    let unsubscribe: (() => void) | undefined;
    setup().then((unsub) => { unsubscribe = unsub; });
    return () => { unsubscribe?.(); };
  }, [enabled]); // re-run khi user login/logout
}
