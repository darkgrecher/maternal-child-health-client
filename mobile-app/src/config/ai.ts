/**
 * AI Agent Configuration
 *
 * Values are read from Expo config extras in app.json.
 */

import Constants from 'expo-constants';

type ExtraConfig = {
  DO_AGENT_ENDPOINT?: string;
  DO_AGENT_KEY?: string;
  DO_AGENT_MODEL?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

export const DO_AGENT_ENDPOINT = extra.DO_AGENT_ENDPOINT?.trim() ?? '';
export const DO_AGENT_KEY = extra.DO_AGENT_KEY?.trim() ?? '';
export const DO_AGENT_MODEL = extra.DO_AGENT_MODEL?.trim() ?? '';

export const getDoAgentConfig = () => ({
  endpoint: DO_AGENT_ENDPOINT,
  key: DO_AGENT_KEY,
  model: DO_AGENT_MODEL,
});
