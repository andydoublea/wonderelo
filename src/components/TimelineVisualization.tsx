import { SystemParameters } from './AdminParameters';
import { Calendar, Bell, Lock, CheckCircle, Users, MapPin, Flag, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Badge } from './ui/badge';

interface TimelineVisualizationProps {
  parameters: SystemParameters;
}

export function TimelineVisualization({ parameters }: TimelineVisualizationProps) {
  // Calculate total timeline span (from -safetyWindow to +walking+duration)
  const totalMinutes = parameters.safetyWindowMinutes + parameters.walkingTimeMinutes + parameters.defaultRoundDuration;
  
  // Calculate position as percentage (T-0 is at 50%)
  const calculatePosition = (minutesFromStart: number) => {
    // minutesFromStart: negative = before T-0, positive = after T-0
    const offset = minutesFromStart + parameters.safetyWindowMinutes;
    return (offset / totalMinutes) * 100;
  };
  
  // Validation checks
  const validations = {
    lateNotificationConflict: parameters.notificationLateMinutes <= parameters.confirmationWindowMinutes,
    earlyNotificationConflict: parameters.notificationEarlyMinutes <= parameters.confirmationWindowMinutes,
    safetyWindowConflict: parameters.safetyWindowMinutes < parameters.confirmationWindowMinutes,
    lateNotificationTooEarly: parameters.notificationLateMinutes <= 0,
    minimalTimeConflict: parameters.minimalTimeToFirstRound < parameters.safetyWindowMinutes
  };
  
  const hasAnyValidationIssue = Object.values(validations).some(v => v);
  
  return (
    <Card className="mb-8 border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Visual timeline
            </CardTitle>
            <CardDescription>
              Interactive visualization of round timing and participant flow
            </CardDescription>
          </div>
          {hasAnyValidationIssue && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {Object.values(validations).filter(v => v).length} conflict{Object.values(validations).filter(v => v).length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeline Container */}
        <div className="relative h-56 w-full overflow-x-auto pb-8">
          
          {/* Background Zones - with min-width for better visibility */}
          <div className="absolute inset-0 flex px-24 min-w-[1400px]">
            {/* Zone 1: Registration Open */}
            <div 
              className="relative bg-green-100/30 border-r border-green-300/50"
              style={{ width: `${calculatePosition(-parameters.safetyWindowMinutes)}%` }}
            >
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-green-700 font-medium leading-tight text-center">
                Reg.<br/>open
              </div>
            </div>
            
            {/* Zone 2: Safety Window */}
            <div 
              className={`relative border-r ${
                validations.safetyWindowConflict 
                  ? 'bg-red-100/40 border-red-400' 
                  : 'bg-orange-100/30 border-orange-300/50'
              }`}
              style={{ 
                width: `${calculatePosition(-parameters.confirmationWindowMinutes) - calculatePosition(-parameters.safetyWindowMinutes)}%` 
              }}
            >
              <div className={`absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-medium leading-tight text-center ${
                validations.safetyWindowConflict ? 'text-red-700' : 'text-orange-700'
              }`}>
                Safety<br/>window
              </div>
            </div>
            
            {/* Zone 3: Confirmation Window */}
            <div 
              className="relative bg-yellow-100/40 border-r border-yellow-400/50"
              style={{ 
                width: `${calculatePosition(0) - calculatePosition(-parameters.confirmationWindowMinutes)}%` 
              }}
            >
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-yellow-800 font-medium flex flex-col items-center gap-0.5 leading-tight text-center">
                <span className="animate-pulse">⏰</span>
                <span>Confirm<br/>attend.</span>
              </div>
            </div>
            
            {/* Zone 4: Walking */}
            <div 
              className="relative bg-blue-100/30 border-r border-blue-300/50"
              style={{ 
                width: `${calculatePosition(parameters.walkingTimeMinutes) - calculatePosition(0)}%` 
              }}
            >
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-blue-700 font-medium leading-tight text-center">
                Walking<br/>to point
              </div>
            </div>
            
            {/* Zone 5: Networking */}
            <div 
              className="relative bg-purple-100/30"
              style={{ 
                width: `${100 - calculatePosition(parameters.walkingTimeMinutes)}%` 
              }}
            >
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-purple-700 font-medium leading-tight text-center">
                Networking<br/>session
              </div>
            </div>
          </div>
          
          {/* Main Timeline Axis */}
          <div className="absolute top-1/2 left-24 right-24 h-1 bg-border -translate-y-1/2 min-w-[calc(1400px-12rem)]" />
          
          {/* Time Points Container - positioned to align with zones */}
          <div className="absolute inset-0 px-24 min-w-[1400px]">
            <TooltipProvider>
              
              {/* Event Created / Registration Opens */}
              <TimelinePoint
                position={0}
                icon={<Calendar className="h-4 w-4" />}
                label="Event created"
                color="bg-green-600"
                tooltip="Registration opens. Participants can start registering for rounds."
              />
              
              {/* Early Notification */}
              {parameters.notificationEarlyEnabled && (
                <TimelinePoint
                  position={calculatePosition(-parameters.notificationEarlyMinutes)}
                  icon={<Bell className="h-3 w-3" />}
                  label={`T-${parameters.notificationEarlyMinutes}`}
                  color={validations.earlyNotificationConflict ? "bg-red-600" : "bg-blue-600"}
                  tooltip={`Early notification sent to registered participants (${parameters.notificationEarlyMinutes} minutes before round start)`}
                  size="small"
                  aboveAxis
                  warning={validations.earlyNotificationConflict ? "Early notification must be sent BEFORE confirmation window starts!" : undefined}
                />
              )}
              
              {/* Safety Window Closes */}
              <TimelinePoint
                position={calculatePosition(-parameters.safetyWindowMinutes)}
                icon={<Lock className="h-4 w-4" />}
                label={`T-${parameters.safetyWindowMinutes}`}
                color={validations.safetyWindowConflict ? "bg-red-600" : "bg-orange-600"}
                tooltip="Registration closes. New participants cannot register. Ongoing registrations can still complete."
                warning={validations.safetyWindowConflict ? "Safety window must close BEFORE or AT confirmation window start!" : undefined}
              />
              
              {/* Late Notification */}
              {parameters.notificationLateEnabled && (
                <TimelinePoint
                  position={calculatePosition(-parameters.notificationLateMinutes)}
                  icon={<Bell className="h-3 w-3" />}
                  label={`T-${parameters.notificationLateMinutes}`}
                  color={validations.lateNotificationConflict || validations.lateNotificationTooEarly ? "bg-red-600" : "bg-amber-600"}
                  tooltip={`Late reminder sent to registered participants (${parameters.notificationLateMinutes} minutes before round start)`}
                  size="small"
                  aboveAxis
                  warning={
                    validations.lateNotificationConflict 
                      ? "Late notification must be sent BEFORE confirmation window starts (as a last reminder before participants need to confirm)!" 
                      : validations.lateNotificationTooEarly
                      ? "Late notification timing must be positive!"
                      : undefined
                  }
                />
              )}
              
              {/* Confirmation Window Starts */}
              <TimelinePoint
                position={calculatePosition(-parameters.confirmationWindowMinutes)}
                icon={<CheckCircle className="h-4 w-4" />}
                label={`T-${parameters.confirmationWindowMinutes}`}
                color="bg-yellow-600"
                tooltip="Confirmation window opens. Participants must confirm their attendance to be included in matching."
              />
              
              {/* MATCHING (T-0) - EMPHASIZED */}
              <TimelinePoint
                position={calculatePosition(0)}
                icon={<Users className="h-5 w-5" />}
                label="T-0 MATCHING"
                color="bg-purple-600"
                tooltip="Round starts! Algorithm creates groups and reveals matches to participants."
                size="large"
                emphasized
              />
              
              {/* Walking Period End */}
              <TimelinePoint
                position={calculatePosition(parameters.walkingTimeMinutes)}
                icon={<MapPin className="h-4 w-4" />}
                label={`+${parameters.walkingTimeMinutes}min`}
                color="bg-blue-600"
                tooltip={`Walking time ends. Participants should have reached their meeting point after ${parameters.walkingTimeMinutes} minutes.`}
              />
              
              {/* Round Ends */}
              <TimelinePoint
                position={100}
                icon={<Flag className="h-4 w-4" />}
                label={`+${parameters.walkingTimeMinutes + parameters.defaultRoundDuration}min`}
                color="bg-green-600"
                tooltip="Round ends. Networking session complete."
              />
              
            </TooltipProvider>
            
            {/* Validation Warnings Overlay */}
            {validations.lateNotificationConflict && parameters.notificationLateEnabled && (
              <div 
                className="absolute top-1/2 h-12 border-2 border-red-500 bg-red-100/20 rounded -translate-y-1/2 pointer-events-none"
                style={{
                  left: `${calculatePosition(-parameters.notificationLateMinutes)}%`,
                  width: `${calculatePosition(-parameters.confirmationWindowMinutes) - calculatePosition(-parameters.notificationLateMinutes)}%`
                }}
              />
            )}
            
          </div>
          
        </div>
        
        {/* Legend */}
        <div className="mt-6 pt-4 border-t space-y-3">
          <div className="text-sm font-medium text-muted-foreground">Legend:</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span>Event milestones</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span>Notifications</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-600"></div>
              <span>Registration closes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
              <span>Confirmation phase</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-600"></div>
              <span>Matching & networking</span>
            </div>
          </div>
          
          {/* Validation Messages */}
          {hasAnyValidationIssue && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-red-900">
                <AlertTriangle className="h-4 w-4" />
                Timeline conflicts detected:
              </div>
              <ul className="text-xs text-red-800 space-y-1 ml-6 list-disc">
                {validations.lateNotificationConflict && (
                  <li>Late notification (T-{parameters.notificationLateMinutes}) must be sent BEFORE confirmation window starts (as a last reminder before participants need to confirm)</li>
                )}
                {validations.earlyNotificationConflict && (
                  <li>Early notification (T-{parameters.notificationEarlyMinutes}) must be sent BEFORE confirmation window starts (T-{parameters.confirmationWindowMinutes})</li>
                )}
                {validations.safetyWindowConflict && (
                  <li>Safety window (T-{parameters.safetyWindowMinutes}) must close BEFORE or AT confirmation window start (T-{parameters.confirmationWindowMinutes})</li>
                )}
                {validations.lateNotificationTooEarly && (
                  <li>Late notification timing cannot be zero or negative</li>
                )}
                {validations.minimalTimeConflict && (
                  <li>Minimal time to first round ({parameters.minimalTimeToFirstRound}min) should be at least {parameters.safetyWindowMinutes}min to allow proper registration time</li>
                )}
              </ul>
            </div>
          )}
        </div>
        
      </CardContent>
    </Card>
  );
}

// TimelinePoint Component
interface TimelinePointProps {
  position: number; // Percentage 0-100
  icon: React.ReactNode;
  label: string;
  color: string;
  tooltip: string;
  size?: 'small' | 'normal' | 'large';
  aboveAxis?: boolean;
  emphasized?: boolean;
  warning?: string;
}

function TimelinePoint({ 
  position, 
  icon, 
  label, 
  color, 
  tooltip, 
  size = 'normal',
  aboveAxis = false,
  emphasized = false,
  warning
}: TimelinePointProps) {
  const sizeClasses = {
    small: 'w-6 h-6',
    normal: 'w-8 h-8',
    large: 'w-12 h-12'
  };
  
  const labelSizeClasses = {
    small: 'text-[10px]',
    normal: 'text-xs',
    large: 'text-sm font-semibold'
  };
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-help z-10"
          style={{ left: `${position}%` }}
        >
          {/* Vertical line to axis */}
          <div 
            className={`absolute left-1/2 w-0.5 ${warning ? 'bg-red-400' : 'bg-border'} -translate-x-1/2`}
            style={{
              [aboveAxis ? 'bottom' : 'top']: '50%',
              height: aboveAxis ? '40px' : '40px'
            }}
          />
          
          {/* Icon circle */}
          <div 
            className={`
              ${sizeClasses[size]} 
              ${color} 
              ${warning ? 'ring-4 ring-red-400 animate-pulse' : ''}
              ${emphasized ? 'ring-4 ring-purple-300 shadow-lg scale-110' : 'shadow-md'}
              rounded-full flex items-center justify-center text-white
              transition-all duration-200 hover:scale-110 hover:shadow-xl
              relative
            `}
            style={{
              [aboveAxis ? 'bottom' : 'top']: aboveAxis ? '45px' : '45px'
            }}
          >
            {icon}
            {warning && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
          
          {/* Label */}
          <div 
            className={`
              absolute left-1/2 -translate-x-1/2 whitespace-nowrap
              ${labelSizeClasses[size]}
              ${warning ? 'text-red-700 font-semibold' : 'text-muted-foreground'}
              ${emphasized ? 'font-bold text-purple-900' : ''}
            `}
            style={{
              [aboveAxis ? 'bottom' : 'top']: aboveAxis ? `${45 + parseInt(sizeClasses[size].split('-')[1]) * 4 + 4}px` : `${45 + parseInt(sizeClasses[size].split('-')[1]) * 4 + 4}px`
            }}
          >
            {label}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent className={`max-w-xs ${warning ? 'bg-red-100 border-red-300' : ''}`}>
        <p className={warning ? 'text-red-900 font-medium' : ''}>{tooltip}</p>
        {warning && (
          <p className="mt-1 text-xs text-red-700">⚠️ {warning}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}