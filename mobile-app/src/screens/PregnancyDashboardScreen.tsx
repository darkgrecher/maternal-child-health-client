/**
 * Pregnancy Dashboard Screen
 * 
 * Main dashboard for tracking pregnancy progress, showing
 * current week, baby development, upcoming appointments,
 * and health metrics specific to pregnancy.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, differenceInWeeks, differenceInDays, addWeeks } from 'date-fns';

import { Card, ProgressBar, SectionTitle, Button } from '../components/common';
import { usePregnancyStore, useAuthStore, useThemeStore, useChildStore } from '../stores';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';
import { RootStackParamList } from '../types';

// Custom app icon
const APP_ICON = require('../../assets/ChatGPT Image Jan 25, 2026, 05_05_58 PM.png');
// Pregnancy hero video
const PREGNANCY_HERO_VIDEO = require('../../assets/mom (online-video-cutter.com).mp4');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PregnancyDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Baby Development Info by Trimester
 */
const getBabyDevelopmentInfo = (week: number): { title: string; description: string; size: string; icon: string } => {
  if (week <= 4) {
    return {
      title: 'Fertilization & Implantation',
      description: 'Your baby is a tiny ball of cells, about the size of a poppy seed, beginning to implant in your uterus.',
      size: 'Poppy seed',
      icon: 'cellular-outline',
    };
  } else if (week <= 8) {
    return {
      title: 'Embryonic Development',
      description: 'Major organs are forming. The heart begins to beat, and tiny limb buds appear.',
      size: 'Raspberry',
      icon: 'heart-outline',
    };
  } else if (week <= 12) {
    return {
      title: 'End of First Trimester',
      description: 'Your baby now has all essential organs. Fingers, toes, and external genitalia are forming.',
      size: 'Lime',
      icon: 'happy-outline',
    };
  } else if (week <= 16) {
    return {
      title: 'Second Trimester Begins',
      description: 'Baby can make facial expressions. You might start to feel movement soon!',
      size: 'Avocado',
      icon: 'body-outline',
    };
  } else if (week <= 20) {
    return {
      title: 'Halfway There!',
      description: 'Baby is very active. You can find out the sex now if you wish. Hair is growing!',
      size: 'Banana',
      icon: 'walk-outline',
    };
  } else if (week <= 24) {
    return {
      title: 'Viability Milestone',
      description: 'Baby\'s lungs are developing. They respond to sounds and may hiccup!',
      size: 'Corn',
      icon: 'ear-outline',
    };
  } else if (week <= 28) {
    return {
      title: 'Third Trimester Starts',
      description: 'Baby can open eyes and has regular sleep cycles. Brain development accelerates.',
      size: 'Eggplant',
      icon: 'eye-outline',
    };
  } else if (week <= 32) {
    return {
      title: 'Rapid Growth Phase',
      description: 'Baby is practicing breathing. Bones are hardening, but skull stays soft for birth.',
      size: 'Squash',
      icon: 'fitness-outline',
    };
  } else if (week <= 36) {
    return {
      title: 'Almost Full Term',
      description: 'Baby is gaining weight rapidly. Most babies turn head-down in preparation for birth.',
      size: 'Honeydew melon',
      icon: 'arrow-down-outline',
    };
  } else {
    return {
      title: 'Full Term!',
      description: 'Baby is fully developed and ready to meet you! Average weight is 3-4 kg.',
      size: 'Watermelon',
      icon: 'star-outline',
    };
  }
};

/**
 * Pregnancy Dashboard Screen Component
 */
const PregnancyDashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<PregnancyDashboardNavigationProp>();
  const { colors } = useThemeStore();
  
  // Store hooks
  const { currentPregnancy, pregnancies, isLoading, fetchActivePregnancies, deletePregnancy } = usePregnancyStore();
  const { children, fetchChildren } = useChildStore();
  const { accessToken } = useAuthStore();

  // Fetch data on mount
  useEffect(() => {
    if (accessToken) {
      fetchActivePregnancies();
      fetchChildren();
    }
  }, [accessToken]);

  // Calculate pregnancy progress
  const calculatePregnancyProgress = () => {
    if (!currentPregnancy?.expectedDeliveryDate) {
      return { weeks: 0, days: 0, progress: 0, daysRemaining: 280 };
    }

    const edd = new Date(currentPregnancy.expectedDeliveryDate);
    const today = new Date();
    
    // Calculate from conception (40 weeks = 280 days before EDD)
    const conceptionDate = addWeeks(edd, -40);
    const totalDays = differenceInDays(today, conceptionDate);
    const weeks = Math.floor(totalDays / 7);
    const days = totalDays % 7;
    const progress = Math.min((totalDays / 280) * 100, 100);
    const daysRemaining = Math.max(differenceInDays(edd, today), 0);

    return { weeks, days, progress, daysRemaining };
  };

  const pregnancyProgress = calculatePregnancyProgress();
  const babyInfo = getBabyDevelopmentInfo(pregnancyProgress.weeks);

  // Get trimester
  const getTrimester = (weeks: number): string => {
    if (weeks <= 12) return t('pregnancy.firstTrimester', '1st Trimester');
    if (weeks <= 27) return t('pregnancy.secondTrimester', '2nd Trimester');
    return t('pregnancy.thirdTrimester', '3rd Trimester');
  };

  // Loading state
  if (isLoading && !currentPregnancy) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('common.loading', 'Loading...')}</Text>
      </View>
    );
  }

  // No pregnancy profile
  if (!currentPregnancy) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('pregnancy.dashboard', 'Pregnancy Dashboard')}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[styles.centerContent, { flex: 1 }]}>
          <Ionicons name="heart-outline" size={64} color={colors.gray[300]} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {t('pregnancy.noProfile', 'No Pregnancy Profile')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {t('pregnancy.createProfileMessage', 'Create a pregnancy profile to start tracking your journey.')}
          </Text>
          <Button
            title={t('pregnancy.createProfile', 'Create Pregnancy Profile')}
            onPress={() => navigation.navigate('CreatePregnancy')}
            style={styles.createButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.logoContainer, { backgroundColor: colors.secondaryLight }]}>
              <Image source={APP_ICON} style={{ width: 24, height: 24 }} resizeMode="contain" />
            </View>
            <View>
              <Text style={[styles.headerTitleText, { color: colors.textPrimary }]}>
                {t('pregnancy.dashboard', 'Pregnancy Tracker')}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {currentPregnancy.motherFullName || currentPregnancy.motherFirstName || t('pregnancy.momToBe', 'Mom-to-be')}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => {
                // TODO: Navigate to notifications
              }}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section with Pregnancy Video */}
        <Card style={styles.heroCard}>
          <View style={styles.heroContentRow}>
            <Video
              source={PREGNANCY_HERO_VIDEO}
              style={styles.heroVideo}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              isLooping
              isMuted
            />
            <View style={styles.heroTextContainer}>
              <Text style={[styles.heroGreeting, { color: '#8B4A6B' }]}>
                {t('pregnancy.hello', 'Hello')}, {currentPregnancy.motherFirstName || t('pregnancy.momToBe', 'Mom')}! 
              </Text>
              <Text style={[styles.heroWeekText, { color: '#6B3A5B' }]}>
                {t('pregnancy.youAreInWeek', 'You are in week')} {pregnancyProgress.weeks}
              </Text>
            </View>
          </View>
        </Card>

        {/* Pregnancy Progress Card */}
        <Card style={[styles.progressCard, { borderLeftColor: colors.secondary, borderLeftWidth: 4 }]}>
          <View style={styles.progressHeader}>
            <View style={[styles.weekBadge, { backgroundColor: colors.secondary }]}>
              <Text style={styles.weekNumber}>{pregnancyProgress.weeks}</Text>
              <Text style={styles.weekLabel}>{t('pregnancy.weeks', 'weeks')}</Text>
            </View>
            <View style={styles.progressInfo}>
              <Text style={[styles.trimesterText, { color: colors.secondary }]}>
                {getTrimester(pregnancyProgress.weeks)}
              </Text>
              <Text style={[styles.daysText, { color: colors.textSecondary }]}>
                {pregnancyProgress.weeks} {t('pregnancy.weeksAnd', 'weeks &')} {pregnancyProgress.days} {t('pregnancy.days', 'days')}
              </Text>
              <Text style={[styles.remainingText, { color: colors.textPrimary }]}>
                {pregnancyProgress.daysRemaining} {t('pregnancy.daysRemaining', 'days until due date')}
              </Text>
            </View>
          </View>
          <ProgressBar 
            progress={pregnancyProgress.progress} 
            height={12} 
            showLabel 
            labelPosition="right"
            color={colors.secondary}
          />
          <Text style={[styles.eddText, { color: colors.textSecondary }]}>
            {t('pregnancy.expectedDate', 'Expected:')} {format(new Date(currentPregnancy.expectedDeliveryDate), 'MMMM d, yyyy')}
          </Text>
        </Card>

        {/* Baby Development Card */}
        <Card style={styles.developmentCard}>
          <SectionTitle 
            title={t('pregnancy.babyDevelopment', 'Baby Development')} 
            icon="sparkles-outline" 
            iconColor={colors.secondary}
          />
          <View style={styles.developmentContent}>
            <View style={[styles.sizeIconContainer, { backgroundColor: colors.secondaryLight }]}>
              <Ionicons name={babyInfo.icon as any} size={40} color={colors.secondary} />
            </View>
            <View style={styles.developmentInfo}>
              <Text style={[styles.developmentTitle, { color: colors.textPrimary }]}>
                {babyInfo.title}
              </Text>
              <Text style={[styles.developmentSize, { color: colors.secondary }]}>
                {t('pregnancy.babySize', 'Size')}: {babyInfo.size}
              </Text>
              <Text style={[styles.developmentDescription, { color: colors.textSecondary }]}>
                {babyInfo.description}
              </Text>
            </View>
          </View>
        </Card>

        {/* Mother's Health Card */}
        <Card style={styles.healthCard}>
          <SectionTitle 
            title={t('pregnancy.motherHealth', "Mother's Health")} 
            icon="fitness-outline" 
            iconColor={colors.primary}
          />
          <View style={styles.healthMetrics}>
            <View style={[styles.metricItem, { backgroundColor: colors.gray[50] }]}>
              <Ionicons name="scale-outline" size={24} color={colors.primary} />
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                {t('pregnancy.currentWeight', 'Current Weight')}
              </Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {currentPregnancy.prePregnancyWeight ? `${currentPregnancy.prePregnancyWeight} kg` : '--'}
              </Text>
            </View>
            <View style={[styles.metricItem, { backgroundColor: colors.gray[50] }]}>
              <Ionicons name="water-outline" size={24} color={colors.info} />
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                {t('pregnancy.bloodType', 'Blood Type')}
              </Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {currentPregnancy.motherBloodType || '--'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Medical Info Card */}
        {(currentPregnancy.hospitalName || currentPregnancy.obgynName) && (
          <Card style={styles.medicalCard}>
            <SectionTitle 
              title={t('pregnancy.healthcareProviders', 'Healthcare Providers')} 
              icon="medical-outline" 
              iconColor={colors.info}
            />
            {currentPregnancy.hospitalName && (
              <View style={styles.providerRow}>
                <Ionicons name="business-outline" size={20} color={colors.gray[500]} />
                <View style={styles.providerInfo}>
                  <Text style={[styles.providerLabel, { color: colors.textSecondary }]}>
                    {t('pregnancy.hospital', 'Hospital')}
                  </Text>
                  <Text style={[styles.providerName, { color: colors.textPrimary }]}>
                    {currentPregnancy.hospitalName}
                  </Text>
                </View>
              </View>
            )}
            {currentPregnancy.obgynName && (
              <View style={styles.providerRow}>
                <Ionicons name="person-outline" size={20} color={colors.gray[500]} />
                <View style={styles.providerInfo}>
                  <Text style={[styles.providerLabel, { color: colors.textSecondary }]}>
                    {t('pregnancy.doctor', 'Doctor')}
                  </Text>
                  <Text style={[styles.providerName, { color: colors.textPrimary }]}>
                    {currentPregnancy.obgynName}
                  </Text>
                </View>
              </View>
            )}
          </Card>
        )}



        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerIconButton: {
    padding: SPACING.xs,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    marginTop: 100,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  heroCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: '#FFFFFF',
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  heroVideo: {
    width: 160,
    height: 160,
    borderRadius: BORDER_RADIUS.md,
  },
  heroTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  heroGreeting: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.xs,
    lineHeight: 24,
  },
  heroWeekText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  createButton: {
    marginTop: SPACING.xl,
  },
  progressCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  weekBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  weekNumber: {
    fontSize: 28,
    fontWeight: FONT_WEIGHT.bold,
    color: '#fff',
  },
  weekLabel: {
    fontSize: FONT_SIZE.xs,
    color: '#fff',
    opacity: 0.9,
  },
  progressInfo: {
    flex: 1,
  },
  trimesterText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: 4,
  },
  daysText: {
    fontSize: FONT_SIZE.sm,
    marginBottom: 2,
  },
  remainingText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  eddText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  developmentCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  developmentContent: {
    flexDirection: 'row',
    marginTop: SPACING.md,
  },
  sizeIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  developmentInfo: {
    flex: 1,
  },
  developmentTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: 4,
  },
  developmentSize: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: 8,
  },
  developmentDescription: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  healthCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  healthMetrics: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  metricItem: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginTop: 4,
  },
  medicalCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  providerInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  providerLabel: {
    fontSize: FONT_SIZE.xs,
  },
  providerName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
});

export default PregnancyDashboardScreen;
