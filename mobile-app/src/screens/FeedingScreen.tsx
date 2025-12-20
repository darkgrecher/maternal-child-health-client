/**
 * Feeding Screen
 * 
 * Displays feeding guidelines based on child's age,
 * nutrition tips, and supplement information.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card, Header, SectionTitle, Badge, Button, FloatingChatButton } from '../components/common';
import { SwipeableTabNavigator } from '../navigation/SwipeableTabNavigator';
import { useChildStore, useThemeStore } from '../stores';
import { RootStackParamList, TabParamList } from '../types';
import { FEEDING_GUIDELINES } from '../constants';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';

type FeedingScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Feeding'>,
  NativeStackNavigationProp<RootStackParamList>
>;

/**
 * Age Range Selector Component
 */
const AgeSelector: React.FC<{
  options: string[];
  selected: string;
  onSelect: (key: string) => void;
}> = ({ options, selected, onSelect }) => {
  return (
    <View style={styles.ageSelectorContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.ageSelectorButton,
            selected === option && styles.ageSelectorButtonActive,
          ]}
          onPress={() => onSelect(option)}
        >
          <Text style={[
            styles.ageSelectorText,
            selected === option && styles.ageSelectorTextActive,
          ]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

/**
 * Tip Item Component
 */
const TipItem: React.FC<{ index: number; text: string }> = ({ index, text }) => {
  const { colors } = useThemeStore();
  return (
    <View style={styles.tipItem}>
      <View style={[styles.tipNumber, { backgroundColor: colors.primary }]}>
        <Text style={styles.tipNumberText}>{index}</Text>
      </View>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
};

/**
 * Illness Feeding Item Component
 */
const IllnessItem: React.FC<{ text: string }> = ({ text }) => {
  const { colors } = useThemeStore();
  return (
    <View style={styles.illnessItem}>
      <View style={styles.illnessBullet}>
        <Ionicons name="ellipse" size={8} color={colors.error} />
      </View>
      <Text style={styles.illnessText}>{text}</Text>
    </View>
  );
};

/**
 * Feeding Screen Component
 */
const FeedingScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<FeedingScreenNavigationProp>();
  const { getChildAgeInMonths } = useChildStore();
  const { colors } = useThemeStore();
  const childAge = getChildAgeInMonths();
  
  // Determine default age range based on child's age
  const getDefaultAgeRange = () => {
    if (childAge < 9) return '6-8 months';
    if (childAge < 12) return '9-11 months';
    return '12-23 months';
  };

  const [selectedAge, setSelectedAge] = useState(getDefaultAgeRange());

  const ageOptions = ['6-8 months', '9-11 months', '12-23 months'];

  // Get feeding guideline for selected age
  const getFeedingGuideline = () => {
    const guidelineMap: { [key: string]: string } = {
      '6-8 months': 'feeding_6_8',
      '9-11 months': 'feeding_9_11',
      '12-23 months': 'feeding_12_23',
    };
    return FEEDING_GUIDELINES.find(g => g.id === guidelineMap[selectedAge]);
  };

  const guideline = getFeedingGuideline();

  if (!guideline) {
    return (
      <SwipeableTabNavigator>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Header 
            title={t('feeding.title')} 
            subtitle={t('feeding.subtitle')}
            icon="restaurant-outline"
            iconColor={colors.warning}
          />
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('common.noData')}</Text>
          </View>
        </View>
      </SwipeableTabNavigator>
    );
  }

  return (
    <SwipeableTabNavigator>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header 
        title={t('feeding.title')} 
        subtitle={t('feeding.subtitle')}
        icon="restaurant-outline"
        iconColor={colors.warning}
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
        {/* Banner Image */}
        <Card style={styles.bannerCard} padding="none">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400&h=150&fit=crop' }}
            style={styles.bannerImage}
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>Healthy Family Nutrition</Text>
          </View>
        </Card>

        {/* Age Selector */}
        <Card style={styles.ageSelectorCard}>
          <Text style={styles.ageSelectorTitle}>{t('feeding.selectAge')}</Text>
          <AgeSelector 
            options={ageOptions}
            selected={selectedAge}
            onSelect={setSelectedAge}
          />
        </Card>

        {/* Main Guidelines Card */}
        <Card style={styles.guidelineCard}>
          <View style={styles.guidelineHeader}>
            <Ionicons name="time-outline" size={20} color={colors.info} />
            <Text style={styles.guidelineHeaderText}>
              {guideline.ageRange.label}
            </Text>
          </View>

          {/* Texture */}
          <View style={styles.guidelineSection}>
            <View style={styles.guidelineSectionHeader}>
              <Ionicons name="grid-outline" size={16} color={colors.primary} />
              <Text style={styles.guidelineSectionTitle}>{t('feeding.texture')}</Text>
            </View>
            <Text style={styles.guidelineText}>{guideline.texture}</Text>
          </View>

          {/* Frequency */}
          <View style={styles.guidelineSection}>
            <View style={styles.guidelineSectionHeader}>
              <Ionicons name="repeat-outline" size={16} color={colors.success} />
              <Text style={styles.guidelineSectionTitle}>{t('feeding.frequency')}</Text>
            </View>
            <Text style={styles.guidelineText}>{guideline.frequency}</Text>
          </View>

          {/* Amount */}
          <View style={styles.guidelineSection}>
            <View style={styles.guidelineSectionHeader}>
              <Ionicons name="restaurant-outline" size={16} color={colors.warning} />
              <Text style={styles.guidelineSectionTitle}>{t('feeding.amountPerMeal')}</Text>
            </View>
            <Text style={styles.guidelineText}>{guideline.amountPerMeal}</Text>
          </View>
        </Card>

        {/* Tips Card */}
        <Card style={styles.tipsCard}>
          <SectionTitle 
            title={t('feeding.tipsTitle')} 
            icon="heart-outline"
            iconColor={colors.error}
          />
          
          {guideline.tips.map((tip, index) => (
            <TipItem key={index} index={index + 1} text={tip} />
          ))}

          <View style={styles.feedingTipBox}>
            <Text style={styles.feedingTipText}>{t('feeding.feedingTip')}</Text>
          </View>
        </Card>

        {/* Illness Feeding Card */}
        <Card style={styles.illnessCard}>
          <SectionTitle 
            title={t('feeding.illnessTitle')} 
            icon="alert-circle-outline"
            iconColor={colors.warning}
          />
          
          <Text style={styles.illnessDescription}>
            {t('feeding.illnessDescription')}
          </Text>
          
          {guideline.illnessFeeding.map((item, index) => (
            <IllnessItem key={index} text={item} />
          ))}
        </Card>

        {/* Thriposha Supplementation Card */}
        <Card style={[styles.supplementCard, { backgroundColor: colors.primary + '10' }]}>
          <View style={styles.supplementHeader}>
            <View style={[styles.supplementIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="nutrition-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.supplementTitleContainer}>
              <Text style={styles.supplementTitle}>{t('feeding.supplementTitle')}</Text>
              <View style={styles.supplementStatus}>
                <Text style={styles.supplementStatusLabel}>
                  {t('feeding.eligibilityStatus')}
                </Text>
                <Badge 
                  text={t('feeding.eligible')}
                  variant="success"
                  size="small"
                />
              </View>
            </View>
          </View>
          
          <Text style={styles.supplementDescription}>
            {t('feeding.supplementDescription')}
          </Text>
          
          <Button
            title={t('feeding.viewDistributionSchedule')}
            variant="primary"
            onPress={() => {
              // TODO: Navigate to distribution schedule
            }}
          />
        </Card>

        {/* Bottom spacing */}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
      
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },

  // Banner
  bannerCard: {
    height: 100,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bannerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },

  // Age Selector
  ageSelectorCard: {
    marginTop: SPACING.sm,
  },
  ageSelectorTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  ageSelectorContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  ageSelectorButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
  },
  ageSelectorButtonActive: {
    backgroundColor: COLORS.textPrimary,
  },
  ageSelectorText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },
  ageSelectorTextActive: {
    color: COLORS.white,
  },

  // Guideline Card
  guidelineCard: {
    marginTop: SPACING.sm,
  },
  guidelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  guidelineHeaderText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.info,
  },
  guidelineSection: {
    marginBottom: SPACING.md,
  },
  guidelineSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  guidelineSectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  guidelineText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginLeft: SPACING.lg,
  },

  // Tips Card
  tipsCard: {
    marginTop: SPACING.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    // backgroundColor applied dynamically via inline styles
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  tipNumberText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  tipText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  feedingTipBox: {
    backgroundColor: COLORS.warning + '20',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  feedingTipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // Illness Card
  illnessCard: {
    marginTop: SPACING.sm,
  },
  illnessDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  illnessItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  illnessBullet: {
    marginRight: SPACING.sm,
    marginTop: 6,
  },
  illnessText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },

  // Supplement Card
  supplementCard: {
    marginTop: SPACING.sm,
    // backgroundColor applied dynamically via inline styles
  },
  supplementHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  supplementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // backgroundColor applied dynamically via inline styles
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  supplementTitleContainer: {
    flex: 1,
  },
  supplementTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  supplementStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  supplementStatusLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  supplementDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
});

export default FeedingScreen;
