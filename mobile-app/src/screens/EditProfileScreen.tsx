/**
 * Edit Profile Screen
 * 
 * Screen for editing child profile information.
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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';

import { useChildStore } from '../stores';
import { Card } from '../components/common';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, FONT_WEIGHT } from '../constants';
import { ChildProfile } from '../types';

type RootStackParamList = {
  EditProfile: { childId?: string; isNew?: boolean };
  Profile: undefined;
};

type EditProfileRouteProp = RouteProp<RootStackParamList, 'EditProfile'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const BLOOD_TYPE_OPTIONS = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
  { value: 'unknown', label: 'Unknown' },
];

const DELIVERY_TYPE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'cesarean', label: 'Cesarean' },
  { value: 'assisted', label: 'Assisted' },
];

interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female';
  chdrNumber: string;
  birthWeight: string;
  birthHeight: string;
  bloodType: string;
  placeOfBirth: string;
  deliveryType: string;
  allergies: string;
  specialConditions: string;
  motherName: string;
  fatherName: string;
  emergencyContact: string;
  address: string;
}

const EditProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditProfileRouteProp>();
  
  const { childId, isNew } = route.params || {};
  const { profile, children, createChild, updateChildApi, isLoading } = useChildStore();
  
  const existingChild = childId 
    ? children.find(c => c.id === childId) 
    : profile;

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: new Date(),
    gender: 'male',
    chdrNumber: '',
    birthWeight: '',
    birthHeight: '',
    bloodType: 'unknown',
    placeOfBirth: '',
    deliveryType: 'normal',
    allergies: '',
    specialConditions: '',
    motherName: '',
    fatherName: '',
    emergencyContact: '',
    address: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing data if editing
  useEffect(() => {
    if (!isNew && existingChild) {
      setFormData({
        firstName: existingChild.firstName,
        lastName: existingChild.lastName,
        dateOfBirth: new Date(existingChild.dateOfBirth),
        gender: existingChild.gender,
        chdrNumber: existingChild.chdrNumber || '',
        birthWeight: existingChild.birthWeight?.toString() || '',
        birthHeight: existingChild.birthHeight?.toString() || '',
        bloodType: existingChild.bloodType || 'unknown',
        placeOfBirth: existingChild.placeOfBirth || '',
        deliveryType: existingChild.deliveryType || 'normal',
        allergies: existingChild.allergies?.join(', ') || '',
        specialConditions: existingChild.specialConditions?.join(', ') || '',
        motherName: existingChild.motherName || '',
        fatherName: existingChild.fatherName || '',
        emergencyContact: existingChild.emergencyContact || '',
        address: existingChild.address || '',
      });
    }
  }, [existingChild, isNew]);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      Alert.alert(t('common.error'), t('editProfile.firstNameRequired', 'First name is required'));
      return false;
    }
    if (!formData.lastName.trim()) {
      Alert.alert(t('common.error'), t('editProfile.lastNameRequired', 'Last name is required'));
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    
    try {
      const data = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dateOfBirth.toISOString(),
        gender: formData.gender,
        chdrNumber: formData.chdrNumber.trim() || undefined,
        birthWeight: formData.birthWeight ? parseFloat(formData.birthWeight) : undefined,
        birthHeight: formData.birthHeight ? parseFloat(formData.birthHeight) : undefined,
        bloodType: formData.bloodType || undefined,
        placeOfBirth: formData.placeOfBirth.trim() || undefined,
        deliveryType: formData.deliveryType || undefined,
        allergies: formData.allergies 
          ? formData.allergies.split(',').map(a => a.trim()).filter(Boolean) 
          : [],
        specialConditions: formData.specialConditions 
          ? formData.specialConditions.split(',').map(c => c.trim()).filter(Boolean) 
          : [],
        motherName: formData.motherName.trim() || undefined,
        fatherName: formData.fatherName.trim() || undefined,
        emergencyContact: formData.emergencyContact.trim() || undefined,
        address: formData.address.trim() || undefined,
      };

      if (isNew) {
        await createChild(data);
        Alert.alert(
          t('common.success'),
          t('editProfile.createSuccess', 'Child profile created successfully'),
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else if (existingChild) {
        await updateChildApi(existingChild.id, data);
        Alert.alert(
          t('common.success'),
          t('editProfile.updateSuccess', 'Profile updated successfully'),
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      Alert.alert(t('common.error'), message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      t('editProfile.discardTitle', 'Discard Changes'),
      t('editProfile.discardMessage', 'Are you sure you want to discard your changes?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        { text: t('common.discard', 'Discard'), style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      updateField('dateOfBirth', selectedDate);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Custom Header with back button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isNew ? t('editProfile.createTitle', 'Add Child') : t('editProfile.editTitle', 'Edit Profile')}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isNew ? t('editProfile.createSubtitle', 'Enter child information') : t('editProfile.editSubtitle', 'Update child information')}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Ionicons name="checkmark" size={24} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Personal Information */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('editProfile.personalInfo', 'Personal Information')}</Text>
          
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>{t('editProfile.firstName', 'First Name')} *</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(text) => updateField('firstName', text)}
                placeholder={t('editProfile.firstNamePlaceholder', 'Enter first name')}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>{t('editProfile.lastName', 'Last Name')} *</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(text) => updateField('lastName', text)}
                placeholder={t('editProfile.lastNamePlaceholder', 'Enter last name')}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('editProfile.dateOfBirth', 'Date of Birth')} *</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.dateText}>
                {format(formData.dateOfBirth, 'MMMM d, yyyy')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Simple Date Picker Modal */}
          <Modal
            visible={showDatePicker}
            transparent
            animationType="slide"
          >
            <View style={styles.datePickerModal}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <Text style={styles.datePickerTitle}>{t('editProfile.selectDate', 'Select Date')}</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.datePickerDone}>{t('common.done', 'Done')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.dateInputRow}>
                  <View style={styles.dateInputGroup}>
                    <Text style={styles.dateInputLabel}>Year</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={formData.dateOfBirth.getFullYear().toString()}
                      onChangeText={(text) => {
                        const year = parseInt(text) || new Date().getFullYear();
                        const newDate = new Date(formData.dateOfBirth);
                        newDate.setFullYear(year);
                        updateField('dateOfBirth', newDate);
                      }}
                      keyboardType="numeric"
                      maxLength={4}
                    />
                  </View>
                  <View style={styles.dateInputGroup}>
                    <Text style={styles.dateInputLabel}>Month</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={(formData.dateOfBirth.getMonth() + 1).toString()}
                      onChangeText={(text) => {
                        const month = Math.min(12, Math.max(1, parseInt(text) || 1)) - 1;
                        const newDate = new Date(formData.dateOfBirth);
                        newDate.setMonth(month);
                        updateField('dateOfBirth', newDate);
                      }}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                  <View style={styles.dateInputGroup}>
                    <Text style={styles.dateInputLabel}>Day</Text>
                    <TextInput
                      style={styles.dateInput}
                      value={formData.dateOfBirth.getDate().toString()}
                      onChangeText={(text) => {
                        const day = Math.min(31, Math.max(1, parseInt(text) || 1));
                        const newDate = new Date(formData.dateOfBirth);
                        newDate.setDate(day);
                        updateField('dateOfBirth', newDate);
                      }}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                </View>
              </View>
            </View>
          </Modal>

          <View style={styles.field}>
            <Text style={styles.label}>{t('editProfile.gender', 'Gender')} *</Text>
            <View style={styles.optionRow}>
              {GENDER_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    formData.gender === option.value && styles.optionButtonSelected,
                  ]}
                  onPress={() => updateField('gender', option.value as 'male' | 'female')}
                >
                  <Text style={[
                    styles.optionText,
                    formData.gender === option.value && styles.optionTextSelected,
                  ]}>
                    {t(`editProfile.${option.value}`, option.label)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('editProfile.chdrNumber', 'CHDR Number')}</Text>
            <TextInput
              style={styles.input}
              value={formData.chdrNumber}
              onChangeText={(text) => updateField('chdrNumber', text)}
              placeholder={t('editProfile.chdrPlaceholder', 'Enter CHDR number')}
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>
        </Card>

        {/* Birth Information */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('editProfile.birthInfo', 'Birth Information')}</Text>
          
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>{t('editProfile.birthWeight', 'Birth Weight (kg)')}</Text>
              <TextInput
                style={styles.input}
                value={formData.birthWeight}
                onChangeText={(text) => updateField('birthWeight', text)}
                placeholder="e.g., 3.2"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>{t('editProfile.birthHeight', 'Birth Height (cm)')}</Text>
              <TextInput
                style={styles.input}
                value={formData.birthHeight}
                onChangeText={(text) => updateField('birthHeight', text)}
                placeholder="e.g., 50"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('editProfile.bloodType', 'Blood Type')}</Text>
            <View style={styles.optionRow}>
              {BLOOD_TYPE_OPTIONS.slice(0, 4).map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.smallOptionButton,
                    formData.bloodType === option.value && styles.optionButtonSelected,
                  ]}
                  onPress={() => updateField('bloodType', option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    formData.bloodType === option.value && styles.optionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.optionRow}>
              {BLOOD_TYPE_OPTIONS.slice(4).map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.smallOptionButton,
                    formData.bloodType === option.value && styles.optionButtonSelected,
                  ]}
                  onPress={() => updateField('bloodType', option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    formData.bloodType === option.value && styles.optionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('editProfile.placeOfBirth', 'Place of Birth')}</Text>
            <TextInput
              style={styles.input}
              value={formData.placeOfBirth}
              onChangeText={(text) => updateField('placeOfBirth', text)}
              placeholder={t('editProfile.placeOfBirthPlaceholder', 'Enter hospital/location')}
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('editProfile.deliveryType', 'Delivery Type')}</Text>
            <View style={styles.optionRow}>
              {DELIVERY_TYPE_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    formData.deliveryType === option.value && styles.optionButtonSelected,
                  ]}
                  onPress={() => updateField('deliveryType', option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    formData.deliveryType === option.value && styles.optionTextSelected,
                  ]}>
                    {t(`editProfile.${option.value}`, option.label)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        {/* Medical Information */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('editProfile.medicalInfo', 'Medical Information')}</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>{t('editProfile.allergies', 'Allergies')}</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={formData.allergies}
              onChangeText={(text) => updateField('allergies', text)}
              placeholder={t('editProfile.allergiesPlaceholder', 'Enter allergies separated by commas')}
              placeholderTextColor={COLORS.textSecondary}
              multiline
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('editProfile.specialConditions', 'Special Conditions')}</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={formData.specialConditions}
              onChangeText={(text) => updateField('specialConditions', text)}
              placeholder={t('editProfile.conditionsPlaceholder', 'Enter conditions separated by commas')}
              placeholderTextColor={COLORS.textSecondary}
              multiline
            />
          </View>
        </Card>

        {/* Family Information */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('editProfile.familyInfo', 'Family Information')}</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>{t('editProfile.motherName', "Mother's Name")}</Text>
            <TextInput
              style={styles.input}
              value={formData.motherName}
              onChangeText={(text) => updateField('motherName', text)}
              placeholder={t('editProfile.motherNamePlaceholder', "Enter mother's name")}
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('editProfile.fatherName', "Father's Name")}</Text>
            <TextInput
              style={styles.input}
              value={formData.fatherName}
              onChangeText={(text) => updateField('fatherName', text)}
              placeholder={t('editProfile.fatherNamePlaceholder', "Enter father's name")}
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('editProfile.emergencyContact', 'Emergency Contact')}</Text>
            <TextInput
              style={styles.input}
              value={formData.emergencyContact}
              onChangeText={(text) => updateField('emergencyContact', text)}
              placeholder={t('editProfile.emergencyPlaceholder', 'Enter phone number')}
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('editProfile.address', 'Address')}</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={formData.address}
              onChangeText={(text) => updateField('address', text)}
              placeholder={t('editProfile.addressPlaceholder', 'Enter address')}
              placeholderTextColor={COLORS.textSecondary}
              multiline
            />
          </View>
        </Card>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
              <Text style={styles.saveButtonText}>
                {isNew 
                  ? t('editProfile.createButton', 'Create Profile') 
                  : t('editProfile.saveButton', 'Save Changes')
                }
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  headerButton: {
    padding: SPACING.sm,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  sectionCard: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  field: {
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  halfField: {
    flex: 1,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  dateText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  optionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  optionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray[50],
    alignItems: 'center',
  },
  smallOptionButton: {
    flex: 1,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.gray[50],
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },
  optionTextSelected: {
    color: COLORS.white,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.white,
  },
  // Date Picker Modal Styles
  datePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  datePickerContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  datePickerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  datePickerDone: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  dateInputGroup: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  dateInput: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});

export default EditProfileScreen;
