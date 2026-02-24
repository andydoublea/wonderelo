import { optimizeImage, MEETING_POINT_ASPECT_RATIO } from './imageOptimization';
import { apiBaseUrl } from './supabase/info';
import { MeetingPoint } from '../App';

/**
 * Regenerates meeting point images from originals with current aspect ratio
 * @param meetingPoints - Array of meeting points with originalImageUrl
 * @param accessToken - Supabase access token for upload
 * @param onProgress - Optional callback for progress updates
 * @returns Updated meeting points with new imageUrls
 */
export async function regenerateMeetingPointImages(
  meetingPoints: MeetingPoint[],
  accessToken: string,
  onProgress?: (current: number, total: number, pointName: string) => void
): Promise<MeetingPoint[]> {
  const regeneratedPoints: MeetingPoint[] = [];
  const pointsToRegenerate = meetingPoints.filter(mp => mp.originalImageUrl);
  
  console.log(`Regenerating ${pointsToRegenerate.length} meeting point images...`);

  for (let i = 0; i < meetingPoints.length; i++) {
    const point = meetingPoints[i];
    
    // Skip if no original image
    if (!point.originalImageUrl) {
      console.log(`Skipping ${point.name} - no original image`);
      regeneratedPoints.push(point);
      continue;
    }

    try {
      onProgress?.(i + 1, meetingPoints.length, point.name);
      console.log(`Processing ${i + 1}/${meetingPoints.length}: ${point.name}`);

      // Download original image
      const response = await fetch(point.originalImageUrl);
      if (!response.ok) {
        throw new Error('Failed to download original image');
      }

      const blob = await response.blob();
      const file = new File([blob], 'original.jpg', { type: blob.type });

      // Optimize with current aspect ratio
      const optimizedBlob = await optimizeImage(file, 800, 0.85);
      const optimizedFile = new File([optimizedBlob], 'optimized.jpg', {
        type: 'image/jpeg'
      });

      console.log(`Uploading regenerated image for: ${point.name}`);

      // Upload both files (original stays the same, but we send it to maintain consistency)
      const formData = new FormData();
      formData.append('image', optimizedFile);
      formData.append('original', file);

      const uploadUrl = `${apiBaseUrl}/upload-meeting-point-image`;
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await uploadResponse.json();

      if (!data.success || !data.imageUrl) {
        throw new Error('Invalid response from server');
      }

      // Use new optimized URL, keep original URL (or use new one if provided)
      regeneratedPoints.push({
        ...point,
        imageUrl: data.imageUrl,
        originalImageUrl: data.originalImageUrl || point.originalImageUrl
      });

      console.log(`✅ Regenerated: ${point.name}`);

    } catch (error) {
      console.error(`Failed to regenerate ${point.name}:`, error);
      // Keep old version on error
      regeneratedPoints.push(point);
    }
  }

  const successCount = regeneratedPoints.filter((p, i) => 
    p.imageUrl !== meetingPoints[i].imageUrl
  ).length;

  console.log(`Regeneration complete: ${successCount}/${pointsToRegenerate.length} images updated`);

  return regeneratedPoints;
}

/**
 * Downloads an image from URL and converts it to a File object
 */
export async function downloadImageAsFile(url: string, filename: string = 'image.jpg'): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to download image');
  }
  
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
}
