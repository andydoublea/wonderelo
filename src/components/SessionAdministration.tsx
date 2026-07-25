import React, { useState, useEffect } from 'react';
import { debugLog, errorLog } from '../utils/debug';
import { NetworkingSession } from '../App';
import { toast } from 'sonner@2.0.3';
import { C, Italic, PageShell } from './redesign/organizerAtoms';

interface SessionAdministrationProps {
  session: NetworkingSession;
  onBack: () => void;
}

interface RoundRegistration {
  roundId: string;
  roundName: string;
  startTime: string;
  duration: number;
  status: 'registered' | 'confirmed' | 'matched' | 'checked-in' | 'met' | 'unconfirmed' | 'no-match' | 'missed' | 'cancelled';
  registeredAt: string;
  statusUpdatedAt?: string;
}

interface SessionRegistration {
  sessionId: string;
  sessionName: string;
  date: string;
  startTime: string;
  endTime: string;
  rounds: RoundRegistration[];
  registeredAt: string;
}

interface Registration {
  id: string;
  userSlug: string;
  participant: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  sessions: SessionRegistration[];
  registeredAt: string;
  overallStatus: string;
}

// ── inline SVG icon set (ported 1:1 from design/v06 screen-live-round) ──
const Ico = ({ d, size = 16, sw = 2 }: { d: string; size?: number; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
);
const I = {
  refresh:  '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>',
  minus:    '<circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>',
  check:    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  x:        '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  hand:     '<path d="M11 11V6a1.5 1.5 0 0 1 3 0v5M14 10V5a1.5 1.5 0 0 1 3 0v6M8 12V8a1.5 1.5 0 0 1 3 0v3"/><path d="M17 8a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-6 6h-2a6 6 0 0 1-5.2-3l-2.3-4a1.5 1.5 0 0 1 2.6-1.5L8 12"/>',
  userX:    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="8" x2="22" y2="13"/><line x1="22" y1="8" x2="17" y2="13"/>',
  help:     '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  eye:      '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  trend:    '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  alert:    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  clock:    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  cal:      '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  pin:      '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  users:    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
  userCheck:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>',
};

// ── participant status badge palette (ported from the mock) ──
const pBadge: Record<string, { bg: string; fg: string }> = {
  registered:   { bg: 'rgba(37,99,235,.12)',  fg: '#1d4ed8' },
  confirmed:    { bg: 'rgba(31,138,77,.12)',  fg: '#1f7a40' },
  unconfirmed:  { bg: 'rgba(217,119,6,.14)',  fg: '#b45309' },
  cancelled:    { bg: 'rgba(220,38,38,.10)',  fg: '#b91c1c' },
  matched:      { bg: 'rgba(124,58,160,.14)', fg: '#7c2da0' },
  'checked-in': { bg: 'rgba(79,70,229,.12)',  fg: '#4338ca' },
  met:          { bg: 'rgba(15,157,110,.14)', fg: '#0f7a57' },
  'no-match':   { bg: 'rgba(100,116,139,.14)', fg: '#475569' },
  missed:       { bg: 'rgba(225,29,72,.10)',  fg: '#be123c' },
};

export function SessionAdministration({ session, onBack }: SessionAdministrationProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userSlug, setUserSlug] = useState<string>('');
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const [roundParticipants, setRoundParticipants] = useState<any[]>([]);
  const [isLoadingRoundParticipants, setIsLoadingRoundParticipants] = useState(false);

  useEffect(() => {
    loadUserSlug();
  }, []);

  useEffect(() => {
    if (userSlug) {
      loadSessionRegistrations();
    }
  }, [session.id, userSlug]);

  const loadUserSlug = async () => {
    try {
      const { apiBaseUrl } = await import('../utils/supabase/info');
      const accessToken = localStorage.getItem('supabase_access_token');

      if (!accessToken) return;

      const response = await fetch(
        `${apiBaseUrl}/profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserSlug(data.user?.urlSlug || '');
      }
    } catch (error) {
      errorLog('Error loading user slug:', error);
    }
  };

  const loadSessionRegistrations = async () => {
    try {
      setIsLoading(true);
      const { apiBaseUrl } = await import('../utils/supabase/info');
      const accessToken = localStorage.getItem('supabase_access_token');

      if (!accessToken) {
        toast.error('Not authenticated');
        return;
      }

      // Use new endpoint
      const response = await fetch(
        `${apiBaseUrl}/organizer/${userSlug}/session/${session.id}/participants`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        debugLog('=== SESSION PARTICIPANTS RESPONSE ===');
        debugLog('Count:', result.count);
        debugLog('Participants:', result.participants);

        // Transform new format to old format for compatibility
        const participants = result.participants || [];
        const transformedRegistrations = participants.map((p: any) => ({
          id: p.participantId,
          userSlug: userSlug,
          participant: {
            firstName: p.name.split(' ')[0] || '',
            lastName: p.name.split(' ').slice(1).join(' ') || '',
            email: p.email,
            phone: `${p.phoneCountry}${p.phone}`,
          },
          sessions: p.registrations.map((r: any) => ({
            sessionId: r.sessionId,
            sessionName: r.sessionName,
            date: r.date,
            startTime: r.startTime,
            endTime: '', // Not provided in new format
            rounds: [{
              roundId: r.roundId,
              roundName: r.roundName,
              startTime: r.startTime,
              duration: r.duration,
              status: r.status,
              registeredAt: r.registeredAt,
              statusUpdatedAt: r.statusUpdatedAt
            }]
          })),
          registeredAt: p.registrations[0]?.registeredAt || '',
          overallStatus: 'active'
        }));

        debugLog('Transformed registrations:', transformedRegistrations);
        setRegistrations(transformedRegistrations);
      } else {
        const errorData = await response.json();
        errorLog('Failed to load participants:', errorData);
        toast.error(errorData.error || 'Failed to load participants');
      }
    } catch (error) {
      errorLog('Error loading session participants:', error);
      toast.error('Error loading participants');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoundParticipants = async (roundId: string) => {
    try {
      setIsLoadingRoundParticipants(true);
      const { apiBaseUrl } = await import('../utils/supabase/info');
      const accessToken = localStorage.getItem('supabase_access_token');

      if (!accessToken) {
        toast.error('Not authenticated');
        return;
      }

      // Call endpoint to get participants for this round with matching information
      const response = await fetch(
        `${apiBaseUrl}/organizer/${userSlug}/session/${session.id}/round/${roundId}/participants`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        debugLog('=== ROUND PARTICIPANTS RESPONSE ===');
        debugLog('Round ID:', roundId);
        debugLog('Participants:', result.participants);
        setRoundParticipants(result.participants || []);
      } else {
        const errorData = await response.json();
        errorLog('Failed to load round participants:', errorData);
        toast.error(errorData.error || 'Failed to load round participants');
        setRoundParticipants([]);
      }
    } catch (error) {
      errorLog('Error loading round participants:', error);
      toast.error('Error loading round participants');
      setRoundParticipants([]);
    } finally {
      setIsLoadingRoundParticipants(false);
    }
  };

  const updateRoundStatus = async (registrationId: string, sessionId: string, roundId: string, newStatus: string) => {
    try {
      const { apiBaseUrl } = await import('../utils/supabase/info');
      const accessToken = localStorage.getItem('supabase_access_token');

      if (!accessToken) {
        toast.error('Not authenticated');
        return;
      }

      // Use new endpoint: /participants/:participantId/rounds/:roundId/status
      const response = await fetch(
        `${apiBaseUrl}/participants/${registrationId}/rounds/${roundId}/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus
          }),
        }
      );

      if (response.ok) {
        toast.success('Status updated successfully');
        loadSessionRegistrations(); // Reload data
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update status');
      }
    } catch (error) {
      errorLog('Error updating status:', error);
      toast.error('Error updating status');
    }
  };

  // Manual refresh — reloads session participants and the selected round.
  const handleRefresh = () => {
    if (userSlug) loadSessionRegistrations();
    if (selectedRoundId) loadRoundParticipants(selectedRoundId);
    toast.success('Refreshing report…');
  };

  const formatDateTime = (date: string, time: string) => {
    const sessionDate = new Date(`${date}T${time}`);
    return sessionDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Generate full time display with duration
  const generateRoundTimeDisplay = (startTime: string, duration: number): string => {
    if (!startTime) return '';

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = startTotalMinutes + duration;

    const endHours = Math.floor(endTotalMinutes / 60);
    const endMinutes = endTotalMinutes % 60;

    const formatTime = (hours: number, minutes: number) =>
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    const formattedStart = formatTime(startHours, startMinutes);
    const formattedEnd = formatTime(endHours, endMinutes);

    return `${formattedStart} - ${formattedEnd}`;
  };

  const exportRegistrations = () => {
    if (registrations.length === 0) {
      toast.error('No registrations to export');
      return;
    }

    const csvData: any[] = [];

    registrations.forEach(reg => {
      // Find the session for this specific session
      const sessionReg = reg.sessions.find(s => s.sessionId === session.id);
      if (sessionReg) {
        const rounds = sessionReg.rounds || [];
        const fullName = `${reg.participant.firstName} ${reg.participant.lastName}`.trim();

        if (Array.isArray(rounds) && rounds.length > 0) {
          // Export each round as a separate row with full participant data
          rounds.forEach(round => {
            csvData.push({
              'Name': fullName,
              'Email': reg.participant.email,
              'Phone': reg.participant.phone,
              'Registration Date': new Date(reg.registeredAt).toLocaleDateString(),
              'Round Name': round.roundName,
              'Round Time': round.startTime,
              'Round Duration': `${round.duration} min`,
              'Round Status': round.status,
              'Status Updated': round.statusUpdatedAt ? new Date(round.statusUpdatedAt).toLocaleDateString() : 'N/A'
            });
          });
        } else {
          // Fallback for registrations without rounds
          csvData.push({
            'Name': fullName,
            'Email': reg.participant.email,
            'Phone': reg.participant.phone,
            'Registration Date': new Date(reg.registeredAt).toLocaleDateString(),
            'Round Name': 'N/A',
            'Round Time': 'N/A',
            'Round Duration': 'N/A',
            'Round Status': 'N/A',
            'Status Updated': 'N/A'
          });
        }
      }
    });

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${session.name}-registrations.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Registrations exported successfully!');
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const sessionReg = reg.sessions.find(s => s.sessionId === session.id);
    if (!sessionReg) return false;

    const fullName = `${reg.participant.firstName} ${reg.participant.lastName}`.trim();
    const matchesSearch = searchTerm === '' ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.participant.email.toLowerCase().includes(searchTerm.toLowerCase());

    // Check if any round matches the status filter
    const rounds = sessionReg.rounds || [];
    const matchesStatus = statusFilter === 'all' ||
      (Array.isArray(rounds) && rounds.some(round => round.status === statusFilter));

    return matchesSearch && matchesStatus;
  });

  // Calculate stats based on round-specific statuses
  const totalRoundRegistrations = filteredRegistrations.reduce((total, reg) => {
    const sessionReg = reg.sessions.find(s => s.sessionId === session.id);
    const rounds = sessionReg?.rounds || [];
    return total + (Array.isArray(rounds) ? rounds.length : 0);
  }, 0);

  const sessionStats = {
    totalParticipants: filteredRegistrations.length,
    totalRoundRegistrations,
    registered: filteredRegistrations.reduce((count, reg) => {
      const sessionReg = reg.sessions.find(s => s.sessionId === session.id);
      const rounds = sessionReg?.rounds || [];
      return count + (Array.isArray(rounds) ? rounds.filter(round => round.status === 'registered').length : 0);
    }, 0),
    confirmed: filteredRegistrations.reduce((count, reg) => {
      const sessionReg = reg.sessions.find(s => s.sessionId === session.id);
      const rounds = sessionReg?.rounds || [];
      return count + (Array.isArray(rounds) ? rounds.filter(round => round.status === 'confirmed').length : 0);
    }, 0),
    unconfirmed: filteredRegistrations.reduce((count, reg) => {
      const sessionReg = reg.sessions.find(s => s.sessionId === session.id);
      const rounds = sessionReg?.rounds || [];
      return count + (Array.isArray(rounds) ? rounds.filter(round => round.status === 'unconfirmed').length : 0);
    }, 0),
    cancelled: filteredRegistrations.reduce((count, reg) => {
      const sessionReg = reg.sessions.find(s => s.sessionId === session.id);
      const rounds = sessionReg?.rounds || [];
      return count + (Array.isArray(rounds) ? rounds.filter(round => round.status === 'cancelled').length : 0);
    }, 0),
    met: filteredRegistrations.reduce((count, reg) => {
      const sessionReg = reg.sessions.find(s => s.sessionId === session.id);
      const rounds = sessionReg?.rounds || [];
      return count + (Array.isArray(rounds) ? rounds.filter(round => round.status === 'met').length : 0);
    }, 0),
    missed: filteredRegistrations.reduce((count, reg) => {
      const sessionReg = reg.sessions.find(s => s.sessionId === session.id);
      const rounds = sessionReg?.rounds || [];
      return count + (Array.isArray(rounds) ? rounds.filter(round => round.status === 'missed').length : 0);
    }, 0),
    noMatch: filteredRegistrations.reduce((count, reg) => {
      const sessionReg = reg.sessions.find(s => s.sessionId === session.id);
      const rounds = sessionReg?.rounds || [];
      return count + (Array.isArray(rounds) ? rounds.filter(round => round.status === 'no-match').length : 0);
    }, 0),
    registrationRate: session.limitParticipants
      ? Math.round((filteredRegistrations.length / (session.maxParticipants || 1)) * 100)
      : null
  };

  // Calculate round statistics
  const roundStats = (() => {
    // Event page views - for now we'll track this as registrations count
    // In future this could be tracked via actual page view analytics
    const eventPageViews = filteredRegistrations.length > 0 ? filteredRegistrations.length * 3 : 0; // Estimate: 3 views per registration

    // Average rounds per participant
    const avgRoundsPerParticipant = filteredRegistrations.length > 0
      ? (totalRoundRegistrations / filteredRegistrations.length).toFixed(1)
      : '0.0';

    // Group rounds by time to find most popular
    const roundsByTime: { [key: string]: { count: number; roundName: string; startTime: string; duration: number } } = {};

    filteredRegistrations.forEach(reg => {
      const sessionReg = reg.sessions.find(s => s.sessionId === session.id);
      const rounds = sessionReg?.rounds || [];

      if (Array.isArray(rounds)) {
        rounds.forEach(round => {
          const key = `${round.startTime}-${round.duration}`;
          if (!roundsByTime[key]) {
            roundsByTime[key] = {
              count: 0,
              roundName: round.roundName,
              startTime: round.startTime,
              duration: round.duration
            };
          }
          roundsByTime[key].count++;
        });
      }
    });

    // Get top 3 most popular rounds
    const topRounds = Object.values(roundsByTime)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Group rounds by time to find most unconfirmed
    const unconfirmedByTime: { [key: string]: { count: number; roundName: string; startTime: string; duration: number } } = {};

    filteredRegistrations.forEach(reg => {
      const sessionReg = reg.sessions.find(s => s.sessionId === session.id);
      const rounds = sessionReg?.rounds || [];

      if (Array.isArray(rounds)) {
        rounds.forEach(round => {
          if (round.status === 'unconfirmed') {
            const key = `${round.startTime}-${round.duration}`;
            if (!unconfirmedByTime[key]) {
              unconfirmedByTime[key] = {
                count: 0,
                roundName: round.roundName,
                startTime: round.startTime,
                duration: round.duration
              };
            }
            unconfirmedByTime[key].count++;
          }
        });
      }
    });

    // Get most unconfirmed round
    const mostUnconfirmedRound = Object.values(unconfirmedByTime)
      .sort((a, b) => b.count - a.count)[0] || null;

    // Calculate contacts exchanged percentage
    // We count "met" status as contacts exchanged
    const metCount = sessionStats.met;
    const totalMeetings = sessionStats.confirmed + sessionStats.met + sessionStats.missed + sessionStats.noMatch;
    const contactsExchangedPercent = totalMeetings > 0
      ? Math.round((metCount / totalMeetings) * 100)
      : 0;

    return {
      eventPageViews,
      avgRoundsPerParticipant,
      mostUnconfirmedRound,
      topRounds,
      contactsExchangedPercent,
      totalMeetings
    };
  })();

  // Anonymize name: show first name + first letter of last name
  const anonymizeName = (firstName: string, lastName: string): string => {
    const lastInitial = lastName && lastName.length > 0 ? `${lastName.charAt(0)}.` : '';
    return `${firstName} ${lastInitial}`.trim();
  };

  // ── derived presentation for the session card (real NetworkingSession data) ──
  const published = session.status !== 'draft';
  const statusLabel = published ? 'Published' : 'Draft';

  const sessionDateLabel = (() => {
    const d = session.date || session.rounds?.[0]?.date;
    if (!d) return 'Date to be set';
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return 'Date to be set';
    return parsed.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  })();

  const timeLine = `${session.startTime || '—'} · ${session.rounds?.length || 0} rounds · ${session.roundDuration} min`;

  const pointLine = (() => {
    const pts = (session.meetingPoints || []).map((p: any) => (typeof p === 'string' ? p : p?.name)).filter(Boolean);
    if (pts.length === 0) return 'No meeting point set';
    if (pts.length <= 2) return pts.join(', ');
    return `${pts.slice(0, 2).join(', ')} +${pts.length - 2} more`;
  })();

  const modeLine = (() => {
    const size = session.groupSize === 2 ? 'Pairs' : `Groups of ${session.groupSize}`;
    const extras = [session.enableTeams ? 'Teams' : null, session.enableTopics ? 'Topics' : null].filter(Boolean);
    return extras.length ? `${size} · ${extras.join(' · ')}` : size;
  })();

  // ── participant statistics rows (data from sessionStats, styling from the mock) ──
  const pStatTotal = sessionStats.totalRoundRegistrations;
  const pStats = [
    { label: 'Registered',  value: sessionStats.registered,  color: '#2563eb', icon: I.userPlus },
    { label: 'Cancelled',   value: sessionStats.cancelled,   color: '#dc2626', icon: I.minus },
    { label: 'Confirmed',   value: sessionStats.confirmed,   color: '#1f8a4d', icon: I.check },
    { label: 'Unconfirmed', value: sessionStats.unconfirmed, color: '#d97706', icon: I.x },
    { label: 'Met',         value: sessionStats.met,         color: '#0f9d6e', icon: I.hand },
    { label: 'Missed',      value: sessionStats.missed,      color: '#e11d48', icon: I.userX },
    { label: 'No match',    value: sessionStats.noMatch,     color: '#64748b', icon: I.help },
  ];

  // ── local presentational atoms (ported from the mock) ──
  const StatCard = ({ children }: { children: React.ReactNode }) => (
    <section style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 18, overflow: 'hidden' }}>{children}</section>
  );
  const CardHead = ({ title }: { title: string }) => (
    <div style={{ padding: '20px 24px 14px' }}>
      <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 18, color: C.purpleDeep, letterSpacing: '-0.015em' }}>{title}</h3>
    </div>
  );
  const Sep = () => <div style={{ height: 1, background: C.hair, margin: '16px 0' }} />;
  const StatBig = ({ icon, label, value, sub, valueColor }: { icon: string; label: string; value: React.ReactNode; sub?: string; valueColor?: string }) => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><Ico d={icon} size={15} /></span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{label}</span>
      </div>
      <div style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 30, letterSpacing: '-0.03em', color: valueColor || C.purpleDeep, lineHeight: 1 }}>{value}</div>
      {sub && <p style={{ margin: '5px 0 0', fontSize: 11.5, color: C.ink, opacity: .55 }}>{sub}</p>}
    </div>
  );

  const headerBtnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 11,
    background: 'transparent', border: `1.5px solid ${C.hairStrong}`, color: C.purpleDeep,
    fontFamily: C.fontBody, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
    transition: 'background .15s, border-color .15s',
  };
  const onHeaderBtnEnter = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = C.cream; e.currentTarget.style.borderColor = C.orange; };
  const onHeaderBtnLeave = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.hairStrong; };

  return (
    <PageShell nav={false} footer={false} bg={C.paper}>
      {/* Header — Round report + Refresh / Export */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
        <div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: published ? C.orange : '#b45309', fontSize: 11, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', fontFamily: C.fontBody }}>
            <span style={{ width: 24, height: 1, background: published ? C.orange : '#b45309' }} />{published ? 'Live round monitor' : 'Round preview · not published'}
          </span>
          <h1 style={{ margin: '12px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 40, lineHeight: 1, letterSpacing: '-0.035em', color: C.purpleDeep }}>
            Round <Italic>report</Italic><span style={{ color: C.orange, fontFamily: C.fontDisplay, fontWeight: 800, margin: '0 4px 0 1px' }}>:</span>{session.name}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button type="button" onClick={exportRegistrations} style={headerBtnBase} onMouseEnter={onHeaderBtnEnter} onMouseLeave={onHeaderBtnLeave}>
            <Ico d={I.download} size={15} /> Export CSV
          </button>
          <button type="button" onClick={handleRefresh} style={headerBtnBase} onMouseEnter={onHeaderBtnEnter} onMouseLeave={onHeaderBtnLeave}>
            <Ico d={I.refresh} size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Session card + statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 22, alignItems: 'start', marginBottom: 22 }}>
        {/* Left — session card */}
        <div style={{ overflow: 'hidden', background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 18, boxShadow: '0 10px 26px rgba(75,29,81,.06)' }}>
          <div style={{ height: 4, background: C.orange }} />
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 22, letterSpacing: '-.025em', color: C.purpleDeep, lineHeight: 1.05 }}>{session.name}</h3>
              <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: published ? 'rgba(221,83,28,.10)' : 'rgba(217,119,6,.12)', border: `1px solid ${published ? 'rgba(221,83,28,.30)' : 'rgba(217,119,6,.32)'}`, color: published ? C.orange : '#b45309', fontFamily: C.fontMono, fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: published ? C.orange : '#d97706' }} />{statusLabel}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[[I.cal, sessionDateLabel], [I.clock, timeLine], [I.pin, pointLine], [I.users, modeLine]].map(([ic, tx], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: C.ink }}>
                  <span style={{ color: C.orange, display: 'inline-flex', flexShrink: 0 }}><Ico d={ic as string} size={16} /></span>{tx}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 14, borderTop: `1px solid ${C.hair}`, fontSize: 13.5, color: C.purpleDeep, fontWeight: 600 }}>
              <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><Ico d={I.users} size={15} /></span>{sessionStats.totalParticipants} registered across all rounds
            </div>
          </div>
        </div>

        {/* Right — two stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          {/* Participant statistics */}
          <StatCard>
            <CardHead title="Participant statistics" />
            <div style={{ padding: '0 24px 22px' }}>
              {pStats.map((s, i) => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < pStats.length - 1 ? `1px solid ${C.hair}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ color: s.color, display: 'inline-flex' }}><Ico d={s.icon} size={16} /></span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{s.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', color: s.color }}>{s.value}</span>
                    <span style={{ width: 38, textAlign: 'right', fontSize: 12.5, fontFamily: C.fontMono, color: C.ink, opacity: .55 }}>{pStatTotal > 0 ? Math.round((s.value / pStatTotal) * 100) : 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          </StatCard>

          {/* Round statistics */}
          <StatCard>
            <CardHead title="Round statistics" />
            <div style={{ padding: '0 24px 22px' }}>
              <StatBig icon={I.eye} label="Event page views" value={roundStats.eventPageViews.toLocaleString()} sub="Estimated views" />
              <Sep />
              <StatBig icon={I.trend} label="Average rounds per participant" value={roundStats.avgRoundsPerParticipant} />
              <Sep />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: '#d97706', display: 'inline-flex' }}><Ico d={I.alert} size={15} /></span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Most unconfirmed round</span>
                </div>
                {roundStats.mostUnconfirmedRound ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontSize: 13, color: C.ink, opacity: .7, fontFamily: C.fontMono }}>{generateRoundTimeDisplay(roundStats.mostUnconfirmedRound.startTime, roundStats.mostUnconfirmedRound.duration)}</span>
                    <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: 'rgba(217,119,6,.14)', color: '#b45309', whiteSpace: 'nowrap' }}>{roundStats.mostUnconfirmedRound.count} unconfirmed</span>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: C.ink, opacity: .6 }}>No unconfirmed rounds</p>
                )}
              </div>
              <Sep />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><Ico d={I.clock} size={15} /></span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Most favourite rounds</span>
                </div>
                {roundStats.topRounds.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {roundStats.topRounds.map((r, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ fontSize: 13, color: C.ink, opacity: .7, fontFamily: C.fontMono }}>{generateRoundTimeDisplay(r.startTime, r.duration)}</span>
                        <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: 'rgba(76,25,77,.06)', color: C.purpleDeep, whiteSpace: 'nowrap' }}>{r.count} {r.count === 1 ? 'registration' : 'registrations'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: C.ink, opacity: .6 }}>No rounds yet</p>
                )}
              </div>
              <Sep />
              <StatBig icon={I.hand} label="Contacts exchanged" value={`${roundStats.contactsExchangedPercent}%`} valueColor="#0f9d6e" sub={`${sessionStats.met} of ${roundStats.totalMeetings} meetings`} />
            </div>
          </StatCard>
        </div>
      </div>

      {/* Round participants */}
      {session.rounds && session.rounds.length > 0 && (
        <StatCard>
          <CardHead title="Round participants" />
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.purpleDeep, marginBottom: 12 }}>Select round</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 22 }}>
              {session.rounds.map((round: any) => {
                // Calculate participant count for this round
                const participantCount = registrations.reduce((count, reg) => {
                  const sessionReg = reg.sessions.find(s => s.sessionId === session.id);
                  const rounds = sessionReg?.rounds || [];
                  return count + (Array.isArray(rounds) && rounds.some(r => r.roundId === round.id) ? 1 : 0);
                }, 0);

                const on = selectedRoundId === round.id;
                return (
                  <button
                    key={round.id}
                    type="button"
                    onClick={() => {
                      setSelectedRoundId(round.id);
                      loadRoundParticipants(round.id);
                    }}
                    style={{
                      textAlign: 'left', padding: '13px 16px', borderRadius: 12, cursor: 'pointer',
                      border: `2px solid ${on ? C.orange : C.hairStrong}`, background: on ? 'rgba(221,83,28,.05)' : '#fff',
                      fontFamily: C.fontBody, transition: 'border-color .15s, background .15s',
                    }}
                    onMouseEnter={(e) => { if (!on) { e.currentTarget.style.borderColor = 'rgba(221,83,28,.5)'; e.currentTarget.style.background = C.cream; } }}
                    onMouseLeave={(e) => { if (!on) { e.currentTarget.style.borderColor = C.hairStrong; e.currentTarget.style.background = '#fff'; } }}
                  >
                    <div style={{ fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 14.5, color: C.purpleDeep }}>{round.name}</div>
                    <div style={{ marginTop: 2, fontSize: 12.5, color: C.ink, opacity: .6 }}>{participantCount} {participantCount === 1 ? 'participant' : 'participants'}</div>
                  </button>
                );
              })}
            </div>

            {/* Participants table */}
            {selectedRoundId && (
              isLoadingRoundParticipants ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ width: 32, height: 32, margin: '0 auto', borderRadius: '50%', border: `3px solid ${C.hair}`, borderBottomColor: C.orange, animation: 'spin 0.8s linear infinite' }} />
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <p style={{ margin: '12px 0 0', fontSize: 13.5, color: C.ink, opacity: .6 }}>Loading participants…</p>
                </div>
              ) : roundParticipants.length > 0 ? (
                <div style={{ border: `1px solid ${C.hair}`, borderRadius: 14, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: C.cream }}>
                        {['Participant', 'Status', 'Met with'].map((h) => (
                          <th key={h} style={{ textAlign: 'left', padding: '12px 18px', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: C.purple, opacity: .8 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {roundParticipants.map((participant: any, index: number) => {
                        const b = pBadge[participant.status] || { bg: 'rgba(76,25,77,.06)', fg: C.purpleDeep };
                        return (
                          <tr key={index} style={{ borderTop: `1px solid ${C.hair}` }}>
                            <td style={{ padding: '13px 18px', fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 14, color: C.purpleDeep }}>{anonymizeName(participant.firstName, participant.lastName)}</td>
                            <td style={{ padding: '13px 18px' }}>
                              <span style={{ padding: '4px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: b.bg, color: b.fg, whiteSpace: 'nowrap' }}>{participant.status}</span>
                            </td>
                            <td style={{ padding: '13px 18px' }}>
                              {participant.matchedWith && participant.matchedWith.length > 0 ? (
                                <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 6 }}>
                                  {participant.matchedWith.map((match: any, matchIndex: number) => (
                                    <span key={matchIndex} style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, border: `1px solid ${C.hairStrong}`, color: C.purpleDeep }}>{anonymizeName(match.firstName, match.lastName)}</span>
                                  ))}
                                </span>
                              ) : (
                                <span style={{ fontSize: 13, color: C.ink, opacity: .5 }}>No matches yet</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: C.ink }}>
                  <span style={{ display: 'inline-flex', opacity: .4, marginBottom: 12 }}><Ico d={I.userCheck} size={44} sw={1.5} /></span>
                  <p style={{ margin: 0, fontSize: 14, opacity: .6 }}>No participants found for this round</p>
                </div>
              )
            )}
          </div>
        </StatCard>
      )}
    </PageShell>
  );
}
