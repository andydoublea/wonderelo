import { Badge } from '../components/ui/badge';

/**
 * Centralized status badge configurations
 * Prevents duplication across components
 */

export type ParticipantStatus = 
  | 'verification_pending'
  | 'registered'
  | 'confirmed'
  | 'unconfirmed'
  | 'waiting-for-match'
  | 'matched'
  | 'walking-to-meeting-point'
  | 'waiting-for-meet-confirmation'
  | 'checked-in'
  | 'cancelled'
  | 'met'
  | 'missed'
  | 'no-show'
  | 'no-match'
  | 'excluded';

export type OrganizerStatus = 
  | 'registered'
  | 'checked-in'
  | 'attended'
  | 'missed';

interface StatusBadgeConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

/**
 * Participant status badge configurations
 */
const participantStatusConfigs: Record<ParticipantStatus, StatusBadgeConfig> = {
  'verification_pending': {
    label: 'verification pending',
    variant: 'outline',
    className: 'text-orange-600 border-orange-300'
  },
  'registered': {
    label: 'registered',
    variant: 'secondary',
    className: 'text-muted-foreground/60'
  },
  'confirmed': {
    label: 'confirmed',
    variant: 'default',
    className: 'bg-green-100 text-green-700 border-green-300'
  },
  'unconfirmed': {
    label: 'unconfirmed',
    variant: 'outline',
    className: 'text-yellow-700 border-yellow-300'
  },
  'waiting-for-match': {
    label: 'waiting for match',
    variant: 'default',
    className: 'bg-purple-100 text-purple-700 border-purple-300'
  },
  'matched': {
    label: 'matched',
    variant: 'default',
    className: ''
  },
  'walking-to-meeting-point': {
    label: 'walking to meeting point',
    variant: 'default',
    className: 'bg-indigo-100 text-indigo-700 border-indigo-300'
  },
  'waiting-for-meet-confirmation': {
    label: 'waiting for meet confirmation',
    variant: 'default',
    className: 'bg-cyan-100 text-cyan-700 border-cyan-300'
  },
  'checked-in': {
    label: 'checked in',
    variant: 'default',
    className: ''
  },
  'cancelled': {
    label: 'cancelled',
    variant: 'destructive',
    className: 'text-red-600'
  },
  'met': {
    label: 'met',
    variant: 'default',
    className: 'bg-blue-100 text-blue-700 border-blue-300'
  },
  'missed': {
    label: 'missed',
    variant: 'destructive',
    className: 'text-red-600'
  },
  'no-show': {
    label: 'no-show',
    variant: 'destructive',
    className: ''
  },
  'no-match': {
    label: 'no match',
    variant: 'outline',
    className: 'text-gray-600 border-gray-300 bg-gray-50'
  },
  'excluded': {
    label: 'excluded',
    variant: 'outline',
    className: ''
  }
};

/**
 * Organizer status badge configurations
 */
const organizerStatusConfigs: Record<OrganizerStatus, StatusBadgeConfig> = {
  'registered': {
    label: 'registered',
    variant: 'outline',
    className: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  'checked-in': {
    label: 'checked in',
    variant: 'default',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  'attended': {
    label: 'attended',
    variant: 'default',
    className: 'bg-green-100 text-green-800 border-green-200'
  },
  'missed': {
    label: 'missed',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 border-red-200'
  }
};

/**
 * Get status badge configuration for a participant
 */
export function getParticipantStatusConfig(status?: string): StatusBadgeConfig {
  if (!status) {
    return participantStatusConfigs['registered'];
  }
  
  return participantStatusConfigs[status as ParticipantStatus] || {
    label: status,
    variant: 'outline',
    className: ''
  };
}

/**
 * Get status badge configuration for an organizer
 */
export function getOrganizerStatusConfig(status: string): StatusBadgeConfig {
  return organizerStatusConfigs[status as OrganizerStatus] || {
    label: status,
    variant: 'outline',
    className: ''
  };
}

/**
 * Render a status badge for a participant (returns config object for flexibility)
 */
export function getParticipantStatusBadge(status?: string) {
  return getParticipantStatusConfig(status);
}

/**
 * Render a status badge component for a participant
 */
export function ParticipantStatusBadge({ status }: { status?: string }) {
  const config = getParticipantStatusConfig(status);
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

/**
 * Render a status badge component for an organizer
 */
export function OrganizerStatusBadge({ status }: { status: string }) {
  const config = getOrganizerStatusConfig(status);
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

/**
 * Get just the variant for backward compatibility with existing code
 */
export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const config = getParticipantStatusConfig(status);
  return config.variant;
}