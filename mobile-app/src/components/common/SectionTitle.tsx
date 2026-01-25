/**
 * SectionTitle Component
 * 
 * Section header with optional action button.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, Image, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../constants';

type IconName = keyof typeof Ionicons.glyphMap;

// Custom app icon image
const APP_ICON = require('../../../assets/ChatGPT Image Jan 25, 2026, 05_05_58 PM.png');

interface SectionTitleProps {
  title: string;
  icon?: IconName;
  iconColor?: string;
  useAppIcon?: boolean; // Use custom app icon instead of Ionicons
  actionText?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

/**
 * Section title with icon and optional action
 */
export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  icon,
  iconColor = COLORS.primary,
  useAppIcon = false,
  actionText,
  onActionPress,
  style,
}) => {
  const renderIcon = () => {
    if (useAppIcon || icon === 'heart-outline' || icon === 'heart') {
      return (
        <Image 
          source={APP_ICON} 
          style={[styles.appIcon, styles.icon]} 
          resizeMode="contain"
        />
      );
    }
    if (icon) {
      return <Ionicons name={icon} size={20} color={iconColor} style={styles.icon} />;
    }
    return null;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleRow}>
        {renderIcon()}
        <Text style={styles.title}>{title}</Text>
      </View>
      
      {actionText && onActionPress && (
        <TouchableOpacity onPress={onActionPress}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: SPACING.xs,
  },
  appIcon: {
    width: 20,
    height: 20,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  actionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },
});

export default SectionTitle;
