import { useState, useRef, useEffect } from 'react';
import { MeetingPoint } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { MapPin, X, Upload, Image as ImageIcon, Loader2, Plus, Video, Building2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { optimizeImage, formatFileSize } from '../utils/imageOptimization';
import { ImageWithFallback } from './figma/ImageWithFallback';
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
      const { projectId } = await import('../utils/supabase/info');
      
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
        projectId,
        hasAccessToken: !!accessToken,
        fileSize: optimizedFile.size,
        fileType: optimizedFile.type
      });

      // Update localStorage with fresh token
      localStorage.setItem('supabase_access_token', accessToken);

      const formData = new FormData();
      formData.append('image', optimizedFile);
      formData.append('original', file); // Send original file too

      const uploadUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/upload-meeting-point-image`;
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

  return (
    <div className="space-y-3">
      {normalizedPoints.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Loading...
        </p>
      ) : (
        <div className="space-y-3">
          {normalizedPoints.map((point, index) => (
            <Card key={point.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="e.g. By the tree at main lobby, Table 1, ..."
                      value={point.name}
                      onChange={(e) => updateMeetingPointName(index, e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMeetingPoint(index)}
                    className="h-10 w-10 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Type toggle: Physical / Virtual */}
                <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
                  <button
                    type="button"
                    onClick={() => updateMeetingPointType(index, 'physical')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      (!point.type || point.type === 'physical')
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    Physical
                  </button>
                  <button
                    type="button"
                    onClick={() => updateMeetingPointType(index, 'virtual')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      point.type === 'virtual'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Video className="h-3.5 w-3.5" />
                    Virtual
                  </button>
                </div>

                {/* Video call URL (virtual only) */}
                {point.type === 'virtual' && (
                  <div className="space-y-1">
                    <Label htmlFor={`video-url-${point.id}`} className="text-sm">
                      Video call link
                    </Label>
                    <Input
                      id={`video-url-${point.id}`}
                      placeholder="e.g. https://meet.google.com/abc-defg-hij"
                      value={point.videoCallUrl || ''}
                      onChange={(e) => updateMeetingPointVideoUrl(index, e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Participants will see this link instead of a physical location
                    </p>
                  </div>
                )}

                {/* Image upload section (physical only) */}
                {(!point.type || point.type === 'physical') && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`add-photo-${point.id}`}
                      checked={expandedPhotos.has(point.id)}
                      onCheckedChange={() => togglePhotoExpanded(point.id)}
                    />
                    <label
                      htmlFor={`add-photo-${point.id}`}
                      className="text-sm cursor-pointer select-none"
                    >
                      Add photo
                    </label>
                  </div>
                  
                  {expandedPhotos.has(point.id) && (
                    <>
                      {point.imageUrl ? (
                        <div className="relative">
                          <div className="w-full aspect-video overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                            <ImageWithFallback
                              src={point.imageUrl}
                              alt={point.name || 'Meeting point'}
                              className="w-full h-auto"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(index, file);
                              }
                            }}
                            className="hidden"
                            id={`meeting-point-image-${index}`}
                            disabled={uploadingIndex === index}
                          />
                          <label
                            htmlFor={`meeting-point-image-${index}`}
                            className={`flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors ${
                              uploadingIndex === index ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {uploadingIndex === index ? (
                              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                            ) : (
                              <>
                                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  Click to upload photo
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  JPG, PNG, WEBP, GIF, HEIC • Max 10MB
                                </p>
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
            </Card>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addMeetingPoint}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add meeting point
      </Button>
    </div>
  );
}