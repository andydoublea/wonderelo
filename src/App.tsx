// Export type definitions
export interface Participant {
  id: string;
  roundId: string;
  sessionId: string;
  name: string;
  email: string;
  phone?: string;
  registeredAt: string;
  status: 'registered' | 'cancelled' | 'confirmed' | 'unconfirmed' | 'met' | 'missed' | 'left-alone' | 'no-match';
  teamId?: string;
  topicIds?: string[];
  confirmationSentAt?: string;
  confirmedAt?: string;
}

export interface CheckIn {
  participantId: string;
  checkedInAt: string;
  scannedBy?: string;
}

export interface Match {
  id: string;
  roundId: string;
  sessionId: string;
  participantIds: string[];
  meetingPointId: string;
  identificationImageUrl: string;
  status: 'pending' | 'active' | 'completed' | 'no-show-reported';
  checkIns: CheckIn[];
  createdAt: string;
}

export interface MeetingPoint {
  id: string;
  name: string;
  imageUrl?: string;
  originalImageUrl?: string;
  type?: 'physical' | 'virtual';
  videoCallUrl?: string;
}

export interface IceBreaker {
  id: string;
  question: string;
}

export interface Round {
  id: string;
  name: string;
  startTime: string;
  date: string; // Date of this specific round (YYYY-MM-DD) - can be different from session.date if round goes past midnight
  duration: number;
  confirmationSentAt?: string;
  matchingCompletedAt?: string;
  status?: 'draft' | 'scheduled' | 'open-to-registration' | 'registration-safety-window' | 'matching' | 'running' | 'completed';
  registeredCount?: number; // Number of registered participants for this round
}

export interface NetworkingSession {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  roundDuration: number;
  numberOfRounds: number;
  gapBetweenRounds?: number;
  limitParticipants: boolean;
  maxParticipants?: number;
  groupSize: number;
  limitGroups: boolean;
  maxGroups?: number;
  status: 'draft' | 'scheduled' | 'published' | 'completed';
  registrationStart?: string;
  registrationEnd?: string;
  isRecurring?: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly';
  rounds: Round[];
  enableTeams?: boolean;
  allowMultipleTeams?: boolean;
  matchingType?: 'within-team' | 'across-teams';
  teams?: string[];
  enableTopics?: boolean;
  allowMultipleTopics?: boolean;
  topics?: string[];
  meetingPoints?: MeetingPoint[];
  iceBreakers?: IceBreaker[];
  createdAt?: string;
  updatedAt?: string;
}

export type ServiceType = 'event';

export interface SignUpData {
  email: string;
  password: string;
  serviceType: ServiceType;
  urlSlug: string;
  discoverySource: string;
  companySize: string;
  userRole: string;
  organizerName: string;
}

// Import and export the router component
import AppRouter from './AppRouter';
export default AppRouter;