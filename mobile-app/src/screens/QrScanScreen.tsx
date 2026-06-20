/**
 * QR Scan Screen
 * 
 * Scans a midwife QR code and links the selected profile.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Header, Button } from '../components/common';
import { useChildStore, usePregnancyStore, useThemeStore } from '../stores';
import { midwifeLinkService } from '../services/midwifeLinkService';
import { RootStackParamList } from '../types';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../constants';

const QR_PREFIX = 'mch-midwife:';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'QrScan'>;

type ParsedQrPayload = {
  code: string;
  profileType: string | null;
};

const parseQrPayload = (payload: string): ParsedQrPayload => {
  const trimmed = payload.trim();
  const withPrefix = trimmed.startsWith(QR_PREFIX)
    ? trimmed.slice(QR_PREFIX.length)
    : trimmed.includes(QR_PREFIX)
      ? trimmed.slice(trimmed.indexOf(QR_PREFIX) + QR_PREFIX.length)
      : trimmed;

  const segments = withPrefix.split(':');
  if (segments.length > 1) {
    return {
      profileType: segments[0],
      code: segments.slice(1).join(':'),
    };
  }

  return {
    profileType: null,
    code: withPrefix,
  };
};

const QrScanScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { t } = useTranslation();
  const { colors } = useThemeStore();
  const { profile, fetchChildren } = useChildStore();
  const { currentPregnancy, fetchPregnancies } = usePregnancyStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  const profileType = route.params.profileType;

  const selectedProfileId = useMemo(() => {
    if (profileType === 'pregnancy') return currentPregnancy?.id ?? null;
    return profile?.id ?? null;
  }, [profileType, currentPregnancy, profile]);

  const selectedProfileLabel = useMemo(() => {
    if (profileType === 'pregnancy') {
      const name = currentPregnancy?.motherFullName || currentPregnancy?.motherFirstName || t('pregnancy.momToBe', 'Mom-to-be');
      return `${t('pregnancy.profile', 'Pregnancy')}: ${name}`;
    }
    if (profile) {
      return `${t('child.profile', 'Child')}: ${profile.firstName} ${profile.lastName}`.trim();
    }
    return t('profile.noProfile', 'No profile selected');
  }, [profileType, currentPregnancy, profile, t]);

  const handleBarcodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (hasScanned || isProcessing || !selectedProfileId) {
      return;
    }

    setHasScanned(true);
    setIsProcessing(true);
    setScanError(null);

    try {
      const { code, profileType: scannedProfileType } = parseQrPayload(data);
      if (!code) {
        throw new Error(t('qr.invalidCode', 'Invalid QR code.'));
      }

      await midwifeLinkService.claimMidwifeLink({
        code,
        profileType: profileType === 'pregnancy' ? 'pregnancy' : 'child',
        profileId: selectedProfileId,
      });

      await Promise.all([fetchChildren(), fetchPregnancies()]);

      const successTitle = scannedProfileType === 'any'
        ? t('qr.scannedTitle', 'Scanned Successfully')
        : t('qr.registeredTitle', 'Registered successfully');

      Alert.alert(
        successTitle,
        '',
        [{
          text: t('common.ok', 'OK'),
          onPress: () =>
            navigation.reset({
              index: 0,
              routes: [{ name: profileType === 'pregnancy' ? 'PregnancyMain' : 'Main' }],
            }),
        }]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : t('qr.linkFailed', 'Failed to link midwife.');
      setScanError(message);
      setHasScanned(false);
      Alert.alert(
        t('qr.linkFailedTitle', 'Unable to Link'),
        message,
        [{ text: t('common.ok', 'OK') }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const canScan = Boolean(selectedProfileId);

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <Header title={t('qr.title', 'Scan QR Code')} showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <Header title={t('qr.title', 'Scan QR Code')} showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.gray[400]} />
          <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}> 
            {t('qr.permissionTitle', 'Camera access needed')}
          </Text>
          <Text style={[styles.permissionText, { color: colors.textSecondary }]}> 
            {t('qr.permissionMessage', 'Allow camera access to scan the midwife QR code.')}
          </Text>
          <Button
            title={t('qr.allowCamera', 'Allow Camera')}
            onPress={requestPermission}
            icon="camera-outline"
            style={{ marginTop: SPACING.md }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t('qr.title', 'Scan QR Code')} showBack onBackPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={[styles.profileLabel, { color: colors.textSecondary }]}>{selectedProfileLabel}</Text>

        <View style={[styles.cameraContainer, { borderColor: colors.gray[200] }]}> 
          {canScan ? (
            <CameraView
              style={styles.camera}
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
          ) : (
            <View style={styles.centered}>
              <Ionicons name="warning-outline" size={48} color={colors.gray[400]} />
              <Text style={[styles.permissionText, { color: colors.textSecondary }]}> 
                {profileType === 'pregnancy'
                  ? t('qr.noPregnancyProfile', 'Create a pregnancy profile to link a midwife.')
                  : t('qr.noChildProfile', 'Create a child profile to link a midwife.')}
              </Text>
            </View>
          )}
          <View pointerEvents="none" style={styles.overlay}>
            <View style={[styles.focusFrame, { borderColor: colors.primary }]} />
          </View>
        </View>

        {isProcessing && (
          <View style={styles.processingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.processingText, { color: colors.textSecondary }]}> 
              {t('qr.linking', 'Linking midwife...')}
            </Text>
          </View>
        )}

        {scanError && (
          <Text style={[styles.errorText, { color: colors.error }]}>{scanError}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  profileLabel: {
    textAlign: 'center',
    fontSize: FONT_SIZE.sm,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusFrame: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  permissionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  processingText: {
    fontSize: FONT_SIZE.sm,
  },
  errorText: {
    textAlign: 'center',
    fontSize: FONT_SIZE.sm,
  },
});

export default QrScanScreen;
