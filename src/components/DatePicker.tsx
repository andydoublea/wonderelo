import { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from './ui/popover';
import { C } from './redesign/organizerAtoms';
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

  const hasError = !!className && /destructive|border-red|error/.test(className);
  const borderColor = isOpen ? C.orange : hasError ? '#c0392b' : C.hairStrong;

  // Small round icon button used for month navigation.
  const navBtnStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.hairStrong}`,
    background: '#fff', color: C.purpleDeep, cursor: 'pointer',
  };
  const quickBtnStyle: React.CSSProperties = {
    flex: 1, padding: '8px 12px', borderRadius: 9, border: `1px solid ${C.hairStrong}`,
    background: 'transparent', color: C.purpleDeep, cursor: 'pointer',
    fontFamily: C.fontBody, fontSize: 13, fontWeight: 600,
  };

  return (
    <Popover open={isOpen} onOpenChange={(o) => { if (!disabled) setIsOpen(o); }}>
      <PopoverAnchor asChild>
        {/* Trigger row — matches the mock DateField field styling */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 14px', borderRadius: 11, background: '#fff',
          border: `1.5px solid ${borderColor}`,
          boxShadow: isOpen ? '0 0 0 3px rgba(221,83,28,.10)' : 'none',
          opacity: disabled ? 0.6 : 1,
        }}>
          <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex', flexShrink: 0 }}>
            <CalendarIcon width={16} height={16} />
          </span>
          <input
            type="text"
            value={displayValue}
            onChange={(e) => handleManualDateInput(e.target.value)}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={10}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontFamily: C.fontBody, fontSize: 14, color: C.ink, minWidth: 0,
              cursor: disabled ? 'not-allowed' : 'text',
            }}
          />
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Open calendar"
              disabled={disabled}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', background: 'transparent', padding: 0, flexShrink: 0,
                color: isOpen ? C.orange : 'rgba(75,29,81,.5)',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronRight width={16} height={16} style={{ transform: 'rotate(90deg)' }} />
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        sideOffset={6}
        style={{
          width: 280, background: '#fff', borderRadius: 14,
          border: `1px solid ${C.hairStrong}`, boxShadow: '0 18px 40px rgba(75,29,81,.18)',
          padding: 16, zIndex: 30, fontFamily: C.fontBody,
        }}
      >
        {/* Month navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button type="button" onClick={() => navigateMonth('prev')} style={navBtnStyle} aria-label="Previous month">
            <ChevronLeft width={16} height={16} />
          </button>
          <span style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 15, color: C.purpleDeep }}>
            {monthNames[viewDate.month]} {viewDate.year}
          </span>
          <button type="button" onClick={() => navigateMonth('next')} style={navBtnStyle} aria-label="Next month">
            <ChevronRight width={16} height={16} />
          </button>
        </div>

        {/* Week day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
          {weekDays.map((day, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: 'rgba(75,29,81,.45)', padding: '4px 0' }}>
              {day.charAt(0)}
            </div>
          ))}
        </div>

        {/* Calendar days — exactly 6 weeks, no scroll */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }} ref={daysContainerRef}>
          {calendarDays.map((day, index) => {
            const cellStyle: React.CSSProperties = {
              textAlign: 'center', padding: '7px 0', borderRadius: 8,
              fontSize: 13, fontWeight: day.isSelected ? 700 : 500,
              cursor: day.isPast ? 'not-allowed' : 'pointer',
              background: day.isSelected ? C.orange : (day.isToday ? 'rgba(221,83,28,.08)' : 'transparent'),
              color: day.isSelected ? '#fff' : (day.isToday ? C.orange : C.ink),
              border: day.isToday && !day.isSelected ? `1px solid ${C.orange}` : '1px solid transparent',
              opacity: day.isPast ? 0.35 : (!day.isCurrentMonth ? 0.4 : 1),
              fontFamily: C.fontBody,
            };
            return (
              <button
                key={index}
                type="button"
                disabled={day.isPast}
                onClick={() => handleDateSelect(day.dateStr, day.isPast)}
                style={cellStyle}
              >
                {day.day}
              </button>
            );
          })}
        </div>

        {/* Quick actions */}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.hair}`, display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleTodayClick} style={quickBtnStyle}>Today</button>
          <button type="button" onClick={() => { onChange(''); setDisplayValue(''); }} style={quickBtnStyle}>Clear</button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
