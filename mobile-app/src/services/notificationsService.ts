/**
 * Notifications Service
 *
 * Handles Expo push permissions, device token registration,
 * and in-app notification APIs.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import type { NotificationListItem } from '../types';

const PUSH_TOKEN_KEY = 'push-token';
const PUSH_TOKEN_USER_KEY = 'push-token-user';

const isExpoGo = (): boolean => {
  if (Constants.executionEnvironment) {
    return Constants.executionEnvironment === 'storeClient';
  }

  return Constants.appOwnership === 'expo';
};

const isRemotePushSupported = (): boolean => {
  if (!Device.isDevice) {
    return false;
  }

  // Expo Go does not support remote push notifications in SDK 53+.
  return !isExpoGo();
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const getProjectId = (): string | undefined => {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
};

const ensureAndroidChannel = async () => {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
};

const requestPermissions = async (): Promise<Notifications.PermissionStatus> => {
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
    return Application.androidId ?? `android-${Constants.deviceName ?? 'device'}`;
  }

  return `${Platform.OS}-${Constants.deviceName ?? 'device'}`;
};

const getExpoPushToken = async (): Promise<string | null> => {
  if (!isRemotePushSupported()) {
    return null;
  }

  const status = await requestPermissions();
  if (status !== 'granted') {
    return null;
  }

  await ensureAndroidChannel();

  const projectId = getProjectId();
  const tokenResponse = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  return tokenResponse.data;
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
