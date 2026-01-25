/**
 * Vaccines Screen
 * 
 * Displays the Sri Lanka National Immunization Schedule,
 * vaccine progress, and individual vaccine status grouped by age.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';

import { Card, Header, ProgressBar, Badge, TabButton, Button, FloatingChatButton } from '../components/common';
import { SwipeableTabNavigator } from '../navigation/SwipeableTabNavigator';
import { useVaccineStore, useChildStore, useThemeStore } from '../stores';
import { VaccinationRecord, VaccinationStatus } from '../services/vaccineService';
import { RootStackParamList, TabParamList } from '../types';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';

// Video asset
const vaccineVideo = require('../../assets/AIVideo_260125_08f3c452-1d7f-4b17-b9e4-9bac6afc45e2_0_MiriCanvas.mp4');

type VaccinesScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Vaccines'>,
  NativeStackNavigationProp<RootStackParamList>
>;

/**
 * Get badge variant based on vaccine status
 */
const getStatusVariant = (status: VaccinationStatus): 'success' | 'error' | 'info' | 'warning' => {
  switch (status) {
    case 'completed': return 'success';
    case 'overdue': return 'error';
    case 'pending': return 'warning';
    case 'scheduled': return 'info';
    case 'missed': return 'error';
    default: return 'info';
  }
};

/**
 * Get status display text
 */
const getStatusText = (status: VaccinationStatus, t: any): string => {
  const statusMap: Record<VaccinationStatus, string> = {
    completed: t('vaccines.status.completed', 'Completed'),
    pending: t('vaccines.status.pending', 'Pending'),
    overdue: t('vaccines.status.overdue', 'Overdue'),
    scheduled: t('vaccines.status.scheduled', 'Scheduled'),
    missed: t('vaccines.status.missed', 'Missed'),
  };
  return statusMap[status] || status;
};

/**
 * Vaccine Item Component
 */
interface VaccineItemProps {
  record: VaccinationRecord;
  t: any;
  onAdminister: (record: VaccinationRecord) => void;
}

const VaccineItem: React.FC<VaccineItemProps> = ({ record, t, onAdminister }) => {
  const { colors } = useThemeStore();
  const { vaccine, status, scheduledDate, administeredDate } = record;
  const canAdminister = status !== 'completed';
  
  return (
    <TouchableOpacity 
      style={styles.vaccineItem}
      onPress={() => canAdminister && onAdminister(record)}
      disabled={!canAdminister}
    >
      <View style={styles.vaccineIconContainer}>
        <View style={[
          styles.vaccineIcon,
          { backgroundColor: status === 'completed' ? colors.success + '20' : colors.gray[100] }
        ]}>
          <Ionicons 
            name={status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'} 
            size={20} 
            color={status === 'completed' ? colors.success : colors.gray[400]} 
          />
        </View>
      </View>
      <View style={styles.vaccineContent}>
        <Text style={styles.vaccineName}>{vaccine.shortName}</Text>
        <Text style={styles.vaccineFullName} numberOfLines={1}>{vaccine.name}</Text>
        <Text style={styles.vaccineDate}>
          {status === 'completed' && administeredDate
            ? `${t('vaccines.given', 'Given')}: ${format(new Date(administeredDate), 'yyyy-MM-dd')}`
            : `${t('vaccines.dueDate', 'Due')}: ${format(new Date(scheduledDate), 'yyyy-MM-dd')}`
          }
        </Text>
        {vaccine.doseNumber > 1 && (
          <Text style={styles.doseInfo}>
            {t('vaccines.dose', 'Dose')} {vaccine.doseNumber} {t('vaccines.of', 'of')} {vaccine.totalDoses}
          </Text>
        )}
      </View>
      <View style={styles.vaccineActions}>
        <Badge 
          text={getStatusText(status, t)} 
          variant={getStatusVariant(status)}
          size="small"
        />
        {canAdminister && (
          <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} style={styles.chevron} />
        )}
      </View>
    </TouchableOpacity>
  );
};

/**
 * Administer Vaccine Modal
 */
interface AdministerModalProps {
  visible: boolean;
  record: VaccinationRecord | null;
  onClose: () => void;
  onConfirm: (data: { administeredBy?: string; location?: string; batchNumber?: string; notes?: string }) => void;
  isLoading: boolean;
  t: any;
}

const AdministerModal: React.FC<AdministerModalProps> = ({ 
  visible, record, onClose, onConfirm, isLoading, t 
}) => {
  const { colors } = useThemeStore();
  const [administeredBy, setAdministeredBy] = useState('');
  const [location, setLocation] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    onConfirm({ administeredBy, location, batchNumber, notes });
    // Reset form
    setAdministeredBy('');
    setLocation('');
    setBatchNumber('');
    setNotes('');
  };

  if (!record) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('vaccines.recordVaccination', 'Record Vaccination')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.modalVaccineName, { color: colors.textPrimary }]}>{record.vaccine.name}</Text>
          <Text style={[styles.modalVaccineInfo, { color: colors.textSecondary }]}>
            {record.vaccine.shortName} - {record.vaccine.ageGroup}
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('vaccines.administeredBy', 'Administered By')}</Text>
            <TextInput
              style={styles.input}
              value={administeredBy}
              onChangeText={setAdministeredBy}
              placeholder={t('vaccines.enterName', 'Enter name')}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('vaccines.location', 'Location')}</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder={t('vaccines.enterLocation', 'Enter location')}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('vaccines.batchNumber', 'Batch Number')}</Text>
            <TextInput
              style={styles.input}
              value={batchNumber}
              onChangeText={setBatchNumber}
              placeholder={t('vaccines.enterBatchNumber', 'Enter batch number')}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>{t('vaccines.notes', 'Notes')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('vaccines.enterNotes', 'Enter any notes')}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.gray[300] }]} onPress={onClose}>
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>{t('common.cancel', 'Cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmButton, { backgroundColor: colors.primary }, isLoading && styles.buttonDisabled]} 
              onPress={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[styles.confirmButtonText, { color: colors.white }]}>{t('vaccines.markComplete', 'Mark Complete')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Vaccines Screen Component
 */
const VaccinesScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<VaccinesScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedRecord, setSelectedRecord] = useState<VaccinationRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const { profile } = useChildStore();
  const { colors } = useThemeStore();
  const { 
    vaccinationData,
    isLoading,
    error,
    fetchChildVaccinationRecords,
    administerVaccine,
    getVaccinesByAgeGroup, 
    getCompletionPercentage, 
    getCompletedCount, 
    getTotalCount,
    getOverdueCount,
    getNextVaccine,
  } = useVaccineStore();

  // Fetch vaccination records when profile changes
  useEffect(() => {
    if (profile?.id) {
      fetchChildVaccinationRecords(profile.id);
    }
  }, [profile?.id]);

  const vaccineGroups = getVaccinesByAgeGroup();
  const completionPercentage = getCompletionPercentage();
  const completedVaccines = getCompletedCount();
  const totalVaccines = getTotalCount();
  const overdueCount = getOverdueCount();
  const nextVaccine = getNextVaccine();

  const tabOptions = [
    { key: 'schedule', label: t('vaccines.schedule', 'Schedule') },
    { key: 'completed', label: t('vaccines.completed', 'Completed') },
  ];

  const handleAdminister = (record: VaccinationRecord) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const handleConfirmAdminister = async (data: { administeredBy?: string; location?: string; batchNumber?: string; notes?: string }) => {
    if (!profile?.id || !selectedRecord) return;
    
    try {
      await administerVaccine(profile.id, selectedRecord.vaccineId, {
        ...data,
        administeredDate: new Date().toISOString(),
      });
      setShowModal(false);
      setSelectedRecord(null);
      Alert.alert(
        t('vaccines.success', 'Success'),
        t('vaccines.vaccinationRecorded', 'Vaccination has been recorded successfully.')
      );
    } catch (err) {
      Alert.alert(
        t('common.error', 'Error'),
        t('vaccines.recordError', 'Failed to record vaccination. Please try again.')
      );
    }
  };

  // Filter groups based on active tab
  const filteredGroups = activeTab === 'completed'
    ? vaccineGroups.map(g => ({
        ...g,
        records: g.records.filter(r => r.status === 'completed')
      })).filter(g => g.records.length > 0)
    : vaccineGroups;

  // Show loading state
  if (isLoading && !vaccinationData) {
    return (
      <SwipeableTabNavigator>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Header 
            title={t('vaccines.title', 'Immunization')} 
            subtitle={t('vaccines.subtitle', 'Sri Lanka National Schedule')}
            icon="shield-checkmark-outline"
            iconColor={colors.success}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('common.loading', 'Loading...')}</Text>
          </View>
        </View>
      </SwipeableTabNavigator>
    );
  }

  // Show empty state if no profile
  if (!profile) {
    return (
      <SwipeableTabNavigator>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Header 
            title={t('vaccines.title', 'Immunization')} 
            subtitle={t('vaccines.subtitle', 'Sri Lanka National Schedule')}
            icon="shield-checkmark-outline"
            iconColor={colors.success}
          />
          <View style={styles.emptyContainer}>
            <Ionicons name="person-add-outline" size={64} color={colors.gray[300]} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t('vaccines.noChild', 'No Child Profile')}</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('vaccines.addChildFirst', 'Add a child profile to view vaccination schedule')}
            </Text>
          </View>
        </View>
      </SwipeableTabNavigator>
    );
  }

  return (
    <SwipeableTabNavigator>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
        title={t('vaccines.title', 'Immunization')} 
        subtitle={t('vaccines.subtitle', 'Sri Lanka National Schedule')}
        icon="shield-checkmark-outline"
        iconColor={colors.success}
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
        {/* Video Card */}
        <Card style={{ ...styles.videoCard, backgroundColor: '#FFFFFF' }}>
          <View style={styles.videoContentRow}>
            <View style={styles.videoContainer}>
              <Video
                source={vaccineVideo}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isLooping
                isMuted
              />
            </View>
            
            <View style={styles.progressOverlay}>
              <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
              <Text style={styles.progressLabel}>{t('vaccines.immunizationComplete', 'Immunization Complete')}</Text>
            </View>
          </View>
          
          <View style={styles.progressDetails}>
            <ProgressBar 
              progress={completionPercentage} 
              height={8}
              color={colors.success}
            />
            <View style={styles.progressStats}>
              <Text style={styles.progressStatsText}>
                {completedVaccines} {t('vaccines.of', 'of')} {totalVaccines} {t('vaccines.vaccines', 'vaccines')}
              </Text>
              {overdueCount > 0 ? (
                <Text style={[styles.overdueText, { color: colors.error }]}>
                  {overdueCount} {t('vaccines.overdue', 'overdue')}
                </Text>
              ) : (
                <Text style={[styles.onTrackText, { color: colors.success }]}>{t('vaccines.onTrack', 'On Track')}</Text>
              )}
            </View>
          </View>
        </Card>

        {/* Child Info */}
        {vaccinationData && (
          <Card style={styles.childInfoCard}>
            <Text style={styles.childName}>
              {vaccinationData.child.firstName} {vaccinationData.child.lastName}
            </Text>
            <Text style={styles.childDob}>
              {t('vaccines.born', 'Born')}: {format(new Date(vaccinationData.child.dateOfBirth), 'MMMM d, yyyy')}
            </Text>
          </Card>
        )}

        {/* Tab Selector */}
        <TabButton 
          options={tabOptions}
          selectedKey={activeTab}
          onSelect={setActiveTab}
          style={styles.tabSelector}
        />

        {/* Vaccine Groups by Age */}
        {filteredGroups.map((group) => (
          <Card key={group.ageGroup} style={styles.vaccineGroupCard}>
            <Text style={styles.ageGroupTitle}>{group.ageGroup}</Text>
            {group.records.map((record) => (
              <VaccineItem 
                key={`${record.vaccineId}-${record.vaccine.doseNumber}`} 
                record={record} 
                t={t}
                onAdminister={handleAdminister}
              />
            ))}
          </Card>
        ))}

        {/* Next Vaccination CTA */}
        {nextVaccine && activeTab === 'schedule' && (
          <Card style={{ ...styles.nextVaccineCard, backgroundColor: colors.primaryLight }}>
            <View style={styles.nextVaccineContent}>
              <View style={[styles.nextVaccineIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="calendar" size={24} color={colors.primary} />
              </View>
              <View style={styles.nextVaccineText}>
                <Text style={[styles.nextVaccineTitle, { color: colors.textPrimary }]}>{t('vaccines.nextVaccination', 'Next Vaccination')}</Text>
                <Text style={[styles.nextVaccineDetails, { color: colors.textSecondary }]}>
                  {nextVaccine.vaccine.shortName} - {nextVaccine.vaccine.name}
                </Text>
                <Text style={[styles.nextVaccineDate, { color: colors.primary }]}>
                  {t('vaccines.dueOn', 'Due on')} {format(new Date(nextVaccine.scheduledDate), 'MMMM d, yyyy')}
                </Text>
              </View>
            </View>
            <Button 
              title={t('vaccines.recordNow', 'Record Now')}
              onPress={() => handleAdminister(nextVaccine)}
              variant="primary"
              size="small"
            />
          </Card>
        )}

        {/* Empty state for completed tab */}
        {activeTab === 'completed' && filteredGroups.length === 0 && (
          <View style={styles.emptyTabState}>
            <Ionicons name="checkmark-circle-outline" size={48} color={colors.gray[300]} />
            <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>
              {t('vaccines.noCompletedVaccines', 'No vaccines have been completed yet')}
            </Text>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* Administer Modal */}
      <AdministerModal
        visible={showModal}
        record={selectedRecord}
        onClose={() => {
          setShowModal(false);
          setSelectedRecord(null);
        }}
        onConfirm={handleConfirmAdminister}
        isLoading={isLoading}
        t={t}
      />
      
      <FloatingChatButton />
      </View>
    </SwipeableTabNavigator>
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

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptyTabState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  emptyTabText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },

  // Video Card
  videoCard: {
    marginTop: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: '#FFFFFF',
  },
  videoContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  videoContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  progressOverlay: {
    flex: 1,
    justifyContent: 'center',
  },
  progressPercentage: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  progressLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  progressDetails: {
    width: '100%',
    padding: SPACING.md,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  progressStatsText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  onTrackText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
    fontWeight: FONT_WEIGHT.medium,
  },
  overdueText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.error,
    fontWeight: FONT_WEIGHT.medium,
  },

  // Child Info Card
  childInfoCard: {
    marginTop: SPACING.sm,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  childName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  childDob: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Tab Selector
  tabSelector: {
    marginVertical: SPACING.md,
  },

  // Vaccine Group
  vaccineGroupCard: {
    marginBottom: SPACING.sm,
  },
  ageGroupTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },

  // Vaccine Item
  vaccineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  vaccineIconContainer: {
    marginRight: SPACING.sm,
  },
  vaccineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaccineContent: {
    flex: 1,
  },
  vaccineName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },
  vaccineFullName: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  vaccineDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  doseInfo: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    marginTop: 2,
  },
  vaccineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  chevron: {
    marginLeft: SPACING.xs,
  },

  // Next Vaccination Card
  nextVaccineCard: {
    backgroundColor: COLORS.primary + '10',
    marginTop: SPACING.sm,
  },
  nextVaccineContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  nextVaccineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  nextVaccineText: {
    flex: 1,
  },
  nextVaccineTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  nextVaccineDetails: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    marginTop: 2,
  },
  nextVaccineDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalScrollView: {
    flexGrow: 0,
  },
  modalScrollContent: {
    paddingBottom: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  modalVaccineName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  modalVaccineInfo: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  formLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.success,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default VaccinesScreen;
