/**
 * Auth0 Provider Component
 *
 * Wraps the application with Auth0Provider from @auth0/auth0-react.
 * Must be a client component since Auth0Provider uses React context.
 */

'use client';

import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';

const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '';
const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '';
const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || '';

interface Auth0ProviderWrapperProps {
  children: React.ReactNode;
}

export function Auth0ProviderWrapper({ children }: Auth0ProviderWrapperProps) {
  const router = useRouter();

  const onRedirectCallback = (appState?: { returnTo?: string }) => {
    router.push(appState?.returnTo || '/');
  };

  if (!domain || !clientId) {
    console.error('Auth0 domain or clientId not configured. Check .env.local');
    return <>{children}</>;
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? `${window.location.origin}/login` : '',
        audience: audience || undefined,
        scope: 'openid profile email offline_access',
      }}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      {children}
    </Auth0Provider>
  );
}
