import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { debugLog } from '../utils/debug';

interface DatePickerProps {
  value: string; // Still expects yyyy-mm-dd format internally
  onChange: (date: string) => void; // Still passes yyyy-mm-dd format
  placeholder?: string;
  className?: string;
  minDate?: string;
  disabled?: boolean;
}

export function DatePicker({ value, onChange, placeholder = "dd-mm-yyyy", className, minDate, disabled = false }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolledToDefault, setHasScrolledToDefault] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    // Set initial view date
    if (value) {
      const date = new Date(value + 'T00:00:00');
      return { year: date.getFullYear(), month: date.getMonth() };
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });
  
  const daysContainerRef = useRef<HTMLDivElement>(null);
  
  // Helper functions for date format conversion
  const convertToDisplayFormat = (isoDate: string): string => {
    if (!isoDate || isoDate.length !== 10) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
  };
  
  const convertToISOFormat = (displayDate: string): string => {
    if (!displayDate) return '';
    // Handle different input patterns
    const cleaned = displayDate.replace(/[^\d-]/g, '');
    const parts = cleaned.split('-');
    
    if (parts.length === 3) {
      const [day, month, year] = parts;
      // Validate basic ranges
      if (day && month && year && 
          day.length <= 2 && month.length <= 2 && year.length <= 4 &&
          parseInt(day) >= 1 && parseInt(day) <= 31 &&
          parseInt(month) >= 1 && parseInt(month) <= 12) {
        return `${year.padStart(4, '20')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    return '';
  };
  
  // Reset scroll state when picker closes/opens
  useEffect(() => {
    if (isOpen) {
      setHasScrolledToDefault(false);
    }
  }, [isOpen]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Generate calendar days for current view
  const generateCalendarDays = () => {
    const year = viewDate.year;
    const month = viewDate.month;
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Monday of the week containing the first day
    const startDate = new Date(firstDay);
    const dayOfWeek = (firstDay.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Generate 6 weeks (42 days) to fill the calendar
    for (let i = 0; i < 42; i++) {
      const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
      const isCurrentMonth = currentDate.getMonth() === month;
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === value;
      const isPast = minDate && dateStr < minDate;
      
      days.push({
        date: new Date(currentDate),
        dateStr,
        day: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        isSelected,
        isPast: Boolean(isPast)
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const handleDateSelect = (dateStr: string, isPast: boolean) => {
    if (isPast) return;
    onChange(dateStr); // dateStr is already in yyyy-mm-dd format
    // Keep picker open for easier multi-selection scenarios
  };

  const [displayValue, setDisplayValue] = useState(() => convertToDisplayFormat(value));
  
  useEffect(() => {
    setDisplayValue(convertToDisplayFormat(value));
  }, [value]);
  
  const handleManualDateInput = (inputValue: string) => {
    // Update display value immediately for responsive typing
    setDisplayValue(inputValue);
    
    // Auto-format DD-MM-YYYY while typing
    let formattedValue = inputValue;
    
    // Add dashes automatically
    if (inputValue.length === 2 && !inputValue.includes('-')) {
      formattedValue = inputValue + '-';
      setDisplayValue(formattedValue);
    } else if (inputValue.length === 5 && inputValue.split('-').length === 2) {
      formattedValue = inputValue + '-';
      setDisplayValue(formattedValue);
    }
    
    // Limit to reasonable format (DD-MM-YYYY)
    if (formattedValue.length <= 10) {
      // Try to convert to ISO format and validate when complete
      if (formattedValue.length === 10) {
        const isoDate = convertToISOFormat(formattedValue);
        
        if (isoDate) {
          // Valid complete date entered, update with ISO format
          onChange(isoDate);
          
          // Update view date
          try {
            const date = new Date(isoDate + 'T00:00:00');
            if (!isNaN(date.getTime())) {
              setViewDate({ year: date.getFullYear(), month: date.getMonth() });
            }
          } catch (e) {
            // Invalid date, ignore
          }
        }
      }
      // For partial input, we don't update the onChange value
      // The display value is updated above for immediate feedback
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text when focusing the input
    e.target.select();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setViewDate(prev => {
      const newMonth = direction === 'next' ? prev.month + 1 : prev.month - 1;
      let newYear = prev.year;
      let adjustedMonth = newMonth;
      
      if (adjustedMonth > 11) {
        adjustedMonth = 0;
        newYear++;
      } else if (adjustedMonth < 0) {
        adjustedMonth = 11;
        newYear--;
      }
      
      return { year: newYear, month: adjustedMonth };
    });
  };

  // Auto-navigate to month containing selected/today date when picker opens
  const navigateToRelevantDate = useCallback(() => {
    const days = generateCalendarDays();
    let targetDay = null;
    
    // Priority: selected date > today
    if (value) {
      const selectedDate = new Date(value + 'T00:00:00');
      if (!isNaN(selectedDate.getTime())) {
        const targetYear = selectedDate.getFullYear();
        const targetMonth = selectedDate.getMonth();
        
        // Only navigate if we're not already showing the correct month
        if (viewDate.year !== targetYear || viewDate.month !== targetMonth) {
          debugLog('📅 Navigating to selected date month:', targetYear, targetMonth);
          setViewDate({ year: targetYear, month: targetMonth });
        }
      }
    }
  }, [value, viewDate.year, viewDate.month]);

  const handleTodayClick = () => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    
    if (viewDate.year !== todayYear || viewDate.month !== todayMonth) {
      debugLog('📅 Navigating to today month:', todayYear, todayMonth);
      setViewDate({ year: todayYear, month: todayMonth });
    }
    
    // Use local date instead of UTC to avoid timezone issues
    const todayStr = `${todayYear}-${(todayMonth + 1).toString().padStart(2, '0')}-${todayDay.toString().padStart(2, '0')}`;
    onChange(todayStr);
  };

  // Auto-navigate to relevant month when picker opens
  useEffect(() => {
    if (isOpen && !hasScrolledToDefault) {
      debugLog('🔄 Auto-navigating to relevant date month');
      navigateToRelevantDate();
    }
  }, [isOpen, hasScrolledToDefault, navigateToRelevantDate]);

  const calendarDays = generateCalendarDays();
  const todayDate = new Date();
  const today = `${todayDate.getFullYear()}-${(todayDate.getMonth() + 1).toString().padStart(2, '0')}-${todayDate.getDate().toString().padStart(2, '0')}`;

  return (
    <div className="flex gap-2">
      {/* Manual date input */}
      <Input
        type="text"
        value={displayValue}
        onChange={(e) => handleManualDateInput(e.target.value)}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        className={`flex-1 ${className || ''}`}
        disabled={disabled}
        maxLength={10}
      />
      
      {/* Date picker button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            type="button"
            className="shrink-0"
            disabled={disabled}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          {/* Month navigation */}
          <div className="flex items-center justify-between p-3 border-b">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigateMonth('prev')}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="font-medium">
              {monthNames[viewDate.month]} {viewDate.year}
            </div>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigateMonth('next')}
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar grid */}
          <div className="p-3">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days - exactly 6 weeks, no scroll */}
            <div className="grid grid-cols-7 gap-1" ref={daysContainerRef}>
              {calendarDays.map((day, index) => (
                <Button
                  key={index}
                  variant={day.isSelected ? "default" : "ghost"}
                  className={`h-9 w-9 p-0 text-sm ${
                    !day.isCurrentMonth 
                      ? 'text-muted-foreground opacity-50' 
                      : ''
                  } ${
                    day.isToday && !day.isSelected
                      ? 'border border-primary bg-primary/10 text-primary hover:bg-primary/20'
                      : ''
                  } ${
                    day.isPast
                      ? 'opacity-40 cursor-not-allowed hover:bg-transparent'
                      : ''
                  }`}
                  onClick={() => handleDateSelect(day.dateStr, day.isPast)}
                  disabled={day.isPast}
                  type="button"
                >
                  {day.day}
                </Button>
              ))}
            </div>
            
            {/* Quick actions */}
            <div className="mt-3 pt-3 border-t flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTodayClick}
                type="button"
                className="flex-1"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange('');
                  setDisplayValue('');
                }}
                type="button"
                className="flex-1"
              >
                Clear
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}