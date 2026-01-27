/**
 * Create Pregnancy Profile Screen
 * 
 * Screen for creating a pregnancy profile.
 */

import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

import { Card, Header, Button } from '../components/common';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';
import { useThemeStore, usePregnancyStore } from '../stores';
import { BloodType } from '../types';

const BLOOD_TYPE_OPTIONS: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'];

/**
 * Create Pregnancy Profile Screen Component
 */
const CreatePregnancyScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const { createPregnancy } = usePregnancyStore();

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
      // Convert form data to API request format
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

      // Call API to create pregnancy profile
      await createPregnancy(pregnancyData);
      
      Alert.alert(
        t('common.success'),
        t('pregnancy.profileCreated', 'Pregnancy profile created successfully'),
        [{ text: t('common.viewDashboard', 'View Dashboard'), onPress: () => navigation.navigate('PregnancyMain' as never) }]
      );
    } catch (error: any) {
      console.error('Failed to create pregnancy profile:', error);
      
      // Extract error message for user
      let errorMessage = t('pregnancy.failedToCreate', 'Failed to create pregnancy profile. Please try again.');
      
      if (error?.response?.data?.message) {
        // Server returned an error message
        errorMessage = Array.isArray(error.response.data.message) 
          ? error.response.data.message.join('\n')
          : error.response.data.message;
      } else if (error?.message) {
        // Generic error message
        if (error.message.includes('Network')) {
          errorMessage = t('pregnancy.networkError', 'Network error. Please check your internet connection and try again.');
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = t('pregnancy.authError', 'Authentication error. Please log out and log in again.');
        } else if (error.message.includes('500')) {
          errorMessage = t('pregnancy.serverError', 'Server error. Please try again later.');
        }
      }
      
      Alert.alert(
        t('common.error'), 
        errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <Header
        title={t('pregnancy.createTitle', 'Create Pregnancy Profile')}
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
          {/* Mother's Information */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('pregnancy.motherInfo', 'Mother\'s Information')}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('pregnancy.motherFirstName', 'Mother\'s First Name')} *
              </Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.gray[300], backgroundColor: colors.white }]}
                value={motherFirstName}
                onChangeText={setMotherFirstName}
                placeholder={t('pregnancy.enterMotherFirstName', 'Enter mother\'s first name')}
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('pregnancy.motherLastName', 'Mother\'s Last Name')} *
              </Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.gray[300], backgroundColor: colors.white }]}
                value={motherLastName}
                onChangeText={setMotherLastName}
                placeholder={t('pregnancy.enterMotherLastName', 'Enter mother\'s last name')}
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('pregnancy.motherDOB', 'Mother\'s Date of Birth')}
              </Text>
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: colors.gray[300], backgroundColor: colors.white }]}
                onPress={() => setShowMotherDOBPicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: colors.textPrimary }]}>
                  {format(motherDateOfBirth, 'MMM dd, yyyy')}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={colors.gray[400]} />
              </TouchableOpacity>
            </View>

            {showMotherDOBPicker && (
              <DateTimePicker
                value={motherDateOfBirth}
                mode="date"
                display="default"
                onChange={handleMotherDOBChange}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('pregnancy.bloodType', 'Blood Type')}
              </Text>
              <View style={styles.optionsRow}>
                {BLOOD_TYPE_OPTIONS.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionButton,
                      { borderColor: colors.gray[300] },
                      bloodType === type && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                    ]}
                    onPress={() => setBloodType(type)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: colors.textPrimary },
                        bloodType === type && { color: colors.primary, fontWeight: '600' },
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>

          {/* Pregnancy Information */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart-outline" size={20} color={colors.secondary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('pregnancy.pregnancyInfo', 'Pregnancy Information')}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('pregnancy.expectedDeliveryDate', 'Expected Delivery Date')} *
              </Text>
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: colors.gray[300], backgroundColor: colors.white }]}
                onPress={() => setShowEDDPicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: colors.textPrimary }]}>
                  {format(expectedDeliveryDate, 'MMM dd, yyyy')}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={colors.gray[400]} />
              </TouchableOpacity>
            </View>

            {showEDDPicker && (
              <DateTimePicker
                value={expectedDeliveryDate}
                mode="date"
                display="default"
                onChange={handleEDDChange}
                minimumDate={new Date()}
              />
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('pregnancy.lastMenstrualPeriod', 'Last Menstrual Period (Optional)')}
              </Text>
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: colors.gray[300], backgroundColor: colors.white }]}
                onPress={() => setShowLMPPicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: lastMenstrualPeriod ? colors.textPrimary : colors.gray[400] }]}>
                  {lastMenstrualPeriod ? format(lastMenstrualPeriod, 'MMM dd, yyyy') : t('pregnancy.selectDate', 'Select date')}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={colors.gray[400]} />
              </TouchableOpacity>
            </View>

            {showLMPPicker && (
              <DateTimePicker
                value={lastMenstrualPeriod || new Date()}
                mode="date"
                display="default"
                onChange={handleLMPChange}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                  {t('pregnancy.gravida', 'Gravida (# of pregnancies)')}
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.gray[300], backgroundColor: colors.white }]}
                  value={gravida}
                  onChangeText={setGravida}
                  placeholder="0"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="number-pad"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                  {t('pregnancy.para', 'Para (# of live births)')}
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.gray[300], backgroundColor: colors.white }]}
                  value={para}
                  onChangeText={setPara}
                  placeholder="0"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </Card>

          {/* Medical Information */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medical-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('pregnancy.medicalInfo', 'Medical Information')}
              </Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                  {t('pregnancy.prePregnancyWeight', 'Pre-pregnancy Weight')} (kg)
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.gray[300], backgroundColor: colors.white }]}
                  value={prePregnancyWeight}
                  onChangeText={setPrePregnancyWeight}
                  placeholder={t('pregnancy.enterWeight', 'e.g., 55')}
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                  {t('pregnancy.currentWeight', 'Current Weight')} (kg)
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.gray[300], backgroundColor: colors.white }]}
                  value={currentWeight}
                  onChangeText={setCurrentWeight}
                  placeholder={t('pregnancy.enterWeight', 'e.g., 60')}
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('pregnancy.height', 'Height')} (cm)
              </Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.gray[300], backgroundColor: colors.white }]}
                value={height}
                onChangeText={setHeight}
                placeholder={t('pregnancy.enterHeight', 'e.g., 165')}
                placeholderTextColor={colors.gray[400]}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('pregnancy.medicalConditions', 'Medical Conditions (comma-separated)')}
              </Text>
              <TextInput
                style={[styles.textArea, { color: colors.textPrimary, borderColor: colors.gray[300], backgroundColor: colors.white }]}
                value={medicalConditions}
                onChangeText={setMedicalConditions}
                placeholder={t('pregnancy.medicalConditionsPlaceholder', 'e.g., Diabetes, Hypertension')}
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('pregnancy.allergies', 'Allergies (comma-separated)')}
              </Text>
              <TextInput
                style={[styles.textArea, { color: colors.textPrimary, borderColor: colors.gray[300], backgroundColor: colors.white }]}
                value={allergies}
                onChangeText={setAllergies}
                placeholder={t('pregnancy.allergiesPlaceholder', 'e.g., Penicillin, Peanuts')}
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('pregnancy.medications', 'Current Medications (comma-separated)')}
              </Text>
              <TextInput
                style={[styles.textArea, { color: colors.textPrimary, borderColor: colors.gray[300], backgroundColor: colors.white }]}
                value={medications}
                onChangeText={setMedications}
                placeholder={t('pregnancy.medicationsPlaceholder', 'e.g., Prenatal vitamins')}
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={2}
              />
            </View>
          </Card>

          {/* Healthcare Providers */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="business-outline" size={20} color={colors.secondary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('pregnancy.healthcareProviders', 'Healthcare Providers')}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('pregnancy.hospitalName', 'Hospital/Clinic Name')}
              </Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.gray[300], backgroundColor: colors.white }]}
                value={hospitalName}
                onChangeText={setHospitalName}
                placeholder={t('pregnancy.enterHospitalName', 'Enter hospital or clinic name')}
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('pregnancy.obgynName', 'OB/GYN Name')}
              </Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.gray[300], backgroundColor: colors.white }]}
                value={obgynName}
                onChangeText={setObgynName}
                placeholder={t('pregnancy.enterObgynName', 'Enter doctor\'s name')}
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('pregnancy.obgynContact', 'OB/GYN Contact')}
              </Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.gray[300], backgroundColor: colors.white }]}
                value={obgynContact}
                onChangeText={setObgynContact}
                placeholder={t('pregnancy.enterObgynContact', 'Enter contact number')}
                placeholderTextColor={colors.gray[400]}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('pregnancy.midwifeName', 'Midwife Name')}
              </Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.gray[300], backgroundColor: colors.white }]}
                value={midwifeName}
                onChangeText={setMidwifeName}
                placeholder={t('pregnancy.enterMidwifeName', 'Enter midwife\'s name')}
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('pregnancy.midwifeContact', 'Midwife Contact')}
              </Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.gray[300], backgroundColor: colors.white }]}
                value={midwifeContact}
                onChangeText={setMidwifeContact}
                placeholder={t('pregnancy.enterMidwifeContact', 'Enter contact number')}
                placeholderTextColor={colors.gray[400]}
                keyboardType="phone-pad"
              />
            </View>
          </Card>

          {/* Emergency Contact */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call-outline" size={20} color={colors.error} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('pregnancy.emergencyContact', 'Emergency Contact')}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('pregnancy.emergencyContactName', 'Contact Name')}
              </Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.gray[300], backgroundColor: colors.white }]}
                value={emergencyContactName}
                onChangeText={setEmergencyContactName}
                placeholder={t('pregnancy.enterEmergencyContactName', 'Enter name')}
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('pregnancy.emergencyContactPhone', 'Contact Phone')}
              </Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.gray[300], backgroundColor: colors.white }]}
                value={emergencyContactPhone}
                onChangeText={setEmergencyContactPhone}
                placeholder={t('pregnancy.enterEmergencyContactPhone', 'Enter phone number')}
                placeholderTextColor={colors.gray[400]}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                {t('pregnancy.emergencyContactRelation', 'Relationship')}
              </Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.gray[300], backgroundColor: colors.white }]}
                value={emergencyContactRelation}
                onChangeText={setEmergencyContactRelation}
                placeholder={t('pregnancy.enterEmergencyContactRelation', 'e.g., Spouse, Parent, Sibling')}
                placeholderTextColor={colors.gray[400]}
              />
            </View>
          </Card>

          <Button
            title={t('pregnancy.createProfile', 'Create Pregnancy Profile')}
            onPress={handleSave}
            loading={isLoading}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  card: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.xs,
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
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfWidth: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  dateButtonText: {
    fontSize: FONT_SIZE.md,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  optionButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 50,
    alignItems: 'center',
  },
  optionText: {
    fontSize: FONT_SIZE.sm,
  },
  saveButton: {
    marginTop: SPACING.md,
  },
});

export default CreatePregnancyScreen;
