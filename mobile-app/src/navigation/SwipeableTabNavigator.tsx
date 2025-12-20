/**
 * Swipeable Tab Navigator
 * 
 * Wraps tab screens with swipe gesture support to navigate between tabs.
 * Uses PanResponder to detect horizontal swipes and change tabs accordingly.
 */

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25; // 25% of screen width
const SWIPE_VELOCITY_THRESHOLD = 0.3;

interface SwipeableTabNavigatorProps {
  children: React.ReactNode;
}

// Tab order for navigation
const TAB_ORDER: (keyof TabParamList)[] = ['Home', 'Vaccines', 'Growth', 'Feeding', 'Schedule'];

export const SwipeableTabNavigator: React.FC<SwipeableTabNavigatorProps> = ({ children }) => {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const route = useRoute();
  const swipeAnim = useRef(new Animated.Value(0)).current;

  // Get current tab index
  const getCurrentTabIndex = (): number => {
    return TAB_ORDER.indexOf(route.name as keyof TabParamList);
  };

  // Navigate to next tab
  const navigateToTab = (direction: 'next' | 'prev') => {
    const currentIndex = getCurrentTabIndex();
    if (currentIndex === -1) return;

    let targetIndex: number;
    if (direction === 'next') {
      targetIndex = currentIndex + 1;
      if (targetIndex >= TAB_ORDER.length) return; // Already at last tab
    } else {
      targetIndex = currentIndex - 1;
      if (targetIndex < 0) return; // Already at first tab
    }

    const targetTab = TAB_ORDER[targetIndex];
    navigation.navigate(targetTab);
  };

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
      },
      onPanResponderGrant: () => {
        // Gesture started
      },
      onPanResponderMove: (_, gestureState) => {
        // Update animation value based on swipe distance
        const { dx } = gestureState;
        const currentIndex = getCurrentTabIndex();
        
        // Prevent swiping beyond boundaries
        if ((currentIndex === 0 && dx > 0) || (currentIndex === TAB_ORDER.length - 1 && dx < 0)) {
          // At boundary, apply resistance
          swipeAnim.setValue(dx * 0.2);
        } else {
          swipeAnim.setValue(dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        const currentIndex = getCurrentTabIndex();
        
        // Determine if swipe should trigger navigation
        let shouldNavigate = false;
        let direction: 'next' | 'prev' | null = null;

        if (dx > SWIPE_THRESHOLD || vx > SWIPE_VELOCITY_THRESHOLD) {
          // Swipe right - go to previous tab
          if (currentIndex > 0) {
            shouldNavigate = true;
            direction = 'prev';
          }
        } else if (dx < -SWIPE_THRESHOLD || vx < -SWIPE_VELOCITY_THRESHOLD) {
          // Swipe left - go to next tab
          if (currentIndex < TAB_ORDER.length - 1) {
            shouldNavigate = true;
            direction = 'next';
          }
        }

        // Animate back to center
        Animated.spring(swipeAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start(() => {
          if (shouldNavigate && direction) {
            navigateToTab(direction);
          }
        });
      },
      onPanResponderTerminate: () => {
        // Reset animation
        Animated.spring(swipeAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Reset animation when route changes
  useEffect(() => {
    swipeAnim.setValue(0);
  }, [route.name]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: swipeAnim }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SwipeableTabNavigator;
