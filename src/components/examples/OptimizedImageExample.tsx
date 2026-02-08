import { OptimizedImage } from '../OptimizedImage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

/**
 * Example showcasing OptimizedImage component features
 * 
 * Demonstrates:
 * - Lazy loading with Intersection Observer
 * - Blur placeholder effect
 * - Error handling with fallback
 * - Responsive image loading
 * - Proper aspect ratios
 * - Loading states
 * 
 * Benefits:
 * - Reduces initial page load time
 * - Improves Core Web Vitals (LCP, CLS)
 * - Better UX with smooth loading transitions
 * - Automatic error recovery
 */

export function OptimizedImageExample() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="mb-2">Optimized image examples</h2>
        <p className="text-muted-foreground">
          Images below are lazy-loaded and optimized for performance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Example 1: Basic lazy loading */}
        <Card>
          <CardHeader>
            <CardTitle>Basic lazy loading</CardTitle>
            <CardDescription>
              Image loads when scrolled into view
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OptimizedImage
              src="https://images.unsplash.com/photo-1540575467063-178a50c2df87"
              alt="Networking event"
              aspectRatio="16/9"
              className="rounded-lg w-full"
              showPlaceholder={true}
            />
          </CardContent>
        </Card>

        {/* Example 2: With fallback */}
        <Card>
          <CardHeader>
            <CardTitle>Error handling</CardTitle>
            <CardDescription>
              Falls back to placeholder on error
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OptimizedImage
              src="https://invalid-url-that-will-fail.com/image.jpg"
              alt="Fallback demo"
              aspectRatio="16/9"
              className="rounded-lg w-full"
              fallbackSrc="https://images.unsplash.com/photo-1511578314322-379afb476865"
            />
          </CardContent>
        </Card>

        {/* Example 3: Priority loading (no lazy) */}
        <Card>
          <CardHeader>
            <CardTitle>Priority loading</CardTitle>
            <CardDescription>
              Above-the-fold image, loads immediately
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OptimizedImage
              src="https://images.unsplash.com/photo-1505373877841-8d25f7d46678"
              alt="Conference"
              aspectRatio="16/9"
              className="rounded-lg w-full"
              priority={true}
              showPlaceholder={true}
            />
          </CardContent>
        </Card>

        {/* Example 4: Custom aspect ratio */}
        <Card>
          <CardHeader>
            <CardTitle>Square aspect ratio</CardTitle>
            <CardDescription>
              1:1 ratio for profile images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-48 mx-auto">
              <OptimizedImage
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2"
                alt="Profile"
                aspectRatio="1/1"
                className="rounded-full w-full"
                objectFit="cover"
              />
            </div>
          </CardContent>
        </Card>

        {/* Example 5: Multiple images (lazy loading performance test) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Gallery with lazy loading</CardTitle>
            <CardDescription>
              Scroll to trigger loading - only visible images load
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[
                'photo-1523580494863-6f3031224c94',
                'photo-1511795409834-ef04bbd61622',
                'photo-1515187029135-18ee286d815b',
                'photo-1528605248644-14dd04022da1',
                'photo-1475721027785-f74eccf877e2',
                'photo-1517457373958-b7bdd4587205'
              ].map((id, index) => (
                <OptimizedImage
                  key={id}
                  src={`https://images.unsplash.com/${id}`}
                  alt={`Event ${index + 1}`}
                  aspectRatio="4/3"
                  className="rounded-md w-full"
                  lazy={true}
                  showPlaceholder={true}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance tips */}
      <Card>
        <CardHeader>
          <CardTitle>Performance tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <strong>Lazy loading:</strong> Images load only when scrolled into view, 
              reducing initial page load
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <strong>Blur placeholder:</strong> Shows colored placeholder while loading, 
              preventing layout shift
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <strong>Error handling:</strong> Automatically shows fallback image on failure
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-5 w-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <strong>Priority option:</strong> Critical images can skip lazy loading
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
