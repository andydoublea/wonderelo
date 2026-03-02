import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { apiBaseUrl, publicAnonKey } from '../../utils/supabase/info';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Skeleton } from '../ui/skeleton';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Tag,
  X,
  Loader2,
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

interface CrmContact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  contact_types: ContactType[];
  company_id: string | null;
  company_name: string | null;
  lead_stage: LeadStage | null;
  lead_score: number | null;
  tags: string[];
  last_activity_at: string | null;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
}

interface ContactsApiResponse {
  contacts: CrmContact[];
  total: number;
  page: number;
  per_page: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTACT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'lead', label: 'Lead' },
  { value: 'organizer', label: 'Organizer' },
  { value: 'participant', label: 'Participant' },
  { value: 'prospect', label: 'Prospect' },
];

const LEAD_STAGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Stages' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const CONTACT_TYPE_COLORS: Record<ContactType, string> = {
  lead: 'bg-blue-100 text-blue-800 border-blue-200',
  organizer: 'bg-green-100 text-green-800 border-green-200',
  participant: 'bg-purple-100 text-purple-800 border-purple-200',
  prospect: 'bg-orange-100 text-orange-800 border-orange-200',
};

const PER_PAGE = 50;

const headers: HeadersInit = {
  Authorization: `Bearer ${publicAnonKey}`,
  'Content-Type': 'application/json',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('sk-SK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—';
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CrmContacts() {
  const navigate = useNavigate();

  // Data
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Pagination
  const [page, setPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Loading / error
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Bulk action
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [bulkStage, setBulkStage] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Create form state
  const [newContact, setNewContact] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    contact_types: [] as ContactType[],
    company_id: '',
    lead_stage: '' as LeadStage | '',
    tags: [] as string[],
  });
  const [newTagInput, setNewTagInput] = useState('');

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -----------------------------------------------------------------------
  // Debounced search
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // -----------------------------------------------------------------------
  // Fetch contacts
  // -----------------------------------------------------------------------

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('per_page', String(PER_PAGE));
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (typeFilter !== 'all') params.set('contact_type', typeFilter);
      if (stageFilter !== 'all') params.set('lead_stage', stageFilter);
      if (tagsFilter.length > 0) params.set('tags', tagsFilter.join(','));

      const response = await fetch(
        `${apiBaseUrl}/crm/contacts?${params.toString()}`,
        { headers },
      );
      if (!response.ok) throw new Error(`Failed to fetch contacts (${response.status})`);
      const data: ContactsApiResponse = await response.json();
      setContacts(data.contacts ?? []);
      setTotalContacts(data.total ?? 0);
    } catch (err) {
      console.error('Error fetching CRM contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, typeFilter, stageFilter, tagsFilter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // -----------------------------------------------------------------------
  // Fetch companies (for create form dropdown)
  // -----------------------------------------------------------------------

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/crm/companies?per_page=200`, { headers });
        if (res.ok) {
          const data = await res.json();
          setCompanies(data.companies ?? []);
        }
      } catch {
        // non-critical — dropdown will just be empty
      }
    })();
  }, []);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const toggleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addTagFilter = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tagsFilter.includes(tag)) {
      setTagsFilter((prev) => [...prev, tag]);
      setPage(1);
    }
    setTagInput('');
  };

  const removeTagFilter = (tag: string) => {
    setTagsFilter((prev) => prev.filter((t) => t !== tag));
    setPage(1);
  };

  // Create contact
  const handleCreateContact = async () => {
    if (!newContact.email.trim()) return;
    setIsCreating(true);
    try {
      const body: Record<string, unknown> = {
        email: newContact.email.trim(),
      };
      if (newContact.first_name) body.first_name = newContact.first_name.trim();
      if (newContact.last_name) body.last_name = newContact.last_name.trim();
      if (newContact.phone) body.phone = newContact.phone.trim();
      if (newContact.contact_types.length > 0) body.contact_types = newContact.contact_types;
      if (newContact.company_id) body.company_id = newContact.company_id;
      if (newContact.lead_stage) body.lead_stage = newContact.lead_stage;
      if (newContact.tags.length > 0) body.tags = newContact.tags;

      const res = await fetch(`${apiBaseUrl}/crm/contacts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error || `Failed to create contact (${res.status})`,
        );
      }

      // Reset and close
      setNewContact({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        contact_types: [],
        company_id: '',
        lead_stage: '',
        tags: [],
      });
      setNewTagInput('');
      setCreateOpen(false);
      fetchContacts();
    } catch (err) {
      console.error('Error creating contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to create contact');
    } finally {
      setIsCreating(false);
    }
  };

  // Bulk actions
  const handleBulkTag = async () => {
    const tag = bulkTagInput.trim().toLowerCase();
    if (!tag || selectedIds.size === 0) return;
    setIsBulkUpdating(true);
    try {
      const res = await fetch(`${apiBaseUrl}/crm/contacts/bulk`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          contact_ids: Array.from(selectedIds),
          action: 'add_tag',
          tag,
        }),
      });
      if (!res.ok) throw new Error('Bulk tag failed');
      setBulkTagInput('');
      setSelectedIds(new Set());
      fetchContacts();
    } catch (err) {
      console.error('Bulk tag error:', err);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkStageUpdate = async () => {
    if (!bulkStage || selectedIds.size === 0) return;
    setIsBulkUpdating(true);
    try {
      const res = await fetch(`${apiBaseUrl}/crm/contacts/bulk`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          contact_ids: Array.from(selectedIds),
          action: 'update_lead_stage',
          lead_stage: bulkStage,
        }),
      });
      if (!res.ok) throw new Error('Bulk stage update failed');
      setBulkStage('');
      setSelectedIds(new Set());
      fetchContacts();
    } catch (err) {
      console.error('Bulk stage update error:', err);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Toggle contact type in create form
  const toggleNewContactType = (type: ContactType) => {
    setNewContact((prev) => ({
      ...prev,
      contact_types: prev.contact_types.includes(type)
        ? prev.contact_types.filter((t) => t !== type)
        : [...prev.contact_types, type],
    }));
  };

  const addNewTag = () => {
    const tag = newTagInput.trim().toLowerCase();
    if (tag && !newContact.tags.includes(tag)) {
      setNewContact((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setNewTagInput('');
  };

  const removeNewTag = (tag: string) => {
    setNewContact((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(totalContacts / PER_PAGE));

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const renderTypeBadge = (type: ContactType) => (
    <Badge
      key={type}
      variant="outline"
      className={`text-xs capitalize ${CONTACT_TYPE_COLORS[type]}`}
    >
      {type}
    </Badge>
  );

  const renderLoadingSkeleton = () => (
    <div className="space-y-3 p-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );

  // -----------------------------------------------------------------------
  // JSX
  // -----------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground text-sm">
            {totalContacts} contact{totalContacts !== 1 ? 's' : ''} total
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add contact
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Contact</DialogTitle>
              <DialogDescription>
                Add a new contact to the CRM. Email is required.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Email */}
              <div className="grid gap-1.5">
                <label htmlFor="new-email" className="text-sm font-medium">
                  Email <span className="text-destructive">*</span>
                </label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="email@example.com"
                  value={newContact.email}
                  onChange={(e) =>
                    setNewContact((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <label htmlFor="new-first" className="text-sm font-medium">
                    First name
                  </label>
                  <Input
                    id="new-first"
                    placeholder="First name"
                    value={newContact.first_name}
                    onChange={(e) =>
                      setNewContact((p) => ({ ...p, first_name: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="new-last" className="text-sm font-medium">
                    Last name
                  </label>
                  <Input
                    id="new-last"
                    placeholder="Last name"
                    value={newContact.last_name}
                    onChange={(e) =>
                      setNewContact((p) => ({ ...p, last_name: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="grid gap-1.5">
                <label htmlFor="new-phone" className="text-sm font-medium">
                  Phone
                </label>
                <Input
                  id="new-phone"
                  type="tel"
                  placeholder="+421..."
                  value={newContact.phone}
                  onChange={(e) =>
                    setNewContact((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>

              {/* Contact types multi-select */}
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Contact types</label>
                <div className="flex flex-wrap gap-2">
                  {(['lead', 'organizer', 'participant', 'prospect'] as ContactType[]).map(
                    (type) => {
                      const selected = newContact.contact_types.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleNewContactType(type)}
                          className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                            selected
                              ? CONTACT_TYPE_COLORS[type]
                              : 'border-border text-muted-foreground hover:bg-accent'
                          }`}
                        >
                          {type}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Company */}
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Company</label>
                <Select
                  value={newContact.company_id}
                  onValueChange={(v) =>
                    setNewContact((p) => ({ ...p, company_id: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lead stage */}
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Lead stage</label>
                <Select
                  value={newContact.lead_stage}
                  onValueChange={(v) =>
                    setNewContact((p) => ({
                      ...p,
                      lead_stage: v as LeadStage,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STAGE_OPTIONS.filter((o) => o.value !== 'all').map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addNewTag();
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={addNewTag}>
                    Add
                  </Button>
                </div>
                {newContact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {newContact.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeNewTag(tag)}
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

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateContact}
                disabled={!newContact.email.trim() || isCreating}
              >
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create contact
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Type filter */}
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Contact type" />
            </SelectTrigger>
            <SelectContent>
              {CONTACT_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Stage filter */}
          <Select value={stageFilter} onValueChange={(v) => { setStageFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Lead stage" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tags filter input */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Tag className="text-muted-foreground absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
              <Input
                placeholder="Filter by tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTagFilter();
                  }
                }}
                className="w-[160px] pl-8 text-sm"
              />
            </div>
            {tagsFilter.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTagFilter(tag)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="bg-muted/60 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-2">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Bulk add tag..."
              value={bulkTagInput}
              onChange={(e) => setBulkTagInput(e.target.value)}
              className="h-8 w-[160px] text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleBulkTag();
                }
              }}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={handleBulkTag}
              disabled={!bulkTagInput.trim() || isBulkUpdating}
            >
              <Tag className="mr-1 h-3 w-3" />
              Tag
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Select value={bulkStage} onValueChange={setBulkStage}>
              <SelectTrigger className="h-8 w-[150px] text-sm">
                <SelectValue placeholder="Set stage..." />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STAGE_OPTIONS.filter((o) => o.value !== 'all').map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleBulkStageUpdate}
              disabled={!bulkStage || isBulkUpdating}
            >
              Update
            </Button>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        renderLoadingSkeleton()
      ) : contacts.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">No contacts found</p>
          <p className="mt-1 text-sm">
            {debouncedSearch || typeFilter !== 'all' || stageFilter !== 'all' || tagsFilter.length > 0
              ? 'Try adjusting your filters.'
              : 'Create your first contact to get started.'}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      contacts.length > 0 && selectedIds.size === contacts.length
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Lead Stage</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => {
                    // Don't navigate if clicking the checkbox
                    if ((e.target as HTMLElement).closest('[data-slot="checkbox"]')) return;
                    navigate(`/crm/contacts/${contact.id}`);
                  }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(contact.id)}
                      onCheckedChange={() => toggleSelect(contact.id)}
                      aria-label={`Select ${contact.first_name ?? ''} ${contact.last_name ?? ''}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.contact_types?.map(renderTypeBadge)}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.company_name ?? '—'}
                  </TableCell>
                  <TableCell>
                    {contact.lead_stage ? (
                      <Badge variant="outline" className="text-xs capitalize">
                        {contact.lead_stage}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {timeAgo(contact.last_activity_at)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(contact.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
