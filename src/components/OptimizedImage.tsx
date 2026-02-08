import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { debugLog } from '../utils/debug';

/**
 * Optimized Image Component
 * Handles lazy loading, blur placeholder, error states, and responsive images
 */

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  /** Image source URL */
  src: string;
  /** Alt text (required for accessibility) */
  alt: string;
  /** Width of the image */
  width?: number | string;
  /** Height of the image */
  height?: number | string;
  /** Lazy loading (default: true) */
  lazy?: boolean;
  /** Show blur placeholder while loading */
  showPlaceholder?: boolean;
  /** Placeholder color */
  placeholderColor?: string;
  /** Aspect ratio (e.g., "16/9", "4/3") */
  aspectRatio?: string;
  /** Fallback image if main image fails */
  fallbackSrc?: string;
  /** Callback when image loads */
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  /** Callback when image fails to load */
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  /** Object fit */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** Object position */
  objectPosition?: string;
  /** Priority loading (disables lazy loading) */
  priority?: boolean;
  /** Sizes attribute for responsive images */
  sizes?: string;
  /** Quality (if using image CDN that supports it) */
  quality?: number;
}

/**
 * Optimized Image with lazy loading and blur placeholder
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  lazy = true,
  showPlaceholder = true,
  placeholderColor = '#e5e7eb',
  aspectRatio,
  fallbackSrc,
  onLoad,
  onError,
  objectFit = 'cover',
  objectPosition = 'center',
  priority = false,
  sizes,
  quality,
  className = '',
  style = {},
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(!lazy || priority);

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (!lazy || priority) {
      setIsIntersecting(true);
      return;
    }

    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image is visible
        threshold: 0.01
      }
    );

    observer.observe(img);

    return () => {
      observer.disconnect();
    };
  }, [lazy, priority]);

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setCurrentSrc(src);
  }, [src]);

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    debugLog('Image loaded:', src);
    onLoad?.(event);
  };

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    debugLog('Image failed to load:', src);
    
    // Try fallback
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoaded(false);
    }
    
    onError?.(event);
  };

  // Calculate container style
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: width || '100%',
    height: height || (aspectRatio ? undefined : 'auto'),
    aspectRatio: aspectRatio,
    backgroundColor: showPlaceholder && !isLoaded ? placeholderColor : 'transparent',
    ...style
  };

  // Calculate image style
  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit,
    objectPosition,
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0
  };

  return (
    <div style={containerStyle} className={className}>
      {/* Blur placeholder */}
      {showPlaceholder && !isLoaded && !hasError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: placeholderColor,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={isIntersecting ? currentSrc : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : lazy ? 'lazy' : 'eager'}
        decoding={priority ? 'sync' : 'async'}
        onLoad={handleLoad}
        onError={handleError}
        style={imageStyle}
        {...props}
      />

      {/* Error fallback */}
      {hasError && !fallbackSrc && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            color: '#6b7280'
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      )}
    </div>
  );
}

/**
 * Responsive Image Component
 * Generates srcSet for different screen sizes
 */
interface ResponsiveImageProps extends OptimizedImageProps {
  /** Base URL for images (will append size parameters) */
  baseUrl: string;
  /** Widths for srcSet */
  widths?: number[];
  /** Format (webp, jpg, png) */
  format?: 'webp' | 'jpg' | 'png';
}

export function ResponsiveImage({
  baseUrl,
  widths = [320, 640, 768, 1024, 1280, 1536],
  format = 'webp',
  sizes = '100vw',
  ...props
}: ResponsiveImageProps) {
  // Generate srcSet
  const srcSet = widths
    .map(width => {
      // This assumes your CDN supports query params for resizing
      // Adjust based on your image CDN (Cloudinary, imgix, etc.)
      const url = `${baseUrl}?w=${width}&f=${format}&q=${props.quality || 75}`;
      return `${url} ${width}w`;
    })
    .join(', ');

  // Default src (largest size)
  const src = `${baseUrl}?w=${widths[widths.length - 1]}&f=${format}&q=${props.quality || 75}`;

  return (
    <picture>
      {/* WebP source */}
      {format !== 'webp' && (
        <source type="image/webp" srcSet={srcSet.replace(new RegExp(format, 'g'), 'webp')} sizes={sizes} />
      )}
      
      {/* Original format source */}
      <source type={`image/${format}`} srcSet={srcSet} sizes={sizes} />
      
      {/* Fallback img */}
      <OptimizedImage
        src={src}
        sizes={sizes}
        {...props}
      />
    </picture>
  );
}

/**
 * Avatar Image with fallback to initials
 */
interface AvatarImageProps extends Omit<OptimizedImageProps, 'alt'> {
  /** Name for fallback initials */
  name: string;
  /** Avatar URL */
  src?: string;
  /** Size of avatar */
  size?: number;
}

export function AvatarImage({
  name,
  src,
  size = 40,
  className = '',
  ...props
}: AvatarImageProps) {
  const [showFallback, setShowFallback] = useState(!src);
  
  // Generate initials
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate color from name
  const backgroundColor = `hsl(${name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 70%, 60%)`;

  if (showFallback || !src) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor,
          color: 'white',
          fontSize: size / 2.5
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={name}
      width={size}
      height={size}
      onError={() => setShowFallback(true)}
      className={`rounded-full ${className}`}
      objectFit="cover"
      {...props}
    />
  );
}

/**
 * Background Image Component
 * Optimized for background images with gradient overlay
 */
interface BackgroundImageProps {
  src: string;
  alt?: string;
  children?: React.ReactNode;
  overlay?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  className?: string;
}

export function BackgroundImage({
  src,
  alt = '',
  children,
  overlay = false,
  overlayColor = 'rgba(0, 0, 0, 0.5)',
  overlayOpacity = 0.5,
  className = ''
}: BackgroundImageProps) {
  return (
    <div className={`relative ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full"
        objectFit="cover"
        style={{ zIndex: 0 }}
      />
      
      {overlay && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity,
            zIndex: 1
          }}
        />
      )}
      
      {children && (
        <div className="relative" style={{ zIndex: 2 }}>
          {children}
        </div>
      )}
    </div>
  );
}

// CSS for pulse animation (add to globals.css if not present)
const pulseKeyframes = `
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
`;

// Inject keyframes (only once)
if (typeof document !== 'undefined') {
  const styleId = 'optimized-image-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = pulseKeyframes;
    document.head.appendChild(style);
  }
}
