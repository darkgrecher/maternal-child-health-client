/**
 * Pregnancy Journal Screen
 * 
 * Screen for keeping a pregnancy journal with notes,
 * milestones, and memories.
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, addWeeks } from 'date-fns';

import { Card, SectionTitle, Button } from '../components/common';
import { usePregnancyStore, useThemeStore, useAuthStore } from '../stores';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';
import { RootStackParamList } from '../types';

const APP_ICON = require('../../assets/ChatGPT Image Jan 25, 2026, 05_05_58 PM.png');

type PregnancyJournalNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Pregnancy milestones
 */
const MILESTONES = [
  { week: 6, title: 'First Heartbeat', icon: 'heart', description: 'Baby\'s heart starts beating' },
  { week: 12, title: 'End of 1st Trimester', icon: 'flag', description: 'Major development complete' },
  { week: 16, title: 'Gender Reveal', icon: 'help-circle', description: 'Can find out baby\'s sex' },
  { week: 20, title: 'Halfway There!', icon: 'ribbon', description: '50% of pregnancy complete' },
  { week: 24, title: 'Viability', icon: 'star', description: 'Baby could survive outside womb' },
  { week: 28, title: '3rd Trimester', icon: 'trophy', description: 'Final stretch begins' },
  { week: 37, title: 'Full Term', icon: 'checkmark-circle', description: 'Baby is ready to be born' },
  { week: 40, title: 'Due Date', icon: 'gift', description: 'Expected arrival!' },
];

interface JournalEntry {
  id: string;
  date: string;
  week: number;
  title: string;
  content: string;
  mood: 'happy' | 'neutral' | 'tired' | 'anxious' | 'excited';
}

/**
 * Pregnancy Journal Screen Component
 */
const PregnancyJournalScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<PregnancyJournalNavigationProp>();
  const { colors } = useThemeStore();
  const { 
    currentPregnancy, 
    viewedPregnancy,
    isLoading, 
    fetchActivePregnancies,
    createJournalEntry,
    getJournalEntries,
    deleteJournalEntry,
    isViewingCompleted,
    viewActivePregnancy,
    getActivePregnancy,
  } = usePregnancyStore();
  const { accessToken } = useAuthStore();
  
  // Check if viewing a completed/historical pregnancy
  const isViewingHistorical = isViewingCompleted();
  const activePregnancy = getActivePregnancy();
  
  // Use viewedPregnancy for display, fallback to currentPregnancy
  const displayPregnancy = viewedPregnancy || currentPregnancy;

  // Local state for journal entries
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryTitle, setEntryTitle] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<JournalEntry['mood']>('happy');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);

  useEffect(() => {
    if (accessToken) {
      fetchActivePregnancies();
    }
  }, [accessToken]);

  // Load journal entries when pregnancy is available
  useEffect(() => {
    if (displayPregnancy?.id) {
      loadJournalEntries();
    }
  }, [displayPregnancy?.id]);

  const loadJournalEntries = async () => {
    if (!displayPregnancy?.id) return;
    
    setIsLoadingEntries(true);
    try {
      const entries = await getJournalEntries(displayPregnancy.id);
      setJournalEntries(entries.map((e: any) => ({
        id: e.id,
        date: e.date,
        week: e.weekOfPregnancy,
        title: e.title,
        content: e.content,
        mood: e.mood,
      })));
    } catch (error) {
      // Silently fail - entries might not exist yet
    } finally {
      setIsLoadingEntries(false);
    }
  };

  // Calculate current week
  const calculateCurrentWeek = (): number => {
    if (!displayPregnancy?.expectedDeliveryDate) return 0;
    
    const edd = new Date(displayPregnancy.expectedDeliveryDate);
    const today = new Date();
    const conceptionDate = addWeeks(edd, -40);
    const msPerDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.floor((today.getTime() - conceptionDate.getTime()) / msPerDay);
    return Math.max(0, Math.min(42, Math.floor(totalDays / 7)));
  };

  const currentWeek = calculateCurrentWeek();

  // Mood options
  const moods = [
    { id: 'happy', emoji: '😊', label: 'Happy' },
    { id: 'excited', emoji: '🤩', label: 'Excited' },
    { id: 'neutral', emoji: '😐', label: 'Neutral' },
    { id: 'tired', emoji: '😴', label: 'Tired' },
    { id: 'anxious', emoji: '😰', label: 'Anxious' },
  ];

  // Get milestone status
  const getMilestoneStatus = (week: number): 'completed' | 'current' | 'upcoming' => {
    if (currentWeek > week) return 'completed';
    if (currentWeek >= week - 1 && currentWeek <= week) return 'current';
    return 'upcoming';
  };

  // Save journal entry
  const handleSaveEntry = async () => {
    if (!entryTitle.trim() || !entryContent.trim()) {
      Alert.alert(t('common.error', 'Error'), t('pregnancy.fillAllFields', 'Please fill in all fields'));
      return;
    }

    if (!displayPregnancy?.id) return;

    setIsSaving(true);
    try {
      const savedEntry = await createJournalEntry(displayPregnancy.id, {
        weekOfPregnancy: currentWeek,
        title: entryTitle,
        content: entryContent,
        mood: selectedMood,
      });

      const newEntry: JournalEntry = {
        id: savedEntry.id,
        date: savedEntry.date,
        week: savedEntry.weekOfPregnancy,
        title: savedEntry.title,
        content: savedEntry.content,
        mood: savedEntry.mood,
      };

      setJournalEntries(prev => [newEntry, ...prev]);
      setShowEntryModal(false);
      setEntryTitle('');
      setEntryContent('');
      setSelectedMood('happy');
      Alert.alert(t('common.success', 'Success'), t('pregnancy.entrySaved', 'Journal entry saved'));
    } catch (error) {
      Alert.alert(t('common.error', 'Error'), t('pregnancy.failedToSaveEntry', 'Failed to save journal entry'));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete journal entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!displayPregnancy?.id) return;

    Alert.alert(
      t('common.confirm', 'Confirm'),
      t('pregnancy.deleteEntryConfirm', 'Are you sure you want to delete this entry?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        { 
          text: t('common.delete', 'Delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteJournalEntry(displayPregnancy.id, entryId);
              setJournalEntries(prev => prev.filter(e => e.id !== entryId));
            } catch (error) {
              Alert.alert(t('common.error', 'Error'), t('pregnancy.failedToDeleteEntry', 'Failed to delete entry'));
            }
          }
        },
      ]
    );
  };

  // Loading state
  if (isLoading && !displayPregnancy) {
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
  if (!displayPregnancy) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Ionicons name="book-outline" size={64} color={colors.gray[300]} />
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
          {t('pregnancy.noJournal', 'No Pregnancy Profile')}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {t('pregnancy.createProfileForJournal', 'Create a pregnancy profile to start your journal.')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.logoContainer, { backgroundColor: colors.secondaryLight }]}>
              <Image source={APP_ICON} style={{ width: 24, height: 24 }} resizeMode="contain" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitleText, { color: colors.textPrimary }]}>
                {t('pregnancy.journal', 'Pregnancy Journal')}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                {t('pregnancy.captureMemories', 'Capture your precious memories')}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: colors.secondary }]}
              onPress={() => setShowEntryModal(true)}
            >
              <Ionicons name="add" size={20} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => {
                // TODO: Navigate to notifications
              }}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Historical Pregnancy Banner - Removed - now using inline switch banner instead */}

      <ScrollView 
        style={styles.scrollViewWithHeader}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Switch to Current Pregnancy Banner - Show when viewing completed pregnancy with active one */}
        {isViewingHistorical && activePregnancy && (
          <TouchableOpacity
            style={[styles.switchBanner, { backgroundColor: colors.warning }]}
            onPress={() => viewActivePregnancy()}
            activeOpacity={0.9}
          >
            <View style={styles.switchBannerIcon}>
              <Ionicons name="swap-horizontal" size={24} color={colors.white} />
            </View>
            <View style={styles.switchBannerContent}>
              <Text style={styles.switchBannerTitle}>
                {t('pregnancy.switchToCurrent', 'Switch to current pregnancy profile')}
              </Text>
              <Text style={styles.switchBannerText}>
                {t('pregnancy.viewingCompletedTapSwitch', 'You are viewing a completed pregnancy. Tap to switch to your current pregnancy.')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.white} />
          </TouchableOpacity>
        )}

        {/* Milestones Timeline */}
        <Card style={styles.milestonesCard}>
          <SectionTitle 
            title={t('pregnancy.milestones', 'Milestones')} 
            icon="flag-outline" 
            iconColor={colors.secondary}
          />
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.milestonesScroll}
          >
            {MILESTONES.map((milestone, index) => {
              const status = getMilestoneStatus(milestone.week);
              return (
                <TouchableOpacity
                  key={milestone.week}
                  style={[
                    styles.milestoneItem,
                    { 
                      backgroundColor: status === 'completed' ? colors.secondaryLight : 
                                       status === 'current' ? colors.primaryLight : colors.gray[50],
                      borderColor: status === 'current' ? colors.primary : 'transparent',
                      borderWidth: status === 'current' ? 2 : 0,
                    }
                  ]}
                  onPress={() => {
                    Alert.alert(
                      milestone.title,
                      `${t('pregnancy.week', 'Week')} ${milestone.week}\n\n${milestone.description}`,
                      [{ text: t('common.ok', 'OK') }]
                    );
                  }}
                >
                  <Ionicons 
                    name={milestone.icon as any} 
                    size={24} 
                    color={status === 'completed' ? colors.secondary : 
                           status === 'current' ? colors.warning : colors.gray[400]} 
                  />
                  <Text style={[
                    styles.milestoneWeek,
                    { color: status === 'completed' ? colors.secondary : 
                             status === 'current' ? colors.warning : colors.gray[500] }
                  ]}>
                    {t('pregnancy.week', 'Week')} {milestone.week}
                  </Text>
                  <Text style={[
                    styles.milestoneTitle,
                    { color: status === 'completed' ? colors.secondary : 
                             status === 'current' ? colors.warning : colors.gray[600] }
                  ]} numberOfLines={2}>
                    {milestone.title}
                  </Text>
                  {status === 'completed' && (
                    <View style={[styles.completedBadge, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="checkmark" size={12} color={colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Card>

        {/* Journal Entries */}
        <View style={styles.entriesSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('pregnancy.journalEntries', 'Journal Entries')}
          </Text>
          
          {journalEntries.length === 0 ? (
            <Card style={styles.emptyEntriesCard}>
              <Ionicons name="book-outline" size={48} color={colors.gray[300]} />
              <Text style={[styles.emptyEntriesTitle, { color: colors.textPrimary }]}>
                {t('pregnancy.noEntries', 'No entries yet')}
              </Text>
              <Text style={[styles.emptyEntriesText, { color: colors.textSecondary }]}>
                {t('pregnancy.startJournal', 'Start documenting your pregnancy journey by adding your first entry.')}
              </Text>
              <TouchableOpacity 
                style={[styles.startButton, { backgroundColor: colors.secondary }]}
                onPress={() => setShowEntryModal(true)}
              >
                <Ionicons name="create-outline" size={20} color={colors.white} />
                <Text style={styles.startButtonText}>
                  {t('pregnancy.writeFirstEntry', 'Write First Entry')}
                </Text>
              </TouchableOpacity>
            </Card>
          ) : (
            journalEntries.map(entry => (
              <Card key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryMeta}>
                    <Text style={[styles.entryDate, { color: colors.textSecondary }]}>
                      {format(new Date(entry.date), 'MMM d, yyyy')}
                    </Text>
                    <View style={[styles.weekTag, { backgroundColor: colors.secondaryLight }]}>
                      <Text style={[styles.weekTagText, { color: colors.secondary }]}>
                        {t('pregnancy.week', 'Week')} {entry.week}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.entryActions}>
                    <Text style={styles.entryMood}>
                      {moods.find(m => m.id === entry.mood)?.emoji}
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteEntry(entry.id)}>
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.entryTitle, { color: colors.textPrimary }]}>
                  {entry.title}
                </Text>
                <Text style={[styles.entryContent, { color: colors.textSecondary }]}>
                  {entry.content}
                </Text>
              </Card>
            ))
          )}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* New Entry Modal */}
      <Modal
        visible={showEntryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEntryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {t('pregnancy.newEntry', 'New Journal Entry')}
              </Text>
              <TouchableOpacity onPress={() => setShowEntryModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.weekIndicator, { color: colors.secondary }]}>
                {t('pregnancy.week', 'Week')} {currentWeek}
              </Text>
              
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {t('pregnancy.howAreYouFeeling', 'How are you feeling?')}
              </Text>
              <View style={styles.moodSelector}>
                {moods.map(mood => (
                  <TouchableOpacity
                    key={mood.id}
                    style={[
                      styles.moodOption,
                      selectedMood === mood.id && { backgroundColor: colors.secondaryLight }
                    ]}
                    onPress={() => setSelectedMood(mood.id as JournalEntry['mood'])}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text style={[
                      styles.moodLabel,
                      { color: selectedMood === mood.id ? colors.secondary : colors.textSecondary }
                    ]}>
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {t('pregnancy.entryTitle', 'Title')}
              </Text>
              <TextInput
                style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                value={entryTitle}
                onChangeText={setEntryTitle}
                placeholder={t('pregnancy.titlePlaceholder', 'e.g., First kicks!')}
                placeholderTextColor={colors.gray[400]}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {t('pregnancy.whatOnYourMind', "What's on your mind?")}
              </Text>
              <TextInput
                style={[styles.textArea, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                value={entryContent}
                onChangeText={setEntryContent}
                placeholder={t('pregnancy.contentPlaceholder', 'Write about your day, feelings, or anything you want to remember...')}
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.gray[100] }]}
                  onPress={() => setShowEntryModal(false)}
                  disabled={isSaving}
                >
                  <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>
                    {t('common.cancel', 'Cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.secondary }]}
                  onPress={handleSaveEntry}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={[styles.modalButtonText, { color: colors.white }]}>
                      {t('common.save', 'Save Entry')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerIconButton: {
    padding: SPACING.xs,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewWithHeader: {
    flex: 1,
    marginTop: 100,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: 0,
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
  milestonesCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
  },
  milestonesScroll: {
    paddingTop: SPACING.md,
  },
  milestoneItem: {
    width: 100,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.sm,
    alignItems: 'center',
    position: 'relative',
  },
  milestoneWeek: {
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
  },
  milestoneTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    textAlign: 'center',
    marginTop: 4,
  },
  completedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entriesSection: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.md,
  },
  emptyEntriesCard: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyEntriesTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    marginTop: SPACING.md,
  },
  emptyEntriesText: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.lg,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
    gap: SPACING.xs,
  },
  startButtonText: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  entryCard: {
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  entryDate: {
    fontSize: FONT_SIZE.xs,
  },
  weekTag: {
    paddingVertical: 2,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  weekTagText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.medium,
  },
  entryMood: {
    fontSize: 24,
  },
  entryTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.xs,
  },
  entryContent: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
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
  weekIndicator: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  moodOption: {
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 60,
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodLabel: {
    fontSize: FONT_SIZE.xs,
    marginTop: 4,
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
    minHeight: 120,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
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
  // Historical Pregnancy Banner Styles
  historicalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  historicalBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  historicalBannerText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.white,
  },
  historicalBannerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historicalBannerActionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.white,
    textDecorationLine: 'underline',
  },
  // Switch to Current Pregnancy Banner Styles
  switchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  switchBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  switchBannerContent: {
    flex: 1,
  },
  switchBannerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.white,
    marginBottom: 2,
  },
  switchBannerText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.white,
    opacity: 0.9,
  },
});

export default PregnancyJournalScreen;
