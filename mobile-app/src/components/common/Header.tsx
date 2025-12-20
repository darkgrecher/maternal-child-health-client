/**
 * Header Component
 * 
 * Screen header with title, subtitle, and optional actions.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, FONT_SIZE, FONT_WEIGHT } from '../../constants';
import { useThemeStore } from '../../stores';

type IconName = keyof typeof Ionicons.glyphMap;

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightIcon?: IconName;
  onRightPress?: () => void;
  rightText?: string;
  icon?: IconName;
  iconColor?: string;
  transparent?: boolean;
  // Support for multiple right icons (notification, settings, profile)
  secondaryRightIcon?: IconName;
  onSecondaryRightPress?: () => void;
  tertiaryRightIcon?: IconName;
  onTertiaryRightPress?: () => void;
}

/**
 * Header component for screen titles
 */
export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  showBackButton = false,
  onBackPress,
  rightIcon,
  onRightPress,
  rightText,
  icon,
  iconColor,
  transparent = false,
  secondaryRightIcon,
  onSecondaryRightPress,
  tertiaryRightIcon,
  onTertiaryRightPress,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  
  // Use provided iconColor or default to theme primary
  const effectiveIconColor = iconColor || colors.primary;
  const showBackArrow = showBack || showBackButton;

  return (
    <View style={[
      styles.container,
      { paddingTop: insets.top + SPACING.sm, backgroundColor: colors.background },
      transparent && styles.transparent,
    ]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.content}>
        {/* Left side - Back button or spacer */}
        <View style={styles.leftSection}>
          {showBackArrow && (
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center - Title and subtitle */}
        <View style={styles.centerSection}>
          <View style={styles.titleRow}>
            {icon && (
              <View style={[styles.iconContainer, { backgroundColor: effectiveIconColor + '20' }]}>
                <Ionicons name={icon} size={20} color={effectiveIconColor} />
              </View>
            )}
            <View>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>
              {subtitle && (
                <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>{subtitle}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Right side - Action buttons */}
        <View style={styles.rightSection}>
          <View style={styles.rightButtonsContainer}>
            {tertiaryRightIcon && (
              <TouchableOpacity onPress={onTertiaryRightPress} style={styles.rightButton}>
                <Ionicons name={tertiaryRightIcon} size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
            {secondaryRightIcon && (
              <TouchableOpacity onPress={onSecondaryRightPress} style={styles.rightButton}>
                <Ionicons name={secondaryRightIcon} size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
            {(rightIcon || rightText) && (
              <TouchableOpacity onPress={onRightPress} style={styles.rightButton}>
                {rightIcon && (
                  <Ionicons name={rightIcon} size={24} color={colors.textPrimary} />
                )}
                {rightText && (
                  <Text style={[styles.rightText, { color: colors.primary }]}>{rightText}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  rightButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
  },
  backButton: {
    padding: SPACING.xs,
  },
  rightButton: {
    padding: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  rightText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
});

export default Header;
