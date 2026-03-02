import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  ArrowLeft, Languages, Plus, Trash2, Check, X, Loader2, Wand2,
  Download, Upload, Search, Globe, ChevronDown, Pencil, Eye, EyeOff,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import {
  useAdminLanguages,
  useCreateLanguage,
  useUpdateLanguage,
  useDeleteLanguage,
  useAdminNamespaces,
  useAdminTranslations,
  useSaveTranslation,
  useAiTranslate,
  useExportTranslations,
  useImportTranslations,
} from '../hooks/useI18nQueries';

interface AdminTranslationsProps {
  accessToken: string;
  onBack: () => void;
}

type Tab = 'languages' | 'editor' | 'import-export';

export function AdminTranslations({ accessToken, onBack }: AdminTranslationsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('languages');

  return (
    <div className="min-h-screen" style={{ background: '#fafafa' }}>
      {/* Header */}
      <div className="border-b" style={{ background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="container mx-auto" style={{ padding: '12px 24px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Languages className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold" style={{ letterSpacing: '-0.01em' }}>
                Translations
              </h1>
            </div>
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 mt-3" style={{ marginBottom: '-1px' }}>
            {([
              { id: 'languages' as Tab, label: 'Languages' },
              { id: 'editor' as Tab, label: 'Translation Editor' },
              { id: 'import-export' as Tab, label: 'Import / Export' },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                  color: activeTab === tab.id ? 'var(--foreground)' : 'var(--muted-foreground)',
                  background: 'none',
                  border: 'none',
                  borderBottomWidth: '2px',
                  borderBottomStyle: 'solid',
                  borderBottomColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto" style={{ padding: '24px', maxWidth: '1000px' }}>
        {activeTab === 'languages' && <LanguagesTab accessToken={accessToken} />}
        {activeTab === 'editor' && <EditorTab accessToken={accessToken} />}
        {activeTab === 'import-export' && <ImportExportTab accessToken={accessToken} />}
      </div>
    </div>
  );
}

// ============================================
// LANGUAGES TAB
// ============================================

function LanguagesTab({ accessToken }: { accessToken: string }) {
  const { data: languages, isLoading } = useAdminLanguages(accessToken);
  const createLanguage = useCreateLanguage(accessToken);
  const updateLanguage = useUpdateLanguage(accessToken);
  const deleteLanguage = useDeleteLanguage(accessToken);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLang, setNewLang] = useState({ code: '', name: '', native_name: '', flag_emoji: '' });

  const handleAdd = () => {
    if (!newLang.code || !newLang.name || !newLang.native_name) {
      toast.error('Code, name, and native name are required');
      return;
    }
    createLanguage.mutate(newLang, {
      onSuccess: () => {
        setShowAddDialog(false);
        setNewLang({ code: '', name: '', native_name: '', flag_emoji: '' });
      },
    });
  };

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading languages...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{languages?.length || 0} languages configured</p>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add language
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden" style={{ background: 'white' }}>
        {(languages || []).map((lang: any, index: number) => (
          <div
            key={lang.code}
            className="flex items-center gap-3"
            style={{
              padding: '12px 16px',
              borderBottom: index < (languages?.length || 0) - 1 ? '1px solid #f0f0f0' : 'none',
            }}
          >
            <span style={{ fontSize: '20px', width: '32px', textAlign: 'center' }}>
              {lang.flag_emoji || '🌐'}
            </span>
            <div style={{ flex: 1 }}>
              <div className="text-sm font-medium">
                {lang.name}
                <span className="text-muted-foreground ml-1">({lang.native_name})</span>
              </div>
              <div className="text-xs text-muted-foreground font-mono">{lang.code}</div>
            </div>
            <div className="flex items-center gap-2">
              {lang.is_default && (
                <Badge variant="secondary" style={{ fontSize: '10px' }}>Default</Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateLanguage.mutate({ code: lang.code, is_active: !lang.is_active })}
                title={lang.is_active ? 'Deactivate' : 'Activate'}
              >
                {lang.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              {!lang.is_default && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Delete language "${lang.name}"? All translations for this language will be lost.`)) {
                      deleteLanguage.mutate(lang.code);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add language dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Language</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Language code</label>
              <Input
                placeholder="e.g. sk, cs, de"
                value={newLang.code}
                onChange={(e) => setNewLang({ ...newLang, code: e.target.value.toLowerCase() })}
                maxLength={5}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Name (English)</label>
              <Input
                placeholder="e.g. Slovak"
                value={newLang.name}
                onChange={(e) => setNewLang({ ...newLang, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Native name</label>
              <Input
                placeholder="e.g. Slovensky"
                value={newLang.native_name}
                onChange={(e) => setNewLang({ ...newLang, native_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Flag emoji</label>
              <Input
                placeholder="e.g. 🇸🇰"
                value={newLang.flag_emoji}
                onChange={(e) => setNewLang({ ...newLang, flag_emoji: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={createLanguage.isPending}>
              {createLanguage.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// EDITOR TAB
// ============================================

function EditorTab({ accessToken }: { accessToken: string }) {
  const { data: languages } = useAdminLanguages(accessToken);
  const { data: namespaces } = useAdminNamespaces(accessToken);
  const [selectedLang, setSelectedLang] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Select first non-default language, or default
  const targetLang = selectedLang || (languages?.find((l: any) => !l.is_default)?.code || languages?.[0]?.code || '');
  const { data: translations, isLoading } = useAdminTranslations(accessToken, targetLang);
  const saveTranslation = useSaveTranslation(accessToken);
  const aiTranslate = useAiTranslate(accessToken);

  const filteredTranslations = (translations || []).filter((t: any) => {
    if (selectedNamespace && t.namespace !== selectedNamespace) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.key.toLowerCase().includes(q) ||
        t.default_text.toLowerCase().includes(q) ||
        (t.translated_text || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSave = (t: any) => {
    saveTranslation.mutate({
      key_id: t.key_id,
      language_code: targetLang,
      translated_text: editValue,
      status: 'reviewed',
    }, {
      onSuccess: () => setEditingKey(null),
    });
  };

  const handleAiTranslateAll = () => {
    const langData = languages?.find((l: any) => l.code === targetLang);
    if (!langData) return;

    aiTranslate.mutate({
      source_lang: 'en',
      target_lang: targetLang,
      target_lang_name: langData.name,
    });
  };

  const statusColor = (status: string | null) => {
    switch (status) {
      case 'approved': return '#22c55e';
      case 'reviewed': return '#3b82f6';
      case 'ai_translated': return '#f59e0b';
      case 'draft': return '#9ca3af';
      default: return '#e5e7eb';
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Language selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Globe className="h-4 w-4" />
              {languages?.find((l: any) => l.code === targetLang)?.name || 'Select language'}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {(languages || []).map((l: any) => (
              <DropdownMenuItem key={l.code} onClick={() => setSelectedLang(l.code)}>
                {l.flag_emoji} {l.name}
                {l.is_default && ' (default)'}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Namespace filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              {selectedNamespace || 'All namespaces'}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSelectedNamespace('')}>All namespaces</DropdownMenuItem>
            {(namespaces || []).map((ns: string) => (
              <DropdownMenuItem key={ns} onClick={() => setSelectedNamespace(ns)}>
                {ns}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search */}
        <div className="relative flex-1" style={{ minWidth: '200px' }}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search keys or text..."
            className="pl-8 h-8 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* AI Translate button */}
        <Button
          size="sm"
          onClick={handleAiTranslateAll}
          disabled={aiTranslate.isPending || !targetLang}
          style={{ background: '#8b5cf6', color: 'white' }}
        >
          {aiTranslate.isPending ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4 mr-1" />
          )}
          AI Translate All
        </Button>
      </div>

      {/* Summary */}
      {translations && (
        <div className="flex gap-4 mb-4 text-xs text-muted-foreground">
          <span>Total: {translations.length}</span>
          <span>Translated: {translations.filter((t: any) => t.translated_text).length}</span>
          <span>Missing: {translations.filter((t: any) => !t.translated_text).length}</span>
          <span>Showing: {filteredTranslations.length}</span>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading translations...</div>
      ) : (
        <div className="border rounded-lg overflow-hidden" style={{ background: 'white' }}>
          {/* Header */}
          <div
            className="grid text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            style={{
              gridTemplateColumns: '180px 1fr 1fr 80px 40px',
              padding: '8px 12px',
              borderBottom: '1px solid #e5e7eb',
              background: '#f9fafb',
            }}
          >
            <div>Key</div>
            <div>English (default)</div>
            <div>Translation</div>
            <div>Status</div>
            <div></div>
          </div>

          {/* Rows */}
          {filteredTranslations.map((t: any) => (
            <div
              key={t.key_id}
              className="grid items-start"
              style={{
                gridTemplateColumns: '180px 1fr 1fr 80px 40px',
                padding: '8px 12px',
                borderBottom: '1px solid #f0f0f0',
                fontSize: '13px',
              }}
            >
              <div className="font-mono text-xs text-muted-foreground" style={{ wordBreak: 'break-all' }}>
                {t.key}
              </div>
              <div className="text-muted-foreground" style={{ paddingRight: '8px' }}>
                {t.default_text}
              </div>
              <div style={{ paddingRight: '8px' }}>
                {editingKey === t.key_id ? (
                  <div className="flex items-start gap-1">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      rows={2}
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      style={{ resize: 'vertical', fontSize: '13px' }}
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSave(t)}
                      disabled={saveTranslation.isPending}
                      style={{ padding: '4px' }}
                    >
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingKey(null)}
                      style={{ padding: '4px' }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <span
                    style={{
                      color: t.translated_text ? 'inherit' : '#d1d5db',
                      fontStyle: t.translated_text ? 'normal' : 'italic',
                    }}
                  >
                    {t.translated_text || 'Not translated'}
                  </span>
                )}
              </div>
              <div>
                {t.status && (
                  <Badge
                    variant="outline"
                    style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderColor: statusColor(t.status),
                      color: statusColor(t.status),
                    }}
                  >
                    {t.status === 'ai_translated' ? 'AI' : t.status}
                  </Badge>
                )}
              </div>
              <div>
                {editingKey !== t.key_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingKey(t.key_id);
                      setEditValue(t.translated_text || '');
                    }}
                    style={{ padding: '4px' }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {filteredTranslations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No translations found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// IMPORT / EXPORT TAB
// ============================================

function ImportExportTab({ accessToken }: { accessToken: string }) {
  const { data: languages } = useAdminLanguages(accessToken);
  const exportTranslations = useExportTranslations(accessToken);
  const importTranslations = useImportTranslations(accessToken);
  const [importLang, setImportLang] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (lang: string) => {
    setImportLang(lang);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importLang) return;

    try {
      const text = await file.text();
      const translations = JSON.parse(text);
      importTranslations.mutate({ lang: importLang, translations });
    } catch {
      toast.error('Invalid JSON file');
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {(languages || []).map((lang: any) => (
        <Card key={lang.code}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span style={{ fontSize: '18px' }}>{lang.flag_emoji || '🌐'}</span>
              {lang.name}
              <span className="text-muted-foreground font-normal">({lang.code})</span>
              {lang.is_default && <Badge variant="secondary" style={{ fontSize: '10px' }}>Default</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportTranslations.mutate(lang.code)}
              disabled={exportTranslations.isPending}
            >
              <Download className="h-4 w-4 mr-1" />
              Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleImport(lang.code)}
              disabled={importTranslations.isPending}
            >
              <Upload className="h-4 w-4 mr-1" />
              Import JSON
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
