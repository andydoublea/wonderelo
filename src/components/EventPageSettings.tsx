import { useState, useEffect, useRef, RefObject, CSSProperties } from 'react';
import { Loader2, Check, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { optimizeImage, formatFileSize } from '../utils/imageOptimization';
import { debugLog, errorLog } from '../utils/debug';
import { C, PageShell, PageHead, Italic } from './redesign/organizerAtoms';

interface EventPageSettingsProps {
  accessToken: string;
  onBack: () => void;
  onProfileUpdate?: (updates: { urlSlug?: string; eventName?: string; profileImageUrl?: string }) => void;
}

// ============================================================
// Pure view (shared with AdminPagePreview)
// ============================================================

export interface EventPageSettingsViewProps {
  eventName: string;
  urlSlug: string;
  originalUrlSlug: string;
  profileImageUrl: string;
  previewImageUrl: string | null;
  isLoading: boolean;
  isSaving: boolean;
  isCheckingSlug: boolean;
  slugAvailable: boolean | null;
  slugError: string;
  isUploadingImage: boolean;
  urlSlugFieldRef?: RefObject<HTMLDivElement>;
  fileInputRef?: RefObject<HTMLInputElement>;
  onEventNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenFilePicker: () => void;
  onSave: () => void;
}

export function EventPageSettingsView({
  eventName,
  urlSlug,
  originalUrlSlug,
  profileImageUrl,
  previewImageUrl,
  isLoading,
  isSaving,
  isCheckingSlug,
  slugAvailable,
  slugError,
  isUploadingImage,
  urlSlugFieldRef,
  fileInputRef,
  onEventNameChange,
  onSlugChange,
  onImageUpload,
  onOpenFilePicker,
  onSave,
}: EventPageSettingsViewProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const labelStyle: CSSProperties = {
    fontFamily: C.fontBody, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em',
    color: C.purpleDeep, textTransform: 'uppercase',
  };
  const fieldBox = (isFocused: boolean): CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11,
    background: '#fff', border: `1.5px solid ${isFocused ? C.orange : C.hairStrong}`,
    boxShadow: isFocused ? '0 0 0 3px rgba(221,83,28,.10)' : 'none',
    transition: 'border-color .15s, box-shadow .15s',
  });
  const inputStyle: CSSProperties = {
    flex: 1, border: 'none', outline: 'none', background: 'transparent',
    fontFamily: C.fontBody, fontSize: 14, color: C.ink, minWidth: 0,
  };
  const green = '#16a34a';
  const red = '#dc2626';
  const hasImage = Boolean(previewImageUrl || profileImageUrl);

  return (
    <div className="wonderelo" style={{ flex: 1, minWidth: 0 }}>
      <PageShell nav={false} footer={false}>
        <PageHead
          eyebrow="Event page"
          title={<>Event page <Italic>settings</Italic></>}
          lede="This information is visible on your event page."
        />

        {isLoading ? (
          <div style={{ maxWidth: 720 }}>
            <section style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 18, padding: 28 }}>
              <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ height: 18, width: 160, borderRadius: 8, background: C.hair }} />
                <div style={{ height: 44, width: '100%', borderRadius: 11, background: C.hair }} />
                <div style={{ height: 44, width: '100%', borderRadius: 11, background: C.hair }} />
                <div style={{ height: 80, width: 80, borderRadius: '50%', background: C.hair }} />
              </div>
            </section>
          </div>
        ) : (
          <div style={{ maxWidth: 720 }}>
            <section style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 18, padding: 28 }}>
              <h3 style={{ margin: '0 0 6px', fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 19, color: C.purpleDeep, letterSpacing: '-0.015em' }}>Event page</h3>
              <p style={{ margin: '0 0 24px', fontSize: 13, color: C.ink, opacity: .68 }}>This information is visible on your event page</p>

              {/* Event organizer name */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={labelStyle}>Event organizer name</span>
                <div style={fieldBox(focusedField === 'eventName')}>
                  <input
                    id="eventName"
                    type="text"
                    value={eventName}
                    onChange={(e) => onEventNameChange(e.target.value)}
                    onFocus={() => setFocusedField('eventName')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="My networking event"
                    style={inputStyle}
                  />
                </div>
              </label>

              <div style={{ height: 22 }} />

              {/* Event page URL */}
              <div ref={urlSlugFieldRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={labelStyle}>Event page URL</span>
                <div style={fieldBox(focusedField === 'urlSlug')}>
                  <span style={{ color: C.ink, opacity: .6, fontSize: 13.5, fontFamily: C.fontMono, whiteSpace: 'nowrap' }}>wonderelo.com /</span>
                  <input
                    id="urlSlug"
                    type="text"
                    value={urlSlug}
                    onChange={(e) => onSlugChange(e.target.value)}
                    onFocus={() => setFocusedField('urlSlug')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="my-event"
                    style={inputStyle}
                  />
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {isCheckingSlug && <Loader2 className="animate-spin" style={{ width: 16, height: 16, color: C.ink, opacity: .5 }} />}
                    {!isCheckingSlug && slugAvailable === true && urlSlug !== '' && <Check style={{ width: 16, height: 16, color: green }} />}
                    {!isCheckingSlug && slugAvailable === false && <X style={{ width: 16, height: 16, color: red }} />}
                  </span>
                </div>
                {slugError && <span style={{ fontSize: 11.5, color: red }}>{slugError}</span>}
                {!slugError && slugAvailable === true && urlSlug !== originalUrlSlug && (
                  <span style={{ fontSize: 11.5, color: green }}>This URL is available</span>
                )}
              </div>

              <div style={{ height: 24 }} />

              {/* Profile image */}
              <div>
                <span style={labelStyle}>Profile image</span>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginTop: 12 }}>
                  <div style={{ width: 80, height: 80, flexShrink: 0, position: 'relative' }}>
                    {hasImage ? (
                      <>
                        <img
                          src={previewImageUrl || profileImageUrl}
                          alt="Profile"
                          style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.hair}`, display: 'block' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        {isUploadingImage && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: '#fff' }} />
                          </div>
                        )}
                      </>
                    ) : null}
                    <div style={{
                      width: 80, height: 80, borderRadius: '50%', background: C.paperDeep,
                      alignItems: 'center', justifyContent: 'center', border: `2px solid ${C.hair}`,
                      display: hasImage ? 'none' : 'flex',
                    }}>
                      <ImageIcon style={{ width: 32, height: 32, color: C.ink, opacity: .45 }} />
                    </div>
                  </div>

                  <div style={{ flex: 1, maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 9 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                      style={{ display: 'none' }}
                      onChange={onImageUpload}
                    />
                    <button
                      type="button"
                      onClick={onOpenFilePicker}
                      disabled={isUploadingImage}
                      style={{
                        width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                        padding: '11px 16px', borderRadius: 11, background: '#fff', border: `1.5px solid ${C.hairStrong}`,
                        color: C.purpleDeep, fontFamily: C.fontBody, fontWeight: 600, fontSize: 14,
                        cursor: isUploadingImage ? 'not-allowed' : 'pointer', opacity: isUploadingImage ? .6 : 1, whiteSpace: 'nowrap',
                      }}
                    >
                      {isUploadingImage ? (
                        <><Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />Uploading...</>
                      ) : (
                        <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>Upload image</>
                      )}
                    </button>
                    <p style={{ margin: 0, fontSize: 12, color: C.ink, opacity: .6, lineHeight: 1.5 }}>
                      {isUploadingImage ? 'Optimizing image...' : 'JPG, PNG, WEBP, GIF, HEIC · Up to 5MB · 200×200px or larger'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Save changes */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px 16px', borderRadius: 12, border: '1px solid transparent',
                  background: C.orange, color: '#fff', fontFamily: C.fontBody, fontWeight: 600, fontSize: 14,
                  boxShadow: '0 6px 16px rgba(221,83,28,.25)', whiteSpace: 'nowrap',
                  cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? .6 : 1,
                }}
              >
                {isSaving ? (
                  <><Loader2 className="animate-spin" style={{ width: 15, height: 15 }} />Saving...</>
                ) : (
                  <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>Save changes</>
                )}
              </button>
            </div>
          </div>
        )}
      </PageShell>
    </div>
  );
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
    <EventPageSettingsView
      eventName={eventName}
      urlSlug={urlSlug}
      originalUrlSlug={originalUrlSlug}
      profileImageUrl={profileImageUrl}
      previewImageUrl={previewImageUrl}
      isLoading={isLoading}
      isSaving={isSaving}
      isCheckingSlug={isCheckingSlug}
      slugAvailable={slugAvailable}
      slugError={slugError}
      isUploadingImage={isUploadingImage}
      urlSlugFieldRef={urlSlugFieldRef}
      fileInputRef={fileInputRef}
      onEventNameChange={setEventName}
      onSlugChange={handleSlugChange}
      onImageUpload={handleImageUpload}
      onOpenFilePicker={() => fileInputRef.current?.click()}
      onSave={handleSave}
    />
  );
}

