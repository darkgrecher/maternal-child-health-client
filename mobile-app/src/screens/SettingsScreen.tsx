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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card, Header, SectionTitle, FloatingChatButton, Avatar } from '../components/common';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';
import { useChildStore, useThemeStore, usePregnancyStore } from '../stores';
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
  const { currentPregnancy, pregnancies } = usePregnancyStore();

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
    navigation.navigate('EditChild', { childId });
  };

  const handleEditPregnancyProfile = () => {
    if (currentPregnancy) {
      navigation.navigate('EditPregnancy', { pregnancyId: currentPregnancy.id });
    }
  };

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header 
        title={t('settings.title', 'Settings')} 
        subtitle={t('settings.subtitle', 'App Preferences')}
        icon="settings-outline"
        iconColor={colors.primary}
        rightIcon="notifications-outline"
        onRightPress={() => {
          // TODO: Navigate to notifications
        }}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Pregnancy Profile Section */}
        {currentPregnancy && (
          <Card style={styles.sectionCard}>
            <SectionTitle 
              title={t('settings.pregnancyProfile', 'Pregnancy Profile')} 
              icon="heart-outline"
              iconColor={colors.secondary}
            />
            
            <TouchableOpacity
              style={[styles.pregnancyProfileItem, { backgroundColor: colors.secondaryLight }]}
              onPress={handleEditPregnancyProfile}
            >
              <View style={[styles.pregnancyIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name="heart" size={24} color={colors.white} />
              </View>
              <View style={styles.pregnancyInfo}>
                <Text style={[styles.pregnancyName, { color: colors.textPrimary }]}>
                  {currentPregnancy.motherFirstName || t('pregnancy.momToBe', 'Mom-to-be')}
                </Text>
                <Text style={[styles.pregnancyMeta, { color: colors.secondary }]}>
                  {t('pregnancy.dueDate', 'Due')}: {currentPregnancy.expectedDeliveryDate 
                    ? new Date(currentPregnancy.expectedDeliveryDate).toLocaleDateString() 
                    : '--'}
                </Text>
              </View>
              <View style={styles.pregnancyActions}>
                <Ionicons name="pencil" size={20} color={colors.secondary} />
                <Text style={[styles.editText, { color: colors.secondary }]}>
                  {t('common.edit', 'Edit')}
                </Text>
              </View>
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
  pregnancyProfileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
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
  pregnancyName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  pregnancyMeta: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
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
});

export default SettingsScreen;
