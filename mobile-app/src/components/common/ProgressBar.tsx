/**
 * ProgressBar Component
 * 
 * Horizontal progress bar for displaying completion percentages.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../constants';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  showLabel?: boolean;
  labelPosition?: 'inside' | 'right' | 'top';
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

/**
 * Progress bar for showing completion status
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  showLabel = false,
  labelPosition = 'right',
  color = COLORS.primary,
  backgroundColor = COLORS.gray[200],
  style,
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View style={[styles.container, style]}>
      {showLabel && labelPosition === 'top' && (
        <Text style={styles.labelTop}>{Math.round(clampedProgress)}%</Text>
      )}
      
      <View style={styles.row}>
        <View style={[styles.track, { height, backgroundColor }]}>
          <View
            style={[
              styles.fill,
              {
                width: `${clampedProgress}%`,
                height,
                backgroundColor: color,
              },
            ]}
          >
            {showLabel && labelPosition === 'inside' && clampedProgress > 15 && (
              <Text style={styles.labelInside}>{Math.round(clampedProgress)}%</Text>
            )}
          </View>
        </View>
        
        {showLabel && labelPosition === 'right' && (
          <Text style={[styles.labelRight, { color }]}>{Math.round(clampedProgress)}%</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  track: {
    flex: 1,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: BORDER_RADIUS.round,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: SPACING.xs,
  },
  labelInside: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.white,
  },
  labelRight: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  labelTop: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
});

export default ProgressBar;
