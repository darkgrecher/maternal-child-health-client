/**
 * Growth Screen
 * 
 * Displays growth tracking information including measurements,
 * growth charts, and development milestones.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Card, Header, TabButton, SectionTitle, Badge, Button } from '../components/common';
import { useChildStore } from '../stores';
import { DevelopmentMilestone } from '../types';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';
import { format } from 'date-fns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Stat Card Component
 */
const StatCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: string;
  unit: string;
  percentile: number;
}> = ({ icon, iconColor, value, unit, percentile }) => {
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      <Text style={[styles.statPercentile, { color: iconColor }]}>{percentile}th</Text>
    </Card>
  );
};

/**
 * Milestone Item Component
 */
const MilestoneItem: React.FC<{ milestone: DevelopmentMilestone; t: any }> = ({ milestone, t }) => {
  const isAchieved = milestone.status === 'achieved';
  
  return (
    <View style={styles.milestoneItem}>
      <View style={[
        styles.milestoneIcon,
        { backgroundColor: isAchieved ? COLORS.success + '20' : COLORS.gray[100] }
      ]}>
        <Ionicons 
          name={isAchieved ? 'checkmark-circle' : 'ellipse-outline'} 
          size={20} 
          color={isAchieved ? COLORS.success : COLORS.gray[400]} 
        />
      </View>
      <View style={styles.milestoneContent}>
        <Text style={styles.milestoneName}>{milestone.name}</Text>
        <Text style={[
          styles.milestoneDate,
          { color: isAchieved ? COLORS.success : COLORS.textSecondary }
        ]}>
          {isAchieved 
            ? `${t('growth.achieved')} ${milestone.achievedDate}`
            : `${t('growth.expected')} ${milestone.expectedAgeMonths}m`
          }
        </Text>
      </View>
      <Badge 
        text={`${milestone.expectedAgeMonths}m`}
        variant={isAchieved ? 'success' : 'default'}
        size="small"
      />
    </View>
  );
};

/**
 * Growth Screen Component
 */
const GrowthScreen: React.FC = () => {
  const { t } = useTranslation();
  const [selectedChart, setSelectedChart] = useState('weight');
  
  const { growthMeasurements, milestones, getLatestMeasurement } = useChildStore();
  const latestMeasurement = getLatestMeasurement();

  const chartOptions = [
    { key: 'weight', label: t('growth.weight') },
    { key: 'height', label: t('growth.height') },
    { key: 'head', label: t('growth.head') },
  ];

  // Prepare chart data
  const getChartData = () => {
    switch (selectedChart) {
      case 'weight':
        return growthMeasurements.map(m => m.weight);
      case 'height':
        return growthMeasurements.map(m => m.height);
      case 'head':
        return growthMeasurements.map(m => m.headCircumference || 0);
      default:
        return [];
    }
  };

  const chartData = getChartData();
  const latestValue = chartData[chartData.length - 1] || 0;
  const latestAge = latestMeasurement?.ageInMonths || 0;

  return (
    <View style={styles.container}>
      <Header 
        title={t('growth.title')} 
        subtitle={t('growth.subtitle')}
        icon="trending-up-outline"
        iconColor={COLORS.success}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <StatCard 
            icon="scale-outline"
            iconColor={COLORS.info}
            value={latestMeasurement?.weight?.toString() || '0'}
            unit="kg"
            percentile={latestMeasurement?.weightPercentile || 0}
          />
          <StatCard 
            icon="resize-outline"
            iconColor={COLORS.success}
            value={latestMeasurement?.height?.toString() || '0'}
            unit="cm"
            percentile={latestMeasurement?.heightPercentile || 0}
          />
          <StatCard 
            icon="ellipse-outline"
            iconColor={COLORS.warning}
            value={latestMeasurement?.headCircumference?.toString() || '0'}
            unit="cm"
            percentile={latestMeasurement?.headCircumferencePercentile || 0}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Button
            title={t('growth.addMeasurement')}
            icon="add"
            onPress={() => {
              // TODO: Navigate to add measurement screen
            }}
            style={styles.actionButton}
          />
          <Button
            title={t('growth.photoProgress')}
            icon="camera-outline"
            variant="outline"
            onPress={() => {
              // TODO: Navigate to photo progress
            }}
            style={styles.actionButton}
          />
        </View>

        {/* Growth Charts */}
        <Card style={styles.chartCard}>
          <SectionTitle title={t('growth.growthCharts')} />
          
          <TabButton 
            options={chartOptions}
            selectedKey={selectedChart}
            onSelect={setSelectedChart}
            style={styles.chartTabSelector}
          />

          <Text style={styles.chartTitle}>
            {selectedChart === 'weight' && t('growth.weightForAge')}
            {selectedChart === 'height' && t('growth.heightForAge')}
            {selectedChart === 'head' && t('growth.headCircumference')}
          </Text>

          {/* Chart Placeholder */}
          <View style={styles.chartContainer}>
            <View style={styles.chartPlaceholder}>
              <Ionicons name="analytics-outline" size={48} color={COLORS.gray[300]} />
              <Text style={styles.chartPlaceholderText}>Growth Chart</Text>
              <Text style={styles.chartPlaceholderSubtext}>
                {chartData.length} measurements recorded
              </Text>
            </View>
          </View>

          <Text style={styles.chartLatest}>
            {t('growth.latest')} {latestValue} {selectedChart === 'weight' ? 'kg' : 'cm'} {t('growth.atAge', { age: latestAge })}
          </Text>
        </Card>

        {/* Development Milestones */}
        <Card style={styles.milestonesCard}>
          <SectionTitle title={t('growth.developmentMilestones')} />
          
          {milestones.slice(0, 6).map((milestone) => (
            <MilestoneItem key={milestone.id} milestone={milestone} t={t} />
          ))}
        </Card>

        {/* Growth Status Card */}
        <Card style={styles.growthStatusCard}>
          <View style={styles.growthStatusContent}>
            <View style={styles.growthStatusIcon}>
              <Ionicons name="trending-up" size={24} color={COLORS.success} />
            </View>
            <View style={styles.growthStatusText}>
              <Text style={styles.growthStatusTitle}>{t('growth.growthStatus')}</Text>
              <Text style={styles.growthStatusMessage}>{t('growth.growingWell')}</Text>
              <Text style={styles.growthStatusNext}>
                {t('growth.nextMeasurement')} January 1, 2025
              </Text>
            </View>
          </View>
        </Card>

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

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  statUnit: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  statPercentile: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    marginTop: SPACING.xs,
  },

  // Action Row
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  actionButton: {
    flex: 1,
  },

  // Chart Card
  chartCard: {
    marginTop: SPACING.sm,
  },
  chartTabSelector: {
    marginVertical: SPACING.sm,
  },
  chartTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  chartContainer: {
    height: 200,
    marginVertical: SPACING.sm,
  },
  chart: {
    height: 160,
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.md,
  },
  noChartData: {
    height: 160,
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noChartDataText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.xs,
  },
  xAxisLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  chartLatest: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },

  // Milestones Card
  milestonesCard: {
    marginTop: SPACING.sm,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  milestoneIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },
  milestoneDate: {
    fontSize: FONT_SIZE.xs,
  },

  // Chart Placeholder
  chartPlaceholder: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.md,
  },
  chartPlaceholderText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  chartPlaceholderSubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[400],
    marginTop: SPACING.xs,
  },

  // Growth Status Card
  growthStatusCard: {
    backgroundColor: COLORS.success + '10',
    marginTop: SPACING.sm,
  },
  growthStatusContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  growthStatusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  growthStatusText: {
    flex: 1,
  },
  growthStatusTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  growthStatusMessage: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  growthStatusNext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.success,
    marginTop: SPACING.xs,
  },
});

export default GrowthScreen;
