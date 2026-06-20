/**
 * Notifications Service
 *
 * Handles Expo push permissions, device token registration,
 * and in-app notification APIs.
 *
 * Note: `expo-notifications` cannot be imported in Expo Go on Android (SDK 53+).
 * Simply importing it registers a device-push-token listener at module load,
 * which throws. We therefore load it lazily and only outside Expo Go; in Expo Go
 * the push-related methods become no-ops while in-app (server) notifications
 * continue to work.
 */

import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import type * as NotificationsModule from 'expo-notifications';
import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import type { NotificationListItem } from '../types';

const PUSH_TOKEN_KEY = 'push-token';
const PUSH_TOKEN_USER_KEY = 'push-token-user';

// Lazy, conditional load — see file header. The `require` only runs (and the
// module's throwing side-effects only register) outside Expo Go.
const Notifications: typeof NotificationsModule | null = isRunningInExpoGo()
  ? null
  : require('expo-notifications');

const isRemotePushSupported = (): boolean => {
  // Remote push requires a real device and a development/standalone build
  // (removed from Expo Go in SDK 53+).
  return Device.isDevice && !isRunningInExpoGo();
};

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const getProjectId = (): string | undefined => {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
};

const ensureAndroidChannel = async () => {
  if (!Notifications || Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
};

const requestPermissions = async (): Promise<string> => {
  if (!Notifications) return 'denied';

  const settings = await Notifications.getPermissionsAsync();
  if (settings.status === 'granted') {
    return settings.status;
  }

  const request = await Notifications.requestPermissionsAsync();
  return request.status;
};

const getDeviceId = async (): Promise<string> => {
  if (Platform.OS === 'ios') {
    const iosId = await Application.getIosIdForVendorAsync();
    return iosId ?? `ios-${Constants.deviceName ?? 'device'}`;
  }

  if (Platform.OS === 'android') {
    const androidId = await Application.getAndroidId();
    return androidId ?? `android-${Constants.deviceName ?? 'device'}`;
  }

  return `${Platform.OS}-${Constants.deviceName ?? 'device'}`;
};

const getExpoPushToken = async (): Promise<string | null> => {
  if (!isRemotePushSupported() || !Notifications) {
    return null;
  }

  const status = await requestPermissions();
  if (status !== 'granted') {
    return null;
  }

  await ensureAndroidChannel();

  try {
    const projectId = getProjectId();
    const tokenResponse = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    return tokenResponse.data;
  } catch (error) {
    // e.g. remote push unavailable or no network — degrade gracefully
    console.log('Failed to get Expo push token:', error);
    return null;
  }
};

export const notificationsService = {
  async registerDeviceToken(actorId?: string): Promise<string | null> {
    const token = await getExpoPushToken();
    if (!token) return null;

    const [storedToken, storedUser] = await Promise.all([
      AsyncStorage.getItem(PUSH_TOKEN_KEY),
      AsyncStorage.getItem(PUSH_TOKEN_USER_KEY),
    ]);

    if (actorId && storedToken === token && storedUser === actorId) {
      return token;
    }

    const deviceId = await getDeviceId();

    await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.DEVICES, {
      deviceId,
      token,
      isActive: true,
      lastUsedAt: new Date().toISOString(),
    });

    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    if (actorId) {
      await AsyncStorage.setItem(PUSH_TOKEN_USER_KEY, actorId);
    }

    return token;
  },

  async listNotifications(): Promise<NotificationListItem[]> {
    const response = await apiClient.get<{ success: boolean; data?: NotificationListItem[] }>(
      API_ENDPOINTS.NOTIFICATIONS.BASE
    );

    return response.data ?? [];
  },

  async markRead(notificationId: string): Promise<NotificationListItem> {
    const response = await apiClient.put<{ success: boolean; data: NotificationListItem }>(
      API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId)
    );

    return response.data;
  },

  async clearStoredRegistration(): Promise<void> {
    await AsyncStorage.multiRemove([PUSH_TOKEN_KEY, PUSH_TOKEN_USER_KEY]);
  },
};
