import { useEffect } from 'react';
import { useI18nStore } from '../../stores/i18nStore';
import { apiBaseUrl } from '../../utils/supabase/info';
import { debugLog, errorLog } from '../../utils/debug';

/**
 * I18nLoader - loads available languages and translation bundle on mount.
 * Place this inside the QueryProvider but outside Routes.
 * It reads language from localStorage (persisted by zustand) and loads translations.
 */
export function I18nLoader() {
  const currentLanguage = useI18nStore((s) => s.currentLanguage);
  const setTranslations = useI18nStore((s) => s.setTranslations);
  const setAvailableLanguages = useI18nStore((s) => s.setAvailableLanguages);
  const availableLanguages = useI18nStore((s) => s.availableLanguages);

  // Load available languages on mount
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/i18n/languages`);
        if (res.ok) {
          const langs = await res.json();
          setAvailableLanguages(langs);
          debugLog('i18n: Loaded languages:', langs.map((l: any) => l.code));

          // Auto-detect language from browser if not already set
          const store = useI18nStore.getState();
          const validCodes = langs.map((l: any) => l.code);
          if (!validCodes.includes(store.currentLanguage)) {
            const browserLang = navigator.language.split('-')[0];
            const detectedLang = validCodes.includes(browserLang)
              ? browserLang
              : (langs.find((l: any) => l.is_default)?.code || 'en');
            store.setLanguage(detectedLang);
          }
        }
      } catch (err) {
        errorLog('i18n: Failed to load languages:', err);
      }
    };
    loadLanguages();
  }, [setAvailableLanguages]);

  // Load translations when language changes
  useEffect(() => {
    if (!currentLanguage) return;

    const loadTranslations = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/i18n/translations/${currentLanguage}`);
        if (res.ok) {
          const bundle = await res.json();
          setTranslations(bundle);
          debugLog(`i18n: Loaded ${Object.keys(bundle).length} translations for ${currentLanguage}`);
        }
      } catch (err) {
        errorLog('i18n: Failed to load translations:', err);
        setTranslations({});
      }
    };
    loadTranslations();
  }, [currentLanguage, setTranslations]);

  return null; // Renders nothing
}
