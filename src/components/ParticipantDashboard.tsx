import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { toast } from 'sonner@2.0.3';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Clock, Users, Loader2, X, CheckCircle } from 'lucide-react';
import { ParticipantLayout } from './ParticipantLayout';
import { RoundItem } from './RoundItem';
import { ServiceType, NetworkingSession, Round } from '../App';
import { MeetingPointsDialog } from './MeetingPointsDialog';
import { RoundRulesDialog, RoundRule } from './RoundRulesDialog';
import { ParticipantStatusBadge } from '../utils/statusBadge';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { debugLog, errorLog } from '../utils/debug';
import { useTime } from '../contexts/TimeContext';

interface Registration {
  roundId: string;
  sessionId: string;
  sessionName: string;
  roundName: string;
  organizerId?: string;
  organizerName: string;
  organizerUrlSlug: string;
  status: string;
  currentStatus?: string;
  startTime: string;
  duration: number;
  date: string;
  registeredAt: string;
  notificationsEnabled: boolean;
  sessionDate?: string;
  roundStartTime?: string;
  roundDuration?: number;
  roundParticipantId?: string; // Round-specific participant ID
  // Match details (present when participant is matched)
  matchId?: string;
  matchPartnerIds?: string[];
  matchPartnerNames?: string[];
  meetingPointId?: string;
  identificationImageUrl?: string;
}

interface SessionWithRounds {
  session: NetworkingSession;
  registeredRoundIds: Set<string>;
  registrationStatusMap?: Map<string, string>; // roundId -> status
}

export function ParticipantDashboard() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  // Initialize from cached data for instant display
  const getCachedDashboard = () => {
    try {
      const cached = localStorage.getItem(`participant_dashboard_${token}`);
      if (cached) {
        const data = JSON.parse(cached);
        
        // Convert arrays back to Sets and Maps
        const sessions = (data.sessions || []).map((s: any) => ({
          session: s.session,
          registeredRoundIds: new Set(s.registeredRoundIds || []),
          registrationStatusMap: new Map(s.registrationStatusMap || [])
        }));
        
        return {
          sessions,
          registrations: data.registrations || [],
          email: data.email || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          participantId: data.participantId || '',
          hasCache: true
        };
      }
    } catch (err) {
      // Ignore parsing errors
    }
    return {
      sessions: [],
      registrations: [],
      email: '',
      firstName: '',
      lastName: '',
      participantId: '',
      hasCache: false
    };
  };
  
  const cachedDashboard = getCachedDashboard();
  
  const [sessions, setSessions] = useState<SessionWithRounds[]>(cachedDashboard.sessions);
  const [isLoading, setIsLoading] = useState(!cachedDashboard.hasCache);
  const [isFetching, setIsFetching] = useState(false); // Track if fetch is in progress
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState(cachedDashboard.email);
  const [firstName, setFirstName] = useState(cachedDashboard.firstName);
  const [lastName, setLastName] = useState(cachedDashboard.lastName);
  const [participantId, setParticipantId] = useState(cachedDashboard.participantId);
  const [registrations, setRegistrations] = useState<Registration[]>(cachedDashboard.registrations);
  
  // Track last optimistic update to prevent refetch from overwriting it
  const lastOptimisticUpdateRef = useRef<number>(0);
  
  // Debug state - capture server responses
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const showDebug = window.location.search.includes('debug=true');
  
  // Dialog states
  const [showMeetingPoints, setShowMeetingPoints] = useState(false);
  const [showRoundRules, setShowRoundRules] = useState(false);
  const [selectedSessionForDialog, setSelectedSessionForDialog] = useState<NetworkingSession | null>(null);
  const [roundRules, setRoundRules] = useState<RoundRule[]>([]);
  
  // Unregister confirmation dialog
  const [showUnregisterDialog, setShowUnregisterDialog] = useState(false);
  const [pendingUnregister, setPendingUnregister] = useState<{ session: NetworkingSession; round: Round; status?: string } | null>(null);
  
  // Team and topic selections
  const [roundSelections, setRoundSelections] = useState<Map<string, { team?: string; topic?: string; topics?: string[] }>>(new Map());

  // Get current time from TimeContext
  const { getCurrentTime, simulatedTime } = useTime();
  
  // Helper to add simulated time parameter to URL (only when simulated time is active)
  const addSimulatedTimeParam = (url: string): string => {
    // Only add simulatedTime parameter if TimeControl is active
    if (simulatedTime !== null) {
      const currentTime = getCurrentTime();
      const separator = url.includes('?') ? '&' : '?';
      const finalUrl = `${url}${separator}simulatedTime=${currentTime.getTime()}`;
      // debugLog(`🕐 addSimulatedTimeParam: simulatedTime=${simulatedTime}, currentTime=${currentTime.toISOString()}, adding param: ${currentTime.getTime()}`);
      return finalUrl;
    }
    // Return URL unchanged if using real time
    // debugLog(`🕐 addSimulatedTimeParam: Using real time (simulatedTime=${simulatedTime})`);
    return url;
  };
  
  // State for globally next upcoming round (updates every second)
  const [globalNextUpcomingRoundId, setGlobalNextUpcomingRoundId] = useState<string | null>(null);
  
  // Helper function to check if a round is completed
  const isRoundCompleted = (session: NetworkingSession, round: Round, roundStatus?: string): boolean => {
    // If round has explicit status, use it
    if (round.status === 'completed') {
      return true;
    }
    
    // If participant has 'no-match' status, ALWAYS treat as completed
    // (matching already happened, participant was alone - round didn't occur)
    if (roundStatus === 'no-match') {
      return true;
    }
    
    // Check if round time has passed first
    if (!session.date || !round.startTime || round.startTime === 'To be set' || round.startTime === 'TBD') {
      return false;
    }
    
    try {
      const [hours, minutes] = round.startTime.split(':').map(Number);
      const roundStart = new Date(round.date || session.date); // Use round.date, fallback to session.date for backwards compatibility
      roundStart.setHours(hours, minutes, 0, 0);
      
      // Add round duration to get end time
      const roundEnd = new Date(roundStart.getTime() + round.duration * 60000);
      const now = getCurrentTime();
      const roundHasPassed = roundEnd <= now;
      
      // If participant status is 'unconfirmed':
      // - If round has passed → treat as completed (no-show)
      // - If round is upcoming → treat as NOT completed (still can confirm)
      if (roundStatus === 'unconfirmed') {
        return roundHasPassed;
      }
      
      return roundHasPassed;
    } catch (error) {
      return false;
    }
  };
  
  // Update globalNextUpcomingRoundId every second
  useEffect(() => {
    const updateGlobalNextRound = (silent = true) => {
      const now = getCurrentTime();
      let earliestTime = Infinity;
      let nextRoundKey: string | null = null; // Format: "sessionId:roundId"
      
      for (const { session, registeredRoundIds, registrationStatusMap } of sessions) {
        if (!session.rounds || session.rounds.length === 0) continue;
        if (!session.date) continue;
        
        // Only process rounds that have at least one upcoming registered round
        const hasUpcomingRound = session.rounds.some(round => {
          const roundStatus = registrationStatusMap?.get(round.id);
          return registeredRoundIds.has(round.id) && !isRoundCompleted(session, round, roundStatus);
        });
        
        if (!hasUpcomingRound) continue;
        
        const registeredRounds = session.rounds.filter(round => {
          const isCompleted = isRoundCompleted(session, round);
          const isRegistered = registeredRoundIds.has(round.id);
          return !isCompleted && isRegistered;
        });
        
        for (const round of registeredRounds) {
          if (round.startTime && round.startTime !== 'To be set' && round.startTime !== 'TBD') {
            const [hours, minutes] = round.startTime.split(':').map(Number);
            const roundStart = new Date(round.date || session.date);
            roundStart.setHours(hours, minutes, 0, 0);
            
            // We want the earliest FUTURE round (after current time)
            if (roundStart.getTime() > now.getTime() && roundStart.getTime() < earliestTime) {
              earliestTime = roundStart.getTime();
              nextRoundKey = `${session.id}:${round.id}`;
            }
          }
        }
      }
      
      setGlobalNextUpcomingRoundId(nextRoundKey);
    };
    
    // Run once immediately (silently to avoid log spam)
    updateGlobalNextRound(true);
    
    // Only set up interval if simulated time is active (for testing)
    // In production with real time, the next round doesn't change every second
    if (!simulatedTime) {
      // No interval needed - next round is static until page refresh or action
      return;
    }
    
    // When testing with TimeControl, update every second (silently to avoid log spam)
    const interval = setInterval(() => updateGlobalNextRound(true), 1000);
    
    return () => clearInterval(interval);
  }, [sessions, getCurrentTime, simulatedTime]);

  // Version identifier for debugging
  useEffect(() => {
    // debugLog('🎯 ParticipantDashboard v6.3.0 (round-based sections) loaded - Build time: 2024-11-03 18:15');
  }, []);

  // Auto-redirect to match page when 'no-match' or 'matched' status is first detected
  useEffect(() => {
    if (!token || !registrations || registrations.length === 0) return;
    
    // Check if any registration has 'no-match' status that hasn't been shown yet
    const noMatchRegistration = registrations.find((reg: any) => {
      if (reg.status !== 'no-match') return false;
      
      // Check if we already showed the /match page for this round
      const redirectKey = `no_match_shown_${token}_${reg.roundId}`;
      const alreadyShown = localStorage.getItem(redirectKey);
      
      if (alreadyShown === 'true') {
        debugLog(`🔍 [NO-MATCH] Round ${reg.roundId}: already shown, skipping redirect`);
        return false; // Already shown, don't redirect
      }
      
      debugLog(`🔍 [NO-MATCH] Round ${reg.roundId}: first time detection, will redirect`);
      return true; // First time - will redirect
    });
    
    if (noMatchRegistration) {
      // Save flag that we showed the /match page for this round
      const redirectKey = `no_match_shown_${token}_${noMatchRegistration.roundId}`;
      localStorage.setItem(redirectKey, 'true');
      
      debugLog('🔀 Redirecting to /match page (first time no-match detected)');
      navigate(`/p/${token}/match`);
      return;
    }
    
    // Check if any registration has 'matched' status that hasn't been shown yet
    const matchedRegistration = registrations.find((reg: any) => {
      if (reg.status !== 'matched') return false;
      
      // Check if we already showed the /match page for this round
      const redirectKey = `matched_shown_${token}_${reg.roundId}`;
      const alreadyShown = localStorage.getItem(redirectKey);
      
      if (alreadyShown === 'true') {
        debugLog(`🔍 [MATCHED] Round ${reg.roundId}: already shown, skipping redirect`);
        return false; // Already shown, don't redirect
      }
      
      debugLog(`🔍 [MATCHED] Round ${reg.roundId}: first time detection, will redirect`);
      return true; // First time - will redirect
    });
    
    if (matchedRegistration) {
      // Save flag that we showed the /match page for this round
      const redirectKey = `matched_shown_${token}_${matchedRegistration.roundId}`;
      localStorage.setItem(redirectKey, 'true');
      
      debugLog('🔀 Redirecting to /match page (first time matched detected)');
      navigate(`/p/${token}/match`);
    }
  }, [registrations, token, navigate]);

  useEffect(() => {
    if (token) {
      // Save token to localStorage so it persists across navigation
      localStorage.setItem('participant_token', token);
      debugLog('✅ Participant token saved to localStorage:', token);
      
      // Check if there's a continue parameter for registration flow
      const searchParams = new URLSearchParams(window.location.search);
      const continueUrl = searchParams.get('continue');
      
      if (continueUrl) {
        debugLog('🔗 Magic link has continue parameter, redirecting to:', continueUrl);
        // Redirect to the continue URL after a brief delay to ensure token is saved
        setTimeout(() => {
          navigate(continueUrl);
        }, 500);
        return;
      }
      
      fetchData();
    }
  }, [token]);

  // Refetch data when simulated time changes
  useEffect(() => {
    if (token && simulatedTime) {
      debugLog('⏰ Simulated time changed, refetching data...');
      fetchData();
    }
  }, [simulatedTime]);

  // Periodic refetch to catch status transitions
  useEffect(() => {
    if (!token) return;

    // Simple 5-second interval to catch all status transitions quickly
    const interval = setInterval(() => {
      if (document.hidden) {
        debugLog('⏰ Tab is hidden, skipping refetch');
        return;
      }
      
      // Skip refetch if there was a recent optimistic update (within last 10 seconds)
      const timeSinceLastUpdate = Date.now() - lastOptimisticUpdateRef.current;
      if (timeSinceLastUpdate < 20000) {
        debugLog(`⏰ Skipping refetch - recent optimistic update (${Math.round(timeSinceLastUpdate/1000)}s ago, wait ${Math.round((20000-timeSinceLastUpdate)/1000)}s more)`);
        return;
      }
      
      debugLog('⏰ Periodic refetch (5s)...');
      fetchData();
    }, 5000); // 5 seconds - fast enough to catch matching

    return () => {
      clearInterval(interval);
    };
  }, [token]);
  
  // Refetch when tab becomes visible again (in case status changed while hidden)
  useEffect(() => {
    if (!token) return;
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        debugLog('👁️ Tab became visible, refetching data...');
        fetchData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token]);

  const fetchData = async () => {
    // Debounce: Skip if already fetching
    if (isFetching) {
      return;
    }
    
    setIsFetching(true);
    
    // Track if this is a background refetch (we already have data)
    const isBackgroundRefetch = sessions.length > 0 || registrations.length > 0;
    
    try {
      // OPTIMIZATION: Use new dashboard endpoint - gets everything in ONE request
      const baseUrl = addSimulatedTimeParam(`https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/p/${token}/dashboard`);
      
      // Add cache busting parameter to ensure fresh data
      const separator = baseUrl.includes('?') ? '&' : '?';
      const url = `${baseUrl}${separator}_cb=${Date.now()}`;
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(
        url,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        
        let errorMessage = 'Failed to load participant data';
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          // Not JSON, use status code
          if (response.status === 404) {
            errorMessage = 'Invalid or expired participant link. Please use the latest link from your email.';
          } else {
            errorMessage = `Error ${response.status}: ${errorText}`;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // Check if we need to redirect to correct token
      if (data.redirect && data.correctToken) {
        toast.info('Redirecting to updated link...');
        navigate(`/p/${data.correctToken}`, { replace: true });
        return;
      }
      
      // Set participant info
      setEmail(data.email);
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setParticipantId(data.participantId || '');
      
      // Cache profile data in localStorage for instant display in other pages
      localStorage.setItem(`participant_profile_${token}`, JSON.stringify({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email,
        phone: data.phone || ''
      }));
      
      // Set registrations
      const regs = data.registrations || [];
      
      debugLog('🔍 [DASHBOARD] Backend returned registrations:', regs.map((r: any) => ({
        roundId: r.roundId,
        roundName: r.roundName,
        sessionId: r.sessionId,
        sessionName: r.sessionName,
        status: r.status
      })));
      
      debugLog('🔍 [DASHBOARD] FULL DATA:', JSON.stringify(data, null, 2));
      
      setRegistrations(regs);
      
      // Cache each registration with its session data for round detail pages
      regs.forEach((reg: Registration) => {
        const session = data.sessions?.find((s: any) => s.id === reg.sessionId);
        if (session) {
          const round = session.rounds?.find((r: any) => r.id === reg.roundId);
          if (round) {
            localStorage.setItem(`participant_round_${token}_${reg.roundId}`, JSON.stringify({
              registration: reg,
              session: {
                id: session.id,
                name: session.name,
                date: session.date,
                location: session.location,
                meetingPoints: session.meetingPoints
              },
              round: {
                id: round.id,
                name: round.name,
                startTime: round.startTime,
                duration: round.duration,
                groupSize: session.groupSize,
                iceBreakers: session.iceBreakers,
                date: round.date
              },
              organizer: {
                name: data.organizerName || 'Organizer',
                urlSlug: data.organizerSlug || ''
              }
            }));
          }
        }
      });
      
      // Process sessions
      const allSessions: SessionWithRounds[] = [];
      
      if (data.sessions && data.sessions.length > 0) {
        for (const session of data.sessions) {
          const registeredRoundIds = new Set(
            regs
              .filter((r: Registration) => r.sessionId === session.id)
              .map((r: Registration) => r.roundId)
          );
          
          // Build status map for each round
          const registrationStatusMap = new Map<string, string>();
          regs
            .filter((r: Registration) => r.sessionId === session.id)
            .forEach((r: Registration) => {
              registrationStatusMap.set(r.roundId, r.status);
            });
          
          allSessions.push({
            session,
            registeredRoundIds,
            registrationStatusMap
          });
        }
      }
      
      setSessions(allSessions);
      
      // Cache the entire dashboard data for instant display on next load
      // Convert Sets and Maps to arrays for JSON serialization
      const serializableSessions = allSessions.map(s => ({
        session: s.session,
        registeredRoundIds: Array.from(s.registeredRoundIds),
        registrationStatusMap: s.registrationStatusMap ? Array.from(s.registrationStatusMap.entries()) : []
      }));
      
      localStorage.setItem(`participant_dashboard_${token}`, JSON.stringify({
        sessions: serializableSessions,
        registrations: regs,
        email: data.email,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        participantId: data.participantId || ''
      }));
      
      // Clear error state on successful fetch
      if (error) {
        setError(null);
      }
      
    } catch (error) {
      debugLog('[ParticipantDashboard] Error fetching data:', error);
      
      // If this is a background refetch (we already have data), don't show error screen
      // Just log and keep the existing data
      if (isBackgroundRefetch) {
        debugLog('⚠️ Background refetch failed, keeping existing data');
      } else {
        // This is the initial load - show error screen
        toast.error('Failed to load data');
        setError('Failed to load data');
      }
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  const confirmUnregister = async () => {
    if (!pendingUnregister) return;
    
    const { round, session } = pendingUnregister;
    
    // Optimistic update - remove round from UI immediately
    setRegistrations(prev => prev.filter(reg => reg.roundId !== round.id));
    
    // Also update sessions to remove the round from registeredRoundIds
    setSessions(prev => prev.map(sessionWithRounds => {
      const updatedRegisteredRoundIds = new Set(sessionWithRounds.registeredRoundIds);
      updatedRegisteredRoundIds.delete(round.id);
      
      return {
        ...sessionWithRounds,
        registeredRoundIds: updatedRegisteredRoundIds
      };
    }));
    
    setShowUnregisterDialog(false);
    setPendingUnregister(null);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/p/${token}/unregister/${round.id}?sessionId=${session.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        toast.success(`Unregistered from ${round.name}`);
        // No need to fetchData() since we already updated the UI optimistically
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to unregister');
        // Revert optimistic update on error
        fetchData();
      }
    } catch (error) {
      debugLog('Error unregistering:', error);
      toast.error('Failed to unregister');
      // Revert optimistic update on error
      fetchData();
    }
  };

  const handleConfirmAttendance = async (roundId: string) => {
    try {
      debugLog('=== CONFIRM START ===');
      debugLog('Round ID:', roundId);
      debugLog('1. Current status:', registrations.find(r => r.roundId === roundId)?.status);
      
      if (!token) {
        toast.error('Not authenticated');
        return;
      }
      
      // Find the registration to get sessionId
      const registration = registrations.find(r => r.roundId === roundId);
      if (!registration) {
        toast.error('Registration not found');
        return;
      }
      
      const sessionId = registration.sessionId;
      debugLog('Session ID:', sessionId);
      
      // Check if already confirmed in localStorage (prevents double-confirm)
      const confirmKey = `confirmed_${token}_${roundId}`;
      const alreadyConfirmed = localStorage.getItem(confirmKey);
      
      if (alreadyConfirmed === 'true') {
        debugLog('⚠️ Already confirmed in localStorage, skipping');
        toast.info('You already confirmed attendance for this round');
        return;
      }
      
      // Mark as confirmed in localStorage BEFORE making the request
      localStorage.setItem(confirmKey, 'true');
      
      // Mark timestamp of optimistic update
      lastOptimisticUpdateRef.current = Date.now();
      
      // OPTIMISTIC UPDATE: Immediately update registrations to show 'confirmed' status
      setRegistrations(prev => {
        const updated = prev.map(reg => 
          reg.roundId === roundId 
            ? { ...reg, status: 'confirmed' }
            : reg
        );
        debugLog('2. After optimistic update:', updated.find(r => r.roundId === roundId)?.status);
        return updated;
      });
      
      // Also update sessions registration status map for immediate UI feedback
      setSessions(prev => {
        const updated = prev.map(sessionWithRounds => {
          const hasRound = Array.from(sessionWithRounds.registeredRoundIds || []).includes(roundId);
          
          if (hasRound) {
            const newStatusMap = new Map(sessionWithRounds.registrationStatusMap || new Map());
            newStatusMap.set(roundId, 'confirmed');
            return {
              ...sessionWithRounds,
              registrationStatusMap: newStatusMap
            };
          }
          return sessionWithRounds;
        });
        return updated;
      });
      
      debugLog('🚀 SENDING CONFIRM REQUEST');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/p/${token}/confirm/${roundId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        }
      );
      
      debugLog('📡 RECEIVED RESPONSE:', response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: 'Server returned ' + response.status };
        }
        errorLog('❌ CONFIRM FAILED:', errorData);
        
        // Remove localStorage flag on error so user can try again
        localStorage.removeItem(confirmKey);
        
        // Revert optimistic update on error
        await fetchData();
        
        // Show detailed error message
        const errorMessage = errorData.message || errorData.error || response.statusText;
        const statusInfo = errorData.currentStatus ? ` (Current status: ${errorData.currentStatus})` : '';
        toast.error(`Failed to confirm: ${errorMessage}${statusInfo}`);
        return;
      }
      
      const data = await response.json();
      debugLog('✅ CONFIRM SUCCESS - Backend response:', data);
      debugLog('3. Backend says status:', data.status);
      
      // Update status based on what backend returned
      const backendStatus = data.status;
      
      // If backend returned matched/completed (race condition - matching already happened),
      // update the registration status immediately
      setRegistrations(prev => {
        const updated = prev.map(reg => 
          reg.roundId === roundId 
            ? { ...reg, status: backendStatus }
            : reg
        );
        debugLog('💾 Updated status from backend response:', backendStatus);
        return updated;
      });
      
      toast.success('Attendance confirmed! You will be matched at the start time.');
      
      // Also refetch to get any other changes (like matchId, etc.)
      debugLog('🔄 Fetching full dashboard data...');
      await fetchData();
      
      debugLog('=== CONFIRM END ===');
      
    } catch (error) {
      errorLog('❌ EXCEPTION:', error);
      
      // Remove localStorage flag so user can try again
      const confirmKey = `confirmed_${token}_${roundId}`;
      localStorage.removeItem(confirmKey);
      
      toast.error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Revert optimistic update on error
      await fetchData();
    }
  };

  const handleRoundToggle = async (session: NetworkingSession, round: Round, isCurrentlyRegistered: boolean, currentStatus?: string) => {
    try {
      if (isCurrentlyRegistered) {
        // Show confirmation dialog before unregistering
        setPendingUnregister({ session, round, status: currentStatus });
        setShowUnregisterDialog(true);
        return;
      } else {
        // Register
        const roundSelectionData = roundSelections.get(round.id) || {};
        
        debugLog('');
        debugLog('🎯 ========================================');
        debugLog('🎯 FRONTEND: Attempting to register for round');
        debugLog('🎯 ========================================');
        debugLog('  Session ID:', session.id);
        debugLog('  Session Name:', session.name);
        debugLog('  Round ID:', round.id);
        debugLog('  Round Name:', round.name);
        debugLog('  Token:', token);
        debugLog('  Team:', roundSelectionData.team);
        debugLog('  Topic:', roundSelectionData.topic);
        debugLog('  Topics:', roundSelectionData.topics);
        debugLog('========================================');
        debugLog('');
        
        // Check required fields
        if (session.enableTeams && session.teams && session.teams.length > 0 && !roundSelectionData.team) {
          toast.error('Please select a group first');
          return;
        }
        
        if (session.enableTopics && session.topics && session.topics.length > 0) {
          if (session.allowMultipleTopics) {
            if (!roundSelectionData.topics || roundSelectionData.topics.length === 0) {
              toast.error('Please select at least one topic first');
              return;
            }
          } else {
            if (!roundSelectionData.topic) {
              toast.error('Please select a topic first');
              return;
            }
          }
        }
        
        debugLog('✅ All validations passed, sending request...');
        
        const requestBody = {
          sessionId: session.id,
          roundId: round.id,
          team: roundSelectionData.team,
          topic: roundSelectionData.topic,
          topics: roundSelectionData.topics,
        };
        
        debugLog('📤 Request body:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/p/${token}/register`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        );
        
        debugLog('📥 Response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          debugLog('✅ Registration successful:', result);
          toast.success(`Registered for ${round.name}`);
          fetchData(); // Refresh data
        } else {
          const error = await response.json();
          errorLog('❌ Registration failed:', error);
          debugLog('  Status:', response.status);
          debugLog('  Error:', error.error);
          debugLog('  Details:', error.details);
          toast.error(error.error || 'Failed to register');
        }
      }
    } catch (error) {
      debugLog('Error toggling registration:', error);
      toast.error('Failed to update registration');
    }
  };

  const handleTeamSelect = (roundId: string, team: string) => {
    setRoundSelections(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(roundId) || {};
      newMap.set(roundId, { ...current, team });
      return newMap;
    });
  };

  const handleTopicSelect = (roundId: string, topic: string) => {
    setRoundSelections(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(roundId) || {};
      newMap.set(roundId, { ...current, topic });
      return newMap;
    });
  };

  const handleMultipleTopicsSelect = (roundId: string, topic: string) => {
    setRoundSelections(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(roundId) || {};
      const currentTopics = current.topics || [];
      
      let updatedTopics;
      if (currentTopics.includes(topic)) {
        updatedTopics = currentTopics.filter(t => t !== topic);
      } else {
        updatedTopics = [...currentTopics, topic];
      }
      
      newMap.set(roundId, { ...current, topics: updatedTopics });
      return newMap;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show error state if there was an error loading data
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-destructive mb-4">
                <X className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="mb-2">Failed to load dashboard</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter sessions based on registered rounds
  debugLog('[Section filtering] Processing sessions:', sessions.length);
  debugLog('[Section filtering] All sessions:', sessions.map(s => ({
    name: s.session.name,
    id: s.session.id,
    status: s.session.status,
    date: s.session.date,
    roundCount: s.session.rounds?.length || 0,
    registeredRoundIds: Array.from(s.registeredRoundIds)
  })));
  
  const upcomingSessions = sessions.filter(({ session, registeredRoundIds, registrationStatusMap }) => {
    if (!session.rounds || session.rounds.length === 0) {
      debugLog(`[Section filtering] \"${session.name}\" - No rounds found`);
      return false;
    }
    
    // Check if any registered round is upcoming (not completed)
    const hasUpcomingRound = session.rounds.some(round => {
      const roundStatus = registrationStatusMap?.get(round.id);
      return registeredRoundIds.has(round.id) && !isRoundCompleted(session, round, roundStatus);
    });
    
    if (hasUpcomingRound) {
      debugLog(`[Section filtering] \"${session.name}\" → Upcoming section`);
    }
    
    return hasUpcomingRound;
  }).sort((a, b) => {
    // Sort by earliest upcoming round
    const getEarliestRoundTime = (sessionWithRounds: SessionWithRounds): number => {
      const { session, registeredRoundIds, registrationStatusMap } = sessionWithRounds;
      if (!session.date || !session.rounds) return Infinity;
      
      let earliestTime = Infinity;
      
      for (const round of session.rounds) {
        // Skip non-registered rounds
        if (!registeredRoundIds.has(round.id)) continue;
        
        // Skip completed rounds (including unconfirmed)
        const roundStatus = registrationStatusMap?.get(round.id);
        if (isRoundCompleted(session, round, roundStatus)) continue;
        
        // Skip rounds without time
        if (!round.startTime || round.startTime === 'To be set' || round.startTime === 'TBD') continue;
        
        try {
          const [hours, minutes] = round.startTime.split(':').map(Number);
          const roundStart = new Date(round.date || session.date); // Use round.date, fallback to session.date for backwards compatibility
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

  const pastSessions = sessions.filter(({ session, registeredRoundIds, registrationStatusMap }) => {
    if (!session.rounds || session.rounds.length === 0) return false;
    
    // Check if any registered round is completed
    const hasCompletedRound = session.rounds.some(round => 
      registeredRoundIds.has(round.id) && isRoundCompleted(session, round)
    );
    
    if (hasCompletedRound) {
      debugLog(`[Section filtering] "${session.name}" → Completed section`);
    }
    
    return hasCompletedRound;
  });
  
  debugLog(`[Section filtering] Results: ${upcomingSessions.length} upcoming, ${pastSessions.length} completed`);

  // Get primary organizer (first upcoming or first past registration)
  const primaryRegistration = registrations.find(r => {
    const session = sessions.find(s => s.session.id === r.sessionId);
    if (!session) return false;
    const round = session.session.rounds?.find(rd => rd.id === r.roundId);
    if (!round) return false;
    return !isRoundCompleted(session.session, round);
  }) || registrations[0];

  return (
    <ParticipantLayout
      firstName={firstName}
      lastName={lastName}
    >
      <div className="space-y-8">
        {/* Upcoming section */}
        <div>
          <h2 className="mb-4">Upcoming rounds</h2>
          <div className="space-y-4">
            {(() => {
              debugLog('[RENDER_UPCOMING] upcomingSessions.length:', upcomingSessions.length);
              debugLog('[RENDER_UPCOMING] sessions.length:', sessions.length);
              debugLog('[RENDER_UPCOMING] registrations.length:', registrations.length);
              
              if (upcomingSessions.length === 0) {
                debugLog('[RENDER_UPCOMING] ❌ NO UPCOMING SESSIONS');
                debugLog('[RENDER_UPCOMING] All sessions:', sessions.map(s => ({
                  id: s.session.id,
                  name: s.session.name,
                  registeredRounds: Array.from(s.registeredRoundIds)
                })));
              }
              
              return upcomingSessions.map(({ session, registeredRoundIds, registrationStatusMap }) => {
                // Get organizer info from first registration
                const organizerReg = registrations.find(r => r.sessionId === session.id);
                
                return (
                  <Card key={session.id} className="transition-all hover:border-muted-foreground/20 max-w-md">
                    <CardContent className="pt-[16px] pr-[16px] pb-[45px] pl-[16px]">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="mb-2">
                            {organizerReg?.organizerName || 'Unknown organizer'}
                          </h3>
                          <Badge variant="outline" className="mb-2">{session.name}</Badge>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {session.date ? new Date(session.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short', 
                              day: 'numeric'
                            }) : 'Date to be set'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {session.roundDuration} min rounds
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <Users className="h-4 w-4" />
                      {session.limitParticipants ? `Max ${session.maxParticipants}` : '∞'} participants • Groups of {session.groupSize}
                    </div>

                    {/* Rounds Selection - Only show registered upcoming rounds */}
                    {session.rounds && session.rounds.length > 0 && (() => {
                      debugLog(`[UPCOMING ROUNDS FILTERING] Session: \"${session.name}\"`);
                      debugLog(`  - All round IDs in session:`, session.rounds.map((r: any) => r.id));
                      debugLog(`  - Registered round IDs:`, Array.from(registeredRoundIds));
                      
                      const registeredRounds = session.rounds
                        .filter(round => {
                          const isCompleted = isRoundCompleted(session, round);
                          const isRegistered = registeredRoundIds.has(round.id);
                          debugLog(`  - Round \"${round.name}\" (${round.id}): completed=${isCompleted}, registered=${isRegistered}, willShow=${!isCompleted && isRegistered}`);
                          return !isCompleted && isRegistered;
                        });
                      
                      debugLog(`  → Showing ${registeredRounds.length} upcoming rounds for session \"${session.name}\"`);
                      
                      if (registeredRounds.length === 0) return null;
                      
                      // Get organizer info from first registration
                      const organizerReg = registrations.find(r => r.sessionId === session.id);
                      
                      return (
                        <div className="mt-3">
                          <div className="space-y-2">
                            {registeredRounds.map((round) => {
                              const roundSelectionData = roundSelections.get(round.id) || {};
                              const roundKey = `${session.id}:${round.id}`; // Define roundKey for isNextUpcoming comparison
                              const currentStatus = registrationStatusMap?.get(round.id);
                              
                              // Get registration to extract match details
                              const roundRegistration = registrations.find(r => r.roundId === round.id && r.sessionId === session.id);
                              
                              // Allow unregister button for all statuses EXCEPT when matching/matched or already met
                              // This allows participants to unregister even after confirming attendance (before matching starts)
                              const shouldShowUnregisterButton = !['unconfirmed', 'waiting-for-match', 'matched', 'walking-to-meeting-point', 'waiting-for-meet-confirmation', 'met'].includes(currentStatus || '');
                              debugLog(`🔍 [UNREGISTER BUTTON] Round \"${round.name}\": status=\"${currentStatus}\", showButton=${shouldShowUnregisterButton}`);
                              
                              return (
                                <RoundItem
                                  key={round.id}
                                  round={round}
                                  session={session}
                                  isRegistered={true}
                                  participantStatus={currentStatus}
                                  participantId={participantId}
                                  showUnregisterButton={shouldShowUnregisterButton}
                                  onUnregister={() => handleRoundToggle(session, round, true, currentStatus)}
                                  generateRoundTimeDisplay={generateRoundTimeDisplay}
                                  selectedTeam={roundSelectionData.team}
                                  selectedTopic={roundSelectionData.topic}
                                  selectedTopics={roundSelectionData.topics}
                                  isNextUpcoming={roundKey === globalNextUpcomingRoundId}
                                  onConfirmAttendance={handleConfirmAttendance}
                                  lastConfirmTimestamp={lastOptimisticUpdateRef.current}
                                  onConfirmationWindowExpired={() => {
                                    // Skip refetch if there was a recent optimistic update (within last 15 seconds)
                                    const timeSinceLastUpdate = Date.now() - lastOptimisticUpdateRef.current;
                                    if (timeSinceLastUpdate < 15000) {
                                      debugLog(`⏰ Confirmation window expired BUT skipping refetch - recent optimistic update (${timeSinceLastUpdate}ms ago)`);
                                      return;
                                    }
                                    
                                    debugLog('⏰ Confirmation window expired, refetching data...');
                                    fetchData();
                                  }}
                                  matchDetails={roundRegistration?.matchId ? {
                                    matchId: roundRegistration.matchId,
                                    matchPartnerNames: roundRegistration.matchPartnerNames || [],
                                    meetingPointId: roundRegistration.meetingPointId,
                                    identificationImageUrl: roundRegistration.identificationImageUrl
                                  } : undefined}
                                />
                              );
                            })}
                          </div>
                          
                          {/* Show all rounds button */}
                          {organizerReg && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3 w-full"
                              onClick={() => navigate(`/${organizerReg.organizerUrlSlug}`)}
                            >
                              + Add more rounds
                            </Button>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
                );
              });
            })()}
            
            {upcomingSessions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                {registrations.length === 0 ? (
                  <>
                    <p className="mb-2">You don't have any registrations yet.</p>
                    <p className="text-sm">Register for rounds via an event page to see them here.</p>
                  </>
                ) : (
                  <p>No upcoming rounds</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Completed section */}
        <div>
          <h2 className="mb-4">Completed rounds</h2>
          <div className="space-y-4">
            {[...pastSessions].reverse().map(({ session, registeredRoundIds, registrationStatusMap }) => {
              // Get organizer info from first registration
              const organizerReg = registrations.find(r => r.sessionId === session.id);
              
              return (
                <Card key={session.id} className="transition-all hover:border-muted-foreground/20 opacity-60 max-w-md">
                  <CardContent className="pt-[16px] pr-[16px] pb-[45px] pl-[16px]">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="mb-2">
                          {organizerReg?.organizerName || 'Unknown organizer'}
                        </h3>
                        <Badge variant="outline" className="mb-2">{session.name}</Badge>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {session.date ? new Date(session.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric'
                          }) : 'Date to be set'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {session.roundDuration} min rounds
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <Users className="h-4 w-4" />
                    {session.limitParticipants ? `Max ${session.maxParticipants}` : '∞'} participants • Groups of {session.groupSize}
                  </div>

                  {/* Rounds - Only show registered completed rounds */}
                  {session.rounds && session.rounds.length > 0 && (() => {
                    const registeredRounds = session.rounds
                      .filter(round => {
                        const roundStatus = registrationStatusMap?.get(round.id);
                        return isRoundCompleted(session, round, roundStatus) && registeredRoundIds.has(round.id);
                      });
                    
                    if (registeredRounds.length === 0) return null;
                    
                    // Get organizer info from first registration
                    const organizerReg = registrations.find(r => r.sessionId === session.id);
                    
                    return (
                      <div className="mt-3">
                        <div className="space-y-2">
                          {[...registeredRounds].reverse().map((round) => {
                            const status = registrationStatusMap?.get(round.id);
                            
                            return (
                              <div
                                key={round.id}
                                className="border rounded border-muted p-2"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{round.name}</span>
                                  {status && (
                                    <ParticipantStatusBadge status={status} />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Show all rounds button */}
                        {organizerReg && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full"
                            onClick={() => navigate(`/${organizerReg.organizerUrlSlug}`)}
                          >
                            + Add more rounds
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
              );
            })}
            
            {pastSessions.length === 0 && (
              <Card className="transition-all max-w-md">
                <CardContent className="pt-[16px] pr-[16px] pb-[45px] pl-[16px]">
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No completed rounds</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Meeting Points Dialog */}
      <MeetingPointsDialog
        open={showMeetingPoints}
        onOpenChange={setShowMeetingPoints}
        meetingPoints={selectedSessionForDialog?.meetingPoints}
      />

      {/* Round Rules Dialog */}
      <RoundRulesDialog
        open={showRoundRules}
        onOpenChange={setShowRoundRules}
        rules={roundRules}
      />

      {/* Unregister Confirmation Dialog */}
      <AlertDialog open={showUnregisterDialog} onOpenChange={setShowUnregisterDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingUnregister?.status === 'verification_pending' ? 'Reject verification' : 'Confirm unregistration'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingUnregister?.status === 'verification_pending' ? (
                <>
                  Are you sure you want to reject verification for{' '}
                  <span className="font-medium">{pendingUnregister?.round.name}</span>?
                  {pendingUnregister?.session.name && (
                    <>
                      {' '}in <span className="font-medium">{pendingUnregister.session.name}</span>
                    </>
                  )}
                  {pendingUnregister?.session.date && (
                    <>
                      {' '}on{' '}
                      <span className="font-medium">
                        {new Date(pendingUnregister.session.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <>
                  Are you sure you want to unregister from{' '}
                  <span className="font-medium">{pendingUnregister?.round.name}</span>?
                  {pendingUnregister?.session.name && (
                    <>
                      {' '}in <span className="font-medium">{pendingUnregister.session.name}</span>
                    </>
                  )}
                  {pendingUnregister?.session.date && (
                    <>
                      {' '}on{' '}
                      <span className="font-medium">
                        {new Date(pendingUnregister.session.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </>
                  )}
                </>
              )}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowUnregisterDialog(false);
              setPendingUnregister(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnregister}>
              {pendingUnregister?.status === 'verification_pending' ? 'Reject verification' : 'Unregister'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Debug Panel - shown when ?debug=true is in URL */}
      {showDebug && (
        <div className="fixed bottom-0 right-0 w-1/3 h-1/2 bg-black text-green-400 font-mono text-xs overflow-auto p-4 border-l border-t border-green-400 z-50">
          <div className="flex justify-between items-center mb-2 sticky top-0 bg-black pb-2">
            <div className="font-bold">🐛 DEBUG LOGS</div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDebugLogs([])}
              className="h-6 px-2 text-green-400 hover:text-green-300"
            >
              Clear
            </Button>
          </div>
          <div className="space-y-1">
            {debugLogs.map((log, i) => (
              <div key={i} className={log.includes('[ERROR]') ? 'text-red-400' : ''}>
                {log}
              </div>
            ))}
            {debugLogs.length === 0 && (
              <div className="text-muted-foreground">No logs yet. Perform actions to see debug output.</div>
            )}
          </div>
        </div>
      )}
    </ParticipantLayout>
  );
}