import { useState, useEffect, useRef } from 'react';
import { NetworkingSession } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Users, Clock, Calendar, Settings, Plus, X, MapPin, ChevronUp, ChevronDown, GripVertical, HelpCircle, Play, MessageCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Checkbox } from './ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { SessionPreview } from './SessionPreview';
import { TimePicker } from './TimePicker';
import { DatePicker } from './DatePicker';
import { MeetingPointsManager } from './MeetingPointsManager';
import { IceBreakersManager } from './IceBreakersManager';
import { DEFAULT_ICE_BREAKERS } from '../utils/defaultIceBreakers';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { debugLog, errorLog } from '../utils/debug';
import { fetchSystemParameters, type SystemParameters } from '../utils/systemParameters';

interface SessionFormProps {
  initialData?: NetworkingSession | null;
  onSubmit: (session: Omit<NetworkingSession, 'id'>) => void;
  onCancel?: () => void;
  userEmail?: string;
  organizerName?: string;
  profileImageUrl?: string;
  userSlug?: string;
  isDuplicate?: boolean;
}

export function SessionForm({ initialData, onSubmit, onCancel, userEmail, organizerName, profileImageUrl, userSlug, isDuplicate }: SessionFormProps) {
  const [availableIceBreakers, setAvailableIceBreakers] = useState<string[]>([]);
  const [systemParams, setSystemParams] = useState<SystemParameters | null>(null);
  
  // Check if first round has already started or passed
  const hasFirstRoundStarted = (): boolean => {
    if (!initialData || isDuplicate) return false;
    
    const now = new Date();
    
    // If session has rounds array, check the first round
    if (initialData.rounds && initialData.rounds.length > 0) {
      const firstRound = initialData.rounds[0];
      if (firstRound.date && firstRound.startTime) {
        const [hours, minutes] = firstRound.startTime.split(':').map(Number);
        const roundStart = new Date(firstRound.date);
        roundStart.setHours(hours, minutes, 0, 0);
        return now >= roundStart;
      }
    }
    
    // If no rounds array, check based on session date and startTime
    if (initialData.date && initialData.startTime) {
      const [hours, minutes] = initialData.startTime.split(':').map(Number);
      const sessionStart = new Date(initialData.date);
      sessionStart.setHours(hours, minutes, 0, 0);
      return now >= sessionStart;
    }
    
    return false;
  };
  
  // Count how many rounds have already started or passed
  const getStartedRoundsCount = (): number => {
    if (!initialData || isDuplicate) return 0;
    
    const now = new Date();
    let startedCount = 0;
    
    // If session has rounds array, count started rounds
    if (initialData.rounds && initialData.rounds.length > 0) {
      for (const round of initialData.rounds) {
        if (round.date && round.startTime) {
          const [hours, minutes] = round.startTime.split(':').map(Number);
          const roundStart = new Date(round.date);
          roundStart.setHours(hours, minutes, 0, 0);
          if (now >= roundStart) {
            startedCount++;
          }
        }
      }
    }
    
    return startedCount;
  };
  
  const firstRoundStarted = hasFirstRoundStarted();
  const minRoundsAllowed = getStartedRoundsCount();
  
  // Fetch system parameters (includes all defaults and constraints)
  useEffect(() => {
    const loadParams = async () => {
      try {
        const params = await fetchSystemParameters();
        setSystemParams(params);
      } catch (error) {
        errorLog('Error fetching system parameters:', error);
      }
    };
    loadParams();
  }, []);
  
  // Fetch available ice breakers from API
  useEffect(() => {
    const fetchIceBreakers = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/ice-breakers`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setAvailableIceBreakers(data.iceBreakers || DEFAULT_ICE_BREAKERS);
        } else {
          setAvailableIceBreakers(DEFAULT_ICE_BREAKERS);
        }
      } catch (error) {
        errorLog('Error fetching ice breakers:', error);
        setAvailableIceBreakers(DEFAULT_ICE_BREAKERS);
      }
    };
    fetchIceBreakers();
  }, []);

  // Helper function to get 3 random default ice breakers
  const getDefaultIceBreakers = (questions: string[] = availableIceBreakers) => {
    if (questions.length === 0) return [];
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3).map((question, index) => ({
      id: `ib_default_${Date.now()}_${index}`,
      question
    }));
  };

  const [formData, setFormData] = useState<Omit<NetworkingSession, 'id'>>({
    name: initialData?.name || '',
    date: initialData?.date || '',
    startTime: initialData?.startTime || '',
    endTime: initialData?.endTime || '',
    roundDuration: initialData?.roundDuration || (systemParams?.defaultRoundDuration ?? 10),
    numberOfRounds: initialData?.numberOfRounds || (systemParams?.defaultNumberOfRounds ?? 1),
    gapBetweenRounds: initialData?.gapBetweenRounds || (systemParams?.defaultGapBetweenRounds ?? 10),
    limitParticipants: initialData?.limitParticipants ?? (systemParams?.defaultLimitParticipants ?? false),
    maxParticipants: initialData?.maxParticipants || (systemParams?.defaultMaxParticipants ?? 20),
    groupSize: initialData?.groupSize || (systemParams?.defaultGroupSize ?? 2),
    limitGroups: initialData?.limitGroups ?? (systemParams?.defaultLimitGroups ?? false),
    maxGroups: initialData?.maxGroups || 10,
    status: initialData?.status || 'draft',
    registrationStart: initialData?.registrationStart,
    isRecurring: initialData?.isRecurring || false,
    frequency: initialData?.frequency || 'weekly',
    rounds: initialData?.rounds || [],
    enableTeams: initialData?.enableTeams || false,
    allowMultipleTeams: initialData?.allowMultipleTeams || false,
    matchingType: initialData?.matchingType || 'within-team',
    teams: initialData?.teams || [],
    enableTopics: initialData?.enableTopics || false,
    allowMultipleTopics: initialData?.allowMultipleTopics || false,
    topics: initialData?.topics || [],
    meetingPoints: initialData?.meetingPoints?.length ? initialData.meetingPoints : [],
    iceBreakers: initialData?.iceBreakers && initialData.iceBreakers.length > 0 ? initialData.iceBreakers : []
  });

  // Update formData when systemParams are loaded (only for new sessions)
  useEffect(() => {
    if (systemParams && !initialData) {
      setFormData(prev => ({
        ...prev,
        roundDuration: systemParams.defaultRoundDuration ?? prev.roundDuration,
        numberOfRounds: systemParams.defaultNumberOfRounds ?? prev.numberOfRounds,
        gapBetweenRounds: systemParams.defaultGapBetweenRounds ?? prev.gapBetweenRounds,
        limitParticipants: systemParams.defaultLimitParticipants ?? prev.limitParticipants,
        maxParticipants: systemParams.defaultMaxParticipants ?? prev.maxParticipants,
        groupSize: systemParams.defaultGroupSize ?? prev.groupSize,
        limitGroups: systemParams.defaultLimitGroups ?? prev.limitGroups,
      }));
    }
  }, [systemParams, initialData]);

  // Initialize ice breakers when availableIceBreakers is loaded (only for new sessions or duplicates)
  useEffect(() => {
    const shouldInitialize = availableIceBreakers.length > 0 && 
                             formData.iceBreakers.length === 0 && 
                             (!initialData || isDuplicate);
    
    if (shouldInitialize) {
      setFormData(prev => ({
        ...prev,
        iceBreakers: getDefaultIceBreakers(availableIceBreakers)
      }));
    }
  }, [availableIceBreakers, isDuplicate]);

  const [timeError, setTimeError] = useState('');
  const [roundDurationError, setRoundDurationError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    name?: boolean;
    date?: boolean;
    startTime?: boolean;
    groupSize?: boolean;
    meetingPoints?: boolean;
  }>({});
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const [gapBetweenRoundsError, setGapBetweenRoundsError] = useState('');

  // Live validation for schedule making live
  useEffect(() => {
    if (!showScheduleDialog) return;
    
    if (!scheduleDate || !scheduleTime) {
      setScheduleError('');
      return;
    }
    
    const now = new Date();
    // Reset seconds and milliseconds for comparison
    now.setSeconds(0, 0);
    
    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
    
    // Check if time is in the past
    if (scheduledDateTime < now) {
      setScheduleError('Time cannot be in the past');
      return;
    }
    
    // Check if time is later than 10 minutes before first round
    if (formData.date && formData.startTime) {
      const [startHour, startMinute] = formData.startTime.split(':').map(Number);
      const sessionDate = new Date(formData.date);
      const firstRoundTime = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate(), startHour, startMinute);
      const minTimeBuffer = (systemParams?.minimalTimeToFirstRound || 10) * 60 * 1000;
      const timeBeforeFirstRound = new Date(firstRoundTime.getTime() - minTimeBuffer);
      
      if (scheduledDateTime > timeBeforeFirstRound) {
        setScheduleError(`Time cannot be later than ${systemParams?.minimalTimeToFirstRound || 10} minutes before time of first round`);
        return;
      }
    }
    
    setScheduleError('');
  }, [scheduleDate, scheduleTime, showScheduleDialog, formData.date, formData.startTime]);

  // Refs for scrolling to error fields
  const nameRef = useRef<HTMLInputElement>(null);
  const groupSizeRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<HTMLDivElement>(null);
  const meetingPointsRef = useRef<HTMLDivElement>(null);

  // Live validation for round duration
  useEffect(() => {
    if (!systemParams) return;
    
    const duration = formData.roundDuration;
    
    if (duration < systemParams.minimalRoundDuration) {
      setRoundDurationError(`Round duration must be at least ${systemParams.minimalRoundDuration} minutes`);
    } else if (duration > systemParams.maximalRoundDuration) {
      setRoundDurationError(`Round duration cannot exceed ${systemParams.maximalRoundDuration} minutes`);
    } else {
      setRoundDurationError('');
    }
  }, [formData.roundDuration, systemParams]);

  // Live validation for gap between rounds
  useEffect(() => {
    if (!systemParams) return;
    
    const gap = formData.gapBetweenRounds;
    
    if (gap < systemParams.minimalGapBetweenRounds) {
      setGapBetweenRoundsError(`Gap must be at least ${systemParams.minimalGapBetweenRounds} minutes`);
    } else {
      setGapBetweenRoundsError('');
    }
  }, [formData.gapBetweenRounds, systemParams]);

  const validateForm = () => {
    // Collect all validation errors first
    const errors: typeof fieldErrors = {};
    let firstErrorField: HTMLElement | null = null;
    
    // Check validation constraints from system parameters
    if (roundDurationError) {
      toast.error(roundDurationError);
      return false;
    }
    
    if (gapBetweenRoundsError) {
      toast.error(gapBetweenRoundsError);
      return false;
    }
    
    // Validate required fields in order of appearance
    if (!formData.name?.trim()) {
      errors.name = true;
      if (!firstErrorField) firstErrorField = nameRef.current;
    }
    
    if (!formData.groupSize || formData.groupSize < 2) {
      errors.groupSize = true;
      if (!firstErrorField) firstErrorField = groupSizeRef.current;
    }
    
    // Validate meeting points - at least one must be filled
    const validMeetingPoints = (formData.meetingPoints || []).filter(point => 
      typeof point === 'string' ? point.trim() : point.name?.trim()
    );
    if (validMeetingPoints.length === 0) {
      errors.meetingPoints = true;
      if (!firstErrorField) firstErrorField = meetingPointsRef.current;
    }
    
    // Set all errors at once
    setFieldErrors(errors);
    
    // If there are errors, show toast for first error and scroll
    if (Object.keys(errors).length > 0) {
      if (errors.name) {
        toast.error('Please enter a round name');
        nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameRef.current?.focus();
      } else if (errors.groupSize) {
        toast.error('Please enter a valid group size (minimum 2)');
        groupSizeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        groupSizeRef.current?.focus();
      } else if (errors.meetingPoints) {
        toast.error('Please add at least one meeting point');
        meetingPointsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    
    return true;
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const validMeetingPoints = (formData.meetingPoints || []).filter(point => 
      typeof point === 'string' ? point.trim() : point.name?.trim()
    );
    const sessionData = {
      ...formData,
      endTime: calculatedEndTime,
      teams: formData.enableTeams 
        ? (formData.teams || []).filter(name => name.trim())
        : [],
      topics: formData.enableTopics 
        ? (formData.topics || []).filter(name => name.trim())
        : [],
      meetingPoints: validMeetingPoints,
      rounds: generateRounds(),
      status: 'draft' as const,
      registrationStart: undefined
    };

    onSubmit(sessionData);
  };

  const handleMakeLive = (e: React.FormEvent) => {
    e.preventDefault();
    
    debugLog('🚀 handleMakeLive called');
    debugLog('Form data:', formData);
    
    // Collect ALL validation errors at once (basic + publish-specific)
    const allErrors: typeof fieldErrors = {};
    const missingFields: string[] = [];
    
    // Validate basic required fields
    if (!formData.name?.trim()) {
      allErrors.name = true;
      missingFields.push('Round name');
    }
    
    if (!formData.groupSize || formData.groupSize < 2) {
      allErrors.groupSize = true;
      missingFields.push('Group size');
    }
    
    // Validate date and time for making live
    if (!formData.date) {
      allErrors.date = true;
      missingFields.push('Date');
    }
    
    // Only validate startTime if first round hasn't started yet
    if (!firstRoundStarted && !formData.startTime) {
      allErrors.startTime = true;
      missingFields.push('Time of first round');
    }
    
    // Validate meeting points - at least one must be filled
    const validMeetingPoints = (formData.meetingPoints || []).filter(point => 
      typeof point === 'string' ? point.trim() : point.name?.trim()
    );
    if (validMeetingPoints.length === 0) {
      allErrors.meetingPoints = true;
      missingFields.push('Meeting points');
    }
    
    // Check if date is in past (only if date is filled)
    if (formData.date && isDateInPast) {
      allErrors.date = true;
      // Replace the generic "Date" message if it exists
      const dateIndex = missingFields.indexOf('Date');
      if (dateIndex !== -1) {
        missingFields[dateIndex] = 'Date (cannot be in the past)';
      } else {
        missingFields.push('Date (cannot be in the past)');
      }
    }
    
    // Check if time has error (only if time is filled and first round hasn't started)
    if (!firstRoundStarted && formData.startTime && timeError) {
      allErrors.startTime = true;
      // Replace the generic "Time" message if it exists
      const timeIndex = missingFields.indexOf('Time of first round');
      if (timeIndex !== -1) {
        missingFields[timeIndex] = 'Time of first round (fix validation errors)';
      } else {
        missingFields.push('Time of first round (fix validation errors)');
      }
    }
    
    // Re-validate that time is still in the future (only if first round hasn't started)
    if (!firstRoundStarted && formData.date && formData.startTime && !allErrors.date && !allErrors.startTime) {
      const scheduledDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
      const now = new Date();
      const timeBuffer = (systemParams?.minimalTimeToFirstRound || 10) - 1;
      const minTimeFromNow = new Date(now.getTime() + timeBuffer * 60 * 1000);
      
      if (scheduledDateTime < minTimeFromNow) {
        allErrors.startTime = true;
        const minTime = new Date(now.getTime() + (systemParams?.minimalTimeToFirstRound || 10) * 60 * 1000).toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
        missingFields.push(`Time of first round (must be at least ${systemParams?.minimalTimeToFirstRound || 10} minutes in the future, earliest: ${minTime})`);
      }
    }
    
    // Also validate that endTime is in the future
    if (formData.date && calculatedEndTime && !allErrors.date && !allErrors.startTime) {
      const sessionEndDateTime = new Date(`${formData.date}T${calculatedEndTime}:00`);
      const now = new Date();
      
      if (sessionEndDateTime <= now) {
        allErrors.startTime = true;
        missingFields.push('Session end time is in the past (please adjust start time or reduce duration)');
      }
    }
    
    // Set all errors at once
    setFieldErrors(allErrors);
    
    // If there are errors, show comprehensive error message and scroll to first field
    if (Object.keys(allErrors).length > 0) {
      // Create error message
      const errorMessage = missingFields.length > 0 
        ? `Please fill in: ${missingFields.join(', ')}`
        : 'Please fix validation errors';
      
      toast.error(errorMessage);
      
      // Scroll to first error field in order
      if (allErrors.name) {
        nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameRef.current?.focus();
      } else if (allErrors.groupSize) {
        groupSizeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        groupSizeRef.current?.focus();
      } else if (allErrors.date) {
        dateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (allErrors.startTime) {
        startTimeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (allErrors.meetingPoints) {
        meetingPointsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      return;
    }
    
    if (roundDurationError) {
      toast.error(roundDurationError);
      return;
    }
    
    // Set registrationStart to now ONLY if session is not already published
    const isAlreadyPublished = formData.status === 'published';
    const now = new Date();
    const registrationStartISO = isAlreadyPublished && formData.registrationStart 
      ? formData.registrationStart // Keep existing registrationStart
      : now.toISOString(); // Set new registrationStart for first-time publish
    
    const sessionData = {
      ...formData,
      endTime: calculatedEndTime,
      teams: formData.enableTeams 
        ? (formData.teams || []).filter(name => name.trim())
        : [],
      topics: formData.enableTopics 
        ? (formData.topics || []).filter(name => name.trim())
        : [],
      meetingPoints: validMeetingPoints,
      rounds: generateRounds(),
      status: 'published' as const,
      registrationStart: registrationStartISO
    };

    onSubmit(sessionData);
  };

  const handleScheduleMakingLive = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Validate date and time
    if (!formData.date || !formData.startTime) {
      toast.error('Please set date and time before scheduling');
      return;
    }
    
    if (isDateInPast) {
      toast.error('Date cannot be in the past');
      return;
    }
    
    if (timeError) {
      toast.error('Please fix time validation errors');
      return;
    }
    
    // Pre-populate with current time (Now) - without rounding
    const now = new Date();
    
    // Format date and time for input
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    setScheduleDate(`${year}-${month}-${day}`);
    setScheduleTime(`${hours}:${minutes}`);
    setScheduleError('');
    setShowScheduleDialog(true);
  };

  const confirmScheduleMakingLive = () => {
    // Validation is now done live via useEffect, just check if there's an error
    if (scheduleError) {
      return;
    }
    
    // Validate that date and time are set
    if (!scheduleDate || !scheduleTime) {
      toast.error('Please set date and time');
      return;
    }
    
    // Create the scheduled date-time
    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
    
    const validMeetingPoints = (formData.meetingPoints || []).filter(point => 
      typeof point === 'string' ? point.trim() : point.name?.trim()
    );
    const sessionData = {
      ...formData,
      endTime: calculatedEndTime,
      teams: formData.enableTeams 
        ? (formData.teams || []).filter(name => name.trim())
        : [],
      topics: formData.enableTopics 
        ? (formData.topics || []).filter(name => name.trim())
        : [],
      meetingPoints: validMeetingPoints,
      rounds: generateRounds(),
      status: 'scheduled' as const,
      registrationStart: scheduledDateTime.toISOString()
    };

    onSubmit(sessionData);
    setShowScheduleDialog(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default submit behavior - save as draft
    handleSaveDraft(e);
    
    if (!initialData) {
      // Reset form only if creating new session
      setFormData({
        name: '',
        date: '',
        startTime: '',
        endTime: '',
        roundDuration: 10,
        numberOfRounds: 1,
        gapBetweenRounds: 10,
        limitParticipants: false,
        maxParticipants: 20,
        groupSize: 2,
        status: 'draft',
        registrationStart: undefined,
        isRecurring: false,
        frequency: 'weekly',
        rounds: [],
        enableTeams: false,
        allowMultipleTeams: false,
        matchingType: 'within-team',
        teams: [],
        enableTopics: false,
        allowMultipleTopics: false,
        topics: [],
        meetingPoints: ['']
      });

    }
  };

  const estimatedGroups = formData.limitParticipants && formData.maxParticipants 
    ? Math.ceil(formData.maxParticipants / formData.groupSize)
    : null;

  // Calculate session duration from rounds
  const calculateSessionDuration = (): number => {
    if (formData.numberOfRounds === 1) {
      return formData.roundDuration;
    }
    const totalRoundTime = formData.numberOfRounds * formData.roundDuration;
    const totalGapTime = (formData.numberOfRounds - 1) * (formData.gapBetweenRounds || 0);
    return totalRoundTime + totalGapTime;
  };

  // Calculate end time from start time and session duration
  const calculateEndTime = (): string => {
    if (!formData.startTime) return '';
    
    const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = startTotalMinutes + calculateSessionDuration();
    
    const endHours = Math.floor(endTotalMinutes / 60);
    const endMinutes = endTotalMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const sessionDuration = calculateSessionDuration();
  const calculatedEndTime = calculateEndTime();
  
  // Check if date is in the past
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
  const isDateInPast = formData.date && formData.date < today;

  // Generate rounds for session
  const generateRounds = () => {
    if (!formData.roundDuration || !formData.numberOfRounds) {
      return [];
    }

    const rounds = [];
    
    // If no startTime or date is provided, return empty array (no rounds to generate for actual session)
    if (!formData.startTime || !formData.date) {
      return [];
    }
    
    const now = new Date();
    
    // If editing an existing session with rounds, preserve rounds that have already started
    if (initialData && !isDuplicate && initialData.rounds && initialData.rounds.length > 0) {
      let lastStartedRoundIndex = -1;
      let nextRoundStartTime = 0; // in minutes since midnight
      
      // Find all rounds that have already started and preserve them
      for (let i = 0; i < initialData.rounds.length; i++) {
        const round = initialData.rounds[i];
        if (round.date && round.startTime) {
          const [hours, minutes] = round.startTime.split(':').map(Number);
          const roundStart = new Date(round.date);
          roundStart.setHours(hours, minutes, 0, 0);
          
          // If this round has started, keep it as is
          if (now >= roundStart && i < formData.numberOfRounds) {
            rounds.push({
              ...round,
              // Keep original times and duration for started rounds
            });
            lastStartedRoundIndex = i;
            
            // Calculate when the next round should start (after this round ends + new gap)
            const roundDate = new Date(round.date);
            const roundTimeMinutes = hours * 60 + minutes;
            const daysSinceBase = Math.floor((roundDate.getTime() - new Date(formData.date).getTime()) / (1000 * 60 * 60 * 24));
            
            // Use the ORIGINAL duration for the started round, but NEW gap for next round
            nextRoundStartTime = roundTimeMinutes + (round.duration || formData.roundDuration) + (formData.gapBetweenRounds || 0);
            nextRoundStartTime += daysSinceBase * 1440; // Add days offset
          }
        }
      }
      
      // Generate remaining rounds starting from after the last started round
      const startIndex = lastStartedRoundIndex + 1;
      
      if (startIndex < formData.numberOfRounds) {
        let currentTime = nextRoundStartTime;
        
        // If no rounds have started yet, use the original start time
        if (lastStartedRoundIndex === -1) {
          const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
          currentTime = startHours * 60 + startMinutes;
        }
        
        for (let i = startIndex; i < formData.numberOfRounds; i++) {
          // Calculate day offset (how many days past the base date)
          const dayOffset = Math.floor(currentTime / 1440); // 1440 minutes = 24 hours
          const timeInDay = currentTime % 1440; // Time within the current day
          
          const roundStartHours = Math.floor(timeInDay / 60);
          const roundStartMinutes = timeInDay % 60;
          const roundStartTime = `${roundStartHours.toString().padStart(2, '0')}:${roundStartMinutes.toString().padStart(2, '0')}`;
          
          // Calculate the actual date for this round
          const roundDate = new Date(formData.date);
          roundDate.setDate(formData.date ? new Date(formData.date).getDate() + dayOffset : 0);
          const roundDateString = roundDate.toISOString().split('T')[0]; // YYYY-MM-DD

          rounds.push({
            id: `round-${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${i + 1}`,
            name: roundStartTime,
            startTime: roundStartTime,
            date: roundDateString,
            duration: formData.roundDuration
          });

          // Add NEW round duration and gap for next round
          currentTime += formData.roundDuration + (formData.gapBetweenRounds || 0);
        }
      }
      
      return rounds;
    }
    
    // For new sessions or duplicates, generate all rounds from scratch
    // Generate actual rounds with times when startTime is provided
    const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
    let currentTime = startHours * 60 + startMinutes; // Convert to minutes since midnight
    
    // Parse the base session date
    const baseDate = new Date(formData.date);

    for (let i = 0; i < formData.numberOfRounds; i++) {
      // Calculate day offset (how many days past the base date)
      const dayOffset = Math.floor(currentTime / 1440); // 1440 minutes = 24 hours
      const timeInDay = currentTime % 1440; // Time within the current day
      
      const roundStartHours = Math.floor(timeInDay / 60);
      const roundStartMinutes = timeInDay % 60;
      const roundStartTime = `${roundStartHours.toString().padStart(2, '0')}:${roundStartMinutes.toString().padStart(2, '0')}`;
      
      // Calculate the actual date for this round
      const roundDate = new Date(baseDate);
      roundDate.setDate(baseDate.getDate() + dayOffset);
      const roundDateString = roundDate.toISOString().split('T')[0]; // YYYY-MM-DD

      rounds.push({
        id: `round-${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${i + 1}`,
        name: roundStartTime,
        startTime: roundStartTime,
        date: roundDateString,
        duration: formData.roundDuration
      });

      // Add round duration and gap for next round
      currentTime += formData.roundDuration + (formData.gapBetweenRounds || 0);
    }

    return rounds;
  };

  // Update rounds when relevant fields change for live preview
  useEffect(() => {
    if (formData.startTime && formData.roundDuration && formData.numberOfRounds && formData.date) {
      const newRounds = generateRounds();
      // Only update if rounds actually changed to avoid infinite loop
      if (JSON.stringify(newRounds) !== JSON.stringify(formData.rounds)) {
        setFormData(prev => ({ ...prev, rounds: newRounds }));
      }
    }
  }, [formData.startTime, formData.roundDuration, formData.numberOfRounds, formData.gapBetweenRounds, formData.date]);

  // Validate time whenever date or time changes
  useEffect(() => {
    // Only validate if both date and time are filled
    if (!formData.date || !formData.startTime) {
      setTimeError('');
      return;
    }
    
    // Validate that minutes are multiple of 5
    const [hours, minutes] = formData.startTime.split(':');
    if (parseInt(minutes) % 5 !== 0) {
      setTimeError('Time must be in 5-minute intervals (e.g., 14:00, 14:05, 14:10).');
      return;
    }
    
    // Check if scheduled time is at least minimalTimeToFirstRound minutes from now (internal validation)
    const scheduledDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
    const now = new Date();
    const timeBuffer = (systemParams?.minimalTimeToFirstRound || 10) - 1;
    const minTimeFromNow = new Date(now.getTime() + timeBuffer * 60 * 1000);
    
    // Round minTimeFromNow to next 5-minute interval for comparison
    const minMinutes = minTimeFromNow.getMinutes();
    const roundedMinutes = Math.ceil(minMinutes / 5) * 5;
    minTimeFromNow.setMinutes(roundedMinutes);
    minTimeFromNow.setSeconds(0);
    minTimeFromNow.setMilliseconds(0);
    
    // Normalize scheduledDateTime to remove milliseconds
    scheduledDateTime.setSeconds(0);
    scheduledDateTime.setMilliseconds(0);
    
    if (scheduledDateTime < minTimeFromNow) {
      // Show user-friendly message with minimalTimeToFirstRound minutes
      const displayTime = new Date(now.getTime() + (systemParams?.minimalTimeToFirstRound || 10) * 60 * 1000);
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
      setTimeError(`Time must be at least ${systemParams?.minimalTimeToFirstRound || 10} minutes in the future (earliest: ${minTime}).`);
      return;
    }
    
    // If we get here, validation passed
    setTimeError('');
  }, [formData.date, formData.startTime]);

  // Round duration validation is handled by the useEffect with sessionDefaults (lines 221-234)

  // Generate time-based name for rounds (only start time)
  const generateRoundName = (startTime: string, duration: number): string => {
    if (!startTime) return 'Round';
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const formatTime = (hours: number, minutes: number) => 
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return formatTime(startHours, startMinutes);
  };

  // Generate full time display with duration (for preview)
  const generateRoundTimeDisplay = (startTime: string, duration: number): string => {
    if (!startTime) return '';
    
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







  // Team management functions
  const addTeam = () => {
    setFormData({
      ...formData,
      teams: [...(formData.teams || []), '']
    });
  };

  const updateTeam = (index: number, value: string) => {
    const newTeams = [...(formData.teams || [])];
    newTeams[index] = value;
    setFormData({
      ...formData,
      teams: newTeams
    });
  };

  const removeTeam = (index: number) => {
    const newTeams = (formData.teams || []).filter((_, i) => i !== index);
    setFormData({
      ...formData,
      teams: newTeams
    });
  };

  const moveTeamUp = (index: number) => {
    if (index === 0) return;
    const newTeams = [...(formData.teams || [])];
    [newTeams[index - 1], newTeams[index]] = [newTeams[index], newTeams[index - 1]];
    setFormData({
      ...formData,
      teams: newTeams
    });
  };

  const moveTeamDown = (index: number) => {
    const teams = formData.teams || [];
    if (index === teams.length - 1) return;
    const newTeams = [...teams];
    [newTeams[index], newTeams[index + 1]] = [newTeams[index + 1], newTeams[index]];
    setFormData({
      ...formData,
      teams: newTeams
    });
  };

  // Topic management functions
  const addTopic = () => {
    setFormData({
      ...formData,
      topics: [...(formData.topics || []), '']
    });
  };

  const updateTopic = (index: number, value: string) => {
    const newTopics = [...(formData.topics || [])];
    newTopics[index] = value;
    setFormData({
      ...formData,
      topics: newTopics
    });
  };

  const removeTopic = (index: number) => {
    const newTopics = (formData.topics || []).filter((_, i) => i !== index);
    setFormData({
      ...formData,
      topics: newTopics
    });
  };

  const moveTopicUp = (index: number) => {
    if (index === 0) return;
    const newTopics = [...(formData.topics || [])];
    [newTopics[index - 1], newTopics[index]] = [newTopics[index], newTopics[index - 1]];
    setFormData({
      ...formData,
      topics: newTopics
    });
  };

  const moveTopicDown = (index: number) => {
    const topics = formData.topics || [];
    if (index === topics.length - 1) return;
    const newTopics = [...topics];
    [newTopics[index], newTopics[index + 1]] = [newTopics[index + 1], newTopics[index]];
    setFormData({
      ...formData,
      topics: newTopics
    });
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Basic information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Round name</Label>
            <Input
              ref={nameRef}
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: false }));
              }}
              placeholder="e.g. Morning Networking for IT Professionals"
              className={fieldErrors.name ? 'border-destructive' : ''}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="groupSize">Group size</Label>
                <Tooltip>
                  <TooltipTrigger type="button">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Number of participants in a networking group. For a one-on-one meeting, enter 2. Keep in mind that smaller groups allow for deeper networking and increase the likelihood of finding a group to join.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                ref={groupSizeRef}
                id="groupSize"
                type="number"
                min="2"
                max="20"
                value={formData.groupSize}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setFormData({ ...formData, groupSize: '' as any });
                  } else {
                    const parsedValue = parseInt(value);
                    if (!isNaN(parsedValue)) {
                      setFormData({ ...formData, groupSize: parsedValue });
                    }
                  }
                }}
                className="w-full"
              />
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Rounds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Rounds
          </CardTitle>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-outside ml-5">
            <li className="pl-1">First round must be at least {systemParams?.minimalTimeToFirstRound || 10} minutes in the future</li>
            <li className="pl-1">Participants receive SMS notification {systemParams?.confirmationWindowMinutes || 5} minutes before the round to confirm attendance</li>
            <li className="pl-1">Time must be rounded to 5 minutes</li>
          </ul>
        </CardHeader>
        <CardContent className="space-y-4">

          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div ref={dateRef} className="space-y-2">
              <Label htmlFor="date">Date of first round</Label>
              <DatePicker
                value={formData.date}
                onChange={(date) => {
                  setFormData({ ...formData, date });
                  if (fieldErrors.date) setFieldErrors(prev => ({ ...prev, date: false }));
                }}
                placeholder="dd-mm-yyyy"
                minDate={new Date().toISOString().split('T')[0]}
                className={fieldErrors.date || isDateInPast ? 'border-destructive' : ''}
                disabled={firstRoundStarted}
              />
              {isDateInPast && (
                <p className="text-sm text-destructive">
                  Date cannot be in the past
                </p>
              )}
            </div>

            <div ref={startTimeRef} className="space-y-2">
              <Label htmlFor="startTime">Time of first round</Label>
              <TimePicker
                value={formData.startTime}
                onChange={(time) => {
                  setFormData({ ...formData, startTime: time });
                  if (fieldErrors.startTime) setFieldErrors(prev => ({ ...prev, startTime: false }));
                }}
                error={!firstRoundStarted && (!!timeError || fieldErrors.startTime)}
                disabled={firstRoundStarted}
                asapMinutesOffset={systemParams?.minimalTimeToFirstRound || 10}
              />
              {timeError && !firstRoundStarted && (
                <p className="text-sm text-destructive">{timeError}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numberOfRounds">Number of rounds</Label>
              <Input
                id="numberOfRounds"
                type="number"
                min={minRoundsAllowed > 0 ? minRoundsAllowed : 1}
                max="20"
                value={formData.numberOfRounds}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setFormData({ ...formData, numberOfRounds: '' as any });
                  } else {
                    const parsedValue = parseInt(value);
                    if (!isNaN(parsedValue)) {
                      // Ensure value is not below minimum
                      const minValue = minRoundsAllowed > 0 ? minRoundsAllowed : 1;
                      const finalValue = Math.max(parsedValue, minValue);
                      setFormData({ ...formData, numberOfRounds: finalValue });
                    }
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roundDuration">Round duration</Label>
              <div className="relative">
                <Input
                  id="roundDuration"
                  type="number"
                  min={systemParams?.minimalRoundDuration ?? 5}
                  max={systemParams?.maximalRoundDuration ?? 240}
                  value={formData.roundDuration}
                  className="pr-10"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setFormData({ ...formData, roundDuration: '' as any });
                    } else {
                      const parsedValue = parseInt(value);
                      if (!isNaN(parsedValue)) {
                        setFormData({ ...formData, roundDuration: parsedValue });
                      }
                    }
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  min
                </span>
              </div>
              {roundDurationError && (
                <p className="text-sm text-destructive">{roundDurationError}</p>
              )}
            </div>

            {formData.numberOfRounds > 1 && (
              <div className="space-y-2">
                <Label htmlFor="gapBetweenRounds">Gap between rounds</Label>
                <div className="relative">
                  <Input
                    id="gapBetweenRounds"
                    type="number"
                    min={systemParams?.minimalGapBetweenRounds ?? 10}
                    max="60"
                    value={formData.gapBetweenRounds || 10}
                    className="pr-10"
                    onChange={(e) => {
                      const value = e.target.value;
                      const minGap = systemParams?.minimalGapBetweenRounds ?? 10;
                      if (value === '') {
                        setFormData({ ...formData, gapBetweenRounds: minGap });
                      } else {
                        const parsedValue = parseInt(value);
                        if (!isNaN(parsedValue)) {
                          setFormData({ ...formData, gapBetweenRounds: parsedValue });
                        }
                      }
                    }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    min
                  </span>
                </div>
                {gapBetweenRoundsError && (
                  <p className="text-sm text-destructive">{gapBetweenRoundsError}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Meeting Points */}
      <Card className={fieldErrors.meetingPoints ? 'border-destructive' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Meeting points
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Enter locations that are distinctive and easy to recognize
          </p>
        </CardHeader>
        <CardContent>
          <div ref={meetingPointsRef}>
            <MeetingPointsManager
              meetingPoints={formData.meetingPoints || []}
              onChange={(meetingPoints) => {
                setFormData(prev => ({ ...prev, meetingPoints }));
                if (fieldErrors.meetingPoints) setFieldErrors(prev => ({ ...prev, meetingPoints: false }));
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ice Breakers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Ice breakers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <IceBreakersManager
            iceBreakers={formData.iceBreakers || []}
            onChange={(iceBreakers) => setFormData({ ...formData, iceBreakers })}
          />
        </CardContent>
      </Card>

      {/* Advanced */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label>Limit total number of participants</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>Useful when your venue has capacity limitations</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <Switch
                checked={formData.limitParticipants}
                onCheckedChange={(checked) => setFormData({ ...formData, limitParticipants: checked })}
              />
            </div>

            {formData.limitParticipants && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">Maximum participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    min="2"
                    max="1000"
                    value={formData.maxParticipants}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setFormData({ ...formData, maxParticipants: '' as any });
                      } else {
                        const parsedValue = parseInt(value);
                        if (!isNaN(parsedValue)) {
                          setFormData({ ...formData, maxParticipants: parsedValue });
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label>Limit number of groups</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p>Useful if you have a dedicated table or meeting room for each group</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {formData.roundsMode === 'triggered' && (
                    <p className="text-sm text-amber-600">
                      Automatically enabled for triggered rounds
                    </p>
                  )}
                </div>
                <Switch
                  checked={formData.limitGroups}
                  onCheckedChange={(checked) => setFormData({ ...formData, limitGroups: checked })}
                  disabled={formData.roundsMode === 'triggered'}
                />
              </div>

              {formData.limitGroups && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxGroups">Maximum groups</Label>
                    <Input
                      id="maxGroups"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.maxGroups}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setFormData({ ...formData, maxGroups: '' as any });
                        } else {
                          const parsedValue = parseInt(value);
                          if (!isNaN(parsedValue)) {
                            setFormData({ ...formData, maxGroups: parsedValue });
                          }
                        }
                      }}
                      disabled={formData.roundsMode === 'triggered'}
                    />
                    {formData.roundsMode === 'triggered' && (
                      <p className="text-sm text-amber-600">
                        Maximum groups is set to 1 for triggered rounds and cannot be changed
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label>Enable teams</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p>Can be used for networking between or within departments. Also useful for events like weddings where Team bride meets Team groom</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <Switch
                  checked={formData.enableTeams}
                  onCheckedChange={(checked) => {
                    const newFormData = { ...formData, enableTeams: checked };
                    // If enabling teams and no teams exist, add the first empty team
                    if (checked && (!formData.teams || formData.teams.length === 0)) {
                      newFormData.teams = [''];
                    }
                    setFormData(newFormData);
                  }}
                />
              </div>

              {formData.enableTeams && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Team names</Label>
                    
                    <div className="space-y-3">
                      {(formData.teams || []).map((team, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                          <Input
                            placeholder="e.g. Sales, Marketing, Team Bride, ..."
                            value={team}
                            onChange={(e) => updateTeam(index, e.target.value)}
                            className="flex-1"
                          />
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveTeamUp(index)}
                              disabled={index === 0}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveTeamDown(index)}
                              disabled={index === (formData.teams || []).length - 1}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTeam(index)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button type="button" variant="outline" onClick={addTeam} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add team
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Matching type</Label>
                    <ToggleGroup
                      type="single"
                      value={formData.matchingType}
                      onValueChange={(value) => {
                        if (value) {
                          setFormData({ ...formData, matchingType: value as 'within-team' | 'across-teams' });
                        }
                      }}
                      className="grid grid-cols-2"
                    >
                      <ToggleGroupItem value="within-team" className="h-10 py-2 px-4 text-center border border-border bg-background data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary">
                        Within the team
                      </ToggleGroupItem>
                      <ToggleGroupItem value="across-teams" className="h-10 py-2 px-4 text-center border border-border bg-background data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary">
                        Across teams
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label>Enable topics</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p>If you want participants to be matched by topic. Use carefully - best networking results happen when people meet outside their bubbles</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <Switch
                  checked={formData.enableTopics}
                  onCheckedChange={(checked) => {
                    const newFormData = { ...formData, enableTopics: checked };
                    // If enabling topics and no topics exist, add the first empty topic
                    if (checked && (!formData.topics || formData.topics.length === 0)) {
                      newFormData.topics = [''];
                    }
                    setFormData(newFormData);
                  }}
                />
              </div>

              {formData.enableTopics && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Topic names</Label>
                    
                    <div className="space-y-3">
                      {(formData.topics || []).map((topic, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                          <Input
                            placeholder={`Topic ${index + 1}`}
                            value={topic}
                            onChange={(e) => updateTopic(index, e.target.value)}
                            className="flex-1"
                          />
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveTopicUp(index)}
                              disabled={index === 0}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveTopicDown(index)}
                              disabled={index === (formData.topics || []).length - 1}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTopic(index)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Button type="button" variant="outline" onClick={addTopic} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add topic
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allowMultipleTopics"
                      checked={formData.allowMultipleTopics}
                      onCheckedChange={(checked) => setFormData({ ...formData, allowMultipleTopics: !!checked })}
                    />
                    <Label htmlFor="allowMultipleTopics">Participant can select multiple topics</Label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Preview - Show before action buttons */}
      <div className="lg:hidden">
        <Separator />
        <div className="mt-6">
          <SessionPreview formData={formData} userEmail={userEmail} organizerName={organizerName} profileImageUrl={profileImageUrl} userSlug={userSlug} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-between">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <div className="flex gap-3">
          <Button 
            type="button" 
            variant="outline"
            onClick={handleSaveDraft}
          >
            Save as draft
          </Button>
          <div className="flex gap-0">
            <Button 
              type="button" 
              onClick={handleMakeLive}
              className="rounded-r-none"
              disabled={!!roundDurationError}
            >
              {formData.status === 'published' ? 'Update on event page' : 'Publish to event page'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  type="button"
                  className="px-2 rounded-l-none border-l border-primary/20"
                  disabled={!!roundDurationError}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleScheduleMakingLive}>
                  Schedule
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </form>

    {/* Schedule Dialog */}
    <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule making live</DialogTitle>
          <DialogDescription>
            Choose when this session should become visible on the event page. Time must be at least {systemParams?.minimalTimeToFirstRound || 10} minutes in the future to give participants time to register.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-date">Date</Label>
              <DatePicker
                value={scheduleDate}
                onChange={setScheduleDate}
                placeholder="Select date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule-time">Time</Label>
              <TimePicker
                value={scheduleTime}
                onChange={setScheduleTime}
                placeholder="Select time"
                asapButtonText="Now"
                useNowForAsap={true}
              />
            </div>
          </div>
          {scheduleError && (
            <p className="text-sm text-destructive">{scheduleError}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
            Cancel
          </Button>
          <Button onClick={confirmScheduleMakingLive}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Preview Section */}
    <div className="hidden lg:block">
      <SessionPreview formData={formData} userEmail={userEmail} organizerName={organizerName} profileImageUrl={profileImageUrl} userSlug={userSlug} />
    </div>
  </div>
  
  </TooltipProvider>
  );
}