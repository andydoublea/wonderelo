import { debugLog, errorLog } from './debug';
import { projectId, publicAnonKey } from './supabase/info';

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
] as const;

export type VisualStyleId = typeof VISUAL_STYLES[number]['id'];

export const loadAndApplyTheme = async (): Promise<void> => {
  try {
    debugLog('Loading theme from server...');

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/public/theme`,
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
    // Silently fail and use default theme
  }
};

export const applyTheme = (colors: ThemeColors): void => {
  const root = document.documentElement;

  // Map theme colors to CSS custom properties
  const colorMap: Record<string, string> = {
    'primary': colors.primary,
    'primary-foreground': colors.primaryForeground,
    'secondary': colors.secondary,
    'secondary-foreground': colors.secondaryForeground,
    'accent': colors.accent,
    'accent-foreground': colors.accentForeground,
    'background': colors.background,
    'foreground': colors.foreground,
    'card': colors.card,
    'card-foreground': colors.cardForeground,
    'popover': colors.popover,
    'popover-foreground': colors.popoverForeground,
    'muted': colors.muted,
    'muted-foreground': colors.mutedForeground,
    'border': colors.border,
    'input': colors.input,
    'ring': colors.ring,
    'destructive': colors.destructive,
    'destructive-foreground': colors.destructiveForeground,
  };

  // Apply colors to root element
  Object.entries(colorMap).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, `hsl(${value})`);
  });

  debugLog('Theme colors applied to document');
};

export const applyVisualStyle = (styleId: string): void => {
  const root = document.documentElement;

  // Remove any existing visual style classes
  VISUAL_STYLES.forEach(style => {
    root.classList.remove(`vs-${style.id}`);
  });

  // Apply the new visual style class
  if (styleId && styleId !== 'none') {
    root.classList.add(`vs-${styleId}`);
    debugLog('Visual style applied:', styleId);
  }
};

export const removeVisualStyle = (): void => {
  const root = document.documentElement;
  VISUAL_STYLES.forEach(style => {
    root.classList.remove(`vs-${style.id}`);
  });
};
