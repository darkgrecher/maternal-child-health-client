/**
 * i18n Configuration
 * 
 * Sets up internationalization for the application supporting
 * English, Sinhala, and Tamil languages.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import si from './locales/si';
import ta from './locales/ta';

// Language resources
const resources = {
  en: { translation: en },
  si: { translation: si },
  ta: { translation: ta },
};

/**
 * Initialize i18n with default configuration
 */
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false, // React already handles escaping
    },
    
    // Enable debug mode in development
    debug: __DEV__,
    
    // Cache configuration
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

export default i18n;

/**
 * Helper function to change language
 * @param language - Language code ('en', 'si', 'ta')
 */
export const changeLanguage = async (language: 'en' | 'si' | 'ta'): Promise<void> => {
  await i18n.changeLanguage(language);
};

/**
 * Get current language
 * @returns Current language code
 */
export const getCurrentLanguage = (): string => {
  return i18n.language;
};

/**
 * Available languages with labels
 */
export const AVAILABLE_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'si', label: 'Sinhala', nativeLabel: 'සිංහල' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
] as const;
