/**
 * Convert To Child Modal Component
 * 
 * A beautiful animated modal that appears when pregnancy due date has passed,
 * prompting the mother to create a new child profile.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../constants';
import { useThemeStore } from '../../stores';
import { Button } from './Button';

// Animation video
const CELEBRATION_VIDEO = require('../../../assets/Seamless_Video_Loop_Creation.mp4');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConvertToChildModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateChildProfile: () => void;
  motherName?: string;
  dueDate?: string;
}

/**
 * ConvertToChildModal Component
 */
export const ConvertToChildModal: React.FC<ConvertToChildModalProps> = ({
  visible,
  onClose,
  onCreateChildProfile,
  motherName,
  dueDate,
}) => {
  const { t } = useTranslation();
  const { colors } = useThemeStore();
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Reset animation values
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      slideAnim.setValue(50);

      // Start entrance animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    // Exit animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleCreateProfile = () => {
    // Exit animation then navigate
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onCreateChildProfile();
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: opacityAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <View style={[styles.closeButtonInner, { backgroundColor: colors.gray[100] }]}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </View>
          </TouchableOpacity>

          {/* Video Container */}
          <View style={styles.videoContainer}>
            <Video
              source={CELEBRATION_VIDEO}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              isLooping
              isMuted
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {t('pregnancy.congratulations', 'Congratulations!')} 🎉
            </Text>

            {/* Message */}
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {motherName 
                ? t('pregnancy.dueDatePassedPersonal', { name: motherName })
                : t('pregnancy.dueDatePassed', 'Your due date has arrived! We hope you\'re welcoming your little one soon.')}
            </Text>

            {/* Subtitle */}
            <Text style={[styles.subtitle, { color: colors.textPrimary }]}>
              {t('pregnancy.readyToCreateChild', 'Ready to start tracking your baby\'s growth?')}
            </Text>

            {/* Due Date Info */}
            {dueDate && (
              <View style={[styles.dueDateBadge, { backgroundColor: colors.secondaryLight }]}>
                <Ionicons name="calendar" size={16} color={colors.secondary} />
                <Text style={[styles.dueDateText, { color: colors.secondary }]}>
                  {t('pregnancy.dueDate', 'Due Date')}: {new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.secondary }]}
                onPress={handleCreateProfile}
                activeOpacity={0.8}
              >
                <Ionicons name="person-add" size={20} color={colors.white} />
                <Text style={styles.primaryButtonText}>
                  {t('pregnancy.createChildProfile', 'Create Child Profile')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.gray[300] }]}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                  {t('pregnancy.maybeLater', 'Maybe Later')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Hint text */}
            <Text style={[styles.hintText, { color: colors.gray[400] }]}>
              {t('pregnancy.canCreateLater', 'You can always create a child profile from Settings later.')}
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContainer: {
    width: SCREEN_WIDTH - SPACING.lg * 2,
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: '100%',
    height: 120,
    paddingTop: SPACING.md,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: SPACING.xl,
    paddingTop: SPACING.sm,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
    marginTop: 0,
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  dueDateText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  buttonContainer: {
    width: '100%',
    gap: SPACING.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  hintText: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});

export default ConvertToChildModal;
