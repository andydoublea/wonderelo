import { useState, useEffect } from 'react';
import { Clock, X, RotateCcw } from 'lucide-react';
import { useTime } from '../contexts/TimeContext';
import { Button } from './ui/button';

export function TimeControl() {
  const { getCurrentTime, setSimulatedTime, simulatedTime } = useTime();
  const [isOpen, setIsOpen] = useState(false);
  const [hoursInput, setHoursInput] = useState('');
  const [minutesInput, setMinutesInput] = useState('');
  const [secondsInput, setSecondsInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [, setTick] = useState(0); // Force re-render every second

  // Load saved time settings from localStorage on mount
  useEffect(() => {
    const savedHours = localStorage.getItem('timeControl_hours');
    const savedMinutes = localStorage.getItem('timeControl_minutes');
    const savedSeconds = localStorage.getItem('timeControl_seconds');
    const savedDate = localStorage.getItem('timeControl_lastDate');
    
    if (savedHours) setHoursInput(savedHours);
    if (savedMinutes) setMinutesInput(savedMinutes);
    if (savedSeconds) setSecondsInput(savedSeconds);
    if (savedDate) setDateInput(savedDate);
  }, []);

  // Update time display every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const handleSetTime = () => {
    if (hoursInput !== '' && minutesInput !== '') {
      const hours = parseInt(hoursInput);
      const minutes = parseInt(minutesInput);
      const seconds = secondsInput !== '' ? parseInt(secondsInput) : 0;
      
      const newDate = dateInput ? new Date(dateInput) : new Date();
      newDate.setHours(hours, minutes, seconds, 0);
      setSimulatedTime(newDate);
      
      // Save to localStorage
      localStorage.setItem('timeControl_hours', hoursInput);
      localStorage.setItem('timeControl_minutes', minutesInput);
      localStorage.setItem('timeControl_seconds', secondsInput);
      if (dateInput) {
        localStorage.setItem('timeControl_lastDate', dateInput);
      }
    }
  };

  const handleReset = () => {
    setSimulatedTime(null);
    setHoursInput('');
    setMinutesInput('');
    setSecondsInput('');
    setDateInput('');
    // Clear localStorage
    localStorage.removeItem('timeControl_hours');
    localStorage.removeItem('timeControl_minutes');
    localStorage.removeItem('timeControl_seconds');
    localStorage.removeItem('timeControl_lastDate');
  };

  const currentTime = getCurrentTime();
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 transition-colors"
          title="Time control"
        >
          <Clock className="h-4 w-4" />
          <div className="text-sm">
            <div className="font-medium">{formattedTime}</div>
            <div className="text-xs opacity-80">{formattedDate}</div>
          </div>
          {simulatedTime && (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Simulated time active" />
          )}
        </button>
      ) : (
        <div className="bg-background border rounded-lg shadow-xl p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Time control</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Current time</label>
              <div className="text-sm font-medium">
                {formattedTime}
                {simulatedTime && (
                  <span className="ml-2 text-xs text-green-600">(Simulated)</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{formattedDate}</div>
            </div>

            <div className="border-t pt-3 space-y-2">
              <label className="text-xs text-muted-foreground block">Set custom time</label>
              
              <div>
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Date (optional)"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Hour (24h)</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={hoursInput}
                    onChange={(e) => setHoursInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary text-center"
                    placeholder="00"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Min</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutesInput}
                    onChange={(e) => setMinutesInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary text-center"
                    placeholder="00"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Sec</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={secondsInput}
                    onChange={(e) => setSecondsInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary text-center"
                    placeholder="00"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSetTime}
                  disabled={hoursInput === '' || minutesInput === ''}
                  className="flex-1"
                  size="sm"
                >
                  Set time
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  title="Reset to real time"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground border-t pt-2">
              Use this to test time-dependent features like countdowns and confirmations.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}