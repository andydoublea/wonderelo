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
}

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
      if (data.theme && data.theme.colors) {
        applyTheme(data.theme.colors);
        debugLog('Theme applied successfully:', data.theme.id);
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
    // Convert HSL string to the format CSS expects
    // HSL format from backend: "240 5.9% 10%"
    // CSS expects: hsl(240 5.9% 10%)
    root.style.setProperty(`--${key}`, `hsl(${value})`);
  });
  
  debugLog('Theme colors applied to document');
};
