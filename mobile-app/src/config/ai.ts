/**
 * AI Agent Configuration
 *
 * Values come from ./env (injected via app.config.js from .env / EAS secrets).
 */

import { ENV } from './env';

export const DO_AGENT_ENDPOINT = ENV.doAgent.endpoint;
export const DO_AGENT_KEY = ENV.doAgent.key;
export const DO_AGENT_MODEL = ENV.doAgent.model;

export const getDoAgentConfig = () => ({ ...ENV.doAgent });
