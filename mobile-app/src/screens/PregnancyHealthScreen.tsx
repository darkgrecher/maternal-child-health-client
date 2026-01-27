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
  FlatList,
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
  const { 
    currentPregnancy, 
    isLoading, 
    fetchActivePregnancies, 
    updateCurrentWeight,
    saveSymptoms,
    getSymptomsHistory,
    getTodaySymptoms,
    updateMedicalConditions,
    updateAllergies,
  } = usePregnancyStore();
  const { accessToken } = useAuthStore();

  // Local state
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showSymptomsHistoryModal, setShowSymptomsHistoryModal] = useState(false);
  const [showMedicalEditModal, setShowMedicalEditModal] = useState(false);
  const [medicalEditType, setMedicalEditType] = useState<'conditions' | 'allergies'>('conditions');
  const [newWeight, setNewWeight] = useState('');
  const [symptomsHistory, setSymptomsHistory] = useState<any[]>([]);
  const [medicalItems, setMedicalItems] = useState<string[]>([]);
  const [newMedicalItem, setNewMedicalItem] = useState('');
  const [isSavingSymptoms, setIsSavingSymptoms] = useState(false);
  const [isSavingWeight, setIsSavingWeight] = useState(false);

  useEffect(() => {
    if (accessToken) {
      fetchActivePregnancies();
    }
  }, [accessToken]);

  // Load today's symptoms on mount
  useEffect(() => {
    if (currentPregnancy?.id) {
      loadTodaySymptoms();
    }
  }, [currentPregnancy?.id]);

  const loadTodaySymptoms = async () => {
    if (!currentPregnancy?.id) return;
    try {
      const todayData = await getTodaySymptoms(currentPregnancy.id);
      if (todayData && todayData.symptoms) {
        setSelectedSymptoms(todayData.symptoms);
      }
    } catch (error) {
      // Silently fail - symptoms might not exist for today yet
    }
  };

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

  // Toggle symptom selection and save
  const toggleSymptom = async (symptomId: string) => {
    const newSymptoms = selectedSymptoms.includes(symptomId)
      ? selectedSymptoms.filter(s => s !== symptomId)
      : [...selectedSymptoms, symptomId];
    
    setSelectedSymptoms(newSymptoms);
    
    // Auto-save symptoms
    if (currentPregnancy?.id) {
      setIsSavingSymptoms(true);
      try {
        await saveSymptoms(currentPregnancy.id, {
          weekOfPregnancy: week,
          symptoms: newSymptoms,
        });
      } catch (error) {
        Alert.alert(t('common.error', 'Error'), t('pregnancy.failedToSaveSymptoms', 'Failed to save symptoms'));
      } finally {
        setIsSavingSymptoms(false);
      }
    }
  };

  // Load symptoms history
  const handleShowSymptomsHistory = async () => {
    if (!currentPregnancy?.id) return;
    
    try {
      const history = await getSymptomsHistory(currentPregnancy.id);
      setSymptomsHistory(history);
      setShowSymptomsHistoryModal(true);
    } catch (error) {
      Alert.alert(t('common.error', 'Error'), t('pregnancy.failedToLoadHistory', 'Failed to load symptoms history'));
    }
  };

  // Open medical edit modal
  const handleEditMedicalInfo = (type: 'conditions' | 'allergies') => {
    setMedicalEditType(type);
    const items = type === 'conditions' 
      ? currentPregnancy?.medicalConditions || []
      : currentPregnancy?.allergies || [];
    setMedicalItems([...items]);
    setNewMedicalItem('');
    setShowMedicalEditModal(true);
  };

  // Add medical item
  const handleAddMedicalItem = () => {
    if (!newMedicalItem.trim()) return;
    if (medicalItems.includes(newMedicalItem.trim())) {
      Alert.alert(t('common.error', 'Error'), t('pregnancy.itemExists', 'This item already exists'));
      return;
    }
    setMedicalItems([...medicalItems, newMedicalItem.trim()]);
    setNewMedicalItem('');
  };

  // Remove medical item
  const handleRemoveMedicalItem = (index: number) => {
    setMedicalItems(medicalItems.filter((_, i) => i !== index));
  };

  // Save medical info
  const handleSaveMedicalInfo = async () => {
    if (!currentPregnancy?.id) return;

    try {
      if (medicalEditType === 'conditions') {
        await updateMedicalConditions(currentPregnancy.id, medicalItems);
      } else {
        await updateAllergies(currentPregnancy.id, medicalItems);
      }
      Alert.alert(t('common.success', 'Success'), t('pregnancy.medicalInfoUpdated', 'Medical information updated'));
      setShowMedicalEditModal(false);
    } catch (error) {
      Alert.alert(t('common.error', 'Error'), t('pregnancy.failedToUpdateMedicalInfo', 'Failed to update medical information'));
    }
  };

  // Save weight to database
  const handleSaveWeight = async () => {
    const weightValue = parseFloat(newWeight);
    if (isNaN(weightValue) || weightValue <= 0 || weightValue > 300) {
      Alert.alert(t('common.error', 'Error'), t('pregnancy.invalidWeight', 'Please enter a valid weight'));
      return;
    }

    if (!currentPregnancy?.id) return;

    setIsSavingWeight(true);
    try {
      await updateCurrentWeight(currentPregnancy.id, weightValue);
      Alert.alert(t('common.success', 'Success'), t('pregnancy.weightUpdated', 'Weight updated successfully'));
      setShowWeightModal(false);
      setNewWeight('');
    } catch (error) {
      Alert.alert(t('common.error', 'Error'), t('pregnancy.failedToUpdateWeight', 'Failed to update weight'));
    } finally {
      setIsSavingWeight(false);
    }
  };

  // Get symptom name from ID
  const getSymptomName = (id: string) => {
    return COMMON_SYMPTOMS.find(s => s.id === id)?.name || id;
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
          <View style={styles.sectionHeaderWithAction}>
            <SectionTitle 
              title={t('pregnancy.symptomsToday', "Today's Symptoms")} 
              icon="clipboard-outline" 
              iconColor={colors.warning}
            />
            <TouchableOpacity 
              style={[styles.historyButton, { borderColor: colors.warning }]}
              onPress={handleShowSymptomsHistory}
            >
              <Ionicons name="time-outline" size={16} color={colors.warning} />
              <Text style={[styles.historyButtonText, { color: colors.warning }]}>
                {t('pregnancy.history', 'History')}
              </Text>
            </TouchableOpacity>
          </View>
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
                  disabled={isSavingSymptoms}
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
          {isSavingSymptoms && (
            <View style={styles.savingIndicator}>
              <ActivityIndicator size="small" color={colors.warning} />
              <Text style={[styles.savingText, { color: colors.textSecondary }]}>
                {t('common.saving', 'Saving...')}
              </Text>
            </View>
          )}
          <Text style={[styles.symptomsNote, { color: colors.textSecondary }]}>
            {t('pregnancy.symptomsNote', 'Tap to log your symptoms. They are saved automatically.')}
          </Text>
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
        <Card style={styles.medicalCard}>
          <SectionTitle 
            title={t('pregnancy.medicalInfo', 'Medical Information')} 
            icon="medical-outline" 
            iconColor={colors.error}
          />
          
          {/* Conditions */}
          <View style={styles.medicalSection}>
            <View style={styles.medicalLabelRow}>
              <Text style={[styles.medicalLabel, { color: colors.textSecondary }]}>
                {t('pregnancy.conditions', 'Conditions')}
              </Text>
              <TouchableOpacity 
                onPress={() => handleEditMedicalInfo('conditions')}
                style={styles.editButton}
              >
                <Ionicons name="pencil" size={16} color={colors.primary} />
                <Text style={[styles.editButtonText, { color: colors.primary }]}>
                  {t('common.edit', 'Edit')}
                </Text>
              </TouchableOpacity>
            </View>
            {currentPregnancy.medicalConditions?.length > 0 ? (
              <View style={styles.tagContainer}>
                {currentPregnancy.medicalConditions.map((condition, i) => (
                  <View key={i} style={[styles.tag, { backgroundColor: colors.gray[100] }]}>
                    <Text style={[styles.tagText, { color: colors.error }]}>{condition}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.noDataText, { color: colors.gray[400] }]}>
                {t('pregnancy.noConditions', 'No conditions recorded')}
              </Text>
            )}
          </View>
          
          {/* Allergies */}
          <View style={styles.medicalSection}>
            <View style={styles.medicalLabelRow}>
              <Text style={[styles.medicalLabel, { color: colors.textSecondary }]}>
                {t('pregnancy.allergies', 'Allergies')}
              </Text>
              <TouchableOpacity 
                onPress={() => handleEditMedicalInfo('allergies')}
                style={styles.editButton}
              >
                <Ionicons name="pencil" size={16} color={colors.primary} />
                <Text style={[styles.editButtonText, { color: colors.primary }]}>
                  {t('common.edit', 'Edit')}
                </Text>
              </TouchableOpacity>
            </View>
            {currentPregnancy.allergies?.length > 0 ? (
              <View style={styles.tagContainer}>
                {currentPregnancy.allergies.map((allergy, i) => (
                  <View key={i} style={[styles.tag, { backgroundColor: colors.gray[100] }]}>
                    <Text style={[styles.tagText, { color: colors.warning }]}>{allergy}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.noDataText, { color: colors.gray[400] }]}>
                {t('pregnancy.noAllergies', 'No allergies recorded')}
              </Text>
            )}
          </View>
        </Card>

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
                  onPress={handleSaveWeight}
                  disabled={isSavingWeight}
                >
                  {isSavingWeight ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={[styles.modalButtonText, { color: colors.white }]}>
                      {t('common.save', 'Save')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Symptoms History Modal */}
      <Modal
        visible={showSymptomsHistoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSymptomsHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.historyModal, { backgroundColor: colors.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {t('pregnancy.symptomsHistory', 'Symptoms History')}
              </Text>
              <TouchableOpacity onPress={() => setShowSymptomsHistoryModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={symptomsHistory}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={[styles.historyItem, { borderBottomColor: colors.gray[100] }]}>
                  <View style={styles.historyDateRow}>
                    <Text style={[styles.historyDate, { color: colors.textPrimary }]}>
                      {format(new Date(item.date), 'MMM d, yyyy')}
                    </Text>
                    <Text style={[styles.historyWeek, { color: colors.textSecondary }]}>
                      Week {item.weekOfPregnancy}
                    </Text>
                  </View>
                  <View style={styles.historySymptoms}>
                    {item.symptoms.map((s: string, i: number) => (
                      <View key={i} style={[styles.historyTag, { backgroundColor: colors.warning + '20' }]}>
                        <Text style={[styles.historyTagText, { color: colors.warning }]}>
                          {getSymptomName(s)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyHistory}>
                  <Ionicons name="document-text-outline" size={48} color={colors.gray[300]} />
                  <Text style={[styles.emptyHistoryText, { color: colors.gray[400] }]}>
                    {t('pregnancy.noSymptomsHistory', 'No symptoms history yet')}
                  </Text>
                </View>
              }
              contentContainerStyle={styles.historyList}
            />
          </View>
        </View>
      </Modal>

      {/* Medical Info Edit Modal */}
      <Modal
        visible={showMedicalEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMedicalEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.medicalModal, { backgroundColor: colors.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {medicalEditType === 'conditions' 
                  ? t('pregnancy.editConditions', 'Edit Conditions')
                  : t('pregnancy.editAllergies', 'Edit Allergies')
                }
              </Text>
              <TouchableOpacity onPress={() => setShowMedicalEditModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {/* Add new item */}
              <View style={styles.addItemRow}>
                <TextInput
                  style={[styles.addItemInput, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                  value={newMedicalItem}
                  onChangeText={setNewMedicalItem}
                  placeholder={medicalEditType === 'conditions' 
                    ? t('pregnancy.enterCondition', 'Enter condition')
                    : t('pregnancy.enterAllergy', 'Enter allergy')
                  }
                  placeholderTextColor={colors.gray[400]}
                />
                <TouchableOpacity
                  style={[styles.addItemButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddMedicalItem}
                >
                  <Ionicons name="add" size={24} color={colors.white} />
                </TouchableOpacity>
              </View>
              
              {/* List of items */}
              <View style={styles.itemsList}>
                {medicalItems.map((item, index) => (
                  <View key={index} style={[styles.medicalItem, { borderColor: colors.gray[200] }]}>
                    <Text style={[styles.medicalItemText, { color: colors.textPrimary }]}>
                      {item}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => handleRemoveMedicalItem(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close-circle" size={24} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              
              {medicalItems.length === 0 && (
                <Text style={[styles.noItemsText, { color: colors.gray[400] }]}>
                  {medicalEditType === 'conditions'
                    ? t('pregnancy.noConditionsYet', 'No conditions added yet')
                    : t('pregnancy.noAllergiesYet', 'No allergies added yet')
                  }
                </Text>
              )}
            </ScrollView>
            <View style={styles.modalActionsBottom}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.gray[100] }]}
                onPress={() => setShowMedicalEditModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>
                  {t('common.cancel', 'Cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveMedicalInfo}
              >
                <Text style={[styles.modalButtonText, { color: colors.white }]}>
                  {t('common.save', 'Save')}
                </Text>
              </TouchableOpacity>
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
  sectionHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: 4,
  },
  historyButtonText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  savingText: {
    fontSize: FONT_SIZE.xs,
  },
  medicalLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  noDataText: {
    fontSize: FONT_SIZE.sm,
    fontStyle: 'italic',
  },
  historyModal: {
    maxHeight: '70%',
  },
  medicalModal: {
    maxHeight: '70%',
  },
  historyList: {
    padding: SPACING.lg,
  },
  historyItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  historyDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  historyDate: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  historyWeek: {
    fontSize: FONT_SIZE.sm,
  },
  historySymptoms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  historyTag: {
    paddingVertical: 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  historyTagText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyHistoryText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.sm,
  },
  addItemRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  addItemInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
  },
  addItemButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsList: {
    gap: SPACING.sm,
  },
  medicalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
  },
  medicalItemText: {
    fontSize: FONT_SIZE.md,
    flex: 1,
  },
  removeButton: {
    marginLeft: SPACING.sm,
  },
  noItemsText: {
    textAlign: 'center',
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.md,
    fontStyle: 'italic',
  },
  modalActionsBottom: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
  },
});

export default PregnancyHealthScreen;
