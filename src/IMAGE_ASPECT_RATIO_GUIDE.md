# Image aspect ratio guide

## Overview

The Oliwonder application preserves **original uploaded images** and generates **optimized versions** with a configurable aspect ratio. This allows you to change the aspect ratio in the future and regenerate all images from the originals.

## How it works

### 1. Upload process

When an organizer uploads a meeting point image:

1. **Original file** is stored in Supabase Storage at `originals/{userId}/{timestamp}-{random}.{ext}`
2. **Optimized version** (cropped and compressed) is generated and stored at `optimized/{userId}/{timestamp}-{random}.jpg`
3. Both URLs are saved in the database:
   - `originalImageUrl` - link to original file
   - `imageUrl` - link to optimized version (this is displayed to users)

### 2. Storage structure

```
make-ce05600a-meeting-points/
├── originals/
│   └── {userId}/
│       └── {timestamp}-{random}.{original-extension}
└── optimized/
    └── {userId}/
        └── {timestamp}-{random}.jpg
```

### 3. Display

- The application displays the **optimized version** (`imageUrl`)
- The **original** is kept in storage but not displayed
- Originals can be used later to regenerate images with different aspect ratios

## Changing the aspect ratio

### Step 1: Update the aspect ratio constant

Edit `/utils/imageOptimization.tsx` and change the constant:

```typescript
// Change from 16:9 to your desired ratio
export const MEETING_POINT_ASPECT_RATIO = 16 / 9;  // Example: 4/3, 1, 21/9
```

Common aspect ratios:
- `16 / 9` - Widescreen (current default)
- `4 / 3` - Standard
- `1` - Square
- `21 / 9` - Ultra-wide
- `3 / 2` - Classic photo

### Step 2: Regenerate existing images

After changing the aspect ratio, you need to regenerate all existing meeting point images from their originals.

#### Using the regeneration utility

Import and use the regeneration utility:

```typescript
import { regenerateMeetingPointImages } from './utils/regenerateImages';
import { supabase } from './utils/supabase/client';

// Get access token
const { data: { session } } = await supabase.auth.getSession();
if (!session?.access_token) {
  console.error('Not authenticated');
  return;
}

// Regenerate images for a specific session's meeting points
const regeneratedPoints = await regenerateMeetingPointImages(
  session.meetingPoints,
  session.access_token,
  (current, total, pointName) => {
    console.log(`Processing ${current}/${total}: ${pointName}`);
  }
);

// Update the session with regenerated meeting points
session.meetingPoints = regeneratedPoints;
// Save session back to database...
```

#### Bulk regeneration example

Here's a complete example for regenerating all sessions:

```typescript
import { regenerateMeetingPointImages } from './utils/regenerateImages';
import { supabase } from './utils/supabase/client';

async function regenerateAllMeetingPoints() {
  // Get access token
  const { data: { session: authSession } } = await supabase.auth.getSession();
  if (!authSession?.access_token) {
    throw new Error('Not authenticated');
  }

  // Get all sessions (implement based on your data structure)
  const sessions = await getAllSessions();
  
  for (const session of sessions) {
    if (!session.meetingPoints?.some(mp => mp.originalImageUrl)) {
      console.log(`Skipping ${session.name} - no meeting points with originals`);
      continue;
    }

    console.log(`\n🔄 Regenerating session: ${session.name}`);
    
    const regeneratedPoints = await regenerateMeetingPointImages(
      session.meetingPoints,
      authSession.access_token,
      (current, total, pointName) => {
        console.log(`  ├─ ${current}/${total}: ${pointName}`);
      }
    );

    // Update session in database
    await updateSession(session.id, {
      ...session,
      meetingPoints: regeneratedPoints
    });

    console.log(`✅ Session ${session.name} regenerated`);
  }
  
  console.log('\n✨ All sessions regenerated!');
}
```

### Step 3: New uploads

After changing the aspect ratio constant, all **new uploads** will automatically use the new aspect ratio.

## Technical details

### Image optimization parameters

- **Max width**: 800px (height calculated based on aspect ratio)
- **Quality**: 85% JPEG
- **Format**: JPEG (for optimized versions)
- **Original format**: Preserved as uploaded

### Regeneration utility

The regeneration utility is located at `/utils/regenerateImages.tsx` and provides:

```typescript
regenerateMeetingPointImages(
  meetingPoints: MeetingPoint[],
  accessToken: string,
  onProgress?: (current: number, total: number, pointName: string) => void
): Promise<MeetingPoint[]>
```

**Parameters:**
- `meetingPoints` - Array of meeting points with `originalImageUrl`
- `accessToken` - Supabase access token for authentication
- `onProgress` - Optional callback for progress updates

**Returns:**
- Updated array of meeting points with new `imageUrl` values

### Error handling

- If an original image is missing, the meeting point is skipped
- If download/processing fails, the old optimized version is kept
- Failed regenerations are logged but don't stop the process

## Benefits of this system

1. **Flexibility** - Change aspect ratio anytime without losing quality
2. **Quality** - Always regenerate from original high-quality files
3. **Performance** - Display optimized versions for fast loading
4. **Storage** - Originals are preserved for future use
5. **Backward compatibility** - Old sessions without originals still work

## Migration notes

Sessions created **before this system** may not have `originalImageUrl`. These images:
- Will continue to display normally
- Cannot be regenerated with new aspect ratios
- Should be re-uploaded if aspect ratio change is needed

## Future improvements

Possible enhancements:
- Admin UI for bulk regeneration
- Multiple aspect ratio presets
- Automatic regeneration on aspect ratio change
- Progress indicator for bulk operations
