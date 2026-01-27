/**
 * Pregnancy Checkups Screen
 * 
 * Screen for tracking prenatal checkups and appointments.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, parseISO, addWeeks } from 'date-fns';

import { Card, SectionTitle, Button } from '../components/common';
import { usePregnancyStore, useThemeStore, useAuthStore } from '../stores';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';
import { RootStackParamList } from '../types';

const APP_ICON = require('../../assets/ChatGPT Image Jan 25, 2026, 05_05_58 PM.png');

type PregnancyCheckupsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Standard prenatal checkup schedule
 */
const PRENATAL_SCHEDULE = [
  { week: 8, title: 'First Prenatal Visit', description: 'Initial exam, medical history, blood tests' },
  { week: 12, title: 'First Trimester Screening', description: 'Nuchal translucency scan, blood tests' },
  { week: 16, title: 'Second Trimester Visit', description: 'Routine checkup, fundal height measurement' },
  { week: 20, title: 'Anatomy Scan', description: 'Detailed ultrasound to check baby\'s development' },
  { week: 24, title: 'Glucose Screening', description: 'Gestational diabetes test' },
  { week: 28, title: 'Third Trimester Begins', description: 'Routine checkup, Rh antibody test' },
  { week: 30, title: 'Growth Check', description: 'Monitor baby\'s growth and position' },
  { week: 32, title: 'Routine Visit', description: 'Blood pressure, weight, fundal height' },
  { week: 34, title: 'Group B Strep Test', description: 'Screening for GBS bacteria' },
  { week: 36, title: 'Weekly Visits Begin', description: 'Check baby\'s position, cervix' },
  { week: 38, title: 'Pre-delivery Check', description: 'Discuss birth plan, check readiness' },
  { week: 40, title: 'Due Date', description: 'Full term - baby is ready!' },
];

/**
 * Pregnancy Checkups Screen Component
 */
const PregnancyCheckupsScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<PregnancyCheckupsNavigationProp>();
  const { colors } = useThemeStore();
  const { currentPregnancy, isLoading, fetchActivePregnancies } = usePregnancyStore();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (accessToken) {
      fetchActivePregnancies();
    }
  }, [accessToken]);

  // Calculate current week of pregnancy
  const calculateCurrentWeek = (): number => {
    if (!currentPregnancy?.expectedDeliveryDate) return 0;
    
    const edd = new Date(currentPregnancy.expectedDeliveryDate);
    const today = new Date();
    const conceptionDate = addWeeks(edd, -40);
    const msPerDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.floor((today.getTime() - conceptionDate.getTime()) / msPerDay);
    return Math.floor(totalDays / 7);
  };

  const currentWeek = calculateCurrentWeek();

  // Get status for each checkup
  const getCheckupStatus = (week: number): 'completed' | 'current' | 'upcoming' => {
    if (currentWeek > week + 2) return 'completed';
    if (currentWeek >= week - 1 && currentWeek <= week + 2) return 'current';
    return 'upcoming';
  };

  // Loading state
  if (isLoading && !currentPregnancy) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('common.loading', 'Loading...')}
        </Text>
      </View>
    );
  }

  // No pregnancy profile
  if (!currentPregnancy) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Ionicons name="calendar-outline" size={64} color={colors.gray[300]} />
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
          {t('pregnancy.noCheckups', 'No Pregnancy Profile')}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {t('pregnancy.createProfileForCheckups', 'Create a pregnancy profile to track your prenatal checkups.')}
        </Text>
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
                {t('pregnancy.checkups', 'Prenatal Checkups')}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {t('pregnancy.week', 'Week')} {currentWeek} - {t('pregnancy.trackYourVisits', 'Track your visits')}
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
        style={styles.scrollViewWithHeader}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Summary */}
        <Card style={[styles.summaryCard, { borderLeftColor: colors.secondary, borderLeftWidth: 4 }]}>
          <View style={styles.summaryContent}>
            <View style={[styles.weekCircle, { backgroundColor: colors.secondary }]}>
              <Text style={styles.weekNumber}>{currentWeek}</Text>
              <Text style={styles.weekLabel}>{t('pregnancy.weeks', 'weeks')}</Text>
            </View>
            <View style={styles.summaryInfo}>
              <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>
                {t('pregnancy.yourProgress', 'Your Progress')}
              </Text>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                {PRENATAL_SCHEDULE.filter(c => getCheckupStatus(c.week) === 'completed').length} {t('pregnancy.checkupsCompleted', 'checkups completed')}
              </Text>
              <Text style={[styles.summaryText, { color: colors.secondary }]}>
                {PRENATAL_SCHEDULE.filter(c => getCheckupStatus(c.week) === 'upcoming').length} {t('pregnancy.upcoming', 'upcoming')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Checkup Timeline */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {t('pregnancy.checkupSchedule', 'Checkup Schedule')}
        </Text>

        {PRENATAL_SCHEDULE.map((checkup, index) => {
          const status = getCheckupStatus(checkup.week);
          const isLast = index === PRENATAL_SCHEDULE.length - 1;
          
          return (
            <View key={checkup.week} style={styles.timelineItem}>
              {/* Timeline connector */}
              {!isLast && (
                <View 
                  style={[
                    styles.timelineConnector, 
                    { backgroundColor: status === 'completed' ? colors.secondary : colors.gray[200] }
                  ]} 
                />
              )}
              
              {/* Timeline dot */}
              <View 
                style={[
                  styles.timelineDot,
                  { 
                    backgroundColor: status === 'completed' ? colors.secondary : 
                                     status === 'current' ? colors.warning : colors.gray[200],
                    borderColor: status === 'current' ? colors.warning : 'transparent',
                    borderWidth: status === 'current' ? 3 : 0,
                  }
                ]}
              >
                {status === 'completed' && (
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                )}
              </View>
              
              {/* Checkup card */}
              <TouchableOpacity 
                style={[
                  styles.checkupCard,
                  { 
                    backgroundColor: colors.white,
                    borderColor: status === 'current' ? colors.warning : colors.gray[100],
                    borderWidth: status === 'current' ? 2 : 1,
                  }
                ]}
                onPress={() => {
                  Alert.alert(
                    checkup.title,
                    `${t('pregnancy.week', 'Week')} ${checkup.week}\n\n${checkup.description}`,
                    [{ text: t('common.ok', 'OK') }]
                  );
                }}
              >
                <View style={styles.checkupHeader}>
                  <View style={[styles.weekBadge, { backgroundColor: colors.secondaryLight }]}>
                    <Text style={[styles.weekBadgeText, { color: colors.secondary }]}>
                      {t('pregnancy.week', 'Week')} {checkup.week}
                    </Text>
                  </View>
                  {status === 'current' && (
                    <View style={[styles.currentBadge, { backgroundColor: colors.warning }]}>
                      <Text style={styles.currentBadgeText}>{t('pregnancy.now', 'NOW')}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.checkupTitle, { color: colors.textPrimary }]}>
                  {checkup.title}
                </Text>
                <Text style={[styles.checkupDescription, { color: colors.textSecondary }]}>
                  {checkup.description}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

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
    padding: SPACING.lg,
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
  scrollViewWithHeader: {
    flex: 1,
    marginTop: 100,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: 0,
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
  summaryCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  weekNumber: {
    fontSize: 24,
    fontWeight: FONT_WEIGHT.bold,
    color: '#fff',
  },
  weekLabel: {
    fontSize: FONT_SIZE.xs,
    color: '#fff',
    opacity: 0.9,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.md,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  timelineConnector: {
    position: 'absolute',
    left: 11,
    top: 24,
    bottom: -SPACING.md,
    width: 2,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    zIndex: 1,
  },
  checkupCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  checkupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  weekBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  weekBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  currentBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.xs,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: '#fff',
  },
  checkupTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: 4,
  },
  checkupDescription: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 18,
  },
});

export default PregnancyCheckupsScreen;
