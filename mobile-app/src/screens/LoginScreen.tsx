/**
 * Login Screen
 * 
 * Google Sign-In authentication screen with animated baby video.
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGoogleAuth } from '../services/authService';
import { useAuthStore } from '../stores';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const { request, response, promptAsync, isReady, redirectUri } = useGoogleAuth();
  const authStore = useAuthStore();
  const { status, error } = authStore;

  const isLoading = status === 'loading';
  
  // Video player for animated baby
  const videoSource = require('../../assets/Seamless_Video_Loop_Creation.mp4');
  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.play();
    player.muted = true;
  });

  // Handle authentication with backend
  const handleGoogleSignIn = useCallback(async (params: { idToken?: string; code?: string; redirectUri?: string }) => {
    try {
      await authStore.signInWithGoogle(params.idToken || '', params.code, params.redirectUri);
    } catch (err) {
      console.log('Sign in error:', err);
      const message = err instanceof Error ? err.message : 'Authentication failed';
      Alert.alert('Sign In Error', message);
    }
  }, [authStore]);

  // Handle Google Sign-In response
  useEffect(() => {
    if (response?.type === 'success') {
      console.log('✅ OAuth Success! Response:', JSON.stringify(response, null, 2));
      
      // useAuthRequest returns authorization code in response.params
      const code = response.params?.code;
      
      if (code) {
        console.log('Got authorization code, sending to backend...');
        handleGoogleSignIn({ code, redirectUri });
      } else {
        console.log('❌ No authorization code in response');
        authStore.setError('No authorization code received from Google');
      }
    } else if (response?.type === 'error') {
      console.log('❌ OAuth Error:', response.error);
      authStore.setError(`Google Sign-In failed: ${response.error?.message || 'Unknown error'}`);
    }
  }, [response, redirectUri, handleGoogleSignIn, authStore]);

  // Handle sign in button press
  const handleSignInPress = useCallback(async () => {
    if (!isReady) {
      Alert.alert('Not Ready', 'Please wait while we prepare sign-in...');
      return;
    }
    
    authStore.setError(null);
    await promptAsync();
  }, [isReady, promptAsync, authStore]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('app.name', 'Maternal & Child Health')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.subtitle', 'Welcome back!')}
          </Text>
        </View>

        {/* Animated Baby Video */}
        <View style={styles.videoContainer}>
          <View style={styles.videoWrapper}>
            <VideoView
              style={styles.video}
              player={player}
              contentFit="cover"
              nativeControls={false}
            />
          </View>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem 
            icon="shield-checkmark" 
            text={t('auth.features.vaccines', 'Track vaccinations')} 
          />
          <FeatureItem 
            icon="trending-up" 
            text={t('auth.features.growth', 'Monitor growth')} 
          />
          <FeatureItem 
            icon="calendar" 
            text={t('auth.features.schedule', 'Manage appointments')} 
          />
          <FeatureItem 
            icon="sync" 
            text={t('auth.features.sync', 'Sync across devices')} 
          />
        </View>

        {/* Sign In Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
            onPress={handleSignInPress}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.textPrimary} />
            ) : (
              <>
                <Image
                  source={{ uri: 'https://www.google.com/favicon.ico' }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>
                  {t('auth.signInWithGoogle', 'Sign in with Google')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          {t('auth.terms', 'By signing in, you agree to our Terms of Service and Privacy Policy')}
        </Text>
      </View>
    </SafeAreaView>
  );
};

/**
 * Feature item component
 */
interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <Ionicons name={icon} size={24} color={COLORS.primary} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
  videoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  videoWrapper: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoGlow: {
    display: 'none',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  features: {
    marginBottom: SPACING.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  featureText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
  },
  buttonContainer: {
    marginBottom: SPACING.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: SPACING.md,
  },
  googleButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  terms: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
});
