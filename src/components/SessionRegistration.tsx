import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { CheckCircle, Clock, Users, Calendar, Phone, Mail, User, ArrowLeft, ArrowRight, ChevronsUpDown, Check, Link2, Facebook, Linkedin, Copy, MapPin, FileText, PartyPopper, Video } from 'lucide-react';
import { NetworkingSession } from '../App';
import { toast } from 'sonner@2.0.3';
import { RoundItem } from './RoundItem';
import { RoundRulesDialog, RoundRule } from './RoundRulesDialog';
import { MeetingPointsDialog } from './MeetingPointsDialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { EmailVerificationWaiting } from './EmailVerificationWaiting';
import { debugLog, errorLog } from '../utils/debug';
import { validateEmail, getEmailError } from '../utils/validation';
import { useTime } from '../contexts/TimeContext';
import { getParametersOrDefault } from '../utils/systemParameters';
import confetti from 'canvas-confetti';
import { COUNTRY_CODES } from '../utils/countryCodes';

interface SessionRegistrationProps {
  sessions: NetworkingSession[];
  userSlug: string;
  eventName?: string;
  registeredRoundIds?: string[]; // IDs of rounds the participant is registered for
  registeredRoundsMap?: Map<string, string>; // roundId -> status ('registered' | 'pending_verification')
  registeredRoundsPerSession?: Map<string, Set<string>>; // sessionId -> Set<roundId>
  participantProfile?: any; // Existing participant profile if they have a token
  participantToken?: string | null; // Participant token if logged in
  participantStatusMap?: Map<string, string>; // roundId -> participantStatus (for registered rounds)
  noWrapper?: boolean; // If true, don't render the outer container wrappers
  onStepChange?: (step: 'select-rounds' | 'auth-choice' | 'meeting-points' | 'email-verification-waiting' | 'confirmation') => void; // Callback when step changes
}

interface SelectedRound {
  roundId: string;
  roundName: string;
  startTime: string;
  duration: number;
  selectedTeam?: string;
  selectedTopic?: string;
  selectedTopics?: string[]; // Support for multiple topics
}

interface SelectedSession {
  sessionId: string;
  sessionName: string;
  date: string;
  startTime: string;
  endTime: string;
  rounds: SelectedRound[];
}

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountry: string;
  phone: string;
  acceptTerms: boolean;
  allowMarketing: boolean;
}

// X (Twitter) logo icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export function SessionRegistration({ sessions, userSlug, eventName, registeredRoundIds = [], registeredRoundsMap = new Map(), registeredRoundsPerSession = new Map(), participantProfile, participantToken, participantStatusMap = new Map(), noWrapper = false, onStepChange }: SessionRegistrationProps) {
  const navigate = useNavigate();
  const { getCurrentTime } = useTime();
  const [selectedSessions, setSelectedSessions] = useState<SelectedSession[]>([]);
  const [selectedRounds, setSelectedRounds] = useState<Map<string, Set<string>>>(new Map()); // sessionId -> Set of roundIds
  const [roundSelections, setRoundSelections] = useState<Map<string, {team?: string, topic?: string, topics?: string[]}>>(new Map()); // roundId -> selections

  // State for globally next upcoming registered round
  const [globalNextUpcomingRoundId, setGlobalNextUpcomingRoundId] = useState<string | null>(null);

  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneCountry: '+421', // Default to Slovakia
    phone: '',
    acceptTerms: false,
    allowMarketing: false
  });
  const [emailError, setEmailError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingDots, setProcessingDots] = useState<number>(0);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [phoneCountryOpen, setPhoneCountryOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select-rounds' | 'auth-choice' | 'meeting-points' | 'email-verification-waiting' | 'confirmation'>('select-rounds');
  const [registrationAccessToken, setRegistrationAccessToken] = useState<string>('');
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const [detectedCountryCode, setDetectedCountryCode] = useState<string>('');
  const [showMeetingPoints, setShowMeetingPoints] = useState(false);
  const [showRoundRules, setShowRoundRules] = useState(false);
  const [roundRules, setRoundRules] = useState<RoundRule[]>([]);

  // Notify parent component when step changes
  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStep);
    }
  }, [currentStep, onStepChange]);

  // Animate processing dots when submitting
  useEffect(() => {
    if (isSubmitting) {
      const interval = setInterval(() => {
        setProcessingDots((prev) => (prev + 1) % 4);
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [isSubmitting]);

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
  }, [sessions]);

  // Detect user's country from IP
  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Use ipapi.co free API to detect country
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          const countryCode = data.country_code;
          
          // Find matching country in our list
          const matchedCountry = COUNTRY_CODES.find(c => c.code === countryCode);
          if (matchedCountry) {
            setDetectedCountryCode(countryCode);
            setRegistrationData(prev => ({
              ...prev,
              phoneCountry: matchedCountry.prefix
            }));
          }
        }
      } catch (error) {
        debugLog('Could not detect country, using default');
      }
    };
    
    detectCountry();
  }, []);

  // Handle magic link sign-in flow
  useEffect(() => {
    // If user was on auth-choice step and now has a token, continue to meeting points
    if (currentStep === 'auth-choice' && participantToken && participantProfile) {
      debugLog('✅ User signed in via magic link, continuing registration...');
      
      // Pre-fill registration data with existing profile
      setRegistrationData({
        firstName: participantProfile.firstName || '',
        lastName: participantProfile.lastName || '',
        email: participantProfile.email || '',
        phone: participantProfile.phone || '',
        phoneCountry: participantProfile.phoneCountry || '+421',
        acceptTerms: true,
        allowMarketing: false
      });
      
      // Continue to meeting points
      setCurrentStep('meeting-points');
      window.scrollTo(0, 0);
      toast.success('Signed in successfully! Complete your registration below.');
    }
  }, [participantToken, participantProfile, currentStep]);

  // Fetch round rules for the organizer
  useEffect(() => {
    const fetchRoundRules = async () => {
      try {
        const { projectId, publicAnonKey } = await import('../utils/supabase/info');
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/user/${userSlug}/round-rules`,
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

  // Initialize already registered rounds as selected (pre-checked)
  // IMPORTANT: Only initialize once, don't reset when sessions update
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    // Skip if already initialized - preserve user selections
    if (hasInitialized) {
      debugLog('  ⏭️  Already initialized, preserving user selections');
      return;
    }
    
    debugLog('🔄 SessionRegistration: Initializing registered rounds');
    debugLog('  registeredRoundIds:', registeredRoundIds);
    debugLog('  sessions count:', sessions.length);
    
    if (registeredRoundsPerSession.size > 0 && sessions.length > 0) {
      const newSelectedRounds = new Map<string, Set<string>>();
      
      // Group registered rounds by session
      sessions.forEach(session => {
        const registeredRoundIdsForSession = registeredRoundsPerSession.get(session.id) || new Set();
        const sessionRegisteredRounds = session.rounds
          .filter(round => registeredRoundIdsForSession.has(round.id))
          .map(round => round.id);
        
        debugLog(`  Session "${session.name}": ${sessionRegisteredRounds.length} registered rounds`);
        
        if (sessionRegisteredRounds.length > 0) {
          newSelectedRounds.set(session.id, new Set(sessionRegisteredRounds));
        }
      });
      
      debugLog('  ✅ Setting selectedRounds with', newSelectedRounds.size, 'sessions');
      setSelectedRounds(newSelectedRounds);
      setHasInitialized(true); // Mark as initialized
    } else {
      debugLog('  ℹ️ No registered rounds to initialize');
    }
  }, [registeredRoundsPerSession, sessions, hasInitialized]);

  // Show version toast on component mount
  useEffect(() => {
    const showVersionToast = async () => {
      const { APP_VERSION } = await import('../utils/version');
      toast.info(`App version: ${APP_VERSION}`, {
        duration: 3000,
        position: 'bottom-right'
      });
    };
    showVersionToast();
  }, []);

  // Calculate next upcoming registered round (for showing countdown)
  useEffect(() => {
    const updateGlobalNextRound = () => {
      const now = getCurrentTime();
      let earliestTime = Infinity;
      let nextRoundKey: string | null = null; // Format: "sessionId:roundId"
      
      for (const session of sessions) {
        if (!session.rounds || session.rounds.length === 0) continue;
        if (!session.date) continue;
        
        for (const round of session.rounds) {
          // Only check registered rounds
          if (!registeredRoundsPerSession.get(session.id)?.has(round.id)) continue;
          
          // Skip if round has no valid start time
          if (!round.startTime || round.startTime === 'To be set' || round.startTime === 'TBD') continue;
          
          try {
            const [hours, minutes] = round.startTime.split(':').map(Number);
            const roundStart = new Date(round.date || session.date); // Use round.date, fallback to session.date for backwards compatibility
            roundStart.setHours(hours, minutes, 0, 0);
            
            // We want the earliest FUTURE round (after current time)
            if (roundStart.getTime() > now.getTime() && roundStart.getTime() < earliestTime) {
              earliestTime = roundStart.getTime();
              nextRoundKey = `${session.id}:${round.id}`;
            }
          } catch (error) {
            // Skip invalid time format
          }
        }
      }
      
      setGlobalNextUpcomingRoundId(nextRoundKey);
    };
    
    // Update when sessions or registeredRoundsPerSession changes
    updateGlobalNextRound();
    
    // Update every minute to keep countdown current
    const interval = setInterval(updateGlobalNextRound, 60000);
    
    return () => clearInterval(interval);
  }, [sessions, registeredRoundsPerSession, getCurrentTime]);

  // Sort countries: detected country first, then alphabetically
  const sortedCountryCodes = [...COUNTRY_CODES].sort((a, b) => {
    if (a.code === detectedCountryCode) return -1;
    if (b.code === detectedCountryCode) return 1;
    return a.name.localeCompare(b.name);
  });

  // Get phone placeholder based on selected country
  const getPhonePlaceholder = () => {
    const country = COUNTRY_CODES.find(c => c.prefix === registrationData.phoneCountry);
    return country?.placeholder || '123 456 789';
  };

  const formatDateTime = (date: string, time: string) => {
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
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Calculate countdown to confirmation time (5 minutes before round start)
  const calculateCountdown = (sessionDate: string, roundStartTime: string) => {
    const now = new Date();
    const roundDateTime = new Date(`${sessionDate}T${roundStartTime}`);
    const params = getParametersOrDefault();
    // Confirmation time is confirmationWindowMinutes before round start
    const confirmationTime = new Date(roundDateTime.getTime() - params.confirmationWindowMinutes * 60 * 1000);
    const diff = confirmationTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 'Confirmation time passed';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Generate full time display with duration
  const generateRoundTimeDisplay = (startTime: string, duration: number): string => {
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

  // Handle email change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setRegistrationData(prev => ({
      ...prev,
      email: email
    }));
    
    // Clear error when user starts typing
    if (emailError && email.length > 0) {
      setEmailError('');
    }
  };

  // Check if email is already registered
  const checkEmailExists = async (email: string): Promise<boolean> => {
    if (!email || !validateEmail(email)) {
      return false;
    }

    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/participant/check-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email.toLowerCase().trim() }),
        }
      );

      const data = await response.json();
      return data.exists === true;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  // Handle email blur validation
  const handleEmailBlur = async () => {
    const email = registrationData.email;
    
    // Basic validation
    if (!email) {
      setEmailError('');
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Check if email already exists
    const exists = await checkEmailExists(email);
    if (exists) {
      setEmailError('Email already registered. Sign in below.');
    } else {
      setEmailError('');
    }
  };

  const handleRoundSelect = (session: NetworkingSession, round: any) => {
    const sessionId = session.id;
    const roundId = round.id;
    
    setSelectedRounds(prev => {
      const newMap = new Map(prev);
      const sessionRounds = new Set(newMap.get(sessionId) || new Set());
      
      if (sessionRounds.has(roundId)) {
        // Remove round
        sessionRounds.delete(roundId);
        if (sessionRounds.size === 0) {
          newMap.delete(sessionId);
        } else {
          newMap.set(sessionId, sessionRounds);
        }
      } else {
        // Add round
        sessionRounds.add(roundId);
        newMap.set(sessionId, sessionRounds);
      }
      
      // Update selected sessions based on the new rounds state
      setSelectedSessions(prevSessions => {
        const updatedSessions = [...prevSessions];
        const existingIndex = updatedSessions.findIndex(s => s.sessionId === sessionId);
        
        if (sessionRounds.size > 0) {
          const selectedRoundsData = session.rounds
            .filter(r => sessionRounds.has(r.id))
            .map(r => {
              const selections = roundSelections.get(r.id) || {};
              return {
                roundId: r.id,
                roundName: r.name,
                startTime: r.startTime,
                duration: r.duration,
                selectedTeam: selections.team,
                selectedTopic: selections.topic,
                selectedTopics: selections.topics
              };
            });

          const sessionData: SelectedSession = {
            sessionId: session.id,
            sessionName: session.name,
            date: session.date,
            startTime: session.startTime,
            endTime: session.endTime,
            rounds: selectedRoundsData
          };

          if (existingIndex >= 0) {
            updatedSessions[existingIndex] = sessionData;
          } else {
            updatedSessions.push(sessionData);
          }
        } else {
          // Remove session if no rounds selected
          if (existingIndex >= 0) {
            updatedSessions.splice(existingIndex, 1);
          }
        }
        

        
        return updatedSessions;
      });
      
      return newMap;
    });
  };

  const handleTeamSelect = (roundId: string, team: string) => {
    setRoundSelections(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(roundId) || {};
      newMap.set(roundId, { ...current, team });
      return newMap;
    });
    
    // Update selected sessions with new team selection
    setSelectedSessions(prevSessions => {
      return prevSessions.map(session => ({
        ...session,
        rounds: session.rounds.map(round => 
          round.roundId === roundId 
            ? { ...round, selectedTeam: team }
            : round
        )
      }));
    });
  };

  const handleTopicSelect = (roundId: string, topic: string) => {
    setRoundSelections(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(roundId) || {};
      newMap.set(roundId, { ...current, topic });
      return newMap;
    });
    
    // Update selected sessions with new topic selection
    setSelectedSessions(prevSessions => {
      return prevSessions.map(session => ({
        ...session,
        rounds: session.rounds.map(round => 
          round.roundId === roundId 
            ? { ...round, selectedTopic: topic }
            : round
        )
      }));
    });
  };

  const handleMultipleTopicsSelect = (roundId: string, topic: string) => {
    setRoundSelections(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(roundId) || {};
      const currentTopics = current.topics || [];
      
      let updatedTopics;
      if (currentTopics.includes(topic)) {
        // Remove topic if already selected
        updatedTopics = currentTopics.filter(t => t !== topic);
      } else {
        // Add topic if not selected
        updatedTopics = [...currentTopics, topic];
      }
      
      const updatedSelections = { ...current, topics: updatedTopics };
      newMap.set(roundId, updatedSelections);
      
      // Update selected sessions with new topics selection
      setSelectedSessions(prevSessions => {
        return prevSessions.map(session => ({
          ...session,
          rounds: session.rounds.map(round => {
            if (round.roundId === roundId) {
              return { ...round, selectedTopics: updatedTopics };
            }
            return round;
          })
        }));
      });
      
      return newMap;
    });
  };

  // Handler for confirming attendance
  const handleConfirmAttendance = async (roundId: string) => {
    if (!participantToken) {
      toast.error('Not logged in');
      return;
    }
    
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/p/${participantToken}/confirm/${roundId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to confirm attendance');
      }
      
      const data = await response.json();
      debugLog('✅ Attendance confirmed:', data);
      
      toast.success('Attendance confirmed! You will be matched at the start time.');
      
      // Refresh page to show updated status
      // Backend now uses merge logic to avoid race conditions
      window.location.reload();
      
    } catch (error) {
      debugLog('❌ Error confirming attendance:', error);
      toast.error('Failed to confirm attendance');
    }
  };

  // Handler for unregistering from a round
  const handleUnregister = async (roundId: string, roundName: string) => {
    if (!participantToken) {
      toast.error('Not logged in');
      return;
    }
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to unregister from "${roundName}"?`
    );
    
    if (!confirmed) return;
    
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/p/${participantToken}/unregister/${roundId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unregister');
      }
      
      const data = await response.json();
      debugLog('✅ Unregistered from round:', data);
      
      toast.success(`Unregistered from "${roundName}"`);
      
      // Refresh page to show updated rounds
      window.location.reload();
      
    } catch (error) {
      debugLog('❌ Error unregistering:', error);
      toast.error('Failed to unregister');
    }
  };

  const handleSendMagicLink = async () => {
    if (!magicLinkEmail || !validateEmail(magicLinkEmail)) {
      toast.error('Please enter a valid email');
      return;
    }

    try {
      setIsSendingMagicLink(true);
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      debugLog('Sending magic link for registration flow:', magicLinkEmail);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/participant/send-magic-link`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: magicLinkEmail,
            userSlug,
            continueRegistration: true
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('No account found with this email. Please create an account instead.');
        } else {
          toast.error(data.error || 'Failed to send magic link');
        }
        return;
      }

      // In development mode (when no RESEND_API_KEY), show the link directly
      if (data.magicLink) {
        debugLog('Magic link (dev mode):', data.magicLink);
        toast.success('Magic link sent! Check console in dev mode', {
          description: 'In production, this will be sent via email',
          duration: 5000
        });
      } else {
        toast.success('Magic link sent! Check your email to continue.');
      }
      
      setMagicLinkSent(true);
      
    } catch (error) {
      errorLog('Error sending magic link:', error);
      toast.error('Failed to send magic link');
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormErrors({});
    
    // Validate all required fields
    const errors: {[key: string]: string} = {};
    
    if (!registrationData.firstName.trim()) {
      errors.firstName = 'Please fill in this field';
    }
    
    if (!registrationData.lastName.trim()) {
      errors.lastName = 'Please fill in this field';
    }
    
    if (!registrationData.email.trim()) {
      errors.email = 'Please fill in this field';
    } else if (!validateEmail(registrationData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!registrationData.phone.trim()) {
      errors.phone = 'Please fill in this field';
    }
    
    // Show errors if any
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      document.getElementById(firstErrorField)?.focus();
      return;
    }

    // Check if email already exists before continuing
    const emailExists = await checkEmailExists(registrationData.email);
    if (emailExists) {
      setFormErrors({ email: 'Email already registered. Sign in below.' });
      document.getElementById('email-create')?.focus();
      return;
    }
    
    // Validate terms acceptance
    if (!registrationData.acceptTerms) {
      toast.error('Please accept the Terms of service to continue');
      return;
    }
    
    // Validate that all selected rounds have required team/topic selections
    for (const selectedSession of selectedSessions) {
      const session = sessions.find(s => s.id === selectedSession.sessionId);
      if (!session) continue;
      
      for (const selectedRound of selectedSession.rounds) {
        const round = session.rounds.find(r => r.id === selectedRound.roundId);
        if (!round) continue;
        
        // Check if team is required and selected
        if (session.enableTeams && session.teams && session.teams.length > 0) {
          if (!selectedRound.selectedTeam) {
            toast.error(`Please select a team for "${selectedRound.roundName}"`);
            return;
          }
        }
        
        // Check if topic is required and selected
        if (session.enableTopics && session.topics && session.topics.length > 0) {
          if (session.allowMultipleTopics) {
            // For multiple topics, check if at least one is selected
            if (!selectedRound.selectedTopics || selectedRound.selectedTopics.length === 0) {
              toast.error(`Please select at least one topic for "${selectedRound.roundName}"`);
              return;
            }
          } else {
            // For single topic, check if one is selected
            if (!selectedRound.selectedTopic) {
              toast.error(`Please select a topic for "${selectedRound.roundName}"`);
              return;
            }
          }
        }
      }
    }
    
    // Just move to next step - registration will be created later
    setCurrentStep('meeting-points');
    window.scrollTo(0, 0);
  };

  // Generate ICS file for calendar
  const generateICS = () => {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Wonderelo//Networking Rounds//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    selectedSessions.forEach(session => {
      session.rounds.forEach(round => {
        const startDate = new Date(`${session.date}T${round.startTime}:00`);
        const endDate = new Date(startDate.getTime() + round.duration * 60000);
        
        const formatICSDate = (date: Date) => {
          return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const eventUrl = `${window.location.origin}/${userSlug}`;
        const description = [
          `Networking round - ${round.roundName}`,
          round.selectedTeam ? `Team: ${round.selectedTeam}` : '',
          round.selectedTopic ? `Topic: ${round.selectedTopic}` : '',
          round.selectedTopics && round.selectedTopics.length > 0 ? `Topics: ${round.selectedTopics.join(', ')}` : '',
          '',
          '📍 MEETING POINTS',
          `Stay close to Meeting points (${eventUrl}#meeting-points) before your round to be on time.`,
        ].filter(Boolean).join('\\n');

        lines.push(
          'BEGIN:VEVENT',
          `DTSTART:${formatICSDate(startDate)}`,
          `DTEND:${formatICSDate(endDate)}`,
          `SUMMARY:${session.sessionName}`,
          `DESCRIPTION:${description}`,
          `LOCATION:${eventUrl}#meeting-points`,
          `UID:${session.sessionId}-${round.roundId}@wonderelo.com`,
          'STATUS:CONFIRMED',
          'END:VEVENT'
        );
      });
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  };

  const downloadICS = () => {
    const icsContent = generateICS();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    // Create filename: [EventName]-Wonderelo-rounds.ics
    const organizerPart = eventName ? eventName.replace(/[^a-zA-Z0-9]/g, '_') : 'Event';
    link.download = `${organizerPart}-Wonderelo-rounds.ics`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Calendar file downloaded!');
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Your browser does not support notifications');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        // Get notification times from system parameters
        const params = getParametersOrDefault();
        const earlyMin = params.notificationEarlyMinutes;
        const earlyEnabled = params.notificationEarlyEnabled;
        const lateMin = params.notificationLateMinutes;
        const lateEnabled = params.notificationLateEnabled;
        
        // Build message based on what's enabled
        let message = 'Notifications enabled!';
        if (earlyEnabled && lateEnabled) {
          message = `Notifications enabled! We'll remind you ${earlyMin} and ${lateMin} minutes before each round`;
        } else if (earlyEnabled) {
          message = `Notifications enabled! We'll remind you ${earlyMin} minutes before each round`;
        } else if (lateEnabled) {
          message = `Notifications enabled! We'll remind you ${lateMin} minutes before each round`;
        }
        toast.success(message);
        
        // Schedule notifications for each round
        selectedSessions.forEach(session => {
          session.rounds.forEach(round => {
            const startDate = new Date(`${session.date}T${round.startTime}:00`);
            const now = new Date();
            
            // Early reminder - only if enabled
            if (earlyEnabled) {
              const reminderEarly = new Date(startDate.getTime() - earlyMin * 60000);
              if (reminderEarly > now) {
                const timeoutEarly = reminderEarly.getTime() - now.getTime();
                setTimeout(() => {
                  new Notification('Networking round starting soon!', {
                    body: `${round.roundName} starts in ${earlyMin} minutes`,
                    icon: '/favicon.ico',
                    tag: `round-${round.roundId}-${earlyMin}min`
                  });
                }, timeoutEarly);
              }
            }
            
            // Late reminder - only if enabled
            if (lateEnabled) {
              const reminderLate = new Date(startDate.getTime() - lateMin * 60000);
              if (reminderLate > now) {
                const timeoutLate = reminderLate.getTime() - now.getTime();
                setTimeout(() => {
                  new Notification('Networking round starting very soon!', {
                    body: `${round.roundName} starts in ${lateMin} minutes`,
                    icon: '/favicon.ico',
                    tag: `round-${round.roundId}-${lateMin}min`
                  });
                }, timeoutLate);
              }
            }
          });
        });
      } else if (permission === 'denied') {
        toast.error('Notification permission denied');
      }
    } catch (error) {
      errorLog('Error requesting notification permission:', error);
      toast.error('Failed to enable notifications');
    }
  };

  // Helper function to check if round should be shown (hasn't ended yet)
  const isRoundVisible = (session: NetworkingSession, round: any): boolean => {
    if (!session.date || !round.startTime) return true; // If no date/time set, show it
    
    // Parse the round start time
    const [hours, minutes] = round.startTime.split(':').map(Number);
    const roundStartDateTime = new Date(round.date || session.date);
    roundStartDateTime.setHours(hours, minutes, 0, 0);
    
    // Calculate round end time (start + duration)
    const duration = round.duration || session.roundDuration || 0;
    const roundEndDateTime = new Date(roundStartDateTime.getTime() + duration * 60 * 1000);
    
    // Get current time (respects simulated time from TimeControl)
    const now = getCurrentTime();
    
    // Show round if it hasn't ended yet
    return now < roundEndDateTime;
  };

  // Helper function to check if round is registerable (more than safetyWindowMinutes before start)
  const isRoundRegisterable = (session: NetworkingSession, round: any): boolean => {
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

  // Filter sessions based on status and available rounds
  // Show sessions that are published on event page
  debugLog('🔍 SessionRegistration - Filtering sessions:', {
    totalSessions: sessions.length,
    sessionsWithStatus: sessions.map(s => ({ name: s.name, status: s.status }))
  });
  
  const availableSessions = sessions
    .filter(s => {
      const isPublished = s.status === 'published';
      if (!isPublished) {
        debugLog(`❌ Session "${s.name}" not published (status: ${s.status})`);
      }
      return isPublished;
    })
    .map(session => {
      const filteredRounds = session.rounds?.filter(round => {
        const isVisible = isRoundVisible(session, round);
        debugLog('🕐 Round visibility check:', {
          sessionName: session.name,
          roundName: round.name,
          roundStartTime: round.startTime,
          sessionDate: session.date,
          isVisible
        });
        return isVisible;
      }) || [];
      
      return {
        ...session,
        rounds: filteredRounds
      };
    })
    .filter(session => {
      const hasRounds = session.rounds.length > 0;
      if (!hasRounds) {
        debugLog('⚠️ Session filtered out (no visible rounds):', session.name);
      }
      return hasRounds;
    }) // Only show sessions with at least one visible round
    .sort((a, b) => {
      // Sort by date first (earliest date first)
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      if (dateA !== dateB) {
        return dateA - dateB; // Earlier date comes first
      }
      
      // If same date, sort by first round's start time
      const firstRoundA = a.rounds[0];
      const firstRoundB = b.rounds[0];
      
      if (firstRoundA && firstRoundB) {
        const timeA = firstRoundA.startTime;
        const timeB = firstRoundB.startTime;
        return timeA.localeCompare(timeB); // Earlier time comes first
      }
      
      return 0;
    });
  
  debugLog('✅ Available sessions for registration:', {
    count: availableSessions.length,
    sessions: availableSessions.map(s => ({ name: s.name, roundsCount: s.rounds.length }))
  });

  // Handler for Continue button - proceed from round selection
  const handleContinue = () => {
    if (selectedSessions.length === 0) return;
    
    // If participant is already logged in with a token, go to meeting points step
    if (participantToken) {
      setCurrentStep('meeting-points');
      window.scrollTo(0, 0);
    } else {
      // Otherwise, proceed to auth choice (existing user vs new registration)
      setCurrentStep('auth-choice');
      window.scrollTo(0, 0);
    }
  };

  // Step 3: Meeting Points
  if (currentStep === 'meeting-points') {
    // Collect sessions with their meeting points (grouped by session)
    // ONLY show meeting points from currently selected sessions (new registrations)
    const sessionsWithMeetingPoints = sessions
      .filter(session => {
        const isNewlySelected = selectedSessions.some(s => s.sessionId === session.id);
        // Only show meeting points for newly selected sessions
        return isNewlySelected && session.meetingPoints && session.meetingPoints.length > 0;
      })
      .map(session => ({
        sessionId: session.id,
        sessionName: session.name,
        meetingPoints: session.meetingPoints || [],
        date: session.date, // Keep date for sorting
        rounds: session.rounds // Keep rounds for sorting
      }))
      .sort((a, b) => {
        // Sort sessions chronologically by earliest round
        const getEarliestRoundTime = (sessionData: any): number => {
          if (!sessionData.date || !sessionData.rounds || sessionData.rounds.length === 0) return Infinity;
          
          let earliestTime = Infinity;
          
          for (const round of sessionData.rounds) {
            // Skip rounds without time
            if (!round.startTime || round.startTime === 'To be set' || round.startTime === 'TBD') continue;
            
            try {
              const [hours, minutes] = round.startTime.split(':').map(Number);
              const roundStart = new Date(sessionData.date);
              roundStart.setHours(hours, minutes, 0, 0);
              const timestamp = roundStart.getTime();
              
              if (timestamp < earliestTime) {
                earliestTime = timestamp;
              }
            } catch (error) {
              // Skip rounds with invalid time format
              continue;
            }
          }
          
          return earliestTime;
        };
        
        const aTime = getEarliestRoundTime(a);
        const bTime = getEarliestRoundTime(b);
        
        // Sessions with earlier rounds come first
        return aTime - bTime;
      });

    const handleFinalizeRegistration = async () => {
      setIsSubmitting(true);
      let shouldResetSubmitting = true; // Track if we should reset isSubmitting
      try {
        const { projectId, publicAnonKey } = await import('../utils/supabase/info');
        
        // Get existing token from localStorage or props (if any)
        const existingToken = participantToken || localStorage.getItem('participant_token');
        
        // If participant has existing token, use their existing profile data
        let participantData = registrationData;
        if (existingToken && participantProfile) {
          debugLog('✅ Using existing participant profile data (participant already logged in)');
          participantData = {
            firstName: participantProfile.firstName || registrationData.firstName,
            lastName: participantProfile.lastName || registrationData.lastName,
            email: participantProfile.email || registrationData.email,
            phone: participantProfile.phone || registrationData.phone,
            phoneCountry: participantProfile.phoneCountry || registrationData.phoneCountry,
            acceptTerms: registrationData.acceptTerms,
            allowMarketing: registrationData.allowMarketing
          };
        }
        
        debugLog('🚀 SUBMITTING REGISTRATION TO SERVER');
        debugLog('Participant:', participantData.email);
        debugLog('Sessions:', selectedSessions.length);
        debugLog('Existing token (from props):', participantToken ? `YES (${participantToken.substring(0, 20)}...)` : 'NO');
        debugLog('Existing token (from localStorage):', localStorage.getItem('participant_token') ? 'YES' : 'NO');
        debugLog('Using token:', existingToken ? `YES (${existingToken.substring(0, 20)}...)` : 'NO');
        
        // 🔍 DETAILED LOGGING OF SELECTED ROUNDS
        debugLog('');
        debugLog('📋 ========================================');
        debugLog('📋 DETAILED SELECTED ROUNDS BREAKDOWN');
        debugLog('📋 ========================================');
        debugLog('Total selectedRounds state entries:', selectedRounds.size);
        debugLog('selectedRounds Map contents:');
        selectedRounds.forEach((rounds, sessionId) => {
          debugLog(`  Session ${sessionId}:`, rounds);
        });
        debugLog('');
        debugLog('📦 SESSIONS BEING SENT TO BACKEND:');
        selectedSessions.forEach((session, index) => {
          debugLog(`  [${index}] Session: "${session.sessionName}" (ID: ${session.sessionId})`);
          debugLog(`      Rounds count: ${session.rounds.length}`);
          session.rounds.forEach((round, rIndex) => {
            debugLog(`        [${rIndex}] Round: "${round.name}" (${round.id}) at ${round.startTime} - MeetingPoint: ${round.meetingPoint || 'NONE'}`);
          });
        });
        debugLog('');
        debugLog('📤 COMPLETE REQUEST BODY:');
        const requestBody = {
          userSlug,
          participant: participantData,
          sessions: selectedSessions,
          existingToken: existingToken || undefined
        };
        debugLog(JSON.stringify(requestBody, null, 2));
        debugLog('========================================');
        debugLog('');
        
        // Create registration
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/register-participant`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        );

        debugLog('Server response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          debugLog('📦 Server response:', result);
          debugLog('requiresVerification:', result.requiresVerification);
          debugLog('alreadyRegistered:', result.alreadyRegistered);
          debugLog('token:', result.token);
          debugLog('existingToken (sent to server):', existingToken ? `YES (${existingToken.substring(0, 20)}...)` : 'NO');
          debugLog('participantData.email sent:', participantData.email);
          debugLog('');
          debugLog('🔍 DECISION LOGIC:');
          debugLog('  - Has existingToken?', !!existingToken);
          debugLog('  - requiresVerification?', result.requiresVerification);
          debugLog('  - Should skip verification?', !!existingToken);
          debugLog('');
          
          // Check if already registered for all selected rounds (with valid token)
          if (result.alreadyRegistered && !result.requiresVerification) {
            debugLog('ℹ️  All selected rounds already registered + has valid token - redirecting to My Rounds');
            // Store token and redirect to participant dashboard
            if (result.token) {
              localStorage.setItem('participant_token', result.token);
              setRegistrationAccessToken(result.token);
              // Clear dashboard cache to force refresh with new registration
              localStorage.removeItem(`participant_dashboard_${result.token}`);
              shouldResetSubmitting = false; // Don't reset - we're redirecting
              window.location.href = `/p/${result.token}`;
            }
            return;
          }
          
          // Check if verification is required
          // IMPORTANT: If participant has existing token, ALWAYS skip verification even if server says it's required
          if (result.requiresVerification && !existingToken) {
            // Navigate to "Continue from your email" page (ONLY for new participants)
            debugLog('📧 Email verification REQUIRED - showing waiting page');
            debugLog('User should receive VERIFICATION email');
            setCurrentStep('email-verification-waiting');
            window.scrollTo(0, 0);
            return;
          }
          
          // If participant already has token OR verification is not required, skip verification step
          if (existingToken) {
            debugLog('✅ Participant already has token - skipping email verification');
            debugLog('Will send CONFIRMATION email now...');
          } else if (!result.requiresVerification) {
            debugLog('✅ No verification needed - server confirmed');
            debugLog('Will send CONFIRMATION email now...');
          } else {
            // This shouldn't happen (existingToken + requiresVerification)
            debugLog('⚠️  Warning: Server requested verification but participant has token - ignoring verification request');
            debugLog('Will send CONFIRMATION email now...');
          }
          
          // No verification needed - store token and continue
          localStorage.setItem('participant_token', result.token);
          setRegistrationAccessToken(result.token);
          
          // Send confirmation email with magic link
          debugLog('📧 SENDING CONFIRMATION EMAIL');
          try {
            const eventUrl = `${window.location.origin}/${userSlug}`;
            const myRoundsUrl = `${window.location.origin}/p/${result.token}`;
            
            // 🔧 FIX: Use participant data from backend response (ensures we use the latest saved email)
            const emailData = result.participantData || {
              email: registrationData.email,
              firstName: registrationData.firstName,
              lastName: registrationData.lastName
            };
            
            debugLog('Email details:');
            debugLog('  To:', emailData.email);
            debugLog('  Name:', emailData.firstName, emailData.lastName);
            debugLog('  Event:', eventName);
            debugLog('  Sessions:', selectedSessions.length);
            debugLog('  My Rounds URL:', myRoundsUrl);
            debugLog('  Event URL:', eventUrl);
            debugLog('Calling /send-registration-email endpoint...');
            
            const emailResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/send-registration-email`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: emailData.email,
                  firstName: emailData.firstName,
                  lastName: emailData.lastName,
                  sessions: selectedSessions,
                  eventUrl: eventUrl,
                  myRoundsUrl: myRoundsUrl,
                  userSlug: userSlug,
                  eventName: eventName
                }),
              }
            );
            
            debugLog('Email endpoint response status:', emailResponse.status);
            const emailResult = await emailResponse.json();
            debugLog('Email endpoint response:', emailResult);
            
            if (emailResponse.ok && emailResult.success) {
              debugLog('✅ CONFIRMATION EMAIL SENT');
              debugLog('Check email inbox!');
            } else {
              errorLog('❌ FAILED TO SEND CONFIRMATION EMAIL');
              errorLog('Error:', emailResult);
            }
          } catch (emailError) {
            errorLog('💥 EXCEPTION SENDING CONFIRMATION EMAIL');
            errorLog(emailError);
            // Don't block the flow if email fails
          }
          
          // Redirect to participant dashboard - don't reset isSubmitting since we're leaving the page
          // Clear dashboard cache to force refresh with new registration
          localStorage.removeItem(`participant_dashboard_${result.token}`);
          shouldResetSubmitting = false;
          window.location.href = `/p/${result.token}?registered=true`;
        } else {
          const errorData = await response.json();
          errorLog('❌ Registration failed - Status:', response.status);
          errorLog('Error data:', errorData);
          errorLog('Error message:', errorData.error);
          errorLog('Contains "already registered":', errorData.error?.toLowerCase().includes('already registered'));
          
          // Check if error is about duplicate registration
          if (errorData.error && errorData.error.toLowerCase().includes('already registered')) {
            debugLog('🔄 Redirecting to email verification waiting page');
            // Navigate to email verification waiting page
            setCurrentStep('email-verification-waiting');
            window.scrollTo(0, 0);
          } else {
            toast.error(errorData.error || 'Registration failed. Please try again.');
          }
        }
      } catch (error) {
        errorLog('Registration error:', error);
        toast.error(
          error instanceof Error 
            ? `Registration failed: ${error.message}` 
            : 'Network error. Please check your connection and try again.'
        );
      } finally {
        // Only reset isSubmitting if we're not redirecting
        if (shouldResetSubmitting) {
          setIsSubmitting(false);
        }
      }
    };

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 max-w-md">
          <div className="text-center mb-6">
            <h1 className="mb-2">These are our meeting points</h1>
            <p className="text-muted-foreground">
              Stay near them before the round start.
            </p>
          </div>

          {sessionsWithMeetingPoints.length > 0 ? (
            <div className="space-y-6 mb-6">
              {sessionsWithMeetingPoints.map((session) => (
                <div key={session.sessionId}>
                  {sessionsWithMeetingPoints.length > 1 && (
                    <h2 className="mb-3">{session.sessionName}</h2>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {session.meetingPoints.map((point) => (
                      <Card key={point.id} className="overflow-hidden">
                        {point.imageUrl && (!point.type || point.type === 'physical') && (
                          <div className="aspect-square overflow-hidden bg-muted">
                            <ImageWithFallback
                              src={point.imageUrl}
                              alt={point.name || 'Meeting point'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className={point.imageUrl && (!point.type || point.type === 'physical') ? 'p-3' : 'p-4'}>
                          <div className="flex items-center gap-2">
                            {point.type === 'virtual' ? (
                              <Video className="h-4 w-4 text-primary flex-shrink-0" />
                            ) : (
                              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                            <p className="text-sm font-medium">{point.name}</p>
                          </div>
                          {point.type === 'virtual' && (
                            <p className="text-xs text-muted-foreground mt-1 ml-6">Video call</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-6">No meeting points added yet.</p>
          )}

          {/* Spacer for sticky bottom */}
          <div className="h-24" />

          {/* Sticky bottom buttons */}
          <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border p-4 shadow-lg z-10">
            <div className="max-w-md mx-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCurrentStep(participantToken ? 'select-rounds' : 'auth-choice');
                  window.scrollTo(0, 0);
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleFinalizeRegistration}
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? `Processing${'.'.repeat(processingDots)}`
                  : participantToken
                    ? 'Finalise my registration!'
                    : 'Continue'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 5: Confirmation (combined with share) — with confetti 🎉
  if (currentStep === 'confirmation') {
    const eventUrl = `${window.location.origin}/${userSlug}`;

    // Fire confetti on mount
    const confettiFired = useRef(false);
    useEffect(() => {
      if (confettiFired.current) return;
      confettiFired.current = true;
      const duration = 2500;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ff6b00', '#ff9500', '#ffb700'] });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ff6b00', '#ff9500', '#ffb700'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }, []);
    
    // Find the earliest round across all sessions to show countdown
    const earliestRound = selectedSessions.reduce((earliest: { date: string, time: string, name: string, sessionName: string } | null, session) => {
      const sessionEarliest = session.rounds.reduce((sessionEarly: { date: string, time: string, name: string, sessionName: string } | null, round) => {
        const candidate = { date: session.date, time: round.startTime, name: round.roundName, sessionName: session.sessionName };
        if (!sessionEarly) return candidate;
        
        const currentDateTime = new Date(`${candidate.date}T${candidate.time}`);
        const earliestDateTime = new Date(`${sessionEarly.date}T${sessionEarly.time}`);
        
        return currentDateTime < earliestDateTime ? candidate : sessionEarly;
      }, null);
      
      if (!earliest) return sessionEarliest;
      if (!sessionEarliest) return earliest;
      
      const currentDateTime = new Date(`${sessionEarliest.date}T${sessionEarliest.time}`);
      const earliestDateTime = new Date(`${earliest.date}T${earliest.time}`);
      
      return currentDateTime < earliestDateTime ? sessionEarliest : earliest;
    }, null);
    
    // Countdown component for the earliest round
    const CountdownDisplay = () => {
      if (!earliestRound) return null;
      
      const [countdown, setCountdown] = useState(calculateCountdown(earliestRound.date, earliestRound.time));
      
      useEffect(() => {
        const interval = setInterval(() => {
          setCountdown(calculateCountdown(earliestRound.date, earliestRound.time));
        }, 1000);
        
        return () => clearInterval(interval);
      }, []);
      
      return (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Time until round confirmation</p>
          <div className="text-4xl tabular-nums">
            {countdown}
          </div>
        </div>
      );
    };
    
    const handleCopyLink = () => {
      navigator.clipboard.writeText(eventUrl);
      toast.success('Link copied to clipboard!');
    };

    const handleShareTwitter = () => {
      const text = `Join me at this networking event!`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(eventUrl)}`, '_blank');
    };

    const handleShareFacebook = () => {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`, '_blank');
    };

    const handleShareLinkedIn = () => {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`, '_blank');
    };

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <PartyPopper className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">You're in! 🎉</CardTitle>
            <CardDescription>
              {earliestRound
                ? `Next round: ${earliestRound.name}`
                : 'Check your email for details'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Countdown to confirmation */}
            {earliestRound && <CountdownDisplay />}

            {/* Round details */}
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">Your registered rounds</p>
              
              {selectedSessions.map((session) => (
                <div key={session.sessionId} className="bg-muted/50 p-3 rounded-lg space-y-2">
                  <div className="text-center">
                    <p className="font-medium">{session.sessionName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(`${session.date}T${session.startTime}`).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    {session.rounds.map((round) => (
                      <div key={round.roundId} className="bg-background p-2 rounded text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{round.roundName}</span>
                          <span className="text-muted-foreground">
                            {round.startTime}
                          </span>
                        </div>
                        {(round.selectedTeam || round.selectedTopic || (round.selectedTopics && round.selectedTopics.length > 0)) && (
                          <div className="flex gap-1 flex-wrap">
                            {round.selectedTeam && (
                              <Badge variant="outline" className="text-xs h-5">
                                {round.selectedTeam}
                              </Badge>
                            )}
                            {round.selectedTopic && (
                              <Badge variant="outline" className="text-xs h-5">
                                {round.selectedTopic}
                              </Badge>
                            )}
                            {round.selectedTopics && round.selectedTopics.map((topic, index) => (
                              <Badge key={index} variant="outline" className="text-xs h-5">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Important info */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <p className="text-sm text-center">
                You'll receive a confirmation request 5 minutes before each round starts.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {registrationAccessToken && (
                <Button 
                  onClick={() => {
                    // Clear dashboard cache to force refresh with new registration
                    localStorage.removeItem(`participant_dashboard_${registrationAccessToken}`);
                    navigate(`/p/${registrationAccessToken}`);
                  }}
                  variant="default"
                  className="w-full"
                >
                  View my registrations
                </Button>
              )}
              
              <Button onClick={downloadICS} variant="outline" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Add to calendar
              </Button>
            </div>

            {/* Additional info */}
            <p className="text-xs text-center text-muted-foreground">
              Stay close to meeting points before your round to be on time.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check for existing participant token
  const existingToken = typeof window !== 'undefined' ? localStorage.getItem('participant_token') : null;

  // Step 2: Auth Choice (Sign in or Create account)
  if (currentStep === 'auth-choice') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 max-w-md">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentStep('select-rounds');
                window.scrollTo(0, 0);
              }}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="text-center mb-6">
              <h1 className="mb-2">Continue your registration</h1>
              <p className="text-muted-foreground">
                Create an account or sign in to continue
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Create account - First time here */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">First time here?</CardTitle>
                <CardDescription>
                  Create your account to join the networking rounds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegistrationSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName-create" className="flex items-center gap-1 mb-2">
                        <User className="h-4 w-4" />
                        First name
                      </Label>
                      <Input
                        id="firstName-create"
                        type="text"
                        value={registrationData.firstName}
                        onChange={(e) => {
                          setRegistrationData(prev => ({
                            ...prev,
                            firstName: e.target.value
                          }));
                          if (formErrors.firstName) {
                            setFormErrors(prev => ({ ...prev, firstName: '' }));
                          }
                        }}
                        className={formErrors.firstName ? 'border-destructive' : ''}
                        disabled={isSubmitting}
                      />
                      {formErrors.firstName && (
                        <p className="text-sm text-destructive mt-1">{formErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName-create" className="mb-2 block">Last name</Label>
                      <Input
                        id="lastName-create"
                        type="text"
                        value={registrationData.lastName}
                        onChange={(e) => {
                          setRegistrationData(prev => ({
                            ...prev,
                            lastName: e.target.value
                          }));
                          if (formErrors.lastName) {
                            setFormErrors(prev => ({ ...prev, lastName: '' }));
                          }
                        }}
                        className={formErrors.lastName ? 'border-destructive' : ''}
                        disabled={isSubmitting}
                      />
                      {formErrors.lastName && (
                        <p className="text-sm text-destructive mt-1">{formErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email-create" className="flex items-center gap-1 mb-2">
                      <Mail className="h-4 w-4" />
                      Email address
                    </Label>
                    <Input
                      id="email-create"
                      type="email"
                      value={registrationData.email}
                      onChange={(e) => {
                        handleEmailChange(e);
                        if (formErrors.email) {
                          setFormErrors(prev => ({ ...prev, email: '' }));
                        }
                      }}
                      onBlur={handleEmailBlur}
                      disabled={isSubmitting}
                      className={(emailError || formErrors.email) ? 'border-destructive' : ''}
                    />
                    {(emailError || formErrors.email) && (
                      <p className="text-sm text-destructive mt-1">{emailError || formErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone-create" className="flex items-center gap-1 mb-2">
                      <Phone className="h-4 w-4" />
                      Phone number
                    </Label>
                    <div className="flex gap-2">
                      <Popover open={phoneCountryOpen} onOpenChange={setPhoneCountryOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={phoneCountryOpen}
                            className="w-[120px] justify-between"
                            disabled={isSubmitting}
                            type="button"
                          >
                            {registrationData.phoneCountry}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search country..." />
                            <CommandList>
                              <CommandEmpty>No country found.</CommandEmpty>
                              <CommandGroup>
                                {sortedCountryCodes.map((country) => (
                                  <CommandItem
                                    key={country.code}
                                    value={`${country.name} ${country.prefix}`}
                                    onSelect={() => {
                                      setRegistrationData(prev => ({
                                        ...prev,
                                        phoneCountry: country.prefix
                                      }));
                                      setPhoneCountryOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        registrationData.phoneCountry === country.prefix
                                          ? 'opacity-100'
                                          : 'opacity-0'
                                      }`}
                                    />
                                    <span className="inline-block w-12 text-muted-foreground">{country.prefix}</span>
                                    <span>{country.name}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Input
                        id="phone-create"
                        type="tel"
                        value={registrationData.phone}
                        onChange={(e) => {
                          setRegistrationData(prev => ({
                            ...prev,
                            phone: e.target.value
                          }));
                          if (formErrors.phone) {
                            setFormErrors(prev => ({ ...prev, phone: '' }));
                          }
                        }}
                        placeholder={getPhonePlaceholder()}
                        disabled={isSubmitting}
                        className={`flex-1 ${formErrors.phone ? 'border-destructive' : ''}`}
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="text-sm text-destructive mt-1">{formErrors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="acceptTerms-create"
                        checked={registrationData.acceptTerms}
                        onCheckedChange={(checked) => setRegistrationData(prev => ({
                          ...prev,
                          acceptTerms: checked === true
                        }))}
                        disabled={isSubmitting}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label htmlFor="acceptTerms-create" className="text-sm cursor-pointer">
                          I accept the{' '}<a href="https://wonderelo.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Terms of service</a>*
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="allowMarketing-create"
                        checked={registrationData.allowMarketing}
                        onCheckedChange={(checked) => setRegistrationData(prev => ({
                          ...prev,
                          allowMarketing: checked === true
                        }))}
                        disabled={isSubmitting}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label htmlFor="allowMarketing-create" className="text-sm cursor-pointer">
                          I allow the event organizer to use my email for marketing purposes
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <>Processing{'.'.repeat(processingDots)}</> : <>Create account and continue</>}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Sign in with magic link - Already registered */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Already registered?</CardTitle>
                <CardDescription>
                  Sign in with a magic link sent to your email
                </CardDescription>
              </CardHeader>
              <CardContent>
                {magicLinkSent ? (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        We've sent a magic link to
                      </p>
                      <p className="font-medium">{magicLinkEmail}</p>
                    </div>

                    <Separator />

                    <div className="text-sm text-muted-foreground text-center">
                      <p>Didn't receive the email?</p>
                      <Button
                        variant="link"
                        className="h-auto p-0 mt-1"
                        onClick={() => {
                          setMagicLinkSent(false);
                          setMagicLinkEmail('');
                        }}
                      >
                        Try again
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="magic-link-email" className="flex items-center gap-1 mb-2">
                        <Mail className="h-4 w-4" />
                        Email address
                      </Label>
                      <Input
                        id="magic-link-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={magicLinkEmail}
                        onChange={(e) => setMagicLinkEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSendMagicLink();
                          }
                        }}
                      />
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleSendMagicLink}
                      disabled={isSendingMagicLink || !magicLinkEmail}
                    >
                      {isSendingMagicLink ? (
                        <>Sending...</>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Send magic link
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Email Verification Waiting
  if (currentStep === 'email-verification-waiting') {
    return <EmailVerificationWaiting email={registrationData.email} />;
  }

  // Step 1: Select Rounds
  if (currentStep === 'select-rounds') {
    // Check if all selected rounds have required team/topic selections
    let missingTeams = false;
    let missingTopics = false;
    
    const canContinue = selectedSessions.every(selectedSession => {
      return selectedSession.rounds.every(selectedRound => {
        // Find the actual session to check requirements
        const actualSession = availableSessions.find(s => s.id === selectedSession.sessionId);
        if (!actualSession) return true;
        
        const roundSelectionData = roundSelections.get(selectedRound.roundId) || {};
        
        // Check if team is required and selected
        if (actualSession.enableTeams && actualSession.teams && actualSession.teams.length > 0) {
          if (!roundSelectionData.team) {
            missingTeams = true;
            return false;
          }
        }
        
        // Check if topic is required and selected
        if (actualSession.enableTopics && actualSession.topics && actualSession.topics.length > 0) {
          if (actualSession.allowMultipleTopics) {
            // For multiple topics, at least one should be selected
            if (!roundSelectionData.topics || roundSelectionData.topics.length === 0) {
              missingTopics = true;
              return false;
            }
          } else {
            // For single topic, one must be selected
            if (!roundSelectionData.topic) {
              missingTopics = true;
              return false;
            }
          }
        }
        
        return true;
      });
    });
    
    // Generate specific error message
    let errorMessage = '';
    if (missingTeams && missingTopics) {
      errorMessage = 'Please select group and topic for each round';
    } else if (missingTeams) {
      errorMessage = 'Please select a group for each round';
    } else if (missingTopics) {
      errorMessage = 'Please select a topic for each round';
    }
    
    const content = (
      <>
        {/* Sessions Selection */}
        <div>
          <div className="space-y-4">
            {availableSessions.map((session) => {
                const sessionRounds = selectedRounds.get(session.id) || new Set();
                const hasSelectedRounds = sessionRounds.size > 0;
                
                return (
                  <Card 
                    key={session.id} 
                    className="transition-all hover:border-muted-foreground/20"
                  >
                    <CardContent className="pt-[16px] pr-[16px] pb-[45px] pl-[16px]">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            {session.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(session.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
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
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowMeetingPoints(true);
                          }}
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
                              const isRoundSelected = sessionRounds.has(round.id);
                              
                              const roundSelectionData = roundSelections.get(round.id) || {};
                              
                              // Check if this is the first unregistered round in the session
                              const isFirstUnregistered = !registeredRoundsPerSession.get(session.id)?.has(round.id) && 
                                session.rounds.slice(0, roundIndex).every((r) => 
                                  registeredRoundsPerSession.get(session.id)?.has(r.id) || false
                                );
                              
                              const isRegisteredRound = registeredRoundsPerSession.get(session.id)?.has(round.id) || false;
                              
                              // Don't show rounds where participant has 'no-match' status
                              const participantStatus = isRegisteredRound ? participantStatusMap.get(round.id) : undefined;
                              if (participantStatus === 'no-match') {
                                return null;
                              }
                              
                              // Check if this is the globally next upcoming registered round
                              const roundKey = `${session.id}:${round.id}`;
                              const isNextUpcoming = roundKey === globalNextUpcomingRoundId;
                              
                              // Check if round is still registerable
                              const canRegister = isRoundRegisterable(session, round);
                              
                              // Filter logic: Don't show non-registerable rounds unless they are:
                              // 1. Already registered for this round OR
                              // 2. The last non-registerable round in the session (to show "Registration closed")
                              if (!canRegister && !isRegisteredRound) {
                                // Find if this is the last non-registerable round
                                const lastNonRegisterableIndex = session.rounds
                                  .map((r, i) => ({ round: r, index: i }))
                                  .filter(({ round: r }) => !isRoundRegisterable(session, r) && !registeredRoundsPerSession.get(session.id)?.has(r.id))
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
                                  isSelected={isRoundSelected}
                                  isRegistered={isRegisteredRound}
                                  isRegisterable={canRegister}
                                  // Show countdown for next upcoming registered round
                                  isNextUpcoming={isNextUpcoming}
                                  participantId={participantProfile?.id}
                                  // Pass participantStatus for registered rounds to show same display as participant dashboard
                                  participantStatus={participantStatus}
                                  onSelect={(roundId) => handleRoundSelect(session, round)}
                                  generateRoundTimeDisplay={generateRoundTimeDisplay}
                                  selectedTeam={roundSelectionData.team}
                                  selectedTopic={roundSelectionData.topic}
                                  selectedTopics={roundSelectionData.topics}
                                  onTeamSelect={handleTeamSelect}
                                  onTopicSelect={handleTopicSelect}
                                  onMultipleTopicsSelect={handleMultipleTopicsSelect}
                                  showRegistrationClosesCountdown={isFirstUnregistered}
                                  // Show unregister button and confirm attendance for registered rounds
                                  showUnregisterButton={isRegisteredRound && !!participantToken}
                                  onUnregister={() => handleUnregister(round.id, round.name)}
                                  onConfirmAttendance={handleConfirmAttendance}
                                  registeredCount={round.registeredCount}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </CardContent>
                  </Card>
                );
              })}

            {availableSessions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No rounds available for registration at this time.</p>
              </div>
            )}
          </div>

          {/* Add padding to prevent content from being hidden under sticky button */}
          <div className="h-32" />

          {/* Continue button and text */}
          {(
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 shadow-lg z-10" style={{ minHeight: '100px' }}>
              <div className="container mx-auto max-w-md space-y-3">
                <Button
                  onClick={handleContinue}
                  className="w-full"
                  disabled={selectedSessions.length === 0 || !canContinue}
                >
                  Continue
                </Button>
                
                {selectedSessions.length === 0 && (
                  <p className="text-sm text-center text-muted-foreground">
                    Select at least one round
                  </p>
                )}
                
                {errorMessage && selectedSessions.length > 0 && (
                  <p className="text-sm text-center text-muted-foreground">
                    {errorMessage}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Meeting Points Dialog */}
          <MeetingPointsDialog
            open={showMeetingPoints}
            onOpenChange={(open) => {
              setShowMeetingPoints(open);
              if (!open && window.location.hash === '#meeting-points') {
                window.history.replaceState(null, '', window.location.pathname);
              }
            }}
            sessionsWithMeetingPoints={sessions
              .filter(s => s.meetingPoints && s.meetingPoints.length > 0)
              .map(s => ({
                sessionId: s.id,
                sessionName: s.name,
                meetingPoints: s.meetingPoints || [],
                date: s.date,
                rounds: s.rounds
              }))
              .sort((a, b) => {
                // Sort sessions chronologically by earliest round
                const getEarliestRoundTime = (sessionData: any): number => {
                  if (!sessionData.date || !sessionData.rounds || sessionData.rounds.length === 0) return Infinity;
                  
                  let earliestTime = Infinity;
                  
                  for (const round of sessionData.rounds) {
                    if (!round.startTime || round.startTime === 'To be set' || round.startTime === 'TBD') continue;
                    
                    try {
                      const [hours, minutes] = round.startTime.split(':').map(Number);
                      const roundStart = new Date(sessionData.date);
                      roundStart.setHours(hours, minutes, 0, 0);
                      const timestamp = roundStart.getTime();
                      
                      if (timestamp < earliestTime) {
                        earliestTime = timestamp;
                      }
                    } catch (error) {
                      continue;
                    }
                  }
                  
                  return earliestTime;
                };
                
                const aTime = getEarliestRoundTime(a);
                const bTime = getEarliestRoundTime(b);
                
                return aTime - bTime;
              })
            }
          />

          {/* Round Rules Dialog */}
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
        </div>
      </>
    );
    
    if (noWrapper) {
      return content;
    }
    
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 max-w-md">
          {content}
        </div>
      </div>
    );
  }

  // Fallback - should not reach here
  return null;
}