import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, RefreshCw, Copy, Check } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface FullDumpDebugPageProps {
  onBack: () => void;
  accessToken: string;
}

export function FullDumpDebugPage({ onBack, accessToken }: FullDumpDebugPageProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const fetchDump = async () => {
    setLoading(true);
    try {
      // Refresh the access token before making the request
      const { supabase } = await import('../utils/supabase/client');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Failed to get session:', sessionError);
        setData({ error: 'Failed to get session. Please sign in again.' });
        setLoading(false);
        return;
      }
      
      const currentAccessToken = session.access_token;
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/full-dump`,
        {
          headers: {
            'Authorization': `Bearer ${currentAccessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        const error = await response.json();
        console.error('Failed to fetch full dump:', error);
        setData({ error: `Failed to fetch: ${JSON.stringify(error)}` });
      }
    } catch (error) {
      console.error('Error fetching full dump:', error);
      setData({ error: `Exception: ${String(error)}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDump();
  }, []);

  const copyToClipboard = () => {
    if (data) {
      const jsonString = JSON.stringify(data, null, 2);
      
      // Fallback method using textarea for better compatibility
      const textarea = document.createElement('textarea');
      textarea.value = jsonString;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        // Try modern API as last resort
        navigator.clipboard.writeText(jsonString).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(err => {
          console.error('Clipboard API also failed:', err);
        });
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Full database dump</CardTitle>
              <CardDescription>
                Complete overview of all organizers, sessions, and participants
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                disabled={!data}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy JSON
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchDump} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading database dump...
            </div>
          )}

          {!loading && data && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {data.summary.totalOrganizers}
                  </div>
                  <div className="text-sm text-muted-foreground">Organizers</div>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {data.summary.totalSessions}
                  </div>
                  <div className="text-sm text-muted-foreground">Sessions</div>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {data.summary.totalParticipants}
                  </div>
                  <div className="text-sm text-muted-foreground">Participants</div>
                </div>
              </div>

              {/* Organizers View */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">
                  📊 View by organizers ({data.organizersView.length})
                </h3>
                <div className="space-y-4">
                  {data.organizersView.map((org: any, idx: number) => (
                    <div
                      key={idx}
                      className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 dark:bg-blue-950 rounded"
                    >
                      <div className="font-bold text-lg">{org.organizerName}</div>
                      <div className="text-sm text-muted-foreground">
                        Email: {org.email} | URL Slug: {org.urlSlug} | User ID: {org.userId}
                      </div>

                      {/* Sessions */}
                      <div className="mt-3">
                        <div className="font-semibold text-sm mb-2">
                          Sessions ({org.sessions.length}):
                        </div>
                        {org.sessions.length > 0 ? (
                          <div className="space-y-2 ml-4">
                            {org.sessions.map((session: any, sidx: number) => (
                              <div
                                key={sidx}
                                className="border-l-4 border-green-500 pl-3 py-2 bg-green-50 dark:bg-green-950 rounded text-sm"
                              >
                                <div className="font-medium">{session.sessionName}</div>
                                <div className="text-xs text-muted-foreground">
                                  Session ID: {session.sessionId} | Status:{' '}
                                  <Badge variant="outline" className="text-xs">
                                    {session.status}
                                  </Badge>
                                </div>
                                {session.rounds.length > 0 && (
                                  <div className="text-xs mt-1">
                                    Rounds ({session.rounds.length}):{' '}
                                    {session.rounds.map((r: any) => r.roundName).join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground ml-4">
                            No sessions
                          </div>
                        )}
                      </div>

                      {/* Participants */}
                      <div className="mt-3">
                        <div className="font-semibold text-sm mb-2">
                          Participants ({org.participants.length}):
                        </div>
                        {org.participants.length > 0 ? (
                          <div className="space-y-2 ml-4">
                            {org.participants.map((p: any, pidx: number) => (
                              <div
                                key={pidx}
                                className="border-l-4 border-purple-500 pl-3 py-2 bg-purple-50 dark:bg-purple-950 rounded text-sm"
                              >
                                <div className="font-medium">
                                  {p.firstName} {p.lastName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Email: {p.email} | ID: {p.participantId} | Status:{' '}
                                  <Badge variant="outline" className="text-xs">
                                    {p.status}
                                  </Badge>
                                </div>
                                {p.company && (
                                  <div className="text-xs">Company: {p.company}</div>
                                )}
                                {p.registrations.length > 0 && (
                                  <div className="text-xs mt-1">
                                    <strong>Registrations ({p.registrations.length}):</strong>
                                    <div className="ml-2 mt-1 space-y-1">
                                      {p.registrations.map((reg: any, ridx: number) => (
                                        <div key={ridx} className="border-l-2 border-gray-400 pl-2">
                                          Session: "{reg.sessionName}" (ID: {reg.sessionId})
                                          <br />
                                          Round: "{reg.roundName}" (ID: {reg.roundId})
                                          <br />
                                          Status: <Badge variant="outline" className="text-xs">{reg.status}</Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground ml-4">
                            No participants
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Participants View */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">
                  👥 View by participants ({data.participantsView.length})
                </h3>
                <div className="space-y-4">
                  {data.participantsView.map((p: any, idx: number) => (
                    <div
                      key={idx}
                      className="border-l-4 border-purple-500 pl-4 py-3 bg-purple-50 dark:bg-purple-950 rounded"
                    >
                      <div className="font-bold text-lg">
                        {p.firstName} {p.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Email: {p.email} | ID: {p.participantId} | Status:{' '}
                        <Badge variant="outline">{p.status}</Badge>
                      </div>
                      {p.company && (
                        <div className="text-sm">Company: {p.company}</div>
                      )}

                      {/* Organizer */}
                      {p.organizer && (
                        <div className="mt-2 text-sm">
                          <strong>Organizer:</strong> {p.organizer.organizerName} (
                          {p.organizer.urlSlug})
                        </div>
                      )}

                      {/* Sessions */}
                      <div className="mt-3">
                        <div className="font-semibold text-sm mb-2">
                          Registered sessions ({p.sessions.length}):
                        </div>
                        {p.sessions.length > 0 ? (
                          <div className="space-y-2 ml-4">
                            {p.sessions.map((session: any, sidx: number) => (
                              <div
                                key={sidx}
                                className="border-l-4 border-green-500 pl-3 py-2 bg-green-50 dark:bg-green-950 rounded text-sm"
                              >
                                <div className="font-medium">{session.sessionName}</div>
                                <div className="text-xs text-muted-foreground">
                                  Session ID: {session.sessionId} | Round: {session.roundName} (ID:{' '}
                                  {session.roundId})
                                </div>
                                <div className="text-xs">
                                  Status:{' '}
                                  <Badge variant="outline" className="text-xs">
                                    {session.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground ml-4">
                            No session registrations
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw JSON */}
              <details className="border rounded-lg">
                <summary className="cursor-pointer p-4 font-semibold hover:bg-muted">
                  View raw JSON data
                </summary>
                <pre className="p-4 bg-muted text-xs overflow-auto max-h-96">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}