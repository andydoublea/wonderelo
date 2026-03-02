import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Activity,
  Globe,
  Loader2,
  Users,
  CreditCard,
  ArrowRight,
  Percent,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { authenticatedFetch } from '../../utils/supabase/apiClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId = 'funnel' | 'revenue' | 'activity' | 'sources';

interface LeadFunnelStage {
  stage: string;
  count: number;
  color: string;
}

interface LeadFunnelData {
  stages: LeadFunnelStage[];
  totalLeads: number;
  wonCount: number;
  conversionRate: number;
}

interface SubscriptionTier {
  tier: string;
  count: number;
  price: number;
}

interface CreditTransaction {
  id: string;
  contact_name: string;
  type: string;
  amount: number;
  created_at: string;
}

interface RevenueData {
  activeSubscriptions: number;
  estimatedMrr: number;
  totalCreditTransactions: number;
  subscriptionsByTier: SubscriptionTier[];
  recentTransactions: CreditTransaction[];
}

interface ActivityTypeCount {
  type: string;
  count: number;
}

interface DailyActivity {
  date: string;
  count: number;
}

interface ActivityData {
  byType: ActivityTypeCount[];
  byDay: DailyActivity[];
  totalActivities: number;
}

interface SourceData {
  source: string;
  totalLeads: number;
  convertedCount: number;
  conversionRate: number;
}

interface SourcesData {
  sources: SourceData[];
  totalLeads: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
  { id: 'funnel', label: 'Lead Funnel', icon: TrendingUp },
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'sources', label: 'Sources', icon: Globe },
];

const STAGE_COLORS: Record<string, string> = {
  new: '#3b82f6',
  contacted: '#8b5cf6',
  qualified: '#f59e0b',
  proposal: '#f97316',
  negotiation: '#ec4899',
  won: '#22c55e',
  lost: '#ef4444',
};

const ACTIVITY_COLORS: Record<string, string> = {
  email_sent: '#3b82f6',
  email_received: '#22c55e',
  note: '#6b7280',
  call: '#f59e0b',
  system: '#8b5cf6',
  billing: '#f97316',
  signup: '#14b8a6',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ReportsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="py-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CSS Bar Chart Component
// ---------------------------------------------------------------------------

function HorizontalBar({
  label,
  value,
  maxValue,
  color,
  suffix = '',
  showValue = true,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  suffix?: string;
  showValue?: boolean;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-sm font-medium capitalize">{label}</span>
      <div className="flex-1">
        <div className="h-7 w-full overflow-hidden rounded bg-muted">
          <div
            className="flex h-full items-center rounded px-2 text-xs font-medium text-white transition-all duration-500"
            style={{
              width: `${Math.max(pct, 2)}%`,
              backgroundColor: color,
            }}
          >
            {showValue && pct > 15 && (
              <span>
                {value}
                {suffix}
              </span>
            )}
          </div>
        </div>
      </div>
      {showValue && pct <= 15 && (
        <span className="w-12 shrink-0 text-right text-sm text-muted-foreground">
          {value}
          {suffix}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Lead Funnel
// ---------------------------------------------------------------------------

function LeadFunnelTab() {
  const [data, setData] = useState<LeadFunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await authenticatedFetch('/crm/reports/leads');
        if (!response.ok) throw new Error(`Failed to fetch (${response.status})`);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <ReportsSkeleton />;
  if (error) return <p className="py-8 text-center text-destructive">{error}</p>;
  if (!data) return null;

  const maxCount = Math.max(...data.stages.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Won
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{data.wonCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.conversionRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead Pipeline Funnel</CardTitle>
          <CardDescription>Leads at each stage of the pipeline</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.stages.map((stage, index) => (
            <div key={stage.stage}>
              <HorizontalBar
                label={stage.stage}
                value={stage.count}
                maxValue={maxCount}
                color={stage.color || STAGE_COLORS[stage.stage] || '#6b7280'}
              />
              {/* Conversion arrow between stages */}
              {index < data.stages.length - 1 && data.stages[index].count > 0 && (
                <div className="ml-28 flex items-center gap-1 py-1 pl-3">
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {(
                      (data.stages[index + 1].count / data.stages[index].count) *
                      100
                    ).toFixed(0)}
                    % conversion
                  </span>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Revenue
// ---------------------------------------------------------------------------

function RevenueTab() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await authenticatedFetch('/crm/reports/revenue');
        if (!response.ok) throw new Error(`Failed to fetch (${response.status})`);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <ReportsSkeleton />;
  if (error) return <p className="py-8 text-center text-destructive">{error}</p>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <CreditCard className="size-4" />
                Active Subscriptions
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.activeSubscriptions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <DollarSign className="size-4" />
                Estimated MRR
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(data.estimatedMrr)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <Activity className="size-4" />
                Credit Transactions
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalCreditTransactions}</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subscriptions by Tier</CardTitle>
        </CardHeader>
        <CardContent>
          {data.subscriptionsByTier.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No subscription data available.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Subscribers</TableHead>
                  <TableHead className="text-right">Price / mo</TableHead>
                  <TableHead className="text-right">MRR Contribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.subscriptionsByTier.map((tier) => (
                  <TableRow key={tier.tier}>
                    <TableCell className="font-medium capitalize">{tier.tier}</TableCell>
                    <TableCell className="text-right">{tier.count}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tier.price)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(tier.count * tier.price)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentTransactions.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No recent transactions.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.contact_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          tx.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {tx.amount >= 0 ? '+' : ''}
                        {tx.amount}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDateShort(tx.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Activity
// ---------------------------------------------------------------------------

function ActivityTab() {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await authenticatedFetch('/crm/reports/activity');
        if (!response.ok) throw new Error(`Failed to fetch (${response.status})`);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <ReportsSkeleton />;
  if (error) return <p className="py-8 text-center text-destructive">{error}</p>;
  if (!data) return null;

  const maxTypeCount = Math.max(...data.byType.map((t) => t.count), 1);
  const maxDayCount = Math.max(...data.byDay.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Total */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Activities (last 30 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{data.totalActivities}</p>
        </CardContent>
      </Card>

      {/* Activity by type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity by Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.byType.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No activity data available.
            </p>
          ) : (
            data.byType.map((item) => (
              <HorizontalBar
                key={item.type}
                label={item.type.replace(/_/g, ' ')}
                value={item.count}
                maxValue={maxTypeCount}
                color={ACTIVITY_COLORS[item.type] || '#6b7280'}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Activity over time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Over Time</CardTitle>
          <CardDescription>Last 30 days, grouped by day</CardDescription>
        </CardHeader>
        <CardContent>
          {data.byDay.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No daily data available.
            </p>
          ) : (
            <div className="space-y-1">
              {data.byDay.map((day) => (
                <div key={day.date} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-xs text-muted-foreground">
                    {formatDate(day.date)}
                  </span>
                  <div className="flex-1">
                    <div className="h-5 w-full overflow-hidden rounded bg-muted">
                      <div
                        className="h-full rounded bg-blue-500 transition-all duration-300"
                        style={{
                          width: `${Math.max(
                            (day.count / maxDayCount) * 100,
                            day.count > 0 ? 2 : 0
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">
                    {day.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Sources
// ---------------------------------------------------------------------------

function SourcesTab() {
  const [data, setData] = useState<SourcesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await authenticatedFetch('/crm/reports/sources');
        if (!response.ok) throw new Error(`Failed to fetch (${response.status})`);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <ReportsSkeleton />;
  if (error) return <p className="py-8 text-center text-destructive">{error}</p>;
  if (!data) return null;

  const maxLeads = Math.max(...data.sources.map((s) => s.totalLeads), 1);

  const SOURCE_COLORS = [
    '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316',
  ];

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Leads from All Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{data.totalLeads}</p>
        </CardContent>
      </Card>

      {/* Source breakdown bars */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead Source Breakdown</CardTitle>
          <CardDescription>Leads by acquisition source</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.sources.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No source data available.
            </p>
          ) : (
            data.sources.map((source, idx) => (
              <HorizontalBar
                key={source.source}
                label={source.source || 'Unknown'}
                value={source.totalLeads}
                maxValue={maxLeads}
                color={SOURCE_COLORS[idx % SOURCE_COLORS.length]}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Detailed table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Source Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {data.sources.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No source data available.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Total Leads</TableHead>
                  <TableHead className="text-right">Converted (Won)</TableHead>
                  <TableHead className="text-right">Conversion Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.sources.map((source) => (
                  <TableRow key={source.source}>
                    <TableCell className="font-medium capitalize">
                      {source.source || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right">{source.totalLeads}</TableCell>
                    <TableCell className="text-right">{source.convertedCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span
                          className={
                            source.conversionRate >= 50
                              ? 'font-medium text-green-600'
                              : source.conversionRate >= 20
                                ? 'text-yellow-600'
                                : 'text-muted-foreground'
                          }
                        >
                          {source.conversionRate.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CrmReports() {
  const [activeTab, setActiveTab] = useState<TabId>('funnel');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Insights into your leads, revenue, activity, and acquisition sources
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'funnel' && <LeadFunnelTab />}
      {activeTab === 'revenue' && <RevenueTab />}
      {activeTab === 'activity' && <ActivityTab />}
      {activeTab === 'sources' && <SourcesTab />}
    </div>
  );
}
