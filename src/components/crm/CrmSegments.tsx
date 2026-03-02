import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Filter,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Users,
  Mail,
  ArrowLeft,
  X,
  Search,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
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
} from '../ui/dialog';
import { authenticatedFetch } from '../../utils/supabase/apiClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Segment {
  id: string;
  name: string;
  description: string | null;
  type: 'dynamic' | 'static';
  filters: FilterRow[] | null;
  contact_ids: string[] | null;
  contact_count: number;
  created_at: string;
  updated_at: string;
}

interface FilterRow {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string;
}

type FilterField = 'contact_type' | 'lead_stage' | 'tags' | 'company_size' | 'event_type';
type FilterOperator = 'equals' | 'contains';

interface SegmentContact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  contact_types: string[];
  lead_stage: string | null;
  tags: string[];
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

const FILTER_FIELDS: { value: FilterField; label: string }[] = [
  { value: 'contact_type', label: 'Contact Type' },
  { value: 'lead_stage', label: 'Lead Stage' },
  { value: 'tags', label: 'Tags' },
  { value: 'company_size', label: 'Company Size' },
  { value: 'event_type', label: 'Event Type' },
];

const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
];

const CONTACT_TYPES = ['lead', 'organizer', 'participant', 'prospect'];
const LEAD_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];
const EVENT_TYPES = ['speed_networking', 'workshop', 'conference', 'meetup'];

function getFieldOptions(field: FilterField): string[] | null {
  switch (field) {
    case 'contact_type':
      return CONTACT_TYPES;
    case 'lead_stage':
      return LEAD_STAGES;
    case 'company_size':
      return COMPANY_SIZES;
    case 'event_type':
      return EVENT_TYPES;
    case 'tags':
      return null; // free text
    default:
      return null;
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function SegmentsSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter Row Component
// ---------------------------------------------------------------------------

function FilterRowEditor({
  filter,
  onChange,
  onRemove,
}: {
  filter: FilterRow;
  onChange: (updated: FilterRow) => void;
  onRemove: () => void;
}) {
  const fieldOptions = getFieldOptions(filter.field);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={filter.field}
        onValueChange={(val) =>
          onChange({ ...filter, field: val as FilterField, value: '' })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Field" />
        </SelectTrigger>
        <SelectContent>
          {FILTER_FIELDS.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filter.operator}
        onValueChange={(val) =>
          onChange({ ...filter, operator: val as FilterOperator })
        }
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {FILTER_OPERATORS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {fieldOptions ? (
        <Select
          value={filter.value}
          onValueChange={(val) => onChange({ ...filter, value: val })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Value" />
          </SelectTrigger>
          <SelectContent>
            {fieldOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          value={filter.value}
          onChange={(e) => onChange({ ...filter, value: e.target.value })}
          placeholder="Value..."
          className="w-40"
        />
      )}

      <Button variant="ghost" size="icon" onClick={onRemove}>
        <X className="size-4" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CrmSegments() {
  const navigate = useNavigate();

  // List state
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View segment state
  const [viewingSegment, setViewingSegment] = useState<Segment | null>(null);
  const [segmentContacts, setSegmentContacts] = useState<SegmentContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<'dynamic' | 'static'>('dynamic');
  const [formFilters, setFormFilters] = useState<FilterRow[]>([]);
  const [formContactIds, setFormContactIds] = useState<string[]>([]);

  // Static contact search
  const [contactSearch, setContactSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ContactSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch segments
  // -------------------------------------------------------------------------

  const fetchSegments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch('/crm/segments');

      if (!response.ok) {
        throw new Error(`Failed to fetch segments (${response.status})`);
      }

      const data = await response.json();
      setSegments(data.segments ?? data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load segments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  // -------------------------------------------------------------------------
  // Fetch segment contacts
  // -------------------------------------------------------------------------

  const fetchSegmentContacts = useCallback(async (segment: Segment) => {
    try {
      setContactsLoading(true);
      setViewingSegment(segment);

      const response = await authenticatedFetch(`/crm/segments/${segment.id}/contacts`);

      if (!response.ok) {
        throw new Error(`Failed to fetch contacts (${response.status})`);
      }

      const data = await response.json();
      setSegmentContacts(data.contacts ?? data ?? []);
    } catch (err) {
      console.error('Failed to fetch segment contacts:', err);
      setSegmentContacts([]);
    } finally {
      setContactsLoading(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Search contacts (for static segments)
  // -------------------------------------------------------------------------

  const searchContacts = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await authenticatedFetch(
        `/crm/contacts?search=${encodeURIComponent(query)}&per_page=20`
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.contacts ?? data ?? []);
      }
    } catch {
      // ignore search errors
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (contactSearch) {
        searchContacts(contactSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [contactSearch, searchContacts]);

  // -------------------------------------------------------------------------
  // Create / Update segment
  // -------------------------------------------------------------------------

  const openCreateDialog = () => {
    setEditingSegment(null);
    setFormName('');
    setFormDescription('');
    setFormType('dynamic');
    setFormFilters([]);
    setFormContactIds([]);
    setContactSearch('');
    setSearchResults([]);
    setDialogOpen(true);
  };

  const openEditDialog = (segment: Segment) => {
    setEditingSegment(segment);
    setFormName(segment.name);
    setFormDescription(segment.description ?? '');
    setFormType(segment.type);
    setFormFilters(segment.filters ?? []);
    setFormContactIds(segment.contact_ids ?? []);
    setContactSearch('');
    setSearchResults([]);
    setDialogOpen(true);
  };

  const addFilterRow = () => {
    setFormFilters((prev) => [
      ...prev,
      { id: generateId(), field: 'contact_type', operator: 'equals', value: '' },
    ]);
  };

  const updateFilterRow = (index: number, updated: FilterRow) => {
    setFormFilters((prev) => prev.map((f, i) => (i === index ? updated : f)));
  };

  const removeFilterRow = (index: number) => {
    setFormFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleContactId = (id: string) => {
    setFormContactIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!formName.trim()) return;

    try {
      setSaving(true);

      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        type: formType,
        filters: formType === 'dynamic' ? formFilters : null,
        contact_ids: formType === 'static' ? formContactIds : null,
      };

      const endpoint = editingSegment
        ? `/crm/segments/${editingSegment.id}`
        : '/crm/segments';

      const method = editingSegment ? 'PUT' : 'POST';

      const response = await authenticatedFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to save segment (${response.status})`);
      }

      setDialogOpen(false);
      fetchSegments();
    } catch (err) {
      console.error('Failed to save segment:', err);
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Delete segment
  // -------------------------------------------------------------------------

  const handleDelete = async (segmentId: string) => {
    if (!confirm('Are you sure you want to delete this segment?')) return;

    try {
      setDeleting(segmentId);
      const response = await authenticatedFetch(`/crm/segments/${segmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete segment (${response.status})`);
      }

      if (viewingSegment?.id === segmentId) {
        setViewingSegment(null);
        setSegmentContacts([]);
      }

      fetchSegments();
    } catch (err) {
      console.error('Failed to delete segment:', err);
    } finally {
      setDeleting(null);
    }
  };

  // -------------------------------------------------------------------------
  // Send bulk email
  // -------------------------------------------------------------------------

  const handleBulkEmail = (segmentId: string) => {
    navigate(`/crm/email?segmentId=${segmentId}`);
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (loading) return <SegmentsSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchSegments}>Retry</Button>
      </div>
    );
  }

  // Viewing a specific segment's contacts
  if (viewingSegment) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setViewingSegment(null);
              setSegmentContacts([]);
            }}
          >
            <ArrowLeft className="mr-1 size-4" />
            Back
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">{viewingSegment.name}</h2>
              <Badge variant={viewingSegment.type === 'dynamic' ? 'default' : 'secondary'}
                className={
                  viewingSegment.type === 'dynamic'
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                    : 'bg-green-100 text-green-800 hover:bg-green-100'
                }
              >
                {viewingSegment.type}
              </Badge>
            </div>
            {viewingSegment.description && (
              <p className="mt-1 text-sm text-muted-foreground">{viewingSegment.description}</p>
            )}
          </div>
          <Button variant="outline" onClick={() => handleBulkEmail(viewingSegment.id)}>
            <Mail className="mr-2 size-4" />
            Send Bulk Email
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Contacts ({segmentContacts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contactsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : segmentContacts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No contacts match this segment.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Tags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segmentContacts.map((contact) => (
                    <TableRow
                      key={contact.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                    >
                      <TableCell className="font-medium">
                        {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{contact.email}</TableCell>
                      <TableCell>{contact.company_name ?? '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {contact.contact_types?.map((t) => (
                            <Badge key={t} variant="outline" className="text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact.lead_stage ? (
                          <Badge variant="secondary" className="text-xs">
                            {contact.lead_stage}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {contact.tags?.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="bg-purple-50 text-xs text-purple-700"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {contact.tags?.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{contact.tags.length - 3}
                            </span>
                          )}
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

  // Segment list view
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Segments</h1>
          <p className="text-sm text-muted-foreground">
            Group contacts by criteria for targeted outreach
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 size-4" />
          Create Segment
        </Button>
      </div>

      {/* Segment cards */}
      {segments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Filter className="mb-4 size-12 text-muted-foreground/50" />
            <p className="text-lg font-medium">No segments yet</p>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first segment to group contacts for bulk operations.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 size-4" />
              Create Segment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {segments.map((segment) => (
            <Card
              key={segment.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => fetchSegmentContacts(segment)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{segment.name}</CardTitle>
                    {segment.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {segment.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge
                    variant={segment.type === 'dynamic' ? 'default' : 'secondary'}
                    className={
                      segment.type === 'dynamic'
                        ? 'ml-2 shrink-0 bg-blue-100 text-blue-800 hover:bg-blue-100'
                        : 'ml-2 shrink-0 bg-green-100 text-green-800 hover:bg-green-100'
                    }
                  >
                    {segment.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="size-4" />
                    <span>{segment.contact_count} contacts</span>
                  </div>
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => handleBulkEmail(segment.id)}
                      title="Send bulk email"
                    >
                      <Mail className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => openEditDialog(segment)}
                      title="Edit segment"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(segment.id)}
                      disabled={deleting === segment.id}
                      title="Delete segment"
                    >
                      {deleting === segment.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSegment ? 'Edit Segment' : 'Create Segment'}
            </DialogTitle>
            <DialogDescription>
              {editingSegment
                ? 'Update the segment configuration.'
                : 'Define a segment to group contacts by criteria or manual selection.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. High-value leads"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description..."
              />
            </div>

            {/* Type toggle */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <div className="flex gap-2">
                <Button
                  variant={formType === 'dynamic' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormType('dynamic')}
                >
                  Dynamic
                </Button>
                <Button
                  variant={formType === 'static' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormType('static')}
                >
                  Static
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {formType === 'dynamic'
                  ? 'Contacts are automatically matched based on filter criteria.'
                  : 'Manually select specific contacts to include.'}
              </p>
            </div>

            {/* Dynamic: Filter builder */}
            {formType === 'dynamic' && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Filters</label>
                {formFilters.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No filters added yet. Add a filter to define matching criteria.
                  </p>
                )}
                {formFilters.map((filter, index) => (
                  <FilterRowEditor
                    key={filter.id}
                    filter={filter}
                    onChange={(updated) => updateFilterRow(index, updated)}
                    onRemove={() => removeFilterRow(index)}
                  />
                ))}
                <Button variant="outline" size="sm" onClick={addFilterRow}>
                  <Plus className="mr-1 size-3" />
                  Add Filter
                </Button>
              </div>
            )}

            {/* Static: Contact selector */}
            {formType === 'static' && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Select Contacts</label>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Search contacts by name or email..."
                    className="pl-9"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Search results */}
                {searchResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-md border">
                    {searchResults.map((contact) => {
                      const isSelected = formContactIds.includes(contact.id);
                      return (
                        <div
                          key={contact.id}
                          className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => toggleContactId(contact.id)}
                        >
                          <div
                            className={`flex size-4 items-center justify-center rounded border ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground/30'
                            }`}
                          >
                            {isSelected && (
                              <svg className="size-3" viewBox="0 0 12 12" fill="none">
                                <path
                                  d="M2 6l3 3 5-5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                          <span className="font-medium">
                            {[contact.first_name, contact.last_name]
                              .filter(Boolean)
                              .join(' ') || contact.email}
                          </span>
                          <span className="text-muted-foreground">{contact.email}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Selected count */}
                {formContactIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {formContactIds.length} contact{formContactIds.length !== 1 ? 's' : ''} selected
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setFormContactIds([])}
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formName.trim()}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingSegment ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
