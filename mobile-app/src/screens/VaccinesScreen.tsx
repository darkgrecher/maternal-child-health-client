/**
 * Vaccines Screen
 * 
 * Displays the immunization schedule, vaccine progress,
 * and individual vaccine status grouped by age.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import { Card, Header, ProgressBar, Badge, TabButton, SectionTitle, Button } from '../components/common';
import { useVaccineStore } from '../stores';
import { Vaccine, VaccinationStatus } from '../types';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';

/**
 * Get badge variant based on vaccine status
 */
const getStatusVariant = (status: VaccinationStatus): 'success' | 'error' | 'info' | 'warning' => {
  switch (status) {
    case 'completed': return 'success';
    case 'due': return 'error';
    case 'overdue': return 'error';
    case 'upcoming': return 'info';
    case 'missed': return 'warning';
    default: return 'info';
  }
};

/**
 * Get status display text
 */
const getStatusText = (status: VaccinationStatus, t: any): string => {
  return t(`vaccines.status.${status}`);
};

/**
 * Vaccine Item Component
 */
const VaccineItem: React.FC<{ vaccine: Vaccine; t: any }> = ({ vaccine, t }) => {
  return (
    <View style={styles.vaccineItem}>
      <View style={styles.vaccineIconContainer}>
        <View style={[
          styles.vaccineIcon,
          { backgroundColor: vaccine.status === 'completed' ? COLORS.success + '20' : COLORS.gray[100] }
        ]}>
          <Ionicons 
            name={vaccine.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'} 
            size={20} 
            color={vaccine.status === 'completed' ? COLORS.success : COLORS.gray[400]} 
          />
        </View>
      </View>
      <View style={styles.vaccineContent}>
        <Text style={styles.vaccineName}>{vaccine.shortName}</Text>
        <Text style={styles.vaccineDate}>
          {vaccine.status === 'completed' 
            ? `${t('vaccines.given')} ${format(new Date(vaccine.administeredDate!), 'yyyy-MM-dd')}`
            : `${t('vaccines.dueDate')} ${format(new Date(vaccine.scheduledDate), 'yyyy-MM-dd')}`
          }
        </Text>
      </View>
      <Badge 
        text={getStatusText(vaccine.status, t)} 
        variant={getStatusVariant(vaccine.status)}
        size="small"
      />
    </View>
  );
};

/**
 * Vaccines Screen Component
 */
const VaccinesScreen: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState('card');
  
  const { 
    getVaccinesByAgeGroup, 
    getCompletionPercentage, 
    getCompletedCount, 
    getTotalCount,
    getNextVaccine,
  } = useVaccineStore();

  const vaccineGroups = getVaccinesByAgeGroup();
  const completionPercentage = getCompletionPercentage();
  const completedCount = getCompletedCount();
  const totalCount = getTotalCount();
  const nextVaccine = getNextVaccine();

  const tabOptions = [
    { key: 'card', label: t('vaccines.vaccineCard') },
    { key: 'certificate', label: t('vaccines.certificate') },
  ];

  return (
    <View style={styles.container}>
      <Header 
        title={t('vaccines.title')} 
        subtitle={t('vaccines.subtitle')}
        icon="shield-checkmark-outline"
        iconColor={COLORS.success}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Circle Card */}
        <Card style={styles.progressCard}>
          <View style={styles.progressCircleContainer}>
            <View style={styles.progressCircle}>
              <View style={[styles.progressCircleInner, { borderColor: COLORS.success }]}>
                <Ionicons name="shield-checkmark" size={32} color={COLORS.success} />
              </View>
            </View>
            <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
            <Text style={styles.progressLabel}>{t('vaccines.immunizationComplete')}</Text>
          </View>
          
          <View style={styles.progressDetails}>
            <ProgressBar 
              progress={completionPercentage} 
              height={8}
              color={COLORS.success}
            />
            <View style={styles.progressStats}>
              <Text style={styles.progressStatsText}>
                {completedCount} of {totalCount} vaccines
              </Text>
              <Text style={styles.onTrackText}>{t('vaccines.onTrack')}</Text>
            </View>
          </View>
        </Card>

        {/* Tab Selector */}
        <TabButton 
          options={tabOptions}
          selectedKey={activeTab}
          onSelect={setActiveTab}
          style={styles.tabSelector}
        />

        {/* Vaccine Groups by Age */}
        {vaccineGroups.map((group) => (
          <Card key={group.ageLabel} style={styles.vaccineGroupCard}>
            <Text style={styles.ageGroupTitle}>{group.ageLabel}</Text>
            {group.vaccines.map((vaccine) => (
              <VaccineItem key={vaccine.id} vaccine={vaccine} t={t} />
            ))}
          </Card>
        ))}

        {/* Next Vaccination CTA */}
        {nextVaccine && (
          <Card style={styles.nextVaccineCard}>
            <View style={styles.nextVaccineContent}>
              <View style={styles.nextVaccineIcon}>
                <Ionicons name="calendar" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.nextVaccineText}>
                <Text style={styles.nextVaccineTitle}>{t('vaccines.nextVaccination')}</Text>
                <Text style={styles.nextVaccineDetails}>
                  {nextVaccine.shortName} due on {format(new Date(nextVaccine.scheduledDate), 'MMMM d, yyyy')}
                </Text>
                <Text style={styles.nextVaccineHint}>
                  {t('vaccines.scheduleAppointment')}
                </Text>
              </View>
            </View>
            <Button 
              title={t('vaccines.schedule')}
              onPress={() => {}}
              variant="primary"
              size="small"
            />
          </Card>
        )}

        {/* Bottom spacing */}
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
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },

  // Progress Card
  progressCard: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  progressCircleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  progressPercentage: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  progressLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  progressDetails: {
    width: '100%',
    marginTop: SPACING.sm,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  progressStatsText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  onTrackText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
    fontWeight: FONT_WEIGHT.medium,
  },

  // Tab Selector
  tabSelector: {
    marginVertical: SPACING.md,
  },

  // Vaccine Group
  vaccineGroupCard: {
    marginBottom: SPACING.sm,
  },
  ageGroupTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },

  // Vaccine Item
  vaccineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  vaccineIconContainer: {
    marginRight: SPACING.sm,
  },
  vaccineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaccineContent: {
    flex: 1,
  },
  vaccineName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },
  vaccineDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },

  // Next Vaccination Card
  nextVaccineCard: {
    backgroundColor: COLORS.primary + '10',
    marginTop: SPACING.sm,
  },
  nextVaccineContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  nextVaccineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  nextVaccineText: {
    flex: 1,
  },
  nextVaccineTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  nextVaccineDetails: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    marginTop: 2,
  },
  nextVaccineHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});

export default VaccinesScreen;
