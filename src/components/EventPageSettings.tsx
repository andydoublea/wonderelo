import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Save, Loader2, Check, X, Upload, ImageIcon } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { toast } from 'sonner@2.0.3';
import { optimizeImage, formatFileSize } from '../utils/imageOptimization';
import { debugLog, errorLog } from '../utils/debug';

interface EventPageSettingsProps {
  accessToken: string;
  onBack: () => void;
  onProfileUpdate?: (updates: { urlSlug?: string; eventName?: string; profileImageUrl?: string }) => void;
}

export function EventPageSettings({ accessToken, onBack, onProfileUpdate }: EventPageSettingsProps) {
  const [eventName, setEventName] = useState('');
  const [urlSlug, setUrlSlug] = useState('');
  const [originalUrlSlug, setOriginalUrlSlug] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugError, setSlugError] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const checkSlugTimeout = useRef<NodeJS.Timeout | null>(null);
  const urlSlugFieldRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load current settings
  useEffect(() => {
    loadSettings();
  }, []);

  // Scroll to URL field if flag is set
  useEffect(() => {
    const shouldScroll = localStorage.getItem('oliwonder_scroll_to_url');
    if (shouldScroll === 'true' && urlSlugFieldRef.current) {
      // Remove flag
      localStorage.removeItem('oliwonder_scroll_to_url');
      
      // Scroll to URL field with a slight delay to ensure rendering is complete
      setTimeout(() => {
        urlSlugFieldRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [isLoading]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      debugLog('Loading event page settings...');
      
      const { authenticatedFetch } = await import('../utils/supabase/apiClient');
      const response = await authenticatedFetch('/profile', {}, accessToken);

      if (response.ok) {
        const result = await response.json();
        debugLog('Profile data received:', result);
        // Backend returns result.profile, not result.user
        const profile = result.profile || result.user || {};
        setEventName(profile.organizerName || profile.eventName || '');
        setUrlSlug(profile.urlSlug || '');
        setOriginalUrlSlug(profile.urlSlug || '');
        setProfileImageUrl(profile.profileImageUrl || '');
        setSlugAvailable(true); // Current slug is valid
      } else {
        const errorText = await response.text();
        errorLog('Failed to load settings:', response.status, errorText);
        toast.error(`Failed to load settings: ${response.status}`);
      }
    } catch (error) {
      errorLog('Error loading settings:', error);
      toast.error('Error loading settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkSlugAvailability = async (slug: string) => {
    // Don't check if slug hasn't changed
    if (slug === originalUrlSlug) {
      setSlugAvailable(true);
      setSlugError('');
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      setSlugAvailable(false);
      setSlugError('Only lowercase letters, numbers, and hyphens allowed');
      return;
    }

    if (slug.length < 3) {
      setSlugAvailable(false);
      setSlugError('URL must be at least 3 characters');
      return;
    }

    setIsCheckingSlug(true);
    setSlugError('');
    
    try {
      const { apiBaseUrl, publicAnonKey } = await import('../utils/supabase/info');
      const response = await fetch(
        `${apiBaseUrl}/check-slug/${slug}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setSlugAvailable(result.available);
        if (!result.available) {
          setSlugError('This URL is already taken');
        }
      } else {
        setSlugAvailable(false);
        setSlugError('Error checking availability');
      }
    } catch (error) {
      errorLog('Error checking slug:', error);
      setSlugAvailable(false);
      setSlugError('Error checking availability');
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const handleSlugChange = (value: string) => {
    // Convert to lowercase and remove invalid characters
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setUrlSlug(sanitized);
    setSlugAvailable(null);
    setSlugError('');

    // Clear previous timeout
    if (checkSlugTimeout.current) {
      clearTimeout(checkSlugTimeout.current);
    }

    // Debounce check
    if (sanitized.length >= 3) {
      checkSlugTimeout.current = setTimeout(() => {
        checkSlugAvailability(sanitized);
      }, 500);
    } else if (sanitized.length > 0) {
      setSlugError('URL must be at least 3 characters');
      setSlugAvailable(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - check both MIME type and extension for HEIC support
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = file.type.startsWith('image/') || validExtensions.includes(fileExtension);
    
    if (!isValidType) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB for original)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      // Optimize image on frontend
      debugLog(`Original image: ${formatFileSize(file.size)}`);
      const optimizedBlob = await optimizeImage(file, 400, 0.85);
      debugLog(`Optimized image: ${formatFileSize(optimizedBlob.size)}`);
      
      const savingsPercent = Math.round((1 - optimizedBlob.size / file.size) * 100);
      debugLog(`Size reduction: ${savingsPercent}%`);

      // Show preview immediately
      const previewUrl = URL.createObjectURL(optimizedBlob);
      setPreviewImageUrl(previewUrl);

      const { apiBaseUrl } = await import('../utils/supabase/info');
      
      // Create FormData to send the optimized file
      const formData = new FormData();
      formData.append('file', optimizedBlob, 'profile.jpg');

      // Upload to backend
      const response = await fetch(
        `${apiBaseUrl}/upload-profile-image`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        debugLog('Image uploaded:', result);
        
        // Clear preview URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewImageUrl(null);
        
        // Update profile image URL
        setProfileImageUrl(result.url);
        
        // Automatically save to profile
        await saveImageToProfile(result.url);
        
        toast.success(`Image uploaded (${savingsPercent}% size reduction)`);
      } else {
        const errorText = await response.text();
        errorLog('Image upload failed:', errorText);
        
        // Clear preview on error
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewImageUrl(null);
        
        toast.error('Failed to upload image. Please try again.');
      }
    } catch (error) {
      errorLog('Error uploading image:', error);
      
      // Clear preview on error
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
      setPreviewImageUrl(null);
      
      toast.error('Error uploading image. Please try again.');
    } finally {
      setIsUploadingImage(false);
      // Clear the file input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const saveImageToProfile = async (imageUrl: string) => {
    try {
      debugLog('Saving optimized image to profile...');
      
      const { authenticatedFetch } = await import('../utils/supabase/apiClient');
      const response = await authenticatedFetch(
        '/profile',
        {
          method: 'PUT',
          body: JSON.stringify({
            profileImageUrl: imageUrl,
          }),
        },
        accessToken
      );

      if (response.ok) {
        debugLog('Optimized image saved to profile successfully');
        
        // Notify parent component
        if (onProfileUpdate) {
          onProfileUpdate({ profileImageUrl: imageUrl });
        }
      } else {
        const errorText = await response.text();
        errorLog('Failed to save image to profile:', errorText);
      }
    } catch (error) {
      errorLog('Error saving image to profile:', error);
    }
  };

  const handleSave = async () => {
    // Validate before saving
    if (!urlSlug || urlSlug.length < 3) {
      toast.error('Event page URL must be at least 3 characters');
      return;
    }

    if (slugAvailable === false) {
      toast.error('Please choose an available URL');
      return;
    }

    setIsSaving(true);
    try {
      debugLog('Saving event page settings...');
      debugLog('Event name to save:', eventName);
      debugLog('URL slug to save:', urlSlug);
      
      const { authenticatedFetch } = await import('../utils/supabase/apiClient');
      const response = await authenticatedFetch(
        '/profile',
        {
          method: 'PUT',
          body: JSON.stringify({
            organizerName: eventName,  // Renamed from eventName to organizerName to match backend
            urlSlug,
            profileImageUrl,
          }),
        },
        accessToken
      );

      debugLog('Save response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        debugLog('Save successful:', result);
        toast.success('Settings saved successfully');
        
        // Update original slug after successful save
        setOriginalUrlSlug(urlSlug);
        
        // Update localStorage with new slug
        localStorage.setItem('oliwonder_event_slug', urlSlug);
        // Mark slug as customized (no longer auto-generated)
        localStorage.removeItem('slug_auto_generated');
        
        // Update current user in localStorage
        const currentUser = localStorage.getItem('oliwonder_current_user');
        if (currentUser) {
          const userData = JSON.parse(currentUser);
          userData.urlSlug = urlSlug;
          userData.eventName = eventName;
          userData.profileImageUrl = profileImageUrl;
          localStorage.setItem('oliwonder_current_user', JSON.stringify(userData));
        }
        
        // Notify parent component of profile update
        if (onProfileUpdate) {
          onProfileUpdate({ urlSlug, eventName, profileImageUrl });
        }
      } else {
        const errorText = await response.text();
        errorLog('Failed to save settings:', response.status, errorText);
        toast.error(`Failed to save settings: ${response.status}`);
      }
    } catch (error) {
      errorLog('Error saving settings:', error);
      toast.error('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1">
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="mb-8">
          <h1 className="mb-2">Event page settings</h1>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Card><CardHeader><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-64 mt-1" /></CardHeader><CardContent><div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-24 w-24 rounded-full" /></div></CardContent></Card>
          </div>
        ) : (
        <>

        <div className="space-y-6">
          {/* Public Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Event page</CardTitle>
              <CardDescription>
                This information is visible on your event page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Event Name Field */}
              <div>
                <Label htmlFor="eventName">Event organizer name</Label>
                <div className="max-w-sm">
                  <Input 
                    id="eventName"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="My networking event"
                    className="mt-2"
                  />
                </div>
              </div>

              {/* URL Slug Field */}
              <div ref={urlSlugFieldRef}>
                <Label htmlFor="urlSlug">Event page URL</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 max-w-sm">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      wonderelo.com/
                    </span>
                    <div className="relative flex-1">
                      <Input 
                        id="urlSlug"
                        value={urlSlug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder="my-event"
                        className="pr-10"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isCheckingSlug && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {!isCheckingSlug && slugAvailable === true && urlSlug !== '' && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                        {!isCheckingSlug && slugAvailable === false && (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </div>
                  </div>
                  {slugError && (
                    <p className="text-xs text-destructive">{slugError}</p>
                  )}
                  {!slugError && slugAvailable === true && urlSlug !== originalUrlSlug && (
                    <p className="text-xs text-green-600">This URL is available</p>
                  )}
                </div>
              </div>

              {/* Profile Image Upload */}
              <div>
                <Label htmlFor="profileImage">Profile image</Label>
                
                <div className="flex items-start gap-4 mt-3">
                  {/* Image Preview */}
                  <div className="shrink-0 relative">
                    {(previewImageUrl || profileImageUrl) ? (
                      <>
                        <img 
                          src={previewImageUrl || profileImageUrl} 
                          alt="Profile" 
                          className="h-20 w-20 rounded-full object-cover border-2 border-border"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        {isUploadingImage && (
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                          </div>
                        )}
                      </>
                    ) : null}
                    <div 
                      className={`h-20 w-20 rounded-full bg-muted flex items-center justify-center ${(previewImageUrl || profileImageUrl) ? 'hidden' : ''}`}
                    >
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  
                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2 max-w-sm">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="w-full"
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload image
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {isUploadingImage 
                        ? 'Optimizing image...' 
                        : 'JPG, PNG, WEBP, GIF, HEIC • Up to 5MB • 200x200px or larger'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </div>
        </>
        )}
      </div>

    </div>
  );
}