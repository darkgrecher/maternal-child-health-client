/**
 * SectionTitle Component
 * 
 * Section header with optional action button.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../constants';

type IconName = keyof typeof Ionicons.glyphMap;

interface SectionTitleProps {
  title: string;
  icon?: IconName;
  iconColor?: string;
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
  actionText,
  onActionPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleRow}>
        {icon && (
          <Ionicons name={icon} size={20} color={iconColor} style={styles.icon} />
        )}
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
