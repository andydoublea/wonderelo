import { useState, useEffect, useCallback, useRef } from 'react';
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
    target: '[data-tour="onboarding-checklist"]',
    title: 'Getting started checklist',
    description: 'Follow these steps to set up your first event. Each item checks off automatically as you complete it.',
    position: 'bottom',
  },
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
    target: '[data-tour="create-round"]',
    title: 'Manage your rounds',
    description: 'Click here to see all your rounds, create new ones, edit existing ones, or change their status. You can also duplicate rounds to save time.',
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

  const handleComplete = useCallback(() => {
    localStorage.setItem('onboarding_tour_completed', 'true');
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

  // Re-position on resize
  useEffect(() => {
    const handleResize = () => {
      const step = tourSteps[currentStep];
      if (!step) return;
      const targetEl = document.querySelector(step.target);
      if (!targetEl) return;
      const rect = targetEl.getBoundingClientRect();
      setTargetRect(rect);
      setTooltipPosition(computeTooltipPosition(rect, step.position || 'bottom'));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  // Use a portal to render at document.body level, avoiding any parent stacking context issues.
  // Use inline styles for position/zIndex since Tailwind v4 may not generate arbitrary z-[...] classes.
  return createPortal(
    <>
      {/* Overlay - covers entire viewport (transparent, just captures clicks for dismissal) */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
        }}
        onClick={handleComplete}
      />

      {/* Highlight cutout for target element */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            zIndex: 9999,
            pointerEvents: 'none',
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            borderRadius: '8px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            border: '2px solid hsl(var(--primary))',
          }}
        />
      )}

      {/* Tooltip */}
      {isVisible && step && (
        <div
          style={{
            position: 'fixed',
            zIndex: 10000,
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
