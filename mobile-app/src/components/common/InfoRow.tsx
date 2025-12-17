/**
 * InfoRow Component
 * 
 * Horizontal row for displaying label-value pairs.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../constants';

type IconName = keyof typeof Ionicons.glyphMap;

interface InfoRowProps {
  label: string;
  value: string | React.ReactNode;
  icon?: IconName;
  iconColor?: string;
  style?: ViewStyle;
  valueColor?: string;
  bold?: boolean;
}

/**
 * Info row for label-value display
 */
export const InfoRow: React.FC<InfoRowProps> = ({
  label,
  value,
  icon,
  iconColor = COLORS.primary,
  style,
  valueColor,
  bold = false,
}) => {
  return (
    <View style={[styles.container, style]}>
      {icon && (
        <Ionicons name={icon} size={18} color={iconColor} style={styles.icon} />
      )}
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        {typeof value === 'string' ? (
          <Text style={[
            styles.value, 
            valueColor && { color: valueColor },
            bold && styles.bold,
          ]}>
            {value}
          </Text>
        ) : (
          value
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
  },
  icon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  bold: {
    fontWeight: FONT_WEIGHT.semibold,
  },
});

export default InfoRow;
