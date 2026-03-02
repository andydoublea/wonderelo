import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Settings,
  Plus,
  Trash2,
  Loader2,
  GripVertical,
  Check,
  X,
  ExternalLink,
  Save,
  TestTube,
  Tag,
  Mail,
  Palette,
  ArrowUp,
  ArrowDown,
  Trophy,
  XCircle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Skeleton } from '../ui/skeleton';
import { authenticatedFetch } from '../../utils/supabase/apiClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  is_won: boolean;
  is_lost: boolean;
}

interface FreshdeskStatus {
  connected: boolean;
  domain: string | null;
  lastSyncAt: string | null;
}

interface CrmTag {
  id: string;
  name: string;
  color: string;
}

interface TemplateStats {
  category: string;
  count: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTempId(): string {
  return `temp_${Math.random().toString(36).substring(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Section: Pipeline Stages
// ---------------------------------------------------------------------------

function PipelineStagesSection() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchStages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/crm/pipeline/stages');
      if (!response.ok) throw new Error(`Failed to fetch stages (${response.status})`);
      const data = await response.json();
      setStages(data.stages ?? data ?? []);
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  const updateStage = (index: number, updates: Partial<PipelineStage>) => {
    setStages((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...updates } : s))
    );
    setHasChanges(true);
  };

  const addStage = () => {
    const maxOrder = stages.length > 0 ? Math.max(...stages.map((s) => s.sort_order)) : 0;
    setStages((prev) => [
      ...prev,
      {
        id: generateTempId(),
        name: '',
        color: '#6b7280',
        sort_order: maxOrder + 1,
        is_won: false,
        is_lost: false,
      },
    ]);
    setHasChanges(true);
  };

  const removeStage = (index: number) => {
    setStages((prev) => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const moveStage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    setStages((prev) => {
      const next = [...prev];
      const tempOrder = next[index].sort_order;
      next[index] = { ...next[index], sort_order: next[targetIndex].sort_order };
      next[targetIndex] = { ...next[targetIndex], sort_order: tempOrder };
      // Swap positions in array
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = stages.map((s, i) => ({
        id: s.id.startsWith('temp_') ? undefined : s.id,
        name: s.name,
        color: s.color,
        sort_order: i + 1,
        is_won: s.is_won,
        is_lost: s.is_lost,
      }));

      const response = await authenticatedFetch('/crm/pipeline/stages', {
        method: 'POST',
        body: JSON.stringify({ stages: payload }),
      });

      if (!response.ok) throw new Error(`Failed to save stages (${response.status})`);

      await fetchStages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pipeline Stages</CardTitle>
        <CardDescription>
          Configure the stages of your lead pipeline. Drag to reorder.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {error}
          </div>
        )}

        {stages
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((stage, index) => (
            <div
              key={stage.id}
              className="flex items-center gap-2 rounded-md border bg-card px-3 py-2"
            >
              {/* Reorder */}
              <div className="flex flex-col">
                <button
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  disabled={index === 0}
                  onClick={() => moveStage(index, 'up')}
                >
                  <ArrowUp className="size-3" />
                </button>
                <button
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  disabled={index === stages.length - 1}
                  onClick={() => moveStage(index, 'down')}
                >
                  <ArrowDown className="size-3" />
                </button>
              </div>

              {/* Color */}
              <div className="relative">
                <div
                  className="size-6 rounded border cursor-pointer"
                  style={{ backgroundColor: stage.color }}
                />
                <input
                  type="color"
                  value={stage.color}
                  onChange={(e) => updateStage(index, { color: e.target.value })}
                  className="absolute inset-0 size-6 cursor-pointer opacity-0"
                  title="Pick color"
                />
              </div>

              {/* Name */}
              <Input
                value={stage.name}
                onChange={(e) => updateStage(index, { name: e.target.value })}
                placeholder="Stage name..."
                className="h-8 flex-1"
              />

              {/* Order badge */}
              <Badge variant="outline" className="shrink-0 text-xs">
                #{stage.sort_order}
              </Badge>

              {/* Is Won toggle */}
              <div className="flex items-center gap-1">
                <Switch
                  checked={stage.is_won}
                  onCheckedChange={(checked) =>
                    updateStage(index, { is_won: checked, is_lost: checked ? false : stage.is_lost })
                  }
                />
                <span className="text-xs text-muted-foreground">Won</span>
              </div>

              {/* Is Lost toggle */}
              <div className="flex items-center gap-1">
                <Switch
                  checked={stage.is_lost}
                  onCheckedChange={(checked) =>
                    updateStage(index, { is_lost: checked, is_won: checked ? false : stage.is_won })
                  }
                />
                <span className="text-xs text-muted-foreground">Lost</span>
              </div>

              {/* Badges */}
              {stage.is_won && (
                <Badge className="shrink-0 bg-green-100 text-green-800 hover:bg-green-100">
                  <Trophy className="mr-1 size-3" />
                  Won
                </Badge>
              )}
              {stage.is_lost && (
                <Badge className="shrink-0 bg-red-100 text-red-800 hover:bg-red-100">
                  <XCircle className="mr-1 size-3" />
                  Lost
                </Badge>
              )}

              {/* Delete */}
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-destructive hover:text-destructive"
                onClick={() => removeStage(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}

        <div className="flex items-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={addStage}>
            <Plus className="mr-1 size-3" />
            Add Stage
          </Button>
          {hasChanges && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              Save Changes
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section: Freshdesk Integration
// ---------------------------------------------------------------------------

function FreshdeskSection() {
  const [status, setStatus] = useState<FreshdeskStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [domain, setDomain] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        setLoading(true);
        const response = await authenticatedFetch('/crm/settings/freshdesk/status');
        if (!response.ok) throw new Error(`Failed to fetch (${response.status})`);
        const data = await response.json();
        setStatus(data);
        if (data.domain) setDomain(data.domain);
      } catch {
        // Freshdesk may not be configured yet
        setStatus({ connected: false, domain: null, lastSyncAt: null });
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  const handleTestConnection = async () => {
    if (!apiKey || !domain) return;

    try {
      setTesting(true);
      setTestResult(null);

      const response = await authenticatedFetch('/crm/settings/freshdesk/test', {
        method: 'POST',
        body: JSON.stringify({ api_key: apiKey, domain }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({ ok: true, message: data.message ?? 'Connection successful' });
      } else {
        setTestResult({
          ok: false,
          message: data.error ?? `Connection failed (${response.status})`,
        });
      }
    } catch (err) {
      setTestResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!domain) return;

    try {
      setSaving(true);
      setSaveError(null);

      const response = await authenticatedFetch('/crm/settings/freshdesk', {
        method: 'PUT',
        body: JSON.stringify({ api_key: apiKey || undefined, domain }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save (${response.status})`);
      }

      setStatus((prev) => (prev ? { ...prev, connected: true, domain } : prev));
      setApiKey('');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Freshdesk Integration</CardTitle>
            <CardDescription>
              Sync support tickets with your CRM contacts
            </CardDescription>
          </div>
          {status && (
            <Badge
              variant={status.connected ? 'default' : 'secondary'}
              className={
                status.connected
                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
              }
            >
              {status.connected ? (
                <>
                  <CheckCircle className="mr-1 size-3" />
                  Connected
                </>
              ) : (
                <>
                  <XCircle className="mr-1 size-3" />
                  Not Connected
                </>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status?.lastSyncAt && (
          <p className="text-xs text-muted-foreground">
            Last synced: {new Date(status.lastSyncAt).toLocaleString()}
          </p>
        )}

        {saveError && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {saveError}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">API Key</label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={status?.connected ? '••••••••' : 'Enter Freshdesk API key'}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Domain</label>
          <div className="flex items-center gap-2">
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="yourcompany"
            />
            <span className="shrink-0 text-sm text-muted-foreground">.freshdesk.com</span>
          </div>
        </div>

        {testResult && (
          <div
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
              testResult.ok
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {testResult.ok ? (
              <CheckCircle className="size-4" />
            ) : (
              <AlertCircle className="size-4" />
            )}
            {testResult.message}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={testing || !apiKey || !domain}
          >
            {testing ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <TestTube className="mr-2 size-4" />
            )}
            Test Connection
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !domain}
          >
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section: Tags
// ---------------------------------------------------------------------------

function TagsSection() {
  const [tags, setTags] = useState<CrmTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#8b5cf6');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/crm/tags');
      if (!response.ok) throw new Error(`Failed to fetch tags (${response.status})`);
      const data = await response.json();
      setTags(data.tags ?? data ?? []);
    } catch {
      // Tags may not exist yet
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    try {
      setAdding(true);
      const response = await authenticatedFetch('/crm/tags', {
        method: 'POST',
        body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
      });

      if (!response.ok) throw new Error(`Failed to create tag (${response.status})`);

      setNewTagName('');
      setNewTagColor('#8b5cf6');
      fetchTags();
    } catch (err) {
      console.error('Failed to create tag:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      setDeletingId(tagId);
      const response = await authenticatedFetch(`/crm/tags/${tagId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error(`Failed to delete tag (${response.status})`);
      fetchTags();
    } catch (err) {
      console.error('Failed to delete tag:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tags</CardTitle>
        <CardDescription>Manage tags for organizing contacts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing tags */}
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags created yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="group flex items-center gap-1.5 rounded-full border px-3 py-1"
              >
                <div
                  className="size-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-sm">{tag.name}</span>
                <button
                  className="ml-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  onClick={() => handleDeleteTag(tag.id)}
                  disabled={deletingId === tag.id}
                >
                  {deletingId === tag.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <X className="size-3" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* Add tag */}
        <div className="flex items-center gap-2">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="New tag name..."
            className="h-8 flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTag();
            }}
          />
          <div className="relative">
            <div
              className="size-8 cursor-pointer rounded border"
              style={{ backgroundColor: newTagColor }}
            />
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="absolute inset-0 size-8 cursor-pointer opacity-0"
              title="Pick tag color"
            />
          </div>
          <Button
            size="sm"
            onClick={handleAddTag}
            disabled={adding || !newTagName.trim()}
          >
            {adding ? (
              <Loader2 className="mr-1 size-3 animate-spin" />
            ) : (
              <Plus className="mr-1 size-3" />
            )}
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Section: Email Templates
// ---------------------------------------------------------------------------

function EmailTemplatesSection() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<TemplateStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const response = await authenticatedFetch('/crm/email/templates/stats');
        if (!response.ok) throw new Error(`Failed to fetch (${response.status})`);
        const data = await response.json();
        setStats(data.stats ?? data ?? []);
      } catch {
        setStats([]);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const totalTemplates = stats.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Email Templates</CardTitle>
            <CardDescription>
              Manage email templates for campaigns and automation
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/crm/email')}
          >
            <Mail className="mr-2 size-4" />
            Manage Templates
            <ExternalLink className="ml-2 size-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-32" />
            ))}
          </div>
        ) : stats.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No templates yet.{' '}
            <button
              className="text-primary underline-offset-4 hover:underline"
              onClick={() => navigate('/crm/email')}
            >
              Create your first template
            </button>
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            <div className="rounded-md border bg-muted/30 px-4 py-2 text-center">
              <p className="text-2xl font-bold">{totalTemplates}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            {stats.map((stat) => (
              <div
                key={stat.category}
                className="rounded-md border bg-muted/30 px-4 py-2 text-center"
              >
                <p className="text-2xl font-bold">{stat.count}</p>
                <p className="text-xs capitalize text-muted-foreground">{stat.category}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CrmSettings() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">CRM Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure pipeline stages, integrations, tags, and templates
        </p>
      </div>

      {/* Pipeline Stages */}
      <PipelineStagesSection />

      {/* Freshdesk Integration */}
      <FreshdeskSection />

      {/* Tags */}
      <TagsSection />

      {/* Email Templates */}
      <EmailTemplatesSection />
    </div>
  );
}
