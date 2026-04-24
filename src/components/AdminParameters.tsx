import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { TimelineVisualization } from './TimelineVisualization';
import { useAdminParameters, useSaveParameters } from '../hooks/useAdminQueries';
import { useMultiEnvParameters } from '../hooks/useMultiEnvParameters';
import { ENVIRONMENTS, getCurrentEnvironmentId, EnvironmentId } from '../utils/environments';
import { SystemParameters } from '../utils/systemParameters';

// Re-export for backward compatibility
export type { SystemParameters } from '../utils/systemParameters';

interface AdminParametersProps {
  accessToken: string;
  onBack: () => void;
}

const DEFAULT_PARAMETERS: SystemParameters = {
  confirmationWindowMinutes: 5,
  safetyWindowMinutes: 6,
  walkingTimeMinutes: 3,
  notificationEarlyMinutes: 10,
  notificationEarlyEnabled: true,
  notificationLateMinutes: 5,
  notificationLateEnabled: true,
  smsRoundEndedEnabled: true,
  minimalGapBetweenRounds: 10,
  minimalRoundDuration: 5,
  maximalRoundDuration: 240,
  minimalTimeToFirstRound: 10,
  findingTimeMinutes: 1,
  contactSharingDelayMinutes: 5,
  timePickerIntervalMinutes: 5,
  fireThreshold1: 5,
  fireThreshold2: 10,
  fireThreshold3: 15,
  defaultRoundDuration: 10,
  defaultGapBetweenRounds: 10,
  defaultNumberOfRounds: 1,
  defaultMaxParticipants: 20,
  defaultGroupSize: 2,
  defaultLimitParticipants: false,
  defaultLimitGroups: false,
};

// Parameter metadata for the table
interface ParamDef {
  key: keyof SystemParameters;
  label: string;
  section: string;
  type: 'number' | 'boolean';
  min?: number;
  max?: number;
  unit?: string;
  /** When set, display/edit as offset: value[key] - value[relativeToKey] */
  relativeToKey?: keyof SystemParameters;
}

const PARAM_SECTIONS: { id: string; label: string }[] = [
  { id: 'timing', label: 'Round timing' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'ui', label: 'UI indicators' },
  { id: 'validation', label: 'Validation constraints' },
  { id: 'defaults', label: 'Default values' },
  { id: 'toggles', label: 'Default toggles' },
];

const PARAM_DEFS: ParamDef[] = [
  // Round timing
  { key: 'confirmationWindowMinutes', label: 'Confirmation window', section: 'timing', type: 'number', min: 1, max: 30, unit: 'min' },
  { key: 'safetyWindowMinutes', label: 'Reg. closes before confirmation', section: 'timing', type: 'number', min: 0, max: 30, unit: 'min', relativeToKey: 'confirmationWindowMinutes' },
  { key: 'walkingTimeMinutes', label: 'Walking time', section: 'timing', type: 'number', min: 1, max: 10, unit: 'min' },
  { key: 'findingTimeMinutes', label: 'Finding time', section: 'timing', type: 'number', min: 1, max: 10, unit: 'min' },
  { key: 'contactSharingDelayMinutes', label: 'Contact sharing delay', section: 'timing', type: 'number', min: 0, max: 60, unit: 'min' },
  { key: 'timePickerIntervalMinutes', label: 'Time picker interval', section: 'timing', type: 'number', min: 1, max: 15, unit: 'min' },
  // Notifications
  { key: 'notificationEarlyEnabled', label: 'SMS before confirmation time — enabled', section: 'notifications', type: 'boolean' },
  { key: 'notificationEarlyMinutes', label: 'SMS before confirmation time — min before round', section: 'notifications', type: 'number', min: 1, max: 60, unit: 'min' },
  { key: 'notificationLateEnabled', label: 'SMS at confirmation time — enabled', section: 'notifications', type: 'boolean' },
  { key: 'notificationLateMinutes', label: 'SMS at confirmation time — min before round', section: 'notifications', type: 'number', min: 1, max: 30, unit: 'min' },
  { key: 'smsRoundEndedEnabled', label: 'SMS after networking — enabled', section: 'notifications', type: 'boolean' },
  // UI
  { key: 'fireThreshold1', label: 'Fire 1 threshold', section: 'ui', type: 'number', min: 1, max: 100 },
  { key: 'fireThreshold2', label: 'Fire 2 threshold', section: 'ui', type: 'number', min: 1, max: 100 },
  { key: 'fireThreshold3', label: 'Fire 3 threshold', section: 'ui', type: 'number', min: 1, max: 100 },
  // Validation
  { key: 'minimalGapBetweenRounds', label: 'Min gap between rounds', section: 'validation', type: 'number', min: 0, max: 30, unit: 'min' },
  { key: 'minimalTimeToFirstRound', label: 'Min time to first round', section: 'validation', type: 'number', min: 1, max: 60, unit: 'min' },
  { key: 'minimalRoundDuration', label: 'Min round duration', section: 'validation', type: 'number', min: 1, max: 60, unit: 'min' },
  { key: 'maximalRoundDuration', label: 'Max round duration', section: 'validation', type: 'number', min: 5, max: 360, unit: 'min' },
  // Defaults
  { key: 'defaultRoundDuration', label: 'Round duration', section: 'defaults', type: 'number', min: 1, max: 120, unit: 'min' },
  { key: 'defaultGapBetweenRounds', label: 'Gap between rounds', section: 'defaults', type: 'number', min: 0, max: 60, unit: 'min' },
  { key: 'defaultNumberOfRounds', label: 'Number of rounds', section: 'defaults', type: 'number', min: 1, max: 20 },
  { key: 'defaultMaxParticipants', label: 'Max participants', section: 'defaults', type: 'number', min: 1, max: 10000 },
  { key: 'defaultGroupSize', label: 'Group size', section: 'defaults', type: 'number', min: 2, max: 10 },
  // Toggles
  { key: 'defaultLimitParticipants', label: 'Limit participants', section: 'toggles', type: 'boolean' },
  { key: 'defaultLimitGroups', label: 'Limit groups', section: 'toggles', type: 'boolean' },
];

export function AdminParameters({ accessToken, onBack }: AdminParametersProps) {
  const currentEnvId = getCurrentEnvironmentId();

  // Current env data via authenticated admin endpoint
  const { data: serverParameters, isLoading: isFetching } = useAdminParameters(accessToken);
  const saveMutation = useSaveParameters(accessToken);

  // Multi-env data via public endpoints
  const envResults = useMultiEnvParameters();

  // Merge server data with defaults
  const loadedParams: SystemParameters = serverParameters
    ? { ...DEFAULT_PARAMETERS, ...serverParameters }
    : DEFAULT_PARAMETERS;

  const [localParameters, setLocalParameters] = useState<SystemParameters | null>(null);

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
        setLocalParameters(null);
      },
    });
  };

  const hasChanges = JSON.stringify(parameters) !== JSON.stringify(originalParameters);
  const isSaving = saveMutation.isPending;

  const updateParameter = <K extends keyof SystemParameters>(
    key: K,
    value: SystemParameters[K]
  ) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  // Get env parameters merged with defaults
  const getEnvParams = (envId: EnvironmentId): SystemParameters | null => {
    if (envId === currentEnvId) return parameters;
    const result = envResults.find(r => r.envId === envId);
    if (!result || !result.data) return null;
    return { ...DEFAULT_PARAMETERS, ...result.data };
  };

  // Check if a value differs across environments (any env has a different value)
  const isDifferent = (key: keyof SystemParameters): boolean => {
    const values = ENVIRONMENTS
      .map(env => getEnvParams(env.id))
      .filter((p): p is SystemParameters => p !== null)
      .map(p => p[key]);
    if (values.length < 2) return false;
    return values.some(v => v !== values[0]);
  };

  // Check if current env value changed from saved
  const isFieldChanged = (key: keyof SystemParameters): boolean => {
    return parameters[key] !== originalParameters[key];
  };

  const formatValue = (value: unknown, type: 'number' | 'boolean'): string => {
    if (type === 'boolean') return value ? 'ON' : 'OFF';
    return String(value ?? '—');
  };

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
                  {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <p className="text-sm text-muted-foreground">
                  Editing: <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border ${
                    ENVIRONMENTS.find(e => e.id === currentEnvId)?.badgeColor
                  }`}>
                    {ENVIRONMENTS.find(e => e.id === currentEnvId)?.icon} {ENVIRONMENTS.find(e => e.id === currentEnvId)?.label}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={isSaving || !hasChanges}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        <div className="flex gap-6">
          {/* Parameters Table */}
          <div className="flex-1 min-w-0">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground w-[220px]">Parameter</th>
                      {ENVIRONMENTS.map(env => {
                        const isCurrent = env.id === currentEnvId;
                        const result = envResults.find(r => r.envId === env.id);
                        const isOffline = !isCurrent && result && !result.isLoading && !result.data;
                        const isLoading = !isCurrent && result?.isLoading;

                        return (
                          <th key={env.id} className={`text-center py-3 px-3 font-medium min-w-[120px] ${
                            isCurrent ? 'bg-primary/5 border-x border-primary/20' : ''
                          }`}>
                            <div className="flex items-center justify-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${env.badgeColor}`}>
                                {env.icon} {env.label}
                              </span>
                              {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                              {isOffline && (
                                <span className="text-[10px] text-muted-foreground font-normal">(offline)</span>
                              )}
                            </div>
                            {isCurrent && (
                              <div className="text-[10px] text-primary font-normal mt-1">current</div>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {PARAM_SECTIONS.map(section => {
                      const sectionParams = PARAM_DEFS.filter(p => p.section === section.id);
                      if (sectionParams.length === 0) return null;

                      return (
                        <SectionBlock
                          key={section.id}
                          section={section}
                          params={sectionParams}
                          currentEnvId={currentEnvId}
                          parameters={parameters}
                          originalParameters={originalParameters}
                          getEnvParams={getEnvParams}
                          isDifferentRow={isDifferent}
                          isFieldChanged={isFieldChanged}
                          updateParameter={updateParameter}
                          formatValue={formatValue}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Info Box */}
            <Card className="border-blue-200 bg-blue-50 mt-4">
              <CardContent className="py-4">
                <div className="flex gap-3 text-sm text-blue-800">
                  <span className="flex-shrink-0">i</span>
                  <div>
                    <strong>Round timing</strong> changes apply immediately to backend.{' '}
                    <strong>Default values</strong> apply only to new sessions.{' '}
                    Other environments are read-only — switch to their URL to edit.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline sidebar */}
          <div className="w-[320px] flex-shrink-0">
            <div className="sticky top-[85px]">
              <TimelineVisualization parameters={parameters} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Section block with header row + parameter rows
function SectionBlock({
  section,
  params,
  currentEnvId,
  parameters,
  originalParameters,
  getEnvParams,
  isDifferentRow,
  isFieldChanged,
  updateParameter,
  formatValue,
}: {
  section: { id: string; label: string };
  params: ParamDef[];
  currentEnvId: EnvironmentId;
  parameters: SystemParameters;
  originalParameters: SystemParameters;
  getEnvParams: (envId: EnvironmentId) => SystemParameters | null;
  isDifferentRow: (key: keyof SystemParameters) => boolean;
  isFieldChanged: (key: keyof SystemParameters) => boolean;
  updateParameter: <K extends keyof SystemParameters>(key: K, value: SystemParameters[K]) => void;
  formatValue: (value: unknown, type: 'number' | 'boolean') => string;
}) {
  return (
    <>
      {/* Section header row */}
      <tr className="border-b bg-muted/30">
        <td colSpan={4} className="py-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {section.label}
        </td>
      </tr>

      {/* Parameter rows */}
      {params.map(param => (
        <tr key={param.key} className="border-b hover:bg-muted/20 transition-colors">
          {/* Label */}
          <td className={`py-2 px-4 text-sm ${isDifferentRow(param.key) ? 'bg-amber-50 border-l-2 border-l-amber-400' : ''}`}>
            <div className="flex items-center gap-1.5">
              <span>{param.label}</span>
              {param.unit && <span className="text-muted-foreground text-xs">({param.unit})</span>}
            </div>
          </td>

          {/* Environment cells */}
          {ENVIRONMENTS.map(env => {
            const isCurrent = env.id === currentEnvId;
            const envParams = getEnvParams(env.id);
            const rawValue = envParams ? envParams[param.key] : null;
            const changed = isCurrent && isFieldChanged(param.key);

            // For relative params, display as offset from the reference param
            const displayValue = (rawValue !== null && param.relativeToKey && envParams)
              ? (rawValue as number) - (envParams[param.relativeToKey] as number)
              : rawValue;

            return (
              <td key={env.id} className={`py-1.5 px-3 text-center ${
                isCurrent ? 'bg-primary/5 border-x border-primary/20' : ''
              } ${changed ? 'bg-amber-100' : ''}`}>
                {isCurrent ? (
                  // Editable cell for current environment
                  param.type === 'boolean' ? (
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={rawValue as boolean}
                        onChange={(e) => updateParameter(param.key, e.target.checked as any)}
                        className="h-4 w-4"
                      />
                    </div>
                  ) : (
                    <Input
                      type="number"
                      min={param.min}
                      max={param.max}
                      value={displayValue as number}
                      onChange={(e) => {
                        const inputVal = parseInt(e.target.value) || param.min || 0;
                        // For relative params, store absolute value (reference + offset)
                        const storedVal = param.relativeToKey
                          ? (parameters[param.relativeToKey] as number) + inputVal
                          : inputVal;
                        updateParameter(param.key, storedVal as any);
                      }}
                      className={`w-20 mx-auto text-center h-8 text-sm ${
                        changed ? 'border-amber-400 border-2' : ''
                      }`}
                    />
                  )
                ) : (
                  // Read-only cell for other environments
                  displayValue !== null ? (
                    <span className={`text-sm ${
                      param.type === 'boolean'
                        ? displayValue ? 'text-green-700 font-medium' : 'text-muted-foreground'
                        : 'text-muted-foreground'
                    }`}>
                      {formatValue(displayValue, param.type)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
