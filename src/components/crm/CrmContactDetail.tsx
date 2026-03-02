import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { apiBaseUrl, publicAnonKey } from '../../utils/supabase/info';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  ArrowLeft,
  Pencil,
  Save,
  X,
  Plus,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  Globe,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  Loader2,
  Users,
  Building2,
  Tag,
  Star,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContactType = 'lead' | 'organizer' | 'participant' | 'prospect';

type LeadStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

type ActivityType = 'note' | 'call' | 'meeting' | 'email' | 'task' | 'system';

interface CrmContactDetail {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  contact_types: ContactType[];
  company_id: string | null;
  company_name: string | null;
  role: string | null;
  lead_stage: LeadStage | null;
  lead_score: number | null;
  tags: string[];
  notes: string | null;
  organizer_id: string | null;
  participant_id: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

interface WebsiteVisit {
  id: string;
  page_url: string;
  visited_at: string;
}

interface ContactDetailApiResponse {
  contact: CrmContactDetail;
  activities: Activity[];
  tasks: Task[];
  website_visits?: WebsiteVisit[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTACT_TYPE_COLORS: Record<ContactType, string> = {
  lead: 'bg-blue-100 text-blue-800 border-blue-200',
  organizer: 'bg-green-100 text-green-800 border-green-200',
  participant: 'bg-purple-100 text-purple-800 border-purple-200',
  prospect: 'bg-orange-100 text-orange-800 border-orange-200',
};

const LEAD_STAGE_OPTIONS: { value: LeadStage; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const ACTIVITY_TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'call', label: 'Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'email', label: 'Email' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const headers: HeadersInit = {
  Authorization: `Bearer ${publicAnonKey}`,
  'Content-Type': 'application/json',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(first: string | null, last: string | null): string {
  const f = first?.charAt(0)?.toUpperCase() ?? '';
  const l = last?.charAt(0)?.toUpperCase() ?? '';
  return f + l || '?';
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

function activityIcon(type: ActivityType) {
  switch (type) {
    case 'note':
      return <FileText className="h-4 w-4 text-gray-500" />;
    case 'call':
      return <Phone className="h-4 w-4 text-green-500" />;
    case 'meeting':
      return <Calendar className="h-4 w-4 text-blue-500" />;
    case 'email':
      return <Mail className="h-4 w-4 text-purple-500" />;
    case 'task':
      return <CheckCircle2 className="h-4 w-4 text-orange-500" />;
    case 'system':
      return <Globe className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CrmContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Data
  const [contact, setContact] = useState<CrmContactDetail | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [websiteVisits, setWebsiteVisits] = useState<WebsiteVisit[]>([]);

  // Loading / error
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editing
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<CrmContactDetail>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [editTagInput, setEditTagInput] = useState('');

  // Add note
  const [noteText, setNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Log activity
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logType, setLogType] = useState<ActivityType>('call');
  const [logDescription, setLogDescription] = useState('');
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);

  // Add task
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Send email dialog
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // -----------------------------------------------------------------------
  // Fetch contact detail
  // -----------------------------------------------------------------------

  const fetchContact = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/crm/contacts/${id}`, { headers });
      if (!res.ok) throw new Error(`Failed to load contact (${res.status})`);
      const data: ContactDetailApiResponse = await res.json();
      setContact(data.contact);
      setActivities(data.activities ?? []);
      setTasks(data.tasks ?? []);
      setWebsiteVisits(data.website_visits ?? []);
    } catch (err) {
      console.error('Error fetching contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contact');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  // -----------------------------------------------------------------------
  // Edit handlers
  // -----------------------------------------------------------------------

  const startEditing = () => {
    if (!contact) return;
    setEditData({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      role: contact.role,
      lead_stage: contact.lead_stage,
      lead_score: contact.lead_score,
      tags: [...(contact.tags ?? [])],
    });
    setEditTagInput('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({});
    setEditTagInput('');
  };

  const saveEdits = async () => {
    if (!contact) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${apiBaseUrl}/crm/contacts/${contact.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error(`Failed to update contact (${res.status})`);
      setIsEditing(false);
      fetchContact();
    } catch (err) {
      console.error('Error updating contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  const addEditTag = () => {
    const tag = editTagInput.trim().toLowerCase();
    if (tag && !(editData.tags ?? []).includes(tag)) {
      setEditData((prev) => ({ ...prev, tags: [...(prev.tags ?? []), tag] }));
    }
    setEditTagInput('');
  };

  const removeEditTag = (tag: string) => {
    setEditData((prev) => ({
      ...prev,
      tags: (prev.tags ?? []).filter((t) => t !== tag),
    }));
  };

  // -----------------------------------------------------------------------
  // Activity handlers
  // -----------------------------------------------------------------------

  const addNote = async () => {
    if (!noteText.trim() || !contact) return;
    setIsAddingNote(true);
    try {
      const res = await fetch(`${apiBaseUrl}/crm/activities`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contact_id: contact.id,
          type: 'note',
          title: 'Note',
          description: noteText.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed to add note');
      setNoteText('');
      fetchContact();
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setIsAddingNote(false);
    }
  };

  const logActivity = async () => {
    if (!logDescription.trim() || !contact) return;
    setIsLoggingActivity(true);
    try {
      const typeLabel = ACTIVITY_TYPE_OPTIONS.find((o) => o.value === logType)?.label ?? logType;
      const res = await fetch(`${apiBaseUrl}/crm/activities`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contact_id: contact.id,
          type: logType,
          title: typeLabel,
          description: logDescription.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed to log activity');
      setLogDescription('');
      setLogDialogOpen(false);
      fetchContact();
    } catch (err) {
      console.error('Error logging activity:', err);
    } finally {
      setIsLoggingActivity(false);
    }
  };

  // -----------------------------------------------------------------------
  // Email handler
  // -----------------------------------------------------------------------

  const sendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim() || !contact) return;
    setIsSendingEmail(true);
    try {
      const res = await fetch(`${apiBaseUrl}/crm/contacts/${contact.id}/email`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subject: emailSubject.trim(),
          body: emailBody.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed to send email');
      setEmailSubject('');
      setEmailBody('');
      setEmailDialogOpen(false);
      fetchContact();
    } catch (err) {
      console.error('Error sending email:', err);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // -----------------------------------------------------------------------
  // Task handlers
  // -----------------------------------------------------------------------

  const addTask = async () => {
    if (!newTask.title.trim() || !contact) return;
    setIsAddingTask(true);
    try {
      const body: Record<string, unknown> = {
        contact_id: contact.id,
        title: newTask.title.trim(),
        priority: newTask.priority,
      };
      if (newTask.description) body.description = newTask.description.trim();
      if (newTask.due_date) body.due_date = newTask.due_date;

      const res = await fetch(`${apiBaseUrl}/crm/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to add task');
      setNewTask({ title: '', description: '', due_date: '', priority: 'medium' });
      setTaskDialogOpen(false);
      fetchContact();
    } catch (err) {
      console.error('Error adding task:', err);
    } finally {
      setIsAddingTask(false);
    }
  };

  const toggleTaskComplete = async (task: Task) => {
    try {
      const res = await fetch(`${apiBaseUrl}/crm/tasks/${task.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      fetchContact();
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        {/* Back button skeleton */}
        <Skeleton className="h-9 w-24" />

        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-60 w-full rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Error state
  // -----------------------------------------------------------------------

  if (error || !contact) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <p className="text-destructive text-lg font-medium">
          {error ?? 'Contact not found'}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/crm/contacts')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to contacts
        </Button>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------

  const fullName =
    [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unnamed Contact';

  const openTasks = tasks.filter((t) => !t.completed);
  const emailActivities = activities.filter((a) => a.type === 'email');
  const recentVisits = websiteVisits.slice(0, 5);

  // -----------------------------------------------------------------------
  // JSX
  // -----------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        onClick={() => navigate('/crm/contacts')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to contacts
      </Button>

      {/* ================================================================ */}
      {/* Header                                                            */}
      {/* ================================================================ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="text-lg font-semibold">
              {getInitials(contact.first_name, contact.last_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{fullName}</h1>
            <p className="text-muted-foreground text-sm">{contact.email}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {contact.contact_types?.map((type) => (
                <Badge
                  key={type}
                  variant="outline"
                  className={`text-xs capitalize ${CONTACT_TYPE_COLORS[type]}`}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button variant="outline" onClick={startEditing}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={cancelEditing} disabled={isSaving}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={saveEdits} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* Main content: 2/3 left + 1/3 right                               */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* -------------------------------------------------------------- */}
        {/* LEFT COLUMN (2/3)                                               */}
        {/* -------------------------------------------------------------- */}
        <div className="lg:col-span-2 space-y-6">
          {/* ---- Activity Timeline ---- */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Activity Timeline</CardTitle>
              <div className="flex gap-2">
                <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Log activity
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Log Activity</DialogTitle>
                      <DialogDescription>
                        Record a call, meeting, or email interaction.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-1.5">
                        <label className="text-sm font-medium">Type</label>
                        <Select
                          value={logType}
                          onValueChange={(v) => setLogType(v as ActivityType)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTIVITY_TYPE_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          placeholder="What happened?"
                          value={logDescription}
                          onChange={(e) => setLogDescription(e.target.value)}
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setLogDialogOpen(false)}
                        disabled={isLoggingActivity}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={logActivity}
                        disabled={!logDescription.trim() || isLoggingActivity}
                      >
                        {isLoggingActivity && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Log activity
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Add note inline */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button
                  size="sm"
                  onClick={addNote}
                  disabled={!noteText.trim() || isAddingNote}
                  className="self-end"
                >
                  {isAddingNote ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <Separator />

              {/* Timeline list */}
              {activities.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  No activities recorded yet.
                </p>
              ) : (
                <div className="space-y-0">
                  {activities.map((activity, idx) => (
                    <div key={activity.id} className="relative flex gap-3 pb-4">
                      {/* Connector line */}
                      {idx < activities.length - 1 && (
                        <div className="bg-border absolute left-[11px] top-7 h-[calc(100%-12px)] w-px" />
                      )}
                      {/* Icon */}
                      <div className="bg-background relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border">
                        {activityIcon(activity.type)}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <span className="text-muted-foreground shrink-0 text-xs">
                            {timeAgo(activity.created_at)}
                          </span>
                        </div>
                        {activity.description && (
                          <p className="text-muted-foreground mt-0.5 text-sm line-clamp-3">
                            {activity.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ---- Email Section ---- */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Emails</CardTitle>
              <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Mail className="mr-1 h-3.5 w-3.5" />
                    Send email
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Send Email</DialogTitle>
                    <DialogDescription>
                      Send an email to {contact.email}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-1.5">
                      <label className="text-sm font-medium">Subject</label>
                      <Input
                        placeholder="Email subject..."
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-sm font-medium">Body</label>
                      <Textarea
                        placeholder="Write your email..."
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        rows={6}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setEmailDialogOpen(false)}
                      disabled={isSendingEmail}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={sendEmail}
                      disabled={!emailSubject.trim() || !emailBody.trim() || isSendingEmail}
                    >
                      {isSendingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {emailActivities.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No email activity yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {emailActivities.map((email) => (
                    <div
                      key={email.id}
                      className="flex items-start gap-3 rounded-md border p-3"
                    >
                      <Mail className="mt-0.5 h-4 w-4 text-purple-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-medium">{email.title}</p>
                          <span className="text-muted-foreground text-xs shrink-0">
                            {timeAgo(email.created_at)}
                          </span>
                        </div>
                        {email.description && (
                          <p className="text-muted-foreground mt-0.5 text-sm line-clamp-2">
                            {email.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* RIGHT COLUMN (1/3)                                              */}
        {/* -------------------------------------------------------------- */}
        <div className="space-y-6">
          {/* ---- Contact Info Card ---- */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                /* Editable fields */
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-muted-foreground text-xs">First name</label>
                      <Input
                        value={editData.first_name ?? ''}
                        onChange={(e) =>
                          setEditData((p) => ({ ...p, first_name: e.target.value }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-muted-foreground text-xs">Last name</label>
                      <Input
                        value={editData.last_name ?? ''}
                        onChange={(e) =>
                          setEditData((p) => ({ ...p, last_name: e.target.value }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-muted-foreground text-xs">Email</label>
                    <Input
                      value={editData.email ?? ''}
                      onChange={(e) =>
                        setEditData((p) => ({ ...p, email: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-muted-foreground text-xs">Phone</label>
                    <Input
                      value={editData.phone ?? ''}
                      onChange={(e) =>
                        setEditData((p) => ({ ...p, phone: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-muted-foreground text-xs">Role</label>
                    <Input
                      value={editData.role ?? ''}
                      onChange={(e) =>
                        setEditData((p) => ({ ...p, role: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-muted-foreground text-xs">Lead stage</label>
                    <Select
                      value={editData.lead_stage ?? ''}
                      onValueChange={(v) =>
                        setEditData((p) => ({ ...p, lead_stage: v as LeadStage }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_STAGE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-muted-foreground text-xs">Lead score</label>
                    <Input
                      type="number"
                      value={editData.lead_score ?? ''}
                      onChange={(e) =>
                        setEditData((p) => ({
                          ...p,
                          lead_score: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-muted-foreground text-xs">Tags</label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        placeholder="Add tag..."
                        value={editTagInput}
                        onChange={(e) => setEditTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addEditTag();
                          }
                        }}
                      />
                      <Button variant="secondary" size="sm" onClick={addEditTag}>
                        Add
                      </Button>
                    </div>
                    {(editData.tags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(editData.tags ?? []).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs gap-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeEditTag(tag)}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Read-only fields */
                <div className="space-y-3">
                  <InfoRow
                    icon={<Mail className="h-4 w-4" />}
                    label="Email"
                    value={contact.email}
                  />
                  <InfoRow
                    icon={<Phone className="h-4 w-4" />}
                    label="Phone"
                    value={contact.phone ?? '—'}
                  />
                  <InfoRow
                    icon={<Building2 className="h-4 w-4" />}
                    label="Company"
                    value={
                      contact.company_name ? (
                        <button
                          className="text-primary hover:underline text-sm"
                          onClick={() =>
                            navigate(`/crm/companies/${contact.company_id}`)
                          }
                        >
                          {contact.company_name}
                        </button>
                      ) : (
                        '—'
                      )
                    }
                  />
                  <InfoRow
                    icon={<Users className="h-4 w-4" />}
                    label="Role"
                    value={contact.role ?? '—'}
                  />
                  <InfoRow
                    icon={<Star className="h-4 w-4" />}
                    label="Lead stage"
                    value={
                      contact.lead_stage ? (
                        <Badge variant="outline" className="text-xs capitalize">
                          {contact.lead_stage}
                        </Badge>
                      ) : (
                        '—'
                      )
                    }
                  />
                  <InfoRow
                    icon={<Star className="h-4 w-4" />}
                    label="Lead score"
                    value={contact.lead_score != null ? String(contact.lead_score) : '—'}
                  />
                  <InfoRow
                    icon={<Tag className="h-4 w-4" />}
                    label="Tags"
                    value={
                      contact.tags?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )
                    }
                  />
                  <InfoRow
                    icon={<Clock className="h-4 w-4" />}
                    label="Created"
                    value={formatDateTime(contact.created_at)}
                  />
                  <InfoRow
                    icon={<Clock className="h-4 w-4" />}
                    label="Updated"
                    value={formatDateTime(contact.updated_at)}
                  />
                </div>
              )}

              {/* Cross-links to admin pages */}
              {(contact.organizer_id || contact.participant_id) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    {contact.organizer_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() =>
                          navigate(`/admin/organizers/${contact.organizer_id}`)
                        }
                      >
                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        View as Organizer
                      </Button>
                    )}
                    {contact.participant_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() =>
                          navigate(`/admin/participants/${contact.participant_id}`)
                        }
                      >
                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        View as Participant
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ---- Tasks Card ---- */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">
                Tasks
                {openTasks.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {openTasks.length}
                  </Badge>
                )}
              </CardTitle>
              <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>New Task</DialogTitle>
                    <DialogDescription>
                      Add a task for this contact.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-1.5">
                      <label className="text-sm font-medium">
                        Title <span className="text-destructive">*</span>
                      </label>
                      <Input
                        placeholder="Task title..."
                        value={newTask.title}
                        onChange={(e) =>
                          setNewTask((p) => ({ ...p, title: e.target.value }))
                        }
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        placeholder="Optional description..."
                        value={newTask.description}
                        onChange={(e) =>
                          setNewTask((p) => ({ ...p, description: e.target.value }))
                        }
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <label className="text-sm font-medium">Due date</label>
                        <Input
                          type="date"
                          value={newTask.due_date}
                          onChange={(e) =>
                            setNewTask((p) => ({ ...p, due_date: e.target.value }))
                          }
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <label className="text-sm font-medium">Priority</label>
                        <Select
                          value={newTask.priority}
                          onValueChange={(v) =>
                            setNewTask((p) => ({
                              ...p,
                              priority: v as 'low' | 'medium' | 'high',
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITY_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setTaskDialogOpen(false)}
                      disabled={isAddingTask}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={addTask}
                      disabled={!newTask.title.trim() || isAddingTask}
                    >
                      {isAddingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add task
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No tasks yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {/* Show open tasks first, then completed */}
                  {[...tasks]
                    .sort((a, b) => {
                      if (a.completed !== b.completed) return a.completed ? 1 : -1;
                      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    })
                    .map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-start gap-2.5 rounded-md border p-2.5 ${
                          task.completed ? 'opacity-60' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleTaskComplete(task)}
                          className="mt-0.5 shrink-0"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className="text-muted-foreground h-4 w-4" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${
                              task.completed ? 'line-through' : ''
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {task.due_date && (
                              <span className="text-muted-foreground text-xs">
                                Due {formatDate(task.due_date)}
                              </span>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize ${
                                task.priority === 'high'
                                  ? 'border-red-200 text-red-700'
                                  : task.priority === 'medium'
                                    ? 'border-yellow-200 text-yellow-700'
                                    : 'border-gray-200 text-gray-500'
                              }`}
                            >
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ---- Website Visits Card ---- */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Website Visits</CardTitle>
            </CardHeader>
            <CardContent>
              {recentVisits.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No visits recorded.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentVisits.map((visit) => (
                    <div
                      key={visit.id}
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                        <span className="text-sm truncate">{visit.page_url}</span>
                      </div>
                      <span className="text-muted-foreground text-xs shrink-0">
                        {timeAgo(visit.visited_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs">{label}</p>
        <div className="text-sm mt-0.5 break-words">{value}</div>
      </div>
    </div>
  );
}
