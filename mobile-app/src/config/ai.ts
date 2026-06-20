/**
 * AI Agent Configuration
 *
 * Values come from ./env (injected via app.config.js from .env / EAS secrets).
 */

import { ENV } from './env';

export const getDoAgentConfig = () => ({ ...ENV.doAgent });
