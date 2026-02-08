import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { Clock } from 'lucide-react';
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
  useNowForAsap = false
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
        const minuteIndex = parseInt(targetMinute, 10) / 5;
        const viewportHeight = 208;
        const scrollPosition = (minuteIndex * buttonHeight) - (viewportHeight / 2) + (buttonHeight / 2);
        scrollContainer.scrollTop = Math.max(0, scrollPosition);
        debugLog('✅ Scrolled to minute:', targetMinute, 'position:', scrollPosition);
      }
    }
    
    setHasScrolledToDefault(true);
  }, []);
  
  // Function to scroll to default hour "10" when no time is set
  const scrollToDefaultHour = useCallback(() => {
    scrollToTime('10', '00');
  }, [scrollToTime]);

  // Generate hours (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, '0')
  );

  // Generate minutes in 5-minute increments (0, 5, 10, ..., 55)
  const minutes = Array.from({ length: 12 }, (_, i) => 
    (i * 5).toString().padStart(2, '0')
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
      const hours = targetTime.getHours().toString().padStart(2, '0');
      const mins = targetTime.getMinutes().toString().padStart(2, '0');
      const newTime = `${hours}:${mins}`;
      
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
    
    const minutes = targetTime.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 5) * 5;
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

  return (
    <div className="flex gap-2">
      {/* Manual time input */}
      <Input
        type="text"
        value={value}
        onChange={(e) => handleManualTimeInput(e.target.value)}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        className={`flex-1 ${error ? 'border-destructive' : ''} ${className || ''}`}
        maxLength={5}
        disabled={disabled}
      />
      
      {/* Time picker button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            type="button"
            disabled={disabled}
            className="shrink-0"
          >
            <Clock className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="start">
          <div className="flex">
            {/* Hours */}
            <div className="flex-1 border-r">
              <div className="p-3 text-sm font-medium border-b">Hours</div>
              <ScrollArea className="h-52">
                <div className="p-1" ref={hoursContainerRef}>
                  {hours.map((hour) => (
                    <Button
                      key={hour}
                      variant={currentHour === hour ? "default" : "ghost"}
                      className="w-full justify-center text-sm h-8 mb-1"
                      onClick={() => handleHourSelect(hour)}
                      type="button"
                    >
                      {hour}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Minutes */}
            <div className="flex-1">
              <div className="p-3 text-sm font-medium border-b">Minutes</div>
              <ScrollArea className="h-52">
                <div className="p-1" ref={minutesContainerRef}>
                  {minutes.map((minute) => (
                    <Button
                      key={minute}
                      variant={currentMinute === minute ? "default" : "ghost"}
                      className="w-full justify-center text-sm h-8 mb-1"
                      onClick={() => handleMinuteSelect(minute)}
                      type="button"
                    >
                      {minute}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="p-3 border-t flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAsSoonAsPossible}
              type="button"
              className="flex-1"
            >
              {asapButtonText}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              type="button"
              className="flex-1"
            >
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}