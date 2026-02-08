import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ArrowLeft, RefreshCw, Search } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DebugDataPageProps {
  onBack: () => void;
  accessToken: string;
}

export function DebugDataPage({ onBack, accessToken }: DebugDataPageProps) {
  const [eventSlug, setEventSlug] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchDebugData = async () => {
    if (!eventSlug.trim()) {
      setData({ 
        error: 'Please enter an event slug',
        availableEvents: [] 
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/event-data?eventSlug=${encodeURIComponent(eventSlug)}&sessionName=${encodeURIComponent(sessionName)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        const error = await response.json();
        console.error('Failed to fetch debug data:', error);
        setData(error); // Store error data to display available events
      }
    } catch (error) {
      console.error('Error fetching debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Debug event data</CardTitle>
              <CardDescription>
                View raw data for event and session to debug synchronization issues
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchDebugData} disabled={loading}>
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
          <div className="space-y-4">
            {/* Inputs */}
            <div className="flex gap-2">
              <Input
                placeholder="Event slug (e.g. testik-malicky)"
                value={eventSlug}
                onChange={(e) => setEventSlug(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Session name (e.g. Test Session A)"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={fetchDebugData} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            {/* Results */}
            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                Loading debug data...
              </div>
            )}

            {!loading && data && (
              <div className="space-y-6">
                {/* Error: Event Not Found */}
                {data.error && data.availableEvents && (
                  <div className="border border-red-300 rounded-lg p-4 bg-red-50 dark:bg-red-950">
                    <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">
                      ❌ {data.error}
                    </h3>
                    <div className="text-sm space-y-2">
                      <div>
                        <strong>Searched for:</strong> <code className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded">{data.searchedSlug}</code>
                      </div>
                      <div>
                        <strong>Available events ({data.availableEvents.length}):</strong>
                      </div>
                      <div className="space-y-2 mt-2">
                        {data.availableEvents.map((event: any, idx: number) => (
                          <div key={idx} className="border-l-4 border-blue-500 pl-3 py-2 bg-white dark:bg-slate-900">
                            <div className="font-medium">{event.organizerName}</div>
                            <div className="text-xs">
                              <strong>URL Slug:</strong>{' '}
                              <button
                                onClick={() => setEventSlug(event.urlSlug)}
                                className="text-blue-600 hover:underline cursor-pointer bg-blue-100 dark:bg-blue-900 px-1 rounded"
                              >
                                {event.urlSlug}
                              </button>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              User ID: {event.userId} | Email: {event.email}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Event Info */}
                {!data.error && (
                  <>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Event info</h3>
                  <div className="space-y-1 text-sm">
                    <div><strong>Event slug:</strong> {data.eventSlug || 'Not found'}</div>
                    <div><strong>Organizer ID:</strong> {data.organizerId || 'Not found'}</div>
                    <div><strong>Organizer name:</strong> {data.organizerName || 'Not found'}</div>
                  </div>
                </div>

                {/* Sessions */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">
                    All sessions for "{data.eventSlug}" ({data.sessions?.length || 0})
                  </h3>
                  {data.sessions && data.sessions.length > 0 ? (
                    <div className="space-y-3">
                      {data.sessions.map((session: any, idx: number) => (
                        <div key={idx} className="border-l-4 border-blue-500 pl-3 py-2 bg-blue-50 dark:bg-blue-950">
                          <div className="font-medium">{session.sessionName}</div>
                          <div className="text-xs text-muted-foreground">
                            Session ID: {session.sessionId}
                          </div>
                          <div className="text-xs">
                            Status: <Badge variant="outline">{session.status}</Badge>
                          </div>
                          <div className="text-xs mt-1">
                            Rounds: {session.rounds?.length || 0}
                          </div>
                          {session.rounds && session.rounds.length > 0 && (
                            <div className="ml-3 mt-2 space-y-1">
                              {session.rounds.map((round: any, ridx: number) => (
                                <div key={ridx} className="text-xs border-l-2 border-gray-300 pl-2">
                                  <strong>{round.roundName}</strong> (ID: {round.id})
                                  <br />
                                  Date: {round.date || 'Not set'} | Time: {round.startTime || 'Not set'}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No sessions found</div>
                  )}
                </div>

                {/* Target Session */}
                <div className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950">
                  <h3 className="font-semibold mb-2">
                    Target session: "{sessionName}"
                  </h3>
                  {data.targetSession ? (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <strong>Session ID:</strong> {data.targetSession.sessionId}
                      </div>
                      <div className="text-sm">
                        <strong>Status:</strong> <Badge>{data.targetSession.status}</Badge>
                      </div>
                      <div className="text-sm">
                        <strong>Rounds:</strong> {data.targetSession.rounds?.length || 0}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">Session not found!</div>
                  )}
                </div>

                {/* Participants in Target Session */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">
                    Participants in "{sessionName}" ({data.participantsInSession?.length || 0})
                  </h3>
                  {data.participantsInSession && data.participantsInSession.length > 0 ? (
                    <div className="space-y-2">
                      {data.participantsInSession.map((p: any, idx: number) => (
                        <div key={idx} className="border-l-4 border-green-500 pl-3 py-2 bg-green-50 dark:bg-green-950">
                          <div className="font-medium">
                            {p.firstName} {p.lastName} ({p.email})
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Participant ID: {p.participantId}
                          </div>
                          <div className="text-xs">
                            Registrations: {p.registrations?.length || 0}
                          </div>
                          {p.registrations && p.registrations.length > 0 && (
                            <div className="ml-3 mt-2 space-y-1">
                              {p.registrations.map((reg: any, ridx: number) => (
                                <div key={ridx} className="text-xs border-l-2 border-gray-300 pl-2">
                                  <strong>Session:</strong> "{reg.sessionName}" (ID: {reg.sessionId})
                                  <br />
                                  <strong>Round:</strong> "{reg.roundName}" (ID: {reg.roundId})
                                  <br />
                                  <strong>Status:</strong> <Badge variant="outline" className="text-xs">{reg.status}</Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No participants found for this session
                    </div>
                  )}
                </div>

                {/* All Participants for Event */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">
                    All participants for event "{data.eventSlug}" ({data.allParticipants?.length || 0})
                  </h3>
                  {data.allParticipants && data.allParticipants.length > 0 ? (
                    <div className="space-y-2">
                      {data.allParticipants.map((p: any, idx: number) => (
                        <div key={idx} className="border-l-4 border-purple-500 pl-3 py-2 bg-purple-50 dark:bg-purple-950">
                          <div className="font-medium">
                            {p.firstName} {p.lastName} ({p.email})
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Participant ID: {p.participantId}
                          </div>
                          <div className="text-xs">
                            Total registrations: {p.registrations?.length || 0}
                          </div>
                          {p.registrations && p.registrations.length > 0 && (
                            <div className="ml-3 mt-2 space-y-1">
                              {p.registrations.map((reg: any, ridx: number) => (
                                <div key={ridx} className="text-xs border-l-2 border-gray-300 pl-2">
                                  <strong>Session:</strong> "{reg.sessionName}" (ID: {reg.sessionId})
                                  <br />
                                  <strong>Round:</strong> "{reg.roundName}" (ID: {reg.roundId})
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No participants found for this event
                    </div>
                  )}
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
                </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}