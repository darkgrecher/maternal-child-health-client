/**
 * Login Page
 *
 * Authentication page using Auth0 for admin and midwives.
 * Supports Auth0 Universal Login (redirect) and displays
 * a branded login experience.
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth0 } from '@auth0/auth0-react';
import {
  Heart,
  LogIn,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../lib/stores';

export default function LoginPage() {
  const router = useRouter();
  const {
    isAuthenticated: auth0Authenticated,
    isLoading: auth0Loading,
    loginWithRedirect,
    getAccessTokenSilently,
    error: auth0Error,
  } = useAuth0();

  const { loginWithAuth0Token, isAuthenticated: backendAuthenticated, isLoading: storeLoading } = useAuthStore();
  const [error, setError] = useState('');
  const [isExchangingToken, setIsExchangingToken] = useState(false);

  /**
   * After Auth0 authenticates, exchange the Auth0 token with our backend
   */
  const exchangeToken = useCallback(async () => {
    if (!auth0Authenticated || backendAuthenticated || isExchangingToken) return;

    setIsExchangingToken(true);
    setError('');

    try {
      const auth0Token = await getAccessTokenSilently();
      await loginWithAuth0Token(auth0Token);
      router.push('/');
    } catch (err) {
      console.error('Token exchange failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to authenticate with the server. Please try again.'
      );
      setIsExchangingToken(false);
    }
  }, [auth0Authenticated, backendAuthenticated, isExchangingToken, getAccessTokenSilently, loginWithAuth0Token, router]);

  useEffect(() => {
    exchangeToken();
  }, [exchangeToken]);

  // If already fully authenticated, redirect to dashboard
  useEffect(() => {
    if (backendAuthenticated && !storeLoading) {
      router.push('/');
    }
  }, [backendAuthenticated, storeLoading, router]);

  // Handle Auth0 errors
  useEffect(() => {
    if (auth0Error) {
      setError(auth0Error.message);
    }
  }, [auth0Error]);

  const handleLogin = () => {
    setError('');
    loginWithRedirect({
      appState: { returnTo: '/login' },
    });
  };

  const handleSignup = () => {
    setError('');
    loginWithRedirect({
      appState: { returnTo: '/login' },
      authorizationParams: {
        screen_hint: 'signup',
      },
    });
  };

  const isProcessing = auth0Loading || isExchangingToken || storeLoading;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* Left Side - Branding with Image */}
        <div className="hidden md:flex md:w-5/12 bg-gradient-to-b from-pink-50/80 via-white to-purple-50/80 flex-col items-center justify-center p-8 relative">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">MidwifeHub</h1>
          </div>

          <Image
            src="/midwife.png"
            alt="Midwife"
            width={280}
            height={420}
            className="object-contain max-h-[50vh]"
            priority
          />

          <h2 className="text-lg font-bold text-center mt-4">
            <span className="text-slate-700">Empowering Healthcare</span><br />
            <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent text-base">
              One Family at a Time
            </span>
          </h2>

          <p className="text-slate-400 text-xs mt-4">&copy; 2026 Ministry of Health, Sri Lanka</p>
        </div>

        {/* Right Side - Login */}
        <div className="w-full md:w-7/12 flex items-center justify-center p-8 sm:p-10 bg-white dark:bg-slate-800">
          <div className="w-full max-w-sm">
            {/* Mobile Logo */}
            <div className="md:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">MidwifeHub</h1>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
              <p className="text-slate-500 mt-2 text-sm">Sign in to continue to your dashboard</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Processing state - exchanging token with backend */}
            {isProcessing && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" />
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {auth0Loading
                    ? 'Checking authentication...'
                    : isExchangingToken
                    ? 'Signing you in...'
                    : 'Loading...'}
                </p>
              </div>
            )}

            {/* Login Buttons - shown when not processing */}
            {!isProcessing && (
              <div className="space-y-4">
                {/* Auth0 Login Button */}
                <button
                  onClick={handleLogin}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white dark:bg-slate-800 px-3 text-slate-400">or</span>
                  </div>
                </div>

                {/* Sign Up Button */}
                <button
                  onClick={handleSignup}
                  className="w-full py-3.5 px-4 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 hover:border-pink-300 dark:hover:border-pink-500 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Create Account</span>
                </button>

                {/* Info */}
                <p className="text-center text-xs text-slate-400 mt-6">
                  Secure authentication powered by Auth0.
                  <br />
                  Supports email/password and social login.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
