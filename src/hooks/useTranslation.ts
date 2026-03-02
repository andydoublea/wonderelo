import { useCallback } from 'react';
import { useI18nStore } from '../stores/i18nStore';

/**
 * Translation hook for components.
 *
 * Usage:
 *   const { t } = useTranslation();
 *   t('nav.signUp', 'Sign up')
 *
 *   const { t } = useTranslation('nav');
 *   t('signUp', 'Sign up')  // auto-prefixed as 'nav.signUp'
 */
export function useTranslation(namespace?: string) {
  const translations = useI18nStore((s) => s.translations);
  const currentLanguage = useI18nStore((s) => s.currentLanguage);
  const isInlineEditMode = useI18nStore((s) => s.isInlineEditMode);

  const t = useCallback(
    (key: string, defaultText?: string, params?: Record<string, string | number>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      let text = translations[fullKey] || defaultText || fullKey;

      // Replace {placeholder} params
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }

      return text;
    },
    [translations, namespace]
  );

  return { t, language: currentLanguage, isInlineEditMode };
}
