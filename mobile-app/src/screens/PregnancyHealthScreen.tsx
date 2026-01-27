/**
 * Pregnancy Health Screen
 * 
 * Screen for tracking mother's health during pregnancy,
 * including weight, blood pressure, symptoms, and wellness tips.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, addWeeks } from 'date-fns';

import { Card, SectionTitle, ProgressBar, Button } from '../components/common';
import { usePregnancyStore, useThemeStore, useAuthStore } from '../stores';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';

/**
 * Wellness tips by trimester
 */
const WELLNESS_TIPS = {
  1: [
    { icon: 'leaf-outline', title: 'Take prenatal vitamins', description: 'Folic acid is crucial in the first trimester' },
    { icon: 'water-outline', title: 'Stay hydrated', description: 'Drink 8-10 glasses of water daily' },
    { icon: 'bed-outline', title: 'Rest when needed', description: 'Fatigue is common - listen to your body' },
    { icon: 'restaurant-outline', title: 'Eat small meals', description: 'Helps manage morning sickness' },
  ],
  2: [
    { icon: 'walk-outline', title: 'Stay active', description: 'Light exercise like walking is beneficial' },
    { icon: 'nutrition-outline', title: 'Protein-rich diet', description: 'Support your baby\'s rapid growth' },
    { icon: 'body-outline', title: 'Monitor weight', description: 'Healthy weight gain is important' },
    { icon: 'happy-outline', title: 'Enjoy this phase', description: 'Many feel their best in 2nd trimester' },
  ],
  3: [
    { icon: 'bed-outline', title: 'Sleep on your side', description: 'Left side improves circulation' },
    { icon: 'fitness-outline', title: 'Practice breathing', description: 'Prepare for labor with breathing exercises' },
    { icon: 'bag-outline', title: 'Pack hospital bag', description: 'Be ready for when baby arrives' },
    { icon: 'people-outline', title: 'Attend classes', description: 'Prenatal and childbirth classes help' },
  ],
};

/**
 * Common pregnancy symptoms
 */
const COMMON_SYMPTOMS = [
  { id: 'fatigue', name: 'Fatigue', icon: 'battery-half-outline' },
  { id: 'nausea', name: 'Nausea', icon: 'medical-outline' },
  { id: 'backpain', name: 'Back Pain', icon: 'body-outline' },
  { id: 'headache', name: 'Headache', icon: 'bandage-outline' },
  { id: 'swelling', name: 'Swelling', icon: 'water-outline' },
  { id: 'heartburn', name: 'Heartburn', icon: 'flame-outline' },
  { id: 'insomnia', name: 'Insomnia', icon: 'moon-outline' },
  { id: 'cramps', name: 'Cramps', icon: 'pulse-outline' },
];

/**
 * Pregnancy Health Screen Component
 */
const PregnancyHealthScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const { currentPregnancy, isLoading, fetchActivePregnancies } = usePregnancyStore();
  const { accessToken } = useAuthStore();

  // Local state
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');

  useEffect(() => {
    if (accessToken) {
      fetchActivePregnancies();
    }
  }, [accessToken]);

  // Calculate current week and trimester
  const calculateProgress = () => {
    if (!currentPregnancy?.expectedDeliveryDate) {
      return { week: 0, trimester: 1, progress: 0 };
    }
    
    const edd = new Date(currentPregnancy.expectedDeliveryDate);
    const today = new Date();
    const conceptionDate = addWeeks(edd, -40);
    const msPerDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.floor((today.getTime() - conceptionDate.getTime()) / msPerDay);
    const week = Math.max(0, Math.min(42, Math.floor(totalDays / 7)));
    
    let trimester: 1 | 2 | 3 = 1;
    if (week > 27) trimester = 3;
    else if (week > 12) trimester = 2;
    
    const progress = Math.min((totalDays / 280) * 100, 100);
    
    return { week, trimester, progress };
  };

  const { week, trimester, progress } = calculateProgress();
  const tips = WELLNESS_TIPS[trimester] || WELLNESS_TIPS[1];

  // Toggle symptom selection
  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(s => s !== symptomId)
        : [...prev, symptomId]
    );
  };

  // Calculate recommended weight gain
  const getWeightGainInfo = () => {
    const preWeight = currentPregnancy?.prePregnancyWeight || 0;
    const currentWeight = currentPregnancy?.currentWeight || preWeight;
    const gain = currentWeight - preWeight;
    
    // Recommended total gain based on BMI (simplified)
    const recommendedTotal = 12; // kg average
    const weeklyRecommended = week <= 12 ? 0.5 : 0.5;
    const expectedGainNow = week <= 12 ? 1.5 : 1.5 + ((week - 12) * weeklyRecommended);
    
    return { preWeight, currentWeight, gain, recommendedTotal, expectedGainNow };
  };

  const weightInfo = getWeightGainInfo();

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
        <Ionicons name="fitness-outline" size={64} color={colors.gray[300]} />
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
          {t('pregnancy.noHealthData', 'No Pregnancy Profile')}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {t('pregnancy.createProfileForHealth', 'Create a pregnancy profile to track your health.')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm, backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t('pregnancy.health', 'Health & Wellness')}
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {t('pregnancy.trimester', 'Trimester')} {trimester} - {t('pregnancy.week', 'Week')} {week}
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Weight Tracking Card */}
        <Card style={styles.weightCard}>
          <SectionTitle 
            title={t('pregnancy.weightTracking', 'Weight Tracking')} 
            icon="scale-outline" 
            iconColor={colors.secondary}
          />
          <View style={styles.weightContent}>
            <View style={styles.weightStats}>
              <View style={styles.weightStat}>
                <Text style={[styles.weightLabel, { color: colors.textSecondary }]}>
                  {t('pregnancy.prePregnancy', 'Pre-pregnancy')}
                </Text>
                <Text style={[styles.weightValue, { color: colors.textPrimary }]}>
                  {weightInfo.preWeight > 0 ? `${weightInfo.preWeight} kg` : '--'}
                </Text>
              </View>
              <View style={[styles.weightStat, styles.currentWeightStat, { backgroundColor: colors.secondaryLight }]}>
                <Text style={[styles.weightLabel, { color: colors.secondary }]}>
                  {t('pregnancy.current', 'Current')}
                </Text>
                <Text style={[styles.weightValue, styles.currentWeightValue, { color: colors.secondary }]}>
                  {weightInfo.currentWeight > 0 ? `${weightInfo.currentWeight} kg` : '--'}
                </Text>
              </View>
              <View style={styles.weightStat}>
                <Text style={[styles.weightLabel, { color: colors.textSecondary }]}>
                  {t('pregnancy.gained', 'Gained')}
                </Text>
                <Text style={[styles.weightValue, { color: weightInfo.gain > 0 ? colors.success : colors.textPrimary }]}>
                  {weightInfo.gain > 0 ? `+${weightInfo.gain.toFixed(1)} kg` : '--'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.updateButton, { backgroundColor: colors.secondary }]}
              onPress={() => setShowWeightModal(true)}
            >
              <Ionicons name="add" size={20} color={colors.white} />
              <Text style={styles.updateButtonText}>
                {t('pregnancy.updateWeight', 'Update Weight')}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Symptoms Tracker */}
        <Card style={styles.symptomsCard}>
          <SectionTitle 
            title={t('pregnancy.symptomsToday', "Today's Symptoms")} 
            icon="clipboard-outline" 
            iconColor={colors.warning}
          />
          <View style={styles.symptomsGrid}>
            {COMMON_SYMPTOMS.map(symptom => {
              const isSelected = selectedSymptoms.includes(symptom.id);
              return (
                <TouchableOpacity
                  key={symptom.id}
                  style={[
                    styles.symptomChip,
                    { 
                      backgroundColor: isSelected ? colors.warning : colors.gray[50],
                      borderColor: isSelected ? colors.warning : colors.gray[200],
                    }
                  ]}
                  onPress={() => toggleSymptom(symptom.id)}
                >
                  <Ionicons 
                    name={symptom.icon as any} 
                    size={16} 
                    color={isSelected ? colors.white : colors.gray[500]} 
                  />
                  <Text style={[
                    styles.symptomText,
                    { color: isSelected ? colors.white : colors.textPrimary }
                  ]}>
                    {symptom.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedSymptoms.length > 0 && (
            <Text style={[styles.symptomsNote, { color: colors.textSecondary }]}>
              {t('pregnancy.symptomsNote', 'Tap to log your symptoms. Discuss persistent symptoms with your doctor.')}
            </Text>
          )}
        </Card>

        {/* Wellness Tips */}
        <Card style={styles.tipsCard}>
          <SectionTitle 
            title={t('pregnancy.wellnessTips', `Trimester ${trimester} Tips`)} 
            icon="bulb-outline" 
            iconColor={colors.info}
          />
          {tips.map((tip, index) => (
            <View 
              key={index} 
              style={[
                styles.tipRow,
                index < tips.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.gray[100] }
              ]}
            >
              <View style={[styles.tipIcon, { backgroundColor: colors.gray[100] }]}>
                <Ionicons name={tip.icon as any} size={20} color={colors.info} />
              </View>
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>
                  {tip.title}
                </Text>
                <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>
                  {tip.description}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Medical Info Summary */}
        {(currentPregnancy.medicalConditions?.length > 0 || currentPregnancy.allergies?.length > 0) && (
          <Card style={styles.medicalCard}>
            <SectionTitle 
              title={t('pregnancy.medicalInfo', 'Medical Information')} 
              icon="medical-outline" 
              iconColor={colors.error}
            />
            {currentPregnancy.medicalConditions?.length > 0 && (
              <View style={styles.medicalSection}>
                <Text style={[styles.medicalLabel, { color: colors.textSecondary }]}>
                  {t('pregnancy.conditions', 'Conditions')}
                </Text>
                <View style={styles.tagContainer}>
                  {currentPregnancy.medicalConditions.map((condition, i) => (
                    <View key={i} style={[styles.tag, { backgroundColor: colors.gray[100] }]}>
                      <Text style={[styles.tagText, { color: colors.error }]}>{condition}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {currentPregnancy.allergies?.length > 0 && (
              <View style={styles.medicalSection}>
                <Text style={[styles.medicalLabel, { color: colors.textSecondary }]}>
                  {t('pregnancy.allergies', 'Allergies')}
                </Text>
                <View style={styles.tagContainer}>
                  {currentPregnancy.allergies.map((allergy, i) => (
                    <View key={i} style={[styles.tag, { backgroundColor: colors.gray[100] }]}>
                      <Text style={[styles.tagText, { color: colors.warning }]}>{allergy}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Weight Update Modal */}
      <Modal
        visible={showWeightModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWeightModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {t('pregnancy.updateWeight', 'Update Weight')}
              </Text>
              <TouchableOpacity onPress={() => setShowWeightModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {t('pregnancy.currentWeight', 'Current Weight (kg)')}
              </Text>
              <TextInput
                style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                value={newWeight}
                onChangeText={setNewWeight}
                keyboardType="decimal-pad"
                placeholder="e.g., 65.5"
                placeholderTextColor={colors.gray[400]}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.gray[100] }]}
                  onPress={() => setShowWeightModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>
                    {t('common.cancel', 'Cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.secondary }]}
                  onPress={() => {
                    // TODO: Save weight to backend
                    Alert.alert(t('common.success', 'Success'), t('pregnancy.weightUpdated', 'Weight updated successfully'));
                    setShowWeightModal(false);
                    setNewWeight('');
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.white }]}>
                    {t('common.save', 'Save')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
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
  weightCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  weightContent: {
    marginTop: SPACING.md,
  },
  weightStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  weightStat: {
    alignItems: 'center',
    flex: 1,
  },
  currentWeightStat: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.xs,
  },
  weightLabel: {
    fontSize: FONT_SIZE.xs,
    marginBottom: 4,
  },
  weightValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  currentWeightValue: {
    fontSize: FONT_SIZE.xl,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  symptomsCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    gap: SPACING.xs,
  },
  symptomText: {
    fontSize: FONT_SIZE.sm,
  },
  symptomsNote: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.md,
    fontStyle: 'italic',
  },
  tipsCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  tipRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: 2,
  },
  tipDescription: {
    fontSize: FONT_SIZE.sm,
  },
  medicalCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  medicalSection: {
    marginTop: SPACING.md,
  },
  medicalLabel: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  tagText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.lg,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  modalButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
});

export default PregnancyHealthScreen;
