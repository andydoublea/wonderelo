import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { apiBaseUrl, publicAnonKey } from '../../utils/supabase/info';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Globe,
  Users,
  Eye,
  FileText,
  Clock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  User,
  UserX,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Visitor {
  visitor_id: string;
  contact_id: string | null;
  contact_name: string | null;
  pages_visited: number;
  last_page_url: string;
  last_visit_at: string;
  first_visit_at: string;
}

interface VisitorJourneyEntry {
  page_url: string;
  page_title: string | null;
  duration_seconds: number | null;
  visited_at: string;
}

interface VisitorDetail {
  visitor_id: string;
  contact_id: string | null;
  contact_name: string | null;
  journey: VisitorJourneyEntry[];
}

interface VisitorsApiResponse {
  visitors: Visitor[];
  stats: {
    totalToday: number;
    uniqueThisWeek: number;
    mostVisitedPage: string | null;
  };
}

type LinkFilter = 'all' | 'linked' | 'anonymous';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const headers: HeadersInit = {
  Authorization: `Bearer ${publicAnonKey}`,
  'Content-Type': 'application/json',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  if (months < 12) return `${months}mo ago`;

  return `${Math.floor(months / 12)}y ago`;
}

function formatDateTime(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === 0) return '--';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hours}h ${remainMins}m` : `${hours}h`;
}

function truncateId(id: string, length = 8): string {
  if (id.length <= length) return id;
  return `${id.slice(0, length)}...`;
}

function extractPath(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CrmVisitors() {
  const navigate = useNavigate();

  // Data state
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<VisitorsApiResponse['stats'] | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [linkFilter, setLinkFilter] = useState<LinkFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Expanded row / journey state
  const [expandedVisitorId, setExpandedVisitorId] = useState<string | null>(null);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [journeyData, setJourneyData] = useState<VisitorDetail | null>(null);

  // -------------------------------------------------------------------------
  // Fetch visitors
  // -------------------------------------------------------------------------

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (linkFilter !== 'all') params.set('filter', linkFilter);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);

      const qs = params.toString();
      const url = `${apiBaseUrl}/crm/visitors${qs ? `?${qs}` : ''}`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Failed to fetch visitors');

      const data: VisitorsApiResponse = await res.json();
      setVisitors(data.visitors);
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching visitors:', err);
    } finally {
      setLoading(false);
    }
  }, [linkFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  // -------------------------------------------------------------------------
  // Fetch visitor journey
  // -------------------------------------------------------------------------

  const toggleVisitorJourney = async (visitorId: string) => {
    if (expandedVisitorId === visitorId) {
      setExpandedVisitorId(null);
      setJourneyData(null);
      return;
    }

    setExpandedVisitorId(visitorId);
    setJourneyLoading(true);
    setJourneyData(null);

    try {
      const res = await fetch(`${apiBaseUrl}/crm/visitors/${visitorId}`, {
        headers,
      });
      if (!res.ok) throw new Error('Failed to fetch visitor journey');

      const data: VisitorDetail = await res.json();
      setJourneyData(data);
    } catch (err) {
      console.error('Error fetching visitor journey:', err);
    } finally {
      setJourneyLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderStatCards = () => {
    if (!stats) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    const statItems = [
      {
        label: 'Visitors Today',
        value: stats.totalToday,
        icon: Eye,
        color: 'text-blue-600',
      },
      {
        label: 'Unique This Week',
        value: stats.uniqueThisWeek,
        icon: Users,
        color: 'text-emerald-600',
      },
      {
        label: 'Most Visited Page',
        value: stats.mostVisitedPage ? extractPath(stats.mostVisitedPage) : '--',
        icon: FileText,
        color: 'text-purple-600',
        isText: true,
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  {item.label}
                </div>
                <div
                  className={`font-bold ${item.isText ? 'text-sm truncate' : 'text-2xl'}`}
                  title={typeof item.value === 'string' ? item.value : undefined}
                >
                  {item.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderJourneyTimeline = () => {
    if (journeyLoading) {
      return (
        <div className="px-12 py-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-start">
              <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3 w-64" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!journeyData || journeyData.journey.length === 0) {
      return (
        <div className="px-12 py-4 text-sm text-muted-foreground">
          No page journey data available.
        </div>
      );
    }

    return (
      <div className="px-12 py-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Page Journey
        </p>
        <div className="space-y-0">
          {journeyData.journey.map((entry, idx) => (
            <div key={idx} className="flex gap-3">
              {/* Timeline dot & line */}
              <div className="flex flex-col items-center">
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                {idx < journeyData.journey.length - 1 && (
                  <div className="w-px flex-1 bg-border" />
                )}
              </div>

              {/* Entry content */}
              <div className="pb-4 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium truncate max-w-md">
                    {entry.page_title || extractPath(entry.page_url)}
                  </span>
                  {entry.duration_seconds !== null && entry.duration_seconds > 0 && (
                    <Badge variant="outline" className="text-xs font-normal">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDuration(entry.duration_seconds)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span className="truncate max-w-sm">{extractPath(entry.page_url)}</span>
                  <span>{formatDateTime(entry.visited_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLoadingSkeleton = () => (
    <TableBody>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  );

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Visitors</h1>
        <p className="text-muted-foreground text-sm">
          Track website visitors and their browsing journeys
        </p>
      </div>

      {/* Stats row */}
      {renderStatCards()}

      {/* Filters */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Globe className="h-4 w-4 text-muted-foreground" />

            {/* Linked/Anonymous toggle */}
            <Select
              value={linkFilter}
              onValueChange={(v) => setLinkFilter(v as LinkFilter)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All visitors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visitors</SelectItem>
                <SelectItem value="linked">Linked</SelectItem>
                <SelectItem value="anonymous">Anonymous</SelectItem>
              </SelectContent>
            </Select>

            {/* Date range */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">From</span>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[150px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">To</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[150px]"
              />
            </div>

            {(linkFilter !== 'all' || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLinkFilter('all');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-xs"
              >
                Clear filters
              </Button>
            )}

            <div className="ml-auto text-sm text-muted-foreground">
              {!loading && `${visitors.length} visitor${visitors.length === 1 ? '' : 's'}`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visitor table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Visitor ID</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="w-[80px] text-center">Pages</TableHead>
                <TableHead>Last Page</TableHead>
                <TableHead className="w-[120px]">Last Visit</TableHead>
                <TableHead className="w-[120px]">First Visit</TableHead>
              </TableRow>
            </TableHeader>

            {loading ? (
              renderLoadingSkeleton()
            ) : visitors.length === 0 ? (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Globe className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">
                      No visitors found
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Visitor data will appear here once tracking is active.
                    </p>
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              <TableBody>
                {visitors.map((visitor) => {
                  const isExpanded = expandedVisitorId === visitor.visitor_id;
                  return (
                    <>
                      <TableRow
                        key={visitor.visitor_id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleVisitorJourney(visitor.visitor_id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <code className="text-xs font-mono text-muted-foreground">
                              {truncateId(visitor.visitor_id)}
                            </code>
                          </div>
                        </TableCell>
                        <TableCell>
                          {visitor.contact_id && visitor.contact_name ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/crm/contacts/${visitor.contact_id}`);
                              }}
                              className="text-primary hover:underline font-medium text-sm"
                            >
                              {visitor.contact_name}
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                              <UserX className="h-3.5 w-3.5" />
                              Anonymous
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {visitor.pages_visited}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm truncate block max-w-[250px]" title={visitor.last_page_url}>
                            {extractPath(visitor.last_page_url)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatTimeAgo(visitor.last_visit_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatTimeAgo(visitor.first_visit_at)}
                          </span>
                        </TableCell>
                      </TableRow>

                      {/* Expanded journey row */}
                      {isExpanded && (
                        <TableRow key={`${visitor.visitor_id}-journey`}>
                          <TableCell colSpan={6} className="p-0 bg-muted/30">
                            {renderJourneyTimeline()}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
