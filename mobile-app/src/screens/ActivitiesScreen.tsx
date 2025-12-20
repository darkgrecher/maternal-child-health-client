/**
 * Activities Screen
 * 
 * Shows all activity records for a child with filtering and management options.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card, Header } from '../components/common';
import { useActivityStore, useChildStore, useThemeStore } from '../stores';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';
import { RootStackParamList } from '../types';
import { format } from 'date-fns';

type ActivitiesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Activities'>;

const ActivitiesScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ActivitiesScreenNavigationProp>();
  const { colors } = useThemeStore();
  
  const { profile } = useChildStore();
  const { activities, isLoading, fetchActivities, deleteActivity } = useActivityStore();

  useEffect(() => {
    if (profile?.id) {
      fetchActivities(profile.id);
    }
  }, [profile?.id]);

  const getActivityIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'vaccination': return 'shield-checkmark';
      case 'growth': return 'trending-up';
      case 'milestone': return 'star';
      case 'appointment': return 'calendar';
      case 'checkup': return 'medical';
      default: return 'ellipse';
    }
  };

  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'vaccination': return colors.info;
      case 'growth': return colors.success;
      case 'milestone': return colors.warning;
      case 'appointment': return colors.primary;
      case 'checkup': return colors.primary;
      default: return colors.gray[500];
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      t('home.deleteRecord', 'Delete Record'),
      t('home.deleteRecordConfirm', `Are you sure you want to delete "${title}"?`),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel'
        },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteActivity(id);
            } catch (error) {
              Alert.alert(t('common.error'), t('activities.deleteError', 'Failed to delete activity'));
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title={t('activities.title', 'All Activities')}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && activities.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('common.loading', 'Loading...')}</Text>
          </View>
        ) : activities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>{t('activities.noActivities', 'No Activities Yet')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('activities.noActivitiesMessage', 'Activities will appear here as you add them')}
            </Text>
          </View>
        ) : (
          <>
            {activities.map((activity) => (
              <Card key={activity.id} style={styles.activityCard}>
                <TouchableOpacity
                  style={styles.activityContent}
                  onLongPress={() => handleDelete(activity.id, activity.title)}
                  delayLongPress={500}
                >
                  <View style={styles.activityHeader}>
                    <View style={[
                      styles.activityIcon,
                      { backgroundColor: getActivityColor(activity.type) + '20' }
                    ]}>
                      <Ionicons
                        name={getActivityIcon(activity.type)}
                        size={24}
                        color={getActivityColor(activity.type)}
                      />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(activity.id, activity.title)}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                  {activity.description && (
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                  )}
                </TouchableOpacity>
              </Card>
            ))}
          </>
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
  activityCard: {
    marginBottom: SPACING.sm,
  },
  activityContent: {
    padding: SPACING.xs,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs / 2,
  },
  activityDate: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  deleteButton: {
    padding: SPACING.sm,
  },
  activityDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    marginLeft: 48 + SPACING.md,
    lineHeight: 20,
  },
});

export default ActivitiesScreen;
