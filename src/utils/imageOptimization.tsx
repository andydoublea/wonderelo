/**
 * Default aspect ratio for meeting point images
 * Change this value to regenerate all images with a new aspect ratio
 */
export const MEETING_POINT_ASPECT_RATIO = 16 / 9;

/**
 * Optimizes an image file by resizing and compressing it
 * @param file - The original image file
 * @param maxSize - Maximum width (height will be calculated to maintain aspect ratio)
 * @param quality - JPEG quality (0-1)
 * @returns Optimized image as a Blob with configured aspect ratio
 */
export const optimizeImage = async (
  file: File,
  maxSize: number = 400,
  quality: number = 0.85
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate dimensions - preserve aspect ratio
        const targetAspectRatio = MEETING_POINT_ASPECT_RATIO;
        const sourceAspectRatio = img.width / img.height;
        
        let sourceWidth = img.width;
        let sourceHeight = img.height;
        let cropX = 0;
        let cropY = 0;
        
        // Crop to 16:9 if needed
        if (sourceAspectRatio > targetAspectRatio) {
          // Source is wider - crop width
          sourceWidth = img.height * targetAspectRatio;
          cropX = (img.width - sourceWidth) / 2;
        } else if (sourceAspectRatio < targetAspectRatio) {
          // Source is taller - crop height
          sourceHeight = img.width / targetAspectRatio;
          cropY = (img.height - sourceHeight) / 2;
        }

        // Set canvas size to target size (maintaining 16:9)
        let targetWidth = maxSize;
        let targetHeight = maxSize / targetAspectRatio;
        
        // Scale down if needed
        if (sourceWidth < targetWidth) {
          targetWidth = sourceWidth;
          targetHeight = sourceHeight;
        }
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw image cropped and resized
        ctx.drawImage(
          img,
          cropX,
          cropY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          targetWidth,
          targetHeight
        );

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not create blob from canvas'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Could not load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Could not read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Gets the size of a file or blob in a human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
