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

export const useI18nStore = create<I18nState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        currentLanguage: 'en',
        defaultLanguage: 'en',
        translations: {},
        availableLanguages: [],
        isLoaded: false,
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
