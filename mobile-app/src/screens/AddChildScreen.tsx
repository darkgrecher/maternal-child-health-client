/**
 * Add Child Screen
 * 
 * Screen for adding a new child profile.
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
import { useChildStore, useThemeStore } from '../stores';
import { Gender, BloodType } from '../types';

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const BLOOD_TYPE_OPTIONS: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'];

/**
 * Add Child Screen Component
 */
const AddChildScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { createChild, isLoading } = useChildStore();
  const { colors } = useThemeStore();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<Gender>('male');
  const [birthWeight, setBirthWeight] = useState('');
  const [birthHeight, setBirthHeight] = useState('');
  const [bloodType, setBloodType] = useState<BloodType>('unknown');
  const [motherName, setMotherName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const validateForm = (): boolean => {
    if (!firstName.trim()) {
      Alert.alert(t('common.error'), t('addChild.firstNameRequired', 'First name is required'));
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert(t('common.error'), t('addChild.lastNameRequired', 'Last name is required'));
      return false;
    }
    if (!birthWeight || isNaN(parseFloat(birthWeight))) {
      Alert.alert(t('common.error'), t('addChild.birthWeightRequired', 'Valid birth weight is required'));
      return false;
    }
    if (!birthHeight || isNaN(parseFloat(birthHeight))) {
      Alert.alert(t('common.error'), t('addChild.birthHeightRequired', 'Valid birth height is required'));
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      await createChild({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dateOfBirth.toISOString(),
        gender,
        birthWeight: parseFloat(birthWeight),
        birthHeight: parseFloat(birthHeight),
        bloodType,
        motherName: motherName.trim() || undefined,
        fatherName: fatherName.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
      });
      
      Alert.alert(
        t('common.success'),
        t('addChild.childAdded', 'Child profile created successfully'),
        [{ text: t('common.done', 'Done'), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('addChild.failedToCreate', 'Failed to create child profile'));
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title={t('addChild.title', 'Add Child Profile')}
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
        {/* Personal Information */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t('profile.personalInfo', 'Personal Information')}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.firstName', 'First Name')} *</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t('addChild.enterFirstName', 'Enter first name')}
              placeholderTextColor={colors.gray[400]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.lastName', 'Last Name')} *</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder={t('addChild.enterLastName', 'Enter last name')}
              placeholderTextColor={colors.gray[400]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.dateOfBirth', 'Date of Birth')} *</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{format(dateOfBirth, 'MMMM dd, yyyy')}</Text>
              <Ionicons name="calendar-outline" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.gender', 'Gender')} *</Text>
            <View style={styles.optionsRow}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    gender === option.value && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setGender(option.value)}
                >
                  <Ionicons
                    name={option.value === 'male' ? 'male' : 'female'}
                    size={18}
                    color={gender === option.value ? colors.white : colors.textPrimary}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      gender === option.value && styles.optionTextSelected,
                    ]}
                  >
                    {t(`profile.${option.value}`, option.label)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        {/* Birth Information */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="heart-outline" size={20} color={colors.success} />
            <Text style={styles.sectionTitle}>{t('profile.birthInfo', 'Birth Information')}</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>{t('profile.birthWeight', 'Birth Weight')} (kg) *</Text>
              <TextInput
                style={styles.input}
                value={birthWeight}
                onChangeText={setBirthWeight}
                placeholder="3.5"
                placeholderTextColor={colors.gray[400]}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>{t('profile.birthHeight', 'Birth Height')} (cm) *</Text>
              <TextInput
                style={styles.input}
                value={birthHeight}
                onChangeText={setBirthHeight}
                placeholder="50"
                placeholderTextColor={colors.gray[400]}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.bloodType', 'Blood Type')}</Text>
            <View style={styles.bloodTypeRow}>
              {BLOOD_TYPE_OPTIONS.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.bloodTypeButton,
                    bloodType === type && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setBloodType(type)}
                >
                  <Text
                    style={[
                      styles.bloodTypeText,
                      bloodType === type && styles.bloodTypeTextSelected,
                    ]}
                  >
                    {type === 'unknown' ? '?' : type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        {/* Family Information */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={20} color={colors.info} />
            <Text style={styles.sectionTitle}>{t('profile.familyInfo', 'Family Information')}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.motherName', "Mother's Name")}</Text>
            <TextInput
              style={styles.input}
              value={motherName}
              onChangeText={setMotherName}
              placeholder={t('addChild.enterMotherName', "Enter mother's name")}
              placeholderTextColor={colors.gray[400]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.fatherName', "Father's Name")}</Text>
            <TextInput
              style={styles.input}
              value={fatherName}
              onChangeText={setFatherName}
              placeholder={t('addChild.enterFatherName', "Enter father's name")}
              placeholderTextColor={colors.gray[400]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.emergencyContact', 'Emergency Contact')}</Text>
            <TextInput
              style={styles.input}
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              placeholder={t('addChild.enterEmergencyContact', 'Enter emergency contact number')}
              placeholderTextColor={colors.gray[400]}
              keyboardType="phone-pad"
            />
          </View>
        </Card>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={isLoading ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
            onPress={handleSave}
            disabled={isLoading}
            style={styles.saveButton}
          />
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  card: {
    marginTop: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
  },
  dateText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfWidth: {
    flex: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },
  optionTextSelected: {
    color: COLORS.white,
  },
  bloodTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  bloodTypeButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
    minWidth: 50,
    alignItems: 'center',
  },
  bloodTypeButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  bloodTypeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },
  bloodTypeTextSelected: {
    color: COLORS.white,
  },
  buttonContainer: {
    marginTop: SPACING.lg,
  },
  saveButton: {
    width: '100%',
  },
});

export default AddChildScreen;
