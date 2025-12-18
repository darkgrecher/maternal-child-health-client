/**
 * Schedule Screen
 * 
 * Displays upcoming and past appointments,
 * allows managing appointments and finding clinics.
 */

import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { format, isPast, isFuture, isToday } from 'date-fns';

import { Card, Header, SectionTitle, Badge, Button, TabButton, FloatingChatButton } from '../components/common';
import { useAppointmentStore, useChildStore } from '../stores';
import { Appointment, AppointmentType } from '../types';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';

type TabType = 'upcoming' | 'past';

/**
 * Appointment Card Component
 */
const AppointmentCard: React.FC<{
  appointment: Appointment;
  onReschedule?: () => void;
  onCancel?: () => void;
  onCall?: () => void;
}> = ({ appointment, onReschedule, onCancel, onCall }) => {
  const { t } = useTranslation();
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
        return COLORS.primary;
      case 'general_checkup':
        return COLORS.info;
      case 'growth_check':
        return COLORS.success;
      case 'development_check':
        return COLORS.warning;
      case 'specialist':
        return '#9C27B0';
      case 'emergency':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
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
          <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>
            {format(appointmentDate, 'EEEE, MMMM d, yyyy')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>{format(appointmentDate, 'h:mm a')}</Text>
        </View>
        {appointment.duration && (
          <View style={styles.detailRow}>
            <Ionicons name="hourglass-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{appointment.duration} min</Text>
          </View>
        )}
        {appointment.location && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{appointment.location}</Text>
          </View>
        )}
        {appointment.address && (
          <View style={styles.detailRow}>
            <Ionicons name="navigate-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{appointment.address}</Text>
          </View>
        )}
        {appointment.providerName && (
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color={COLORS.textSecondary} />
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
              <Ionicons name="calendar-outline" size={16} color={COLORS.info} />
              <Text style={[styles.actionText, { color: COLORS.info }]}>
                {t('schedule.reschedule')}
              </Text>
            </TouchableOpacity>
          )}
          {onCancel && (
            <TouchableOpacity style={styles.actionButton} onPress={onCancel}>
              <Ionicons name="close-circle-outline" size={16} color={COLORS.error} />
              <Text style={[styles.actionText, { color: COLORS.error }]}>
                {t('schedule.cancel')}
              </Text>
            </TouchableOpacity>
          )}
          {onCall && appointment.providerPhone && (
            <TouchableOpacity style={styles.actionButton} onPress={onCall}>
              <Ionicons name="call-outline" size={16} color={COLORS.success} />
              <Text style={[styles.actionText, { color: COLORS.success }]}>
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
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  
  const { profile: selectedChild } = useChildStore();
  const { 
    upcomingAppointments, 
    pastAppointments, 
    isLoading, 
    error,
    fetchAppointments,
    cancelAppointmentApi,
  } = useAppointmentStore();

  // Fetch appointments when component mounts or child changes
  useEffect(() => {
    if (selectedChild?.id) {
      fetchAppointments(selectedChild.id);
    }
  }, [selectedChild?.id]);

  // Pull to refresh
  const onRefresh = async () => {
    if (selectedChild?.id) {
      setRefreshing(true);
      await fetchAppointments(selectedChild.id);
      setRefreshing(false);
    }
  };

  const handleReschedule = (appointment: Appointment) => {
    Alert.alert(
      t('schedule.rescheduleTitle'),
      t('schedule.rescheduleMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('schedule.contactClinic'), 
          onPress: () => {
            if (appointment.providerPhone) {
              Linking.openURL(`tel:${appointment.providerPhone}`);
            } else {
              Linking.openURL('tel:+94112345678');
            }
          }
        },
      ]
    );
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
    if (appointment.providerPhone) {
      Linking.openURL(`tel:${appointment.providerPhone}`);
    } else {
      Linking.openURL('tel:+94112345678');
    }
  };

  const handleFindClinic = () => {
    // Open maps to find nearest clinic
    Linking.openURL('https://maps.google.com/?q=child+health+clinic+near+me');
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

  return (
    <View style={styles.container}>
      <Header 
        title={t('schedule.title')} 
        subtitle={t('schedule.subtitle')}
        icon="calendar-outline"
        iconColor={COLORS.info}
        rightIcon="notifications-outline"
        onRightPress={() => {
          // TODO: Navigate to notifications
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
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
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
              color={COLORS.info}
            />
            <QuickActionButton
              icon="add-circle-outline"
              label={t('schedule.addAppointment')}
              onPress={() => {
                // TODO: Open add appointment modal
                Alert.alert(t('common.comingSoon'), t('schedule.addAppointmentMessage'));
              }}
              color={COLORS.primary}
            />
            <QuickActionButton
              icon="alert-circle-outline"
              label={t('schedule.emergency')}
              onPress={handleEmergency}
              color={COLORS.error}
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
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.emptyTitle}>{t('common.loading')}</Text>
          </Card>
        ) : error ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
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
              color={COLORS.gray[300]} 
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
                  Alert.alert(t('common.comingSoon'));
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
              />
            ))}
          </>
        )}

        {/* Next Appointment Reminder */}
        {activeTab === 'upcoming' && upcomingAppointments.length > 0 && (
          <Card style={styles.reminderCard}>
            <View style={styles.reminderIcon}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.warning} />
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
            iconColor={COLORS.info}
          />
          
          <View style={styles.clinicInfo}>
            <Text style={styles.clinicName}>MOH Office - Colombo South</Text>
            <View style={styles.clinicDetailRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.clinicDetailText}>
                No. 123, Health Street, Colombo 03
              </Text>
            </View>
            <View style={styles.clinicDetailRow}>
              <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.clinicDetailText}>
                Monday - Friday: 8:00 AM - 4:00 PM
              </Text>
            </View>
            <View style={styles.clinicDetailRow}>
              <Ionicons name="call-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.clinicDetailText}>
                +94 11 234 5678
              </Text>
            </View>
          </View>

          <View style={styles.clinicActions}>
            <TouchableOpacity 
              style={styles.clinicActionButton}
              onPress={() => Linking.openURL('tel:+94112345678')}
            >
              <Ionicons name="call" size={18} color={COLORS.white} />
              <Text style={styles.clinicActionText}>{t('schedule.call')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.clinicActionButton, styles.clinicActionButtonSecondary]}
              onPress={handleFindClinic}
            >
              <Ionicons name="navigate" size={18} color={COLORS.primary} />
              <Text style={[styles.clinicActionText, styles.clinicActionTextSecondary]}>
                {t('schedule.directions')}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Bottom spacing */}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
      
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
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  clinicActionButtonSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  clinicActionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.white,
  },
  clinicActionTextSecondary: {
    color: COLORS.primary,
  },
});

export default ScheduleScreen;
