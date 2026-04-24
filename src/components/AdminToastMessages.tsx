import { useMemo, useState, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import { ArrowLeft, Save, RefreshCw, Loader2, Search, Play, Bell, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { useToastOverrides, useSaveToastOverrides } from '../hooks/useAdminQueries';
import { TOAST_CATALOG, TOAST_CATALOG_STATS, type ToastCatalogEntry } from '../utils/toastCatalog.generated';
import {
  setDraftOverride,
  clearDraftOverrides,
  setToastOverrides,
} from '../utils/toastOverrides';

interface Props {
  accessToken: string;
  onBack: () => void;
}

const TYPE_META: Record<string, { label: string; icon: any; color: string }> = {
  success: { label: 'Success', icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-300' },
  error: { label: 'Error', icon: AlertCircle, color: 'bg-red-100 text-red-800 border-red-300' },
  warning: { label: 'Warning', icon: AlertTriangle, color: 'bg-amber-100 text-amber-800 border-amber-300' },
  info: { label: 'Info', icon: Info, color: 'bg-blue-100 text-blue-800 border-blue-300' },
  default: { label: 'Default', icon: Bell, color: 'bg-gray-100 text-gray-800 border-gray-300' },
  message: { label: 'Message', icon: Bell, color: 'bg-gray-100 text-gray-800 border-gray-300' },
  loading: { label: 'Loading', icon: Loader2, color: 'bg-gray-100 text-gray-800 border-gray-300' },
};

export function AdminToastMessages({ accessToken, onBack }: Props) {
  const { data: serverOverrides, isLoading, isFetching } = useToastOverrides(accessToken);
  const saveMutation = useSaveToastOverrides(accessToken);

  // Local draft: { originalMessage -> overrideText }. Keyed by message text so one edit
  // updates every call-site that uses the same default text.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [openPages, setOpenPages] = useState<string[]>([]);

  // Sync drafts into the runtime override store so "Test" fires with draft text
  useEffect(() => {
    // Every tick, push draft state into the runtime
    for (const [orig, override] of Object.entries(drafts)) {
      setDraftOverride(orig, override);
    }
    return () => {
      // unmount → drop in-flight drafts so other pages see clean state
      clearDraftOverrides();
    };
  }, [drafts]);

  // Merged view: starts from saved server overrides, local drafts win
  const effective = useMemo(() => ({ ...(serverOverrides ?? {}), ...drafts }), [serverOverrides, drafts]);

  const hasChanges = Object.keys(drafts).length > 0;

  // Unique entries keyed by message (so duplicate default texts collapse into one row,
  // but we still surface every call-site for context).
  const grouped = useMemo(() => {
    const buckets = new Map<string, ToastCatalogEntry[]>();
    for (const entry of TOAST_CATALOG) {
      const key = `${entry.page}::${entry.message}::${entry.type}`;
      const arr = buckets.get(key);
      if (arr) arr.push(entry);
      else buckets.set(key, [entry]);
    }
    return Array.from(buckets.values());
  }, []);

  const filteredByPage = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byPage = new Map<string, ToastCatalogEntry[][]>();
    for (const group of grouped) {
      const first = group[0];
      if (q) {
        const hay = `${first.message} ${first.type} ${first.component} ${first.page} ${first.context ?? ''} ${group.map(e => e.filePath).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      const list = byPage.get(first.page) ?? [];
      list.push(group);
      byPage.set(first.page, list);
    }
    // Sort page names, then within each page sort by type then message
    return Array.from(byPage.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([page, groups]) => ({
        page,
        groups: groups.sort((a, b) => {
          const ta = a[0].type, tb = b[0].type;
          if (ta !== tb) return ta.localeCompare(tb);
          return a[0].message.localeCompare(b[0].message);
        }),
      }));
  }, [grouped, search]);

  const totalGroups = grouped.length;
  const totalWithOverrides = Object.keys(effective).length;

  const updateDraft = (originalText: string, newText: string) => {
    setDrafts(prev => {
      const next = { ...prev };
      const serverVal = serverOverrides?.[originalText];
      // Normalize: empty or equal-to-default means "remove override"
      if (newText === '' || newText === originalText) {
        // If there's a saved server override, keep the draft (to clear it on save as '')
        if (serverVal && serverVal !== originalText) {
          next[originalText] = originalText; // sentinel: "revert to default"
        } else {
          delete next[originalText];
        }
      } else {
        next[originalText] = newText;
      }
      return next;
    });
  };

  const currentValueFor = (originalText: string): string => {
    if (originalText in drafts) {
      const v = drafts[originalText];
      // Sentinel revert-to-default surfaces as empty string in the UI
      return v === originalText ? '' : v;
    }
    return serverOverrides?.[originalText] ?? '';
  };

  const handleSave = () => {
    // Compute final map: start from server, apply drafts (sentinel "== original" removes)
    const finalMap: Record<string, string> = { ...(serverOverrides ?? {}) };
    for (const [orig, val] of Object.entries(drafts)) {
      if (val === '' || val === orig) {
        delete finalMap[orig];
      } else {
        finalMap[orig] = val;
      }
    }
    saveMutation.mutate(finalMap, {
      onSuccess: () => {
        setDrafts({});
        setToastOverrides(finalMap); // push to runtime immediately
        clearDraftOverrides();
      },
    });
  };

  const handleRevert = () => {
    setDrafts({});
    clearDraftOverrides();
    toast.info('Changes reverted');
  };

  const fireTestToast = (entry: ToastCatalogEntry) => {
    const fn = (toast as any)[entry.type] ?? toast;
    const opts = entry.description ? { description: entry.description } : undefined;
    fn(entry.message, opts);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">Toast messages</h1>
                  {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <p className="text-sm text-muted-foreground">
                  {TOAST_CATALOG_STATS.total} call sites · {totalGroups} unique messages · {totalWithOverrides} overridden
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleRevert} disabled={!hasChanges}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Revert
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending || !hasChanges}>
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? 'Saving...' : hasChanges ? `Save (${Object.keys(drafts).length})` : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="container mx-auto px-6 py-6 max-w-6xl space-y-4">
        {/* How it works card */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-5 text-sm text-amber-900 space-y-1">
            <p className="font-medium">How this works</p>
            <ul className="list-disc pl-5 space-y-0.5 text-amber-800">
              <li>Every <code className="text-xs bg-amber-100 px-1 rounded">toast.*</code> call in the source is scanned at build time and listed below.</li>
              <li>Edit the <em>Custom text</em> to change what users see. Saved overrides are keyed by the original message — one edit updates every place that uses the same default text.</li>
              <li>Entries with <code>{'${...}'}</code> placeholders cannot be overridden for now (they stay as-is).</li>
              <li>When a new <code className="text-xs bg-amber-100 px-1 rounded">toast.*</code> call is added to the code, it appears here automatically on the next <code className="text-xs bg-amber-100 px-1 rounded">npm run dev</code> (the scanner regenerates the catalog).</li>
            </ul>
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardContent className="pt-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by text, component, page, or context..."
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Grouped list */}
        {filteredByPage.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No toast messages match your filter.
            </CardContent>
          </Card>
        ) : (
          <Accordion
            type="multiple"
            // Controlled: collapsed by default, auto-expand matching pages when the user is filtering.
            value={search.trim() ? filteredByPage.map(p => p.page) : openPages}
            onValueChange={setOpenPages}
          >
            {filteredByPage.map(({ page, groups }) => (
              <AccordionItem key={page} value={page}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{page}</span>
                    <Badge variant="secondary" className="text-xs">{groups.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {groups.map((group) => {
                      const first = group[0];
                      const typeMeta = TYPE_META[first.type] ?? TYPE_META.default;
                      const TypeIcon = typeMeta.icon;
                      const currentValue = currentValueFor(first.message);
                      const hasOverride = currentValue !== '' && currentValue !== first.message;
                      const isDirty = first.message in drafts;

                      return (
                        <Card key={first.message + first.type} className={isDirty ? 'border-amber-300' : ''}>
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Badge className={`${typeMeta.color} border flex-shrink-0`}>
                                  <TypeIcon className="h-3 w-3 mr-1" />
                                  {typeMeta.label}
                                </Badge>
                                {first.isTemplate && (
                                  <Badge variant="outline" className="text-xs flex-shrink-0">template</Badge>
                                )}
                                {hasOverride && (
                                  <Badge className="bg-green-100 text-green-800 border-green-300 text-xs flex-shrink-0">
                                    custom
                                  </Badge>
                                )}
                                {isDirty && (
                                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs flex-shrink-0">
                                    unsaved
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => fireTestToast(first)}
                                className="flex-shrink-0 h-7"
                                title="Show this toast now"
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Test
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Default text */}
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-muted-foreground">Default text</div>
                              <div className="text-sm bg-muted/50 rounded px-3 py-2 font-mono whitespace-pre-wrap break-words">
                                {first.message}
                              </div>
                              {first.description && (
                                <div className="text-xs text-muted-foreground pl-1">
                                  <strong>description:</strong> {first.description}
                                </div>
                              )}
                            </div>

                            {/* Custom text editor */}
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-muted-foreground">
                                Custom text <span className="font-normal">(leave empty to use default)</span>
                              </div>
                              {first.isTemplate ? (
                                <div className="text-xs text-amber-700 bg-amber-50 rounded px-3 py-2 border border-amber-200">
                                  Template messages can&apos;t be overridden in this version — they interpolate runtime values.
                                </div>
                              ) : (
                                <Textarea
                                  value={currentValue}
                                  onChange={(e) => updateDraft(first.message, e.target.value)}
                                  placeholder={first.message}
                                  rows={Math.max(1, Math.min(4, first.message.split('\n').length))}
                                  className={isDirty ? 'border-amber-400 border-2' : ''}
                                />
                              )}
                            </div>

                            {/* Where used */}
                            <details className="text-xs" open>
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                Used in {group.length} place{group.length === 1 ? '' : 's'}
                              </summary>
                              <div className="mt-2 space-y-1 pl-3 border-l-2 border-muted">
                                {group.map((entry) => (
                                  <div key={entry.id} className="font-mono text-xs text-muted-foreground">
                                    <span className="text-foreground">{entry.component}</span>
                                    {entry.context && <span> · {entry.context}()</span>}
                                    <span className="text-muted-foreground/70"> · {entry.filePath}:{entry.line}</span>
                                  </div>
                                ))}
                              </div>
                            </details>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
