/**
 * AI Chat Service
 *
 * Sends chat messages to the DigitalOcean agent endpoint.
 */

import { getDoAgentConfig } from '../config/ai';

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

type AiChatResponse = {
  choices?: Array<{
    message?: { content?: string };
    text?: string;
  }>;
  output_text?: string;
  output?: string;
  answer?: string;
  response?: string;
  message?: string;
  error?: { message?: string };
};

const buildChatUrl = (endpoint: string): string => {
  const trimmed = endpoint.replace(/\/+$/, '');
  if (trimmed.endsWith('/v1/chat/completions')) return trimmed;
  if (trimmed.endsWith('/v1')) return `${trimmed}/chat/completions`;
  return `${trimmed}/v1/chat/completions`;
};

const extractResponseText = (data: AiChatResponse): string | null => {
  const choiceText = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text;
  if (typeof choiceText === 'string' && choiceText.trim()) {
    return choiceText.trim();
  }

  const fallbackText =
    data.output_text ??
    data.output ??
    data.answer ??
    data.response ??
    data.message;

  if (typeof fallbackText === 'string' && fallbackText.trim()) {
    return fallbackText.trim();
  }

  return null;
};

export async function sendChatMessage(messages: AiChatMessage[]): Promise<string> {
  const { endpoint, key, model } = getDoAgentConfig();

  if (!endpoint || !key) {
    throw new Error('AI assistant is not configured.');
  }

  const body: Record<string, unknown> = { messages };
  if (model) {
    body.model = model;
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
    'X-API-Key': key,
  };

  const request = async (url: string) => {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    let data: AiChatResponse = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    return { response, data };
  };

  const baseUrl = endpoint.replace(/\/+$/, '');
  const candidateUrls = [
    buildChatUrl(endpoint),
    `${baseUrl}/chat/completions`,
    `${baseUrl}/api/v1/chat/completions`,
    `${baseUrl}/api/chat/completions`,
    baseUrl,
  ].filter((url, index, list) => url && list.indexOf(url) === index);

  let response: Response | null = null;
  let data: AiChatResponse = {};

  for (const url of candidateUrls) {
    const result = await request(url);
    response = result.response;
    data = result.data;

    if (response.ok) {
      break;
    }

    if (response.status !== 404 && response.status !== 405) {
      break;
    }
  }

  if (!response) {
    throw new Error('Request failed (no response).');
  }

  if (!response.ok) {
    const errorMessage = data.error?.message ?? data.message ?? `Request failed (${response.status}).`;
    throw new Error(errorMessage);
  }

  const content = extractResponseText(data);
  if (!content) {
    throw new Error('No response received from the AI assistant.');
  }

  return content;
}
