import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, Play, CheckCircle2, XCircle, ChevronDown, ChevronRight, ArrowLeft, Zap } from 'lucide-react';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';

interface Scenario {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface StepResult {
  step: string;
  ok: boolean;
  ms: number;
  error?: string;
  [key: string]: any;
}

interface TestResult {
  success: boolean;
  scenarioId: string;
  name: string;
  category: string;
  steps: StepResult[];
  totalMs: number;
  error?: string;
}

interface AdminSystemTestsProps {
  accessToken: string;
  onBack: () => void;
}

export function AdminSystemTests({ accessToken, onBack }: AdminSystemTestsProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [running, setRunning] = useState<Set<string>>(new Set());
  const [runningAll, setRunningAll] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loadingScenarios, setLoadingScenarios] = useState(true);

  // Load scenarios on mount
  useEffect(() => {
    fetch(`${apiBaseUrl}/test/e2e-scenarios`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` },
    })
      .then(r => r.json())
      .then(data => {
        setScenarios(data.scenarios || []);
        setLoadingScenarios(false);
      })
      .catch(() => setLoadingScenarios(false));
  }, []);

  const runTest = async (scenarioId: string) => {
    setRunning(prev => new Set(prev).add(scenarioId));
    try {
      const response = await fetch(`${apiBaseUrl}/test/e2e-matching`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioId }),
      });
      const result = await response.json();
      setResults(prev => ({ ...prev, [scenarioId]: result }));
    } catch (err: any) {
      setResults(prev => ({
        ...prev,
        [scenarioId]: { success: false, scenarioId, name: scenarioId, category: '', steps: [], totalMs: 0, error: err.message },
      }));
    } finally {
      setRunning(prev => { const n = new Set(prev); n.delete(scenarioId); return n; });
    }
  };

  const runAllTests = async () => {
    setRunningAll(true);
    setResults({});
    for (const scenario of scenarios) {
      await runTest(scenario.id);
    }
    setRunningAll(false);
  };

  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  // Group by category
  const categories = [...new Set(scenarios.map(s => s.category))];
  const passed = Object.values(results).filter(r => r.success).length;
  const failed = Object.values(results).filter(r => !r.success).length;
  const total = Object.keys(results).length;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" /> System Tests
          </h1>
          <p className="text-muted-foreground text-sm">Run E2E tests to verify matching flow</p>
        </div>
        <Button onClick={runAllTests} disabled={runningAll || loadingScenarios}>
          {runningAll ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running...</>
          ) : (
            <><Play className="h-4 w-4 mr-2" /> Run All Tests</>
          )}
        </Button>
      </div>

      {/* Summary bar */}
      {total > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-4">
              <Badge variant={failed === 0 ? 'default' : 'destructive'} className="text-sm px-3 py-1">
                {passed}/{scenarios.length} passed
              </Badge>
              {failed > 0 && (
                <span className="text-sm text-red-600 font-medium">{failed} failed</span>
              )}
              <span className="text-sm text-muted-foreground ml-auto">
                Total: {Object.values(results).reduce((sum, r) => sum + (r.totalMs || 0), 0)}ms
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {loadingScenarios ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading scenarios...</p>
        </div>
      ) : (
        categories.map(category => {
          const categoryScenarios = scenarios.filter(s => s.category === category);
          const categoryPassed = categoryScenarios.filter(s => results[s.id]?.success).length;
          const categoryRan = categoryScenarios.filter(s => results[s.id]).length;

          return (
            <div key={category} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold text-lg">{category}</h2>
                {categoryRan > 0 && (
                  <Badge variant={categoryPassed === categoryRan ? 'default' : 'destructive'} className="text-xs">
                    {categoryPassed}/{categoryScenarios.length}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                {categoryScenarios.map(scenario => {
                  const result = results[scenario.id];
                  const isRunning = running.has(scenario.id);
                  const isExpanded = expanded.has(scenario.id);

                  return (
                    <Card key={scenario.id} className={result ? (result.success ? 'border-green-200' : 'border-red-200') : ''}>
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-center gap-3">
                          {/* Status icon */}
                          <div className="w-6 flex-shrink-0">
                            {isRunning ? (
                              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            ) : result ? (
                              result.success ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                            )}
                          </div>

                          {/* Test info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{scenario.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{scenario.description}</div>
                          </div>

                          {/* Time */}
                          {result && (
                            <span className="text-xs text-muted-foreground">{result.totalMs}ms</span>
                          )}

                          {/* Actions */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => runTest(scenario.id)}
                            disabled={isRunning || runningAll}
                            className="flex-shrink-0"
                          >
                            {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                          </Button>

                          {result && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(scenario.id)}
                              className="flex-shrink-0"
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          )}
                        </div>

                        {/* Expanded step details */}
                        {isExpanded && result && (
                          <div className="mt-3 border-t pt-3">
                            {result.error && !result.steps?.length && (
                              <div className="text-sm text-red-600 mb-2">Error: {result.error}</div>
                            )}
                            <div className="space-y-1">
                              {result.steps?.map((step, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs font-mono">
                                  <span className={step.ok ? 'text-green-600' : 'text-red-600'}>
                                    {step.ok ? '✓' : '✗'}
                                  </span>
                                  <span className="w-40 truncate">{step.step}</span>
                                  <span className="text-muted-foreground w-12 text-right">{step.ms}ms</span>
                                  {step.error && (
                                    <span className="text-red-600 truncate flex-1">{step.error}</span>
                                  )}
                                  {!step.error && step.ok && (
                                    <span className="text-muted-foreground truncate flex-1">
                                      {Object.entries(step)
                                        .filter(([k]) => !['step', 'ok', 'ms'].includes(k))
                                        .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
                                        .join(' ')
                                        .substring(0, 100)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
