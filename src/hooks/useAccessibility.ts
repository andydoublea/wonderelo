import { useEffect, useRef, useCallback, RefObject } from 'react';
import { debugLog } from '../utils/debug';

/**
 * Accessibility (a11y) Hooks
 * Helpers for keyboard navigation, focus management, and screen readers
 */

/**
 * Trap focus within a container (for modals/dialogs)
 * 
 * @example
 * ```tsx
 * const dialogRef = useRef<HTMLDivElement>(null);
 * useFocusTrap(dialogRef, isOpen);
 * 
 * <div ref={dialogRef}>
 *   <input />
 *   <button>Close</button>
 * </div>
 * ```
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  active: boolean = true
): void {
  useEffect(() => {
    if (!active) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [containerRef, active]);
}

/**
 * Announce messages to screen readers
 * 
 * @example
 * ```tsx
 * const announce = useAriaAnnounce();
 * 
 * const handleSubmit = () => {
 *   // ... submit logic
 *   announce('Form submitted successfully');
 * };
 * ```
 */
export function useAriaAnnounce(): (message: string, priority?: 'polite' | 'assertive') => void {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create announcer element
    if (!announcerRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.position = 'absolute';
      announcer.style.left = '-10000px';
      announcer.style.width = '1px';
      announcer.style.height = '1px';
      announcer.style.overflow = 'hidden';
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current);
        announcerRef.current = null;
      }
    };
  }, []);

  return useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcerRef.current) {
      announcerRef.current.setAttribute('aria-live', priority);
      announcerRef.current.textContent = message;
      debugLog('Screen reader announcement:', message);
      
      // Clear after announcement
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);
}

/**
 * Auto-focus element on mount
 * 
 * @example
 * ```tsx
 * const inputRef = useRef<HTMLInputElement>(null);
 * useAutoFocus(inputRef);
 * 
 * <input ref={inputRef} />
 * ```
 */
export function useAutoFocus<T extends HTMLElement>(
  elementRef: RefObject<T>,
  options: {
    /** Delay before focusing (ms) */
    delay?: number;
    /** Select text if input */
    select?: boolean;
    /** Only focus if no other element has focus */
    preventFocusSteal?: boolean;
  } = {}
): void {
  const { delay = 0, select = false, preventFocusSteal = false } = options;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const element = elementRef.current;
      if (!element) return;

      // Check if another element already has focus
      if (preventFocusSteal && document.activeElement !== document.body) {
        return;
      }

      element.focus();

      // Select text for inputs
      if (select && element instanceof HTMLInputElement) {
        element.select();
      }

      debugLog('Auto-focused element:', element);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [elementRef, delay, select, preventFocusSteal]);
}

/**
 * Keyboard shortcuts handler
 * 
 * @example
 * ```tsx
 * useKeyboardShortcut('ctrl+s', (e) => {
 *   e.preventDefault();
 *   saveDocument();
 * });
 * 
 * useKeyboardShortcut(['ctrl+k', 'cmd+k'], openCommandPalette);
 * ```
 */
export function useKeyboardShortcut(
  keys: string | string[],
  callback: (event: KeyboardEvent) => void,
  options: {
    /** Element to attach listener to */
    target?: RefObject<HTMLElement>;
    /** Enable/disable shortcut */
    enabled?: boolean;
  } = {}
): void {
  const { target, enabled = true } = options;
  const keysArray = Array.isArray(keys) ? keys : [keys];

  useEffect(() => {
    if (!enabled) return;

    const element = target?.current || document;

    const handleKeyDown = (event: KeyboardEvent) => {
      const pressedKey = [
        event.ctrlKey && 'ctrl',
        event.metaKey && 'cmd',
        event.altKey && 'alt',
        event.shiftKey && 'shift',
        event.key.toLowerCase()
      ]
        .filter(Boolean)
        .join('+');

      if (keysArray.some(key => key.toLowerCase() === pressedKey)) {
        callback(event);
      }
    };

    element.addEventListener('keydown', handleKeyDown as any);

    return () => {
      element.removeEventListener('keydown', handleKeyDown as any);
    };
  }, [keysArray, callback, target, enabled]);
}

/**
 * Manage focus state for roving tabindex (e.g., in toolbars)
 * 
 * @example
 * ```tsx
 * const { focusedIndex, setFocusedIndex, handleKeyDown } = useRovingTabIndex(items.length);
 * 
 * {items.map((item, index) => (
 *   <button
 *     tabIndex={focusedIndex === index ? 0 : -1}
 *     onKeyDown={handleKeyDown}
 *     onFocus={() => setFocusedIndex(index)}
 *   >
 *     {item}
 *   </button>
 * ))}
 * ```
 */
export function useRovingTabIndex(itemCount: number, initialIndex: number = 0) {
  const [focusedIndex, setFocusedIndex] = React.useState(initialIndex);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      let nextIndex = focusedIndex;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          nextIndex = (focusedIndex + 1) % itemCount;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          nextIndex = (focusedIndex - 1 + itemCount) % itemCount;
          break;
        case 'Home':
          event.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          nextIndex = itemCount - 1;
          break;
        default:
          return;
      }

      setFocusedIndex(nextIndex);
    },
    [focusedIndex, itemCount]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown
  };
}

/**
 * Detect if user prefers reduced motion
 * 
 * @example
 * ```tsx
 * const prefersReducedMotion = usePrefersReducedMotion();
 * 
 * <motion.div
 *   animate={prefersReducedMotion ? {} : { scale: 1.2 }}
 * />
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Skip to content link for keyboard navigation
 * 
 * @example
 * ```tsx
 * const { SkipLink } = useSkipToContent();
 * 
 * <SkipLink targetId="main-content" />
 * <main id="main-content">...</main>
 * ```
 */
export function useSkipToContent() {
  const SkipLink = ({ targetId, text = 'Skip to main content' }: { targetId: string; text?: string }) => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    };

    return (
      <a
        href={`#${targetId}`}
        onClick={handleClick}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
      >
        {text}
      </a>
    );
  };

  return { SkipLink };
}

/**
 * ARIA live region hook
 * 
 * @example
 * ```tsx
 * const { LiveRegion, announce } = useAriaLiveRegion();
 * 
 * <LiveRegion />
 * <button onClick={() => announce('Item added to cart')}>Add to Cart</button>
 * ```
 */
export function useAriaLiveRegion(role: 'status' | 'alert' = 'status') {
  const [message, setMessage] = React.useState('');

  const announce = useCallback((text: string) => {
    setMessage(text);
    // Clear after announcement
    setTimeout(() => setMessage(''), 1000);
  }, []);

  const LiveRegion = () => (
    <div
      role={role}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );

  return { LiveRegion, announce };
}

/**
 * Get accessible label props for form fields
 * 
 * @example
 * ```tsx
 * const labelProps = useAccessibleLabel('email', 'Email address', 'Enter your email');
 * 
 * <label {...labelProps.label}>Email</label>
 * <input {...labelProps.input} />
 * {error && <span {...labelProps.error}>{error}</span>}
 * ```
 */
export function useAccessibleLabel(
  id: string,
  label: string,
  description?: string,
  error?: string
) {
  const labelId = `${id}-label`;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  return {
    label: {
      id: labelId,
      htmlFor: id
    },
    input: {
      id,
      'aria-labelledby': labelId,
      'aria-describedby': describedBy,
      'aria-invalid': error ? true : undefined,
      'aria-required': true
    },
    description: description ? {
      id: descriptionId,
      className: 'text-sm text-muted-foreground'
    } : undefined,
    error: error ? {
      id: errorId,
      role: 'alert',
      className: 'text-sm text-destructive'
    } : undefined
  };
}

// Import React
import * as React from 'react';
