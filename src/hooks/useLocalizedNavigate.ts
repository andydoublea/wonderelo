import { useCallback } from 'react';
import { useNavigate, type NavigateOptions } from 'react-router';
import { useI18nStore } from '../stores/i18nStore';

/**
 * Navigate with language prefix automatically prepended.
 *
 * Usage:
 *   const navigate = useLocalizedNavigate();
 *   navigate('/pricing')  // goes to /en/pricing or /sk/pricing
 */
export function useLocalizedNavigate() {
  const navigate = useNavigate();
  const currentLanguage = useI18nStore((s) => s.currentLanguage);
  const defaultLanguage = useI18nStore((s) => s.defaultLanguage);
  const availableLanguages = useI18nStore((s) => s.availableLanguages);

  return useCallback(
    (to: string | number, options?: NavigateOptions) => {
      if (typeof to === 'number') {
        navigate(to);
        return;
      }

      // Don't prefix if only one language active
      if (availableLanguages.length <= 1) {
        navigate(to, options);
        return;
      }

      // Don't prefix external URLs or already prefixed paths
      const validCodes = availableLanguages.map((l) => l.code);
      const firstSegment = to.split('/').filter(Boolean)[0];
      if (firstSegment && validCodes.includes(firstSegment)) {
        navigate(to, options);
        return;
      }

      // Prepend language prefix
      const prefix = `/${currentLanguage}`;
      const path = to.startsWith('/') ? to : `/${to}`;
      navigate(`${prefix}${path}`, options);
    },
    [navigate, currentLanguage, defaultLanguage, availableLanguages]
  );
}
