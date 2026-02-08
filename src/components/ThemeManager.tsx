import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ArrowLeft, Palette, Eye, Save, RotateCcw, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { debugLog, errorLog } from '../utils/debug';

interface ThemeManagerProps {
  accessToken: string;
  onBack: () => void;
}

interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  colors: {
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
  };
}

const predefinedThemes: ThemeConfig[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean and professional default theme',
    colors: {
      primary: '240 5.9% 10%',
      primaryForeground: '0 0% 98%',
      secondary: '240 4.8% 95.9%',
      secondaryForeground: '240 5.9% 10%',
      accent: '240 4.8% 95.9%',
      accentForeground: '240 5.9% 10%',
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      cardForeground: '240 10% 3.9%',
      popover: '0 0% 100%',
      popoverForeground: '240 10% 3.9%',
      muted: '240 4.8% 95.9%',
      mutedForeground: '240 3.8% 46.1%',
      border: '240 5.9% 90%',
      input: '240 5.9% 90%',
      ring: '240 5.9% 10%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
    },
  },
  {
    id: 'dark',
    name: 'Dark mode',
    description: 'Elegant dark theme for reduced eye strain',
    colors: {
      primary: '0 0% 98%',
      primaryForeground: '240 5.9% 10%',
      secondary: '240 3.7% 15.9%',
      secondaryForeground: '0 0% 98%',
      accent: '240 3.7% 15.9%',
      accentForeground: '0 0% 98%',
      background: '240 10% 3.9%',
      foreground: '0 0% 98%',
      card: '240 10% 3.9%',
      cardForeground: '0 0% 98%',
      popover: '240 10% 3.9%',
      popoverForeground: '0 0% 98%',
      muted: '240 3.7% 15.9%',
      mutedForeground: '240 5% 64.9%',
      border: '240 3.7% 15.9%',
      input: '240 3.7% 15.9%',
      ring: '240 4.9% 83.9%',
      destructive: '0 62.8% 30.6%',
      destructiveForeground: '0 0% 98%',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean blue',
    description: 'Calm and trustworthy blue theme',
    colors: {
      primary: '210 100% 40%',
      primaryForeground: '0 0% 100%',
      secondary: '210 40% 96%',
      secondaryForeground: '210 100% 20%',
      accent: '200 80% 50%',
      accentForeground: '0 0% 100%',
      background: '0 0% 100%',
      foreground: '210 40% 10%',
      card: '0 0% 100%',
      cardForeground: '210 40% 10%',
      popover: '0 0% 100%',
      popoverForeground: '210 40% 10%',
      muted: '210 40% 96%',
      mutedForeground: '210 20% 46%',
      border: '210 40% 90%',
      input: '210 40% 90%',
      ring: '210 100% 40%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
    },
  },
  {
    id: 'forest',
    name: 'Forest green',
    description: 'Natural and eco-friendly green theme',
    colors: {
      primary: '140 70% 35%',
      primaryForeground: '0 0% 100%',
      secondary: '140 30% 96%',
      secondaryForeground: '140 70% 15%',
      accent: '160 60% 45%',
      accentForeground: '0 0% 100%',
      background: '0 0% 100%',
      foreground: '140 50% 10%',
      card: '0 0% 100%',
      cardForeground: '140 50% 10%',
      popover: '0 0% 100%',
      popoverForeground: '140 50% 10%',
      muted: '140 30% 96%',
      mutedForeground: '140 20% 46%',
      border: '140 30% 90%',
      input: '140 30% 90%',
      ring: '140 70% 35%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset orange',
    description: 'Warm and energetic orange theme',
    colors: {
      primary: '25 95% 53%',
      primaryForeground: '0 0% 100%',
      secondary: '25 30% 96%',
      secondaryForeground: '25 95% 20%',
      accent: '40 90% 55%',
      accentForeground: '0 0% 100%',
      background: '0 0% 100%',
      foreground: '25 40% 10%',
      card: '0 0% 100%',
      cardForeground: '25 40% 10%',
      popover: '0 0% 100%',
      popoverForeground: '25 40% 10%',
      muted: '25 30% 96%',
      mutedForeground: '25 20% 46%',
      border: '25 30% 90%',
      input: '25 30% 90%',
      ring: '25 95% 53%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
    },
  },
  {
    id: 'purple',
    name: 'Royal purple',
    description: 'Elegant and creative purple theme',
    colors: {
      primary: '270 70% 50%',
      primaryForeground: '0 0% 100%',
      secondary: '270 30% 96%',
      secondaryForeground: '270 70% 20%',
      accent: '280 60% 55%',
      accentForeground: '0 0% 100%',
      background: '0 0% 100%',
      foreground: '270 40% 10%',
      card: '0 0% 100%',
      cardForeground: '270 40% 10%',
      popover: '0 0% 100%',
      popoverForeground: '270 40% 10%',
      muted: '270 30% 96%',
      mutedForeground: '270 20% 46%',
      border: '270 30% 90%',
      input: '270 30% 90%',
      ring: '270 70% 50%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 98%',
    },
  },
];

export function ThemeManager({ accessToken, onBack }: ThemeManagerProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(predefinedThemes[0]);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('default');
  const [customColors, setCustomColors] = useState<ThemeConfig['colors']>(predefinedThemes[0].colors);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Load saved theme
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    setIsLoading(true);
    try {
      const { authenticatedFetch } = await import('../utils/supabase/apiClient');
      const response = await authenticatedFetch('/admin/theme', {}, accessToken);

      if (response.ok) {
        const data = await response.json();
        if (data.theme) {
          setSelectedThemeId(data.theme.id);
          setCustomColors(data.theme.colors);
          
          // Find predefined theme or use custom
          const predefined = predefinedThemes.find(t => t.id === data.theme.id);
          if (predefined) {
            setCurrentTheme({ ...predefined, colors: data.theme.colors });
          } else {
            setCurrentTheme(data.theme);
          }
          
          // Apply theme immediately
          applyThemeToDocument(data.theme.colors);
        }
      }
    } catch (error) {
      errorLog('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyThemeToDocument = (colors: ThemeConfig['colors']) => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      // Apply with hsl() wrapper to match the format used by themeLoader
      root.style.setProperty(cssVar, `hsl(${value})`);
    });
  };

  const handleThemeSelect = (themeId: string) => {
    const theme = predefinedThemes.find(t => t.id === themeId);
    if (theme) {
      setSelectedThemeId(themeId);
      setCurrentTheme(theme);
      setCustomColors(theme.colors);
    }
  };

  const handleColorChange = (colorKey: keyof ThemeConfig['colors'], value: string) => {
    setCustomColors(prev => ({
      ...prev,
      [colorKey]: value
    }));
  };

  const handleApplyPreview = () => {
    setIsApplying(true);
    applyThemeToDocument(customColors);
    toast.success('Theme preview applied');
    setTimeout(() => setIsApplying(false), 500);
  };

  const handleResetColors = () => {
    const theme = predefinedThemes.find(t => t.id === selectedThemeId);
    if (theme) {
      setCustomColors(theme.colors);
      applyThemeToDocument(theme.colors);
      toast.success('Colors reset to theme defaults');
    }
  };

  const handleSaveTheme = async () => {
    setIsSaving(true);
    try {
      const { authenticatedFetch } = await import('../utils/supabase/apiClient');
      
      const themeData = {
        id: selectedThemeId,
        name: currentTheme.name,
        colors: customColors
      };

      const response = await authenticatedFetch(
        '/admin/theme',
        {
          method: 'POST',
          body: JSON.stringify({ theme: themeData })
        },
        accessToken
      );

      if (response.ok) {
        applyThemeToDocument(customColors);
        toast.success('Theme saved and applied successfully!');
      } else {
        const errorData = await response.json();
        errorLog('Server error:', errorData);
        throw new Error(errorData.error || 'Failed to save theme');
      }
    } catch (error) {
      errorLog('Error saving theme:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save theme');
    } finally {
      setIsSaving(false);
    }
  };

  const hslToHex = (hsl: string): string => {
    const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
    const sDecimal = s / 100;
    const lDecimal = l / 100;
    
    const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lDecimal - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }
    
    const toHex = (n: number) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading theme settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Palette className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Theme manager</h1>
                  <p className="text-sm text-muted-foreground">Customize your application's visual appearance</p>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <Tabs defaultValue="themes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="themes">Predefined themes</TabsTrigger>
            <TabsTrigger value="customize">Customize colors</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Predefined Themes Tab */}
          <TabsContent value="themes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select a theme</CardTitle>
                <CardDescription>
                  Choose from our predefined themes or customize your own
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {predefinedThemes.map((theme) => (
                    <Card
                      key={theme.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedThemeId === theme.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleThemeSelect(theme.id)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{theme.name}</CardTitle>
                          {selectedThemeId === theme.id && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <CardDescription className="text-xs">
                          {theme.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2 flex-wrap">
                          <div
                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: hslToHex(theme.colors.primary) }}
                            title="Primary"
                          />
                          <div
                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: hslToHex(theme.colors.secondary) }}
                            title="Secondary"
                          />
                          <div
                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: hslToHex(theme.colors.accent) }}
                            title="Accent"
                          />
                          <div
                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: hslToHex(theme.colors.destructive) }}
                            title="Destructive"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customize Colors Tab */}
          <TabsContent value="customize" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Customize theme colors</CardTitle>
                    <CardDescription>
                      Fine-tune individual colors for the selected theme. Values use HSL format (Hue Saturation Lightness).
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleResetColors}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button variant="secondary" onClick={handleApplyPreview} disabled={isApplying}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Primary Colors */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Primary colors</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded border-2 border-border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: hslToHex(customColors.primary) }}
                        />
                        <div className="flex-1">
                          <Label htmlFor="primary" className="text-xs">Primary</Label>
                          <Input
                            id="primary"
                            value={customColors.primary}
                            onChange={(e) => handleColorChange('primary', e.target.value)}
                            placeholder="240 5.9% 10%"
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded border-2 border-border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: hslToHex(customColors.primaryForeground) }}
                        />
                        <div className="flex-1">
                          <Label htmlFor="primaryForeground" className="text-xs">Primary foreground</Label>
                          <Input
                            id="primaryForeground"
                            value={customColors.primaryForeground}
                            onChange={(e) => handleColorChange('primaryForeground', e.target.value)}
                            placeholder="0 0% 98%"
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Colors */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Secondary colors</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded border-2 border-border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: hslToHex(customColors.secondary) }}
                        />
                        <div className="flex-1">
                          <Label htmlFor="secondary" className="text-xs">Secondary</Label>
                          <Input
                            id="secondary"
                            value={customColors.secondary}
                            onChange={(e) => handleColorChange('secondary', e.target.value)}
                            placeholder="240 4.8% 95.9%"
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded border-2 border-border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: hslToHex(customColors.secondaryForeground) }}
                        />
                        <div className="flex-1">
                          <Label htmlFor="secondaryForeground" className="text-xs">Secondary foreground</Label>
                          <Input
                            id="secondaryForeground"
                            value={customColors.secondaryForeground}
                            onChange={(e) => handleColorChange('secondaryForeground', e.target.value)}
                            placeholder="240 5.9% 10%"
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accent Colors */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Accent colors</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded border-2 border-border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: hslToHex(customColors.accent) }}
                        />
                        <div className="flex-1">
                          <Label htmlFor="accent" className="text-xs">Accent</Label>
                          <Input
                            id="accent"
                            value={customColors.accent}
                            onChange={(e) => handleColorChange('accent', e.target.value)}
                            placeholder="240 4.8% 95.9%"
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded border-2 border-border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: hslToHex(customColors.accentForeground) }}
                        />
                        <div className="flex-1">
                          <Label htmlFor="accentForeground" className="text-xs">Accent foreground</Label>
                          <Input
                            id="accentForeground"
                            value={customColors.accentForeground}
                            onChange={(e) => handleColorChange('accentForeground', e.target.value)}
                            placeholder="240 5.9% 10%"
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Background Colors */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Background colors</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded border-2 border-border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: hslToHex(customColors.background) }}
                        />
                        <div className="flex-1">
                          <Label htmlFor="background" className="text-xs">Background</Label>
                          <Input
                            id="background"
                            value={customColors.background}
                            onChange={(e) => handleColorChange('background', e.target.value)}
                            placeholder="0 0% 100%"
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded border-2 border-border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: hslToHex(customColors.foreground) }}
                        />
                        <div className="flex-1">
                          <Label htmlFor="foreground" className="text-xs">Foreground</Label>
                          <Input
                            id="foreground"
                            value={customColors.foreground}
                            onChange={(e) => handleColorChange('foreground', e.target.value)}
                            placeholder="240 10% 3.9%"
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Colors */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Card colors</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded border-2 border-border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: hslToHex(customColors.card) }}
                        />
                        <div className="flex-1">
                          <Label htmlFor="card" className="text-xs">Card</Label>
                          <Input
                            id="card"
                            value={customColors.card}
                            onChange={(e) => handleColorChange('card', e.target.value)}
                            placeholder="0 0% 100%"
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded border-2 border-border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: hslToHex(customColors.cardForeground) }}
                        />
                        <div className="flex-1">
                          <Label htmlFor="cardForeground" className="text-xs">Card foreground</Label>
                          <Input
                            id="cardForeground"
                            value={customColors.cardForeground}
                            onChange={(e) => handleColorChange('cardForeground', e.target.value)}
                            placeholder="240 10% 3.9%"
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Muted Colors */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Muted colors</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded border-2 border-border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: hslToHex(customColors.muted) }}
                        />
                        <div className="flex-1">
                          <Label htmlFor="muted" className="text-xs">Muted</Label>
                          <Input
                            id="muted"
                            value={customColors.muted}
                            onChange={(e) => handleColorChange('muted', e.target.value)}
                            placeholder="240 4.8% 95.9%"
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded border-2 border-border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: hslToHex(customColors.mutedForeground) }}
                        />
                        <div className="flex-1">
                          <Label htmlFor="mutedForeground" className="text-xs">Muted foreground</Label>
                          <Input
                            id="mutedForeground"
                            value={customColors.mutedForeground}
                            onChange={(e) => handleColorChange('mutedForeground', e.target.value)}
                            placeholder="240 3.8% 46.1%"
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Border & Input */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Border & input</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded border-2 border-border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: hslToHex(customColors.border) }}
                        />
                        <div className="flex-1">
                          <Label htmlFor="border" className="text-xs">Border</Label>
                          <Input
                            id="border"
                            value={customColors.border}
                            onChange={(e) => handleColorChange('border', e.target.value)}
                            placeholder="240 5.9% 90%"
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded border-2 border-border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: hslToHex(customColors.input) }}
                        />
                        <div className="flex-1">
                          <Label htmlFor="input" className="text-xs">Input</Label>
                          <Input
                            id="input"
                            value={customColors.input}
                            onChange={(e) => handleColorChange('input', e.target.value)}
                            placeholder="240 5.9% 90%"
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded border-2 border-border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: hslToHex(customColors.ring) }}
                        />
                        <div className="flex-1">
                          <Label htmlFor="ring" className="text-xs">Ring (focus)</Label>
                          <Input
                            id="ring"
                            value={customColors.ring}
                            onChange={(e) => handleColorChange('ring', e.target.value)}
                            placeholder="240 5.9% 10%"
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Destructive Colors */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Destructive colors</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded border-2 border-border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: hslToHex(customColors.destructive) }}
                        />
                        <div className="flex-1">
                          <Label htmlFor="destructive" className="text-xs">Destructive</Label>
                          <Input
                            id="destructive"
                            value={customColors.destructive}
                            onChange={(e) => handleColorChange('destructive', e.target.value)}
                            placeholder="0 84.2% 60.2%"
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded border-2 border-border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: hslToHex(customColors.destructiveForeground) }}
                        />
                        <div className="flex-1">
                          <Label htmlFor="destructiveForeground" className="text-xs">Destructive foreground</Label>
                          <Input
                            id="destructiveForeground"
                            value={customColors.destructiveForeground}
                            onChange={(e) => handleColorChange('destructiveForeground', e.target.value)}
                            placeholder="0 0% 98%"
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview your theme</CardTitle>
                <CardDescription>
                  See how your theme looks with common UI components
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Buttons */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Buttons</Label>
                  <div className="flex flex-wrap gap-3">
                    <Button>Primary button</Button>
                    <Button variant="secondary">Secondary button</Button>
                    <Button variant="outline">Outline button</Button>
                    <Button variant="ghost">Ghost button</Button>
                    <Button variant="destructive">Destructive button</Button>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Cards</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Card title</CardTitle>
                        <CardDescription>Card description text</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">This is card content with regular text.</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Another card</CardTitle>
                        <CardDescription>More description</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Muted text example.</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Third card</CardTitle>
                        <CardDescription>Additional info</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Badge>Badge</Badge>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Inputs */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Form inputs</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="preview-input">Text input</Label>
                      <Input id="preview-input" placeholder="Enter text here..." />
                    </div>
                    <div>
                      <Label htmlFor="preview-input-2">Another input</Label>
                      <Input id="preview-input-2" value="Pre-filled value" readOnly />
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Badges</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-6">
          <Button variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button onClick={handleSaveTheme} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save theme
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}