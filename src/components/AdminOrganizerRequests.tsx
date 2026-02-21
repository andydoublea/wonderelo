import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ArrowLeft, ListOrdered, Plus, ChevronUp, ChevronDown, X, Loader2, RotateCcw } from 'lucide-react';
import { useDefaultRoundRules, useSaveDefaultRoundRules } from '../hooks/useAdminQueries';

export interface RoundRule {
  headline: string;
  text: string;
}

interface AdminOrganizerRequestsProps {
  accessToken: string;
  onBack: () => void;
}

export function AdminOrganizerRequests({ accessToken, onBack }: AdminOrganizerRequestsProps) {
  const navigate = useNavigate();

  // Default round rules
  const defaultRoundRules: RoundRule[] = [
    {
      headline: 'Initiate deep talks',
      text: 'Skip the weather talk — meaningful relationships emerge when you share views, values, and stories. Use our ice breakers if you want to.'
    },
    {
      headline: 'End round on time',
      text: 'It prevents you from getting stuck in one conversation and helps you reach your next round without delay.'
    },
    {
      headline: 'Do not ask for contacts',
      text: `After the round, you'll be asked if you want to exchange contacts. Sharing happens 15 minutes later, only if both parties agree.`
    }
  ];

  // React Query hooks
  const { data: serverRules, isLoading: isFetching, isFetching: isRefetching } = useDefaultRoundRules(accessToken);
  const saveMutation = useSaveDefaultRoundRules(accessToken);

  // Loaded rules from server or defaults
  const loadedRules: RoundRule[] = serverRules ?? defaultRoundRules;

  // Local editing state
  const [localRules, setLocalRules] = useState<RoundRule[] | null>(null);

  // Use local edits if present, otherwise server/default data
  const roundRules = localRules ?? loadedRules;

  const hasChanges = JSON.stringify(roundRules) !== JSON.stringify(loadedRules);

  const handleSave = async () => {
    saveMutation.mutate(roundRules, {
      onSuccess: () => {
        setLocalRules(null);
      },
    });
  };

  const handleReset = () => {
    setLocalRules(defaultRoundRules);
  };

  const addRule = () => {
    setLocalRules([...roundRules, { headline: '', text: '' }]);
  };

  const updateRule = (index: number, field: 'headline' | 'text', value: string) => {
    const newRules = [...roundRules];
    newRules[index] = { ...newRules[index], [field]: value };
    setLocalRules(newRules);
  };

  const removeRule = (index: number) => {
    const newRules = roundRules.filter((_, i) => i !== index);
    setLocalRules(newRules);
  };

  const moveRuleUp = (index: number) => {
    if (index === 0) return;
    const newRules = [...roundRules];
    [newRules[index - 1], newRules[index]] = [newRules[index], newRules[index - 1]];
    setLocalRules(newRules);
  };

  const moveRuleDown = (index: number) => {
    if (index === roundRules.length - 1) return;
    const newRules = [...roundRules];
    [newRules[index], newRules[index + 1]] = [newRules[index + 1], newRules[index]];
    setLocalRules(newRules);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ListOrdered className="h-5 w-5 text-primary" />
                <h1>Default round rules</h1>
                {(isFetching || isRefetching) && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                Manage default round rules shown to participants on event pages
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Round rules configuration</CardTitle>
            <CardDescription>
              These rules will be displayed to participants on the event page before they join rounds. All new organizers will use these as default rules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {roundRules.map((rule, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm mt-1">
                      {index + 1}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor={`rule-headline-${index}`}>Headline</Label>
                        <Input
                          id={`rule-headline-${index}`}
                          value={rule.headline}
                          onChange={(e) => updateRule(index, 'headline', e.target.value)}
                          placeholder="Enter rule headline"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor={`rule-text-${index}`}>Description</Label>
                        <Textarea
                          id={`rule-text-${index}`}
                          value={rule.text}
                          onChange={(e) => updateRule(index, 'text', e.target.value)}
                          placeholder="Enter rule description"
                          className="min-h-[80px]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveRuleUp(index)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveRuleDown(index)}
                        disabled={index === roundRules.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRule(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addRule}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add rule
            </Button>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to default
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
