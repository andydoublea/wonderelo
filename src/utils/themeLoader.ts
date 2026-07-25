import { debugLog, errorLog } from './debug';
import { apiBaseUrl, publicAnonKey } from './supabase/info';

export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
  destructiveForeground: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  visualStyle?: string; // Visual style ID: 'clean-modern' | 'bold-gradient' | 'minimal-flat' | 'elegant-classic' | 'vibrant-playful'
}

// Valid visual style IDs
export const VISUAL_STYLES = [
  { id: 'clean-modern', name: 'Clean Modern', description: 'Clean lines, subtle shadows, professional feel' },
  { id: 'bold-gradient', name: 'Bold Gradient', description: 'Eye-catching gradients and prominent elements' },
  { id: 'minimal-flat', name: 'Minimal Flat', description: 'Ultra clean, no shadows, maximum density' },
  { id: 'elegant-classic', name: 'Elegant Classic', description: 'Sophisticated with serif accents' },
  { id: 'vibrant-playful', name: 'Vibrant Playful', description: 'Fun, colorful, rounded elements' },
  { id: 'retro-terminal', name: 'Retro Terminal', description: 'Monospace font, terminal vibes, hacker aesthetic' },
  { id: 'glassmorphism', name: 'Glassmorphism', description: 'Frosted glass effect, translucent cards, modern blur' },
  { id: 'neo-brutalist', name: 'Neo Brutalist', description: 'Thick borders, offset shadows, raw bold typography' },
  { id: 'jasper', name: 'Jasper', description: 'Serif headlines, vanilla backgrounds, warm orange accents' },
] as const;

export type VisualStyleId = typeof VISUAL_STYLES[number]['id'];

export const loadAndApplyTheme = async (): Promise<void> => {
  try {
    debugLog('Loading theme from server...');

    const response = await fetch(
      `${apiBaseUrl}/public/theme`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.theme) {
        if (data.theme.colors) {
          applyTheme(data.theme.colors);
        }
        if (data.theme.visualStyle) {
          applyVisualStyle(data.theme.visualStyle);
        }
        debugLog('Theme applied successfully:', data.theme.id, 'style:', data.theme.visualStyle);
      } else {
        debugLog('No custom theme found, using default');
      }
    }
  } catch (error) {
    errorLog('Error loading theme:', error);
    // On localhost, apply default Jasper style when API is unavailable
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      applyVisualStyle('jasper');
      debugLog('Localhost fallback: applied Jasper visual style');
    }
  }
};

export const applyTheme = (_colors: ThemeColors): void => {
  // Per-organizer colour theming has been removed alongside skin-switching — the app is a
  // single FIXED Wonderelo brand. The palette now lives in wonderelo-brand.css (:root),
  // so this is a no-op: we must NOT let a saved server theme override the fixed brand.
  debugLog('Theme colours ignored — fixed Wonderelo brand');
};

export const applyVisualStyle = (_styleId?: string): void => {
  // Skin-switching has been removed — the app is a single fixed Wonderelo brand.
  // This is now a no-op that only strips any stale `vs-*` class, so every existing
  // caller (server theme load + localhost fallback) stops re-skinning the document.
  removeVisualStyle();
};

export const removeVisualStyle = (): void => {
  const root = document.documentElement;
  VISUAL_STYLES.forEach(style => {
    root.classList.remove(`vs-${style.id}`);
  });
};
