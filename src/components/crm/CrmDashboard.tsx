import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Users,
  UserPlus,
  CreditCard,
  GitBranch,
  AlertTriangle,
  Mail,
  MailOpen,
  StickyNote,
  Phone,
  Cpu,
  Receipt,
  UserCheck,
  Plus,
  CheckSquare,
  Kanban,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { apiBaseUrl, publicAnonKey } from '../../utils/supabase/info';

interface LeadStage {
  stage: string;
  count: number;
}

interface DashboardStats {
  totalContacts: number;
  newThisWeek: number;
  newThisMonth: number;
  activeSubscriptions: number;
  leadsByStage: LeadStage[];
  overdueTasks: number;
}

interface ActivityItem {
  id: string;
  type: 'email_sent' | 'email_received' | 'note' | 'call' | 'system' | 'billing' | 'signup';
  title: string;
  contactName: string;
  createdAt: string;
}

interface DashboardResponse extends DashboardStats {
  recentActivities: ActivityItem[];
}

const activityTypeConfig: Record<
  ActivityItem['type'],
  { icon: typeof Mail; color: string; bgColor: string }
> = {
  email_sent: { icon: Mail, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  email_received: { icon: MailOpen, color: 'text-green-600', bgColor: 'bg-green-50' },
  note: { icon: StickyNote, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  call: { icon: Phone, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  system: { icon: Cpu, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  billing: { icon: Receipt, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  signup: { icon: UserCheck, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
};

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity feed skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CrmDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${apiBaseUrl}/crm/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data (${response.status})`);
        }

        const data: DashboardResponse = await response.json();
        // API returns flat response — extract stats fields
        const { recentActivities: ra, ...statsData } = data;
        // leadsByStage may come as object { stageName: count } — normalize to array
        const rawStages = statsData.leadsByStage;
        const stagesArray: LeadStage[] = Array.isArray(rawStages)
          ? rawStages
          : Object.entries(rawStages || {}).map(([stage, count]) => ({
              stage,
              count: count as number,
            }));
        setStats({ ...statsData, leadsByStage: stagesArray });
        setActivities(ra ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <AlertTriangle className="size-10 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  const topStages = stats.leadsByStage.slice(0, 3);

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            CRM overview and recent activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/crm/contacts?action=new')}
          >
            <Plus className="size-4" />
            Add contact
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/crm/tasks?action=new')}
          >
            <CheckSquare className="size-4" />
            Create task
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/crm/pipeline')}
          >
            <Kanban className="size-4" />
            View pipeline
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total contacts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total contacts
              </CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalContacts.toLocaleString()}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              +{stats.newThisWeek} this week
            </p>
          </CardContent>
        </Card>

        {/* New this month */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                New this month
              </CardTitle>
              <UserPlus className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.newThisMonth.toLocaleString()}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              New contacts added
            </p>
          </CardContent>
        </Card>

        {/* Active subscriptions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active subscriptions
              </CardTitle>
              <CreditCard className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeSubscriptions.toLocaleString()}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Paying customers
            </p>
          </CardContent>
        </Card>

        {/* Leads by stage */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Leads by stage
              </CardTitle>
              <GitBranch className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topStages.length > 0 ? (
                topStages.map((stage) => (
                  <div key={stage.stage} className="flex items-center justify-between">
                    <span className="text-sm">{stage.stage}</span>
                    <Badge variant="secondary">{stage.count}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No leads yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Overdue tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue tasks
              </CardTitle>
              <AlertTriangle
                className={`size-4 ${
                  stats.overdueTasks > 0 ? 'text-destructive' : 'text-muted-foreground'
                }`}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                stats.overdueTasks > 0 ? 'text-destructive' : ''
              }`}
            >
              {stats.overdueTasks}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.overdueTasks > 0 ? 'Needs attention' : 'All caught up'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Last 20 activities across all contacts</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No recent activity
            </p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => {
                const config = activityTypeConfig[activity.type] ?? activityTypeConfig.system;
                const Icon = config.icon;

                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/50"
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}
                    >
                      <Icon className={`size-4 ${config.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.contactName}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatTimeAgo(activity.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
