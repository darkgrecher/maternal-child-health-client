/**
 * Notifications Screen
 *
 * Shows in-app notifications and allows marking them as read.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';

import { Card, Header } from '../components/common';
import { useNotificationStore, useThemeStore } from '../stores';
import type { NotificationListItem, NotificationType, RootStackParamList } from '../types';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';

type NotificationsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Notifications'>;

const formatTimestamp = (value: string): string => {
  try {
    return format(new Date(value), 'MMM dd, yyyy p');
  } catch {
    return value;
  }
};

const getNotificationIcon = (type: NotificationType): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'appointment':
      return 'calendar';
    case 'vaccination':
      return 'shield-checkmark';
    case 'high_risk':
      return 'alert-circle';
    case 'daily_digest':
      return 'document-text';
    case 'system':
      return 'notifications';
    default:
      return 'notifications';
  }
};

const NotificationsScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NotificationsScreenNavigationProp>();
  const { colors } = useThemeStore();
  const { items, isLoading, error, fetchNotifications, markRead } = useNotificationStore();

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const handleMarkRead = (notification: NotificationListItem) => {
    if (!notification.isRead) {
      markRead(notification.id);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title={t('notifications.title', 'Notifications')}
        subtitle={t('notifications.subtitle', 'Updates and reminders')}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && items.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('common.loading', 'Loading...')}</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
            <Text style={styles.emptyTitle}>{t('notifications.errorTitle', 'Unable to load')}</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>{t('notifications.emptyTitle', 'No notifications')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('notifications.emptySubtitle', 'You are all caught up for now.')}
            </Text>
          </View>
        ) : (
          items.map((notification) => (
            <Card key={notification.id} style={styles.notificationCard}>
              <TouchableOpacity
                style={styles.notificationRow}
                onPress={() => handleMarkRead(notification)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: colors.primary + '20' },
                  ]}
                >
                  <Ionicons
                    name={getNotificationIcon(notification.type)}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.notificationContent}>
                  <Text
                    style={[
                      styles.notificationTitle,
                      { color: colors.textPrimary },
                      !notification.isRead && styles.unreadTitle,
                    ]}
                  >
                    {notification.title}
                  </Text>
                  <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
                    {notification.message}
                  </Text>
                  <Text style={[styles.notificationDate, { color: colors.textLight }]}>
                    {formatTimestamp(notification.createdAt)}
                  </Text>
                </View>
                {!notification.isRead && (
                  <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                )}
              </TouchableOpacity>
            </Card>
          ))
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  notificationCard: {
    marginBottom: SPACING.sm,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.xs / 2,
  },
  unreadTitle: {
    fontWeight: FONT_WEIGHT.bold,
  },
  notificationMessage: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
  },
  notificationDate: {
    fontSize: FONT_SIZE.xs,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: SPACING.xs,
  },
});

export default NotificationsScreen;
