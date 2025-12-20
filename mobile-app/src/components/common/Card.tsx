/**
 * Card Component
 * 
 * Reusable card container with consistent styling.
 * Used throughout the app for grouping related content.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  StyleProp,
} from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../../constants';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

/**
 * Card component for consistent content grouping
 */
export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 'medium',
}) => {
  const cardStyle = [
    styles.base,
    styles[variant],
    styles[`padding_${padding}`],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginVertical: SPACING.xs,
  },
  
  // Variants
  default: {
    backgroundColor: COLORS.white,
  },
  outlined: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  elevated: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Padding variants
  padding_none: {
    padding: 0,
  },
  padding_small: {
    padding: SPACING.sm,
  },
  padding_medium: {
    padding: SPACING.md,
  },
  padding_large: {
    padding: SPACING.lg,
  },
});

export default Card;
