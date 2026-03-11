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
 * Round status type (8 computed values, NOT stored in DB)
 *
 * Pre-round: draft → scheduled → registration-open → confirmation-window
 * In-round:  walking → finding → networking
 * Terminal:  completed
 */
export type RoundStatus =
  | 'draft'
  | 'scheduled'
  | 'registration-open'
  | 'confirmation-window'
  | 'walking'
  | 'finding'
  | 'networking'
  | 'completed';

/**
 * Calculates the current status of a round based on session and time
 */
export const getRoundStatus = (session: NetworkingSession, round: Round): RoundStatus => {
  // If session is draft, round is draft too
  if (session.status === 'draft') return 'draft';

  if (!session.date || !round.startTime) return 'draft';

  const now = new Date();
  const params = getParametersOrDefault();
  const roundStart = new Date(`${session.date}T${round.startTime}:00`);

  // Time boundaries (all from round start)
  const walkingTimeMs = (params.walkingTimeMinutes || 3) * 60 * 1000;
  const findingTimeMs = (params.findingTimeMinutes || 1) * 60 * 1000;
  const networkingDurationMs = (round.duration || 10) * 60 * 1000;

  const walkingEnd = new Date(roundStart.getTime() + walkingTimeMs);
  const findingEnd = new Date(roundStart.getTime() + walkingTimeMs + findingTimeMs);
  const maxRoundEnd = new Date(roundStart.getTime() + walkingTimeMs + findingTimeMs + networkingDurationMs);
  const safetyWindowStart = new Date(roundStart.getTime() - (params.safetyWindowMinutes || 6) * 60 * 1000);

  // Completed: round has ended
  if (now >= maxRoundEnd) return 'completed';

  // Networking: participants met and talking
  if (now >= findingEnd) return 'networking';

  // Finding: at meeting point, looking for each other
  if (now >= walkingEnd) return 'finding';

  // Walking: matching done, heading to meeting points
  if (now >= roundStart) return 'walking';

  // Confirmation window: no new registrations, participants confirming attendance
  if (now >= safetyWindowStart) return 'confirmation-window';

  // Open to registration: session is published and before safety window
  if (session.status === 'published' && now < safetyWindowStart) return 'registration-open';

  // Scheduled: session is published or scheduled but registration not open yet
  if (session.status === 'scheduled' || session.status === 'published') return 'scheduled';

  return 'draft';
};

/**
 * Checks if a specific round is currently running (walking, finding, or networking)
 */
export const isRoundRunning = (session: NetworkingSession, round: Round): boolean => {
  const status = getRoundStatus(session, round);
  return status === 'walking' || status === 'finding' || status === 'networking';
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