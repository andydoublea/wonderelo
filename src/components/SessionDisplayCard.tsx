import { useState, useEffect } from 'react';
import { NetworkingSession } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Play, Pause, Square, Edit, Trash2, MoreVertical, Copy, BarChart3, Calendar, Users, Clock, AlertTriangle, MapPin, FileText } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { RoundItem } from './RoundItem';
import { DatePicker } from './DatePicker';
import { TimePicker } from './TimePicker';
import { SessionDetailCard } from './SessionDetailCard';
import { RoundRulesDialog, RoundRule } from './RoundRulesDialog';
import { MeetingPointsDialog } from './MeetingPointsDialog';
import { debugLog, errorLog } from '../utils/debug';
import { useTime } from '../contexts/TimeContext';
import { getParametersOrDefault } from '../utils/systemParameters';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';

interface SessionDisplayCardProps {
  session: NetworkingSession;
  showSelectionMode?: boolean; // true for registration mode (with rounds), false for overview
  className?: string;
  variant?: 'running' | 'scheduled' | 'default';
  userSlug?: string; // Optional organizer slug for fetching round rules
  registeredRoundIds?: string[]; // IDs of rounds the participant is registered for
  // Admin mode props
  adminMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onUpdateStatus?: (status: NetworkingSession['status']) => void;
  onUpdateSession?: (id: string, updates: Partial<NetworkingSession>) => void;
  onManage?: () => void;
  isHighlighted?: boolean;
  hideReportButton?: boolean; // Hide Report button and Report menu item
}

export function SessionDisplayCard({ 
  session, 
  showSelectionMode = false, 
  className = '',
  variant = 'default',
  userSlug,
  registeredRoundIds = [],
  adminMode = false,
  onEdit,
  onDelete,
  onDuplicate,
  onUpdateStatus,
  onUpdateSession,
  onManage,
  isHighlighted = false,
  hideReportButton = false
}: SessionDisplayCardProps) {
  // State for round selection (preview only)
  const [selectedRounds, setSelectedRounds] = useState<Set<string>>(new Set());
  
  // Time context for checking round registerability
  const { getCurrentTime } = useTime();
  
  // Dialog states
  const [showMeetingPoints, setShowMeetingPoints] = useState(false);
  const [showRoundRules, setShowRoundRules] = useState(false);
  const [roundRules, setRoundRules] = useState<RoundRule[]>([]);
  
  // Admin mode states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleWarning, setScheduleWarning] = useState('');
  
  // Helper function to check if round is registerable (more than safetyWindowMinutes before start)
  const isRoundRegisterable = (round: any): boolean => {
    if (!session.date || !round.startTime) return true; // If no date/time set, allow registration
    
    // Parse the round start time
    const [hours, minutes] = round.startTime.split(':').map(Number);
    const roundStartDateTime = new Date(round.date || session.date);
    roundStartDateTime.setHours(hours, minutes, 0, 0);
    
    // Get current time (respects simulated time from TimeControl)
    const now = getCurrentTime();
    
    // Calculate difference in milliseconds
    const timeDiff = roundStartDateTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    // Use system parameters from utility (cached with default fallback)
    const params = getParametersOrDefault();
    
    // Round is registerable if it's more than safetyWindowMinutes away
    return minutesDiff > params.safetyWindowMinutes;
  };
  
  // Fetch round rules if userSlug is provided
  useEffect(() => {
    if (!userSlug) return;
    
    const fetchRoundRules = async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/user/${userSlug}/round-rules`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          let rules = data.rules || [];
          
          // Handle legacy string format - convert to empty array
          if (typeof rules === 'string') {
            rules = [];
          }
          
          setRoundRules(rules);
        }
      } catch (error) {
        errorLog('Error fetching round rules:', error);
      }
    };

    fetchRoundRules();
  }, [userSlug]);
  
  // Listen for URL hash changes to open meeting points or round rules
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#meeting-points') {
        setShowMeetingPoints(true);
      } else if (hash === '#round-rules') {
        setShowRoundRules(true);
      }
    };
    
    // Check hash on mount
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
  
  // Validate time whenever date or time changes
  useEffect(() => {
    // Only validate if both date and time are filled
    if (!scheduleDate || !scheduleTime) {
      setScheduleError('');
      return;
    }
    
    // Validate that minutes are multiple of 5
    const [hours, minutes] = scheduleTime.split(':');
    if (parseInt(minutes) % 5 !== 0) {
      setScheduleError('Time must be in 5-minute intervals (e.g., 14:00, 14:05, 14:10).');
      return;
    }
    
    // Check if scheduled time is at least 9 minutes from now (internal validation)
    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
    const now = new Date();
    const nineMinutesFromNow = new Date(now.getTime() + 9 * 60 * 1000);
    
    // Round nineMinutesFromNow to next 5-minute interval for comparison
    const minMinutes = nineMinutesFromNow.getMinutes();
    const roundedMinutes = Math.ceil(minMinutes / 5) * 5;
    nineMinutesFromNow.setMinutes(roundedMinutes);
    nineMinutesFromNow.setSeconds(0);
    nineMinutesFromNow.setMilliseconds(0);
    
    // Normalize scheduledDateTime to remove milliseconds
    scheduledDateTime.setSeconds(0);
    scheduledDateTime.setMilliseconds(0);
    
    if (scheduledDateTime < nineMinutesFromNow) {
      // Show user-friendly message with 10 minutes (even though validation is 9 minutes)
      const displayTime = new Date(now.getTime() + 10 * 60 * 1000);
      const displayMinutes = displayTime.getMinutes();
      const displayRoundedMinutes = Math.ceil(displayMinutes / 5) * 5;
      displayTime.setMinutes(displayRoundedMinutes);
      displayTime.setSeconds(0);
      displayTime.setMilliseconds(0);
      
      const minTime = displayTime.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
      setScheduleError(`Time must be at least 10 minutes in the future (earliest: ${minTime}).`);
      return;
    }
    
    // If we get here, validation passed
    setScheduleError('');
  }, [scheduleDate, scheduleTime]);
  
  // Check if session has rounds and if first round is in the past
  useEffect(() => {
    // Only check if both date and time are filled and there's no error
    if (!scheduleDate || !scheduleTime || scheduleError) {
      setScheduleWarning('');
      return;
    }
    
    // Check if session has rounds
    if (!session.rounds || session.rounds.length === 0) {
      setScheduleWarning('');
      return;
    }
    
    // Get the first round
    const firstRound = session.rounds[0];
    if (!firstRound.startTime) {
      setScheduleWarning('');
      return;
    }
    
    // Check if first round is in the past relative to the new scheduled date/time
    const firstRoundDateTime = new Date(`${scheduleDate}T${firstRound.startTime}:00`);
    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
    
    if (firstRoundDateTime < scheduledDateTime) {
      setScheduleWarning(`The first round "${firstRound.name}" is currently scheduled for ${firstRound.startTime}, which is before the selected start time. All rounds will be automatically shifted to start from ${scheduleTime}.`);
    } else {
      setScheduleWarning('');
    }
  }, [scheduleDate, scheduleTime, scheduleError, session.rounds]);
  
  const toggleRoundSelection = (roundId: string) => {
    setSelectedRounds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roundId)) {
        newSet.delete(roundId);
      } else {
        newSet.add(roundId);
      }
      return newSet;
    });
  };
  
  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return 'Date and time to be determined';
    const sessionDate = new Date(`${date}T${time}`);
    return sessionDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const generateRoundTimeDisplay = (startTime: string, duration: number) => {
    if (!startTime || startTime === 'To be set' || startTime === 'TBD') {
      return `To be set`;
    }
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = startTotalMinutes + duration;
    
    const endHours = Math.floor(endTotalMinutes / 60);
    const endMinutes = endTotalMinutes % 60;
    
    const formatTime = (hours: number, minutes: number) => 
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    const formattedStart = formatTime(startHours, startMinutes);
    const formattedEnd = formatTime(endHours, endMinutes);
    
    return `${formattedStart} - ${formattedEnd}`;
  };

  // Admin mode helper functions
  const isSessionRunning = (session: NetworkingSession) => {
    if (!session.date || !session.startTime || !session.endTime) return false;
    const now = new Date();
    const sessionStart = new Date(`${session.date}T${session.startTime}`);
    const sessionEnd = new Date(`${session.date}T${session.endTime}`);
    return now >= sessionStart && now <= sessionEnd;
  };

  const isRegistrationOpen = (session: NetworkingSession) => {
    if (!session.registrationStart || !session.date) return false;
    const now = new Date().toISOString().split('T')[0];
    return now >= session.registrationStart && now < session.date;
  };

  const getStatusColor = (status: NetworkingSession['status']) => {
    if (status === 'published') return 'default';
    if (status === 'draft') return 'secondary';
    if (status === 'scheduled') return 'default';
    if (status === 'completed') return 'outline';
    return 'secondary';
  };

  // Check if session has any rounds that haven't ended yet
  const hasActiveRounds = () => {
    if (!session.rounds || session.rounds.length === 0) return false;
    if (!session.date) return false;
    
    const now = new Date();
    return session.rounds.some((round: any) => {
      if (!round.startTime) return false;
      const [hours, minutes] = round.startTime.split(':').map(Number);
      const roundStart = new Date(round.date || session.date);
      roundStart.setHours(hours, minutes, 0, 0);
      // Calculate round end time (start + duration)
      const duration = round.duration || session.roundDuration || 0;
      const roundEnd = new Date(roundStart.getTime() + duration * 60 * 1000);
      // Round is active if it hasn't ended yet
      return now < roundEnd;
    });
  };

  const getStatusLabel = (status: NetworkingSession['status']) => {
    if (status === 'published') return 'Published';
    if (status === 'draft') return 'Draft';
    if (status === 'scheduled') return 'Scheduled';
    if (status === 'completed') return 'Completed';
    return status;
  };



  // Calculate estimated groups for non-admin modes
  const estimatedGroups = (() => {
    if (session.limitGroups && session.maxGroups) {
      return session.maxGroups;
    }
    if (session.limitParticipants && session.maxParticipants) {
      return Math.ceil(session.maxParticipants / session.groupSize);
    }
    return 'Unlimited';
  })();

  // Debug session data for dashboard
  debugLog('🎯 DASHBOARD CARD DEBUG - Now using SessionDetailCard:', {
    sessionName: session.name,
    sessionId: session.id,
    enableTeams: session.enableTeams,
    teams: session.teams,
    teamsLength: session.teams?.length || 0,
    enableTopics: session.enableTopics,
    topics: session.topics,
    topicsLength: session.topics?.length || 0,
    adminMode: adminMode,
    estimatedGroups: estimatedGroups
  });

  // Admin mode layout (dashboard)
  if (adminMode) {
    return (
      <>
        <Card 
          className={isHighlighted ? 'animate-highlight-fade' : ''}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg leading-tight">{session.name}</CardTitle>
              <div className="flex items-center gap-2">
                {(session.status === 'draft' || session.status === 'scheduled') && (
                  <Button 
                    variant="outline"
                    size="sm" 
                    onClick={onEdit}
                    className="h-8"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {!hideReportButton && (session.status === 'published' || session.status === 'completed') && (
                  <Button 
                    variant="outline"
                    size="sm" 
                    onClick={onManage}
                    className="h-8"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Report
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                  {!hideReportButton && (
                    <>
                      <DropdownMenuItem onClick={onManage}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Report
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {session.status !== 'completed' && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  {session.status === 'published' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowCompleteDialog(true)}>
                        <Square className="mr-2 h-4 w-4" />
                        Complete
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {getStatusLabel(session.status) && (
              <Badge 
                variant={getStatusColor(session.status)} 
                className="w-fit"
              >
                {getStatusLabel(session.status)}
              </Badge>
            )}
          </CardHeader>
          
          {/* Use SessionDetailCard for consistent rendering */}
          {debugLog('🎯 DASHBOARD using SessionDetailCard')}
          <SessionDetailCard 
            session={session}
            showTitle={false}
            showStatus={false}
            variant="default"
            className="space-y-3"
            noWrapper={true}
          />
        </Card>

        {/* Admin dialogs */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete networking round</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{session.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  onDelete?.();
                  setShowDeleteDialog(false);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete round
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showScheduleDialog} onOpenChange={(open) => {
          setShowScheduleDialog(open);
          if (!open) {
            // Reset form when dialog closes
            setScheduleDate('');
            setScheduleTime('');
            setScheduleError('');
            setScheduleWarning('');
          }
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{session.status === 'published' ? 'Update round on event page' : 'Publish round'}</AlertDialogTitle>
              <AlertDialogDescription>
                {session.status === 'published' 
                  ? `Update the date and time for this round. ${session.rounds && session.rounds.length > 0 ? 'The first round start time will be updated.' : ''}`
                  : `Published rounds are visible on the event page. ${session.rounds && session.rounds.length > 0 ? 'Set the start time for the first round below.' : ''}`
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule-date">Date</Label>
                  <DatePicker
                    value={scheduleDate}
                    onChange={(date) => {
                      setScheduleDate(date);
                    }}
                    placeholder="dd-mm-yyyy"
                    minDate={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-time">{session.rounds && session.rounds.length > 0 ? 'First round start time' : 'Time'}</Label>
                  <TimePicker
                    value={scheduleTime}
                    onChange={(time) => {
                      setScheduleTime(time);
                    }}
                    placeholder="hh:mm"
                  />
                  <p className="text-xs text-muted-foreground">Time will be rounded to 5-minute intervals</p>
                </div>
              </div>
              {scheduleError && (
                <p className="text-sm text-destructive">{scheduleError}</p>
              )}
              {!scheduleError && scheduleWarning && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    {scheduleWarning}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                disabled={!scheduleDate || !scheduleTime || !!scheduleError}
                onClick={async () => {
                  // Check if there are any validation errors
                  if (!scheduleDate || !scheduleTime) {
                    setScheduleError('Please select both date and time.');
                    return;
                  }
                  
                  // If there's already an error from useEffect validation, don't proceed
                  if (scheduleError) {
                    return;
                  }
                  
                  // Always recalculate end time when scheduling (to ensure proper timing)
                  debugLog('🕐 Recalculating endTime for scheduled session:', {
                    sessionName: session.name,
                    originalEndTime: session.endTime,
                    newStartTime: scheduleTime,
                    newDate: scheduleDate
                  });
                  
                  const startDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
                  const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours
                  
                  let endTime;
                  // If end time crosses midnight, we need to handle it properly
                  if (endDateTime.getDate() !== startDateTime.getDate()) {
                    // Session crosses midnight - set endTime to same day 23:59 for now
                    // This prevents the auto-completion bug
                    endTime = '23:59';
                    debugLog('⚠️ Session would cross midnight, setting endTime to 23:59 to prevent auto-completion');
                  } else {
                    // Normal case - format the end time
                    const endHours = endDateTime.getHours();
                    const endMinutes = endDateTime.getMinutes();
                    endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
                  }
                  
                  debugLog('✅ New endTime calculated:', {
                    startTime: scheduleTime,
                    endTime: endTime,
                    duration: '2 hours'
                  });
                  
                  // Update rounds if first round is in the past
                  let updatedRounds = session.rounds;
                  if (session.rounds && session.rounds.length > 0) {
                    const firstRound = session.rounds[0];
                    if (firstRound.startTime) {
                      const firstRoundDateTime = new Date(`${scheduleDate}T${firstRound.startTime}:00`);
                      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
                      
                      if (firstRoundDateTime < scheduledDateTime) {
                        // Update all rounds to shift their times
                        const timeDiff = scheduledDateTime.getTime() - firstRoundDateTime.getTime();
                        updatedRounds = session.rounds.map(round => {
                          const roundDateTime = new Date(`${scheduleDate}T${round.startTime}:00`);
                          const newRoundDateTime = new Date(roundDateTime.getTime() + timeDiff);
                          const newRoundTime = `${newRoundDateTime.getHours().toString().padStart(2, '0')}:${newRoundDateTime.getMinutes().toString().padStart(2, '0')}`;
                          
                          return {
                            ...round,
                            startTime: newRoundTime
                          };
                        });
                        
                        debugLog('⏰ Updated rounds start times:', updatedRounds.map(r => ({ name: r.name, startTime: r.startTime })));
                      }
                    }
                  }
                  
                  // Update session with new date, time and status
                  // Set registrationStart to now ONLY if session is not already published
                  const now = new Date();
                  const isAlreadyPublished = session.status === 'published';
                  
                  const updates: any = {
                    status: 'published',
                    date: scheduleDate,
                    startTime: scheduleTime,
                    endTime: endTime,
                    rounds: updatedRounds
                  };
                  
                  // Only set registrationStart if session is being published for the first time
                  if (!isAlreadyPublished) {
                    updates.registrationStart = now.toISOString();
                  }
                  
                  if (onUpdateSession) {
                    await onUpdateSession(session.id, updates);
                    
                    // Show success toast
                    const toastMessage = isAlreadyPublished ? 'Round updated on event page' : 'Round is now published';
                    const toastDescription = updatedRounds !== session.rounds 
                      ? `${session.name} has been updated. All rounds have been updated to start from ${scheduleTime}.`
                      : isAlreadyPublished
                        ? `${session.name} has been updated and scheduled for ${scheduleDate} at ${scheduleTime}`
                        : `${session.name} is now published and scheduled for ${scheduleDate} at ${scheduleTime}`;
                    toast.success(toastMessage, {
                      description: toastDescription
                    });
                  } else if (onUpdateStatus) {
                    onUpdateStatus('published');
                    toast.success(isAlreadyPublished ? 'Round updated' : 'Round is now published');
                  }
                  
                  // Close dialog (reset happens in onOpenChange)
                  setShowScheduleDialog(false);
                }}
              >
                {session.status === 'published' ? 'Update on event page' : 'Publish to event page'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Complete networking round</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to complete "{session.name}"? This will end the session and remove it from event page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={async () => {
                  if (onUpdateSession) {
                    await onUpdateSession(session.id, { 
                      status: 'completed',
                      liveSubStatus: undefined
                    });
                  } else if (onUpdateStatus) {
                    onUpdateStatus('completed');
                  }
                  setShowCompleteDialog(false);
                  toast.success('Round completed');
                }}
              >
                Complete round
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Registration mode layout (like SessionRegistration)
  if (showSelectionMode) {
    return (
      <Card className={`${className} transition-all hover:border-muted-foreground/20`}>
        <CardContent className="pt-[16px] pr-[16px] pb-[45px] pl-[16px]">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {session.name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {session.date ? new Date(session.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  }) : 'Date To be set'}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {session.roundDuration} min rounds
                </div>
              </div>
            </div>

          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            {session.limitParticipants ? `Max ${session.maxParticipants}` : 'Unlimited'} participants • Groups of {session.groupSize}
          </div>

          {/* Meeting Points and Round Rules Links */}
          <div id="meeting-points" className="flex items-center gap-4 text-sm text-muted-foreground mb-1">
            <button
              type="button"
              onClick={() => setShowMeetingPoints(true)}
              className="flex items-center gap-1 text-foreground underline hover:text-primary"
            >
              <MapPin className="h-3.5 w-3.5" />
              Meeting points
            </button>
            <button
              type="button"
              onClick={() => setShowRoundRules(true)}
              className="flex items-center gap-1 text-foreground underline hover:text-primary"
            >
              <FileText className="h-3.5 w-3.5" />
              Round rules
            </button>
          </div>

          {/* Rounds Selection */}
          {session.rounds && session.rounds.length > 0 && (
            <div className="mt-3">

              <div className="space-y-2">
                {session.rounds.map((round, roundIndex) => {
                  const isRegisteredRound = registeredRoundIds.includes(round.id);
                  const canRegister = isRoundRegisterable(round);
                  
                  // Filter logic: Don't show non-registerable rounds unless they are:
                  // 1. Already registered for this round OR
                  // 2. The last non-registerable round in the session (to show "Registration closed")
                  if (!canRegister && !isRegisteredRound) {
                    // Find if this is the last non-registerable round
                    const lastNonRegisterableIndex = session.rounds
                      .map((r, i) => ({ round: r, index: i }))
                      .filter(({ round: r }) => !isRoundRegisterable(r) && !registeredRoundIds.includes(r.id))
                      .pop()?.index;
                    
                    // Only show if this is the last non-registerable round
                    if (roundIndex !== lastNonRegisterableIndex) {
                      return null;
                    }
                  }
                  
                  return (
                    <RoundItem
                      key={round.id}
                      round={round}
                      session={session}
                      isSelected={selectedRounds.has(round.id)}
                      isRegistered={isRegisteredRound}
                      isRegisterable={canRegister}
                      onSelect={toggleRoundSelection}
                      generateRoundTimeDisplay={generateRoundTimeDisplay}
                      registeredCount={round.registeredCount}
                    />
                  );
                })}
              </div>
            </div>
          )}

        </CardContent>
        
        {/* Meeting Points Dialog */}
        <MeetingPointsDialog
          open={showMeetingPoints}
          onOpenChange={(open) => {
            setShowMeetingPoints(open);
            if (!open && window.location.hash === '#meeting-points') {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }}
          meetingPoints={session.meetingPoints}
        />
        
        {/* Dialog for Round Rules */}
        <RoundRulesDialog
          open={showRoundRules}
          onOpenChange={(open) => {
            setShowRoundRules(open);
            if (!open && window.location.hash === '#round-rules') {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }}
          rules={roundRules}
        />
      </Card>
    );
  }

  // Overview mode layout (like UserPublicPage)
  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg leading-tight">
            {session.name}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {session.date ? new Date(session.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'Date to be determined'}
          <span className="mx-2">•</span>
          <Clock className="h-4 w-4" />
          {session.roundDuration} min rounds
        </div>
        
        {/* Time */}
        {session.startTime && session.endTime && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {session.startTime} - {session.endTime}
          </div>
        )}
        
        {/* Participants and Groups */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {session.limitParticipants ? `Max ${session.maxParticipants}` : 'Unlimited'} participants • {session.limitGroups ? `Max ${session.maxGroups}` : (typeof estimatedGroups === 'number' ? `${estimatedGroups}` : 'Unlimited')} groups of {session.groupSize}
        </div>

        {/* Additional info (overview mode) */}
        <div className="space-y-2">
          {/* Teams */}
          {session.enableTeams && session.teams && session.teams.length > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Teams:</span>
              <p className="mt-1 text-xs bg-muted p-2 rounded">
                {session.teams.slice(0, 3).join(', ')}
                {session.teams.length > 3 && ` +${session.teams.length - 3} more`}
              </p>
            </div>
          )}

          {/* Topics */}
          {session.enableTopics && session.topics && session.topics.length > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Topics:</span>
              <p className="mt-1 text-xs bg-muted p-2 rounded">
                {session.topics.slice(0, 3).join(', ')}
                {session.topics.length > 3 && ` +${session.topics.length - 3} more`}
              </p>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Recurring:</span>
            <span className="capitalize">{session.isRecurring ? session.frequency : 'One-time'}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Rounds:</span>
            <span>{session.rounds?.length || 0} rounds</span>
          </div>

          {/* Meeting Points */}
          {session.meetingPoints && session.meetingPoints.length > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Meeting points:</span>
              <p className="mt-1 text-xs bg-muted p-2 rounded">
                {session.meetingPoints.slice(0, 2).map(p => typeof p === 'string' ? p : p.name).join(', ')}
                {session.meetingPoints.length > 2 && ` +${session.meetingPoints.length - 2} more`}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}