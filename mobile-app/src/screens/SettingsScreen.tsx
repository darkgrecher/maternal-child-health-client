/**
 * Settings Screen
 * 
 * App settings including language selection.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { Card, Header, SectionTitle, FloatingChatButton } from '../components/common';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';

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
  const navigation = useNavigation();
  const currentLanguage = i18n.language;

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Header 
        title={t('settings.title', 'Settings')} 
        subtitle={t('settings.subtitle', 'App Preferences')}
        icon="settings-outline"
        iconColor={COLORS.primary}
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
        {/* Language Settings */}
        <Card style={styles.sectionCard}>
          <SectionTitle 
            title={t('settings.language', 'Language')} 
            icon="language-outline"
            iconColor={COLORS.info}
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
                        color={COLORS.primary} 
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
            iconColor={COLORS.success}
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
