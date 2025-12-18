/**
 * Auth Screen
 * 
 * Combined Login and Sign Up screen with Auth0 integration.
 * Supports:
 * - Email/Password login
 * - Email/Password signup
 * - Google Sign-In
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth0 } from '../services/auth0Service';
import { useAuthStore } from '../stores/auth0Store';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants';

type AuthMode = 'login' | 'signup';

export const AuthScreen: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  
  const {
    isLoading: auth0Loading,
    error: auth0Error,
    isReady,
    authResponse,
    loginWithEmailPassword,
    signupWithEmailPassword,
    loginWithSocial,
    loginWithUniversalLogin,
    exchangeCodeForTokens,
    getUserInfo,
    clearError,
  } = useAuth0();
  
  const { loginWithAuth0, status, error: storeError, setError } = useAuthStore();
  
  const isLoading = auth0Loading || localLoading || status === 'loading';
  const error = auth0Error || storeError;

  // Handle Auth0 response (for social login)
  useEffect(() => {
    const handleAuthResponse = async () => {
      if (authResponse?.type === 'success') {
        console.log('✅ Auth0 OAuth Success!');
        
        const code = authResponse.params?.code;
        if (code) {
          try {
            setLocalLoading(true);
            const tokens = await exchangeCodeForTokens(code);
            const user = await getUserInfo(tokens.accessToken);
            await loginWithAuth0(tokens, user);
          } catch (err) {
            console.log('Token exchange error:', err);
            const message = err instanceof Error ? err.message : 'Authentication failed';
            setError(message);
          } finally {
            setLocalLoading(false);
          }
        }
      } else if (authResponse?.type === 'error') {
        console.log('❌ Auth0 OAuth Error:', authResponse.error);
        setError(`Authentication failed: ${authResponse.error?.message || 'Unknown error'}`);
      }
    };
    
    handleAuthResponse();
  }, [authResponse, exchangeCodeForTokens, getUserInfo, loginWithAuth0, setError]);

  // Handle email/password login
  const handleEmailLogin = useCallback(async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    
    clearError();
    setLocalLoading(true);
    
    try {
      const result = await loginWithEmailPassword(email, password);
      await loginWithAuth0(result.tokens, result.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      Alert.alert('Login Error', message);
    } finally {
      setLocalLoading(false);
    }
  }, [email, password, loginWithEmailPassword, loginWithAuth0, clearError]);

  // Handle email/password signup
  const handleEmailSignup = useCallback(async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    
    clearError();
    setLocalLoading(true);
    
    try {
      await signupWithEmailPassword(email, password, name);
      Alert.alert(
        'Success', 
        'Account created! Please check your email to verify your account, then log in.',
        [{ text: 'OK', onPress: () => setMode('login') }]
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      Alert.alert('Signup Error', message);
    } finally {
      setLocalLoading(false);
    }
  }, [email, password, confirmPassword, name, signupWithEmailPassword, clearError]);

  // Handle Google login
  const handleGoogleLogin = useCallback(async () => {
    if (!isReady) {
      Alert.alert('Not Ready', 'Please wait while we prepare sign-in...');
      return;
    }
    
    clearError();
    
    try {
      await loginWithSocial('google-oauth2');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      Alert.alert('Sign In Error', message);
    }
  }, [isReady, loginWithSocial, clearError]);

  // Toggle between login and signup
  const toggleMode = useCallback(() => {
    setMode(mode === 'login' ? 'signup' : 'login');
    clearError();
    setPassword('');
    setConfirmPassword('');
  }, [mode, clearError]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="heart" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>
              {t('app.name', 'Maternal & Child Health')}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'login' 
                ? t('auth.loginSubtitle', 'Welcome back!')
                : t('auth.signupSubtitle', 'Create your account')}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name field (signup only) */}
            {mode === 'signup' && (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.namePlaceholder', 'Full Name')}
                  placeholderTextColor={COLORS.textLight}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            )}

            {/* Email field */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.emailPlaceholder', 'Email Address')}
                placeholderTextColor={COLORS.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Password field */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.passwordPlaceholder', 'Password')}
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color={COLORS.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password field (signup only) */}
            {mode === 'signup' && (
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.confirmPasswordPlaceholder', 'Confirm Password')}
                  placeholderTextColor={COLORS.textLight}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            )}

            {/* Error message */}
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Primary action button */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={mode === 'login' ? handleEmailLogin : handleEmailSignup}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {mode === 'login' 
                    ? t('auth.login', 'Log In')
                    : t('auth.signup', 'Sign Up')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle login/signup */}
            <TouchableOpacity onPress={toggleMode} disabled={isLoading}>
              <Text style={styles.toggleText}>
                {mode === 'login'
                  ? t('auth.noAccount', "Don't have an account? Sign Up")
                  : t('auth.hasAccount', 'Already have an account? Log In')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>
              {t('auth.or', 'or')}
            </Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social login */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={[styles.socialButton, isLoading && styles.buttonDisabled]}
              onPress={handleGoogleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: 'https://www.google.com/favicon.ico' }}
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>
                {t('auth.continueWithGoogle', 'Continue with Google')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            {t('auth.terms', 'By continuing, you agree to our Terms of Service and Privacy Policy')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xl,
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
  form: {
    marginBottom: SPACING.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  passwordToggle: {
    padding: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  toggleText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray[300],
  },
  dividerText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.sm,
    marginHorizontal: SPACING.md,
  },
  socialContainer: {
    marginBottom: SPACING.lg,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: SPACING.sm,
  },
  socialButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  terms: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
});

export default AuthScreen;
