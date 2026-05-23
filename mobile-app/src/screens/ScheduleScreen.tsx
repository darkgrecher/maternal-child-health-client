/**
 * Schedule Screen
 * 
 * Displays upcoming and past appointments,
 * allows managing appointments and finding clinics.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, isFuture, isToday } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Card, Header, SectionTitle, Badge, Button, TabButton, FloatingChatButton } from '../components/common';
import { SwipeableTabNavigator } from '../navigation/SwipeableTabNavigator';
import { useAppointmentStore, useChildStore, useThemeStore } from '../stores';
import { Appointment, AppointmentType, RootStackParamList, TabParamList } from '../types';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';

type ScheduleScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Schedule'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type TabType = 'upcoming' | 'past';

const APPOINTMENT_TYPE_OPTIONS: Array<{ value: AppointmentType; labelKey: string }> = [
  { value: 'vaccination', labelKey: 'schedule.types.vaccination' },
  { value: 'growth_check', labelKey: 'schedule.types.growth_check' },
  { value: 'development_check', labelKey: 'schedule.types.development_check' },
  { value: 'general_checkup', labelKey: 'schedule.types.general_checkup' },
  { value: 'specialist', labelKey: 'schedule.types.specialist' },
  { value: 'emergency', labelKey: 'schedule.types.emergency' },
];

/**
 * Appointment Card Component
 */
const AppointmentCard: React.FC<{
  appointment: Appointment;
  onReschedule?: () => void;
  onCancel?: () => void;
  onCall?: () => void;
  canCall?: boolean;
}> = ({ appointment, onReschedule, onCancel, onCall, canCall }) => {
  const { t } = useTranslation();
  const { colors } = useThemeStore();
  const appointmentDate = new Date(appointment.dateTime);
  const isUpcoming = isFuture(appointmentDate) || isToday(appointmentDate);
  
  const getStatusBadge = () => {
    if (appointment.status === 'completed') {
      return <Badge text={t('schedule.completed')} variant="success" size="small" />;
    }
    if (appointment.status === 'cancelled') {
      return <Badge text={t('schedule.cancelled')} variant="error" size="small" />;
    }
    if (appointment.status === 'missed') {
      return <Badge text={t('schedule.missed')} variant="error" size="small" />;
    }
    if (appointment.status === 'rescheduled') {
      return <Badge text={t('schedule.rescheduled')} variant="warning" size="small" />;
    }
    if (isToday(appointmentDate)) {
      return <Badge text={t('schedule.today')} variant="warning" size="small" />;
    }
    return <Badge text={t('schedule.scheduled')} variant="info" size="small" />;
  };

  const getTypeIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (appointment.type) {
      case 'vaccination':
        return 'medical-outline';
      case 'general_checkup':
        return 'fitness-outline';
      case 'growth_check':
        return 'analytics-outline';
      case 'development_check':
        return 'body-outline';
      case 'specialist':
        return 'person-outline';
      case 'emergency':
        return 'alert-circle-outline';
      default:
        return 'calendar-outline';
    }
  };

  const getTypeColor = () => {
    switch (appointment.type) {
      case 'vaccination':
        return colors.primary;
      case 'general_checkup':
        return colors.info;
      case 'growth_check':
        return colors.success;
      case 'development_check':
        return colors.warning;
      case 'specialist':
        return '#9C27B0';
      case 'emergency':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getTypeLabel = (type: AppointmentType): string => {
    const typeLabels: Record<AppointmentType, string> = {
      vaccination: t('schedule.types.vaccination'),
      growth_check: t('schedule.types.growth_check'),
      development_check: t('schedule.types.development_check'),
      general_checkup: t('schedule.types.general_checkup'),
      specialist: t('schedule.types.specialist'),
      emergency: t('schedule.types.emergency'),
    };
    return typeLabels[type] || type;
  };

  return (
    <Card style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={[styles.typeIcon, { backgroundColor: getTypeColor() + '20' }]}>
          <Ionicons name={getTypeIcon()} size={20} color={getTypeColor()} />
        </View>
        <View style={styles.appointmentInfo}>
          <Text style={styles.appointmentTitle}>{appointment.title}</Text>
          <Text style={styles.appointmentType}>
            {getTypeLabel(appointment.type)}
          </Text>
        </View>
        {getStatusBadge()}
      </View>

      <View style={styles.appointmentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>
            {format(appointmentDate, 'EEEE, MMMM d, yyyy')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>{format(appointmentDate, 'h:mm a')}</Text>
        </View>
        {appointment.duration && (
          <View style={styles.detailRow}>
            <Ionicons name="hourglass-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{appointment.duration} min</Text>
          </View>
        )}
        {appointment.location && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{appointment.location}</Text>
          </View>
        )}
        {appointment.address && (
          <View style={styles.detailRow}>
            <Ionicons name="navigate-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{appointment.address}</Text>
          </View>
        )}
        {appointment.providerName && (
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              {appointment.providerName}
              {appointment.providerRole ? ` (${appointment.providerRole})` : ''}
            </Text>
          </View>
        )}
      </View>

      {appointment.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>{t('schedule.notes')}:</Text>
          <Text style={styles.notesText}>{appointment.notes}</Text>
        </View>
      )}

      {isUpcoming && appointment.status === 'scheduled' && (
        <View style={styles.appointmentActions}>
          {onReschedule && (
            <TouchableOpacity style={styles.actionButton} onPress={onReschedule}>
              <Ionicons name="calendar-outline" size={16} color={colors.info} />
              <Text style={[styles.actionText, { color: colors.info }]}>
                {t('schedule.reschedule')}
              </Text>
            </TouchableOpacity>
          )}
          {onCancel && (
            <TouchableOpacity style={styles.actionButton} onPress={onCancel}>
              <Ionicons name="close-circle-outline" size={16} color={colors.error} />
              <Text style={[styles.actionText, { color: colors.error }]}>
                {t('schedule.cancel')}
              </Text>
            </TouchableOpacity>
          )}
          {onCall && canCall && (
            <TouchableOpacity style={styles.actionButton} onPress={onCall}>
              <Ionicons name="call-outline" size={16} color={colors.success} />
              <Text style={[styles.actionText, { color: colors.success }]}>
                {t('schedule.call')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Card>
  );
};

/**
 * Quick Action Button Component
 */
const QuickActionButton: React.FC<{
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
}> = ({ icon, label, onPress, color }) => {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

/**
 * Schedule Screen Component
 */
const ScheduleScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ScheduleScreenNavigationProp>();
  const { colors } = useThemeStore();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formDateTime, setFormDateTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    title: '',
    type: 'general_checkup' as AppointmentType,
    duration: '30',
    location: '',
    address: '',
    providerName: '',
    providerRole: '',
    providerPhone: '',
    notes: '',
  });
  
  const { profile: selectedChild, children, fetchChildren } = useChildStore();
  const { 
    upcomingAppointments, 
    pastAppointments, 
    isLoading, 
    error,
    fetchAppointments,
    cancelAppointmentApi,
    createAppointment,
    updateAppointmentApi,
  } = useAppointmentStore();

  const clinicInfo = selectedChild?.assignedMidwife;
  const nextAppointment = upcomingAppointments[0];
  const clinicName = clinicInfo?.clinic || nextAppointment?.location || '';
  const clinicAddress = clinicInfo?.address || nextAppointment?.address || '';
  const clinicPhone = clinicInfo?.phone || nextAppointment?.providerPhone || '';
  const hasClinicInfo = Boolean(clinicName || clinicAddress || clinicPhone);

  // Ensure child profiles are loaded
  useEffect(() => {
    if (!selectedChild && children.length === 0) {
      fetchChildren();
    }
  }, [selectedChild, children.length, fetchChildren]);

  // Fetch appointments when component mounts or child changes
  useEffect(() => {
    if (selectedChild?.id) {
      fetchAppointments(selectedChild.id);
    }
  }, [selectedChild?.id, fetchAppointments]);

  // Refresh appointments on focus to keep in sync with web app
  useFocusEffect(
    useCallback(() => {
      if (selectedChild?.id) {
        fetchAppointments(selectedChild.id);
      }
    }, [selectedChild?.id, fetchAppointments])
  );

  // Pull to refresh
  const onRefresh = async () => {
    if (!selectedChild?.id) {
      setRefreshing(true);
      await fetchChildren();
      setRefreshing(false);
      return;
    }
    setRefreshing(true);
    await Promise.all([fetchChildren(), fetchAppointments(selectedChild.id)]);
    setRefreshing(false);
  };

  const setDefaultForm = () => {
    setFormState({
      title: '',
      type: 'general_checkup',
      duration: '30',
      location: clinicInfo?.clinic || '',
      address: clinicInfo?.address || '',
      providerName: '',
      providerRole: '',
      providerPhone: clinicInfo?.phone || '',
      notes: '',
    });
    setFormDateTime(new Date());
  };

  const openNewAppointment = () => {
    setEditingAppointment(null);
    setDefaultForm();
    setIsFormVisible(true);
  };

  const openEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormState({
      title: appointment.title,
      type: appointment.type,
      duration: appointment.duration ? String(appointment.duration) : '30',
      location: appointment.location,
      address: appointment.address || '',
      providerName: appointment.providerName || '',
      providerRole: appointment.providerRole || '',
      providerPhone: appointment.providerPhone || '',
      notes: appointment.notes || '',
    });
    setFormDateTime(new Date(appointment.dateTime));
    setIsFormVisible(true);
  };

  const closeFormModal = () => {
    setIsFormVisible(false);
    setEditingAppointment(null);
  };

  const handleSaveAppointment = async () => {
    if (!selectedChild?.id) {
      Alert.alert(t('common.error'), t('navigation.profileRequiredMessage'));
      return;
    }

    if (!formState.title.trim() || !formState.location.trim()) {
      Alert.alert(t('common.error'), t('schedule.formRequired', 'Please fill in the required fields.'));
      return;
    }

    setIsSubmitting(true);

    const trimmedDuration = formState.duration.trim();
    const durationValue = trimmedDuration ? Number(trimmedDuration) : undefined;
    const payload = {
      title: formState.title.trim(),
      type: formState.type,
      dateTime: formDateTime.toISOString(),
      duration: durationValue !== undefined && Number.isNaN(durationValue) ? undefined : durationValue,
      location: formState.location.trim(),
      address: formState.address.trim() || undefined,
      providerName: formState.providerName.trim() || undefined,
      providerRole: formState.providerRole.trim() || undefined,
      providerPhone: formState.providerPhone.trim() || undefined,
      notes: formState.notes.trim() || undefined,
    };

    try {
      const result = editingAppointment
        ? await updateAppointmentApi(editingAppointment.id, payload)
        : await createAppointment(selectedChild.id, payload);

      if (!result) {
        throw new Error('Unable to save appointment');
      }

      await fetchAppointments(selectedChild.id);
      closeFormModal();
    } catch (saveError: any) {
      Alert.alert(
        t('common.error'),
        saveError?.message || t('schedule.formSaveError', 'Unable to save appointment.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReschedule = (appointment: Appointment) => {
    openEditAppointment(appointment);
  };

  const handleCancel = (appointment: Appointment) => {
    Alert.alert(
      t('schedule.cancelTitle'),
      t('schedule.cancelMessage'),
      [
        { text: t('common.no'), style: 'cancel' },
        { 
          text: t('common.yes'), 
          style: 'destructive',
          onPress: async () => {
            const success = await cancelAppointmentApi(appointment.id);
            if (success) {
              Alert.alert(t('common.success'), t('schedule.cancelSuccess'));
            }
          }
        },
      ]
    );
  };

  const handleCall = (appointment: Appointment) => {
    const phone = appointment.providerPhone || clinicPhone;
    if (!phone) {
      Alert.alert(t('common.error'), t('schedule.noContact', 'No contact number available for this clinic.'));
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleFindClinic = () => {
    const query = clinicAddress || clinicName;
    const url = query
      ? `https://maps.google.com/?q=${encodeURIComponent(query)}`
      : 'https://maps.google.com/?q=child+health+clinic+near+me';
    Linking.openURL(url);
  };

  const handleEmergency = () => {
    Alert.alert(
      t('schedule.emergencyTitle'),
      t('schedule.emergencyMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('schedule.callNow'),
          style: 'destructive',
          onPress: () => Linking.openURL('tel:1990')
        },
      ]
    );
  };

  const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;
  const canCallClinic = Boolean(clinicPhone);

  return (
    <SwipeableTabNavigator>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
        title={t('schedule.title')} 
        subtitle={t('schedule.subtitle')}
        icon="calendar-outline"
        iconColor={colors.info}
        leadingRightIcon="qr-code-outline"
        onLeadingRightPress={() => {
          navigation.navigate('QrScan', { profileType: 'child' });
        }}
        tertiaryRightIcon="notifications-outline"
        onTertiaryRightPress={() => {
          navigation.navigate('Notifications');
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Quick Actions */}
        <Card style={styles.quickActionsCard}>
          <View style={styles.quickActionsRow}>
            <QuickActionButton
              icon="location-outline"
              label={t('schedule.findClinic')}
              onPress={handleFindClinic}
              color={colors.info}
            />
            <QuickActionButton
              icon="add-circle-outline"
              label={t('schedule.addAppointment')}
              onPress={() => {
                openNewAppointment();
              }}
              color={colors.primary}
            />
            <QuickActionButton
              icon="alert-circle-outline"
              label={t('schedule.emergency')}
              onPress={handleEmergency}
              color={colors.error}
            />
          </View>
        </Card>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TabButton
            label={t('schedule.upcoming')}
            count={upcomingAppointments.length}
            isActive={activeTab === 'upcoming'}
            onPress={() => setActiveTab('upcoming')}
          />
          <TabButton
            label={t('schedule.past')}
            count={pastAppointments.length}
            isActive={activeTab === 'past'}
            onPress={() => setActiveTab('past')}
          />
        </View>

        {/* Appointments List */}
        {isLoading && !refreshing ? (
          <Card style={styles.emptyCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.emptyTitle}>{t('common.loading')}</Text>
          </Card>
        ) : error ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <Text style={styles.emptyTitle}>{t('common.error')}</Text>
            <Text style={styles.emptyDescription}>{error}</Text>
            <Button
              title={t('common.retry')}
              variant="primary"
              style={{ marginTop: SPACING.md }}
              onPress={onRefresh}
            />
          </Card>
        ) : displayedAppointments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons 
              name={activeTab === 'upcoming' ? 'calendar-outline' : 'archive-outline'} 
              size={48} 
              color={colors.gray[300]} 
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'upcoming' 
                ? t('schedule.noUpcoming') 
                : t('schedule.noPast')}
            </Text>
            <Text style={styles.emptyDescription}>
              {activeTab === 'upcoming' 
                ? t('schedule.noUpcomingDescription')
                : t('schedule.noPastDescription')}
            </Text>
            {activeTab === 'upcoming' && (
              <Button
                title={t('schedule.scheduleNow')}
                variant="primary"
                style={{ marginTop: SPACING.md }}
                onPress={() => {
                  openNewAppointment();
                }}
              />
            )}
          </Card>
        ) : (
          <>
            {displayedAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onReschedule={() => handleReschedule(appointment)}
                onCancel={() => handleCancel(appointment)}
                onCall={() => handleCall(appointment)}
                canCall={Boolean(appointment.providerPhone || clinicPhone)}
              />
            ))}
          </>
        )}

        {/* Next Appointment Reminder */}
        {activeTab === 'upcoming' && upcomingAppointments.length > 0 && (
          <Card style={styles.reminderCard}>
            <View style={styles.reminderIcon}>
              <Ionicons name="notifications-outline" size={24} color={colors.warning} />
            </View>
            <View style={styles.reminderContent}>
              <Text style={styles.reminderTitle}>{t('schedule.reminderTitle')}</Text>
              <Text style={styles.reminderText}>
                {t('schedule.reminderText')}
              </Text>
            </View>
          </Card>
        )}

        {/* Clinic Information */}
        <Card style={styles.clinicCard}>
          <SectionTitle 
            title={t('schedule.yourClinic')}
            icon="business-outline"
            iconColor={colors.info}
          />
          
          <View style={styles.clinicInfo}>
            {hasClinicInfo ? (
              <>
                {clinicName ? (
                  <Text style={styles.clinicName}>{clinicName}</Text>
                ) : null}
                {clinicAddress ? (
                  <View style={styles.clinicDetailRow}>
                    <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.clinicDetailText}>{clinicAddress}</Text>
                  </View>
                ) : null}
                {clinicPhone ? (
                  <View style={styles.clinicDetailRow}>
                    <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.clinicDetailText}>{clinicPhone}</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={styles.clinicDetailText}>
                {t('schedule.noClinicInfo', 'Clinic information will appear once assigned.')}
              </Text>
            )}
          </View>

          <View style={styles.clinicActions}>
            {canCallClinic && (
              <TouchableOpacity 
                style={[styles.clinicActionButton, { backgroundColor: colors.primary }]}
                onPress={() => Linking.openURL(`tel:${clinicPhone}`)}
              >
                <Ionicons name="call" size={18} color={colors.white} />
                <Text style={styles.clinicActionText}>{t('schedule.call')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.clinicActionButton, styles.clinicActionButtonSecondary, { borderColor: colors.primary }]}
              onPress={handleFindClinic}
            >
              <Ionicons name="navigate" size={18} color={colors.primary} />
              <Text style={[styles.clinicActionText, styles.clinicActionTextSecondary, { color: colors.primary }]}>
                {t('schedule.directions')}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Bottom spacing */}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* Appointment Form Modal */}
      <Modal visible={isFormVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {editingAppointment
                  ? t('schedule.editAppointment', 'Edit Appointment')
                  : t('schedule.scheduleNew', 'Schedule New Appointment')}
              </Text>
              <TouchableOpacity onPress={closeFormModal}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                  {t('schedule.formTitle', 'Title')} *
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                  value={formState.title}
                  onChangeText={(text) => setFormState((prev) => ({ ...prev, title: text }))}
                  placeholder={t('schedule.formTitlePlaceholder', 'Appointment title')}
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                  {t('schedule.formType', 'Appointment Type')}
                </Text>
                <View style={styles.typeGrid}>
                  {APPOINTMENT_TYPE_OPTIONS.map((option) => {
                    const isSelected = formState.type === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.typeChip,
                          {
                            borderColor: isSelected ? colors.primary : colors.gray[200],
                            backgroundColor: isSelected ? colors.primaryLight : colors.white,
                          },
                        ]}
                        onPress={() => setFormState((prev) => ({ ...prev, type: option.value }))}
                      >
                        <Text
                          style={{
                            color: isSelected ? colors.primary : colors.textSecondary,
                            fontSize: FONT_SIZE.xs,
                            fontWeight: FONT_WEIGHT.medium,
                          }}
                        >
                          {t(option.labelKey)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formRow}>
                <TouchableOpacity
                  style={[styles.dateButton, { borderColor: colors.gray[200] }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                    {format(formDateTime, 'MMMM d, yyyy')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dateButton, { borderColor: colors.gray[200] }]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                    {format(formDateTime, 'h:mm a')}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={formDateTime}
                  mode="date"
                  display="default"
                  onChange={(_, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      const updated = new Date(formDateTime);
                      updated.setFullYear(
                        selectedDate.getFullYear(),
                        selectedDate.getMonth(),
                        selectedDate.getDate()
                      );
                      setFormDateTime(updated);
                    }
                  }}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={formDateTime}
                  mode="time"
                  display="default"
                  onChange={(_, selectedTime) => {
                    setShowTimePicker(false);
                    if (selectedTime) {
                      const updated = new Date(formDateTime);
                      updated.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
                      setFormDateTime(updated);
                    }
                  }}
                />
              )}

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                  {t('schedule.formDuration', 'Duration (minutes)')}
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                  value={formState.duration}
                  onChangeText={(text) => setFormState((prev) => ({ ...prev, duration: text }))}
                  placeholder="30"
                  keyboardType="numeric"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                  {t('schedule.formLocation', 'Location')} *
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                  value={formState.location}
                  onChangeText={(text) => setFormState((prev) => ({ ...prev, location: text }))}
                  placeholder={t('schedule.formLocationPlaceholder', 'Clinic or hospital')}
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                  {t('schedule.formAddress', 'Address')}
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                  value={formState.address}
                  onChangeText={(text) => setFormState((prev) => ({ ...prev, address: text }))}
                  placeholder={t('schedule.formAddressPlaceholder', 'Address (optional)')}
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                    {t('schedule.formProviderName', 'Provider Name')}
                  </Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                    value={formState.providerName}
                    onChangeText={(text) => setFormState((prev) => ({ ...prev, providerName: text }))}
                    placeholder={t('schedule.formProviderNamePlaceholder', 'Doctor or clinic')}
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
                <View style={styles.formHalf}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                    {t('schedule.formProviderRole', 'Provider Role')}
                  </Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                    value={formState.providerRole}
                    onChangeText={(text) => setFormState((prev) => ({ ...prev, providerRole: text }))}
                    placeholder={t('schedule.formProviderRolePlaceholder', 'Specialist, nurse...')}
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                  {t('schedule.formProviderPhone', 'Provider Phone')}
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                  value={formState.providerPhone}
                  onChangeText={(text) => setFormState((prev) => ({ ...prev, providerPhone: text }))}
                  placeholder={t('schedule.formProviderPhonePlaceholder', 'Phone (optional)')}
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.gray[400]}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                  {t('schedule.notes')}
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                  value={formState.notes}
                  onChangeText={(text) => setFormState((prev) => ({ ...prev, notes: text }))}
                  placeholder={t('schedule.formNotesPlaceholder', 'Additional notes (optional)')}
                  placeholderTextColor={colors.gray[400]}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton, { borderColor: colors.gray[300] }]}
                onPress={closeFormModal}
                disabled={isSubmitting}
              >
                <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }, isSubmitting && styles.buttonDisabled]}
                onPress={handleSaveAppointment}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: colors.white }]}>
                    {t('common.save')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      <FloatingChatButton />
      </View>
    </SwipeableTabNavigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor applied dynamically via inline styles
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },

  // Quick Actions
  quickActionsCard: {
    marginTop: SPACING.sm,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  quickActionLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },

  // Appointment Card
  appointmentCard: {
    marginTop: SPACING.sm,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  appointmentType: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  appointmentDetails: {
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  detailText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  notesContainer: {
    marginBottom: SPACING.sm,
  },
  notesLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  notesText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    fontStyle: 'italic',
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: SPACING.sm,
    gap: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },

  // Empty State
  emptyCard: {
    marginTop: SPACING.sm,
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptyDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },

  // Reminder Card
  reminderCard: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    backgroundColor: COLORS.warning + '10',
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  reminderText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // Clinic Card
  clinicCard: {
    marginTop: SPACING.sm,
  },
  clinicInfo: {
    marginBottom: SPACING.md,
  },
  clinicName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  clinicDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  clinicDetailText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  clinicActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  clinicActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    // backgroundColor applied dynamically via inline styles
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  clinicActionButtonSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    // borderColor applied dynamically via inline styles
  },
  clinicActionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.white,
  },
  clinicActionTextSecondary: {
    // color applied dynamically via inline styles
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    borderRadius: BORDER_RADIUS.lg,
    maxHeight: '90%',
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    paddingBottom: SPACING.md,
  },
  formGroup: {
    marginBottom: SPACING.sm,
  },
  formLabel: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    backgroundColor: COLORS.white,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  formHalf: {
    flex: 1,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  dateText: {
    fontSize: FONT_SIZE.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  typeChip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.round,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  modalCancelButton: {
    borderWidth: 1,
    backgroundColor: COLORS.white,
  },
  modalButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default ScheduleScreen;
