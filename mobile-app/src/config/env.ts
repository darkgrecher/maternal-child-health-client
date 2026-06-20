/**
 * Environment configuration (single source of truth).
 *
 * All environment access for the app goes through this module. Nothing else
 * should read `process.env` or `Constants.expoConfig.extra` directly.
 *
 * - `EXPO_PUBLIC_*` vars are read from `process.env`. Expo inlines these at
 *   build time, so they MUST be referenced as static literals (no dynamic
 *   `process.env[key]` access) — that is why each is spelled out below.
 * - Secret-ish agent values are injected via `app.config.js` into
 *   `expoConfig.extra` from the (gitignored) `.env` file / EAS secrets.
 *
 * Required values are validated once at startup so a misconfigured build fails
 * fast with a clear message instead of a confusing runtime error later.
 */

import Constants from 'expo-constants';

type ExtraConfig = {
  DO_AGENT_ENDPOINT?: string;
  DO_AGENT_KEY?: string;
  DO_AGENT_MODEL?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

/** Trims a value and returns undefined for empty/missing strings. */
const clean = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const raw = {
  apiBaseUrl: clean(process.env.EXPO_PUBLIC_API_BASE_URL),

  googleExpoClientId: clean(process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID),
  googleIosClientId: clean(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
  googleAndroidClientId: clean(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID),
  googleWebClientId: clean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),

  auth0Domain: clean(process.env.EXPO_PUBLIC_AUTH0_DOMAIN),
  auth0ClientId: clean(process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID),
  auth0Audience: clean(process.env.EXPO_PUBLIC_AUTH0_AUDIENCE),
  auth0DbConnection: clean(process.env.EXPO_PUBLIC_AUTH0_DB_CONNECTION),

  doAgentEndpoint: clean(extra.DO_AGENT_ENDPOINT),
  doAgentKey: clean(extra.DO_AGENT_KEY),
  doAgentModel: clean(extra.DO_AGENT_MODEL),
};

/** Keys that must be present for the app to function. */
const REQUIRED_KEYS: Array<keyof typeof raw> = [
  'apiBaseUrl',
  'googleExpoClientId',
  'googleIosClientId',
  'googleAndroidClientId',
  'googleWebClientId',
  'auth0Domain',
  'auth0ClientId',
  'auth0Audience',
];

const missing = REQUIRED_KEYS.filter((key) => !raw[key]);

if (missing.length > 0) {
  const message =
    `Missing required environment variables: ${missing.join(', ')}.\n` +
    'Copy .env.example to .env and fill in the values (or set EAS secrets for cloud builds).';
  // Fail loudly in development; warn in production so a bad build is visible
  // without hard-crashing users who already have the app installed.
  if (__DEV__) {
    throw new Error(message);
  } else {
    console.error(message);
  }
}

export const ENV = {
  api: {
    baseUrl: raw.apiBaseUrl ?? '',
  },
  google: {
    expoClientId: raw.googleExpoClientId ?? '',
    iosClientId: raw.googleIosClientId ?? '',
    androidClientId: raw.googleAndroidClientId ?? '',
    webClientId: raw.googleWebClientId ?? '',
  },
  auth0: {
    domain: raw.auth0Domain ?? '',
    clientId: raw.auth0ClientId ?? '',
    audience: raw.auth0Audience ?? '',
    databaseConnection: raw.auth0DbConnection ?? 'Username-Password-Authentication',
  },
  doAgent: {
    endpoint: raw.doAgentEndpoint ?? '',
    key: raw.doAgentKey ?? '',
    model: raw.doAgentModel ?? '',
  },
} as const;

export type Env = typeof ENV;
