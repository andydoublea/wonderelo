import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, TrendingDown, Users, Mail, Loader2 } from 'lucide-react';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';

interface AdminRegistrationFunnelProps {
  accessToken: string;
  onBack: () => void;
}

interface FunnelStep {
  step: number;
  label: string;
  count: number;
}

interface IncompleteDraft {
  email: string;
  currentStep: number;
  formData: Record<string, any>;
  updatedAt: string;
}

export function AdminRegistrationFunnel({ accessToken, onBack }: AdminRegistrationFunnelProps) {
  const navigate = useNavigate();
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>([]);
  const [incompleteDrafts, setIncompleteDrafts] = useState<IncompleteDraft[]>([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFunnelData();
  }, []);

  const loadFunnelData = async () => {
    try {
      debugLog('[AdminFunnel] Loading funnel data');
      const response = await fetch(
        `${apiBaseUrl}/admin/registration-funnel`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'x-admin-token': accessToken,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to load funnel data');

      const data = await response.json();
      debugLog('[AdminFunnel] Data loaded:', data);
      setFunnelSteps(data.funnelSteps || []);
      setIncompleteDrafts(data.incompleteDrafts || []);
      setTotalCompleted(data.totalCompleted || 0);
    } catch (err) {
      errorLog('[AdminFunnel] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDropoffRate = (currentCount: number, previousCount: number) => {
    if (previousCount === 0) return 0;
    return Math.round(((previousCount - currentCount) / previousCount) * 100);
  };

  const stepLabels = ['Account details', 'Discovery source', 'Organization info', 'Completed'];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Admin
            </Button>
            <h1 className="text-xl font-bold">Registration Funnel</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-6 py-8 space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Funnel Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Conversion Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {funnelSteps.map((step, i) => {
                    const maxCount = funnelSteps[0]?.count || 1;
                    const widthPercent = Math.max(10, (step.count / maxCount) * 100);
                    const dropoff = i > 0 ? getDropoffRate(step.count, funnelSteps[i - 1].count) : 0;

                    return (
                      <div key={step.step}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            Step {step.step}: {stepLabels[step.step - 1] || `Step ${step.step}`}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{step.count}</span>
                            {i > 0 && dropoff > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                -{dropoff}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="h-8 bg-muted rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-primary/80 rounded-lg transition-all duration-500"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Completed */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-green-600">Completed registration</span>
                      <span className="text-sm font-bold text-green-600">{totalCompleted}</span>
                    </div>
                    <div className="h-8 bg-muted rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-lg transition-all duration-500"
                        style={{ width: `${Math.max(10, (totalCompleted / (funnelSteps[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Incomplete Drafts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Incomplete Registrations ({incompleteDrafts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {incompleteDrafts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No incomplete registrations found.</p>
                ) : (
                  <div className="space-y-3">
                    {incompleteDrafts.map((draft) => (
                      <div
                        key={draft.email}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{draft.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Stopped at step {draft.currentStep} ({stepLabels[draft.currentStep - 1] || `Step ${draft.currentStep}`})
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">Step {draft.currentStep}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(draft.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
