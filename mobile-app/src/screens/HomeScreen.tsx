/**
 * Home Screen
 * 
 * Main dashboard showing child summary, immunization progress,
 * emergency contacts, and recent activities.
 * Supports swipe gestures to switch between multiple child profiles.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Custom app icon
const APP_ICON = require('../../assets/ChatGPT Image Jan 25, 2026, 05_05_58 PM.png');
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card, ProgressBar, SectionTitle, Avatar, Badge, Button, FloatingChatButton } from '../components/common';
import { SwipeableTabNavigator } from '../navigation/SwipeableTabNavigator';
import { useChildStore, useVaccineStore, useAppointmentStore, useAuthStore, useGrowthStore, useActivityStore, useThemeStore, useEmergencyContactStore } from '../stores';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';
import { RootStackParamList, TabParamList, Activity } from '../types';
import { format } from 'date-fns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

/**
 * Home Dashboard Screen Component
 */
const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  // Modal state
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedRecordType, setSelectedRecordType] = useState<'growth' | 'vaccination' | 'appointment' | null>(null);
  const [recordTitle, setRecordTitle] = useState('');
  const [recordDescription, setRecordDescription] = useState('');
  
  // Swipe animation
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const [isSwiping, setIsSwiping] = useState(false);
  
  // Store hooks
  const { profile, children, selectedChildId, isLoading: isLoadingChild, fetchChildren, getChildAgeDisplay, selectChild } = useChildStore();
  const { fetchChildVaccinationRecords, getCompletionPercentage, getCompletedCount, getTotalCount, getOverdueCount, getNextVaccine } = useVaccineStore();
  const { getNextAppointment, fetchAppointments } = useAppointmentStore();
  const { accessToken } = useAuthStore();
  const { getLatestMeasurement: getLatestGrowthMeasurement, fetchGrowthData } = useGrowthStore();
  const { activities, fetchActivities, createActivity, deleteActivity: deleteActivityFromStore, getRecentActivities } = useActivityStore();
  const { colors } = useThemeStore();
  const { contacts: emergencyContacts, fetchContacts: fetchEmergencyContacts, createContact: createEmergencyContact, deleteContact: deleteEmergencyContact } = useEmergencyContactStore();

  // Dynamic activity color function using theme colors
  const getActivityColorDynamic = (type: string): string => {
    switch (type) {
      case 'vaccination': return colors.info;
      case 'growth': return colors.success;
      case 'milestone': return colors.warning;
      case 'checkup': return colors.primary;
      default: return colors.gray[500];
    }
  };

  // Get current child index
  const currentChildIndex = children.findIndex(c => c.id === selectedChildId);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes when there are multiple children
        const { dx, dy } = gestureState;
        return children.length > 1 && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
      },
      onPanResponderGrant: () => {
        setIsSwiping(true);
      },
      onPanResponderMove: (_, gestureState) => {
        swipeAnim.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        
        // Determine if swipe should trigger profile change
        if (dx > SWIPE_THRESHOLD || vx > 0.5) {
          // Swipe right - go to previous child
          switchToPreviousChild();
        } else if (dx < -SWIPE_THRESHOLD || vx < -0.5) {
          // Swipe left - go to next child
          switchToNextChild();
        }
        
        // Reset animation
        Animated.spring(swipeAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start(() => setIsSwiping(false));
      },
      onPanResponderTerminate: () => {
        Animated.spring(swipeAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start(() => setIsSwiping(false));
      },
    })
  ).current;

  // Switch to next child profile
  const switchToNextChild = () => {
    if (children.length <= 1) return;
    const nextIndex = (currentChildIndex + 1) % children.length;
    selectChild(children[nextIndex].id);
  };

  // Switch to previous child profile
  const switchToPreviousChild = () => {
    if (children.length <= 1) return;
    const prevIndex = currentChildIndex <= 0 ? children.length - 1 : currentChildIndex - 1;
    selectChild(children[prevIndex].id);
  };

  // Fetch real data on mount when authenticated
  useEffect(() => {
    if (accessToken) {
      fetchChildren();
      fetchEmergencyContacts();
    }
  }, [accessToken]);

  // Fetch vaccination records, growth data, and appointments when profile changes
  useEffect(() => {
    if (profile?.id) {
      // Only fetch data from API if profile has valid UUID (not mock data)
      const isValidUuid = profile.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      if (isValidUuid) {
        fetchChildVaccinationRecords(profile.id);
        fetchGrowthData(profile.id);
        fetchAppointments(profile.id);
        fetchActivities(profile.id);
      }
    }
  }, [profile?.id]);

  // Refetch activities when component comes into focus to catch new growth/vaccine records
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (profile?.id) {
        const isValidUuid = profile.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        if (isValidUuid) {
          fetchActivities(profile.id);
        }
      }
    }, 5000); // Refresh activities every 5 seconds

    return () => clearInterval(intervalId);
  }, [profile?.id, fetchActivities]);

  const ageDisplay = getChildAgeDisplay();
  const latestMeasurement = getLatestGrowthMeasurement();
  const vaccineProgress = getCompletionPercentage();
  const completedVaccines = getCompletedCount();
  const totalVaccines = getTotalCount();
  const overdueCount = getOverdueCount();
  const nextAppointment = getNextAppointment();
  const nextVaccine = getNextVaccine();

  /**
   * Handle emergency call
   */
  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  /**
   * Handle adding contact from phonebook
   */
  const handleAddContactFromPhonebook = async () => {
    try {
      // Request permission to access contacts
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('home.permissionDenied', 'Permission Denied'),
          t('home.contactsPermissionMessage', 'Please allow access to contacts to add emergency contacts from your phonebook.')
        );
        return;
      }

      // Open contact picker
      const contact = await Contacts.presentContactPickerAsync();
      
      if (contact) {
        // Get the first phone number
        const phoneNumber = contact.phoneNumbers?.[0]?.number;
        
        if (!phoneNumber) {
          Alert.alert(
            t('common.error', 'Error'),
            t('home.noPhoneNumber', 'This contact has no phone number.')
          );
          return;
        }

        // Show dialog to confirm and select role
        Alert.alert(
          t('home.addEmergencyContact', 'Add Emergency Contact'),
          t('home.confirmAddContact', `Add ${contact.name} as an emergency contact?`),
          [
            {
              text: t('common.cancel', 'Cancel'),
              style: 'cancel',
            },
            {
              text: t('home.addAsDoctor', 'Doctor'),
              onPress: () => saveEmergencyContact(contact.name || 'Unknown', 'Doctor', phoneNumber),
            },
            {
              text: t('home.addAsMidwife', 'Midwife'),
              onPress: () => saveEmergencyContact(contact.name || 'Unknown', 'Midwife', phoneNumber),
            },
            {
              text: t('home.addAsFamily', 'Family'),
              onPress: () => saveEmergencyContact(contact.name || 'Unknown', 'Family Member', phoneNumber),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error accessing contacts:', error);
      Alert.alert(
        t('common.error', 'Error'),
        t('home.contactsError', 'Failed to access contacts. Please try again.')
      );
    }
  };

  /**
   * Save emergency contact to backend
   */
  const saveEmergencyContact = async (name: string, role: string, phone: string) => {
    try {
      await createEmergencyContact({
        name,
        role,
        phone,
        isPrimary: false,
      });
      Alert.alert(
        t('common.success', 'Success'),
        t('home.contactAdded', `${name} has been added to your emergency contacts.`)
      );
    } catch (error) {
      console.error('Error saving emergency contact:', error);
      Alert.alert(
        t('common.error', 'Error'),
        t('home.saveContactError', 'Failed to save emergency contact. Please try again.')
      );
    }
  };

  /**
   * Handle long press on emergency contact to delete
   */
  const handleLongPressEmergencyContact = (contactId: string, contactName: string, isDefault: boolean) => {
    if (isDefault) {
      Alert.alert(
        t('home.cannotDelete', 'Cannot Delete'),
        t('home.defaultContactMessage', 'Default emergency contacts cannot be deleted.')
      );
      return;
    }

    Alert.alert(
      t('home.deleteContact', 'Delete Contact'),
      t('home.deleteContactConfirm', `Are you sure you want to remove "${contactName}" from your emergency contacts?`),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel'
        },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmergencyContact(contactId);
            } catch (error) {
              Alert.alert(t('common.error'), t('home.failedToDeleteContact', 'Failed to delete contact'));
            }
          }
        }
      ]
    );
  };

  /**
   * Navigate to add child profile
   */
  const handleAddChild = () => {
    navigation.navigate('AddChild');
  };

  /**
   * Navigate to create pregnancy profile
   */
  const handleCreatePregnancy = () => {
    Alert.alert(
      t('home.pregnancyProfileComingSoon', 'Coming Soon'),
      t('home.pregnancyProfileMessage', 'Pregnancy profile feature will be available soon. You can add your child\'s profile once they are born.'),
      [{ text: t('common.ok', 'OK') }]
    );
    // TODO: navigation.navigate('CreatePregnancy');
  };

  /**
   * Handle add record button - show options for different record types
   */
  const handleAddRecord = () => {
    Alert.alert(
      t('home.addRecord'),
      t('home.selectRecordType', 'Select the type of record you want to add'),
      [
        {
          text: t('home.addGrowthRecord', 'Growth Measurement'),
          onPress: () => {
            setSelectedRecordType('growth');
            setIsAddModalVisible(true);
          }
        },
        {
          text: t('home.addVaccineRecord', 'Vaccine Record'),
          onPress: () => {
            setSelectedRecordType('vaccination');
            setIsAddModalVisible(true);
          }
        },
        {
          text: t('home.addAppointment', 'Schedule Appointment'),
          onPress: () => {
            setSelectedRecordType('appointment');
            setIsAddModalVisible(true);
          }
        },
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel'
        }
      ]
    );
  };

  /**
   * Handle saving a new record
   */
  const handleSaveRecord = async () => {
    if (!recordTitle.trim()) {
      Alert.alert(t('common.error'), t('home.titleRequired', 'Please enter a title'));
      return;
    }

    if (!profile?.id) {
      Alert.alert(t('common.error'), t('home.noChildProfile', 'No child profile found'));
      return;
    }

    try {
      await createActivity(profile.id, {
        type: selectedRecordType as 'growth' | 'vaccination' | 'appointment',
        title: recordTitle,
        description: recordDescription,
        icon: selectedRecordType || 'add',
      });
      
      setIsAddModalVisible(false);
      setRecordTitle('');
      setRecordDescription('');
      setSelectedRecordType(null);
    } catch (error) {
      Alert.alert(t('common.error'), t('home.failedToSave', 'Failed to save activity'));
    }
  };

  /**
   * Handle long press on activity to delete
   */
  const handleLongPressActivity = (activityId: string, activityTitle: string) => {
    Alert.alert(
      t('home.deleteRecord', 'Delete Record'),
      t('home.deleteRecordConfirm', `Are you sure you want to delete "${activityTitle}"?`),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel'
        },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteActivityFromStore(activityId);
            } catch (error) {
              Alert.alert(t('common.error'), t('home.failedToDelete', 'Failed to delete activity'));
            }
          }
        }
      ]
    );
  };

  // Show loading state
  if (isLoadingChild && !profile) {
    return (
      <SwipeableTabNavigator>
        <View style={[styles.container, styles.centerContent, { paddingTop: insets.top, backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('common.loading', 'Loading...')}</Text>
        </View>
      </SwipeableTabNavigator>
    );
  }

  // Show empty state if no child profile
  if (!profile) {
    return (
      <SwipeableTabNavigator>
        <View style={[styles.container, styles.centerContent, { paddingTop: insets.top, backgroundColor: colors.background }]}>
          <View style={styles.emptyStateContainer}>
            <View style={styles.welcomeVideoContainer}>
              <Video
                source={require('../../assets/Seamless_Video_Loop_Creation.mp4')}
                style={styles.welcomeVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
              />
            </View>
            <Text style={styles.emptyTitle}>{t('home.welcomeTitle', 'Welcome!')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('home.getStartedMessage', 'Get started by creating a profile')}
            </Text>
            
            {/* Option Cards */}
            <View style={styles.optionCardsContainer}>
              {/* Pregnancy Profile Option */}
              <TouchableOpacity 
                style={[styles.optionCard, { backgroundColor: colors.white, borderColor: colors.gray[200] }]} 
                onPress={handleCreatePregnancy}
              >
                <View style={[styles.optionIconContainer, { backgroundColor: colors.secondaryLight }]}>
                  <Ionicons name="heart-outline" size={32} color={colors.secondary} />
                </View>
                <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                  {t('home.pregnancyProfile', 'Pregnancy Profile')}
                </Text>
                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                  {t('home.pregnancyDescription', 'Track your pregnancy journey')}
                </Text>
                <View style={[styles.optionButton, { backgroundColor: colors.secondaryLight }]}>
                  <Text style={[styles.optionButtonText, { color: colors.secondary }]}>
                    {t('home.createProfile', 'Create Profile')}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.secondary} />
                </View>
              </TouchableOpacity>

              {/* Child Profile Option */}
              <TouchableOpacity 
                style={[styles.optionCard, { backgroundColor: colors.white, borderColor: colors.gray[200] }]} 
                onPress={handleAddChild}
              >
                <View style={[styles.optionIconContainer, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="happy-outline" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                  {t('home.childProfile', 'Child Profile')}
                </Text>
                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                  {t('home.childDescription', 'Track your child\'s health and growth')}
                </Text>
                <View style={[styles.optionButton, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.optionButtonText, { color: colors.primary }]}>
                    {t('home.addChild', 'Add Child Profile')}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SwipeableTabNavigator>
    );
  }

  return (
    <SwipeableTabNavigator>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primaryLight }]}>
              <Image source={APP_ICON} style={{ width: 24, height: 24 }} resizeMode="contain" />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('home.title')}</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t('home.subtitle')}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconButton}>
              <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
              <View style={[styles.notificationBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.notificationBadgeText}>8</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => navigation.navigate('ProfileMain')}
            >
              <Ionicons name="person-circle-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Animated.View 
        style={[
          styles.swipeContainer,
          { transform: [{ translateX: swipeAnim }] }
        ]}
        {...panResponder.panHandlers}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >

      {/* Child Summary Card */}
      {profile && (
        <Card style={styles.childSummaryCard}>
          <View style={styles.childInfo}>
            <View style={styles.avatarVideoContainer}>
              <Video
                source={require('../../assets/Baby_Animation_For_Home_Screen.mp4')}
                style={styles.avatarVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
              />
            </View>
            <View style={styles.childDetails}>
              <Text style={styles.childName}>{profile.firstName} {profile.lastName}</Text>
              <Text style={styles.childAge}>
                {t('home.monthsOld', { months: ageDisplay.months, weeks: ageDisplay.weeks })}
              </Text>
              <View style={styles.childStats}>
                <Text style={styles.childStat}>
                  {t('home.weight')} {latestMeasurement?.weight || profile.birthWeight} kg
                </Text>
                <Text style={styles.childStat}>
                  {t('home.height')} {latestMeasurement?.height || profile.birthHeight} cm
                </Text>
              </View>
              <View style={styles.chdrBadge}>
                <Text style={styles.chdrText}>{t('home.chdrNumber')} {profile.chdrNumber}</Text>
              </View>
            </View>
          </View>
          
          {/* Profile Indicator Dots - Only show when multiple children */}
          {children.length > 1 && (
            <View style={styles.profileIndicatorInCard}>
              <View style={styles.profileIndicatorDots}>
                {children.map((child, index) => (
                  <TouchableOpacity
                    key={child.id}
                    style={[
                      styles.profileDot,
                      { backgroundColor: colors.gray[300] },
                      index === currentChildIndex && [
                        styles.profileDotActive,
                        { backgroundColor: colors.primary },
                      ],
                    ]}
                    onPress={() => selectChild(child.id)}
                  >
                    {index === currentChildIndex && (
                      <Text style={[styles.profileDotText, { color: colors.white }]}>
                        {child.firstName.charAt(0)}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.swipeHint}>
                {t('home.swipeToSwitch', '← Swipe to switch profiles →')}
              </Text>
            </View>
          )}
        </Card>
      )}

      {/* Quick Stats Row (Next appointment & Growth percentile removed) */}

      <View style={styles.statsRow}>
        <TouchableOpacity 
          style={{ flex: 1 }}
          onPress={() => navigation.navigate('Vaccines')}
          activeOpacity={0.7}
        >
          <Card style={styles.statCard}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <Text style={styles.statLabel}>{t('home.immunizations')}</Text>
            <Text style={styles.statValue}>{vaccineProgress}%</Text>
          </Card>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ flex: 1 }}
          onPress={() => navigation.navigate('Vaccines')}
          activeOpacity={0.7}
        >
          <Card style={styles.statCard}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
            <Text style={styles.statLabel}>{t('home.overdueVaccines')}</Text>
            <Text style={styles.statValue}>{overdueCount}</Text>
          </Card>
        </TouchableOpacity>
      </View>

      {/* Immunization Progress Card */}
      <Card style={styles.immunizationCard}>
        <SectionTitle 
          title={t('home.immunizationProgress')} 
          icon="shield-checkmark-outline" 
          iconColor={colors.primary}
        />
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>{t('home.overallProgress')}</Text>
          <ProgressBar 
            progress={vaccineProgress} 
            height={10} 
            showLabel 
            labelPosition="right"
            color={colors.primary}
          />
        </View>
        <Text style={styles.progressDetail}>
          {t('home.vaccinesCompleted', { completed: completedVaccines, total: totalVaccines })}
        </Text>
        {nextVaccine && (
          <Text style={styles.nextVaccineText}>
            {t('home.nextVaccine', { 
              vaccine: nextVaccine.vaccine.shortName, 
              age: nextVaccine.vaccine.ageGroup 
            })}
          </Text>
        )}
      </Card>

      {/* Quick Actions */}
      {/* Add Record button hidden per user request
      <View style={styles.actionButtonsRow}>
        <Button
          title={t('home.addRecord')}
          icon="add"
          onPress={handleAddRecord}
          style={styles.fullWidthButton}
        />
      </View>
      */}

      {/* Emergency Contacts */}
      <Card style={styles.emergencyCard}>
        <SectionTitle 
          title={t('home.emergencyContacts')} 
          icon="call-outline" 
          iconColor={colors.error}
          actionText={t('home.addContact', 'Add Contact (+)')}
          onActionPress={handleAddContactFromPhonebook}
        />
        {emergencyContacts.length === 0 ? (
          <View style={styles.emptyContactsContainer}>
            <Ionicons name="call-outline" size={32} color={colors.gray[300]} />
            <Text style={[styles.emptyContactsText, { color: colors.gray[400] }]}>
              {t('home.noEmergencyContacts', 'No emergency contacts yet')}
            </Text>
            <TouchableOpacity 
              style={[styles.addContactButton, { backgroundColor: colors.primary }]}
              onPress={handleAddContactFromPhonebook}
            >
              <Ionicons name="add" size={16} color={colors.white} />
              <Text style={[styles.addContactButtonText, { color: colors.white }]}>
                {t('home.addFromPhonebook', 'Add from Phonebook')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          emergencyContacts.map((contact) => (
            <TouchableOpacity 
              key={contact.id} 
              style={styles.contactRow}
              onLongPress={() => handleLongPressEmergencyContact(contact.id, contact.name, contact.isDefault)}
              delayLongPress={500}
            >
              <View style={styles.contactInfo}>
                <View style={styles.contactNameRow}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  {contact.isPrimary && (
                    <View style={[styles.primaryBadge, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.primaryBadgeText, { color: colors.primary }]}>
                        {t('home.primary', 'Primary')}
                      </Text>
                    </View>
                  )}
                  {contact.isDefault && (
                    <View style={[styles.defaultBadge, { backgroundColor: colors.gray[200] }]}>
                      <Text style={[styles.defaultBadgeText, { color: colors.gray[600] }]}>
                        {t('home.default', 'Default')}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.contactRole}>{contact.role}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.callButton, { backgroundColor: colors.error }]}
                onPress={() => handleCall(contact.phone)}
              >
                <Ionicons name="call" size={16} color={colors.white} />
                <Text style={styles.callButtonText}>{t('common.call')}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </Card>

      {/* Recent Activities */}
      <Card style={styles.activitiesCard}>
        <SectionTitle 
          title={t('home.recentActivities')} 
          actionText={t('common.viewAll')}
          onActionPress={() => navigation.navigate('Activities')}
        />
        {(!activities || activities.length === 0) ? (
          <View style={styles.emptyActivitiesContainer}>
            <Ionicons name="document-text-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyActivitiesText}>{t('activities.noActivities', 'No Activities Yet')}</Text>
            <Text style={styles.emptyActivitiesSubtext}>{t('activities.noActivitiesMessage', 'Activities will appear here as you add them')}</Text>
          </View>
        ) : (
          activities.slice(0, 4).map((activity) => (
            <TouchableOpacity 
              key={activity.id} 
              style={styles.activityRow}
              onLongPress={() => handleLongPressActivity(activity.id, activity.title)}
              delayLongPress={500}
            >
              <View style={[
                styles.activityIcon, 
                { backgroundColor: getActivityColorDynamic(activity.type) + '20' }
              ]}>
                <Ionicons 
                  name={getActivityIcon(activity.type)} 
                  size={16} 
                  color={getActivityColorDynamic(activity.type)} 
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDate}>
                  {activity.createdAt ? formatActivityDate(activity.createdAt) : 'Recently'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </Card>

      {/* Bottom spacing */}
      <View style={{ height: SPACING.xl }} />
      </ScrollView>
      </Animated.View>
      
      <FloatingChatButton />

      {/* Add Record Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {t('home.addRecord')} - {selectedRecordType === 'growth' ? t('home.addGrowthRecord') : 
                  selectedRecordType === 'vaccination' ? t('home.addVaccineRecord') : 
                  t('home.addAppointment')}
              </Text>
              <TouchableOpacity 
                onPress={() => setIsAddModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>{t('home.recordTitle', 'Title')} *</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                value={recordTitle}
                onChangeText={setRecordTitle}
                placeholder={t('home.recordTitlePlaceholder', 'Enter title')}
                placeholderTextColor={colors.gray[400]}
              />

              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>{t('home.recordDescription', 'Description')}</Text>
              <TextInput
                style={[styles.input, styles.textArea, { borderColor: colors.gray[200], color: colors.textPrimary }]}
                value={recordDescription}
                onChangeText={setRecordDescription}
                placeholder={t('home.recordDescriptionPlaceholder', 'Enter description (optional)')}
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, { borderColor: colors.gray[300] }]}
                  onPress={() => {
                    setIsAddModalVisible(false);
                    setRecordTitle('');
                    setRecordDescription('');
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveRecord}
                >
                  <Text style={[styles.saveButtonText, { color: colors.white }]}>{t('common.save', 'Save')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      </View>
    </SwipeableTabNavigator>
  );
};

// Helper functions
const getActivityIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'vaccination': return 'shield-checkmark';
    case 'growth': return 'trending-up';
    case 'milestone': return 'star';
    case 'checkup': return 'medical';
    default: return 'ellipse';
  }
};

const getActivityColor = (type: string): string => {
  switch (type) {
    case 'vaccination': return COLORS.info;
    case 'growth': return COLORS.success;
    case 'milestone': return COLORS.warning;
    case 'checkup': return COLORS.primary;
    default: return COLORS.gray[500];
  }
};

const formatActivityDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} month ago`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fixedHeader: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
    paddingHorizontal: SPACING.md,
    zIndex: 1000,
  },
  profileIndicatorContainer: {
    alignItems: 'center',
    paddingBottom: SPACING.sm,
  },
  profileIndicatorInCard: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  profileIndicatorDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  profileDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    // backgroundColor applied dynamically via inline styles
  },
  profileDotActive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    // backgroundColor applied dynamically via inline styles
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDotText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  swipeHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.gray[400],
    marginTop: SPACING.xs,
  },
  swipeContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.md,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  welcomeVideoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    marginTop: -SPACING.xl * 2,
  },
  welcomeVideo: {
    width: '100%',
    height: '100%',
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  optionCardsContainer: {
    width: '100%',
    gap: SPACING.md,
  },
  optionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    padding: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  optionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  optionButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerIconButton: {
    position: 'relative',
    padding: SPACING.xs,
  },
  notificationButton: {
    position: 'relative',
    padding: SPACING.xs,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },

  // Baby Animation
  avatarVideoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: COLORS.gray[100],
  },
  avatarVideo: {
    width: '100%',
    height: '100%',
  },

  // Child Summary
  childSummaryCard: {
    marginBottom: SPACING.sm,
  },
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  childDetails: {
    flex: 1,
  },
  childName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  childAge: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  childStats: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  childStat: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  chdrBadge: {
    backgroundColor: COLORS.info + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  chdrText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.info,
    fontWeight: FONT_WEIGHT.medium,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },

  // Immunization Progress
  immunizationCard: {
    marginBottom: SPACING.sm,
  },
  progressSection: {
    marginTop: SPACING.sm,
  },
  progressLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  progressDetail: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  nextVaccineText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // Action Buttons
  actionButtonsRow: {
    marginBottom: SPACING.sm,
  },
  fullWidthButton: {
    width: '100%',
  },

  // Emergency Contacts
  emergencyCard: {
    marginBottom: SPACING.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  contactInfo: {
    flex: 1,
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  contactName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },
  contactRole: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  primaryBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.medium,
  },
  defaultBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.medium,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  callButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.white,
  },
  emptyContactsContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  emptyContactsText: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  addContactButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },

  // Activities
  activitiesCard: {
    marginBottom: SPACING.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },
  activityDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  emptyActivitiesContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyActivitiesText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.gray[400],
    marginTop: SPACING.xs,
  },
  emptyActivitiesSubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.gray[400],
    textAlign: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
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
  textArea: {
    height: 100,
    paddingTop: SPACING.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.gray[100],
  },
  cancelButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.white,
  },
});

export default HomeScreen;
