import type { NetworkingSession, Round } from '../App';
import { getParametersOrDefault } from './systemParameters';

/**
 * SESSION FLAGS (dynamic, computed on-the-fly)
 */

/**
 * Checks if session has at least one round currently running
 */
export const hasRunningRounds = (session: NetworkingSession): boolean => {
  if (!session.rounds || session.rounds.length === 0) return false;
  return session.rounds.some(round => isRoundRunning(session, round));
};

/**
 * Checks if session has upcoming rounds (future rounds that haven't started yet)
 * This determines if users can still register for the session
 * Registration closes safetyWindowMinutes before round start to give participants time to complete registration
 */
export const hasUpcomingRounds = (session: NetworkingSession): boolean => {
  if (!session.rounds || session.rounds.length === 0) return false;
  if (!session.date) return false;
  
  const now = new Date();
  const params = getParametersOrDefault();
  
  return session.rounds.some(round => {
    if (!round.startTime) return false;
    const roundStart = new Date(`${session.date}T${round.startTime}:00`);
    // Close registration safetyWindowMinutes before start
    const registrationDeadline = new Date(roundStart.getTime() - params.safetyWindowMinutes * 60 * 1000);
    return now < registrationDeadline;
  });
};

/**
 * ROUND STATUS HELPERS
 */

/**
 * Calculates the current status of a round based on session and time
 */
export const getRoundStatus = (session: NetworkingSession, round: Round): 'draft' | 'scheduled' | 'open-to-registration' | 'registration-safety-window' | 'matching' | 'running' | 'completed' => {
  // If session is draft, round is draft too
  if (session.status === 'draft') return 'draft';
  
  if (!session.date || !round.startTime) return 'draft';
  
  const now = new Date();
  const params = getParametersOrDefault();
  const roundStart = new Date(`${session.date}T${round.startTime}:00`);
  // Note: Round end is calculated from theoretical max time:
  // roundStart + walkingTime (to meeting point) + duration (networking)
  // Matching is instant (few seconds), so we only account for walking + networking
  const maxRoundEnd = new Date(roundStart.getTime() + (params.walkingTimeMinutes + round.duration) * 60000);
  const safetyWindowStart = new Date(roundStart.getTime() - params.safetyWindowMinutes * 60 * 1000);
  
  // Completed: round has ended (after max possible duration)
  if (now >= maxRoundEnd) return 'completed';
  
  // Running: from T-0 onwards (matching starts, then walking, then networking)
  // Note: Individual groups track their own timers via matchRevealedAt, meetConfirmedAt, groupEndedAt
  if (now >= roundStart && now < maxRoundEnd) return 'running';
  
  // Registration safety window: safetyWindow to confirmationWindow (no new registrations, but existing can complete)
  if (now >= safetyWindowStart && now < roundStart) return 'registration-safety-window';
  
  // Open to registration: session is published and before safetyWindow
  if (session.status === 'published' && now < safetyWindowStart) return 'open-to-registration';
  
  // Scheduled: session is published or scheduled but registration not open yet
  if (session.status === 'scheduled' || session.status === 'published') return 'scheduled';
  
  return 'draft';
};

/**
 * Checks if a specific round is currently running
 */
export const isRoundRunning = (session: NetworkingSession, round: Round): boolean => {
  if (!session.date || !round.startTime) return false;
  
  const now = new Date();
  const roundStart = new Date(`${session.date}T${round.startTime}:00`);
  const roundEnd = new Date(roundStart.getTime() + round.duration * 60000);
  
  return now >= roundStart && now < roundEnd;
};

/**
 * Checks if a round is available for registration
 * A round is available until safetyWindowMinutes before it starts
 */
export const isRoundAvailableForRegistration = (session: NetworkingSession, round: Round): boolean => {
  if (!session.date || !round.startTime) return false;
  
  const now = new Date();
  const params = getParametersOrDefault();
  const roundStart = new Date(`${session.date}T${round.startTime}:00`);
  // Close registration safetyWindowMinutes before start
  const registrationDeadline = new Date(roundStart.getTime() - params.safetyWindowMinutes * 60 * 1000);
  
  return now < registrationDeadline;
};

/**
 * Checks if a round is in waiting for attendance confirmation phase
 */
export const isRoundWaitingForConfirmation = (session: NetworkingSession, round: Round): boolean => {
  if (!session.date || !round.startTime) return false;
  
  const now = new Date();
  const params = getParametersOrDefault();
  const roundStart = new Date(`${session.date}T${round.startTime}:00`);
  const confirmationStart = new Date(roundStart.getTime() - params.confirmationWindowMinutes * 60 * 1000);
  
  return now >= confirmationStart && now < roundStart;
};