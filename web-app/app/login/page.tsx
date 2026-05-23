/**
 * Login Page
 *
 * Authentication page for midwives using email/password.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Heart,
  LogIn,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../lib/stores';

export default function LoginPage() {
  const router = useRouter();
  const {
    loginWithCredentials,
    isAuthenticated: backendAuthenticated,
    isLoading: storeLoading,
    hasHydrated,
  } = useAuthStore();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (hasHydrated && backendAuthenticated) {
      router.push('/');
    }
  }, [backendAuthenticated, hasHydrated, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);

    try {
      await loginWithCredentials(email, password);
      router.push('/');
    } catch (err) {
      console.error('Login failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to authenticate with the server. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isProcessing = storeLoading || isSubmitting || !hasHydrated;

  return (
    <div className="min-h-screen app-shell flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex rounded-3xl shadow-2xl overflow-hidden border border-[color:var(--border)] bg-[color:var(--card-bg)]">
        {/* Left Side - Branding with Image */}
        <div className="hidden md:flex md:w-5/12 bg-linear-to-b from-[color:var(--primary-light)] via-[color:var(--background)] to-[color:var(--secondary-light)] flex-col items-center justify-center p-8 relative">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[color:var(--text-primary)]">MidwifeHub</h1>
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
            <span className="text-[color:var(--text-secondary)]">Empowering Healthcare</span><br />
            <span className="bg-linear-to-r from-[color:var(--primary)] to-[color:var(--secondary)] bg-clip-text text-transparent text-base">
              One Family at a Time
            </span>
          </h2>

          <p className="text-[color:var(--text-muted)] text-xs mt-4">&copy; 2026 Ministry of Health, Sri Lanka</p>
        </div>

        {/* Right Side - Login */}
        <div className="w-full md:w-7/12 flex items-center justify-center p-8 sm:p-10 bg-[color:var(--card-bg)]">
          <div className="w-full max-w-sm">
            {/* Mobile Logo */}
            <div className="md:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-[color:var(--text-primary)]">MidwifeHub</h1>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[color:var(--text-primary)]">Welcome Back</h2>
              <p className="text-[color:var(--text-secondary)] mt-2 text-sm">Sign in to continue to your dashboard</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Processing state */}
            {isProcessing && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 text-[color:var(--primary)] animate-spin mb-4" />
                <p className="text-[color:var(--text-secondary)] text-sm">
                  {hasHydrated ? 'Signing you in...' : 'Loading...'}
                </p>
              </div>
            )}

            {/* Login Form - shown when not processing */}
            {!isProcessing && (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@health.gov.lk"
                    className="w-full px-4 py-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] focus:bg-[color:var(--surface)]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Your password"
                      className="w-full px-4 py-3 pr-20 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] focus:bg-[color:var(--surface)]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute inset-y-0 right-3 text-sm font-semibold text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-linear-to-r from-[color:var(--primary)] to-[color:var(--secondary)] hover:from-[color:var(--primary-dark)] hover:to-[color:var(--secondary-dark)] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-[0_12px_30px_-16px_rgba(47,122,109,0.45)] hover:shadow-[0_14px_40px_-16px_rgba(47,122,109,0.55)]"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </button>

                <p className="text-center text-xs text-[color:var(--text-muted)] mt-6">
                  Midwife accounts are provisioned by the administrator.
                  <br />
                  Contact your supervisor if you need access.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
