import { useI18nStore } from '../../stores/i18nStore';
import { useNavigate, useLocation } from 'react-router';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Globe } from 'lucide-react';

/**
 * Language switcher dropdown.
 * Shows available languages with flag emoji and native name.
 * On select, navigates to same page with new language prefix.
 */
export function LanguageSwitcher() {
  const availableLanguages = useI18nStore((s) => s.availableLanguages);
  const currentLanguage = useI18nStore((s) => s.currentLanguage);
  const setLanguage = useI18nStore((s) => s.setLanguage);
  const setTranslations = useI18nStore((s) => s.setTranslations);
  const navigate = useNavigate();
  const location = useLocation();

  // Don't render if only one language
  if (availableLanguages.length <= 1) return null;

  const currentLang = availableLanguages.find((l) => l.code === currentLanguage);

  const handleLanguageChange = async (langCode: string) => {
    if (langCode === currentLanguage) return;

    // Update store
    setLanguage(langCode);

    // Replace language prefix in current URL
    const pathParts = location.pathname.split('/').filter(Boolean);
    const validCodes = availableLanguages.map((l) => l.code);

    let newPath: string;
    if (pathParts.length > 0 && validCodes.includes(pathParts[0])) {
      // Replace existing language prefix
      pathParts[0] = langCode;
      newPath = '/' + pathParts.join('/');
    } else {
      // Add language prefix
      newPath = '/' + langCode + location.pathname;
    }

    navigate(newPath + location.search, { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5" style={{ fontSize: '13px' }}>
          {currentLang?.flag_emoji ? (
            <span style={{ fontSize: '16px' }}>{currentLang.flag_emoji}</span>
          ) : (
            <Globe className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{currentLang?.code?.toUpperCase() || 'EN'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            style={{
              fontWeight: lang.code === currentLanguage ? 600 : 400,
              background: lang.code === currentLanguage ? '#f3f4f6' : undefined,
            }}
          >
            <span style={{ marginRight: '8px', fontSize: '16px' }}>{lang.flag_emoji || '🌐'}</span>
            {lang.native_name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
