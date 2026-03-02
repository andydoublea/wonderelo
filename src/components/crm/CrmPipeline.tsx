import { useState, useEffect, useCallback, useRef, type DragEvent } from 'react';
import { useNavigate } from 'react-router';
import {
  Kanban,
  Search,
  Loader2,
  Building2,
  Star,
  Clock,
  DollarSign,
  GripVertical,
  Filter,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { authenticatedFetch } from '../../utils/supabase/apiClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PipelineContact {
  id: string;
  name: string;
  email: string | null;
  company_name: string | null;
  lead_score: number | null;
  expected_value: number | null;
  source: string | null;
  days_in_stage: number;
  entered_stage_at: string;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  position: number;
  contacts: PipelineContact[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getScoreColor(score: number | null): string {
  if (score == null) return 'text-muted-foreground';
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-500';
}

/** Determine special styling for Won/Lost columns. */
function getStageStyles(name: string): { bg: string; border: string; headerBg: string } {
  const lower = name.toLowerCase();
  if (lower === 'won' || lower === 'closed won') {
    return {
      bg: 'bg-green-50/60',
      border: 'border-green-200',
      headerBg: 'bg-green-100/80',
    };
  }
  if (lower === 'lost' || lower === 'closed lost') {
    return {
      bg: 'bg-gray-50/60',
      border: 'border-gray-200',
      headerBg: 'bg-gray-100/80',
    };
  }
  return {
    bg: 'bg-white',
    border: 'border-border',
    headerBg: 'bg-muted/40',
  };
}

const ALL_SOURCES = 'all';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CrmPipeline() {
  const navigate = useNavigate();

  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState(ALL_SOURCES);

  // Drag state
  const [dragContactId, setDragContactId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // Scroll container ref
  const scrollRef = useRef<HTMLDivElement>(null);

  // ---- Data fetching -------------------------------------------------------

  const loadPipeline = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await authenticatedFetch('/crm/pipeline');
      if (response.ok) {
        const data = await response.json();
        // The endpoint returns stages with grouped contacts
        setStages(data.stages ?? data ?? []);
      } else {
        console.error('Failed to load pipeline:', response.status);
      }
    } catch (err) {
      console.error('Error loading pipeline:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPipeline();
  }, [loadPipeline]);

  // ---- Derived data --------------------------------------------------------

  // Collect unique sources for the filter
  const allSources = Array.from(
    new Set(
      stages
        .flatMap((s) => s.contacts)
        .map((c) => c.source)
        .filter(Boolean) as string[]
    )
  ).sort();

  // Apply search & source filter
  const filteredStages: PipelineStage[] = stages.map((stage) => ({
    ...stage,
    contacts: stage.contacts.filter((c) => {
      // Source filter
      if (sourceFilter !== ALL_SOURCES && c.source !== sourceFilter) return false;
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesEmail = c.email?.toLowerCase().includes(q);
        const matchesCompany = c.company_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesCompany) return false;
      }
      return true;
    }),
  }));

  // ---- Drag and drop -------------------------------------------------------

  const handleDragStart = (e: DragEvent<HTMLDivElement>, contactId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', contactId);
    setDragContactId(contactId);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStageId(stageId);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    // Only clear if we left the column (not when entering a child)
    const related = e.relatedTarget as HTMLElement | null;
    const current = e.currentTarget;
    if (!current.contains(related)) {
      setDragOverStageId(null);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetStageId: string) => {
    e.preventDefault();
    setDragOverStageId(null);

    const contactId = e.dataTransfer.getData('text/plain') || dragContactId;
    if (!contactId) return;

    // Find the source stage
    const sourceStage = stages.find((s) =>
      s.contacts.some((c) => c.id === contactId)
    );
    if (!sourceStage || sourceStage.id === targetStageId) {
      setDragContactId(null);
      return;
    }

    // Optimistic update: move the contact in local state
    setStages((prev) => {
      const contact = prev
        .flatMap((s) => s.contacts)
        .find((c) => c.id === contactId);
      if (!contact) return prev;

      return prev.map((stage) => {
        if (stage.id === sourceStage.id) {
          return {
            ...stage,
            contacts: stage.contacts.filter((c) => c.id !== contactId),
          };
        }
        if (stage.id === targetStageId) {
          return {
            ...stage,
            contacts: [
              ...stage.contacts,
              { ...contact, days_in_stage: 0 },
            ],
          };
        }
        return stage;
      });
    });

    setDragContactId(null);

    // Persist to backend
    setIsMoving(true);
    try {
      const response = await authenticatedFetch('/crm/pipeline/move', {
        method: 'PUT',
        body: JSON.stringify({
          contact_id: contactId,
          stage_id: targetStageId,
        }),
      });

      if (!response.ok) {
        console.error('Failed to move contact:', response.status);
        // Revert by reloading
        loadPipeline();
      }
    } catch (err) {
      console.error('Error moving contact:', err);
      loadPipeline();
    } finally {
      setIsMoving(false);
    }
  };

  const handleDragEnd = () => {
    setDragContactId(null);
    setDragOverStageId(null);
  };

  // ---- Render: Loading -----------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ---- Render: Empty state -------------------------------------------------

  if (stages.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <div className="mt-20 flex flex-col items-center text-center">
          <Kanban className="mb-4 size-10 text-muted-foreground/50" />
          <p className="text-lg font-medium">No pipeline stages configured</p>
          <p className="text-sm text-muted-foreground">
            Set up pipeline stages in CRM settings to get started.
          </p>
        </div>
      </div>
    );
  }

  // ---- Render: Main --------------------------------------------------------

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="shrink-0 border-b bg-white px-6 py-4 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
            <p className="text-sm text-muted-foreground">
              Drag contacts between stages to update their status.
              {isMoving && (
                <span className="ml-2 inline-flex items-center gap-1 text-primary">
                  <Loader2 className="size-3 animate-spin" />
                  Saving...
                </span>
              )}
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {allSources.length > 0 && (
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-44">
                <Filter className="mr-2 size-4 text-muted-foreground" />
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SOURCES}>All sources</SelectItem>
                {allSources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Kanban board — horizontal scroll */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden"
      >
        <div className="flex h-full gap-4 p-6 lg:px-8" style={{ minWidth: 'max-content' }}>
          {filteredStages.map((stage) => {
            const styles = getStageStyles(stage.name);
            const isDragTarget = dragOverStageId === stage.id;

            return (
              <div
                key={stage.id}
                className={`flex w-72 shrink-0 flex-col rounded-xl border transition-colors ${
                  styles.border
                } ${styles.bg} ${isDragTarget ? 'ring-2 ring-primary/40' : ''}`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Column header */}
                <div
                  className={`flex items-center gap-2 rounded-t-xl px-4 py-3 ${styles.headerBg}`}
                >
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color || '#6b7280' }}
                  />
                  <h2 className="text-sm font-semibold">{stage.name}</h2>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {stage.contacts.length}
                  </Badge>
                </div>

                {/* Contact cards — scrollable */}
                <div className="flex-1 space-y-2 overflow-y-auto p-3">
                  {stage.contacts.length === 0 && (
                    <p className="py-8 text-center text-xs text-muted-foreground">
                      No contacts in this stage
                    </p>
                  )}

                  {stage.contacts.map((contact) => (
                    <Card
                      key={contact.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, contact.id)}
                      onDragEnd={handleDragEnd}
                      className={`cursor-grab select-none transition-shadow hover:shadow-md active:cursor-grabbing ${
                        dragContactId === contact.id ? 'opacity-50' : ''
                      }`}
                      onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                    >
                      <CardContent className="p-3">
                        {/* Top row: grip + name */}
                        <div className="flex items-start gap-1.5">
                          <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {contact.name}
                            </p>
                            {contact.email && (
                              <p className="truncate text-xs text-muted-foreground">
                                {contact.email}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Company */}
                        {contact.company_name && (
                          <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="size-3" />
                            <span className="truncate">{contact.company_name}</span>
                          </div>
                        )}

                        {/* Bottom row: score, value, days */}
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          {contact.lead_score != null && (
                            <span
                              className={`flex items-center gap-0.5 font-medium ${getScoreColor(
                                contact.lead_score
                              )}`}
                            >
                              <Star className="size-3" />
                              {contact.lead_score}
                            </span>
                          )}
                          {contact.expected_value != null && (
                            <span className="flex items-center gap-0.5 text-muted-foreground">
                              <DollarSign className="size-3" />
                              {formatCurrency(contact.expected_value)}
                            </span>
                          )}
                          <span className="ml-auto flex items-center gap-0.5 text-muted-foreground">
                            <Clock className="size-3" />
                            {contact.days_in_stage}d
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
