/**
 * Profile Screen
 * 
 * Displays child's personal information, birth details,
 * medical information, family info, and healthcare providers.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';

import { Card, Header, Avatar, SectionTitle, InfoRow, Badge, FloatingChatButton } from '../components/common';
import { useChildStore, useAuthStore } from '../stores';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';

type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: { childId?: string; isNew?: boolean };
};

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

/**
 * Profile Screen Component
 */
const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { profile, children, isLoading, fetchChildren, getChildAgeDisplay } = useChildStore();
  const { user, logout } = useAuthStore();
  const ageDisplay = getChildAgeDisplay();

  // Fetch children data on mount
  useEffect(() => {
    fetchChildren();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      t('auth.logoutTitle', 'Sign Out'),
      t('auth.logoutConfirm', 'Are you sure you want to sign out?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        { 
          text: t('auth.logout', 'Sign Out'), 
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const handleEditProfile = () => {
    if (profile) {
      navigation.navigate('EditProfile', { childId: profile.id, isNew: false });
    }
  };

  const handleAddChild = () => {
    navigation.navigate('EditProfile', { isNew: true });
  };

  if (isLoading && !profile) {
    return (
      <View style={styles.container}>
        <Header 
          title={t('profile.title')} 
          subtitle={t('profile.subtitle')}
          icon="person-circle-outline"
          iconColor={COLORS.primary}
        />
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('common.loading', 'Loading...')}</Text>
        </View>
      </View>
    );
  }

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
          <Ionicons name="person-add-outline" size={64} color={COLORS.gray[300]} />
          <Text style={styles.emptyTitle}>{t('profile.noChildTitle', 'No Child Profile')}</Text>
          <Text style={styles.emptyText}>{t('profile.noChildMessage', 'Add your child\'s information to get started')}</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddChild}>
            <Ionicons name="add-circle-outline" size={24} color={COLORS.white} />
            <Text style={styles.addButtonText}>{t('profile.addChild', 'Add Child')}</Text>
          </TouchableOpacity>
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
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.primary} />
              <Text style={styles.editButtonText}>{t('profile.editProfile', 'Edit Profile')}</Text>
            </TouchableOpacity>
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

        {/* Account Section */}
        <Card style={styles.sectionCard}>
          <SectionTitle 
            title={t('profile.account', 'Account')} 
            icon="person-outline"
            iconColor={COLORS.info}
          />
          {user && (
            <View style={styles.singleInfo}>
              <Text style={styles.infoLabel}>{t('profile.signedInAs', 'Signed in as')}</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
              {user.name && (
                <Text style={styles.userName}>{user.name}</Text>
              )}
            </View>
          )}
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.logoutText}>{t('auth.logout', 'Sign Out')}</Text>
          </TouchableOpacity>
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
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  emptyState: {
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
    marginTop: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  addButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.white,
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  editButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.primary,
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
  userName: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  logoutText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.error,
    marginLeft: SPACING.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
});

export default ProfileScreen;
