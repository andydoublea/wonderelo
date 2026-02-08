import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { debugLog, errorLog } from '../utils/debug';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Clock, 
  Mail, 
  Phone, 
  Download, 
  Search,
  Filter,
  UserCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Minus,
  MoreVertical,
  Edit,
  UserPlus,
  Handshake,
  UserX,
  UserMinus
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { NetworkingSession } from '../App';
import { toast } from 'sonner@2.0.3';
import { SessionDisplayCard } from './SessionDisplayCard';

interface SessionAdministrationProps {
  session: NetworkingSession;
  onBack: () => void;
}

interface RoundRegistration {
  roundId: string;
  roundName: string;
  startTime: string;
  duration: number;
  status: 'registered' | 'cancelled' | 'confirmed' | 'unconfirmed' | 'met' | 'missed' | 'left-alone';
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
      const { projectId } = await import('../utils/supabase/info');
      const accessToken = localStorage.getItem('supabase_access_token');
      
      if (!accessToken) return;
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/profile`,
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
      const { projectId } = await import('../utils/supabase/info');
      const accessToken = localStorage.getItem('supabase_access_token');
      
      if (!accessToken) {
        toast.error('Not authenticated');
        return;
      }
      
      // Use new endpoint
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/organizer/${userSlug}/session/${session.id}/participants`,
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
      const { projectId } = await import('../utils/supabase/info');
      const accessToken = localStorage.getItem('supabase_access_token');
      
      if (!accessToken) {
        toast.error('Not authenticated');
        return;
      }
      
      // Call endpoint to get participants for this round with matching information
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/organizer/${userSlug}/session/${session.id}/round/${roundId}/participants`,
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
      const { projectId } = await import('../utils/supabase/info');
      const accessToken = localStorage.getItem('supabase_access_token');
      
      if (!accessToken) {
        toast.error('Not authenticated');
        return;
      }
      
      // Use new endpoint: /participants/:participantId/rounds/:roundId/status
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/participants/${registrationId}/rounds/${roundId}/status`,
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

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'registered':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'unconfirmed':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'met':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'missed':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
      case 'left-alone':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSessionStatusIcon = (status: string) => {
    switch (status) {
      case 'registered':
        return <UserPlus className="h-3 w-3" />;
      case 'confirmed':
        return <CheckCircle className="h-3 w-3" />;
      case 'unconfirmed':
        return <XCircle className="h-3 w-3" />;
      case 'cancelled':
        return <Minus className="h-3 w-3" />;
      case 'met':
        return <Handshake className="h-3 w-3" />;
      case 'missed':
        return <UserX className="h-3 w-3" />;
      case 'left-alone':
        return <UserMinus className="h-3 w-3" />;
      default:
        return <HelpCircle className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'running':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
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
    leftAlone: filteredRegistrations.reduce((count, reg) => {
      const sessionReg = reg.sessions.find(s => s.sessionId === session.id);
      const rounds = sessionReg?.rounds || [];
      return count + (Array.isArray(rounds) ? rounds.filter(round => round.status === 'left-alone').length : 0);
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
    const totalMeetings = sessionStats.confirmed + sessionStats.met + sessionStats.missed + sessionStats.leftAlone;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h1 className="text-[20px]">Session report: {session.name}</h1>
        </div>
      </div>

      {/* Session Info and Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Session Card */}
        <div className="lg:col-span-1">
          <SessionDisplayCard session={session} adminMode={true} hideReportButton={true} />
        </div>

        {/* Right: Statistics in 2 columns */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Participant Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Participant statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Registered */}
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Registered</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-blue-600">{sessionStats.registered}</span>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {sessionStats.totalRoundRegistrations > 0 ? Math.round((sessionStats.registered / sessionStats.totalRoundRegistrations) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Cancelled */}
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-red-600" />
                  <span className="font-medium">Cancelled</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-red-600">{sessionStats.cancelled}</span>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {sessionStats.totalRoundRegistrations > 0 ? Math.round((sessionStats.cancelled / sessionStats.totalRoundRegistrations) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Confirmed */}
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Confirmed</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-green-600">{sessionStats.confirmed}</span>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {sessionStats.totalRoundRegistrations > 0 ? Math.round((sessionStats.confirmed / sessionStats.totalRoundRegistrations) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Unconfirmed */}
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Unconfirmed</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-orange-600">{sessionStats.unconfirmed}</span>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {sessionStats.totalRoundRegistrations > 0 ? Math.round((sessionStats.unconfirmed / sessionStats.totalRoundRegistrations) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Met */}
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Handshake className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium">Met</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-emerald-600">{sessionStats.met}</span>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {sessionStats.totalRoundRegistrations > 0 ? Math.round((sessionStats.met / sessionStats.totalRoundRegistrations) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Missed */}
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <UserX className="h-4 w-4 text-rose-600" />
                  <span className="font-medium">Missed</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-rose-600">{sessionStats.missed}</span>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {sessionStats.totalRoundRegistrations > 0 ? Math.round((sessionStats.missed / sessionStats.totalRoundRegistrations) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Left alone */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <UserMinus className="h-4 w-4 text-amber-600" />
                  <span className="font-medium">Left alone</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-amber-600">{sessionStats.leftAlone}</span>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {sessionStats.totalRoundRegistrations > 0 ? Math.round((sessionStats.leftAlone / sessionStats.totalRoundRegistrations) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Round Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Round statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event page views */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Event page views</span>
                </div>
                <div className="text-3xl font-bold">{roundStats.eventPageViews}</div>
                <p className="text-xs text-muted-foreground mt-1">Estimated views</p>
              </div>

              <Separator />

              {/* Average rounds per participant */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Average rounds per participant</span>
                </div>
                <div className="text-3xl font-bold">{roundStats.avgRoundsPerParticipant}</div>
              </div>

              <Separator />

              {/* Most unconfirmed round */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Most unconfirmed round</span>
                </div>
                {roundStats.mostUnconfirmedRound ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {generateRoundTimeDisplay(roundStats.mostUnconfirmedRound.startTime, roundStats.mostUnconfirmedRound.duration)}
                    </span>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      {roundStats.mostUnconfirmedRound.count} unconfirmed
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No unconfirmed rounds</p>
                )}
              </div>

              <Separator />

              {/* Most favourite rounds */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Most favourite rounds</span>
                </div>
                {roundStats.topRounds.length > 0 ? (
                  <div className="space-y-2">
                    {roundStats.topRounds.map((round, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {generateRoundTimeDisplay(round.startTime, round.duration)}
                        </span>
                        <Badge variant="secondary">
                          {round.count} {round.count === 1 ? 'registration' : 'registrations'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No rounds yet</p>
                )}
              </div>

              <Separator />

              {/* Contacts exchanged */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Handshake className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Contacts exchanged</span>
                </div>
                <div className="text-3xl font-bold text-emerald-600">
                  {roundStats.contactsExchangedPercent}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {sessionStats.met} of {roundStats.totalMeetings} meetings
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Round Participants View */}
      {session.rounds && session.rounds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Round participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Round Selector - Buttons */}
              <div>
                <Label className="mb-3 block">Select round</Label>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                  {session.rounds.map((round) => {
                    // Calculate participant count for this round
                    const participantCount = registrations.reduce((count, reg) => {
                      const sessionReg = reg.sessions.find(s => s.sessionId === session.id);
                      const rounds = sessionReg?.rounds || [];
                      return count + (Array.isArray(rounds) && rounds.some(r => r.roundId === round.id) ? 1 : 0);
                    }, 0);
                    
                    const isSelected = selectedRoundId === round.id;
                    
                    return (
                      <button
                        key={round.id}
                        onClick={() => {
                          setSelectedRoundId(round.id);
                          loadRoundParticipants(round.id);
                        }}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <div className="font-medium text-sm mb-0.5">{round.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Participants Table */}
              {selectedRoundId && (
                <div className="mt-6">
                  {isLoadingRoundParticipants ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-muted-foreground mt-2">Loading participants...</p>
                    </div>
                  ) : roundParticipants.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">Participant</th>
                            <th className="text-left p-3 font-medium">Status</th>
                            <th className="text-left p-3 font-medium">Met with</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {roundParticipants.map((participant: any, index: number) => (
                            <tr key={index} className="hover:bg-muted/30 transition-colors">
                              <td className="p-3">
                                <span className="font-medium">
                                  {anonymizeName(participant.firstName, participant.lastName)}
                                </span>
                              </td>
                              <td className="p-3">
                                <Badge className={getSessionStatusColor(participant.status)}>
                                  <div className="flex items-center gap-1">
                                    {getSessionStatusIcon(participant.status)}
                                    {participant.status}
                                  </div>
                                </Badge>
                              </td>
                              <td className="p-3">
                                {participant.matchedWith && participant.matchedWith.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {participant.matchedWith.map((match: any, matchIndex: number) => (
                                      <Badge key={matchIndex} variant="outline" className="text-xs">
                                        {anonymizeName(match.firstName, match.lastName)}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">No matches yet</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No participants found for this round</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}