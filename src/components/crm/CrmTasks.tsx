import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router';
import { apiBaseUrl, publicAnonKey } from '../../utils/supabase/info';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
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
} from '../ui/dialog';
import {
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  CheckSquare,
  ArrowUpDown,
  Calendar,
  AlertTriangle,
  X,
  Phone,
  Mail,
  MessageSquare,
  Monitor,
  MoreHorizontal,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TaskStatus = 'open' | 'completed' | 'overdue';
type TaskPriority = 'high' | 'medium' | 'low';
type TaskType = 'call' | 'email' | 'follow_up' | 'demo' | 'other';

interface CrmTask {
  id: string;
  title: string;
  description: string | null;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  contact_id: string | null;
  contact_name: string | null;
  completed_at: string | null;
  created_at: string;
}

interface ContactSearchResult {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

type SortBy = 'due_date' | 'priority' | 'created';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const headers: HeadersInit = {
  Authorization: `Bearer ${publicAnonKey}`,
  'Content-Type': 'application/json',
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
];

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'demo', label: 'Demo' },
  { value: 'other', label: 'Other' },
];

const PRIORITY_BADGE_STYLES: Record<TaskPriority, string> = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-gray-100 text-gray-700 border-gray-200',
};

const TYPE_BADGE_STYLES: Record<TaskType, string> = {
  call: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  email: 'bg-blue-100 text-blue-800 border-blue-200',
  follow_up: 'bg-purple-100 text-purple-800 border-purple-200',
  demo: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
};

const TYPE_ICONS: Record<TaskType, typeof Phone> = {
  call: Phone,
  email: Mail,
  follow_up: MessageSquare,
  demo: Monitor,
  other: MoreHorizontal,
};

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'due_date', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'created', label: 'Created' },
];

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'No due date';
  const d = new Date(dateStr);
  return d.toLocaleDateString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const dueDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
}

function contactDisplayName(c: ContactSearchResult): string {
  const parts = [c.first_name, c.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : c.email;
}

// ---------------------------------------------------------------------------
// Toast (lightweight inline)
// ---------------------------------------------------------------------------

interface Toast {
  id: number;
  message: string;
  variant: 'success' | 'error';
}

let toastIdCounter = 0;

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: 'success' | 'error') => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return { toasts, addToast };
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function TasksSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-md border p-3">
          <Skeleton className="size-5 rounded" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CrmTasks() {
  // -- Data
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -- Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortBy>('due_date');

  // -- Task dialog (add/edit)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CrmTask | null>(null);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    type: 'other' as TaskType,
    priority: 'medium' as TaskPriority,
    due_date: '',
    contact_id: null as string | null,
  });

  // -- Contact search in dialog
  const [contactSearch, setContactSearch] = useState('');
  const [contactResults, setContactResults] = useState<ContactSearchResult[]>([]);
  const [isSearchingContacts, setIsSearchingContacts] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactSearchResult | null>(
    null
  );
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const contactSearchRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -- Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // -- Toasts
  const { toasts, addToast } = useToasts();

  // ---------- Data fetching -------------------------------------------------

  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);

      const res = await fetch(`${apiBaseUrl}/crm/tasks?${params.toString()}`, {
        headers,
      });

      if (!res.ok) {
        throw new Error(`Failed to load tasks (${res.status})`);
      }

      const data = await res.json();
      setTasks(data.tasks ?? data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      console.error('Load tasks error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter, typeFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // ---------- Contact search ------------------------------------------------

  useEffect(() => {
    if (!contactSearch.trim() || selectedContact) {
      setContactResults([]);
      setShowContactDropdown(false);
      return;
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    searchTimerRef.current = setTimeout(async () => {
      setIsSearchingContacts(true);
      try {
        const res = await fetch(
          `${apiBaseUrl}/crm/contacts?search=${encodeURIComponent(contactSearch.trim())}&per_page=8`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          const results: ContactSearchResult[] = (data.contacts ?? data ?? []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (c: any) => ({
              id: c.id,
              email: c.email,
              first_name: c.first_name,
              last_name: c.last_name,
            })
          );
          setContactResults(results);
          setShowContactDropdown(results.length > 0);
        }
      } catch (err) {
        console.error('Contact search error:', err);
      } finally {
        setIsSearchingContacts(false);
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [contactSearch, selectedContact]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        contactSearchRef.current &&
        !contactSearchRef.current.contains(e.target as Node)
      ) {
        setShowContactDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ---------- Sorting -------------------------------------------------------

  function sortTasks(taskList: CrmTask[]): CrmTask[] {
    return [...taskList].sort((a, b) => {
      switch (sortBy) {
        case 'due_date': {
          // Tasks without due date go to the end
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        case 'priority': {
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        }
        case 'created': {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
        default:
          return 0;
      }
    });
  }

  const sortedTasks = sortTasks(tasks);

  // ---------- Complete task -------------------------------------------------

  async function handleToggleComplete(task: CrmTask) {
    const wasCompleted = task.status === 'completed';

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: wasCompleted ? 'open' : 'completed',
              completed_at: wasCompleted ? null : new Date().toISOString(),
            }
          : t
      )
    );

    try {
      const endpoint = wasCompleted
        ? `${apiBaseUrl}/crm/tasks/${task.id}/reopen`
        : `${apiBaseUrl}/crm/tasks/${task.id}/complete`;

      const res = await fetch(endpoint, { method: 'POST', headers });

      if (!res.ok) {
        // Revert
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? task : t))
        );
        addToast('Failed to update task.', 'error');
      }
    } catch {
      // Revert
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? task : t))
      );
      addToast('Network error updating task.', 'error');
    }
  }

  // ---------- Add / Edit task -----------------------------------------------

  function openAddTaskDialog() {
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      type: 'other',
      priority: 'medium',
      due_date: '',
      contact_id: null,
    });
    setSelectedContact(null);
    setContactSearch('');
    setTaskDialogOpen(true);
  }

  function openEditTaskDialog(task: CrmTask) {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description ?? '',
      type: task.type,
      priority: task.priority,
      due_date: task.due_date
        ? new Date(task.due_date).toISOString().split('T')[0]
        : '',
      contact_id: task.contact_id,
    });
    if (task.contact_id && task.contact_name) {
      setSelectedContact({
        id: task.contact_id,
        email: '',
        first_name: task.contact_name,
        last_name: null,
      });
      setContactSearch(task.contact_name);
    } else {
      setSelectedContact(null);
      setContactSearch('');
    }
    setTaskDialogOpen(true);
  }

  async function handleSaveTask() {
    if (!taskForm.title.trim()) {
      addToast('Task title is required.', 'error');
      return;
    }

    setIsSavingTask(true);
    try {
      const isEdit = !!editingTask;
      const url = isEdit
        ? `${apiBaseUrl}/crm/tasks/${editingTask!.id}`
        : `${apiBaseUrl}/crm/tasks`;
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || null,
        type: taskForm.type,
        priority: taskForm.priority,
        due_date: taskForm.due_date || null,
        contact_id: selectedContact?.id ?? taskForm.contact_id ?? null,
      };

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        addToast(isEdit ? 'Task updated.' : 'Task created.', 'success');
        setTaskDialogOpen(false);
        loadTasks();
      } else {
        const err = await res.json().catch(() => null);
        addToast(err?.error ?? 'Failed to save task.', 'error');
      }
    } catch (err) {
      addToast('Network error saving task.', 'error');
      console.error('Save task error:', err);
    } finally {
      setIsSavingTask(false);
    }
  }

  // ---------- Delete task ---------------------------------------------------

  async function handleDeleteTask(id: string) {
    try {
      const res = await fetch(`${apiBaseUrl}/crm/tasks/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        addToast('Task deleted.', 'success');
        setDeleteConfirmId(null);
        setTasks((prev) => prev.filter((t) => t.id !== id));
      } else {
        addToast('Failed to delete task.', 'error');
      }
    } catch {
      addToast('Network error deleting task.', 'error');
    }
  }

  // ---------- Render --------------------------------------------------------

  return (
    <div className="relative space-y-6 p-6">
      {/* Toast notifications */}
      <div className="fixed right-6 top-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-in slide-in-from-right rounded-md px-4 py-2.5 text-sm font-medium shadow-lg ${
              t.variant === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-destructive text-destructive-foreground'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-sm text-muted-foreground">
            Manage your CRM tasks and follow-ups
          </p>
        </div>
        <Button onClick={openAddTaskDialog}>
          <Plus className="size-4" />
          Add task
        </Button>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <ArrowUpDown className="size-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <AlertTriangle className="size-10 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={loadTasks}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !error && <TasksSkeleton />}

      {/* Empty state */}
      {!isLoading && !error && sortedTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <CheckSquare className="mb-4 size-10 text-muted-foreground/40" />
          <p className="text-lg font-medium">No tasks found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'Create your first task to get started.'}
          </p>
          {statusFilter === 'all' &&
            priorityFilter === 'all' &&
            typeFilter === 'all' && (
              <Button className="mt-4" onClick={openAddTaskDialog}>
                <Plus className="size-4" />
                Add task
              </Button>
            )}
        </div>
      )}

      {/* Task list */}
      {!isLoading && !error && sortedTasks.length > 0 && (
        <div className="space-y-2">
          {sortedTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const taskOverdue =
              !isCompleted && task.due_date && isOverdue(task.due_date);
            const TypeIcon = TYPE_ICONS[task.type] ?? MoreHorizontal;

            return (
              <div
                key={task.id}
                className={`flex items-center gap-3 rounded-lg border bg-white px-4 py-3 transition-colors hover:bg-accent/30 ${
                  isCompleted ? 'opacity-60' : ''
                } ${taskOverdue ? 'border-red-200' : ''}`}
              >
                {/* Checkbox */}
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={() => handleToggleComplete(task)}
                  className="shrink-0"
                />

                {/* Type icon */}
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/50">
                  <TypeIcon className="size-4 text-muted-foreground" />
                </div>

                {/* Title + description */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        isCompleted ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                  {task.description && (
                    <p
                      className={`mt-0.5 truncate text-xs ${
                        isCompleted
                          ? 'text-muted-foreground/60'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Type badge */}
                <Badge
                  variant="outline"
                  className={`shrink-0 text-[10px] ${TYPE_BADGE_STYLES[task.type]}`}
                >
                  {task.type.replace('_', ' ')}
                </Badge>

                {/* Priority badge */}
                <Badge
                  variant="outline"
                  className={`shrink-0 text-[10px] ${PRIORITY_BADGE_STYLES[task.priority]}`}
                >
                  {task.priority}
                </Badge>

                {/* Due date */}
                <div
                  className={`flex shrink-0 items-center gap-1 text-xs ${
                    taskOverdue
                      ? 'font-medium text-red-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Calendar className="size-3" />
                  {formatDate(task.due_date)}
                </div>

                {/* Contact link */}
                {task.contact_name && task.contact_id && (
                  <Link
                    to={`/crm/contacts/${task.contact_id}`}
                    className="shrink-0 text-xs font-medium text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {task.contact_name}
                  </Link>
                )}

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0"
                    onClick={() => openEditTaskDialog(task)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => setDeleteConfirmId(task.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit task dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Edit task' : 'New task'}
            </DialogTitle>
            <DialogDescription>
              {editingTask
                ? 'Update the task details below.'
                : 'Create a new CRM task.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Follow up with John about demo"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Description</label>
              <Textarea
                placeholder="Optional details..."
                rows={3}
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            {/* Type + Priority row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Type</label>
                <Select
                  value={taskForm.type}
                  onValueChange={(v) =>
                    setTaskForm((f) => ({ ...f, type: v as TaskType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.filter((o) => o.value !== 'all').map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Priority</label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(v) =>
                    setTaskForm((f) => ({ ...f, priority: v as TaskPriority }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.filter((o) => o.value !== 'all').map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due date */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Due date</label>
              <Input
                type="date"
                value={taskForm.due_date}
                onChange={(e) =>
                  setTaskForm((f) => ({ ...f, due_date: e.target.value }))
                }
              />
            </div>

            {/* Contact search */}
            <div ref={contactSearchRef} className="relative">
              <label className="mb-1.5 block text-sm font-medium">Contact</label>
              {selectedContact ? (
                <div className="flex items-center gap-2 rounded-md border bg-accent/30 px-3 py-2">
                  <span className="text-sm font-medium">
                    {contactDisplayName(selectedContact)}
                  </span>
                  {selectedContact.email && (
                    <span className="text-xs text-muted-foreground">
                      ({selectedContact.email})
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto size-6 p-0"
                    onClick={() => {
                      setSelectedContact(null);
                      setContactSearch('');
                      setTaskForm((f) => ({ ...f, contact_id: null }));
                    }}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Search contacts..."
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      onFocus={() => {
                        if (contactResults.length > 0) setShowContactDropdown(true);
                      }}
                    />
                    {isSearchingContacts && (
                      <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {showContactDropdown && (
                    <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow-lg">
                      {contactResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                          onClick={() => {
                            setSelectedContact(c);
                            setContactSearch(contactDisplayName(c));
                            setShowContactDropdown(false);
                            setTaskForm((f) => ({ ...f, contact_id: c.id }));
                          }}
                        >
                          <span className="font-medium">{contactDisplayName(c)}</span>
                          <span className="text-xs text-muted-foreground">
                            {c.email}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTaskDialogOpen(false)}
              disabled={isSavingTask}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveTask} disabled={isSavingTask}>
              {isSavingTask && <Loader2 className="size-4 animate-spin" />}
              {editingTask ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId) handleDeleteTask(deleteConfirmId);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
