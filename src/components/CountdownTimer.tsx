import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetDate: string; // ISO datetime string
  onComplete?: () => void;
  size?: 'small' | 'medium' | 'large';
  /**
   * When provided, replaces the default `font-semibold text-primary <sizeClass>`.
   * Use `className=""` to render unstyled inline text that inherits parent styles.
   */
  className?: string;
}

export function CountdownTimer({ targetDate, onComplete, size = 'medium', className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('00:00');
        if (onComplete) {
          onComplete();
        }
        return;
      }

      // Calculate minutes and seconds only (no hours)
      const totalSeconds = Math.floor(diff / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      setTimeLeft(formattedTime);
    };

    // Initial calculation
    calculateTimeLeft();

    // Update every second
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  const sizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl'
  };

  // When caller passes className (even empty), use that verbatim — lets the
  // countdown inherit parent styles. Otherwise apply the default bold primary.
  const finalClass = className !== undefined ? className : `font-semibold text-primary ${sizeClasses[size]}`;
  return (
    <span className={finalClass}>
      {timeLeft}
    </span>
  );
}
