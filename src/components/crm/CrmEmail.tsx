import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router';
import { apiBaseUrl, publicAnonKey } from '../../utils/supabase/info';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
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
  Send,
  Plus,
  Search,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Mail,
  MailOpen,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContactSearchResult {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

type TemplateCategory = 'outreach' | 'follow_up' | 'onboarding' | 'other';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: TemplateCategory;
  created_at: string;
}

interface EmailActivity {
  id: string;
  type: 'email_sent' | 'email_received';
  title: string;
  contact_name: string;
  contact_id: string;
  subject: string;
  created_at: string;
}

interface FreshdeskStatus {
  connected: boolean;
  domain?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const headers: HeadersInit = {
  Authorization: `Bearer ${publicAnonKey}`,
  'Content-Type': 'application/json',
};

const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: 'outreach', label: 'Outreach' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'other', label: 'Other' },
];

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  outreach: 'bg-blue-100 text-blue-800 border-blue-200',
  follow_up: 'bg-amber-100 text-amber-800 border-amber-200',
  onboarding: 'bg-green-100 text-green-800 border-green-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimeAgo(dateStr: string): string {
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
  const months = Math.floor(diffDays / 30);
  return `${months}mo ago`;
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
// Component
// ---------------------------------------------------------------------------

export default function CrmEmail() {
  // -- Freshdesk status
  const [freshdeskStatus, setFreshdeskStatus] = useState<FreshdeskStatus | null>(null);

  // -- Compose state
  const [contactSearch, setContactSearch] = useState('');
  const [contactResults, setContactResults] = useState<ContactSearchResult[]>([]);
  const [isSearchingContacts, setIsSearchingContacts] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactSearchResult | null>(null);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const contactSearchRef = useRef<HTMLDivElement>(null);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('none');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  // -- Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'other' as TemplateCategory,
  });
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // -- Recent emails
  const [recentEmails, setRecentEmails] = useState<EmailActivity[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(true);

  // -- Toasts
  const { toasts, addToast } = useToasts();

  // -- Contact search debounce
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------- Data fetching -------------------------------------------------

  // Freshdesk status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`${apiBaseUrl}/crm/settings/freshdesk/status`, { headers });
        if (res.ok) {
          const data = await res.json();
          setFreshdeskStatus(data);
        } else {
          setFreshdeskStatus({ connected: false });
        }
      } catch {
        setFreshdeskStatus({ connected: false });
      }
    }
    fetchStatus();
  }, []);

  // Templates
  const loadTemplates = useCallback(async () => {
    try {
      setIsLoadingTemplates(true);
      const res = await fetch(`${apiBaseUrl}/crm/email/templates`, { headers });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates ?? data ?? []);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Recent emails
  const loadRecentEmails = useCallback(async () => {
    try {
      setIsLoadingEmails(true);
      const [sentRes, receivedRes] = await Promise.all([
        fetch(`${apiBaseUrl}/crm/activities?type=email_sent&limit=20`, { headers }),
        fetch(`${apiBaseUrl}/crm/activities?type=email_received&limit=20`, { headers }),
      ]);

      const sent: EmailActivity[] = sentRes.ok
        ? ((await sentRes.json()).activities ?? [])
        : [];
      const received: EmailActivity[] = receivedRes.ok
        ? ((await receivedRes.json()).activities ?? [])
        : [];

      // Merge and sort by date descending
      const merged = [...sent, ...received].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecentEmails(merged.slice(0, 30));
    } catch (err) {
      console.error('Failed to load recent emails:', err);
    } finally {
      setIsLoadingEmails(false);
    }
  }, []);

  useEffect(() => {
    loadRecentEmails();
  }, [loadRecentEmails]);

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

  // ---------- Template selection fills compose ------------------------------

  useEffect(() => {
    if (selectedTemplateId && selectedTemplateId !== 'none') {
      const tpl = templates.find((t) => t.id === selectedTemplateId);
      if (tpl) {
        setComposeSubject(tpl.subject);
        setComposeBody(tpl.body);
      }
    }
  }, [selectedTemplateId, templates]);

  // ---------- Send email ----------------------------------------------------

  async function handleSendEmail() {
    if (!selectedContact) {
      addToast('Please select a contact.', 'error');
      return;
    }
    if (!composeSubject.trim()) {
      addToast('Please enter a subject.', 'error');
      return;
    }
    if (!composeBody.trim()) {
      addToast('Please enter a message body.', 'error');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(`${apiBaseUrl}/crm/email/send`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contactId: selectedContact.id,
          subject: composeSubject.trim(),
          body: composeBody.trim(),
          templateId:
            selectedTemplateId && selectedTemplateId !== 'none'
              ? selectedTemplateId
              : undefined,
        }),
      });

      if (res.ok) {
        addToast('Email sent successfully.', 'success');
        // Reset compose form
        setSelectedContact(null);
        setContactSearch('');
        setComposeSubject('');
        setComposeBody('');
        setSelectedTemplateId('none');
        // Refresh recent emails
        loadRecentEmails();
      } else {
        const err = await res.json().catch(() => null);
        addToast(err?.error ?? `Failed to send email (${res.status})`, 'error');
      }
    } catch (err) {
      addToast('Network error sending email.', 'error');
      console.error('Send email error:', err);
    } finally {
      setIsSending(false);
    }
  }

  // ---------- Template CRUD -------------------------------------------------

  function openNewTemplateDialog() {
    setEditingTemplate(null);
    setTemplateForm({ name: '', subject: '', body: '', category: 'other' });
    setTemplateDialogOpen(true);
  }

  function openEditTemplateDialog(template: EmailTemplate) {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      category: template.category,
    });
    setTemplateDialogOpen(true);
  }

  async function handleSaveTemplate() {
    if (!templateForm.name.trim() || !templateForm.subject.trim()) {
      addToast('Template name and subject are required.', 'error');
      return;
    }

    setIsSavingTemplate(true);
    try {
      const isEdit = !!editingTemplate;
      const url = isEdit
        ? `${apiBaseUrl}/crm/email/templates/${editingTemplate!.id}`
        : `${apiBaseUrl}/crm/email/templates`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(templateForm),
      });

      if (res.ok) {
        addToast(
          isEdit ? 'Template updated.' : 'Template created.',
          'success'
        );
        setTemplateDialogOpen(false);
        loadTemplates();
      } else {
        const err = await res.json().catch(() => null);
        addToast(err?.error ?? 'Failed to save template.', 'error');
      }
    } catch (err) {
      addToast('Network error saving template.', 'error');
      console.error('Save template error:', err);
    } finally {
      setIsSavingTemplate(false);
    }
  }

  async function handleDeleteTemplate(id: string) {
    try {
      const res = await fetch(`${apiBaseUrl}/crm/email/templates/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        addToast('Template deleted.', 'success');
        setDeleteConfirmId(null);
        loadTemplates();
      } else {
        addToast('Failed to delete template.', 'error');
      }
    } catch {
      addToast('Network error deleting template.', 'error');
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

      {/* Page header + Freshdesk status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email</h2>
          <p className="text-sm text-muted-foreground">
            Compose emails and manage templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          {freshdeskStatus === null ? (
            <Skeleton className="h-6 w-32" />
          ) : freshdeskStatus.connected ? (
            <div className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              <span className="size-2 rounded-full bg-green-500" />
              Freshdesk connected
              {freshdeskStatus.domain && (
                <span className="text-green-600">({freshdeskStatus.domain})</span>
              )}
            </div>
          ) : (
            <Link
              to="/crm/settings"
              className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
            >
              <span className="size-2 rounded-full bg-red-500" />
              Not configured
            </Link>
          )}
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Left column: Compose + Templates */}
        <div className="space-y-6 xl:col-span-3">
          {/* Compose email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="size-4" />
                Compose email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact search */}
              <div ref={contactSearchRef} className="relative">
                <label className="mb-1.5 block text-sm font-medium">To</label>
                {selectedContact ? (
                  <div className="flex items-center gap-2 rounded-md border bg-accent/30 px-3 py-2">
                    <span className="text-sm font-medium">
                      {contactDisplayName(selectedContact)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({selectedContact.email})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto size-6 p-0"
                      onClick={() => {
                        setSelectedContact(null);
                        setContactSearch('');
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
                        placeholder="Search contacts by name or email..."
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
                            }}
                          >
                            <span className="font-medium">{contactDisplayName(c)}</span>
                            <span className="text-xs text-muted-foreground">{c.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Template selector */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">Template</label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">Subject</label>
                <Input
                  placeholder="Email subject"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                />
              </div>

              {/* Body */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">Body</label>
                <Textarea
                  placeholder="Write your email body (HTML supported)..."
                  rows={8}
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                />
              </div>

              {/* Send button */}
              <div className="flex justify-end">
                <Button onClick={handleSendEmail} disabled={isSending}>
                  {isSending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {isSending ? 'Sending...' : 'Send email'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Templates */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Templates</CardTitle>
                  <CardDescription className="mt-1">
                    Reusable email templates with {'{{variable}}'} placeholders
                  </CardDescription>
                </div>
                <Button size="sm" onClick={openNewTemplateDialog}>
                  <Plus className="size-4" />
                  New template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTemplates ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No templates yet. Create your first template to speed up email
                  composition.
                </p>
              ) : (
                <div className="space-y-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-accent/30"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{template.name}</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${CATEGORY_COLORS[template.category]}`}
                          >
                            {template.category.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {template.subject}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0"
                          onClick={() => openEditTemplateDialog(template)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirmId(template.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Recent emails */}
        <div className="xl:col-span-2">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MailOpen className="size-4" />
                Recent emails
              </CardTitle>
              <CardDescription>Latest sent and received emails</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingEmails ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="size-8 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentEmails.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No email activity yet
                </p>
              ) : (
                <div className="space-y-1">
                  {recentEmails.map((email) => {
                    const isSent = email.type === 'email_sent';
                    return (
                      <div
                        key={email.id}
                        className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/50"
                      >
                        <div
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                            isSent ? 'bg-blue-50' : 'bg-green-50'
                          }`}
                        >
                          {isSent ? (
                            <ArrowUpRight className="size-4 text-blue-600" />
                          ) : (
                            <ArrowDownLeft className="size-4 text-green-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium">
                              {email.contact_name}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {email.subject || email.title}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatTimeAgo(email.created_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Template create/edit dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit template' : 'New email template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? 'Update the template details below.'
                : 'Create a reusable email template. Use {{variable}} for dynamic content.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <Input
                placeholder="e.g. Welcome email"
                value={templateForm.name}
                onChange={(e) =>
                  setTemplateForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Category</label>
              <Select
                value={templateForm.category}
                onValueChange={(val) =>
                  setTemplateForm((f) => ({
                    ...f,
                    category: val as TemplateCategory,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Subject</label>
              <Input
                placeholder="Email subject line"
                value={templateForm.subject}
                onChange={(e) =>
                  setTemplateForm((f) => ({ ...f, subject: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Body</label>
              <Textarea
                placeholder="Email body. Use {{first_name}}, {{company}}, etc. for variables."
                rows={6}
                value={templateForm.body}
                onChange={(e) =>
                  setTemplateForm((f) => ({ ...f, body: e.target.value }))
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Available variables: {'{{first_name}}'}, {'{{last_name}}'},{' '}
                {'{{email}}'}, {'{{company}}'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTemplateDialogOpen(false)}
              disabled={isSavingTemplate}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={isSavingTemplate}>
              {isSavingTemplate && <Loader2 className="size-4 animate-spin" />}
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete template confirm dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId) handleDeleteTemplate(deleteConfirmId);
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
