import { useState, useRef, useEffect, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from './ui/popover';
import { Clock } from 'lucide-react';
import { C } from './redesign/organizerAtoms';
import { debugLog } from '../utils/debug';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  asapMinutesOffset?: number; // How many minutes to add for "As soon as possible" (default 10)
  asapReferenceTime?: string; // Reference time for ASAP calculation (format: "HH:mm")
  asapButtonText?: string; // Custom text for ASAP button (default "As soon as possible")
  useNowForAsap?: boolean; // If true, ASAP button sets current time instead of calculated time
  minuteInterval?: number; // Interval between selectable minutes (default 5)
}

export function TimePicker({
  value,
  onChange,
  placeholder = "hh:mm",
  className,
  error,
  disabled = false,
  asapMinutesOffset = 10,
  asapReferenceTime,
  asapButtonText = "As soon as possible",
  useNowForAsap = false,
  minuteInterval = 5
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenUsed, setHasBeenUsed] = useState(false);
  const [hasScrolledToDefault, setHasScrolledToDefault] = useState(false);
  const hoursContainerRef = useRef<HTMLDivElement>(null);
  const minutesContainerRef = useRef<HTMLDivElement>(null);

  // Reset scroll state when picker opens
  useEffect(() => {
    if (isOpen) {
      setHasScrolledToDefault(false);
    }
  }, [isOpen]);

  // Function to scroll to specific hour and minute
  const scrollToTime = useCallback((targetHour?: string, targetMinute?: string) => {
    // Each button is 36px (h-8 = 32px + mb-1 = 4px)
    const buttonHeight = 36;

    // Scroll hours
    if (targetHour !== undefined && hoursContainerRef.current) {
      const scrollContainer = hoursContainerRef.current.closest('[data-slot="scroll-area"]')?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement;
      if (scrollContainer) {
        const hourIndex = parseInt(targetHour, 10);
        // Center the selected hour in viewport (viewport height is h-52 = 208px)
        const viewportHeight = 208;
        const scrollPosition = (hourIndex * buttonHeight) - (viewportHeight / 2) + (buttonHeight / 2);
        scrollContainer.scrollTop = Math.max(0, scrollPosition);
        debugLog('✅ Scrolled to hour:', targetHour, 'position:', scrollPosition);
      }
    }

    // Scroll minutes
    if (targetMinute !== undefined && minutesContainerRef.current) {
      const scrollContainer = minutesContainerRef.current.closest('[data-slot="scroll-area"]')?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement;
      if (scrollContainer) {
        const minuteIndex = parseInt(targetMinute, 10) / minuteInterval;
        const viewportHeight = 208;
        const scrollPosition = (minuteIndex * buttonHeight) - (viewportHeight / 2) + (buttonHeight / 2);
        scrollContainer.scrollTop = Math.max(0, scrollPosition);
        debugLog('✅ Scrolled to minute:', targetMinute, 'position:', scrollPosition);
      }
    }

    setHasScrolledToDefault(true);
  }, [minuteInterval]);

  // Function to scroll to default hour "10" when no time is set
  const scrollToDefaultHour = useCallback(() => {
    scrollToTime('10', '00');
  }, [scrollToTime]);

  // Generate hours (0-23)
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, '0')
  );

  // Generate minutes based on interval (e.g., every 1, 5, or 15 min)
  const minuteCount = Math.floor(60 / minuteInterval);
  const minutes = Array.from({ length: minuteCount }, (_, i) =>
    (i * minuteInterval).toString().padStart(2, '0')
  );

  const handleHourSelect = (hour: string) => {
    const { minute: currentMinute } = parseTime(value);
    const newTime = `${hour}:${currentMinute || '00'}`;
    onChange(newTime);
    setHasBeenUsed(true);
    // Picker zostane otvorený
  };

  const handleMinuteSelect = (minute: string) => {
    const { hour: currentHour } = parseTime(value);
    const newTime = `${currentHour || '00'}:${minute}`;
    onChange(newTime);
    setHasBeenUsed(true);
    // Picker zostane otvorený
  };

  const handleManualTimeInput = (inputValue: string) => {
    // Allow user to type freely, but format basic patterns
    let formattedValue = inputValue;

    // Auto-format basic patterns while typing
    if (inputValue.length === 2 && !inputValue.includes(':')) {
      formattedValue = inputValue + ':';
    }

    // Limit to reasonable format (HH:MM)
    if (formattedValue.length <= 5) {
      onChange(formattedValue);
      setHasBeenUsed(true);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text when focusing the input
    e.target.select();
  };

  const parseTime = (timeString: string) => {
    if (!timeString || !timeString.includes(':')) return { hour: '', minute: '' };
    const [hour, minute] = timeString.split(':');
    return { hour: hour || '', minute: minute || '' };
  };

  const { hour: currentHour, minute: currentMinute } = parseTime(value);

  // Function to set "As soon as possible" time
  const handleAsSoonAsPossible = () => {
    let targetTime: Date;

    if (useNowForAsap) {
      // Use current time (for "Now" button) - without rounding
      targetTime = new Date();
      const nowHours = targetTime.getHours().toString().padStart(2, '0');
      const nowMins = targetTime.getMinutes().toString().padStart(2, '0');
      const newTime = `${nowHours}:${nowMins}`;

      onChange(newTime);
      setHasBeenUsed(true);
      setIsOpen(false);
      return;
    } else if (asapReferenceTime) {
      // Use reference time and subtract the offset
      const [refHour, refMinute] = asapReferenceTime.split(':').map(Number);
      const today = new Date();
      targetTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), refHour, refMinute);
      targetTime = new Date(targetTime.getTime() - asapMinutesOffset * 60 * 1000);
    } else {
      // Use current time and add the offset
      const now = new Date();
      targetTime = new Date(now.getTime() + asapMinutesOffset * 60 * 1000);
    }

    const rawMinutes = targetTime.getMinutes();
    const roundedMinutes = Math.ceil(rawMinutes / minuteInterval) * minuteInterval;
    targetTime.setMinutes(roundedMinutes);
    targetTime.setSeconds(0);

    const hours = targetTime.getHours().toString().padStart(2, '0');
    const mins = targetTime.getMinutes().toString().padStart(2, '0');
    const newTime = `${hours}:${mins}`;

    onChange(newTime);
    setHasBeenUsed(true);
    setIsOpen(false);
  };

  // Auto-scroll when picker opens
  useEffect(() => {
    if (isOpen && !hasScrolledToDefault) {
      // Try immediately, then with increasing delays for robustness
      const timeouts = [0, 50, 150, 300];

      timeouts.forEach((delay, index) => {
        setTimeout(() => {
          if (!hasScrolledToDefault) {
            debugLog(`🔄 Auto-scroll attempt ${index + 1} (delay: ${delay}ms)`);

            if (value && currentHour && currentMinute) {
              // Scroll to current selected time
              debugLog(`📍 Scrolling to selected time: ${currentHour}:${currentMinute}`);
              scrollToTime(currentHour, currentMinute);
            } else if (!hasBeenUsed && !value) {
              // Scroll to default hour "10" only if picker hasn't been used and no value
              debugLog('📍 Scrolling to default hour: 10');
              scrollToDefaultHour();
            } else if (currentHour) {
              // Scroll to just the hour if only hour is set
              debugLog(`📍 Scrolling to selected hour: ${currentHour}`);
              scrollToTime(currentHour, currentMinute || '00');
            }
          }
        }, delay);
      });
    }
  }, [isOpen, hasScrolledToDefault, value, currentHour, currentMinute, hasBeenUsed, scrollToTime, scrollToDefaultHour]);

  const borderColor = isOpen ? C.orange : error ? '#c0392b' : C.hairStrong;

  const footerBtnStyle: React.CSSProperties = {
    flex: 1, padding: '8px 12px', borderRadius: 9, border: `1px solid ${C.hairStrong}`,
    background: 'transparent', color: C.purpleDeep, cursor: 'pointer',
    fontFamily: C.fontBody, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
  };

  const colHead: React.CSSProperties = {
    fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em',
    color: 'rgba(75,29,81,.5)', textTransform: 'uppercase', marginBottom: 8,
  };

  return (
    <Popover open={isOpen} onOpenChange={(o) => { if (!disabled) setIsOpen(o); }}>
      <PopoverAnchor asChild>
        {/* Trigger row — matches the mock TimeField field styling */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 14px', borderRadius: 11, background: '#fff',
          border: `1.5px solid ${borderColor}`,
          boxShadow: isOpen ? '0 0 0 3px rgba(221,83,28,.10)' : 'none',
          opacity: disabled ? 0.6 : 1,
        }}>
          <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex', flexShrink: 0 }}>
            <Clock width={16} height={16} />
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => handleManualTimeInput(e.target.value)}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            maxLength={5}
            disabled={disabled}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontFamily: C.fontBody, fontSize: 14, color: C.ink, minWidth: 0,
              cursor: disabled ? 'not-allowed' : 'text',
            }}
          />
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Open time picker"
              disabled={disabled}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', background: 'transparent', padding: 0, flexShrink: 0,
                color: isOpen ? C.orange : 'rgba(75,29,81,.5)',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <Clock width={16} height={16} />
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        sideOffset={6}
        style={{
          width: 320, background: '#fff', borderRadius: 14,
          border: `1px solid ${C.hairStrong}`, boxShadow: '0 18px 40px rgba(75,29,81,.18)',
          padding: 16, zIndex: 30, fontFamily: C.fontBody,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
          {/* Hours grid */}
          <div>
            <div style={colHead}>Hour</div>
            <div ref={hoursContainerRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
              {hours.map((hour) => {
                const on = currentHour === hour;
                return (
                  <div
                    key={hour}
                    onClick={() => handleHourSelect(hour)}
                    style={{
                      textAlign: 'center', padding: '6px 0', borderRadius: 7,
                      fontSize: 12.5, fontWeight: on ? 700 : 500, cursor: 'pointer',
                      background: on ? C.purpleDeep : C.cream, color: on ? '#fff' : C.ink,
                    }}
                  >
                    {hour}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Minutes grid */}
          <div>
            <div style={colHead}>Minute</div>
            <div ref={minutesContainerRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {minutes.map((minute) => {
                const on = currentMinute === minute;
                return (
                  <div
                    key={minute}
                    onClick={() => handleMinuteSelect(minute)}
                    style={{
                      textAlign: 'center', padding: '6px 0', borderRadius: 7,
                      fontSize: 12.5, fontWeight: on ? 700 : 500, cursor: 'pointer',
                      background: on ? C.orange : C.cream, color: on ? '#fff' : C.ink,
                    }}
                  >
                    {minute}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="button" onClick={handleAsSoonAsPossible} style={footerBtnStyle}>
            {asapButtonText}
          </button>
          <button
            type="button"
            onClick={() => { onChange(''); setIsOpen(false); }}
            style={footerBtnStyle}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{
              padding: '8px 16px', borderRadius: 9, border: 'none',
              background: C.purpleDeep, color: '#fff', cursor: 'pointer',
              fontFamily: C.fontBody, fontSize: 13, fontWeight: 600,
            }}
          >
            Done
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
