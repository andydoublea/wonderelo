import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

export interface Language {
  code: string;
  name: string;
  native_name: string;
  flag_emoji: string | null;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
}

interface I18nState {
  // State
  currentLanguage: string;
  defaultLanguage: string;
  translations: Record<string, string>;
  availableLanguages: Language[];
  isLoaded: boolean;
  isInlineEditMode: boolean;

  // Actions
  setLanguage: (lang: string) => void;
  setDefaultLanguage: (lang: string) => void;
  setTranslations: (translations: Record<string, string>) => void;
  setAvailableLanguages: (langs: Language[]) => void;
  setIsLoaded: (loaded: boolean) => void;
  setInlineEditMode: (enabled: boolean) => void;
  updateTranslation: (key: string, text: string) => void;
}

// Pre-load cached translations synchronously to prevent flash of untranslated content
const getCachedState = (): { translations: Record<string, string>; currentLanguage: string; isLoaded: boolean } => {
  try {
    const stored = localStorage.getItem('wonderelo-i18n');
    if (stored) {
      const parsed = JSON.parse(stored);
      const state = parsed?.state;
      if (state?.translations && Object.keys(state.translations).length > 0) {
        return {
          translations: state.translations,
          currentLanguage: state.currentLanguage || 'en',
          isLoaded: true,
        };
      }
    }
  } catch {}
  return { translations: {}, currentLanguage: 'en', isLoaded: false };
};

const cached = getCachedState();

export const useI18nStore = create<I18nState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state - pre-filled from localStorage cache to prevent flicker
        currentLanguage: cached.currentLanguage,
        defaultLanguage: 'en',
        translations: cached.translations,
        availableLanguages: [],
        isLoaded: cached.isLoaded,
        isInlineEditMode: false,

        // Actions
        setLanguage: (lang) => set({ currentLanguage: lang }),
        setDefaultLanguage: (lang) => set({ defaultLanguage: lang }),
        setTranslations: (translations) => set({ translations, isLoaded: true }),
        setAvailableLanguages: (langs) => {
          const defaultLang = langs.find(l => l.is_default);
          set({
            availableLanguages: langs,
            ...(defaultLang ? { defaultLanguage: defaultLang.code } : {}),
          });
        },
        setIsLoaded: (loaded) => set({ isLoaded: loaded }),
        setInlineEditMode: (enabled) => set({ isInlineEditMode: enabled }),
        updateTranslation: (key, text) =>
          set((state) => ({
            translations: { ...state.translations, [key]: text },
          })),
      }),
      {
        name: 'wonderelo-i18n',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          currentLanguage: state.currentLanguage,
          translations: state.translations,
          isLoaded: state.isLoaded,
        }),
      }
    ),
    { name: 'i18n-store' }
  )
);

// Selectors
export const useCurrentLanguage = () => useI18nStore((s) => s.currentLanguage);
export const useTranslations = () => useI18nStore((s) => s.translations);
export const useAvailableLanguages = () => useI18nStore((s) => s.availableLanguages);
export const useIsInlineEditMode = () => useI18nStore((s) => s.isInlineEditMode);
export const useI18nLoaded = () => useI18nStore((s) => s.isLoaded);
