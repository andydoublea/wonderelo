import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

interface TourStep {
  target: string; // CSS selector for the target element
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

// Steps ordered top-to-bottom on the page to minimize jarring scroll jumps
const tourSteps: TourStep[] = [
  {
    target: '[data-tour="event-page-url"]',
    title: 'Your event page',
    description: 'This is your unique event page URL. Share it with participants or display the QR code at your venue. Participants will register through this page.',
    position: 'bottom',
  },
  {
    target: '[data-tour="session-card"]',
    title: 'Your published rounds',
    description: 'This section shows rounds that are live on your event page. Participants can register for published rounds by visiting your event page.',
    position: 'top',
  },
  {
    target: '[data-tour="manage-rounds"]',
    title: 'Manage your rounds',
    description: 'Create new rounds, edit existing ones, change their status, or view all your rounds. You can also duplicate rounds to save time.',
    position: 'bottom',
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

function computeTooltipPosition(rect: DOMRect, position: string) {
  const tooltipWidth = 320;
  const tooltipHeight = 180;
  const gap = 12;

  let top = 0;
  let left = 0;

  switch (position) {
    case 'bottom':
      top = rect.bottom + gap;
      left = Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 16));
      break;
    case 'top':
      top = rect.top - gap - tooltipHeight;
      left = Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 16));
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left - tooltipWidth - gap;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.right + gap;
      break;
  }

  // Clamp to keep tooltip within viewport
  top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));
  left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

  return { top, left };
}

/**
 * Scrolls element into view and waits for scroll to stabilize,
 * then calls the callback with the final viewport-relative rect.
 */
function scrollToElementAndGetRect(
  el: Element,
  callback: (rect: DOMRect) => void
) {
  // Use instant scroll for reliability - smooth scroll timing is unpredictable
  el.scrollIntoView({ behavior: 'instant', block: 'center' });

  // After instant scroll, use rAF to get the rect after layout
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      callback(el.getBoundingClientRect());
    });
  });
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [navHeight, setNavHeight] = useState(0);

  // Elevate nav above main overlay, track its height for the dim layer
  useEffect(() => {
    const nav = document.querySelector('.sticky.z-50') as HTMLElement | null;
    if (nav) {
      nav.dataset.tourActive = 'true';
      nav.style.zIndex = '9999';
      setNavHeight(nav.getBoundingClientRect().height);
    }
    return () => {
      if (nav) {
        delete nav.dataset.tourActive;
        nav.style.zIndex = '';
      }
    };
  }, []);

  const handleComplete = useCallback(() => {
    const nav = document.querySelector('[data-tour-active]') as HTMLElement | null;
    if (nav) {
      delete nav.dataset.tourActive;
      nav.style.zIndex = '';
    }
    onComplete();
  }, [onComplete]);

  // Navigate to step: scroll into view, then position tooltip
  useEffect(() => {
    const step = tourSteps[currentStep];
    if (!step) return;

    const targetEl = document.querySelector(step.target);
    if (!targetEl) {
      // Skip to next step if target not found
      if (currentStep < tourSteps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleComplete();
      }
      return;
    }

    setIsVisible(false);
    setTargetRect(null);

    scrollToElementAndGetRect(targetEl, (rect) => {
      setTargetRect(rect);
      setTooltipPosition(computeTooltipPosition(rect, step.position || 'bottom'));
      setIsVisible(true);
    });
  }, [currentStep, handleComplete]);

  // Re-position on resize or scroll
  useEffect(() => {
    const updatePosition = () => {
      const step = tourSteps[currentStep];
      if (!step) return;
      const targetEl = document.querySelector(step.target);
      if (!targetEl) return;
      const rect = targetEl.getBoundingClientRect();
      setTargetRect(rect);
      setTooltipPosition(computeTooltipPosition(rect, step.position || 'bottom'));
    };
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setIsVisible(false);
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setIsVisible(false);
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = tourSteps[currentStep];

  // Z-index layers:
  // 9998 — main overlay with cutout (covers page content)
  // 9999 — sticky nav (above main overlay, stays visible)
  // 10000 — nav dim layer (semi-transparent, covers just nav height)
  // 10001 — highlight border around target
  // 10002 — tooltip
  return createPortal(
    <>
      {/* Main overlay with cutout - covers page content below nav */}
      <svg
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 9998,
        }}
        onClick={handleComplete}
      >
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 4}
                y={targetRect.top - 4}
                width={targetRect.width + 8}
                height={targetRect.height + 8}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#tour-mask)" />
      </svg>

      {/* Nav dim layer - sits above the nav to dim it */}
      {navHeight > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: navHeight,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Highlight border around target element */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            zIndex: 10001,
            pointerEvents: 'none',
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            borderRadius: '8px',
            border: '2px solid hsl(var(--primary))',
          }}
        />
      )}

      {/* Tooltip */}
      {isVisible && step && (
        <div
          style={{
            position: 'fixed',
            zIndex: 10002,
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            width: '320px',
          }}
        >
          <Card className="shadow-xl border-2 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm">{step.title}</h3>
                <button
                  onClick={handleComplete}
                  className="text-muted-foreground hover:text-foreground -mt-1 -mr-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {step.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {currentStep + 1} of {tourSteps.length}
                </span>
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button size="sm" variant="outline" onClick={handlePrev}>
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      Back
                    </Button>
                  )}
                  <Button size="sm" onClick={handleNext}>
                    {currentStep === tourSteps.length - 1 ? 'Done' : 'Next'}
                    {currentStep < tourSteps.length - 1 && <ArrowRight className="h-3 w-3 ml-1" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>,
    document.body
  );
}
