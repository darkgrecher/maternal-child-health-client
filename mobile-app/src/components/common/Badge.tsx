/**
 * Badge Component
 * 
 * Small badge for displaying status indicators.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../constants';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default' | 'primary';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: '#E8F5E9', text: '#2E7D32' },
  warning: { bg: '#FFF3E0', text: '#E65100' },
  error: { bg: '#FFEBEE', text: '#C62828' },
  info: { bg: '#E3F2FD', text: '#1565C0' },
  default: { bg: COLORS.gray[100], text: COLORS.gray[700] },
  primary: { bg: COLORS.primaryLight, text: COLORS.primary },
};

/**
 * Badge component for status display
 */
export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'default',
  size = 'medium',
  style,
}) => {
  const colors = variantColors[variant];

  return (
    <View
      style={[
        styles.base,
        styles[size],
        { backgroundColor: colors.bg },
        style,
      ]}
    >
      <Text style={[styles.text, styles[`text_${size}`], { color: colors.text }]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.round,
    alignSelf: 'flex-start',
  },
  small: {
    paddingVertical: 2,
    paddingHorizontal: SPACING.sm,
  },
  medium: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  text: {
    fontWeight: FONT_WEIGHT.semibold,
  },
  text_small: {
    fontSize: FONT_SIZE.xs,
  },
  text_medium: {
    fontSize: FONT_SIZE.sm,
  },
});

export default Badge;
