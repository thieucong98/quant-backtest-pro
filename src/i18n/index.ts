import { Language, TranslationDict } from './types';
import { en } from './locales/en';
import { vi } from './locales/vi';
import { ja } from './locales/ja';
import { zh } from './locales/zh';

export * from './types';
export { en, vi, ja, zh };

/**
 * Registry of all supported language packs.
 * To add a new language (e.g. French, German, Spanish, Korean), simply add a new locale file in src/i18n/locales/
 * and register it here without touching ANY UI component!
 */
export const translations: Record<string, TranslationDict> = {
  en,
  vi,
  ja,
  zh,
};

/**
 * Returns the strongly-typed translation dictionary for a given language,
 * with automatic fallback to English if a language or specific key is not found.
 */
export function getTranslation(language?: string): TranslationDict {
  if (!language || !translations[language]) {
    return translations.en;
  }
  return translations[language];
}

/**
 * Formats a translation template string with named parameters: e.g. "Hello {name}" -> "Hello John"
 */
export function formatText(template: string, params?: Record<string, string | number>): string {
  if (!params || !template) return template;
  let result = template;
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return result;
}

/**
 * Centralized locale-aware date/time formatting helper
 */
export function formatDate(date: string | number | Date, language?: string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const locale = language === 'vi' ? 'vi-VN' : language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US';
  return d.toLocaleDateString(locale);
}
