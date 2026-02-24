import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Users, Mail, Phone, Calendar, ArrowLeft, MessageCircle } from 'lucide-react';
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
  roundName: string;
  feedbackGiven?: string[];
  feedbackReceived?: string[];
}

export function AddressBook() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      // Map shared-contacts response to Contact format
      const mapped: Contact[] = (data.sharedContacts || []).map((sc: any) => ({
        id: sc.matchId,
        firstName: sc.partner.firstName,
        lastName: sc.partner.lastName,
        email: sc.partner.email,
        phone: sc.partner.phone,
        acquiredAt: sc.sharedAt || new Date().toISOString(),
        sessionName: sc.sessionName || '',
        roundName: sc.roundName || '',
        feedbackGiven: sc.feedbackGiven,
        feedbackReceived: sc.feedbackReceived,
      }));
      setContacts(mapped);
    } catch (err) {
      errorLog('[AddressBook] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
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
      <div className="mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/p/${token}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to dashboard
        </Button>
        <h1 className="text-3xl font-bold mt-4 mb-2">Address Book</h1>
        <p className="text-muted-foreground">
          People you've exchanged contacts with through Wonderelo
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
        <div className="space-y-4">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Name */}
                    <h3 className="text-lg font-semibold">
                      {contact.firstName} {contact.lastName}
                    </h3>

                    {/* Contact info */}
                    <div className="mt-2 space-y-1">
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <a href={`mailto:${contact.email}`} className="text-primary hover:underline truncate">
                            {contact.email}
                          </a>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                            {contact.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Badge variant="secondary" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(contact.acquiredAt).toLocaleDateString()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {contact.sessionName}
                      </Badge>
                      {contact.roundName && (
                        <Badge variant="outline" className="text-xs">
                          {contact.roundName}
                        </Badge>
                      )}
                    </div>

                    {/* Feedback received */}
                    {contact.feedbackReceived && contact.feedbackReceived.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <MessageCircle className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                        {contact.feedbackReceived.map((fb, i) => (
                          <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {fb}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
