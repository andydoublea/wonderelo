import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetDate: string; // ISO datetime string
  onComplete?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function CountdownTimer({ targetDate, onComplete, size = 'medium' }: CountdownTimerProps) {
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

  return (
    <div className={`font-semibold text-primary ${sizeClasses[size]}`}>
      {timeLeft}
    </div>
  );
}
