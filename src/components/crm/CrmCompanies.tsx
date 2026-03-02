import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Building2, Plus, Search, Globe, Users, Calendar, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
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
import { Separator } from '../ui/separator';
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
  contact_count: number;
  created_at: string;
}

interface NewCompanyForm {
  name: string;
  website: string;
  industry: string;
  size: string;
  address: string;
  description: string;
}

const EMPTY_FORM: NewCompanyForm = {
  name: '',
  website: '',
  industry: '',
  size: '',
  address: '',
  description: '',
};

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CrmCompanies() {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<NewCompanyForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Data fetching -------------------------------------------------------

  const loadCompanies = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await authenticatedFetch('/crm/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies ?? data ?? []);
      } else {
        console.error('Failed to load companies:', response.status);
      }
    } catch (err) {
      console.error('Error loading companies:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // ---- Filtering -----------------------------------------------------------

  const filtered = companies.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.industry && c.industry.toLowerCase().includes(q)) ||
      (c.website && c.website.toLowerCase().includes(q))
    );
  });

  // ---- Create company ------------------------------------------------------

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setError('Company name is required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await authenticatedFetch('/crm/companies', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          website: form.website.trim() || null,
          industry: form.industry || null,
          size: form.size || null,
          address: form.address.trim() || null,
          description: form.description.trim() || null,
        }),
      });

      if (response.ok) {
        setDialogOpen(false);
        setForm(EMPTY_FORM);
        loadCompanies();
      } else {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? 'Failed to create company.');
      }
    } catch (err) {
      console.error('Error creating company:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ---- Render --------------------------------------------------------------

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground">
            Manage organisations and their contacts.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Add company
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add company</DialogTitle>
              <DialogDescription>
                Create a new company record. Only the name is required.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Name */}
              <div className="grid gap-1.5">
                <label htmlFor="company-name" className="text-sm font-medium">
                  Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="company-name"
                  placeholder="Acme Inc."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* Website */}
              <div className="grid gap-1.5">
                <label htmlFor="company-website" className="text-sm font-medium">
                  Website
                </label>
                <Input
                  id="company-website"
                  placeholder="https://example.com"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </div>

              {/* Industry & Size */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium">Industry</label>
                  <Select
                    value={form.industry}
                    onValueChange={(v) => setForm({ ...form, industry: v })}
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
                    value={form.size}
                    onValueChange={(v) => setForm({ ...form, size: v })}
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
                <label htmlFor="company-address" className="text-sm font-medium">
                  Address
                </label>
                <Input
                  id="company-address"
                  placeholder="123 Main St, City"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="grid gap-1.5">
                <label htmlFor="company-desc" className="text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="company-desc"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Short description of the company..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setForm(EMPTY_FORM);
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Create company
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Separator className="my-6" />

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="mb-4 size-10 text-muted-foreground/50" />
          <p className="text-lg font-medium">No companies found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? 'Try adjusting your search query.'
              : 'Get started by adding your first company.'}
          </p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((company) => (
            <Card
              key={company.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate(`/crm/companies/${company.id}`)}
            >
              <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="size-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold leading-tight">{company.name}</h3>
                      {company.website && (
                        <span className="text-xs text-muted-foreground truncate max-w-[160px] block">
                          {company.website.replace(/^https?:\/\//, '')}
                        </span>
                      )}
                    </div>
                  </div>
                  {company.industry && (
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {company.industry}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {company.size && (
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" />
                      {company.size}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Globe className="size-3.5" />
                    {company.contact_count ?? 0} contacts
                  </span>
                  <span className="ml-auto flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {new Date(company.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
