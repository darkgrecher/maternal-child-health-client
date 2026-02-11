/**
 * Edit Pregnancy Profile Screen
 * 
 * Screen for editing an existing pregnancy profile with pre-filled data.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';

import { Card, Header, Button } from '../components/common';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';
import { useThemeStore, usePregnancyStore } from '../stores';
import { BloodType, RootStackParamList } from '../types';

type EditPregnancyRouteProp = RouteProp<RootStackParamList, 'EditPregnancy'>;

const BLOOD_TYPE_OPTIONS: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'];

/**
 * Edit Pregnancy Profile Screen Component
 */
const EditPregnancyScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<EditPregnancyRouteProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const { currentPregnancy, updatePregnancy, fetchActivePregnancies } = usePregnancyStore();

  const { pregnancyId } = route.params;

  // Form state - Mother's Information
  const [motherFirstName, setMotherFirstName] = useState('');
  const [motherLastName, setMotherLastName] = useState('');
  const [motherDateOfBirth, setMotherDateOfBirth] = useState(new Date());
  const [showMotherDOBPicker, setShowMotherDOBPicker] = useState(false);
  const [bloodType, setBloodType] = useState<BloodType>('unknown');
  
  // Form state - Pregnancy Information
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(new Date());
  const [showEDDPicker, setShowEDDPicker] = useState(false);
  const [lastMenstrualPeriod, setLastMenstrualPeriod] = useState<Date | null>(null);
  const [showLMPPicker, setShowLMPPicker] = useState(false);
  const [gravida, setGravida] = useState('');
  const [para, setPara] = useState('');
  
  // Form state - Medical Information
  const [prePregnancyWeight, setPrePregnancyWeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [height, setHeight] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  
  // Form state - Healthcare Providers
  const [hospitalName, setHospitalName] = useState('');
  const [obgynName, setObgynName] = useState('');
  const [obgynContact, setObgynContact] = useState('');
  const [midwifeName, setMidwifeName] = useState('');
  const [midwifeContact, setMidwifeContact] = useState('');
  
  // Form state - Emergency Contact
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Pre-fill data from current pregnancy
  useEffect(() => {
    if (currentPregnancy && currentPregnancy.id === pregnancyId) {
      prefillData(currentPregnancy);
    } else {
      // Need to fetch the pregnancy
      fetchActivePregnancies().then(() => {
        setIsInitializing(false);
      });
    }
  }, []);

  useEffect(() => {
    if (currentPregnancy && currentPregnancy.id === pregnancyId) {
      prefillData(currentPregnancy);
      setIsInitializing(false);
    }
  }, [currentPregnancy]);

  const prefillData = (pregnancy: any) => {
    setMotherFirstName(pregnancy.motherFirstName || '');
    setMotherLastName(pregnancy.motherLastName || '');
    
    if (pregnancy.motherDateOfBirth) {
      try {
        setMotherDateOfBirth(parseISO(pregnancy.motherDateOfBirth));
      } catch (e) { }
    }
    
    setBloodType(pregnancy.motherBloodType || 'unknown');
    
    if (pregnancy.expectedDeliveryDate) {
      try {
        setExpectedDeliveryDate(parseISO(pregnancy.expectedDeliveryDate));
      } catch (e) { }
    }
    
    if (pregnancy.lastMenstrualPeriod) {
      try {
        setLastMenstrualPeriod(parseISO(pregnancy.lastMenstrualPeriod));
      } catch (e) { }
    }
    
    setGravida(pregnancy.gravida?.toString() || '');
    setPara(pregnancy.para?.toString() || '');
    setPrePregnancyWeight(pregnancy.prePregnancyWeight?.toString() || '');
    setCurrentWeight(pregnancy.currentWeight?.toString() || '');
    setHeight(pregnancy.height?.toString() || '');
    
    setMedicalConditions(pregnancy.medicalConditions?.join(', ') || '');
    setAllergies(pregnancy.allergies?.join(', ') || '');
    setMedications(pregnancy.medications?.join(', ') || '');
    
    setHospitalName(pregnancy.hospitalName || '');
    setObgynName(pregnancy.obgynName || '');
    setObgynContact(pregnancy.obgynContact || '');
    setMidwifeName(pregnancy.midwifeName || '');
    setMidwifeContact(pregnancy.midwifeContact || '');
    
    setEmergencyContactName(pregnancy.emergencyContactName || '');
    setEmergencyContactPhone(pregnancy.emergencyContactPhone || '');
    setEmergencyContactRelation(pregnancy.emergencyContactRelation || '');
  };

  const handleMotherDOBChange = (event: any, selectedDate?: Date) => {
    setShowMotherDOBPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setMotherDateOfBirth(selectedDate);
    }
  };

  const handleEDDChange = (event: any, selectedDate?: Date) => {
    setShowEDDPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setExpectedDeliveryDate(selectedDate);
    }
  };

  const handleLMPChange = (event: any, selectedDate?: Date) => {
    setShowLMPPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setLastMenstrualPeriod(selectedDate);
    }
  };

  const validateForm = (): boolean => {
    if (!motherFirstName.trim()) {
      Alert.alert(t('common.error'), t('pregnancy.motherFirstNameRequired', 'Mother\'s first name is required'));
      return false;
    }
    if (!motherLastName.trim()) {
      Alert.alert(t('common.error'), t('pregnancy.motherLastNameRequired', 'Mother\'s last name is required'));
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const pregnancyData = {
        motherFirstName: motherFirstName.trim(),
        motherLastName: motherLastName.trim(),
        motherDateOfBirth: format(motherDateOfBirth, 'yyyy-MM-dd'),
        motherBloodType: bloodType !== 'unknown' ? bloodType : undefined,
        expectedDeliveryDate: format(expectedDeliveryDate, 'yyyy-MM-dd'),
        lastMenstrualPeriod: lastMenstrualPeriod ? format(lastMenstrualPeriod, 'yyyy-MM-dd') : undefined,
        gravida: gravida ? parseInt(gravida, 10) : undefined,
        para: para ? parseInt(para, 10) : undefined,
        prePregnancyWeight: prePregnancyWeight ? parseFloat(prePregnancyWeight) : undefined,
        currentWeight: currentWeight ? parseFloat(currentWeight) : undefined,
        height: height ? parseFloat(height) : undefined,
        medicalConditions: medicalConditions.trim() ? medicalConditions.split(',').map(s => s.trim()).filter(s => s) : undefined,
        allergies: allergies.trim() ? allergies.split(',').map(s => s.trim()).filter(s => s) : undefined,
        medications: medications.trim() ? medications.split(',').map(s => s.trim()).filter(s => s) : undefined,
        hospitalName: hospitalName.trim() || undefined,
        obgynName: obgynName.trim() || undefined,
        obgynContact: obgynContact.trim() || undefined,
        midwifeName: midwifeName.trim() || undefined,
        midwifeContact: midwifeContact.trim() || undefined,
        emergencyContactName: emergencyContactName.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone.trim() || undefined,
        emergencyContactRelation: emergencyContactRelation.trim() || undefined,
      };

      await updatePregnancy(pregnancyId, pregnancyData);
      
      Alert.alert(
        t('common.success'),
        t('pregnancy.profileUpdated', 'Pregnancy profile updated successfully'),
        [{ text: t('common.ok', 'OK'), onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Failed to update pregnancy profile:', error);
      Alert.alert(
        t('common.error'), 
        t('pregnancy.failedToUpdate', 'Failed to update pregnancy profile. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('common.loading', 'Loading...')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <Header
        title={t('pregnancy.editTitle', 'Edit Pregnancy Profile')}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Mother's Information Section */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={24} color={colors.secondary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('pregnancy.motherInfo', "Mother's Information")}
              </Text>
            </View>

            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t('pregnancy.firstName', 'First Name')} *
              </Text>
              <TextInput
                style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                value={motherFirstName}
                onChangeText={setMotherFirstName}
                placeholder={t('pregnancy.enterFirstName', 'Enter first name')}
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t('pregnancy.lastName', 'Last Name')} *
              </Text>
              <TextInput
                style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                value={motherLastName}
                onChangeText={setMotherLastName}
                placeholder={t('pregnancy.enterLastName', 'Enter last name')}
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t('pregnancy.dateOfBirth', 'Date of Birth')}
              </Text>
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: colors.gray[200] }]}
                onPress={() => setShowMotherDOBPicker(true)}
              >
                <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                  {format(motherDateOfBirth, 'MMMM d, yyyy')}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={colors.gray[500]} />
              </TouchableOpacity>
              {showMotherDOBPicker && (
                <DateTimePicker
                  value={motherDateOfBirth}
                  mode="date"
                  display="default"
                  onChange={handleMotherDOBChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Blood Type */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t('pregnancy.bloodType', 'Blood Type')}
              </Text>
              <View style={styles.bloodTypeGrid}>
                {BLOOD_TYPE_OPTIONS.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.bloodTypeButton,
                      { 
                        borderColor: bloodType === type ? colors.secondary : colors.gray[200],
                        backgroundColor: bloodType === type ? colors.secondaryLight : colors.white,
                      }
                    ]}
                    onPress={() => setBloodType(type)}
                  >
                    <Text style={[
                      styles.bloodTypeText,
                      { color: bloodType === type ? colors.secondary : colors.textSecondary }
                    ]}>
                      {type === 'unknown' ? '?' : type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>

          {/* Pregnancy Information Section */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart-outline" size={24} color={colors.secondary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('pregnancy.pregnancyInfo', 'Pregnancy Information')}
              </Text>
            </View>

            {/* Expected Delivery Date */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t('pregnancy.expectedDeliveryDate', 'Expected Delivery Date')} *
              </Text>
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: colors.gray[200] }]}
                onPress={() => setShowEDDPicker(true)}
              >
                <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                  {format(expectedDeliveryDate, 'MMMM d, yyyy')}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={colors.gray[500]} />
              </TouchableOpacity>
              {showEDDPicker && (
                <DateTimePicker
                  value={expectedDeliveryDate}
                  mode="date"
                  display="default"
                  onChange={handleEDDChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Last Menstrual Period */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t('pregnancy.lastMenstrualPeriod', 'Last Menstrual Period (LMP)')}
              </Text>
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: colors.gray[200] }]}
                onPress={() => setShowLMPPicker(true)}
              >
                <Text style={[styles.dateText, { color: lastMenstrualPeriod ? colors.textPrimary : colors.gray[400] }]}>
                  {lastMenstrualPeriod 
                    ? format(lastMenstrualPeriod, 'MMMM d, yyyy')
                    : t('pregnancy.selectDate', 'Select date')}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={colors.gray[500]} />
              </TouchableOpacity>
              {showLMPPicker && (
                <DateTimePicker
                  value={lastMenstrualPeriod || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleLMPChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            {/* Gravida & Para */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {t('pregnancy.gravida', 'Gravida')}
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                  value={gravida}
                  onChangeText={setGravida}
                  placeholder="G"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {t('pregnancy.para', 'Para')}
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                  value={para}
                  onChangeText={setPara}
                  placeholder="P"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </Card>

          {/* Medical Information Section */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="fitness-outline" size={24} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('pregnancy.medicalInfo', 'Medical Information')}
              </Text>
            </View>

            {/* Weight & Height */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {t('pregnancy.preWeight', 'Pre-pregnancy Weight (kg)')}
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                  value={prePregnancyWeight}
                  onChangeText={setPrePregnancyWeight}
                  placeholder="kg"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {t('pregnancy.height', 'Height (cm)')}
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="cm"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Current Weight */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t('pregnancy.currentWeight', 'Current Weight (kg)')}
              </Text>
              <TextInput
                style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                value={currentWeight}
                onChangeText={setCurrentWeight}
                placeholder={t('pregnancy.enterWeight', 'Enter current weight')}
                placeholderTextColor={colors.gray[400]}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Medical Conditions */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t('pregnancy.medicalConditions', 'Medical Conditions')}
              </Text>
              <TextInput
                style={[styles.textArea, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                value={medicalConditions}
                onChangeText={setMedicalConditions}
                placeholder={t('pregnancy.medicalConditionsPlaceholder', 'e.g., Diabetes, Hypertension (comma separated)')}
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Allergies */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t('pregnancy.allergies', 'Allergies')}
              </Text>
              <TextInput
                style={[styles.textArea, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                value={allergies}
                onChangeText={setAllergies}
                placeholder={t('pregnancy.allergiesPlaceholder', 'e.g., Penicillin, Peanuts (comma separated)')}
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Medications */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t('pregnancy.medications', 'Current Medications')}
              </Text>
              <TextInput
                style={[styles.textArea, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                value={medications}
                onChangeText={setMedications}
                placeholder={t('pregnancy.medicationsPlaceholder', 'List any current medications (comma separated)')}
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={2}
              />
            </View>
          </Card>

          {/* Healthcare Providers Section */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medical-outline" size={24} color={colors.info} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('pregnancy.healthcareProviders', 'Healthcare Providers')}
              </Text>
            </View>

            {/* Hospital Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t('pregnancy.hospitalName', 'Hospital Name')}
              </Text>
              <TextInput
                style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                value={hospitalName}
                onChangeText={setHospitalName}
                placeholder={t('pregnancy.enterHospitalName', 'Enter hospital name')}
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            {/* OB-GYN */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {t('pregnancy.obgynName', 'OB-GYN Name')}
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                  value={obgynName}
                  onChangeText={setObgynName}
                  placeholder={t('pregnancy.enterObgynName', 'Doctor name')}
                  placeholderTextColor={colors.gray[400]}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {t('pregnancy.contact', 'Contact')}
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                  value={obgynContact}
                  onChangeText={setObgynContact}
                  placeholder="Phone"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Midwife */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {t('pregnancy.midwifeName', 'Midwife Name')}
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                  value={midwifeName}
                  onChangeText={setMidwifeName}
                  placeholder={t('pregnancy.enterMidwifeName', 'Midwife name')}
                  placeholderTextColor={colors.gray[400]}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {t('pregnancy.contact', 'Contact')}
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                  value={midwifeContact}
                  onChangeText={setMidwifeContact}
                  placeholder="Phone"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </Card>

          {/* Emergency Contact Section */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alert-circle-outline" size={24} color={colors.error} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('pregnancy.emergencyContact', 'Emergency Contact')}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t('pregnancy.contactName', 'Contact Name')}
              </Text>
              <TextInput
                style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                value={emergencyContactName}
                onChangeText={setEmergencyContactName}
                placeholder={t('pregnancy.enterContactName', 'Enter contact name')}
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {t('pregnancy.phone', 'Phone')}
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                  value={emergencyContactPhone}
                  onChangeText={setEmergencyContactPhone}
                  placeholder="Phone number"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {t('pregnancy.relation', 'Relation')}
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                  value={emergencyContactRelation}
                  onChangeText={setEmergencyContactRelation}
                  placeholder="e.g., Husband"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>
            </View>
          </Card>

          {/* Save Button */}
          <Button
            title={isLoading ? t('common.saving', 'Saving...') : t('common.saveChanges', 'Save Changes')}
            onPress={handleSave}
            disabled={isLoading}
            style={styles.saveButton}
          />

          {/* Bottom spacing */}
          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  sectionCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  dateText: {
    fontSize: FONT_SIZE.md,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  bloodTypeButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
  },
  bloodTypeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  saveButton: {
    marginTop: SPACING.lg,
  },
});

export default EditPregnancyScreen;
