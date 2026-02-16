import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Clock, Settings as SettingsIcon, Save, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { TimelineVisualization } from './TimelineVisualization';
import { useAdminParameters, useSaveParameters } from '../hooks/useAdminQueries';

interface AdminParametersProps {
  accessToken: string;
  onBack: () => void;
}

export interface SystemParameters {
  // Round timing
  confirmationWindowMinutes: number;
  safetyWindowMinutes: number;
  walkingTimeMinutes: number;
  notificationEarlyMinutes: number; // Early notification before round start
  notificationEarlyEnabled: boolean; // Whether early notification is enabled
  notificationLateMinutes: number;  // Late notification before round start
  notificationLateEnabled: boolean; // Whether late notification is enabled
  
  // Validation constraints
  minimalGapBetweenRounds: number;
  minimalRoundDuration: number;
  maximalRoundDuration: number;
  minimalTimeToFirstRound: number; // Minutes into future for first round start time
  
  // Default values
  defaultRoundDuration: number;
  defaultGapBetweenRounds: number;
  defaultNumberOfRounds: number;
  defaultMaxParticipants: number;
  defaultGroupSize: number;
  defaultLimitParticipants: boolean;
  defaultLimitGroups: boolean;
}

const DEFAULT_PARAMETERS: SystemParameters = {
  confirmationWindowMinutes: 5,
  safetyWindowMinutes: 6,
  walkingTimeMinutes: 3,
  notificationEarlyMinutes: 10,
  notificationEarlyEnabled: true,
  notificationLateMinutes: 5,
  notificationLateEnabled: true,
  minimalGapBetweenRounds: 10,
  minimalRoundDuration: 5,
  maximalRoundDuration: 240,
  minimalTimeToFirstRound: 10,
  defaultRoundDuration: 10,
  defaultGapBetweenRounds: 10,
  defaultNumberOfRounds: 1,
  defaultMaxParticipants: 20,
  defaultGroupSize: 2,
  defaultLimitParticipants: false,
  defaultLimitGroups: false,
};

export function AdminParameters({ accessToken, onBack }: AdminParametersProps) {
  // React Query hooks
  const { data: serverParameters, isLoading: isFetching, isFetching: isRefetching } = useAdminParameters(accessToken);
  const saveMutation = useSaveParameters(accessToken);

  // Merge server data with defaults
  const loadedParams: SystemParameters = serverParameters
    ? { ...DEFAULT_PARAMETERS, ...serverParameters }
    : DEFAULT_PARAMETERS;

  const [localParameters, setLocalParameters] = useState<SystemParameters | null>(null);
  const [baselineParameters, setBaselineParameters] = useState<SystemParameters | null>(() => {
    const savedBaseline = localStorage.getItem('admin-parameters-baseline');
    if (savedBaseline) {
      try {
        return JSON.parse(savedBaseline);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Use local edits if present, otherwise server/default data
  const parameters = localParameters ?? loadedParams;
  const originalParameters = loadedParams;

  const setParameters = (value: SystemParameters | ((prev: SystemParameters) => SystemParameters)) => {
    if (typeof value === 'function') {
      setLocalParameters(prev => value(prev ?? parameters));
    } else {
      setLocalParameters(value);
    }
  };

  const handleSave = async () => {
    saveMutation.mutate(parameters, {
      onSuccess: () => {
        setLocalParameters(null); // Reset local edits
      },
    });
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all parameters to defaults?')) {
      setLocalParameters(DEFAULT_PARAMETERS);
      toast.info('Parameters reset to defaults (not saved yet)');
    }
  };

  const handleRevert = () => {
    setLocalParameters(null);
    toast.info('Reverted to last saved values');
  };

  const handleSaveBaseline = () => {
    setBaselineParameters(parameters);
    localStorage.setItem('admin-parameters-baseline', JSON.stringify(parameters));
    toast.success('Current values marked as baseline');
  };

  const handleRevertToBaseline = () => {
    if (baselineParameters) {
      setParameters(baselineParameters);
      toast.info('Reverted to baseline values (not saved yet)');
    }
  };

  const handleClearBaseline = () => {
    if (confirm('Are you sure you want to clear the saved baseline?')) {
      setBaselineParameters(null);
      localStorage.removeItem('admin-parameters-baseline');
      toast.info('Baseline cleared');
    }
  };

  const hasChanges = JSON.stringify(parameters) !== JSON.stringify(originalParameters);

  const isFieldChanged = <K extends keyof SystemParameters>(key: K): boolean => {
    return parameters[key] !== originalParameters[key];
  };

  const updateParameter = <K extends keyof SystemParameters>(
    key: K,
    value: SystemParameters[K]
  ) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  const getBaselineTag = <K extends keyof SystemParameters>(key: K) => {
    if (!baselineParameters) return null;
    const value = baselineParameters[key];
    const displayValue = typeof value === 'boolean' ? (value ? 'ON' : 'OFF') : value;
    return (
      <span className="text-xs text-green-600 ml-2 font-normal">
        [baseline: {displayValue}]
      </span>
    );
  };

  const isSaving = saveMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">Parameters</h1>
                  {(isFetching || isRefetching) && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Configure system-wide settings and defaults</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {baselineParameters && (
                <>
                  <Button variant="outline" size="sm" onClick={handleRevertToBaseline}>
                    Revert to baseline
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClearBaseline}>
                    Clear baseline
                  </Button>
                  <div className="h-6 w-px bg-border mx-1" />
                </>
              )}
              <Button variant="outline" onClick={handleSaveBaseline}>
                📌 Mark as baseline
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to defaults
              </Button>
              <Button onClick={handleRevert} disabled={!hasChanges}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Revert changes
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="space-y-6">
          
          {/* Timeline Visualization - Add at top */}
          <TimelineVisualization parameters={parameters} />
          
          {/* Baseline Info Banner */}
          {baselineParameters && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <div className="text-green-600 flex-shrink-0">
                    📌
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-900 mb-2">Baseline values saved</p>
                    <p className="text-sm text-green-800 mb-3">
                      You have marked production baseline values. These are shown next to each field for reference during testing.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleRevertToBaseline} className="bg-white">
                        Revert to baseline
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleClearBaseline} className="text-green-700 hover:text-green-900">
                        Clear baseline
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Round Timing Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle>Round timing</CardTitle>
                  <CardDescription>Configure time windows for round confirmation and matching</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Confirmation Window */}
              <div className="space-y-2">
                <Label htmlFor="confirmationWindow">
                  Confirmation window start (minutes before round)
                  {getBaselineTag('confirmationWindowMinutes')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  How many minutes before round start should the "Confirm attendance" button appear
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    id="confirmationWindow"
                    type="number"
                    min="1"
                    max="30"
                    value={parameters.confirmationWindowMinutes}
                    onChange={(e) => updateParameter('confirmationWindowMinutes', parseInt(e.target.value) || 5)}
                    className={`max-w-[120px] ${isFieldChanged('confirmationWindowMinutes') ? 'border-amber-400 border-2' : ''}`}
                  />
                  <span className="text-sm text-muted-foreground">minutes (T-{parameters.confirmationWindowMinutes})</span>
                  {isFieldChanged('confirmationWindowMinutes') && (
                    <span className="text-xs text-amber-600">
                      (saved: {originalParameters.confirmationWindowMinutes})
                    </span>
                  )}
                </div>
              </div>

              {/* Safety Window */}
              <div className="space-y-2">
                <Label htmlFor="safetyWindow">
                  Registration safety window (minutes before round)
                  {getBaselineTag('safetyWindowMinutes')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Cutoff time for new registrations (should be ≥ confirmation window)
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    id="safetyWindow"
                    type="number"
                    min="1"
                    max="30"
                    value={parameters.safetyWindowMinutes}
                    onChange={(e) => updateParameter('safetyWindowMinutes', parseInt(e.target.value) || 6)}
                    className={`max-w-[120px] ${isFieldChanged('safetyWindowMinutes') ? 'border-amber-400 border-2' : ''}`}
                  />
                  <span className="text-sm text-muted-foreground">minutes (T-{parameters.safetyWindowMinutes})</span>
                  {isFieldChanged('safetyWindowMinutes') && (
                    <span className="text-xs text-amber-600">
                      (saved: {originalParameters.safetyWindowMinutes})
                    </span>
                  )}
                </div>
                {parameters.safetyWindowMinutes < parameters.confirmationWindowMinutes && (
                  <p className="text-sm text-amber-600">
                    ⚠️ Warning: Safety window should be ≥ confirmation window
                  </p>
                )}
              </div>

              {/* Walking Time */}
              <div className="space-y-2">\n                <Label htmlFor="walkingTime">
                  Walking time to meeting point
                  {getBaselineTag('walkingTimeMinutes')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Time participants have to walk to the meeting point after match is revealed
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    id="walkingTime"
                    type="number"
                    min="1"
                    max="10"
                    value={parameters.walkingTimeMinutes}
                    onChange={(e) => updateParameter('walkingTimeMinutes', parseInt(e.target.value) || 3)}
                    className={`max-w-[120px] ${isFieldChanged('walkingTimeMinutes') ? 'border-amber-400 border-2' : ''}`}
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                  {isFieldChanged('walkingTimeMinutes') && (
                    <span className="text-xs text-amber-600">
                      (saved: {originalParameters.walkingTimeMinutes})
                    </span>
                  )}
                </div>
              </div>

              {/* Notification Early */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notificationEarly">
                    Early notification before round start
                    {getBaselineTag('notificationEarlyMinutes')}
                  </Label>
                  <div className={`flex items-center gap-2 ${isFieldChanged('notificationEarlyEnabled') ? 'bg-amber-50 px-2 py-1 rounded border border-amber-400' : ''}`}>
                    <Label htmlFor="notificationEarlyEnabled" className="text-sm cursor-pointer">
                      Enabled
                    </Label>
                    <input
                      id="notificationEarlyEnabled"
                      type="checkbox"
                      checked={parameters.notificationEarlyEnabled}
                      onChange={(e) => updateParameter('notificationEarlyEnabled', e.target.checked)}
                      className="h-4 w-4"
                    />
                    {isFieldChanged('notificationEarlyEnabled') && (
                      <span className="text-xs text-amber-600 ml-1">
                        (saved: {originalParameters.notificationEarlyEnabled ? 'ON' : 'OFF'})
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Time before round start when early notification is sent (can be disabled)
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    id="notificationEarly"
                    type="number"
                    min="1"
                    max="30"
                    value={parameters.notificationEarlyMinutes}
                    onChange={(e) => updateParameter('notificationEarlyMinutes', parseInt(e.target.value) || 10)}
                    disabled={!parameters.notificationEarlyEnabled}
                    className={`max-w-[120px] ${isFieldChanged('notificationEarlyMinutes') ? 'border-amber-400 border-2' : ''} ${!parameters.notificationEarlyEnabled ? 'opacity-50' : ''}`}
                  />
                  <span className={`text-sm text-muted-foreground ${!parameters.notificationEarlyEnabled ? 'opacity-50' : ''}`}>
                    minutes (T-{parameters.notificationEarlyMinutes})
                  </span>
                  {isFieldChanged('notificationEarlyMinutes') && (
                    <span className="text-xs text-amber-600">
                      (saved: {originalParameters.notificationEarlyMinutes})
                    </span>
                  )}
                </div>
              </div>

              {/* Notification Late */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notificationLate">
                    Late notification before round start
                    {getBaselineTag('notificationLateMinutes')}
                  </Label>
                  <div className={`flex items-center gap-2 ${isFieldChanged('notificationLateEnabled') ? 'bg-amber-50 px-2 py-1 rounded border border-amber-400' : ''}`}>
                    <Label htmlFor="notificationLateEnabled" className="text-sm cursor-pointer">
                      Enabled
                    </Label>
                    <input
                      id="notificationLateEnabled"
                      type="checkbox"
                      checked={parameters.notificationLateEnabled}
                      onChange={(e) => updateParameter('notificationLateEnabled', e.target.checked)}
                      className="h-4 w-4"
                    />
                    {isFieldChanged('notificationLateEnabled') && (
                      <span className="text-xs text-amber-600 ml-1">
                        (saved: {originalParameters.notificationLateEnabled ? 'ON' : 'OFF'})
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Time before round start when late notification is sent (can be disabled)
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    id="notificationLate"
                    type="number"
                    min="1"
                    max="30"
                    value={parameters.notificationLateMinutes}
                    onChange={(e) => updateParameter('notificationLateMinutes', parseInt(e.target.value) || 5)}
                    disabled={!parameters.notificationLateEnabled}
                    className={`max-w-[120px] ${isFieldChanged('notificationLateMinutes') ? 'border-amber-400 border-2' : ''} ${!parameters.notificationLateEnabled ? 'opacity-50' : ''}`}
                  />
                  <span className={`text-sm text-muted-foreground ${!parameters.notificationLateEnabled ? 'opacity-50' : ''}`}>
                    minutes (T-{parameters.notificationLateMinutes})
                  </span>
                  {isFieldChanged('notificationLateMinutes') && (
                    <span className="text-xs text-amber-600">
                      (saved: {originalParameters.notificationLateMinutes})
                    </span>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Validation Constraints Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <SettingsIcon className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <CardTitle>Validation constraints</CardTitle>
                  <CardDescription>Minimum and maximum limits for session creation</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Gap Between Rounds Constraints */}
              <div className="space-y-2">
                <Label htmlFor="minimalGapBetweenRounds">
                  Minimal gap between rounds
                  {getBaselineTag('minimalGapBetweenRounds')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Minimum allowed gap between rounds when creating sessions
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    id="minimalGapBetweenRounds"
                    type="number"
                    min="0"
                    max="30"
                    value={parameters.minimalGapBetweenRounds}
                    onChange={(e) => updateParameter('minimalGapBetweenRounds', parseInt(e.target.value) || 5)}
                    className={`max-w-[120px] ${isFieldChanged('minimalGapBetweenRounds') ? 'border-amber-400 border-2' : ''}`}
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                  {isFieldChanged('minimalGapBetweenRounds') && (
                    <span className="text-xs text-amber-600">
                      (saved: {originalParameters.minimalGapBetweenRounds})
                    </span>
                  )}
                </div>
              </div>

              {/* Minimal Time to First Round */}
              <div className="space-y-2">
                <Label htmlFor="minimalTimeToFirstRound">
                  Minimal time to first round
                  {getBaselineTag('minimalTimeToFirstRound')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Minimum required time between now and first round start (scheduling buffer)
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    id="minimalTimeToFirstRound"
                    type="number"
                    min="1"
                    max="60"
                    value={parameters.minimalTimeToFirstRound}
                    onChange={(e) => updateParameter('minimalTimeToFirstRound', parseInt(e.target.value) || 10)}
                    className={`max-w-[120px] ${isFieldChanged('minimalTimeToFirstRound') ? 'border-amber-400 border-2' : ''}`}
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                  {isFieldChanged('minimalTimeToFirstRound') && (
                    <span className="text-xs text-amber-600">
                      (saved: {originalParameters.minimalTimeToFirstRound})
                    </span>
                  )}
                </div>
              </div>

              {/* Round Duration Constraints */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="minimalRoundDuration">
                    Minimal round duration
                    {getBaselineTag('minimalRoundDuration')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Minimum allowed duration per round
                  </p>
                  <div className="flex items-center gap-3">
                    <Input
                      id="minimalRoundDuration"
                      type="number"
                      min="1"
                      max="60"
                      value={parameters.minimalRoundDuration}
                      onChange={(e) => updateParameter('minimalRoundDuration', parseInt(e.target.value) || 5)}
                      className={`max-w-[120px] ${isFieldChanged('minimalRoundDuration') ? 'border-amber-400 border-2' : ''}`}
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                    {isFieldChanged('minimalRoundDuration') && (
                      <span className="text-xs text-amber-600">
                        (saved: {originalParameters.minimalRoundDuration})
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maximalRoundDuration">
                    Maximal round duration
                    {getBaselineTag('maximalRoundDuration')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Maximum allowed duration per round
                  </p>
                  <div className="flex items-center gap-3">
                    <Input
                      id="maximalRoundDuration"
                      type="number"
                      min="5"
                      max="360"
                      value={parameters.maximalRoundDuration}
                      onChange={(e) => updateParameter('maximalRoundDuration', parseInt(e.target.value) || 60)}
                      className={`max-w-[120px] ${isFieldChanged('maximalRoundDuration') ? 'border-amber-400 border-2' : ''}`}
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                    {isFieldChanged('maximalRoundDuration') && (
                      <span className="text-xs text-amber-600">
                        (saved: {originalParameters.maximalRoundDuration})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Validation warnings */}
              {parameters.minimalRoundDuration >= parameters.maximalRoundDuration && (
                <p className="text-sm text-amber-600">
                  ⚠️ Warning: Minimal round duration should be less than maximal round duration
                </p>
              )}
              {parameters.defaultRoundDuration < parameters.minimalRoundDuration && (
                <p className="text-sm text-amber-600">
                  ⚠️ Warning: Default round duration is below minimal constraint
                </p>
              )}
              {parameters.defaultRoundDuration > parameters.maximalRoundDuration && (
                <p className="text-sm text-amber-600">
                  ⚠️ Warning: Default round duration exceeds maximal constraint
                </p>
              )}
              {parameters.defaultGapBetweenRounds < parameters.minimalGapBetweenRounds && (
                <p className="text-sm text-amber-600">
                  ⚠️ Warning: Default gap is below minimal constraint
                </p>
              )}

            </CardContent>
          </Card>

          {/* Default Values Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <SettingsIcon className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <CardTitle>Default values</CardTitle>
                  <CardDescription>Default settings when creating new sessions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Round Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultRoundDuration">
                    Default round duration
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="defaultRoundDuration"
                      type="number"
                      min="1"
                      max="120"
                      value={parameters.defaultRoundDuration}
                      onChange={(e) => updateParameter('defaultRoundDuration', parseInt(e.target.value) || 10)}
                      className={`max-w-[120px] ${isFieldChanged('defaultRoundDuration') ? 'border-amber-400 border-2' : ''}`}
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                    {isFieldChanged('defaultRoundDuration') && (
                      <span className="text-xs text-amber-600">
                        (saved: {originalParameters.defaultRoundDuration})
                      </span>
                    )}
                  </div>
                </div>

                {/* Gap Between Rounds */}
                <div className="space-y-2">
                  <Label htmlFor="defaultGapBetweenRounds">
                    Default gap between rounds
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="defaultGapBetweenRounds"
                      type="number"
                      min="0"
                      max="60"
                      value={parameters.defaultGapBetweenRounds}
                      onChange={(e) => updateParameter('defaultGapBetweenRounds', parseInt(e.target.value) || 10)}
                      className={`max-w-[120px] ${isFieldChanged('defaultGapBetweenRounds') ? 'border-amber-400 border-2' : ''}`}
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                    {isFieldChanged('defaultGapBetweenRounds') && (
                      <span className="text-xs text-amber-600">
                        (saved: {originalParameters.defaultGapBetweenRounds})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Number of Rounds */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultNumberOfRounds">
                    Default number of rounds
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="defaultNumberOfRounds"
                      type="number"
                      min="1"
                      max="20"
                      value={parameters.defaultNumberOfRounds}
                      onChange={(e) => updateParameter('defaultNumberOfRounds', parseInt(e.target.value) || 1)}
                      className={`max-w-[120px] ${isFieldChanged('defaultNumberOfRounds') ? 'border-amber-400 border-2' : ''}`}
                    />
                    <span className="text-sm text-muted-foreground">rounds</span>
                    {isFieldChanged('defaultNumberOfRounds') && (
                      <span className="text-xs text-amber-600">
                        (saved: {originalParameters.defaultNumberOfRounds})
                      </span>
                    )}
                  </div>
                </div>

                {/* Group Size */}
                <div className="space-y-2">
                  <Label htmlFor="defaultGroupSize">
                    Default group size
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="defaultGroupSize"
                      type="number"
                      min="2"
                      max="10"
                      value={parameters.defaultGroupSize}
                      onChange={(e) => updateParameter('defaultGroupSize', parseInt(e.target.value) || 2)}
                      className={`max-w-[120px] ${isFieldChanged('defaultGroupSize') ? 'border-amber-400 border-2' : ''}`}
                    />
                    <span className="text-sm text-muted-foreground">participants</span>
                    {isFieldChanged('defaultGroupSize') && (
                      <span className="text-xs text-amber-600">
                        (saved: {originalParameters.defaultGroupSize})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Max Participants */}
              <div className="space-y-2">
                <Label htmlFor="defaultMaxParticipants">
                  Default max participants
                </Label>
                <p className="text-sm text-muted-foreground">
                  Used when "Limit participants" is enabled
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    id="defaultMaxParticipants"
                    type="number"
                    min="1"
                    max="10000"
                    value={parameters.defaultMaxParticipants}
                    onChange={(e) => updateParameter('defaultMaxParticipants', parseInt(e.target.value) || 20)}
                    className={`max-w-[120px] ${isFieldChanged('defaultMaxParticipants') ? 'border-amber-400 border-2' : ''}`}
                  />
                  <span className="text-sm text-muted-foreground">participants</span>
                  {isFieldChanged('defaultMaxParticipants') && (
                    <span className="text-xs text-amber-600">
                      (saved: {originalParameters.defaultMaxParticipants})
                    </span>
                  )}
                </div>
              </div>

              {/* Boolean Defaults */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-sm font-medium">Default toggles</h4>
                
                <div className={`flex items-center justify-between p-3 rounded-lg ${isFieldChanged('defaultLimitParticipants') ? 'bg-amber-50 border-2 border-amber-400' : ''}`}>
                  <div>
                    <Label htmlFor="defaultLimitParticipants" className="cursor-pointer">
                      Limit participants
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Whether participant limit is enabled by default
                      {isFieldChanged('defaultLimitParticipants') && (
                        <span className="text-xs text-amber-600 ml-2">
                          (saved: {originalParameters.defaultLimitParticipants ? 'ON' : 'OFF'})
                        </span>
                      )}
                    </p>
                  </div>
                  <input
                    id="defaultLimitParticipants"
                    type="checkbox"
                    checked={parameters.defaultLimitParticipants}
                    onChange={(e) => updateParameter('defaultLimitParticipants', e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>

                <div className={`flex items-center justify-between p-3 rounded-lg ${isFieldChanged('defaultLimitGroups') ? 'bg-amber-50 border-2 border-amber-400' : ''}`}>
                  <div>
                    <Label htmlFor="defaultLimitGroups" className="cursor-pointer">
                      Limit groups
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Whether group limit is enabled by default
                      {isFieldChanged('defaultLimitGroups') && (
                        <span className="text-xs text-amber-600 ml-2">
                          (saved: {originalParameters.defaultLimitGroups ? 'ON' : 'OFF'})
                        </span>
                      )}
                    </p>
                  </div>
                  <input
                    id="defaultLimitGroups"
                    type="checkbox"
                    checked={parameters.defaultLimitGroups}
                    onChange={(e) => updateParameter('defaultLimitGroups', e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Info Box */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="text-blue-500 flex-shrink-0">
                  ℹ️
                </div>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-blue-900">Important notes:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li><strong>Round timing:</strong> Backend calculations (matching, registration validation) apply changes immediately</li>
                    <li><strong>Default values:</strong> Applied only when creating new sessions</li>
                    <li><strong>⚠️ Frontend limitation:</strong> UI components still use hardcoded values (5/6 min) - full sync requires frontend refactor</li>
                    <li>Safety window should always be ≥ confirmation window to prevent race conditions</li>
                    <li>Changes to max matching+walking time affect when rounds are marked as "running" on backend</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}