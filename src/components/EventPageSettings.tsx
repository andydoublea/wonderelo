import { useState, useEffect, useRef, RefObject, CSSProperties } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { optimizeImage, formatFileSize } from '../utils/imageOptimization';
import { debugLog, errorLog } from '../utils/debug';
import { C, PageShell, PageHead, Italic } from './redesign/organizerAtoms';
import { EventPagePreview } from './redesign/EventPagePreview';

// Read a Blob as a base64 data URL. Used to persist the optimized profile image
// inline via PUT /profile — this app has no image-upload endpoint and no Storage
// bucket wired, and organizer_profiles.profile_image_url is a TEXT column.
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image'));
    reader.readAsDataURL(blob);
  });
}

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
  // Event initials for the gradient empty-state avatar (design shows "FS").
  const eventInitials = (eventName || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('');

  // Live slug-availability field state (Claude Design v07 · screen-event-settings.jsx UrlField).
  // Wired to the real /check-slug logic (isCheckingSlug / slugAvailable / slugError).
  const slugChecking = isCheckingSlug;
  const slugOk = !isCheckingSlug && slugAvailable === true && urlSlug !== '';
  const slugBad = !isCheckingSlug && slugAvailable === false;
  const slugTaken = slugBad && slugError === 'This URL is already taken';
  const slugBorder = slugBad ? '#c0392b' : (slugOk ? '#1f8a4d' : C.orange);

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
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 440px', gap: 28, alignItems: 'start' }}>
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

              {/* Event page URL — live availability check (Claude Design v07 · screen-event-settings.jsx UrlField).
                  Checks as you type: orange spinner "Checking…", green "available", red X + "already taken" / invalid. */}
              <div ref={urlSlugFieldRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <style>{`@keyframes wz-spin{to{transform:rotate(360deg)}}`}</style>
                <span style={labelStyle}>Event page URL</span>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11, background: '#fff',
                  border: `1.5px solid ${slugBorder}`,
                  boxShadow: `0 0 0 3px ${slugBad ? 'rgba(192,57,43,.10)' : (slugOk ? 'rgba(31,138,77,.10)' : 'rgba(221,83,28,.10)')}`,
                  transition: 'border-color .15s, box-shadow .15s',
                }}>
                  <span style={{ color: C.ink, opacity: .6, fontSize: 13.5, fontFamily: C.fontMono, whiteSpace: 'nowrap' }}>wonderelo.com /</span>
                  <input
                    id="urlSlug"
                    type="text"
                    value={urlSlug}
                    onChange={(e) => onSlugChange(e.target.value)}
                    placeholder="my-event"
                    spellCheck={false}
                    style={inputStyle}
                  />
                  {slugChecking && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: C.fontMono, fontSize: 11.5, color: C.ink, opacity: .6 }}>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(76,25,77,.16)', borderTopColor: C.orange, animation: 'wz-spin .8s linear infinite' }} />Checking…
                    </span>
                  )}
                  {slugOk && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: C.fontMono, fontSize: 12, fontWeight: 600, color: '#1f8a4d' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>available
                    </span>
                  )}
                  {slugBad && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', color: '#c0392b' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 12, lineHeight: 1.5, color: slugBad ? '#c0392b' : C.ink, opacity: slugBad ? 1 : .65 }}>
                  {slugChecking ? 'Checking availability…'
                    : slugTaken ? <><strong style={{ fontWeight: 700 }}>wonderelo.com/{urlSlug}</strong> is already taken. Try {urlSlug}-2026.</>
                    : slugBad ? 'Use at least 3 characters — lowercase letters, numbers and dashes only.'
                    : 'This is the link you share with attendees.'}
                </span>
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
                      width: 80, height: 80, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${C.purpleDeep} 0%, ${C.purple} 60%, ${C.orange} 130%)`,
                      alignItems: 'center', justifyContent: 'center', border: `2px solid ${C.hair}`, overflow: 'hidden',
                      display: hasImage ? 'none' : 'flex',
                    }}>
                      <span style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 28, color: '#fff', letterSpacing: '-.02em' }}>{eventInitials}</span>
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

            {/* Event page preview — the REAL public event page rendered live in a
                browser-chrome frame (design/v08 screen-event-settings.jsx uses an
                iframe of Event Page.html here). Shares the exact `.ev-*` miniature
                the Round form uses, so the settings preview tracks the live page 1:1.
                With no round data it shows the real `.ev-empty` state. */}
            <div style={{ position: 'sticky', top: 96 }}>
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, background: C.orange, transform: 'rotate(45deg)', display: 'inline-block' }} />
                <span style={{ fontFamily: C.fontBody, fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.purpleDeep }}>Event page preview</span>
              </div>
              <div style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${C.hairStrong}`, background: '#fff', boxShadow: '0 22px 48px rgba(75,29,81,.16)' }}>
                <div style={{ padding: '11px 16px', background: C.purpleDeep, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'inline-flex', gap: 5 }}>{['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}</span>
                  <span style={{ fontFamily: C.fontMono, fontSize: 10.5, opacity: .8 }}>wonderelo.com/{urlSlug || 'your-event'}</span>
                </div>
                <div style={{ maxHeight: 760, overflowY: 'auto', overflowX: 'hidden', background: C.cream }}>
                  <EventPagePreview eventName={eventName} profileImageUrl={previewImageUrl || profileImageUrl} />
                </div>
              </div>
              <p style={{ margin: '12px 2px 0', fontSize: 12, color: C.ink, opacity: .6, lineHeight: 1.5 }}>Changes here update your public event page.</p>
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
        // Event page settings edit the EVENT name (event_name), which is
        // independent from the organizer's personal name (organizerName)
        // edited on Account Settings. Do NOT fall back to organizerName here.
        setEventName(profile.eventName || '');
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

    let previewUrl: string | null = null;
    try {
      // Optimize image on frontend
      debugLog(`Original image: ${formatFileSize(file.size)}`);
      const optimizedBlob = await optimizeImage(file, 400, 0.85);
      debugLog(`Optimized image: ${formatFileSize(optimizedBlob.size)}`);

      const savingsPercent = Math.round((1 - optimizedBlob.size / file.size) * 100);
      debugLog(`Size reduction: ${savingsPercent}%`);

      // Show preview immediately
      previewUrl = URL.createObjectURL(optimizedBlob);
      setPreviewImageUrl(previewUrl);

      // There is no image-upload endpoint (POST /upload-profile-image 404s) and no
      // Storage bucket is wired anywhere in the app. Persist the optimized image
      // inline as a base64 data URL via the existing (working) PUT /profile route —
      // organizer_profiles.profile_image_url is TEXT, and the image is already resized
      // to a small 400px / 16:9 JPEG @0.85, so the encoded string stays modest.
      const dataUrl = await blobToDataUrl(optimizedBlob);

      // Swap the transient object-URL preview for the persistent data URL.
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
      setPreviewImageUrl(null);
      setProfileImageUrl(dataUrl);

      // Persist to the profile. saveImageToProfile reports success/failure so we
      // never show a success toast for a save that silently failed.
      const saved = await saveImageToProfile(dataUrl);
      if (saved) {
        toast.success(`Image uploaded (${savingsPercent}% size reduction)`);
      } else {
        toast.error('Failed to save image. Please try again.');
      }
    } catch (error) {
      errorLog('Error uploading image:', error);

      // Clear preview on error
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
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

  const saveImageToProfile = async (imageUrl: string): Promise<boolean> => {
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
        return true;
      } else {
        const errorText = await response.text();
        errorLog('Failed to save image to profile:', errorText);
        return false;
      }
    } catch (error) {
      errorLog('Error saving image to profile:', error);
      return false;
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
            eventName,  // EVENT name — persisted to organizer_profiles.event_name, independent of the person's organizerName
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

