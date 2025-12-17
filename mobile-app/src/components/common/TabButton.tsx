/**
 * TabButton Component
 * 
 * Toggle button group for tab-like selection.
 * Can be used as a group (with options) or as individual buttons.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../constants';

interface TabOption {
  key: string;
  label: string;
}

// Props for group mode
interface TabButtonGroupProps {
  options: TabOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
  style?: ViewStyle;
}

// Props for single button mode
interface TabButtonSingleProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  count?: number;
  style?: ViewStyle;
}

type TabButtonProps = TabButtonGroupProps | TabButtonSingleProps;

// Type guard to determine which mode
const isSingleMode = (props: TabButtonProps): props is TabButtonSingleProps => {
  return 'label' in props && 'isActive' in props;
};

/**
 * Tab button - can be used as group or single button
 */
export const TabButton: React.FC<TabButtonProps> = (props) => {
  // Single button mode
  if (isSingleMode(props)) {
    const { label, isActive, onPress, count, style } = props;
    return (
      <TouchableOpacity
        style={[
          styles.singleTab,
          isActive && styles.singleTabActive,
          style,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={[styles.singleTabText, isActive && styles.singleTabTextActive]}>
          {label}
        </Text>
        {count !== undefined && (
          <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
            <Text style={[styles.countText, isActive && styles.countTextActive]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Group mode
  const { options, selectedKey, onSelect, style } = props;
  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const isSelected = option.key === selectedKey;
        return (
          <TouchableOpacity
            key={option.key}
            style={[styles.tab, isSelected && styles.tabSelected]}
            onPress={() => onSelect(option.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  // Group mode styles
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[100],
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSelected: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },
  tabTextSelected: {
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.semibold,
  },

  // Single button mode styles
  singleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.gray[100],
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
  },
  singleTabActive: {
    backgroundColor: COLORS.textPrimary,
  },
  singleTabText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },
  singleTabTextActive: {
    color: COLORS.white,
  },
  countBadge: {
    backgroundColor: COLORS.gray[300],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeActive: {
    backgroundColor: COLORS.white + '30',
  },
  countText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  countTextActive: {
    color: COLORS.white,
  },
});

export default TabButton;
