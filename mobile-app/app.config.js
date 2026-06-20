// Dynamic Expo config.
// Reads the static config from app.json and injects environment-specific values
// (from .env / EAS secrets) so no credentials are hardcoded in the repo.
//
// app.json is loaded first and passed in as `config`; we extend it here.
// Expo's CLI auto-loads .env into process.env before evaluating this file.

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    // Auth0 native plugin needs the domain at build time, so it is configured
    // here (not in app.json) to keep the value sourced from the environment.
    [
      'react-native-auth0',
      { domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? '' },
    ],
  ],
  extra: {
    ...config.extra,
    // Agent secrets — injected into expoConfig.extra, read via src/config/env.ts
    DO_AGENT_ENDPOINT: process.env.DO_AGENT_ENDPOINT ?? '',
    DO_AGENT_KEY: process.env.DO_AGENT_KEY ?? '',
    DO_AGENT_MODEL: process.env.DO_AGENT_MODEL ?? '',
  },
});
