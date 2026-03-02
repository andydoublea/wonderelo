import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { apiBaseUrl, publicAnonKey } from '../../utils/supabase/info';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Mail,
  FileText,
  Phone,
  Calendar,
  Cog,
  Globe,
  UserPlus,
  CreditCard,
  CheckSquare,
  Plus,
  Loader2,
  Search,
  ChevronDown,
  Activity,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActivityType =
  | 'email_sent'
  | 'email_received'
  | 'note'
  | 'call'
  | 'meeting'
  | 'system'
  | 'website_visit'
  | 'signup'
  | 'session'
  | 'billing'
  | 'task';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  contact_id: string | null;
  contact_name: string | null;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface ActivitiesApiResponse {
  activities: ActivityItem[];
  total: number;
  limit: number;
  offset: number;
}

interface ContactSearchResult {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LIMIT = 50;

const headers: HeadersInit = {
  Authorization: `Bearer ${publicAnonKey}`,
  'Content-Type': 'application/json',
};

const ACTIVITY_TYPE_OPTIONS: { value: ActivityType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Activities' },
  { value: 'email_sent', label: 'Email Sent' },
  { value: 'email_received', label: 'Email Received' },
  { value: 'note', label: 'Note' },
  { value: 'call', label: 'Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'system', label: 'System' },
  { value: 'website_visit', label: 'Website Visit' },
  { value: 'signup', label: 'Signup' },
  { value: 'session', label: 'Session' },
  { value: 'billing', label: 'Billing' },
  { value: 'task', label: 'Task' },
];

const LOGGABLE_TYPES: ActivityType[] = [
  'email_sent',
  'email_received',
  'note',
  'call',
  'meeting',
  'task',
];

const activityTypeConfig: Record<
  ActivityType,
  { icon: typeof Mail; color: string; bgColor: string; label: string }
> = {
  email_sent: {
    icon: Mail,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Email Sent',
  },
  email_received: {
    icon: Mail,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    label: 'Email Received',
  },
  note: {
    icon: FileText,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Note',
  },
  call: {
    icon: Phone,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Call',
  },
  meeting: {
    icon: Calendar,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Meeting',
  },
  system: {
    icon: Cog,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    label: 'System',
  },
  website_visit: {
    icon: Globe,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    label: 'Website Visit',
  },
  signup: {
    icon: UserPlus,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    label: 'Signup',
  },
  session: {
    icon: Calendar,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    label: 'Session',
  },
  billing: {
    icon: CreditCard,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    label: 'Billing',
  },
  task: {
    icon: CheckSquare,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    label: 'Task',
  },
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CrmActivities() {
  const navigate = useNavigate();

  // Data state
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all');

  // Log activity dialog state
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [logType, setLogType] = useState<ActivityType>('note');
  const [logTitle, setLogTitle] = useState('');
  const [logDescription, setLogDescription] = useState('');
  const [logContactId, setLogContactId] = useState<string | null>(null);
  const [logContactDisplay, setLogContactDisplay] = useState('');

  // Contact search state (for log dialog)
  const [contactSearch, setContactSearch] = useState('');
  const [contactResults, setContactResults] = useState<ContactSearchResult[]>([]);
  const [searchingContacts, setSearchingContacts] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const contactSearchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------------
  // Fetch activities
  // -------------------------------------------------------------------------

  const fetchActivities = useCallback(
    async (resetList: boolean) => {
      const currentOffset = resetList ? 0 : offset;
      if (resetList) setLoading(true);
      else setLoadingMore(true);

      try {
        const params = new URLSearchParams({
          limit: String(LIMIT),
          offset: String(currentOffset),
        });
        if (typeFilter !== 'all') {
          params.set('type', typeFilter);
        }

        const res = await fetch(`${apiBaseUrl}/crm/activities?${params}`, {
          headers,
        });
        if (!res.ok) throw new Error('Failed to fetch activities');

        const data: ActivitiesApiResponse = await res.json();

        if (resetList) {
          setActivities(data.activities);
          setOffset(data.activities.length);
        } else {
          setActivities((prev) => [...prev, ...data.activities]);
          setOffset((prev) => prev + data.activities.length);
        }
        setTotal(data.total);
      } catch (err) {
        console.error('Error fetching activities:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [typeFilter, offset],
  );

  // Initial load & filter changes
  useEffect(() => {
    fetchActivities(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  // -------------------------------------------------------------------------
  // Contact search (for log activity dialog)
  // -------------------------------------------------------------------------

  const searchContacts = useCallback(async (query: string) => {
    if (query.length < 2) {
      setContactResults([]);
      return;
    }
    setSearchingContacts(true);
    try {
      const res = await fetch(
        `${apiBaseUrl}/crm/contacts?search=${encodeURIComponent(query)}&per_page=10`,
        { headers },
      );
      if (!res.ok) throw new Error('Contact search failed');
      const data = await res.json();
      setContactResults(data.contacts ?? []);
    } catch (err) {
      console.error('Contact search error:', err);
      setContactResults([]);
    } finally {
      setSearchingContacts(false);
    }
  }, []);

  const handleContactSearchChange = (value: string) => {
    setContactSearch(value);
    setLogContactId(null);
    setLogContactDisplay('');
    setShowContactDropdown(true);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchContacts(value), 300);
  };

  const selectContact = (contact: ContactSearchResult) => {
    const display = [contact.first_name, contact.last_name]
      .filter(Boolean)
      .join(' ') || contact.email;
    setLogContactId(contact.id);
    setLogContactDisplay(display);
    setContactSearch(display);
    setShowContactDropdown(false);
    setContactResults([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        contactSearchRef.current &&
        !contactSearchRef.current.contains(e.target as Node)
      ) {
        setShowContactDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // -------------------------------------------------------------------------
  // Log activity submit
  // -------------------------------------------------------------------------

  const handleLogSubmit = async () => {
    if (!logTitle.trim()) return;
    setLogSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        type: logType,
        title: logTitle.trim(),
        description: logDescription.trim() || null,
      };
      if (logContactId) body.contact_id = logContactId;

      const res = await fetch(`${apiBaseUrl}/crm/activities`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to log activity');

      // Reset form & close dialog
      setLogType('note');
      setLogTitle('');
      setLogDescription('');
      setLogContactId(null);
      setLogContactDisplay('');
      setContactSearch('');
      setLogDialogOpen(false);

      // Refresh list
      fetchActivities(true);
    } catch (err) {
      console.error('Error logging activity:', err);
    } finally {
      setLogSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4 items-start">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-3 w-96" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderActivityItem = (activity: ActivityItem) => {
    const config = activityTypeConfig[activity.type] ?? activityTypeConfig.system;
    const Icon = config.icon;

    return (
      <div key={activity.id} className="flex gap-4 group">
        {/* Timeline connector */}
        <div className="flex flex-col items-center">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bgColor} flex-shrink-0`}
          >
            <Icon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div className="w-px flex-1 bg-border mt-2" />
        </div>

        {/* Content */}
        <div className="flex-1 pb-6 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-foreground">
                  {activity.title}
                </span>
                <Badge variant="outline" className="text-xs font-normal">
                  {config.label}
                </Badge>
              </div>

              {activity.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {activity.description}
                </p>
              )}

              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {activity.contact_name && activity.contact_id && (
                  <button
                    type="button"
                    onClick={() => navigate(`/crm/contacts/${activity.contact_id}`)}
                    className="text-primary hover:underline font-medium"
                  >
                    {activity.contact_name}
                  </button>
                )}
                <span>{formatTimeAgo(activity.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  const hasMore = activities.length < total;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activities</h1>
          <p className="text-muted-foreground text-sm">
            Track all interactions across contacts
          </p>
        </div>
        <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Log Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Log Activity</DialogTitle>
              <DialogDescription>
                Record an interaction with a contact.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Contact search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact</label>
                <div className="relative" ref={contactSearchRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    value={contactSearch}
                    onChange={(e) => handleContactSearchChange(e.target.value)}
                    className="pl-9"
                  />
                  {showContactDropdown && (contactResults.length > 0 || searchingContacts) && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-auto">
                      {searchingContacts && (
                        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching...
                        </div>
                      )}
                      {contactResults.map((c) => {
                        const name = [c.first_name, c.last_name]
                          .filter(Boolean)
                          .join(' ');
                        return (
                          <button
                            key={c.id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                            onClick={() => selectContact(c)}
                          >
                            <span className="font-medium">{name || c.email}</span>
                            {name && (
                              <span className="text-muted-foreground ml-2">
                                {c.email}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {logContactDisplay && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {logContactDisplay}
                  </p>
                )}
              </div>

              {/* Activity type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={logType}
                  onValueChange={(v) => setLogType(v as ActivityType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOGGABLE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {activityTypeConfig[t].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Activity title"
                  value={logTitle}
                  onChange={(e) => setLogTitle(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Optional details..."
                  value={logDescription}
                  onChange={(e) => setLogDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setLogDialogOpen(false)}
                disabled={logSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogSubmit}
                disabled={logSubmitting || !logTitle.trim()}
              >
                {logSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Log Activity
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as ActivityType | 'all')}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {typeFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTypeFilter('all')}
                className="text-xs"
              >
                Clear filter
              </Button>
            )}

            <div className="ml-auto text-sm text-muted-foreground">
              {!loading && `${total} activit${total === 1 ? 'y' : 'ies'}`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity timeline */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            renderLoadingSkeleton()
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No activities found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {typeFilter !== 'all'
                  ? 'Try changing the filter or log a new activity.'
                  : 'Log your first activity to get started.'}
              </p>
            </div>
          ) : (
            <div>
              {activities.map(renderActivityItem)}

              {/* Load more */}
              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={() => fetchActivities(false)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    )}
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
