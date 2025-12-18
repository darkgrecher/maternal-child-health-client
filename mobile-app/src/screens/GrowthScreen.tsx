/**
 * Growth Screen
 * 
 * Displays growth tracking information including measurements,
 * growth charts, and WHO percentile comparisons.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import Svg, { Line, Path, Circle, G, Text as SvgText } from 'react-native-svg';

import { Card, Header, SectionTitle, Button, FloatingChatButton } from '../components/common';
import { useChildStore, useGrowthStore } from '../stores';
import { RootStackParamList, TabParamList } from '../types';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';
import { GrowthMeasurement, ChartData } from '../services/growthService';

type GrowthScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Growth'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - SPACING.md * 4;
const CHART_HEIGHT = 200;
const CHART_PADDING = { top: 20, right: 20, bottom: 30, left: 45 };

type ChartType = 'weight' | 'height' | 'head';

/**
 * Stat Card Component
 */
const StatCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: string;
  unit: string;
  percentile: number | null;
  label: string;
}> = ({ icon, iconColor, value, unit, percentile, label }) => {
  const getPercentileColor = (p: number | null) => {
    if (p === null) return COLORS.textSecondary;
    if (p < 3) return COLORS.error;
    if (p < 15) return COLORS.warning;
    if (p > 97) return COLORS.error;
    if (p > 85) return COLORS.warning;
    return COLORS.success;
  };

  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      {percentile !== null && (
        <Text style={[styles.statPercentile, { color: getPercentileColor(percentile) }]}>
          {percentile.toFixed(0)}th percentile
        </Text>
      )}
    </Card>
  );
};

/**
 * Simple Line Chart Component using react-native-svg
 */
const GrowthChart: React.FC<{
  chartData: ChartData | null;
  isLoading: boolean;
  chartType: ChartType;
}> = ({ chartData, isLoading, chartType }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View style={styles.chartPlaceholder}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.chartPlaceholderText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!chartData || chartData.dataPoints.length === 0) {
    return (
      <View style={styles.chartPlaceholder}>
        <Ionicons name="analytics-outline" size={48} color={COLORS.gray[300]} />
        <Text style={styles.chartPlaceholderText}>{t('growth.noMeasurements')}</Text>
        <Text style={styles.chartPlaceholderSubtext}>{t('growth.addFirstMeasurement')}</Text>
      </View>
    );
  }

  // Calculate chart bounds
  const dataPoints = chartData.dataPoints.filter(p => p.value !== null);
  
  // If no valid data points after filtering, show empty state
  if (dataPoints.length === 0) {
    return (
      <View style={styles.chartPlaceholder}>
        <Ionicons name="analytics-outline" size={48} color={COLORS.gray[300]} />
        <Text style={styles.chartPlaceholderText}>{t('growth.noMeasurements')}</Text>
        <Text style={styles.chartPlaceholderSubtext}>{t('growth.addFirstMeasurement')}</Text>
      </View>
    );
  }
  
  const allAges = dataPoints.map(p => p.ageInMonths);
  const allValues = dataPoints.map(p => p.value as number);
  
  // Filter reference data to relevant ages
  const maxDataAge = Math.max(...allAges);
  const filteredP50 = chartData.referenceData.p50.filter(p => p.age <= maxDataAge + 6);
  const filteredP3 = chartData.referenceData.p3.filter(p => p.age <= maxDataAge + 6);
  const filteredP97 = chartData.referenceData.p97.filter(p => p.age <= maxDataAge + 6);

  const minAge = 0;
  const maxAge = Math.max(maxDataAge + 3, 12);
  
  const refMinValue = Math.min(...filteredP3.map(p => p.value));
  const refMaxValue = Math.max(...filteredP97.map(p => p.value));
  const dataMinValue = Math.min(...allValues);
  const dataMaxValue = Math.max(...allValues);
  
  const minValue = Math.min(refMinValue, dataMinValue) * 0.95;
  const maxValue = Math.max(refMaxValue, dataMaxValue) * 1.05;

  // Scale functions
  const scaleX = (age: number) => {
    return CHART_PADDING.left + ((age - minAge) / (maxAge - minAge)) * (CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right);
  };

  const scaleY = (value: number) => {
    return CHART_HEIGHT - CHART_PADDING.bottom - ((value - minValue) / (maxValue - minValue)) * (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom);
  };

  // Generate path for reference lines
  const generatePath = (points: Array<{ age: number; value: number }>) => {
    const filteredPoints = points.filter(p => p.age >= minAge && p.age <= maxAge);
    if (filteredPoints.length < 2) return '';
    
    return filteredPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.age).toFixed(1)} ${scaleY(p.value).toFixed(1)}`)
      .join(' ');
  };

  // Generate data points path
  const sortedDataPoints = [...dataPoints].sort((a, b) => a.ageInMonths - b.ageInMonths);
  const dataPath = sortedDataPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.ageInMonths).toFixed(1)} ${scaleY(p.value as number).toFixed(1)}`)
    .join(' ');

  // Chart unit
  const unit = chartType === 'weight' ? 'kg' : 'cm';

  // Y-axis labels
  const yLabels = [minValue, (minValue + maxValue) / 2, maxValue];
  
  // X-axis labels
  const xLabels = [0, Math.round(maxAge / 2), maxAge];

  return (
    <View style={styles.chartContainer}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((fraction, i) => {
          const y = CHART_PADDING.top + fraction * (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom);
          return (
            <Line
              key={`grid-${i}`}
              x1={CHART_PADDING.left}
              y1={y}
              x2={CHART_WIDTH - CHART_PADDING.right}
              y2={y}
              stroke={COLORS.gray[200]}
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          );
        })}

        {/* Reference percentile lines */}
        <Path
          d={generatePath(chartData.referenceData.p3)}
          fill="none"
          stroke={COLORS.error}
          strokeWidth="1"
          strokeDasharray="4,2"
          opacity={0.5}
        />
        <Path
          d={generatePath(chartData.referenceData.p15)}
          fill="none"
          stroke={COLORS.warning}
          strokeWidth="1"
          strokeDasharray="4,2"
          opacity={0.5}
        />
        <Path
          d={generatePath(chartData.referenceData.p50)}
          fill="none"
          stroke={COLORS.success}
          strokeWidth="2"
          opacity={0.7}
        />
        <Path
          d={generatePath(chartData.referenceData.p85)}
          fill="none"
          stroke={COLORS.warning}
          strokeWidth="1"
          strokeDasharray="4,2"
          opacity={0.5}
        />
        <Path
          d={generatePath(chartData.referenceData.p97)}
          fill="none"
          stroke={COLORS.error}
          strokeWidth="1"
          strokeDasharray="4,2"
          opacity={0.5}
        />

        {/* Data line */}
        {dataPath && (
          <Path
            d={dataPath}
            fill="none"
            stroke={COLORS.primary}
            strokeWidth="2"
          />
        )}

        {/* Data points */}
        {sortedDataPoints.map((p, i) => (
          <Circle
            key={i}
            cx={scaleX(p.ageInMonths)}
            cy={scaleY(p.value as number)}
            r="5"
            fill={COLORS.primary}
            stroke={COLORS.white}
            strokeWidth="2"
          />
        ))}

        {/* Y-axis labels */}
        {yLabels.map((value, i) => (
          <SvgText
            key={`y-${i}`}
            x={CHART_PADDING.left - 5}
            y={scaleY(value) + 4}
            fontSize="10"
            fill={COLORS.textSecondary}
            textAnchor="end"
          >
            {value.toFixed(1)}
          </SvgText>
        ))}

        {/* X-axis labels */}
        {xLabels.map((age, i) => (
          <SvgText
            key={`x-${i}`}
            x={scaleX(age)}
            y={CHART_HEIGHT - 10}
            fontSize="10"
            fill={COLORS.textSecondary}
            textAnchor="middle"
          >
            {age}m
          </SvgText>
        ))}
      </Svg>

      {/* Legend */}
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>{t('growth.yourChild')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: COLORS.success }]} />
          <Text style={styles.legendText}>50th</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: COLORS.warning }]} />
          <Text style={styles.legendText}>15th/85th</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: COLORS.error }]} />
          <Text style={styles.legendText}>3rd/97th</Text>
        </View>
      </View>
    </View>
  );
};

/**
 * Measurement History Item
 */
const MeasurementItem: React.FC<{
  measurement: GrowthMeasurement;
  onDelete: (id: string) => void;
}> = ({ measurement, onDelete }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.measurementItem}>
      <View style={styles.measurementDate}>
        <Text style={styles.measurementDateText}>
          {format(new Date(measurement.measurementDate), 'MMM d, yyyy')}
        </Text>
        <Text style={styles.measurementAge}>{measurement.ageInMonths} months</Text>
      </View>
      <View style={styles.measurementValues}>
        <View style={styles.measurementValue}>
          <Text style={styles.measurementLabel}>{t('growth.weight')}</Text>
          <Text style={styles.measurementData}>{measurement.weight} kg</Text>
        </View>
        <View style={styles.measurementValue}>
          <Text style={styles.measurementLabel}>{t('growth.height')}</Text>
          <Text style={styles.measurementData}>{measurement.height} cm</Text>
        </View>
        {measurement.headCircumference && (
          <View style={styles.measurementValue}>
            <Text style={styles.measurementLabel}>{t('growth.head')}</Text>
            <Text style={styles.measurementData}>{measurement.headCircumference} cm</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(measurement.id)}
      >
        <Ionicons name="trash-outline" size={18} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );
};

/**
 * Add Measurement Modal
 */
const AddMeasurementModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { weight: number; height: number; headCircumference?: number; notes?: string }) => void;
  isLoading: boolean;
}> = ({ visible, onClose, onSubmit, isLoading }) => {
  const { t } = useTranslation();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [headCircumference, setHeadCircumference] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!weight || !height) {
      Alert.alert(t('common.error'), t('growth.weightHeightRequired'));
      return;
    }

    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    const headNum = headCircumference ? parseFloat(headCircumference) : undefined;

    if (isNaN(weightNum) || isNaN(heightNum)) {
      Alert.alert(t('common.error'), t('growth.invalidNumbers'));
      return;
    }

    onSubmit({
      weight: weightNum,
      height: heightNum,
      headCircumference: headNum,
      notes: notes || undefined,
    });

    // Reset form
    setWeight('');
    setHeight('');
    setHeadCircumference('');
    setNotes('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('growth.addMeasurement')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('growth.weight')} (kg) *</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="e.g., 8.5"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('growth.height')} (cm) *</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder="e.g., 70"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('growth.headCircumference')} (cm)</Text>
            <TextInput
              style={styles.input}
              value={headCircumference}
              onChangeText={setHeadCircumference}
              placeholder="e.g., 45"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('growth.notes')}</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('growth.notesPlaceholder')}
              multiline
            />
          </View>

          <Button
            title={isLoading ? t('common.saving') : t('growth.saveMeasurement')}
            onPress={handleSubmit}
            disabled={isLoading}
            style={styles.submitButton}
          />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Chart Type Selector
 */
const ChartTypeSelector: React.FC<{
  selected: ChartType;
  onSelect: (type: ChartType) => void;
}> = ({ selected, onSelect }) => {
  const { t } = useTranslation();

  const options: Array<{ key: ChartType; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { key: 'weight', label: t('growth.weight'), icon: 'scale-outline' },
    { key: 'height', label: t('growth.height'), icon: 'resize-outline' },
    { key: 'head', label: t('growth.head'), icon: 'ellipse-outline' },
  ];

  return (
    <View style={styles.chartTypeSelector}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.chartTypeButton,
            selected === option.key && styles.chartTypeButtonActive,
          ]}
          onPress={() => onSelect(option.key)}
        >
          <Ionicons
            name={option.icon}
            size={18}
            color={selected === option.key ? COLORS.white : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.chartTypeLabel,
              selected === option.key && styles.chartTypeLabelActive,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

/**
 * Growth Screen Component
 */
const GrowthScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<GrowthScreenNavigationProp>();
  const [selectedChart, setSelectedChart] = useState<ChartType>('weight');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const { profile } = useChildStore();
  const {
    growthData,
    chartData,
    isLoading,
    isChartLoading,
    fetchGrowthData,
    fetchChartData,
    addMeasurement,
    deleteMeasurement,
    getLatestMeasurement,
  } = useGrowthStore();

  const latestMeasurement = getLatestMeasurement();

  // Fetch data when profile changes
  useEffect(() => {
    if (profile?.id && profile.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      fetchGrowthData(profile.id);
    }
  }, [profile?.id]);

  // Fetch chart data when chart type changes
  useEffect(() => {
    if (profile?.id && profile.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      fetchChartData(profile.id, selectedChart);
    }
  }, [profile?.id, selectedChart]);

  const handleAddMeasurement = async (data: {
    weight: number;
    height: number;
    headCircumference?: number;
    notes?: string;
  }) => {
    if (!profile?.id) return;

    try {
      await addMeasurement(profile.id, {
        measurementDate: new Date().toISOString(),
        weight: data.weight,
        height: data.height,
        headCircumference: data.headCircumference,
        notes: data.notes,
      });
      setShowAddModal(false);
      // Refresh chart data
      fetchChartData(profile.id, selectedChart);
      Alert.alert(t('common.success'), t('growth.measurementAdded'));
    } catch (error) {
      Alert.alert(t('common.error'), t('growth.failedToAddMeasurement'));
    }
  };

  const handleDeleteMeasurement = (measurementId: string) => {
    Alert.alert(
      t('growth.deleteMeasurement'),
      t('growth.deleteConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMeasurement(measurementId);
              if (profile?.id) {
                fetchChartData(profile.id, selectedChart);
              }
            } catch (error) {
              Alert.alert(t('common.error'), t('growth.failedToDeleteMeasurement'));
            }
          },
        },
      ]
    );
  };

  if (isLoading && !growthData) {
    return (
      <View style={styles.container}>
        <Header 
          title={t('growth.title')} 
          subtitle={t('growth.subtitle')}
          icon="trending-up-outline"
          iconColor={COLORS.success}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title={t('growth.title')} 
        subtitle={t('growth.subtitle')}
        icon="trending-up-outline"
        iconColor={COLORS.success}
        tertiaryRightIcon="notifications-outline"
        onTertiaryRightPress={() => {
          // TODO: Navigate to notifications
        }}
        secondaryRightIcon="settings-outline"
        onSecondaryRightPress={() => {
          navigation.navigate('Settings');
        }}
        rightIcon="person-circle-outline"
        onRightPress={() => {
          navigation.navigate('ProfileMain');
        }}
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
            value={latestMeasurement?.weight?.toString() || '-'}
            unit="kg"
            percentile={latestMeasurement?.weightPercentile || null}
            label={t('growth.weight')}
          />
          <StatCard 
            icon="resize-outline"
            iconColor={COLORS.success}
            value={latestMeasurement?.height?.toString() || '-'}
            unit="cm"
            percentile={latestMeasurement?.heightPercentile || null}
            label={t('growth.height')}
          />
          <StatCard 
            icon="ellipse-outline"
            iconColor={COLORS.warning}
            value={latestMeasurement?.headCircumference?.toString() || '-'}
            unit="cm"
            percentile={latestMeasurement?.headCircumferencePercentile || null}
            label={t('growth.head')}
          />
        </View>

        {/* Add Measurement Button */}
        <Button
          title={t('growth.addMeasurement')}
          icon="add"
          onPress={() => setShowAddModal(true)}
          style={styles.addButton}
        />

        {/* Growth Charts */}
        <Card style={styles.chartCard}>
          <SectionTitle title={t('growth.growthCharts')} />
          
          <ChartTypeSelector
            selected={selectedChart}
            onSelect={setSelectedChart}
          />

          <GrowthChart
            chartData={chartData}
            isLoading={isChartLoading}
            chartType={selectedChart}
          />
        </Card>

        {/* Measurement History */}
        <Card style={styles.historyCard}>
          <SectionTitle title={t('growth.measurementHistory')} />
          
          {growthData?.measurements && growthData.measurements.length > 0 ? (
            [...growthData.measurements].reverse().slice(0, 5).map((measurement) => (
              <MeasurementItem
                key={measurement.id}
                measurement={measurement}
                onDelete={handleDeleteMeasurement}
              />
            ))
          ) : (
            <View style={styles.emptyHistory}>
              <Ionicons name="document-text-outline" size={32} color={COLORS.gray[300]} />
              <Text style={styles.emptyHistoryText}>{t('growth.noHistory')}</Text>
            </View>
          )}
        </Card>

        {/* Growth Status Card */}
        {latestMeasurement && (
          <Card style={styles.growthStatusCard}>
            <View style={styles.growthStatusContent}>
              <View style={styles.growthStatusIcon}>
                <Ionicons name="trending-up" size={24} color={COLORS.success} />
              </View>
              <View style={styles.growthStatusText}>
                <Text style={styles.growthStatusTitle}>{t('growth.growthStatus')}</Text>
                <Text style={styles.growthStatusMessage}>
                  {latestMeasurement.weightPercentile && latestMeasurement.weightPercentile >= 15 && latestMeasurement.weightPercentile <= 85
                    ? t('growth.growingWell')
                    : t('growth.monitorGrowth')}
                </Text>
                <Text style={styles.growthStatusNext}>
                  {t('growth.lastMeasurement')}: {format(new Date(latestMeasurement.measurementDate), 'MMM d, yyyy')}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Bottom spacing */}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* Add Measurement Modal */}
      <AddMeasurementModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddMeasurement}
        isLoading={isLoading}
      />
      
      <FloatingChatButton />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
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
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    marginTop: SPACING.xs,
  },

  // Add Button
  addButton: {
    marginTop: SPACING.sm,
  },

  // Chart Card
  chartCard: {
    marginTop: SPACING.sm,
  },
  chartTypeSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginVertical: SPACING.sm,
  },
  chartTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray[100],
  },
  chartTypeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  chartTypeLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  chartTypeLabelActive: {
    color: COLORS.white,
  },
  chartContainer: {
    marginVertical: SPACING.sm,
  },
  chartPlaceholder: {
    height: CHART_HEIGHT,
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
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  legendText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },

  // History Card
  historyCard: {
    marginTop: SPACING.sm,
  },
  measurementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  measurementDate: {
    width: 80,
  },
  measurementDateText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },
  measurementAge: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  measurementValues: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.md,
  },
  measurementValue: {
    alignItems: 'center',
  },
  measurementLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  measurementData: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyHistoryText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  inputContainer: {
    flex: 1,
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: SPACING.sm,
  },
});

export default GrowthScreen;
