/**
 * Button Component
 * 
 * Reusable button with multiple variants and states.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../constants';
import { useThemeStore } from '../../stores';

type IconName = keyof typeof Ionicons.glyphMap;

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Button component with multiple variants
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) => {
  const { colors } = useThemeStore();
  
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.primary };
      case 'secondary':
        return { backgroundColor: colors.secondary };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'danger':
        return { backgroundColor: colors.error };
      default:
        return { backgroundColor: colors.primary };
    }
  };
  
  const getTextColor = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return colors.primary;
      default:
        return colors.white;
    }
  };

  const buttonStyles = [
    styles.base,
    getVariantStyle(),
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    { color: getTextColor() },
    styles[`textSize_${size}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;
  const iconColor = variant === 'primary' || variant === 'danger' 
    ? colors.white 
    : variant === 'secondary' 
      ? colors.white 
      : colors.primary;

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white} 
        />
      );
    }

    return (
      <View style={styles.content}>
        {icon && iconPosition === 'left' && (
          <Ionicons name={icon} size={iconSize} color={iconColor} style={styles.iconLeft} />
        )}
        <Text style={textStyles}>{title}</Text>
        {icon && iconPosition === 'right' && (
          <Ionicons name={icon} size={iconSize} color={iconColor} style={styles.iconRight} />
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Sizes
  size_small: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    minHeight: 32,
  },
  size_medium: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    minHeight: 44,
  },
  size_large: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    minHeight: 52,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
  
  // Text styles
  text: {
    fontWeight: FONT_WEIGHT.semibold,
  },
  textDisabled: {
    opacity: 0.7,
  },
  
  // Text sizes
  textSize_small: {
    fontSize: FONT_SIZE.sm,
  },
  textSize_medium: {
    fontSize: FONT_SIZE.md,
  },
  textSize_large: {
    fontSize: FONT_SIZE.lg,
  },
  
  // Icon spacing
  iconLeft: {
    marginRight: SPACING.xs,
  },
  iconRight: {
    marginLeft: SPACING.xs,
  },
});

export default Button;
