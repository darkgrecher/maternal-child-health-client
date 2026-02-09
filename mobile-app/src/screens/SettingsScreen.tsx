/**
 * Settings Screen
 * 
 * App settings including language selection and child profile management.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card, Header, SectionTitle, Avatar } from '../components/common';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';
import { useChildStore, useThemeStore, usePregnancyStore, useAuthStore } from '../stores';
import { RootStackParamList } from '../types';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
];

/**
 * Settings Screen Component
 */
const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const currentLanguage = i18n.language;
  const { children, profile, selectChild, deleteChild } = useChildStore();
  const { colors } = useThemeStore();
  const { currentPregnancy, pregnancies, deletePregnancy, viewPregnancy, getActivePregnancy } = usePregnancyStore();
  const activePregnancy = getActivePregnancy();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout', 'Logout'),
      t('settings.logoutConfirm', 'Are you sure you want to logout?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('settings.logout', 'Logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const handleAddChild = () => {
    navigation.navigate('AddChild');
  };

  const handleEditChildProfile = (childId: string) => {
    navigation.navigate('EditProfile', { childId });
  };

  const handleEditPregnancyProfile = () => {
    if (currentPregnancy) {
      navigation.navigate('EditPregnancy', { pregnancyId: currentPregnancy.id });
    }
  };

  const handleViewPregnancy = (pregnancyId: string) => {
    // View the selected pregnancy and navigate to the pregnancy dashboard
    viewPregnancy(pregnancyId);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'PregnancyMain' }],
      })
    );
  };

  const handleEditSpecificPregnancy = (pregnancyId: string) => {
    navigation.navigate('EditPregnancy', { pregnancyId });
  };

  const handleDeleteSpecificPregnancy = (pregnancyId: string, pregnancyName: string) => {
    Alert.alert(
      t('pregnancy.deleteProfile', 'Delete Pregnancy Profile'),
      t('pregnancy.deleteConfirmNamed', `Are you sure you want to delete ${pregnancyName}'s pregnancy profile? This action cannot be undone.`),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePregnancy(pregnancyId);
              Alert.alert(
                t('common.success', 'Success'),
                t('pregnancy.deleteSuccess', 'Pregnancy profile deleted successfully')
              );
            } catch (error) {
              Alert.alert(
                t('common.error', 'Error'),
                t('pregnancy.deleteFailed', 'Failed to delete pregnancy profile')
              );
            }
          },
        },
      ]
    );
  };

  // Helper to check if a pregnancy is completed
  const isPregnancyCompletedCheck = (pregnancy: typeof currentPregnancy) => {
    if (!pregnancy?.expectedDeliveryDate) return false;
    return new Date() >= new Date(pregnancy.expectedDeliveryDate);
  };

  const handleCreatePregnancy = () => {
    navigation.navigate('CreatePregnancy');
  };

  const handleCreateNewPregnancyWithPrevious = () => {
    // Find the most recently completed pregnancy to use for pre-filling form
    const completedPregnancies = pregnancies
      .filter(p => isPregnancyCompletedCheck(p))
      .sort((a, b) => 
        new Date(b.expectedDeliveryDate || 0).getTime() - new Date(a.expectedDeliveryDate || 0).getTime()
      );
    
    const mostRecentCompleted = completedPregnancies[0];
    
    if (mostRecentCompleted) {
      navigation.navigate('CreatePregnancy', { previousPregnancyId: mostRecentCompleted.id });
    } else if (currentPregnancy) {
      navigation.navigate('CreatePregnancy', { previousPregnancyId: currentPregnancy.id });
    } else {
      navigation.navigate('CreatePregnancy');
    }
  };

  // Check if current pregnancy is completed (due date has passed)
  const isPregnancyCompleted = currentPregnancy?.expectedDeliveryDate 
    ? new Date() >= new Date(currentPregnancy.expectedDeliveryDate)
    : false;

  const handleSelectChild = (childId: string) => {
    selectChild(childId);
    Alert.alert(
      t('common.success'),
      t('settings.profileSwitched', 'Switched to child profile'),
      [{ text: t('common.done', 'Done') }]
    );
  };

  const handleDeleteChild = (childId: string, childName: string) => {
    if (children.length <= 1) {
      Alert.alert(
        t('common.error'),
        t('settings.cannotDeleteLastChild', 'Cannot delete the only child profile')
      );
      return;
    }

    Alert.alert(
      t('settings.deleteChild', 'Delete Child Profile'),
      t('settings.deleteChildConfirm', `Are you sure you want to delete ${childName}'s profile? This action cannot be undone.`),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChild(childId);
            } catch (error) {
              Alert.alert(t('common.error'), t('settings.deleteChildFailed', 'Failed to delete child profile'));
            }
          },
        },
      ]
    );
  };

  // Check if user has both profiles
  const hasBothProfiles = (children.length > 0 || profile !== null) && (currentPregnancy !== null || pregnancies.length > 0);

  const handleSwitchToPregnancy = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'PregnancyMain' }],
      })
    );
  };

  const handleSwitchToChild = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      })
    );
  };

  const handleDeletePregnancy = () => {
    if (!currentPregnancy) return;

    Alert.alert(
      t('pregnancy.deleteProfile', 'Delete Pregnancy Profile'),
      t('pregnancy.deleteConfirm', 'Are you sure you want to delete this pregnancy profile? This action cannot be undone.'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePregnancy(currentPregnancy.id);
              Alert.alert(
                t('common.success', 'Success'),
                t('pregnancy.profileDeleted', 'Pregnancy profile deleted successfully.')
              );
            } catch (error) {
              Alert.alert(t('common.error', 'Error'), t('pregnancy.deleteFailed', 'Failed to delete pregnancy profile.'));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title={t('settings.title', 'Settings')} 
        subtitle={t('settings.subtitle', 'App Preferences')}
        icon="settings-outline"
        iconColor={colors.primary}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Switch Profile Section - Only show if user has both profiles */}
        {hasBothProfiles && (
          <Card style={styles.sectionCard}>
            <SectionTitle 
              title={t('settings.switchSection', 'Switch Section')} 
              icon="swap-horizontal-outline"
              iconColor={colors.warning}
            />
            
            <Text style={styles.sectionDescription}>
              {t('settings.switchSectionDescription', 'You have both pregnancy and child profiles. Switch between sections to manage each.')}
            </Text>

            <View style={styles.switchButtonsContainer}>
              <TouchableOpacity
                style={[styles.switchButton, { backgroundColor: colors.secondaryLight, borderColor: colors.secondary }]}
                onPress={handleSwitchToPregnancy}
              >
                <View style={[styles.switchButtonIcon, { backgroundColor: colors.secondary }]}>
                  <Ionicons name="heart" size={20} color={colors.white} />
                </View>
                <View style={styles.switchButtonContent}>
                  <Text style={[styles.switchButtonTitle, { color: colors.secondary }]}>
                    {t('settings.pregnancySection', 'Pregnancy Section')}
                  </Text>
                  <Text style={[styles.switchButtonDescription, { color: colors.textSecondary }]}>
                    {t('settings.trackPregnancy', 'Track your pregnancy journey')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.switchButton, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                onPress={handleSwitchToChild}
              >
                <View style={[styles.switchButtonIcon, { backgroundColor: colors.primary }]}>
                  <Ionicons name="people" size={20} color={colors.white} />
                </View>
                <View style={styles.switchButtonContent}>
                  <Text style={[styles.switchButtonTitle, { color: colors.primary }]}>
                    {t('settings.childSection', 'Child Section')}
                  </Text>
                  <Text style={[styles.switchButtonDescription, { color: colors.textSecondary }]}>
                    {t('settings.trackChildren', 'Track your children\'s growth')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Pregnancy Profile Section - Show all pregnancy profiles */}
        {pregnancies.length > 0 && (
          <Card style={styles.sectionCard}>
            <SectionTitle 
              title={t('settings.pregnancyProfiles', 'Pregnancy Profiles')} 
              icon="heart-outline"
              iconColor={colors.secondary}
            />
            
            {/* Sort pregnancies: active first, then by creation date */}
            {[...pregnancies]
              .sort((a, b) => {
                // Active pregnancies first
                const aCompleted = isPregnancyCompletedCheck(a);
                const bCompleted = isPregnancyCompletedCheck(b);
                if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
                // Then by expected delivery date (most recent first)
                return new Date(b.expectedDeliveryDate || 0).getTime() - new Date(a.expectedDeliveryDate || 0).getTime();
              })
              .map((pregnancy, index) => {
                const isCompleted = isPregnancyCompletedCheck(pregnancy);
                const isActive = currentPregnancy?.id === pregnancy.id;
                
                return (
                  <View key={pregnancy.id}>
                    {index > 0 && <View style={styles.pregnancySeparator} />}
                    <View style={styles.pregnancyItemContainer}>
                      <TouchableOpacity
                        style={[
                          styles.pregnancyProfileItem, 
                          { backgroundColor: isCompleted ? colors.gray[100] : colors.secondaryLight },
                          isActive && styles.activePregnancyBorder,
                          isActive && { borderColor: colors.secondary }
                        ]}
                        onPress={() => isCompleted ? handleViewPregnancy(pregnancy.id) : handleEditSpecificPregnancy(pregnancy.id)}
                      >
                        <View style={[
                          styles.pregnancyIcon, 
                          { backgroundColor: isCompleted ? colors.gray[400] : colors.secondary }
                        ]}>
                          <Ionicons name="heart" size={24} color={colors.white} />
                        </View>
                        <View style={styles.pregnancyInfo}>
                          <View style={styles.pregnancyNameRow}>
                            <Text style={[styles.pregnancyName, { color: colors.textPrimary }]}>
                              {pregnancy.motherFirstName || t('pregnancy.momToBe', 'Mom-to-be')}
                            </Text>
                            {isCompleted && (
                              <View style={[styles.completedBadge, { backgroundColor: colors.success }]}>
                                <Ionicons name="checkmark-circle" size={12} color={colors.white} />
                                <Text style={styles.completedBadgeText}>
                                  {t('pregnancy.completed', 'Completed')}
                                </Text>
                              </View>
                            )}
                            {isActive && !isCompleted && (
                              <View style={[styles.completedBadge, { backgroundColor: colors.secondary }]}>
                                <Ionicons name="pulse" size={12} color={colors.white} />
                                <Text style={styles.completedBadgeText}>
                                  {t('pregnancy.current', 'Current')}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.pregnancyMeta, { color: isCompleted ? colors.gray[500] : colors.secondary }]}>
                            {isCompleted
                              ? t('pregnancy.periodCompleted', 'Pregnancy period completed')
                              : `${t('pregnancy.dueDate', 'Due')}: ${pregnancy.expectedDeliveryDate 
                                  ? new Date(pregnancy.expectedDeliveryDate).toLocaleDateString() 
                                  : '--'}`
                            }
                          </Text>
                        </View>
                        <View style={styles.pregnancyActions}>
                          <Ionicons name={isCompleted ? "eye" : "create-outline"} size={20} color={isCompleted ? colors.gray[400] : colors.secondary} />
                          <Text style={[styles.editText, { color: isCompleted ? colors.gray[400] : colors.secondary }]}>
                            {isCompleted ? t('common.view', 'View') : t('common.edit', 'Edit')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteSpecificPregnancy(pregnancy.id, pregnancy.motherFirstName || t('pregnancy.momToBe', 'Mom-to-be'))}
                      >
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

            {/* Add New Pregnancy Button - Show only when there's no active pregnancy */}
            {!activePregnancy && pregnancies.some(p => isPregnancyCompletedCheck(p)) && (
              <TouchableOpacity
                style={[styles.addNewPregnancyButton, { backgroundColor: colors.secondaryLight, borderColor: colors.secondary }]}
                onPress={handleCreateNewPregnancyWithPrevious}
              >
                <View style={[styles.addPregnancyIcon, { backgroundColor: colors.secondary }]}>
                  <Ionicons name="add" size={24} color={colors.white} />
                </View>
                <View style={styles.addPregnancyTextContainer}>
                  <Text style={[styles.addPregnancyTitle, { color: colors.secondary }]}>
                    {t('settings.addNewPregnancy', 'Add New Pregnancy Profile')}
                  </Text>
                  <Text style={[styles.addPregnancyDescription, { color: colors.textSecondary }]}>
                    {t('settings.pregnantAgain', 'Start tracking your new pregnancy')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
              </TouchableOpacity>
            )}
          </Card>
        )}

        {/* Create Pregnancy Profile Section - Show when user has child profiles but no pregnancy */}
        {!currentPregnancy && pregnancies.length === 0 && (children.length > 0 || profile !== null) && (
          <Card style={styles.sectionCard}>
            <SectionTitle 
              title={t('settings.pregnancyTracking', 'Pregnancy Tracking')} 
              icon="heart-outline"
              iconColor={colors.secondary}
            />
            
            <Text style={styles.sectionDescription}>
              {t('settings.createPregnancyDescription', 'Are you expecting? Create a pregnancy profile to track your pregnancy journey alongside your child\'s profile.')}
            </Text>

            <TouchableOpacity
              style={[styles.addPregnancyButton, { backgroundColor: colors.secondaryLight, borderColor: colors.secondary }]}
              onPress={handleCreatePregnancy}
            >
              <View style={[styles.addPregnancyIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name="add" size={24} color={colors.white} />
              </View>
              <View style={styles.addPregnancyTextContainer}>
                <Text style={[styles.addPregnancyTitle, { color: colors.secondary }]}>
                  {t('settings.createPregnancyProfile', 'Create Pregnancy Profile')}
                </Text>
                <Text style={[styles.addPregnancyDescription, { color: colors.textSecondary }]}>
                  {t('settings.startTrackingPregnancy', 'Start tracking your pregnancy journey')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
            </TouchableOpacity>
          </Card>
        )}

        {/* Child Profiles Section */}
        <Card style={styles.sectionCard}>
          <SectionTitle 
            title={t('settings.childProfiles', 'Child Profiles')} 
            icon="people-outline"
            iconColor={colors.primary}
          />
          
          <Text style={styles.sectionDescription}>
            {t('settings.childProfilesDescription', 'Manage your children\'s profiles. Swipe left/right on the home screen to switch between profiles.')}
          </Text>

          {/* List of existing children */}
          <View style={styles.childList}>
            {children.map((child) => {
              const isSelected = profile?.id === child.id;
              
              return (
                <View key={child.id} style={styles.childItemContainer}>
                  <TouchableOpacity
                    style={[
                      styles.childItem,
                      isSelected && styles.childItemSelected,
                    ]}
                    onPress={() => handleSelectChild(child.id)}
                  >
                    <Avatar name={`${child.firstName} ${child.lastName}`} size="small" />
                    <View style={styles.childInfo}>
                      <Text style={[
                        styles.childName,
                        isSelected && styles.childNameSelected,
                      ]}>
                        {child.firstName} {child.lastName}
                      </Text>
                      <Text style={styles.childMeta}>
                        {child.gender === 'male' ? '👦' : '👧'} {t(`profile.${child.gender}`, child.gender)}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditChildProfile(child.id)}
                  >
                    <Ionicons name="pencil-outline" size={20} color={colors.info} />
                  </TouchableOpacity>
                  
                  {children.length > 1 && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteChild(child.id, child.firstName)}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          {/* Add another child button */}
          <TouchableOpacity
            style={styles.addChildButton}
            onPress={handleAddChild}
          >
            <View style={[styles.addChildIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="add" size={24} color={colors.primary} />
            </View>
            <View style={styles.addChildTextContainer}>
              <Text style={styles.addChildTitle}>
                {t('settings.addAnotherChild', 'Add Another Child Profile')}
              </Text>
              <Text style={styles.addChildDescription}>
                {t('settings.addAnotherChildDescription', 'Add profile for twins, siblings, or another child')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        </Card>

        {/* Language Settings */}
        <Card style={styles.sectionCard}>
          <SectionTitle 
            title={t('settings.language', 'Language')} 
            icon="language-outline"
            iconColor={colors.info}
          />
          
          <View style={styles.languageList}>
            {LANGUAGES.map((language) => {
              const isSelected = currentLanguage === language.code;
              
              return (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageItem,
                    isSelected && styles.languageItemSelected,
                  ]}
                  onPress={() => handleLanguageChange(language.code)}
                >
                  <View style={styles.languageInfo}>
                    <Text style={[
                      styles.languageName,
                      isSelected && styles.languageNameSelected,
                    ]}>
                      {language.name}
                    </Text>
                    <Text style={[
                      styles.languageNative,
                      isSelected && styles.languageNativeSelected,
                    ]}>
                      {language.nativeName}
                    </Text>
                  </View>
                  
                  {isSelected && (
                    <View style={styles.selectedIconContainer}>
                      <Ionicons 
                        name="checkmark-circle" 
                        size={24} 
                        color={colors.primary} 
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* About Section */}
        <Card style={styles.sectionCard}>
          <SectionTitle 
            title={t('settings.about', 'About')} 
            icon="information-circle-outline"
            iconColor={colors.success}
          />
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>{t('settings.version', 'Version')}</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>{t('settings.appName', 'App Name')}</Text>
            <Text style={styles.aboutValue}>Maternal & Child Health</Text>
          </View>
        </Card>

        {/* Account Info & Logout */}
        {user && (
          <View style={styles.accountSection}>
            <View style={styles.accountHeaderRow}>
              <Text style={[styles.signedInLabel, { color: colors.textSecondary }]}>
                {t('settings.signedInAs', 'Signed in as')}
              </Text>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                <Text style={[styles.logoutText, { color: colors.error }]}>
                  {t('settings.logout', 'Logout')}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.emailText, { color: colors.textPrimary }]}>
              {user.email}
            </Text>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
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
  sectionCard: {
    marginTop: SPACING.sm,
  },
  sectionDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  childList: {
    marginBottom: SPACING.md,
  },
  childItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  childItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray[50],
    borderWidth: 2,
    borderColor: 'transparent',
    gap: SPACING.sm,
  },
  childItemSelected: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  childNameSelected: {
    color: COLORS.primary,
  },
  childMeta: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  editButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  pregnancyItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  pregnancySeparator: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: SPACING.sm,
  },
  pregnancyProfileItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  activePregnancyBorder: {
    borderWidth: 2,
  },
  pregnancyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  pregnancyInfo: {
    flex: 1,
  },
  pregnancyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  pregnancyName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  completedBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.white,
  },
  pregnancyMeta: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  addNewPregnancyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  pregnancyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  editText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  addChildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary + '10',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    borderStyle: 'dashed',
    gap: SPACING.sm,
  },
  addChildIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addChildTextContainer: {
    flex: 1,
  },
  addChildTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
  },
  addChildDescription: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addPregnancyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: SPACING.sm,
  },
  addPregnancyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPregnancyTextContainer: {
    flex: 1,
  },
  addPregnancyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  addPregnancyDescription: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  languageList: {
    marginTop: SPACING.sm,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.gray[50],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageItemSelected: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  languageNameSelected: {
    color: COLORS.primary,
  },
  languageNative: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  languageNativeSelected: {
    color: COLORS.primary,
  },
  selectedIconContainer: {
    marginLeft: SPACING.sm,
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  aboutLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  aboutValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },
  accountSection: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  accountHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  signedInLabel: {
    fontSize: FONT_SIZE.sm,
  },
  emailText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  logoutText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  switchButtonsContainer: {
    gap: SPACING.sm,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  switchButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchButtonContent: {
    flex: 1,
  },
  switchButtonTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  switchButtonDescription: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
});

export default SettingsScreen;
