import { SystemParameters } from '../utils/systemParameters';
import { Calendar, Bell, Lock, CheckCircle, Users, MapPin, Search, MessageCircle, Share2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface TimelineVisualizationProps {
  parameters: SystemParameters;
}

interface TimelineStep {
  id: string;
  time: string;
  title: string;
  description: string;
  bgColor: string;
  icon: React.ReactNode;
  durationLabel?: string;
  isEmphasized?: boolean;
  warning?: string;
  isRelative?: boolean;
}

interface NotificationEvent {
  id: string;
  time: string;
  minutesBefore: number;
  label: string;
  warning?: string;
}

function buildSteps(p: SystemParameters, validations: Record<string, boolean>): TimelineStep[] {
  return [
    {
      id: 'registration',
      time: '',
      title: 'Registration opens',
      description: 'Participants can register for the round',
      bgColor: 'bg-green-500',
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      id: 'safety-close',
      time: `T\u2212${p.safetyWindowMinutes}`,
      title: 'Registration closes',
      description: 'No new registrations accepted',
      bgColor: validations.safetyWindowConflict ? 'bg-red-500' : 'bg-orange-500',
      icon: <Lock className="h-4 w-4" />,
      durationLabel: `${p.safetyWindowMinutes - p.confirmationWindowMinutes} min`,
      warning: validations.safetyWindowConflict ? 'Safety window must be \u2265 confirmation window' : undefined,
    },
    {
      id: 'confirmation',
      time: `T\u2212${p.confirmationWindowMinutes}`,
      title: 'Confirmation window',
      description: 'Participants must confirm attendance',
      bgColor: 'bg-yellow-500',
      icon: <CheckCircle className="h-4 w-4" />,
      durationLabel: `${p.confirmationWindowMinutes} min`,
    },
    {
      id: 'matching',
      time: 'T\u22120',
      title: 'MATCHING',
      description: 'Algorithm creates groups, matches revealed',
      bgColor: 'bg-purple-600',
      icon: <Users className="h-5 w-5" />,
      isEmphasized: true,
    },
    {
      id: 'walking',
      time: '',
      title: 'Walk to meeting point',
      description: 'Participants walk to meeting point',
      bgColor: 'bg-blue-500',
      icon: <MapPin className="h-4 w-4" />,
      durationLabel: `up to ${p.walkingTimeMinutes} min`,
      isRelative: true,
    },
    {
      id: 'finding',
      time: '',
      title: 'Find each other',
      description: 'Partners identify each other',
      bgColor: 'bg-cyan-500',
      icon: <Search className="h-4 w-4" />,
      durationLabel: `up to ${p.findingTimeMinutes} min`,
      isRelative: true,
    },
    {
      id: 'networking',
      time: '',
      title: 'Networking',
      description: 'Conversation time',
      bgColor: 'bg-indigo-500',
      icon: <MessageCircle className="h-4 w-4" />,
      durationLabel: `${p.defaultRoundDuration} min`,
      isRelative: true,
    },
    {
      id: 'contact-sharing',
      time: '',
      title: 'Contacts revealed',
      description: 'App shows partner contacts (if shared)',
      bgColor: 'bg-emerald-500',
      icon: <Share2 className="h-4 w-4" />,
      durationLabel: p.contactSharingDelayMinutes > 0
        ? `after ${p.contactSharingDelayMinutes} min of networking`
        : 'immediately when networking starts',
      isRelative: true,
    },
  ];
}

function buildNotifications(p: SystemParameters, validations: Record<string, boolean>): NotificationEvent[] {
  const events: NotificationEvent[] = [];

  if (p.notificationEarlyEnabled) {
    events.push({
      id: 'early',
      time: `T\u2212${p.notificationEarlyMinutes}`,
      minutesBefore: p.notificationEarlyMinutes,
      label: 'Early notification sent',
      warning: validations.earlyNotificationConflict
        ? `Must be before confirmation window (T\u2212${p.confirmationWindowMinutes})`
        : undefined,
    });
  }

  if (p.notificationLateEnabled) {
    events.push({
      id: 'late',
      time: `T\u2212${p.notificationLateMinutes}`,
      minutesBefore: p.notificationLateMinutes,
      label: 'Late reminder sent',
      warning: validations.lateNotificationConflict
        ? `Must be before confirmation window (T\u2212${p.confirmationWindowMinutes})`
        : validations.lateNotificationTooEarly
        ? 'Timing must be positive'
        : undefined,
    });
  }

  return events;
}

function getValidations(p: SystemParameters) {
  return {
    // Strict less than: notification at same time as confirmation is OK
    lateNotificationConflict: p.notificationLateEnabled && p.notificationLateMinutes < p.confirmationWindowMinutes,
    earlyNotificationConflict: p.notificationEarlyEnabled && p.notificationEarlyMinutes < p.confirmationWindowMinutes,
    safetyWindowConflict: p.safetyWindowMinutes < p.confirmationWindowMinutes,
    lateNotificationTooEarly: p.notificationLateEnabled && p.notificationLateMinutes <= 0,
    minimalTimeConflict: p.minimalTimeToFirstRound < p.safetyWindowMinutes,
  };
}

// Determine where a notification should be inserted in the timeline
function getNotificationInsertIndex(minutesBefore: number, p: SystemParameters): number {
  // Before safety window close
  if (minutesBefore > p.safetyWindowMinutes) return 1;
  // Between safety and confirmation (or at confirmation boundary)
  if (minutesBefore >= p.confirmationWindowMinutes) return 2;
  // After confirmation (conflict)
  return 3;
}

export function TimelineVisualization({ parameters }: TimelineVisualizationProps) {
  const validations = getValidations(parameters);
  const hasConflicts = Object.values(validations).some(v => v);
  const conflictCount = Object.values(validations).filter(v => v).length;

  const steps = buildSteps(parameters, validations);
  const notifications = buildNotifications(parameters, validations);

  // Sort notifications by time (earliest first)
  notifications.sort((a, b) => b.minutesBefore - a.minutesBefore);

  // Interleave notifications with steps
  type TimelineItem = { type: 'step'; step: TimelineStep } | { type: 'notification'; notification: NotificationEvent };
  const items: TimelineItem[] = [];

  // Track which notification insert indices we need
  const notifsByIndex = new Map<number, NotificationEvent[]>();
  for (const n of notifications) {
    const idx = getNotificationInsertIndex(n.minutesBefore, parameters);
    if (!notifsByIndex.has(idx)) notifsByIndex.set(idx, []);
    notifsByIndex.get(idx)!.push(n);
  }

  for (let i = 0; i < steps.length; i++) {
    // Insert any notifications before this step
    const notifsHere = notifsByIndex.get(i);
    if (notifsHere) {
      for (const n of notifsHere) {
        items.push({ type: 'notification', notification: n });
      }
    }
    items.push({ type: 'step', step: steps[i] });
  }

  const totalBefore = parameters.safetyWindowMinutes;
  const totalAfter = parameters.walkingTimeMinutes + parameters.findingTimeMinutes + parameters.defaultRoundDuration;

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Round timeline</CardTitle>
          {hasConflicts && (
            <Badge variant="destructive" className="gap-1 text-xs">
              <AlertTriangle className="h-3 w-3" />
              {conflictCount} conflict{conflictCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-0">
          {items.map((item, i) => {
            if (item.type === 'notification') {
              const n = item.notification;
              const hasWarning = !!n.warning;
              return (
                <div key={n.id} className="flex gap-3 pb-2">
                  {/* Diamond column */}
                  <div className="w-7 flex-shrink-0 flex flex-col items-center">
                    <div className={`w-3.5 h-3.5 rotate-45 border-2 mt-1.5 ${
                      hasWarning ? 'border-red-400 bg-red-100' : 'border-blue-400 bg-blue-100'
                    }`} />
                    <div className="flex-1 w-px bg-border mt-1" />
                  </div>
                  {/* Content */}
                  <div className={`flex-1 px-3 py-1.5 rounded-md text-xs border ${
                    hasWarning
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Bell className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="font-mono font-medium">{n.time}</span>
                      <span>{n.label}</span>
                    </div>
                    {hasWarning && (
                      <div className="flex items-center gap-1 mt-1 text-red-700">
                        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                        <span>{n.warning}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            const step = item.step;
            const isLast = i === items.length - 1;
            const hasWarning = !!step.warning;

            return (
              <div key={step.id} className={`flex gap-3 ${isLast ? '' : 'pb-3'}`}>
                {/* Circle column */}
                <div className="w-7 flex-shrink-0 flex flex-col items-center">
                  <div className={`${
                    step.isEmphasized
                      ? 'w-7 h-7 ring-3 ring-purple-200'
                      : 'w-5 h-5 mt-0.5'
                  } rounded-full ${step.bgColor} flex items-center justify-center text-white shadow-sm flex-shrink-0 ${
                    hasWarning ? 'ring-2 ring-red-400' : ''
                  }`}>
                    {step.icon}
                  </div>
                  {!isLast && <div className="flex-1 w-px bg-border mt-1" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {step.time && (
                      <span className={`text-xs font-mono px-1.5 py-0.5 rounded font-medium ${
                        step.isEmphasized
                          ? 'bg-purple-100 text-purple-800'
                          : hasWarning
                          ? 'bg-red-100 text-red-700'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {step.time}
                      </span>
                    )}
                    <span className={`font-medium ${
                      step.isEmphasized ? 'text-base text-purple-900' : 'text-sm'
                    } ${hasWarning ? 'text-red-800' : ''}`}>
                      {step.title}
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${hasWarning ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {step.description}
                  </p>
                  {step.durationLabel && (
                    <span className={`inline-block mt-1 text-[11px] px-1.5 py-0.5 rounded ${
                      step.isRelative
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.durationLabel}
                    </span>
                  )}
                  {hasWarning && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1 w-fit">
                      <AlertTriangle className="h-3 w-3" />
                      {step.warning}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Validation warnings (for conflicts not tied to a specific timeline step) */}
        {validations.minimalTimeConflict && (
          <div className="mt-3 flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Min time to first round</strong> ({parameters.minimalTimeToFirstRound} min) must be ≥ registration close window ({parameters.safetyWindowMinutes} min)
            </span>
          </div>
        )}

        {/* Summary */}
        <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
          Total: {totalBefore} min before matching + {totalAfter} min after = <span className="font-medium text-foreground">{totalBefore + totalAfter} min</span> round span
        </div>
      </CardContent>
    </Card>
  );
}
