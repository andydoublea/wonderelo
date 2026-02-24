import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { ArrowLeft, Search, RefreshCw, Mail, Phone, Calendar, Users, ChevronUp, ChevronDown, UserPlus, UserCheck, Edit, History, Send, Globe, Trash2, AlertTriangle, Check, X, Eye, LogIn, UserX, Clock, MailPlus, Activity, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { debugLog, errorLog } from '../utils/debug';
import { apiBaseUrl } from '../utils/supabase/info';
import { getStatusBadgeVariant } from '../utils/statusBadge';
import { useTime } from '../contexts/TimeContext';
import { useAdminParticipants } from '../hooks/useAdminQueries';

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  events: string[];
  sessionIds: string[];
  totalRegistrations: number;
  createdAt: string;
}

interface ParticipantRegistration {
  registrationId: string;
  sessionId: string;
  sessionName: string;
  sessionStatus: string;
  roundId: string;
  roundName: string;
  roundStatus: string;
  organizerName: string;
  organizerUrlSlug: string;
  status: string;
  date: string;
  startTime: string;
  duration: number;
  registeredAt: string;
  matchedWith?: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
  }>;
}

interface AuditLogEntry {
  participantId: string;
  action: string;
  details: any;
  timestamp: string;
}

interface AdminParticipantsProps {
  accessToken: string;
  onBack: () => void;
  onNavigateToSession?: (organizerUrlSlug: string, sessionId: string) => void;
}

export function AdminParticipants({ accessToken, onBack, onNavigateToSession }: AdminParticipantsProps) {
  // React Query for participant list (cached)
  const { data: participants = [], isLoading, isFetching: isRefetching, refetch: refetchParticipants } = useAdminParticipants(accessToken);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [expandedParticipantId, setExpandedParticipantId] = useState<string | null>(null);
  const [participantRegistrations, setParticipantRegistrations] = useState<ParticipantRegistration[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingAuditLog, setIsLoadingAuditLog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionFilter, setSessionFilter] = useState<string | null>(null);
  const [roundFilter, setRoundFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'registrations' | 'audit'>('registrations');
  
  // Delete dialogs
  const [deleteParticipantDialogOpen, setDeleteParticipantDialogOpen] = useState(false);
  const [deleteRegistrationDialogOpen, setDeleteRegistrationDialogOpen] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [registrationToDelete, setRegistrationToDelete] = useState<ParticipantRegistration | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Get current time from TimeContext
  const { getCurrentTime, simulatedTime } = useTime();
  
  // Helper to add simulated time parameter to URL (only when simulated time is active)
  const addSimulatedTimeParam = (url: string): string => {
    // Only add simulatedTime parameter if TimeControl is active
    if (simulatedTime !== null) {
      const currentTime = getCurrentTime();
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}simulatedTime=${currentTime.getTime()}`;
    }
    // Return URL unchanged if using real time
    return url;
  };
  
  // Apply filters from sessionStorage on mount
  React.useEffect(() => {
    // Check for session/round filters from Session Management
    const filterSession = sessionStorage.getItem('admin_participant_filter_session');
    const filterRound = sessionStorage.getItem('admin_participant_filter_round');

    if (filterSession && filterRound) {
      debugLog('Applying session/round filter from Session Management:', { filterSession, filterRound });
      toast.info(`Filtering participants for session ${filterSession.substring(0, 8)}... and round ${filterRound.substring(0, 8)}...`);
      setSessionFilter(filterSession);
      setRoundFilter(filterRound);
      sessionStorage.removeItem('admin_participant_filter_session');
      sessionStorage.removeItem('admin_participant_filter_round');
    }

    // Check for email filter from other views
    const filterEmail = sessionStorage.getItem('admin_participant_filter');
    if (filterEmail) {
      debugLog('Applying email filter:', filterEmail);
      setSearchQuery(filterEmail);
      sessionStorage.removeItem('admin_participant_filter');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update filteredParticipants when participants data changes
  React.useEffect(() => {
    setFilteredParticipants(participants);
  }, [participants]);

  const fetchParticipantDetail = async (participantId: string) => {
    try {
      setIsLoadingDetail(true);
      const response = await fetch(
        addSimulatedTimeParam(`${apiBaseUrl}/admin/participants/${participantId}`),
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setParticipantRegistrations(result.registrations || []);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to fetch participant details');
      }
    } catch (error) {
      errorLog('Error fetching participant details:', error);
      toast.error('Network error while fetching participant details');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const fetchAuditLog = async (participantId: string) => {
    try {
      setIsLoadingAuditLog(true);
      const response = await fetch(
        addSimulatedTimeParam(`${apiBaseUrl}/admin/participants/${participantId}/audit-log`),
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setAuditLog(result.auditLog || []);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to fetch audit log');
      }
    } catch (error) {
      errorLog('Error fetching audit log:', error);
      toast.error('Network error while fetching audit log');
    } finally {
      setIsLoadingAuditLog(false);
    }
  };
  
  // Apply all filters when participants, searchQuery, sessionFilter, or roundFilter change
  React.useEffect(() => {
    let filtered = [...participants];
    
    // Apply search query filter (email, name, phone)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.phone?.toLowerCase().includes(query)
      );
    }
    
    // Apply session filter - filter by participants who have registrations in this session
    if (sessionFilter) {
      debugLog('Filtering by sessionId:', sessionFilter);
      filtered = filtered.filter(p => p.sessionIds?.includes(sessionFilter));
    }
    
    // Apply round filter - this requires expanding to check registrations detail
    // For now, we show message that round-level filtering requires expanding participant
    if (roundFilter) {
      debugLog('Round filter active:', roundFilter);
      // TODO: Backend should return participants filtered by roundId
      // For now, show all participants from the session
    }
    
    setFilteredParticipants(filtered);
  }, [participants, searchQuery, sessionFilter, roundFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
  };

  const handleToggleExpand = async (participant: Participant) => {
    if (expandedParticipantId === participant.id) {
      // Collapse
      setExpandedParticipantId(null);
      setParticipantRegistrations([]);
      setAuditLog([]);
      setActiveTab('registrations');
    } else {
      // Expand
      setExpandedParticipantId(participant.id);
      setActiveTab('registrations');
      await fetchParticipantDetail(participant.id);
      await fetchAuditLog(participant.id);
    }
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'scheduled': return 'bg-blue-500';
      case 'published': return 'bg-green-500';
      case 'completed': return 'bg-slate-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoundStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'scheduled': return 'bg-blue-500';
      case 'open-to-registration': return 'bg-green-500';
      case 'registration-safety-window': return 'bg-yellow-500';
      case 'matching': return 'bg-purple-500';
      case 'running': return 'bg-emerald-500';
      case 'completed': return 'bg-slate-500';
      default: return 'bg-gray-500';
    }
  };

  useEffect(() => {
    refetchParticipants();
  }, []);

  // Auto-expand and scroll to participant from sessionStorage
  useEffect(() => {
    const targetEmail = sessionStorage.getItem('admin_participant_filter');
    if (targetEmail && participants.length > 0) {
      // Find participant by email
      const targetParticipant = participants.find(p => p.email === targetEmail);
      if (targetParticipant) {
        // Expand the participant
        setExpandedParticipantId(targetParticipant.id);
        setActiveTab('registrations');
        fetchParticipantDetail(targetParticipant.id);
        fetchAuditLog(targetParticipant.id);
        
        // Scroll to participant after a short delay to ensure DOM is ready
        setTimeout(() => {
          const element = document.getElementById(`participant-row-${targetParticipant.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
        
        // Clear the filter from sessionStorage
        sessionStorage.removeItem('admin_participant_filter');
      }
    }
  }, [participants]);

  // Refetch when simulated time changes
  useEffect(() => {
    if (simulatedTime !== null) {
      refetchParticipants();
      // Also refetch detail if a participant is expanded
      if (expandedParticipantId) {
        fetchParticipantDetail(expandedParticipantId);
      }
    }
  }, [simulatedTime]);

  // REMOVED: Periodic refetch - use Refresh button instead

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAuditLogIcon = (action: string) => {
    switch (action) {
      // Profile & Auth
      case 'profile_created': return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'profile_updated': return <Edit className="h-4 w-4 text-blue-500" />;
      case 'email_verified': return <UserCheck className="h-4 w-4 text-purple-500" />;
      case 'verification_requested': return <Send className="h-4 w-4 text-orange-500" />;
      case 'verification_email_resent': return <MailPlus className="h-4 w-4 text-orange-400" />;
      case 'welcome_email_sent': return <Mail className="h-4 w-4 text-green-600" />;
      case 'token_accessed': return <LogIn className="h-4 w-4 text-blue-400" />;
      
      // Registration
      case 'registered_to_round': return <Check className="h-4 w-4 text-green-500" />;
      case 'added_to_multiple_rounds': return <Users className="h-4 w-4 text-green-600" />;
      case 'UNREGISTERED_FROM_ROUND': return <X className="h-4 w-4 text-red-500" />;
      
      // Attendance & Confirmation
      case 'confirmed_attendance':
      case 'CONFIRMED_ATTENDANCE': return <Check className="h-4 w-4 text-green-600" />;
      case 'missed_attendance_confirmation': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'auto_removed_no_confirmation': return <UserX className="h-4 w-4 text-orange-500" />;
      
      // Matching & Networking
      case 'matched_with_participant': return <Users className="h-4 w-4 text-purple-500" />;
      case 'checked_in': return <Check className="h-4 w-4 text-emerald-500" />;
      case 'no_show_reported': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'no_show_received': return <UserX className="h-4 w-4 text-red-600" />;
      
      // Status Changes
      case 'participant_status_changed': return <Activity className="h-4 w-4 text-blue-500" />;
      
      // Admin Actions
      case 'admin_deleted_registration': return <Trash2 className="h-4 w-4 text-destructive" />;
      case 'profile_viewed_by_admin': return <Eye className="h-4 w-4 text-muted-foreground" />;
      
      default: return <History className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAuditLogDescription = (entry: AuditLogEntry) => {
    switch (entry.action) {
      case 'profile_created':
        return `Profile created with ${entry.details.roundsCount || 0} round registration${entry.details.roundsCount !== 1 ? 's' : ''}`;
      
      case 'profile_updated':
        const updateChanges = [];
        if (entry.details.changes?.name) {
          updateChanges.push(`name changed from "${entry.details.changes.name.from}" to "${entry.details.changes.name.to}"`);
        }
        if (entry.details.changes?.phone) {
          updateChanges.push(`phone changed from "${entry.details.changes.phone.from}" to "${entry.details.changes.phone.to}"`);
        }
        if (entry.details.changes?.phoneCountry) {
          updateChanges.push(`country changed from "${entry.details.changes.phoneCountry.from}" to "${entry.details.changes.phoneCountry.to}"`);
        }
        const newRounds = entry.details.newRoundsCount > 0 ? ` and added ${entry.details.newRoundsCount} new round${entry.details.newRoundsCount !== 1 ? 's' : ''}` : '';
        return `Profile updated: ${updateChanges.join(', ')}${newRounds}`;
      
      case 'email_verified':
        const verifyChanges = [];
        if (entry.details.changes?.name) {
          verifyChanges.push(`name changed to "${entry.details.changes.name.to}"`);
        }
        if (entry.details.changes?.phone) {
          verifyChanges.push(`phone changed to "${entry.details.changes.phone.to}"`);
        }
        const newRoundsVerified = entry.details.newRoundsAdded > 0 ? ` and added ${entry.details.newRoundsAdded} new round${entry.details.newRoundsAdded !== 1 ? 's' : ''}` : '';
        return verifyChanges.length > 0 
          ? `Email verified: ${verifyChanges.join(', ')}${newRoundsVerified}`
          : `Email verified${newRoundsVerified}`;
      
      case 'verification_requested':
        const reason = entry.details.reason;
        if (reason === 'new_registration') {
          return `Verification email sent for new registration (${entry.details.roundsCount} round${entry.details.roundsCount !== 1 ? 's' : ''})`;
        } else if (reason === 'adding_new_rounds') {
          return `Verification email sent for adding ${entry.details.newRoundsCount} new round${entry.details.newRoundsCount !== 1 ? 's' : ''}`;
        } else if (reason === 'updating_profile_all_rounds_registered') {
          return `Verification email sent for profile update (name: ${entry.details.firstName} ${entry.details.lastName}, phone: ${entry.details.phone})`;
        }
        return 'Verification email sent';
      
      case 'admin_deleted_registration':
        return `Administrator deleted registration for round "${entry.details.roundName}"`;
      
      case 'verification_email_resent':
        return `Verification email resent (${entry.details.roundsCount || 0} round${entry.details.roundsCount !== 1 ? 's' : ''})`;
      
      case 'welcome_email_sent':
        return `Welcome email sent - ${entry.details.roundsActivated} round${entry.details.roundsActivated !== 1 ? 's' : ''} activated`;
      
      case 'token_accessed':
        return `Accessed participant dashboard`;
      
      case 'registered_to_round':
        return `Registered for "${entry.details.roundName}"${entry.details.requiresVerification ? ' (pending verification)' : ''}`;
      
      case 'added_to_multiple_rounds':
        return `Registered for ${entry.details.count} rounds at once`;
      
      case 'UNREGISTERED_FROM_ROUND':
        return `Unregistered from round "${entry.details.roundName || 'Unknown'}"`;
      
      case 'confirmed_attendance':
      case 'CONFIRMED_ATTENDANCE':
        return `Confirmed attendance for "${entry.details.roundName || 'round'}"`;
      
      case 'missed_attendance_confirmation':
        return `Missed attendance confirmation deadline${entry.details.reason ? `: ${entry.details.reason}` : ''}`;
      
      case 'auto_removed_no_confirmation':
        return `Automatically removed from matching - did not confirm attendance`;
      
      case 'matched_with_participant':
        const partners = entry.details.partnerNames?.join(', ') || 'other participants';
        return `Matched with ${partners} (${entry.details.groupSize || 2} people)`;
      
      case 'checked_in':
        return `Checked in via QR code`;
      
      case 'no_show_reported':
        return `Reported participant as no-show`;
      
      case 'no_show_received':
        return `Reported as no-show by another participant`;
      
      case 'participant_status_changed':
        return `Status changed: "${entry.details.oldStatus}" → "${entry.details.newStatus}"${entry.details.reason ? ` (${entry.details.reason})` : ''}`;
      
      case 'profile_viewed_by_admin':
        return `Profile viewed by administrator`;
      
      default:
        return entry.action.replace(/_/g, ' ');
    }
  };

  const handleDeleteParticipant = async () => {
    if (!participantToDelete) return;
    
    try {
      setIsDeleting(true);
      debugLog('Deleting participant:', participantToDelete.id);
      
      const response = await fetch(
        `${apiBaseUrl}/admin/participants/${participantToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        toast.success(`Participant ${participantToDelete.firstName} ${participantToDelete.lastName} deleted successfully`);
        setDeleteParticipantDialogOpen(false);
        setParticipantToDelete(null);
        setExpandedParticipantId(null);
        await refetchParticipants();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete participant');
      }
    } catch (error) {
      errorLog('Error deleting participant:', error);
      toast.error('Network error while deleting participant');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteRegistration = async () => {
    if (!registrationToDelete || !expandedParticipantId) return;
    
    try {
      setIsDeleting(true);
      debugLog('Deleting registration:', registrationToDelete.registrationId);
      
      const response = await fetch(
        `${apiBaseUrl}/admin/participants/${expandedParticipantId}/registrations/${registrationToDelete.roundId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        toast.success(`Registration for "${registrationToDelete.roundName}" deleted successfully`);
        setDeleteRegistrationDialogOpen(false);
        setRegistrationToDelete(null);
        await fetchParticipantDetail(expandedParticipantId);
        await fetchAuditLog(expandedParticipantId);
        await refetchParticipants();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete registration');
      }
    } catch (error) {
      errorLog('Error deleting registration:', error);
      toast.error('Network error while deleting registration');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participant management
                  {isRefetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </CardTitle>
                <CardDescription>
                  Manage all participants across all events
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchParticipants()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to admin
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, phone, or event..."
                value={searchQuery}
                onChange={handleSearch}
                className="max-w-sm"
              />
              
              {/* Active Filters */}
              {(sessionFilter || roundFilter) && (
                <div className="flex items-center gap-2">
                  {sessionFilter && (
                    <Badge variant="secondary" className="text-xs">
                      Session: {sessionFilter.substring(0, 8)}...
                    </Badge>
                  )}
                  {roundFilter && (
                    <Badge variant="secondary" className="text-xs">
                      Round: {roundFilter.substring(0, 8)}...
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSessionFilter(null);
                      setRoundFilter(null);
                      toast.info('Filters cleared');
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Registrations</TableHead>
                    <TableHead>First registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading participants...
                      </TableCell>
                    </TableRow>
                  ) : filteredParticipants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        {searchQuery ? 'No participants found matching your search.' : 'No participants found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredParticipants.flatMap((participant) => {
                      const isExpanded = expandedParticipantId === participant.id;
                      
                      const mainRow = (
                        <TableRow key={participant.id} id={`participant-row-${participant.id}`} className={isExpanded ? 'border-b-0' : ''}>
                          <TableCell>
                            <div className="font-mono text-xs">
                              {participant.id}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {participant.firstName} {participant.lastName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{participant.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {participant.phone && <Phone className="h-4 w-4 text-muted-foreground" />}
                              <span className="text-sm">{participant.phone || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{participant.totalRegistrations}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{formatDate(participant.createdAt)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleExpand(participant)}
                              title={isExpanded ? "Collapse details" : "Expand details"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                      
                      if (!isExpanded) {
                        return [mainRow];
                      }
                      
                      const detailRow = (
                        <TableRow key={`${participant.id}-detail`}>
                              <TableCell colSpan={7} className="bg-muted/50 p-6">
                                <div className="space-y-6">
                                  {/* Events Summary */}
                                  <div>
                                    <Label className="text-sm text-muted-foreground mb-2 block">Events participated</Label>
                                    <div className="flex flex-wrap gap-2">
                                      {participant.events.map((event, idx) => (
                                        <Badge key={idx} variant="secondary">
                                          {event}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Tabs for Registrations and Audit Log */}
                                  <div className="flex gap-2 border-b">
                                    <Button
                                      variant={activeTab === 'registrations' ? 'default' : 'ghost'}
                                      size="sm"
                                      onClick={() => setActiveTab('registrations')}
                                      className="rounded-b-none"
                                    >
                                      <Calendar className="h-4 w-4 mr-2" />
                                      Registration history ({participantRegistrations.length})
                                    </Button>
                                    <Button
                                      variant={activeTab === 'audit' ? 'default' : 'ghost'}
                                      size="sm"
                                      onClick={() => setActiveTab('audit')}
                                      className="rounded-b-none"
                                    >
                                      <History className="h-4 w-4 mr-2" />
                                      Activity log ({auditLog.length})
                                    </Button>
                                  </div>

                                  {/* Registrations Table */}
                                  {activeTab === 'registrations' && (
                                  <div>
                                    <Label className="text-sm text-muted-foreground mb-2 block">
                                      Registration history ({participantRegistrations.length} total)
                                    </Label>
                                    <div className="rounded-md border bg-background">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Organizer</TableHead>
                                            <TableHead>Session</TableHead>
                                            <TableHead>Round</TableHead>
                                            <TableHead>Date & time</TableHead>
                                            <TableHead>Match</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Registered</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {isLoadingDetail ? (
                                            <TableRow>
                                              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                Loading registrations...
                                              </TableCell>
                                            </TableRow>
                                          ) : participantRegistrations.length === 0 ? (
                                            <TableRow>
                                              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                No registrations found
                                              </TableCell>
                                            </TableRow>
                                          ) : (
                                            participantRegistrations.map((reg, idx) => (
                                              <TableRow key={idx}>
                                                <TableCell>
                                                  <div className="flex items-center gap-2">
                                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-mono">{reg.organizerUrlSlug}</span>
                                                  </div>
                                                  <p className="text-xs text-muted-foreground mt-1">
                                                    {reg.organizerName}
                                                  </p>
                                                </TableCell>
                                                <TableCell>
                                                  <div>
                                                    {onNavigateToSession ? (
                                                      <button
                                                        onClick={() => onNavigateToSession(reg.organizerUrlSlug, reg.sessionId)}
                                                        className="text-primary hover:underline cursor-pointer text-sm"
                                                      >
                                                        {reg.sessionName}
                                                      </button>
                                                    ) : (
                                                      <span className="text-sm">{reg.sessionName}</span>
                                                    )}
                                                    <div className="mt-1">
                                                      <Badge className={`${getSessionStatusColor(reg.sessionStatus)} text-white text-xs`}>
                                                        {reg.sessionStatus}
                                                      </Badge>
                                                    </div>
                                                  </div>
                                                </TableCell>
                                                <TableCell>
                                                  <div>
                                                    <span className="text-sm">{reg.roundName}</span>
                                                    <div className="mt-1">
                                                      <Badge className={`${getRoundStatusColor(reg.roundStatus)} text-white text-xs`}>
                                                        {reg.roundStatus}
                                                      </Badge>
                                                    </div>
                                                  </div>
                                                </TableCell>
                                                <TableCell>
                                                  <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                      <p className="text-sm">{reg.date}</p>
                                                      <p className="text-xs text-muted-foreground">
                                                        {reg.startTime} ({reg.duration} min)
                                                      </p>
                                                    </div>
                                                  </div>
                                                </TableCell>
                                                <TableCell>
                                                  {reg.matchedWith && reg.matchedWith.length > 0 ? (
                                                    <div className="space-y-1">
                                                      {reg.matchedWith.map((match, matchIdx) => (
                                                        <div key={matchIdx} className="text-xs flex items-center gap-1">
                                                          <Users className="h-3 w-3 text-muted-foreground" />
                                                          <span className="font-medium">{match.name}</span>
                                                          <Badge variant="outline" className="text-xs px-1 py-0">
                                                            {match.status}
                                                          </Badge>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  ) : (
                                                    <span className="text-xs text-muted-foreground">No match yet</span>
                                                  )}
                                                </TableCell>
                                                <TableCell>
                                                  <Badge variant={getStatusBadgeVariant(reg.status)}>
                                                    {reg.status}
                                                  </Badge>
                                                </TableCell>
                                                <TableCell>
                                                  <span className="text-sm">{formatDate(reg.registeredAt)}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                      setRegistrationToDelete(reg);
                                                      setDeleteRegistrationDialogOpen(true);
                                                    }}
                                                    title="Delete registration"
                                                  >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                  </Button>
                                                </TableCell>
                                              </TableRow>
                                            ))
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                  )}

                                  {/* Audit Log */}
                                  {activeTab === 'audit' && (
                                  <div>
                                    <Label className="text-sm text-muted-foreground mb-2 block">
                                      Activity log ({auditLog.length} total)
                                    </Label>
                                    <div className="rounded-md border bg-background">
                                      {isLoadingAuditLog ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                          Loading activity log...
                                        </div>
                                      ) : auditLog.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                          No activity recorded yet
                                        </div>
                                      ) : (
                                        <div className="divide-y">
                                          {auditLog.map((entry, idx) => (
                                            <div key={idx} className="p-4 hover:bg-muted/50 transition-colors">
                                              <div className="flex items-start gap-3">
                                                <div className="mt-1">
                                                  {getAuditLogIcon(entry.action)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center justify-between gap-2">
                                                    <span className="text-sm">
                                                      {getAuditLogDescription(entry)}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                      {formatDate(entry.timestamp)}
                                                    </span>
                                                  </div>
                                                  {/* Show details if available */}
                                                  {entry.details && Object.keys(entry.details).length > 0 && (
                                                    <details className="mt-2">
                                                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                                        View details
                                                      </summary>
                                                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                                                        {JSON.stringify(entry.details, null, 2)}
                                                      </pre>
                                                    </details>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  )}
                                  
                                  {/* Delete Participant Button */}
                                  <div className="pt-4 border-t">
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        setParticipantToDelete(participant);
                                        setDeleteParticipantDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete participant
                                    </Button>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                      
                        return [mainRow, detailRow];
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Delete Participant Dialog */}
        <Dialog open={deleteParticipantDialogOpen} onOpenChange={setDeleteParticipantDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete participant
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {participantToDelete?.firstName} {participantToDelete?.lastName}?
                This will permanently delete their profile and remove them from all {participantToDelete?.totalRegistrations} registered round{participantToDelete?.totalRegistrations !== 1 ? 's' : ''}.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteParticipantDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteParticipant}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete participant'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Registration Dialog */}
        <Dialog open={deleteRegistrationDialogOpen} onOpenChange={setDeleteRegistrationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete registration
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the registration for \"{registrationToDelete?.roundName}\"?
                This will remove the participant from this round. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteRegistrationDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteRegistration}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete registration'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}