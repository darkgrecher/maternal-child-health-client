/**
 * Profile Screen
 * 
 * Displays child's personal information, birth details,
 * medical information, family info, and healthcare providers.
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
import { format } from 'date-fns';

import { Card, Header, Avatar, SectionTitle, InfoRow, Badge } from '../components/common';
import { useChildStore } from '../stores';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';

/**
 * Profile Screen Component
 */
const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const { profile, getChildAgeDisplay } = useChildStore();
  const ageDisplay = getChildAgeDisplay();

  if (!profile) {
    return (
      <View style={styles.container}>
        <Header 
          title={t('profile.title')} 
          subtitle={t('profile.subtitle')}
          icon="person-circle-outline"
          iconColor={COLORS.primary}
        />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t('common.noData')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title={t('profile.title')} 
        subtitle={t('profile.subtitle')}
        icon="person-circle-outline"
        iconColor={COLORS.primary}
        rightIcon="create-outline"
        onRightPress={() => {
          // TODO: Navigate to edit profile
        }}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <Card style={styles.profileHeaderCard}>
          <View style={styles.profileHeader}>
            <Avatar 
              name={`${profile.firstName} ${profile.lastName}`} 
              size="xlarge"
              uri={profile.photoUri}
            />
            <Text style={styles.profileName}>
              {profile.firstName} {profile.lastName}
            </Text>
            <Text style={styles.profileAge}>
              {ageDisplay.months} months {ageDisplay.weeks} weeks
            </Text>
            <Text style={styles.profileDob}>
              Born: {format(new Date(profile.dateOfBirth), 'M/d/yyyy')}
            </Text>
            <Badge 
              text={profile.gender === 'female' ? t('profile.female') : t('profile.male')} 
              variant="primary"
              size="small"
            />
          </View>
        </Card>

        {/* Birth Information */}
        <Card style={styles.sectionCard}>
          <SectionTitle 
            title={t('profile.birthInfo')} 
            icon="gift-outline"
            iconColor={COLORS.primary}
          />
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t('profile.birthWeight')}</Text>
              <Text style={styles.infoValue}>{profile.birthWeight} kg</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{t('profile.birthHeight')}</Text>
              <Text style={styles.infoValue}>{profile.birthHeight} cm</Text>
            </View>
          </View>
          <View style={styles.singleInfo}>
            <Text style={styles.infoLabel}>{t('profile.bloodType')}</Text>
            <Text style={styles.infoValue}>{profile.bloodType}</Text>
          </View>
        </Card>

        {/* Medical Information */}
        <Card style={styles.sectionCard}>
          <SectionTitle 
            title={t('profile.medicalInfo')} 
            icon="heart-outline"
            iconColor={COLORS.error}
          />
          <View style={styles.singleInfo}>
            <Text style={styles.infoLabel}>{t('profile.allergies')}</Text>
            <Text style={styles.infoValue}>
              {profile.allergies.length > 0 
                ? profile.allergies.join(', ') 
                : t('profile.noneKnown')
              }
            </Text>
          </View>
          <View style={styles.singleInfo}>
            <Text style={styles.infoLabel}>{t('profile.specialConditions')}</Text>
            <Text style={styles.infoValue}>
              {profile.specialConditions.length > 0 
                ? profile.specialConditions.join(', ') 
                : t('profile.none')
              }
            </Text>
          </View>
        </Card>

        {/* Family Information */}
        <Card style={styles.sectionCard}>
          <SectionTitle 
            title={t('profile.familyInfo')} 
            icon="people-outline"
            iconColor={COLORS.info}
          />
          <View style={styles.singleInfo}>
            <Text style={styles.infoLabel}>{t('profile.motherName')}</Text>
            <Text style={styles.infoValue}>{profile.motherName}</Text>
          </View>
          <View style={styles.singleInfo}>
            <Text style={styles.infoLabel}>{t('profile.fatherName')}</Text>
            <Text style={styles.infoValue}>{profile.fatherName}</Text>
          </View>
          <View style={styles.singleInfo}>
            <Text style={styles.infoLabel}>{t('profile.emergencyContact')}</Text>
            <Text style={styles.infoValue}>{profile.emergencyContact}</Text>
          </View>
        </Card>

        {/* Healthcare Providers */}
        <Card style={styles.sectionCard}>
          <SectionTitle 
            title={t('profile.healthcareProviders')} 
            icon="medical-outline"
            iconColor={COLORS.warning}
          />
          {profile.assignedMidwife && (
            <View style={styles.providerItem}>
              <Text style={styles.infoLabel}>{t('profile.assignedMidwife')}</Text>
              <Text style={styles.infoValue}>{profile.assignedMidwife.name}</Text>
            </View>
          )}
          {profile.pediatrician && (
            <View style={styles.providerItem}>
              <Text style={styles.infoLabel}>{t('profile.pediatrician')}</Text>
              <Text style={styles.infoValue}>{profile.pediatrician.name}</Text>
            </View>
          )}
        </Card>

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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },

  // Profile Header
  profileHeaderCard: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    marginTop: SPACING.sm,
  },
  profileHeader: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  profileAge: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  profileDob: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },

  // Section Cards
  sectionCard: {
    marginTop: SPACING.sm,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  infoItem: {
    flex: 1,
  },
  singleInfo: {
    marginTop: SPACING.sm,
  },
  infoLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },
  providerItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
});

export default ProfileScreen;
