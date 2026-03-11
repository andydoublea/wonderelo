import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Users, Mail, Phone, ArrowLeft, Copy, Check } from 'lucide-react';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  acquiredAt: string;
  sessionName: string;
  sessionDate: string;
  roundName: string;
  organizerName: string;
  organizerSlug: string;
  allPartners: { firstName: string; lastName: string }[];
}

export function AddressBook() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, [token]);

  const loadContacts = async () => {
    if (!token) return;
    try {
      debugLog('[AddressBook] Loading contacts');
      const response = await fetch(
        `${apiBaseUrl}/participant/${token}/shared-contacts`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load contacts');
      }

      const data = await response.json();
      debugLog('[AddressBook] Contacts loaded:', data);
      const mapped: Contact[] = (data.sharedContacts || []).map((sc: any) => ({
        id: sc.matchId,
        firstName: sc.partner.firstName,
        lastName: sc.partner.lastName,
        email: sc.partner.email,
        phone: sc.partner.phone,
        acquiredAt: sc.sharedAt || new Date().toISOString(),
        sessionName: sc.sessionName || '',
        sessionDate: sc.sessionDate || '',
        roundName: sc.roundName || '',
        organizerName: sc.organizerName || '',
        organizerSlug: sc.organizerSlug || '',
        allPartners: sc.allPartners || [],
      }));
      setContacts(mapped);
    } catch (err) {
      errorLog('[AddressBook] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/p/${token}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to dashboard
        </Button>
        <h1 className="text-3xl font-bold mt-4 mb-1">Address Book</h1>
        <p className="text-sm text-muted-foreground">
          {contacts.length > 0
            ? `${contacts.length} contact${contacts.length > 1 ? 's' : ''} from your networking rounds`
            : 'People you\'ve exchanged contacts with through Wonderelo'}
        </p>
      </div>

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!error && contacts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              After a networking round, you and your conversation partner can choose to share contact details. Shared contacts will appear here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contact list */}
      {contacts.length > 0 && (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="border rounded-xl p-4 bg-card hover:border-muted-foreground/30 transition-colors"
            >
              {/* Top row: name + event context */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-base font-semibold leading-tight">
                    {contact.firstName} {contact.lastName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[
                      contact.organizerName,
                      contact.sessionName,
                      contact.roundName,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {(contact.sessionDate || contact.acquiredAt) && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(contact.sessionDate || contact.acquiredAt)}
                  </span>
                )}
              </div>

              {/* Contact details */}
              <div className="space-y-1.5">
                {contact.email && (
                  <div className="flex items-center gap-2 group">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <a href={`mailto:${contact.email}`} className="text-sm text-primary hover:underline truncate flex-1">
                      {contact.email}
                    </a>
                    <button
                      onClick={() => handleCopy(contact.email, `email-${contact.id}`)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      title="Copy email"
                    >
                      {copiedId === `email-${contact.id}` ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 group">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <a href={`tel:${contact.phone}`} className="text-sm text-primary hover:underline flex-1">
                      {contact.phone}
                    </a>
                    <button
                      onClick={() => handleCopy(contact.phone!, `phone-${contact.id}`)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                      title="Copy phone"
                    >
                      {copiedId === `phone-${contact.id}` ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Group partners (only for groups > 2) */}
              {contact.allPartners && contact.allPartners.length > 1 && (
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
                  Group: {contact.allPartners.map(p => `${p.firstName} ${p.lastName}`).join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
