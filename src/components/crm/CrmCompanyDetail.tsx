import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Users,
  DollarSign,
  Clock,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
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

interface Company {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  size: string | null;
  address: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface LinkedContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: string | null;
  role: string | null;
  lead_score: number | null;
}

interface ActivityEntry {
  id: string;
  type: string;
  description: string;
  contact_name: string | null;
  created_at: string;
}

interface RevenueSummary {
  total_revenue: number;
  active_subscriptions: number;
  total_credits: number;
}

interface CompanyDetail {
  company: Company;
  contacts: LinkedContact[];
  activities: ActivityEntry[];
  revenue: RevenueSummary;
}

interface EditForm {
  name: string;
  website: string;
  industry: string;
  size: string;
  address: string;
  description: string;
}

const INDUSTRY_OPTIONS = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Retail',
  'Manufacturing',
  'Consulting',
  'Media',
  'Real Estate',
  'Hospitality',
  'Non-profit',
  'Government',
  'Other',
];

const SIZE_OPTIONS = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5000+',
];

const CONTACT_TYPE_COLORS: Record<string, string> = {
  lead: 'bg-blue-100 text-blue-800',
  customer: 'bg-green-100 text-green-800',
  partner: 'bg-purple-100 text-purple-800',
  prospect: 'bg-amber-100 text-amber-800',
  churned: 'bg-red-100 text-red-800',
};

const ACTIVITY_ICONS: Record<string, string> = {
  email: 'mail',
  call: 'phone',
  meeting: 'users',
  note: 'file-text',
  deal: 'dollar-sign',
};

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

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CrmCompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<CompanyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    website: '',
    industry: '',
    size: '',
    address: '',
    description: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ---- Data fetching -------------------------------------------------------

  const loadCompany = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const response = await authenticatedFetch(`/crm/companies/${id}`);
      if (response.ok) {
        const json = await response.json();
        setData(json);
      } else {
        console.error('Failed to load company:', response.status);
      }
    } catch (err) {
      console.error('Error loading company:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  // ---- Edit ----------------------------------------------------------------

  const openEdit = () => {
    if (!data) return;
    setEditForm({
      name: data.company.name,
      website: data.company.website ?? '',
      industry: data.company.industry ?? '',
      size: data.company.size ?? '',
      address: data.company.address ?? '',
      description: data.company.description ?? '',
    });
    setEditError(null);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      setEditError('Company name is required.');
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      const response = await authenticatedFetch(`/crm/companies/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editForm.name.trim(),
          website: editForm.website.trim() || null,
          industry: editForm.industry || null,
          size: editForm.size || null,
          address: editForm.address.trim() || null,
          description: editForm.description.trim() || null,
        }),
      });

      if (response.ok) {
        setEditOpen(false);
        loadCompany();
      } else {
        const body = await response.json().catch(() => null);
        setEditError(body?.error ?? 'Failed to update company.');
      }
    } catch (err) {
      console.error('Error updating company:', err);
      setEditError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ---- Loading / Error states ----------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 lg:p-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/crm/companies')}>
          <ArrowLeft className="mr-2 size-4" />
          Back to companies
        </Button>
        <div className="mt-16 text-center">
          <Building2 className="mx-auto mb-4 size-10 text-muted-foreground/50" />
          <p className="text-lg font-medium">Company not found</p>
          <p className="text-sm text-muted-foreground">
            The requested company could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  const { company, contacts, activities, revenue } = data;

  // ---- Render --------------------------------------------------------------

  return (
    <div className="p-6 lg:p-8">
      {/* Back link */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => navigate('/crm/companies')}
      >
        <ArrowLeft className="mr-2 size-4" />
        Back to companies
      </Button>

      {/* ================================================================== */}
      {/* Header                                                              */}
      {/* ================================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {company.website && (
                <a
                  href={
                    company.website.startsWith('http')
                      ? company.website
                      : `https://${company.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Globe className="size-3.5" />
                  {company.website.replace(/^https?:\/\//, '')}
                  <ExternalLink className="size-3" />
                </a>
              )}
              {company.industry && (
                <Badge variant="secondary">{company.industry}</Badge>
              )}
              {company.size && (
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  {company.size} employees
                </span>
              )}
              {company.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {company.address}
                </span>
              )}
            </div>
            {company.description && (
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                {company.description}
              </p>
            )}
          </div>
        </div>

        <Button variant="outline" onClick={openEdit}>
          <Pencil className="mr-2 size-4" />
          Edit
        </Button>
      </div>

      <Separator className="my-6" />

      {/* ================================================================== */}
      {/* Revenue summary cards                                               */}
      {/* ================================================================== */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <DollarSign className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total revenue</p>
              <p className="text-xl font-bold">{formatCurrency(revenue?.total_revenue ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active subscriptions</p>
              <p className="text-xl font-bold">{revenue?.active_subscriptions ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total credits</p>
              <p className="text-xl font-bold">{revenue?.total_credits ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================== */}
      {/* Main content: Contacts + Activities side-by-side                    */}
      {/* ================================================================== */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Contacts (3 cols) */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4" />
              Linked contacts
              <Badge variant="outline" className="ml-auto">
                {contacts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No contacts linked to this company.
              </p>
            ) : (
              <div className="divide-y">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex cursor-pointer items-center gap-3 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-accent/50 -mx-2 px-2 rounded-md"
                    onClick={() => navigate(`/crm/contacts/${contact.id}`)}
                  >
                    <div className="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-medium uppercase text-muted-foreground">
                      {contact.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{contact.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {contact.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="size-3" />
                            {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="size-3" />
                            {contact.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {contact.type && (
                        <Badge
                          className={
                            CONTACT_TYPE_COLORS[contact.type.toLowerCase()] ??
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {contact.type}
                        </Badge>
                      )}
                      {contact.role && (
                        <span className="text-xs text-muted-foreground">{contact.role}</span>
                      )}
                      {contact.lead_score != null && (
                        <Badge variant="outline" className="text-xs">
                          {contact.lead_score}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity timeline (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4" />
              Activity timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No activities recorded yet.
              </p>
            ) : (
              <div className="relative space-y-0">
                {/* Vertical line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

                {activities.map((activity) => (
                  <div key={activity.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {/* Dot */}
                    <div className="relative z-10 mt-1.5 flex size-[9px] shrink-0 translate-x-[11px] rounded-full border-2 border-primary bg-background" />

                    <div className="ml-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {activity.type}
                        </Badge>
                        {activity.contact_name && (
                          <span className="truncate text-xs text-muted-foreground">
                            {activity.contact_name}
                          </span>
                        )}
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {timeAgo(activity.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-foreground/80">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ================================================================== */}
      {/* Edit dialog                                                         */}
      {/* ================================================================== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit company</DialogTitle>
            <DialogDescription>
              Update company details. Only the name is required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-1.5">
              <label htmlFor="edit-name" className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            {/* Website */}
            <div className="grid gap-1.5">
              <label htmlFor="edit-website" className="text-sm font-medium">
                Website
              </label>
              <Input
                id="edit-website"
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
              />
            </div>

            {/* Industry & Size */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Industry</label>
                <Select
                  value={editForm.industry}
                  onValueChange={(v) => setEditForm({ ...editForm, industry: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_OPTIONS.map((i) => (
                      <SelectItem key={i} value={i}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Size</label>
                <Select
                  value={editForm.size}
                  onValueChange={(v) => setEditForm({ ...editForm, size: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s} employees
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Address */}
            <div className="grid gap-1.5">
              <label htmlFor="edit-address" className="text-sm font-medium">
                Address
              </label>
              <Input
                id="edit-address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="grid gap-1.5">
              <label htmlFor="edit-desc" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="edit-desc"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>

            {editError && (
              <p className="text-sm text-destructive">{editError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
