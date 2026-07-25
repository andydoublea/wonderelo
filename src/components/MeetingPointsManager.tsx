import { useState, useRef, useEffect } from 'react';
import { MeetingPoint } from '../App';
import { X, Image as ImageIcon, Loader2, Plus, Video, Building2, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { optimizeImage, formatFileSize } from '../utils/imageOptimization';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { C } from './redesign/organizerAtoms';
import { debugLog, errorLog } from '../utils/debug';

interface MeetingPointsManagerProps {
  meetingPoints: MeetingPoint[];
  onChange: (meetingPoints: MeetingPoint[]) => void;
}

export function MeetingPointsManager({ meetingPoints, onChange }: MeetingPointsManagerProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [expandedPhotos, setExpandedPhotos] = useState<Set<string>>(new Set());

  // Keep a ref to the latest meetingPoints to avoid stale closure issues
  const meetingPointsRef = useRef<MeetingPoint[]>(meetingPoints);

  useEffect(() => {
    meetingPointsRef.current = meetingPoints;
  }, [meetingPoints]);

  // Initialize with one empty meeting point if none exist
  useEffect(() => {
    if (meetingPoints.length === 0) {
      const initialPoint: MeetingPoint = {
        id: `mp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: '',
        imageUrl: undefined
      };
      onChange([initialPoint]);
    }
  }, []);

  // Normalize meeting points to always be objects
  const normalizedPoints: MeetingPoint[] = meetingPoints.map((point, index) => {
    if (typeof point === 'string') {
      return {
        id: `mp_legacy_${index}`,
        name: point,
        imageUrl: undefined
      };
    }
    return point;
  });

  const addMeetingPoint = () => {
    onChange([
      ...normalizedPoints,
      {
        id: `mp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: '',
        imageUrl: undefined
      }
    ]);
  };

  const removeMeetingPoint = (index: number) => {
    onChange(normalizedPoints.filter((_, i) => i !== index));
  };

  const updateMeetingPointName = (index: number, name: string) => {
    const updated = [...normalizedPoints];
    updated[index] = { ...updated[index], name };
    onChange(updated);
  };

  const updateMeetingPointType = (index: number, type: 'physical' | 'virtual') => {
    const updated = [...normalizedPoints];
    updated[index] = {
      ...updated[index],
      type,
      // Clear irrelevant fields when switching type
      ...(type === 'virtual' ? { imageUrl: undefined, originalImageUrl: undefined } : { videoCallUrl: undefined })
    };
    onChange(updated);
  };

  const updateMeetingPointVideoUrl = (index: number, videoCallUrl: string) => {
    const updated = [...normalizedPoints];
    updated[index] = { ...updated[index], videoCallUrl };
    onChange(updated);
  };

  const handleImageUpload = async (index: number, file: File) => {
    // Validate file type - check both MIME type and extension for HEIC support
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = file.type.startsWith('image/') || validExtensions.includes(fileExtension);

    if (!isValidType) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    try {
      setUploadingIndex(index);

      // Optimize image
      const optimizedBlob = await optimizeImage(file, 800, 0.85);
      const optimizedFile = new File([optimizedBlob], file.name, {
        type: 'image/jpeg'
      });

      debugLog(`Original size: ${formatFileSize(file.size)}, Optimized size: ${formatFileSize(optimizedFile.size)}`);

      // Upload to server with auto token refresh
      const { supabase } = await import('../utils/supabase/client');
      const { apiBaseUrl } = await import('../utils/supabase/info');

      // Get fresh session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      debugLog('=== SESSION CHECK FOR UPLOAD ===');
      debugLog('Session data:', {
        hasSession: !!session,
        hasError: !!sessionError,
        errorMessage: sessionError?.message,
        sessionKeys: session ? Object.keys(session) : null,
        hasAccessToken: !!session?.access_token
      });

      if (sessionError) {
        errorLog('Session error object:', sessionError);
        toast.error(`Session error: ${sessionError.message}`);
        return;
      }

      if (!session?.access_token) {
        errorLog('❌ No session found');
        toast.error('Not authenticated. Please sign in again.');
        return;
      }

      const accessToken = session.access_token;
      debugLog('✅ Using token from Supabase session');
      debugLog('Upload config:', {
        apiBaseUrl,
        hasAccessToken: !!accessToken,
        fileSize: optimizedFile.size,
        fileType: optimizedFile.type
      });

      // Update localStorage with fresh token
      localStorage.setItem('supabase_access_token', accessToken);

      const formData = new FormData();
      formData.append('image', optimizedFile);
      formData.append('original', file); // Send original file too

      const uploadUrl = `${apiBaseUrl}/upload-meeting-point-image`;
      debugLog('Uploading to:', uploadUrl);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        errorLog('Upload failed:', response.status, errorData);
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      debugLog('Upload response:', data);

      if (!data.success || !data.imageUrl) {
        throw new Error('Invalid response from server');
      }

      // Update meeting point with both image URLs using the latest state from ref
      const currentPoints = meetingPointsRef.current.map((point, idx) => {
        if (typeof point === 'string') {
          return {
            id: `mp_legacy_${idx}`,
            name: point,
            imageUrl: undefined
          };
        }
        return point;
      });

      const updated = [...currentPoints];
      updated[index] = {
        ...updated[index],
        imageUrl: data.imageUrl,
        originalImageUrl: data.originalImageUrl
      };
      onChange(updated);

      toast.success('Image uploaded successfully');
    } catch (error) {
      errorLog('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadingIndex(null);
    }
  };

  const removeImage = (index: number) => {
    const updated = [...normalizedPoints];
    updated[index] = {
      ...updated[index],
      imageUrl: undefined,
      originalImageUrl: undefined
    };
    onChange(updated);
  };

  const togglePhotoExpanded = (pointId: string) => {
    setExpandedPhotos(prev => {
      const next = new Set(prev);
      if (next.has(pointId)) {
        next.delete(pointId);
      } else {
        next.add(pointId);
      }
      return next;
    });
  };

  // ── styling helpers (mock: editable list / round-form field language) ──
  const fieldInput: React.CSSProperties = {
    flex: 1, border: 'none', outline: 'none', background: 'transparent',
    fontFamily: C.fontBody, fontSize: 14, color: C.ink, minWidth: 0,
  };
  const lbl: React.CSSProperties = {
    fontFamily: C.fontBody, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em',
    color: C.purpleDeep, textTransform: 'uppercase',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {normalizedPoints.length === 0 ? (
        <p style={{ fontSize: 13, color: C.ink, opacity: 0.6 }}>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {normalizedPoints.map((point, index) => (
            <div key={point.id} style={{ border: `1px solid ${C.hair}`, borderRadius: 14, padding: 14, background: '#fff' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Name row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: `1px solid ${C.hair}`, borderRadius: 11, background: C.cream }}>
                  <input
                    placeholder="e.g. By the tree at main lobby, Table 1, ..."
                    value={point.name}
                    onChange={(e) => updateMeetingPointName(index, e.target.value)}
                    style={fieldInput}
                  />
                  <span
                    onClick={() => removeMeetingPoint(index)}
                    role="button"
                    aria-label="Remove meeting point"
                    style={{ color: '#c0392b', cursor: 'pointer', display: 'inline-flex', flexShrink: 0 }}
                  >
                    <X width={15} height={15} />
                  </span>
                </div>

                {/* Type toggle: Physical / Virtual */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: 3, background: 'rgba(76,25,77,.06)', borderRadius: 10, width: 'fit-content' }}>
                  {([
                    { key: 'physical' as const, icon: <Building2 width={14} height={14} />, label: 'Physical', active: (!point.type || point.type === 'physical') },
                    { key: 'virtual' as const, icon: <Video width={14} height={14} />, label: 'Virtual', active: point.type === 'virtual' },
                  ]).map((seg) => (
                    <button
                      key={seg.key}
                      type="button"
                      onClick={() => updateMeetingPointType(index, seg.key)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                        borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: C.fontBody,
                        fontSize: 13, fontWeight: 600,
                        background: seg.active ? '#fff' : 'transparent',
                        color: seg.active ? C.purpleDeep : 'rgba(58,46,52,.55)',
                        boxShadow: seg.active ? '0 1px 3px rgba(75,29,81,.12)' : 'none',
                      }}
                    >
                      {seg.icon}
                      {seg.label}
                    </button>
                  ))}
                </div>

                {/* Video call URL (virtual only) */}
                {point.type === 'virtual' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label htmlFor={`video-url-${point.id}`} style={lbl}>Video call link</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11, background: '#fff', border: `1.5px solid ${C.hairStrong}` }}>
                      <input
                        id={`video-url-${point.id}`}
                        placeholder="e.g. https://meet.google.com/abc-defg-hij"
                        value={point.videoCallUrl || ''}
                        onChange={(e) => updateMeetingPointVideoUrl(index, e.target.value)}
                        style={fieldInput}
                      />
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: C.ink, opacity: 0.6 }}>
                      Participants will see this link instead of a physical location
                    </p>
                  </div>
                )}

                {/* Image upload section (physical only) */}
                {(!point.type || point.type === 'physical') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label
                      htmlFor={`add-photo-${point.id}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', fontSize: 13.5, color: C.ink, width: 'fit-content' }}
                    >
                      <span
                        id={`add-photo-${point.id}`}
                        onClick={() => togglePhotoExpanded(point.id)}
                        role="checkbox"
                        aria-checked={expandedPhotos.has(point.id)}
                        style={{
                          width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          background: expandedPhotos.has(point.id) ? C.orange : '#fff',
                          border: `1.5px solid ${expandedPhotos.has(point.id) ? C.orange : C.hairStrong}`,
                          color: '#fff',
                        }}
                      >
                        {expandedPhotos.has(point.id) && <Check width={12} height={12} strokeWidth={3.2} />}
                      </span>
                      Add photo
                    </label>

                    {expandedPhotos.has(point.id) && (
                      <>
                        {point.imageUrl ? (
                          <div style={{ position: 'relative' }}>
                            <div style={{ width: '100%', aspectRatio: '16 / 9', overflow: 'hidden', borderRadius: 11, background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ImageWithFallback
                                src={point.imageUrl}
                                alt={point.name || 'Meeting point'}
                                className="w-full h-auto"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              aria-label="Remove image"
                              style={{
                                position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 8,
                                border: 'none', cursor: 'pointer', background: '#c0392b', color: '#fff',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              <X width={16} height={16} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ position: 'relative' }}>
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageUpload(index, file);
                                }
                              }}
                              style={{ display: 'none' }}
                              id={`meeting-point-image-${index}`}
                              disabled={uploadingIndex === index}
                            />
                            <label
                              htmlFor={`meeting-point-image-${index}`}
                              style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                width: '100%', aspectRatio: '16 / 9', border: `2px dashed ${C.hairStrong}`, borderRadius: 11,
                                cursor: uploadingIndex === index ? 'not-allowed' : 'pointer',
                                background: C.cream, opacity: uploadingIndex === index ? 0.5 : 1,
                              }}
                            >
                              {uploadingIndex === index ? (
                                <Loader2 width={32} height={32} className="animate-spin" style={{ color: 'rgba(58,46,52,.5)' }} />
                              ) : (
                                <>
                                  <ImageIcon width={32} height={32} style={{ color: 'rgba(58,46,52,.5)', marginBottom: 8 }} />
                                  <p style={{ margin: 0, fontSize: 13.5, color: C.ink, opacity: 0.7 }}>Click to upload photo</p>
                                  <p style={{ margin: '4px 0 0', fontSize: 11.5, color: C.ink, opacity: 0.5 }}>JPG, PNG, WEBP, GIF, HEIC • Max 10MB</p>
                                </>
                              )}
                            </label>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addMeetingPoint}
        style={{
          width: '100%', padding: '11px 14px', background: 'transparent', borderRadius: 11,
          border: `1.5px solid ${C.hairStrong}`, color: C.purpleDeep, fontSize: 13.5, fontWeight: 600,
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center',
          fontFamily: C.fontBody,
        }}
      >
        <Plus width={15} height={15} />
        Add meeting point
      </button>
    </div>
  );
}
