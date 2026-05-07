/**
 * Auth Guard Component
 *
 * Protects routes by requiring authentication.
 * Redirects unauthenticated users to /login.
 * Shows a loading spinner while checking auth state.
 */

'use client';

import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter, usePathname } from 'next/navigation';
import { Heart } from 'lucide-react';

// Routes that don't require authentication
const publicRoutes = ['/login'];

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth0();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, isPublicRoute, router]);

  // Show loading spinner while Auth0 checks session
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-900">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mb-4 animate-pulse">
          <Heart className="w-8 h-8 text-white" />
        </div>
        <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 mt-4 text-sm">Loading...</p>
      </div>
    );
  }

  // For public routes, always render
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For protected routes, only render if authenticated
  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

  return <>{children}</>;
}
