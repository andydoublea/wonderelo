import { Loader2 } from 'lucide-react';
import { cn } from './utils';

/**
 * Reusable loading spinner component
 * Prevents duplication of loading UI patterns
 */

interface LoadingSpinnerProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
  /** Loading text to display */
  text?: string;
  /** Center the spinner in parent container */
  centered?: boolean;
  /** Show loading spinner in full screen overlay */
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

/**
 * Simple loading spinner
 */
export function LoadingSpinner({ 
  size = 'md', 
  className,
  text,
  centered = false,
  fullScreen = false
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn(
      'flex items-center gap-2',
      centered && 'justify-center',
      className
    )}>
      <Loader2 className={cn(
        'animate-spin text-muted-foreground',
        sizeClasses[size]
      )} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  if (centered) {
    return (
      <div className="flex items-center justify-center p-8">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * Loading state for cards
 */
export function CardLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

/**
 * Loading state for full page
 */
export function PageLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="xl" text={text} />
    </div>
  );
}

/**
 * Loading state for buttons
 */
export function ButtonLoading() {
  return <Loader2 className="h-4 w-4 animate-spin" />;
}

/**
 * Loading skeleton for text
 */
export function TextSkeleton({ 
  lines = 3,
  className 
}: { 
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i}
          className={cn(
            'h-4 bg-muted rounded animate-pulse',
            i === lines - 1 ? 'w-2/3' : 'w-full'
          )} 
        />
      ))}
    </div>
  );
}

/**
 * Loading skeleton for card
 */
export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="h-6 bg-muted rounded animate-pulse w-1/2" />
      <TextSkeleton lines={3} />
    </div>
  );
}

/**
 * Loading skeleton for table rows
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <div className="h-4 bg-muted rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}
