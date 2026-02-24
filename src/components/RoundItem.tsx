import { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, XCircle, Users, MapPin } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { NetworkingSession, Round } from '../App';
import { useTime } from '../contexts/TimeContext';
import { getParticipantStatusBadge } from '../utils/statusBadge';
import { getParametersOrDefault } from '../utils/systemParameters';
import { useParams, useNavigate } from 'react-router';
import { debugLog, errorLog } from '../utils/debug';

interface RoundItemProps {
  round: Round;
  session?: NetworkingSession;
  isSelected?: boolean;
  isRegistered?: boolean; // If participant is already registered for this round
  isRegisterable?: boolean; // If round is still open for registration (more than safetyWindowMinutes before start)
  participantStatus?: string; // Participant status: 'verification_pending' | 'registered' | 'confirmed' | etc.
  participantId?: string; // Participant ID (required for match data and confirmation)
  onSelect?: (roundId: string) => void;
  showTimeDisplay?: boolean;
  showUnregisterButton?: boolean; // Show unregister button
  onUnregister?: (roundId: string) => void; // Callback to unregister from round
  onConfirmAttendance?: (roundId: string) => void; // Callback to confirm attendance
  onConfirmationWindowExpired?: () => void; // Callback when confirmation window expires
  showRegistrationClosesCountdown?: boolean; // Show countdown until registration closes
  generateRoundTimeDisplay?: (startTime: string, duration: number) => string; // Custom time display function
  selectedTeam?: string; // Selected team for this round
  selectedTopic?: string; // Selected topic for this round (single selection)
  selectedTopics?: string[]; // Selected topics for this round (multiple selection)
  onTeamSelect?: (roundId: string, team: string) => void; // Callback when team is selected
  onTopicSelect?: (roundId: string, topic: string) => void; // Callback when topic is selected (single)
  onMultipleTopicsSelect?: (roundId: string, topic: string) => void; // Callback when topic is selected (multiple)
  className?: string; // Additional CSS classes
  lastConfirmTimestamp?: number; // Timestamp of last confirm action (to prevent button re-appearing during optimistic update)
  matchDetails?: { // Match details from registration (preferred over API fetch)
    matchId: string;
    matchPartnerNames: string[];
    meetingPointId?: string;
    identificationImageUrl?: string;
  };
  registeredCount?: number; // Number of registered participants for this round
}

export function RoundItem({ 
  round, 
  session,
  isSelected = false,
  isRegistered = false,
  isRegisterable = true,
  participantStatus,
  participantId,
  onSelect, 
  showTimeDisplay = true,
  showUnregisterButton = false,
  onUnregister,
  onConfirmAttendance,
  onConfirmationWindowExpired,
  showRegistrationClosesCountdown = false,
  generateRoundTimeDisplay,
  selectedTeam,
  selectedTopic,
  selectedTopics,
  onTeamSelect,
  onTopicSelect,
  onMultipleTopicsSelect,
  className = '',
  lastConfirmTimestamp,
  matchDetails,
  registeredCount,
}: RoundItemProps) {
  
  // DEBUG: Log every render with all props
  debugLog(`[RENDER_ROUND] "${round.name}"`, {
    participantStatus,
    isRegistered,
    roundId: round.id,
  });
  
  // Get token from URL for navigation
  const { token } = useParams<{ token?: string }>();
  const navigate = useNavigate();
  
  // Countdown timer for registered participants
  const [countdown, setCountdown] = useState<string>('');
  const [countdownPhase, setCountdownPhase] = useState<'before-confirmation' | 'confirmation-window' | 'waiting-for-match' | 'walking-to-meeting' | 'networking' | 'completed'>('before-confirmation');
  const [matchData, setMatchData] = useState<any>(null);
  const [showConfirmButton, setShowConfirmButton] = useState<boolean>(false);
  const [confirmCountdown, setConfirmCountdown] = useState<number>(0);
  const [matchingDots, setMatchingDots] = useState<number>(0);
  const [registrationClosesCountdown, setRegistrationClosesCountdown] = useState<string>('');
  
  // Local state to immediately hide confirm button when clicked (prevents flickering)
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  
  const { getCurrentTime } = useTime();
  
  // Reset isConfirming when participantStatus changes to 'confirmed' or certain other final states
  // But NEVER reset during 'registered' status (participant might have confirmed but backend hasn't synced yet)
  useEffect(() => {
    if (isConfirming) {
      // Only reset isConfirming if status is confirmed OR if status is unconfirmed (confirmation window passed)
      if (participantStatus === 'confirmed') {
        setIsConfirming(false);
        debugLog(`✅ [RoundItem] Reset isConfirming for round "${round.name}" (status now confirmed)`);
      } else if (participantStatus === 'unconfirmed') {
        setIsConfirming(false);
        debugLog(`⚠️ [RoundItem] Reset isConfirming for round "${round.name}" (confirmation window passed, now unconfirmed)`);
      }
      // If status is still 'registered', KEEP isConfirming=true (optimistic update in progress)
    }
  }, [participantStatus, isConfirming, round.name]);
  
  // Auto-redirect to match page when participant has 'no-match' status
  useEffect(() => {
    if (participantStatus === 'no-match' && token && isRegistered) {
      debugLog(`🔀 [RoundItem] Participant has 'no-match' status, redirecting to match page...`);
      navigate(`/p/${token}/match`);
    }
  }, [participantStatus, token, isRegistered, navigate]);
  
  // Use matchDetails prop if available, otherwise fetch from API
  useEffect(() => {
    // If matchDetails prop is provided, use it directly
    if (matchDetails && participantStatus === 'matched') {
      debugLog(`✅ [RoundItem] Using provided matchDetails for round ${round.id}:`, matchDetails);
      setMatchData({
        success: true,
        match: {
          id: matchDetails.matchId,
          participants: matchDetails.matchPartnerNames.map((name: string) => ({
            firstName: name.split(' ')[0],
            lastName: name.split(' ').slice(1).join(' ')
          })),
          meetingPoint: matchDetails.meetingPointId,
          identificationImageUrl: matchDetails.identificationImageUrl,
          matchRevealedAt: new Date().toISOString() // Assume match is revealed
        }
      });
      return;
    }
    
    // Otherwise, fetch from API
    if (!isRegistered || !participantId || !session?.date || !round.startTime) return;
    if (participantStatus !== 'confirmed' && participantStatus !== 'waiting-for-match' && participantStatus !== 'matched' && participantStatus !== 'walking-to-meeting-point' && participantStatus !== 'waiting-for-meet-confirmation' && participantStatus !== 'met') return;

    const fetchMatchData = async () => {
      try {
        const { apiBaseUrl, publicAnonKey } = await import('../utils/supabase/info');
        debugLog(`🔍 [RoundItem] Fetching match data for participant ${participantId} in round ${round.id}`);
        
        const response = await fetch(
          `${apiBaseUrl}/rounds/${round.id}/participant/${participantId}/match?sessionId=${session?.id}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          debugLog(`✅ [RoundItem] Match data received:`, data);
          setMatchData(data);
        } else {
          const errorText = await response.text();
          debugLog(`⚠️ [RoundItem] No match data yet (${response.status}):`, errorText);
        }
      } catch (error) {
        errorLog('❌ [RoundItem] Error fetching match data:', error);
      }
    };

    fetchMatchData();
    // Poll every 5 seconds for updates
    const interval = setInterval(fetchMatchData, 5000);
    return () => clearInterval(interval);
  }, [isRegistered, participantId, participantStatus, round.id, session?.id, session?.date, round.startTime, matchDetails]);

  useEffect(() => {
    // DEBUG: Check what we receive
    debugLog(`🔍 [RoundItem Countdown PRE-CHECK] Round "${round.name}":`, {
      isRegistered,
      hasSession: !!session,
      sessionDate: session?.date,
      roundStartTime: round.startTime,
      participantStatus
    });
    
    // Don't show countdown if not registered, or if participant is unconfirmed
    if (!isRegistered || !session?.date || !round.startTime || round.startTime === 'To be set' || round.startTime === 'TBD') {
      return;
    }
    
    // DEBUG: Log participant status
    debugLog(`🔍 [RoundItem Countdown] Round "${round.name}" - participantStatus:`, participantStatus);
    
    // IMPORTANT: Unconfirmed participants cannot participate in matching
    // They should NOT see countdown or matching status
    if (participantStatus === 'unconfirmed') {
      debugLog(`⛔ [RoundItem] Blocking countdown for UNCONFIRMED participant in round "${round.name}"`);
      setCountdown('');
      setCountdownPhase('before-confirmation');
      setShowConfirmButton(false);
      return;
    }

    const updateCountdown = () => {
      const now = getCurrentTime();
      const [hours, minutes] = round.startTime.split(':').map(Number);
      const roundStart = new Date(round.date || session.date); // Use round.date, fallback to session.date for backwards compatibility
      roundStart.setHours(hours, minutes, 0, 0);
      
      // Get system parameters to use correct timing
      const params = getParametersOrDefault();
      
      // Time points
      const confirmationStart = new Date(roundStart.getTime() - params.confirmationWindowMinutes * 60 * 1000); // T-confirmationWindowMinutes
      const matchingTime = roundStart; // T-0
      
      // DEBUG: Log countdown state every 10 seconds to avoid spam
      const shouldLog = Math.floor(Date.now() / 10000) % 6 === 0; // Log every minute
      if (shouldLog) {
        debugLog(`[COUNTDOWN] "${round.name}"`, {
          participantStatus,
          isConfirming,
          inConfirmationWindow: now >= confirmationStart && now < matchingTime
        });
      }
      
      // Calculate based on phase
      if (now < confirmationStart) {
        // Phase 1: Before confirmation window
        setCountdownPhase('before-confirmation');
        const diff = confirmationStart.getTime() - now.getTime();
        
        // Calculate time components
        const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);
        
        // Show days if more than 1 day
        if (daysLeft >= 1) {
          setCountdown(`Confirm in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`);
        } else {
          setCountdown(`Confirm in ${String(hoursLeft).padStart(2, '0')}:${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`);
        }
        setShowConfirmButton(false);
      } else if (now >= confirmationStart && now < matchingTime) {
        // Phase 2: Confirmation window (T-5 to T-0)
        setCountdownPhase('confirmation-window');
        const secondsLeft = Math.floor((matchingTime.getTime() - now.getTime()) / 1000);
        setConfirmCountdown(secondsLeft);
        
        // Show confirm button ONLY if status is 'registered' (not confirmed yet) AND not currently confirming
        // Status 'confirmed' means they already confirmed - don't show button
        const shouldShowButton = participantStatus === 'registered' && !isConfirming;
        
        debugLog(`[CONFIRM_BUTTON] Round "${round.name}": participantStatus="${participantStatus}", isConfirming=${isConfirming}, shouldShowButton=${shouldShowButton}`);
        
        setShowConfirmButton(shouldShowButton);
        setCountdown('');
        
        // Trigger callback when confirmation window expires
        if (secondsLeft <= 0 && onConfirmationWindowExpired) {
          onConfirmationWindowExpired();
        }
      } else {
        // Phase 3+: After T-0, check match data
        // IMPORTANT: Only confirmed participants can proceed to matching
        // If participant is still "registered" after T-0, they should become "unconfirmed"
        if (participantStatus === 'registered') {
          // Participant didn't confirm in time - should be unconfirmed
          // Don't show matching status, wait for backend to update status
          debugLog(`⚠️ [RoundItem] Participant still "registered" after T-0, waiting for backend to update to "unconfirmed"...`);
          setCountdownPhase('before-confirmation');
          setCountdown('');
          setShowConfirmButton(false);
          
          // Trigger refetch if callback exists
          if (onConfirmationWindowExpired) {
            onConfirmationWindowExpired();
          }
          return;
        }
        
        if (matchData?.match) {
          const match = matchData.match;
          
          if (match.meetConfirmedAt && match.networkingEndAt) {
            // Phase 5: Networking phase
            setCountdownPhase('networking');
            const networkingEnd = new Date(match.networkingEndAt);
            const diff = networkingEnd.getTime() - now.getTime();
            
            if (diff > 0) {
              const minutesLeft = Math.floor(diff / (1000 * 60));
              const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);
              setCountdown(`Networking ends in ${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`);
            } else {
              setCountdownPhase('completed');
              setCountdown('Completed');
            }
          } else if (match.matchRevealedAt) {
            // Phase 4: Walking to meeting point (walkingTimeMinutes after match revealed)
            setCountdownPhase('walking-to-meeting');
            const matchRevealed = new Date(match.matchRevealedAt);
            const walkingDeadline = new Date(matchRevealed.getTime() + params.walkingTimeMinutes * 60 * 1000);
            const diff = walkingDeadline.getTime() - now.getTime();
            
            if (diff > 0) {
              const minutesLeft = Math.floor(diff / (1000 * 60));
              const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);
              setCountdown(`Walk to meeting point (${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')} left)`);
            } else {
              setCountdown('Confirm you met');
            }
          } else {
            // Match exists but no matchRevealedAt yet
            setCountdownPhase('waiting-for-match');
            setCountdown('');
          }
        } else {
          // Phase 3: Waiting for match (matching in progress)
          setCountdownPhase('waiting-for-match');
          setCountdown('');
        }
        
        setShowConfirmButton(false);
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [isRegistered, session?.date, round.startTime, round.duration, getCurrentTime, participantStatus, matchData, onConfirmationWindowExpired, lastConfirmTimestamp]);

  // Animate matching dots
  useEffect(() => {
    if (countdownPhase === 'waiting-for-match') {
      const interval = setInterval(() => {
        setMatchingDots((prev) => (prev + 1) % 4);
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [countdownPhase]);
  
  // Auto-trigger matching when entering waiting-for-match phase
  useEffect(() => {
    const organizerId = (session as any)?.organizerId || (session as any)?.userId;
    
    if (countdownPhase === 'waiting-for-match' && !matchData && participantId && session?.id && round.id && organizerId) {
      // Only trigger once per round
      const triggerKey = `matching_triggered_${round.id}`;
      if (sessionStorage.getItem(triggerKey)) {
        debugLog('🔄 Matching already triggered for this round, skipping...');
        return;
      }
      
      debugLog('🚀 Auto-triggering matching at T-0 for round:', round.name);
      
      const triggerMatching = async () => {
        try {
          const { apiBaseUrl, publicAnonKey } = await import('../utils/supabase/info');
          const response = await fetch(
            `${apiBaseUrl}/rounds/${round.id}/auto-match`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sessionId: session.id,
                organizerId: organizerId
              }),
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.alreadyCompleted) {
              debugLog('✅ Matching was already completed at:', data.completedAt);
            } else {
              debugLog('✅ Matching triggered successfully:', data.matchCount, 'groups created');
            }
            // Mark as triggered
            sessionStorage.setItem(triggerKey, 'true');
          } else {
            errorLog('❌ Failed to trigger matching:', await response.text());
          }
        } catch (error) {
          errorLog('❌ Error triggering matching:', error);
        }
      };
      
      triggerMatching();
    }
  }, [countdownPhase, matchData, participantId, session?.id, round.id, round.name, session]);
  
  // REMOVED: Auto-enter confirmation window endpoint call
  // This is no longer needed because 'waiting-for-attendance-confirmation' is now a VIRTUAL status
  // calculated dynamically by the participant-dashboard endpoint based on time.
  // No need to persist this status - it's purely for display purposes.
  
  // Registration closes countdown for event page
  useEffect(() => {
    if (!showRegistrationClosesCountdown || !session?.date || !round.startTime || round.startTime === 'To be set' || round.startTime === 'TBD') {
      return;
    }

    const updateRegistrationClosesCountdown = () => {
      const now = getCurrentTime();
      const [hours, minutes] = round.startTime.split(':').map(Number);
      const roundStart = new Date(round.date || session.date); // Use round.date, fallback to session.date for backwards compatibility
      roundStart.setHours(hours, minutes, 0, 0);
      
      // Get system parameters to use correct registration close time
      const params = getParametersOrDefault();
      
      // Registration closes at T-safetyWindowMinutes (confirmation window starts)
      const registrationCloses = new Date(roundStart.getTime() - params.safetyWindowMinutes * 60 * 1000);
      const diff = registrationCloses.getTime() - now.getTime();
      
      if (diff > 0) {
        const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        // Show days if more than 1 day (24 hours)
        if (daysLeft >= 1) {
          setRegistrationClosesCountdown(`Registration closes in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`);
        } else {
          // Less than 24 hours - show hours:minutes:seconds
          const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
          const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);
          setRegistrationClosesCountdown(`Registration closes in ${String(hoursLeft).padStart(2, '0')}:${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`);
        }
      } else {
        setRegistrationClosesCountdown('Closed');
      }
    };
    
    updateRegistrationClosesCountdown();
    const interval = setInterval(updateRegistrationClosesCountdown, 1000); // Update every second for HH:MM:SS display
    
    return () => clearInterval(interval);
  }, [showRegistrationClosesCountdown, session?.date, round.startTime, getCurrentTime]);
  
  // Memoize the status badge to avoid recalculation on every render
  const statusBadge = useMemo(() => getParticipantStatusBadge(participantStatus), [participantStatus]);
  
  const defaultTimeDisplay = (startTime: string, duration: number) => {
    if (!startTime || startTime === 'To be set' || startTime === 'TBD') {
      return `To be set`;
    }
    
    // Format time if it's in HH:MM format
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
    
    const formattedStartTime = formatTime(startTime);
    const endDate = new Date();
    const [hours, minutes] = startTime.split(':');
    endDate.setHours(parseInt(hours), parseInt(minutes));
    endDate.setMinutes(endDate.getMinutes() + duration);
    const formattedEndTime = endDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    return `${formattedStartTime}-${formattedEndTime}`;
  };

  const timeDisplayFunction = generateRoundTimeDisplay || defaultTimeDisplay;

  return (
    <div 
      className={`border rounded transition-all ${
        isRegistered && !showUnregisterButton
          ? 'border-muted bg-muted/20'
          : !isRegisterable && !isRegistered
          ? 'border-muted bg-muted/10 opacity-60'
          : isSelected 
          ? 'border-primary bg-primary/10' 
          : 'border-muted hover:border-muted-foreground/30'
      } ${className}`}
    >
      {/* Main round selection */}
      <div 
        className={`flex items-center justify-between p-2 ${
          isRegistered && !showUnregisterButton 
            ? 'cursor-default' 
            : !isRegisterable && !isRegistered
            ? 'cursor-not-allowed'
            : 'cursor-pointer'
        }`}
        onClick={() => {
          // Don't allow selecting already registered rounds (unless in unregister mode)
          // Also don't allow selecting if registration is closed
          if (!isRegistered && isRegisterable) {
            onSelect?.(round.id);
          }
        }}
      >
        <div className="flex items-center gap-2">
          {isRegistered && !showUnregisterButton ? (
            <CheckCircle2 className="h-4 w-4 text-muted-foreground/40 fill-muted-foreground/10" />
          ) : !showUnregisterButton && !isRegisterable ? (
            <div className="h-4 w-4 rounded-full bg-muted-foreground/20" />
          ) : !showUnregisterButton ? (
            <>
              {isSelected ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <div className="h-4 w-4 border border-muted-foreground/30 rounded-full" />
              )}
            </>
          ) : null}
          <span className={`text-sm font-medium ${
            isSelected && !showUnregisterButton && !isRegistered ? 'text-primary' : ''
          }${isRegistered && !showUnregisterButton ? ' text-muted-foreground/60' : ''}${
            !isRegisterable && !isRegistered ? ' text-muted-foreground/50' : ''
          }`}>
            {round.name}
            {/* Show date if round is on a different day than the session */}
            {round.date && session?.date && round.date !== session.date && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({new Date(round.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
              </span>
            )}
          </span>
          {registeredCount != null && registeredCount > 0 && (() => {
            const params = getParametersOrDefault();
            const fireEmoji = registeredCount >= params.fireThreshold3 ? '🔥🔥🔥'
              : registeredCount >= params.fireThreshold2 ? '🔥🔥'
              : registeredCount >= params.fireThreshold1 ? '🔥'
              : '';
            return (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {fireEmoji && <span>{fireEmoji}</span>}
                <Users className="h-3 w-3" />
                {registeredCount}
              </span>
            );
          })()}
          {!isRegisterable && !isRegistered && (
            <Badge variant="secondary" className="text-xs text-muted-foreground">
              Registration closed
            </Badge>
          )}
          {isRegistered && participantStatus && (
            <Badge 
              variant={statusBadge.variant}
              className={`text-xs ${statusBadge.className}`}
            >
              {statusBadge.label}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showTimeDisplay && (
            <>
              {isRegistered ? (
                <>
                  {/* Show countdown/status based on phase */}
                  {countdownPhase === 'before-confirmation' && countdown && (
                    <div className={`text-xs ${
                      isRegistered && !showUnregisterButton
                        ? 'text-muted-foreground/40'
                        : isSelected 
                        ? 'text-primary/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {countdown}
                    </div>
                  )}
                  
                  {/* Emergency fallback - if countdown phase is before-confirmation but countdown is empty */}
                  {countdownPhase === 'before-confirmation' && !countdown && (
                    <div className="text-xs text-muted-foreground">
                      {round.startTime || 'Pending'}
                    </div>
                  )}
                  
                  {countdownPhase === 'confirmation-window' && (
                    <>
                      {(() => {
                        // Check if there was a recent confirm action (within last 20 seconds)
                        const timeSinceLastConfirm = lastConfirmTimestamp ? Date.now() - lastConfirmTimestamp : Infinity;
                        const hasRecentConfirm = timeSinceLastConfirm < 20000;
                        
                        const shouldShowButton = showConfirmButton && !isConfirming && !hasRecentConfirm && participantStatus !== 'confirmed';
                        debugLog(`[BUTTON_DECISION] "${round.name}"`, {
                          participantStatus,
                          isConfirming,
                          showConfirmButton,
                          hasRecentConfirm,
                          timeSinceLastConfirm: timeSinceLastConfirm === Infinity ? 'never' : `${Math.round(timeSinceLastConfirm/1000)}s ago`,
                          willShow: shouldShowButton ? 'BUTTON' : 'COUNTDOWN'
                        });
                        
                        return participantStatus === 'confirmed' || isConfirming || hasRecentConfirm ? (
                          <div className="text-xs text-muted-foreground">
                            Matching starts in {String(Math.floor(confirmCountdown / 60)).padStart(2, '0')}:{String(confirmCountdown % 60).padStart(2, '0')}
                          </div>
                        ) : showConfirmButton && !isConfirming && (
                          <button
                            className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isConfirming}
                            onClick={(e) => {
                              e.stopPropagation();
                              
                              // Prevent double-click
                              if (isConfirming) {
                                debugLog(`⚠️ [RoundItem] Double-click prevented for round "${round.name}"`);
                                return;
                              }
                              
                              debugLog(`[BUTTON_CLICKED] "${round.name}" - Setting isConfirming=true`);
                              setIsConfirming(true); // Immediately hide button
                              onConfirmAttendance?.(round.id);
                            }}
                          >
                            Confirm attendance ({String(Math.floor(confirmCountdown / 60)).padStart(2, '0')}:{String(confirmCountdown % 60).padStart(2, '0')})
                          </button>
                        );
                      })()}
                    </>
                  )}
                  
                  {/* For other rounds, show nothing in before-confirmation or confirmation-window phase */}
                  
                  {countdownPhase === 'waiting-for-match' && (
                    <div className="text-xs text-muted-foreground">
                      Matching{'.'.repeat(matchingDots)}
                    </div>
                  )}
                  
                  {countdownPhase === 'walking-to-meeting' && countdown && (
                    <div className="text-xs text-blue-600">
                      {countdown}
                    </div>
                  )}
                  
                  {countdownPhase === 'networking' && countdown && (
                    <div className="text-xs text-green-600">
                      {countdown}
                    </div>
                  )}
                  
                  {countdownPhase === 'completed' && (
                    <div className="text-xs text-muted-foreground">
                      {countdown}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* For unregistered rounds, only show countdown if showRegistrationClosesCountdown is true */}
                  {showRegistrationClosesCountdown && registrationClosesCountdown && (
                    <div className={`text-xs ${
                      isSelected 
                        ? 'text-primary/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {registrationClosesCountdown}
                    </div>
                  )}
                </>
              )}
            </>
          )}
          {showUnregisterButton && isRegistered && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnregister?.(round.id);
              }}
              className="p-1 hover:bg-destructive/10 rounded transition-colors"
              title="Unregister from this round"
            >
              <XCircle className="h-4 w-4 text-destructive" />
            </button>
          )}
          {/* Show "View match" button when participant is matched */}
          {isRegistered && participantStatus === 'matched' && token && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/p/${token}/match`;
              }}
              className="text-xs px-2 py-1 h-auto"
            >
              <Users className="h-3 w-3 mr-1" />
              Show your match
            </Button>
          )}
        </div>
      </div>

      {/* Match information - shown when matched or later */}
      {isRegistered && matchData?.match && (participantStatus === 'matched' || participantStatus === 'walking-to-meeting-point' || participantStatus === 'waiting-for-meet-confirmation' || participantStatus === 'met' || countdownPhase === 'walking-to-meeting' || countdownPhase === 'networking') && (
        <div className="px-2 pb-2 pt-2 border-t border-muted-foreground/10 space-y-3">
          {/* Identification Image */}
          {matchData.match.identificationImageUrl && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Your group's identification image:</div>
              <img 
                src={matchData.match.identificationImageUrl} 
                alt="Group identification" 
                className="w-full h-32 object-cover rounded-md border border-border"
              />
              <div className="text-xs text-muted-foreground italic">Show this image to help your match find you</div>
            </div>
          )}
          
          <div className="text-xs space-y-1">
            {matchData.match.meetingPoint && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Meeting point: </span>
                <span className="font-medium">{matchData.match.meetingPoint}</span>
              </div>
            )}
            {matchData.match.participants && (
              <div>
                <span className="text-muted-foreground">Match with: </span>
                <span className="font-medium">
                  {matchData.match.participants
                    .filter((p: any) => p.id !== participantId)
                    .map((p: any) => `${p.firstName} ${p.lastName}`)
                    .join(', ')}
                </span>
              </div>
            )}
          </div>
          
          {countdownPhase === 'walking-to-meeting' && !matchData.match.meetConfirmedAt && (
            <Button
              size="sm"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const { apiBaseUrl, publicAnonKey } = await import('../utils/supabase/info');
                  const response = await fetch(
                    `${apiBaseUrl}/rounds/${round.id}/confirm-meet`,
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${publicAnonKey}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        participantId,
                        sessionId: session?.id,
                      }),
                    }
                  );
                  
                  if (response.ok) {
                    const { toast } = await import('sonner@2.0.3');
                    toast.success('Meeting confirmed! Enjoy your networking.');
                    // Refetch match data
                    const matchResponse = await fetch(
                      `${apiBaseUrl}/rounds/${round.id}/participant/${participantId}/match`,
                      {
                        headers: {
                          'Authorization': `Bearer ${publicAnonKey}`,
                        },
                      }
                    );
                    if (matchResponse.ok) {
                      const data = await matchResponse.json();
                      setMatchData(data);
                    }
                  }
                } catch (error) {
                  errorLog('Error confirming meet:', error);
                }
              }}
            >
              We met
            </Button>
          )}
        </div>
      )}
      
      {/* Team and Topic selection - only shown when round is selected */}
      {isSelected && session && (session.enableTeams || session.enableTopics) && (
        <div className="px-2 pb-2 space-y-2 border-t border-muted-foreground/10 pt-2">
          {/* Team selection */}
          {session.enableTeams && session.teams && session.teams.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">I am part of:</label>
              <div className="flex flex-wrap gap-2">
                {session.teams.map((team, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => onTeamSelect?.(round.id, team)}
                    className={`px-3 py-1.5 text-sm rounded-md border transition-all duration-200 ${
                      selectedTeam === team
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/30'
                    }`}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Topic selection */}
          {session.enableTopics && session.topics && session.topics.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                I want to talk about:
                {session.allowMultipleTopics && (
                  <span className="text-muted-foreground/70"> (Select one or more)</span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {session.topics.map((topic, index) => {
                  // Determine if topic is selected based on multiple vs single selection
                  const isTopicSelected = session.allowMultipleTopics 
                    ? selectedTopics?.includes(topic) || false
                    : selectedTopic === topic;
                  
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        if (session.allowMultipleTopics) {
                          onMultipleTopicsSelect?.(round.id, topic);
                        } else {
                          onTopicSelect?.(round.id, topic);
                        }
                      }}
                      className={`px-3 py-1.5 text-sm rounded-md border transition-all duration-200 ${
                        isTopicSelected
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted/30'
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}