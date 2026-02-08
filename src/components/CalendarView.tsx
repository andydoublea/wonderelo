import { useState } from 'react';
import { NetworkingSession } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Clock, Search, X } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface CalendarViewProps {
  sessions: NetworkingSession[];
  isLoading?: boolean;
  onEditSession: (session: NetworkingSession) => void;
  onManageSession: (session: NetworkingSession) => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: 'all' | 'draft' | 'scheduled' | 'published' | 'completed';
  onStatusFilterChange?: (value: 'all' | 'draft' | 'scheduled' | 'published' | 'completed') => void;
}

export function CalendarView({
  sessions,
  isLoading = false,
  onEditSession,
  onManageSession,
  searchQuery = '',
  onSearchChange,
  statusFilter = 'all',
  onStatusFilterChange,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get current month and year
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

  // Generate calendar days
  const calendarDays: (number | null)[] = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Create a map of session display order based on their round date
  const getSessionDisplayOrderMap = () => {
    const orderMap = new Map<string, number>();
    
    // Sort ALL sessions globally by date and time
    const sortedSessions = [...sessions]
      .filter(session => session.date) // Only sessions with a date
      .sort((a, b) => {
        // First, sort by date
        if (a.date !== b.date) {
          return (a.date || '').localeCompare(b.date || '');
        }
        // If same date, sort by start time
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }
        // Fallback to ID
        return (a.id || '').localeCompare(b.id || '');
      });
    
    // Assign global order to each session
    sortedSessions.forEach((session, index) => {
      orderMap.set(session.id || '', index);
    });
    
    return orderMap;
  };

  const sessionDisplayOrderMap = getSessionDisplayOrderMap();

  // Get all items (registration bars + round sessions) for a specific date
  const getItemsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const items: Array<{
      type: 'registration' | 'round';
      session: NetworkingSession;
      displayOrder: number;
    }> = [];

    sessions.forEach(session => {
      // Check if this is the round date
      if (session.date === dateStr) {
        items.push({
          type: 'round',
          session,
          displayOrder: 1000 + (sessionDisplayOrderMap.get(session.id || '') || 0), // High number to sort after registrations
        });
      }
      
      // Check if registration is open on this date
      if (session.registrationStart && session.date) {
        const registrationEndDate = session.date;
        if (dateStr >= session.registrationStart && dateStr < registrationEndDate) {
          items.push({
            type: 'registration',
            session,
            displayOrder: sessionDisplayOrderMap.get(session.id || '') || 0,
          });
        }
      }
    });

    // Sort: registration bars first (by their display order), then round sessions
    items.sort((a, b) => a.displayOrder - b.displayOrder);

    return items;
  };



  // Check if date is today
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Check if session is currently running
  const isSessionRunning = (session: NetworkingSession) => {
    if (!session.date || !session.startTime || !session.endTime) return false;
    const now = new Date();
    const sessionStart = new Date(`${session.date}T${session.startTime}`);
    const sessionEnd = new Date(`${session.date}T${session.endTime}`);
    return now >= sessionStart && now <= sessionEnd;
  };

  // Check if registration is currently open
  const isRegistrationOpen = (session: NetworkingSession) => {
    if (!session.registrationStart || !session.date) return false;
    const now = new Date().toISOString().split('T')[0];
    return now >= session.registrationStart && now < session.date;
  };

  const getStatusColor = (session: NetworkingSession) => {
    // Check for flags first
    if (isSessionRunning(session)) return 'bg-green-600 hover:bg-green-700';
    
    // Then check main status
    if (session.status === 'published') return 'bg-purple-600 hover:bg-purple-700';
    if (session.status === 'draft') return 'bg-gray-500 hover:bg-gray-600';
    if (session.status === 'scheduled') return 'bg-blue-600 hover:bg-blue-700';
    if (session.status === 'completed') return 'bg-gray-400 hover:bg-gray-500';
    return 'bg-gray-400 hover:bg-gray-500';
  };

  // Count sessions in current month
  const sessionsInMonth = sessions.filter((session) => {
    if (!session.date) return false;
    const sessionDate = new Date(session.date);
    return sessionDate.getMonth() === month && sessionDate.getFullYear() === year;
  }).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg sm:text-xl">
            {monthNames[month]} {year}
          </h3>
          {sessionsInMonth > 0 && (
            <Badge variant="secondary" className="ml-2">
              {sessionsInMonth} {sessionsInMonth === 1 ? 'round' : 'rounds'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend and Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded bg-gray-500" />
            <span className="text-muted-foreground">Draft</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded bg-blue-600" />
            <span className="text-muted-foreground">Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded bg-purple-300" />
            <span className="text-muted-foreground">Registration open</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded bg-purple-600" />
            <span className="text-muted-foreground">Published on event page</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded bg-green-500" />
            <span className="text-muted-foreground">Running</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded bg-gray-400" />
            <span className="text-muted-foreground">Completed</span>
          </div>
        </div>

        {/* Search and Filter Controls */}
        {(onSearchChange || onStatusFilterChange) && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            {onSearchChange && (
              <div className="relative w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rounds..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="h-9 pl-9 pr-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSearchChange('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Status Filter */}
            {onStatusFilterChange && (
              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published on event page</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Day Names */}
        <div className="grid grid-cols-7 bg-muted/50 border-b">
          {dayNames.map((day) => (
            <div
              key={day}
              className="px-2 py-3 text-center text-sm text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days - Stacked Layout */}
        <div className="relative">
          {/* Background Grid for structure */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-[100px] md:min-h-[140px] border-r border-b bg-muted/20"
                  />
                );
              }

              const items = getItemsForDate(day);
              const today = isToday(day);

              return (
                <div
                  key={day}
                  className={`min-h-[100px] md:min-h-[140px] border-r border-b p-1 md:p-2 relative ${
                    today ? 'bg-accent/30' : 'bg-background'
                  } hover:bg-muted/30 transition-colors`}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm ${
                        today
                          ? 'bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {day}
                    </span>
                    {items.length > 0 && (
                      <div className="flex items-center gap-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                      </div>
                    )}
                  </div>

                  {/* All Items (Registration Bars + Round Sessions) */}
                  <div className="space-y-1 mt-2">
                    {items.map((item, idx) => {
                      if (item.type === 'registration') {
                        return (
                          <button
                            key={`reg-${day}-${item.session.id || 'unknown'}-${idx}`}
                            onClick={() => onEditSession(item.session)}
                            className="w-full text-left"
                          >
                            <div
                              className="text-xs px-2 py-1 rounded bg-purple-300 text-gray-900 hover:bg-purple-400 transition-colors cursor-pointer"
                              title={`Registration open: ${item.session.name}`}
                            >
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate font-medium">{item.session.name}</span>
                              </div>
                              <div className="truncate text-[10px] opacity-90 mt-0.5">
                                Registration
                              </div>
                            </div>
                          </button>
                        );
                      } else {
                        const sessionColor = getStatusColor(item.session);
                        return (
                          <button
                            key={`round-${day}-${item.session.id || 'unknown'}-${idx}`}
                            onClick={() => onManageSession(item.session)}
                            className="w-full text-left"
                          >
                            <div
                              className={`text-xs px-2 py-1 rounded text-white transition-colors cursor-pointer ${sessionColor}`}
                              title={`${item.session.name}${item.session.startTime && item.session.endTime ? ` (${item.session.startTime} - ${item.session.endTime})` : ''}`}
                            >
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate font-medium">{item.session.name}</span>
                              </div>
                              {item.session.startTime && item.session.endTime && (
                                <div className="flex items-center gap-1 mt-0.5 opacity-90">
                                  <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                                  <span className="text-[10px]">{item.session.startTime} - {item.session.endTime}</span>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      }
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty state message */}
      {sessionsInMonth === 0 && sessions.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No rounds scheduled for {monthNames[month]} {year}</p>
          <p className="text-sm mt-1">Navigate to other months to see your rounds</p>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>No networking rounds yet</p>
          <p className="text-sm mt-1">Create your first round to see it in the calendar</p>
        </div>
      )}
    </div>
  );
}
