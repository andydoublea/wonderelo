import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Trash2, Mail, Users, Search, Activity, ChevronUp, ChevronDown, Edit2, RotateCcw, UserX, Globe, Calendar, RefreshCw, Download, UserCheck, History, UserPlus } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { debugLog, errorLog } from '../utils/debug';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getParticipantStatusConfig, OrganizerStatusBadge } from '../utils/statusBadge';
import React from 'react';
import { copyToClipboard } from '../utils/clipboard';

interface Organizer {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
  serviceType: string;
  urlSlug: string;
  discoverySource: string;
  companySize: string;
  userRole: string;
}

interface UserSession {
  id: string;
  name: string;
  status: string;
  dbStatus: string;
  date: string;
  registrationStart: string;
  roundsCount: number;
  rounds: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    date: string;
  }[];
}

interface SessionParticipant {
  token: string;
  email: string;
  name: string;
  phone: string;
  registeredRounds: {
    roundId: string;
    roundName: string;
    status: string;
  }[];
  totalRounds: number;
  statuses: string[];
  overallStatus: string;
}

interface AdminStats {
  totalUsers: number;
  confirmedUsers: number;
  recentUsers: number;
  serviceTypes: { [key: string]: number };
  userRoles: { [key: string]: number };
  companySizes: { [key: string]: number };
}

interface AdminOrganizersProps {
  accessToken: string;
  onBack: () => void;
  onNavigateToParticipant?: (email: string) => void;
  onNavigateToSession?: (organizerUrlSlug: string, sessionId: string) => void;
}

export function AdminOrganizers({ accessToken, onBack, onNavigateToParticipant, onNavigateToSession }: AdminOrganizersProps) {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [filteredOrganizers, setFilteredOrganizers] = useState<Organizer[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOrganizer, setEditingOrganizer] = useState<Organizer | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Organizer>>({});
  const [expandedOrganizerId, setExpandedOrganizerId] = useState<string | null>(null);
  const [userSessions, setUserSessions] = useState<{ [userId: string]: UserSession[] }>({});
  const [loadingSessions, setLoadingSessions] = useState<{ [userId: string]: boolean }>({});
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [sessionParticipants, setSessionParticipants] = useState<{ [sessionId: string]: SessionParticipant[] }>({});
  const [loadingParticipants, setLoadingParticipants] = useState<{ [sessionId: string]: boolean }>({});
  const [organizerAuditLogs, setOrganizerAuditLogs] = useState<{ [organizerId: string]: any[] }>({});
  const [loadingAuditLog, setLoadingAuditLog] = useState<{ [organizerId: string]: boolean }>({});
  const [showingAuditLog, setShowingAuditLog] = useState<{ [organizerId: string]: boolean }>({});
  
  // Debug tools for session participants
  const [debugSessionId, setDebugSessionId] = useState<string | null>(null);
  const [debugParticipantKeys, setDebugParticipantKeys] = useState<string[]>([]);
  const [isLoadingDebugKeys, setIsLoadingDebugKeys] = useState(false);

  const fetchOrganizers = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/users`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setOrganizers(result.users || []);
        setFilteredOrganizers(result.users || []);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to fetch users');
      }
    } catch (error) {
      errorLog('Error fetching users:', error);
      toast.error('Network error while fetching users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/stats`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setStats(result.stats);
      }
    } catch (error) {
      errorLog('Error fetching stats:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/users/${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        toast.success('User deleted successfully');
        fetchOrganizers();
        fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete user');
      }
    } catch (error) {
      errorLog('Error deleting user:', error);
      toast.error('Network error while deleting user');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingOrganizer) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/users/${editingOrganizer.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editFormData),
        }
      );

      if (response.ok) {
        toast.success('User updated successfully');
        setIsEditDialogOpen(false);
        setEditingOrganizer(null);
        setEditFormData({});
        fetchOrganizers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update user');
      }
    } catch (error) {
      errorLog('Error updating user:', error);
      toast.error('Network error while updating user');
    }
  };

  const handleResetUserPassword = async (userId: string, userEmail: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/users/${userId}/reset-password`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Password reset email sent successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send password reset email');
      }
    } catch (error) {
      errorLog('Error resetting user password:', error);
      toast.error('Network error while resetting password');
    }
  };

  const handleImpersonateUser = async (userId: string, userEmail: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/users/${userId}/impersonate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        if (result.impersonationUrl) {
          window.open(result.impersonationUrl, '_blank');
          toast.success(`Impersonation link opened for ${userEmail}`);
        } else {
          toast.error('No impersonation URL received');
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate impersonation link');
      }
    } catch (error) {
      errorLog('Error impersonating user:', error);
      toast.error('Network error while generating impersonation link');
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term) {
      setFilteredOrganizers(organizers);
    } else {
      const filtered = organizers.filter(user =>
        user.email.toLowerCase().includes(term.toLowerCase()) ||
        user.urlSlug.toLowerCase().includes(term.toLowerCase()) ||
        user.userRole.toLowerCase().includes(term.toLowerCase()) ||
        user.companySize.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredOrganizers(filtered);
    }
  };

  const exportUsers = () => {
    const csv = [
      ['Email', 'URL Slug', 'Created At', 'Last Sign In', 'Service Type', 'Role', 'Company Size', 'Discovery Source', 'Email Confirmed'].join(','),
      ...filteredOrganizers.map(user => [
        user.email,
        user.urlSlug,
        user.createdAt,
        user.lastSignInAt || 'Never',
        user.serviceType,
        user.userRole,
        user.companySize,
        user.discoverySource,
        user.emailConfirmed ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `oliwonder-organizers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Organizers exported to CSV');
  };

  useEffect(() => {
    fetchOrganizers();
    fetchStats();
  }, []);

  // Auto-expand organizer and session from sessionStorage
  useEffect(() => {
    const targetOrganizerSlug = sessionStorage.getItem('admin_organizer_filter');
    const targetSessionId = sessionStorage.getItem('admin_session_filter');
    const targetOrganizerId = sessionStorage.getItem('admin_organizer_id_filter');
    
    // Handle navigation from Sessions page (by organizerId)
    if (targetOrganizerId && organizers.length > 0) {
      const targetOrganizer = organizers.find(org => org.id === targetOrganizerId);
      
      if (targetOrganizer) {
        // Expand the organizer
        setExpandedOrganizerId(targetOrganizer.id);
        
        // Fetch sessions for this organizer
        fetchUserSessions(targetOrganizer.id);
        
        // Scroll to organizer
        setTimeout(() => {
          const element = document.getElementById(`organizer-row-${targetOrganizer.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
        
        // Clear the filter from sessionStorage
        sessionStorage.removeItem('admin_organizer_id_filter');
      }
    }
    // Handle navigation from Participants page (by slug + sessionId)
    else if (targetOrganizerSlug && targetSessionId && organizers.length > 0) {
      // Find organizer by URL slug
      const targetOrganizer = organizers.find(org => org.urlSlug === targetOrganizerSlug);
      
      if (targetOrganizer) {
        // Expand the organizer
        setExpandedOrganizerId(targetOrganizer.id);
        
        // Fetch sessions for this organizer
        fetchUserSessions(targetOrganizer.id).then(() => {
          // After sessions are loaded, expand the specific session
          setExpandedSessionId(targetSessionId);
          
          // Fetch participants for the session
          fetchSessionParticipants(targetOrganizer.id, targetSessionId);
          
          // Scroll to session after a short delay to ensure DOM is ready
          setTimeout(() => {
            const element = document.getElementById(`session-row-${targetSessionId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 700);
        });
        
        // Clear the filters from sessionStorage
        sessionStorage.removeItem('admin_organizer_filter');
        sessionStorage.removeItem('admin_session_filter');
      }
    }
  }, [organizers]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchUserSessions = async (userId: string) => {
    setLoadingSessions(prev => ({ ...prev, [userId]: true }));
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/users/${userId}/sessions`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setUserSessions(prev => ({ ...prev, [userId]: result.sessions }));
      }
    } catch (error) {
      errorLog('Error fetching user sessions:', error);
    } finally {
      setLoadingSessions(prev => ({ ...prev, [userId]: false }));
    }
  };

  const fetchSessionParticipants = async (userId: string, sessionId: string) => {
    debugLog('🔍 FRONTEND: Fetching participants for', { userId, sessionId });
    setLoadingParticipants(prev => ({ ...prev, [sessionId]: true }));
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/users/${userId}/sessions/${sessionId}/participants`;
      debugLog('🔍 FRONTEND: Request URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      debugLog('🔍 FRONTEND: Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        debugLog('✅ FRONTEND: Received participants:', result);
        
        // Store debug info
        if (result.debug) {
          setDebugSessionId(sessionId);
          setDebugParticipantKeys(result.debug.allParticipantKeysInDB || []);
        }
        
        setSessionParticipants(prev => ({ ...prev, [sessionId]: result.participants }));
      } else {
        const errorData = await response.json();
        errorLog('❌ FRONTEND: Error response:', errorData);
      }
    } catch (error) {
      errorLog('❌ FRONTEND: Error fetching session participants:', error);
    } finally {
      setLoadingParticipants(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const handleToggleExpand = (organizer: Organizer) => {
    if (expandedOrganizerId === organizer.id) {
      setExpandedOrganizerId(null);
    } else {
      setExpandedOrganizerId(organizer.id);
    }
  };

  const fetchOrganizerAuditLog = async (organizerId: string) => {
    setLoadingAuditLog(prev => ({ ...prev, [organizerId]: true }));
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/organizers/${organizerId}/audit-log`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setOrganizerAuditLogs(prev => ({ ...prev, [organizerId]: result.auditLog }));
      } else {
        toast.error('Failed to fetch audit log');
      }
    } catch (error) {
      errorLog('Error fetching organizer audit log:', error);
      toast.error('Network error while fetching audit log');
    } finally {
      setLoadingAuditLog(prev => ({ ...prev, [organizerId]: false }));
    }
  };

  const toggleAuditLog = (organizerId: string) => {
    const currentlyShowing = showingAuditLog[organizerId];
    
    if (!currentlyShowing) {
      // Load audit log if not already loaded
      if (!organizerAuditLogs[organizerId]) {
        fetchOrganizerAuditLog(organizerId);
      }
      setShowingAuditLog(prev => ({ ...prev, [organizerId]: true }));
    } else {
      setShowingAuditLog(prev => ({ ...prev, [organizerId]: false }));
    }
  };

  const getAuditLogActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (action.includes('DELETE') || action.includes('SUSPENDED')) return 'destructive';
    if (action.includes('ADMIN')) return 'outline';
    if (action.includes('CREATE') || action.includes('REGISTERED')) return 'default';
    return 'secondary';
  };

  const getAuditLogSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Total organizers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{stats.totalUsers}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Confirmed organizers</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{stats.confirmedUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {((stats.confirmedUsers / stats.totalUsers) * 100).toFixed(1)}% confirmed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">New this week</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{stats.recentUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Active sessions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">0</div>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Organizers Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Organizer management</CardTitle>
                <CardDescription>
                  Manage platform organizers and their accounts
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportUsers}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={fetchOrganizers}>
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
                placeholder="Search by email, URL slug, role, or company size..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>URL slug</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last sign in</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading organizers...
                      </TableCell>
                    </TableRow>
                  ) : filteredOrganizers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        {searchTerm ? 'No organizers found matching your search.' : 'No organizers found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrganizers.map((user) => (
                      <React.Fragment key={user.id}>
                        <TableRow id={`organizer-row-${user.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (expandedOrganizerId === user.id) {
                                    setExpandedOrganizerId(null);
                                  } else {
                                    setExpandedOrganizerId(user.id);
                                    fetchUserSessions(user.id);
                                  }
                                }}
                              >
                                {expandedOrganizerId === user.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                              <div>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span>{user.email}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {user.name && user.name !== 'Not set' ? user.name : (
                                <span className="text-muted-foreground italic">Not set</span>
                              )}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono text-sm">
                                {user.urlSlug && user.urlSlug !== 'Not set' ? user.urlSlug : (
                                  <span className="text-muted-foreground italic">Not set</span>
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{formatDate(user.createdAt)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.lastSignInAt ? (
                              <span className="text-sm">{formatDate(user.lastSignInAt)}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.emailConfirmed ? "default" : "secondary"}>
                              {user.emailConfirmed ? "Confirmed" : "Pending"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                        {expandedOrganizerId === user.id && (
                          <TableRow key={`${user.id}-expanded`}>
                            <TableCell colSpan={6} className="bg-muted/30">
                              <div className="py-4 space-y-6">
                                {/* Organizer Details Section */}
                                <div>
                                  <h4 className="font-medium mb-3">Organizer details</h4>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Company size:</span>
                                      <span className="ml-2 font-medium">{user.companySize}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">User role:</span>
                                      <span className="ml-2 font-medium">{user.userRole}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Service type:</span>
                                      <span className="ml-2 font-medium">{user.serviceType}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Discovery source:</span>
                                      <span className="ml-2 font-medium">{user.discoverySource}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Actions Section */}
                                <div>
                                  <h4 className="font-medium mb-3">Actions</h4>
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingOrganizer(user);
                                        setEditFormData({
                                          email: user.email,
                                          urlSlug: user.urlSlug,
                                          userRole: user.userRole,
                                          companySize: user.companySize,
                                          serviceType: user.serviceType
                                        });
                                        setIsEditDialogOpen(true);
                                      }}
                                    >
                                      <Edit2 className="h-4 w-4 mr-2" />
                                      Edit organizer
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleResetUserPassword(user.id, user.email)}
                                    >
                                      <RotateCcw className="h-4 w-4 mr-2 text-orange-600" />
                                      Reset password
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleImpersonateUser(user.id, user.email)}
                                    >
                                      <UserX className="h-4 w-4 mr-2 text-blue-600" />
                                      Impersonate user
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleAuditLog(user.id)}
                                    >
                                      <History className="h-4 w-4 mr-2 text-purple-600" />
                                      {showingAuditLog[user.id] ? 'Hide' : 'View'} audit log
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                                          Delete organizer
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete organizer</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete {user.email}? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>

                                {/* Audit Log Section */}
                                {showingAuditLog[user.id] && (
                                  <div>
                                    <h4 className="font-medium mb-3">Audit log</h4>
                                    {loadingAuditLog[user.id] ? (
                                      <p className="text-sm text-muted-foreground">Loading audit log...</p>
                                    ) : organizerAuditLogs[user.id] && organizerAuditLogs[user.id].length > 0 ? (
                                      <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {organizerAuditLogs[user.id].map((log, idx) => (
                                          <div key={idx} className="p-3 border rounded-lg text-sm">
                                            <div className="flex items-start justify-between mb-2">
                                              <div className="flex items-center gap-2">
                                                <Badge variant={getAuditLogActionBadgeVariant(log.action)}>
                                                  {log.action.replace(/_/g, ' ')}
                                                </Badge>
                                                {log.severity && (
                                                  <span className={`text-xs font-medium ${getAuditLogSeverityColor(log.severity)}`}>
                                                    {log.severity.toUpperCase()}
                                                  </span>
                                                )}
                                              </div>
                                              <span className="text-xs text-muted-foreground">
                                                {formatDate(log.timestamp)}
                                              </span>
                                            </div>
                                            
                                            {log.actorType && log.actorType !== 'organizer' && (
                                              <div className="mb-1 text-xs text-muted-foreground">
                                                Actor: <span className="font-medium">{log.actorType}</span>
                                                {log.details?.adminEmail && ` (${log.details.adminEmail})`}
                                              </div>
                                            )}
                                            
                                            {log.details && Object.keys(log.details).length > 0 && (
                                              <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                                                {JSON.stringify(log.details, null, 2)}
                                              </div>
                                            )}
                                            
                                            {log.errorMessage && (
                                              <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
                                                Error: {log.errorMessage}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">No audit log entries found.</p>
                                    )}
                                  </div>
                                )}

                                {/* Sessions Section */}
                                {loadingSessions[user.id] ? (
                                  <p className="text-sm text-muted-foreground">Loading sessions...</p>
                                ) : userSessions[user.id] && userSessions[user.id].length > 0 ? (
                                  <div>
                                    <h4 className="font-medium mb-3">Sessions</h4>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Expand</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Rounds</TableHead>
                                        <TableHead>Participants</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {userSessions[user.id].map(session => (
                                        <React.Fragment key={session.id}>
                                          <TableRow id={`session-row-${session.id}`}>
                                            <TableCell>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                  if (expandedSessionId === session.id) {
                                                    setExpandedSessionId(null);
                                                  } else {
                                                    setExpandedSessionId(session.id);
                                                    fetchSessionParticipants(user.id, session.id);
                                                  }
                                                }}
                                              >
                                                {expandedSessionId === session.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                              </Button>
                                            </TableCell>
                                            <TableCell>
                                              {onNavigateToSession ? (
                                                <button
                                                  onClick={() => onNavigateToSession(user.urlSlug, session.id)}
                                                  className="text-primary hover:underline cursor-pointer"
                                                >
                                                  {session.name}
                                                </button>
                                              ) : (
                                                session.name
                                              )}
                                            </TableCell>
                                            <TableCell>
                                              <div className="flex flex-col gap-1">
                                                <Badge variant={session.status === 'completed' ? 'secondary' : 'default'}>
                                                  {session.status}
                                                </Badge>
                                                {session.dbStatus !== session.status && (
                                                  <span className="text-xs text-muted-foreground">
                                                    DB: {session.dbStatus}
                                                  </span>
                                                )}
                                              </div>
                                            </TableCell>
                                            <TableCell>{session.date}</TableCell>
                                            <TableCell>{session.roundsCount}</TableCell>
                                            <TableCell>
                                              {sessionParticipants[session.id] ? (
                                                <span className="text-sm">{sessionParticipants[session.id].length}</span>
                                              ) : (
                                                <span className="text-sm text-muted-foreground">-</span>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                          {expandedSessionId === session.id && (
                                            <TableRow key={`${session.id}-participants`}>
                                              <TableCell colSpan={6} className="bg-muted/50 p-4">
                                                <div className="space-y-4">
                                                  {/* Rounds Section */}
                                                  {session.rounds && session.rounds.length > 0 && (
                                                    <div>
                                                      <h5 className="text-sm font-medium mb-2">Rounds:</h5>
                                                      <div className="flex flex-wrap gap-2">
                                                        {session.rounds.map((round) => (
                                                          <Badge key={round.id} variant="outline" className="text-xs">
                                                            {round.startTime}
                                                          </Badge>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  )}
                                                  
                                                  {/* Participants Section */}
                                                  {loadingParticipants[session.id] ? (
                                                    <p className="text-sm text-muted-foreground">Loading participants...</p>
                                                  ) : sessionParticipants[session.id] && sessionParticipants[session.id].length > 0 ? (
                                                    <div>
                                                      <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs">
                                                        <p><strong>DEBUG:</strong> Found {sessionParticipants[session.id].length} participants</p>
                                                        <p><strong>Session ID:</strong> {session.id}</p>
                                                        <p><strong>User ID:</strong> {user.id}</p>
                                                      </div>
                                                      <h5 className="text-sm font-medium mb-3">Participants in {session.name}</h5>
                                                    <Table>
                                                      <TableHeader>
                                                        <TableRow>
                                                          <TableHead>Name</TableHead>
                                                          <TableHead>Email</TableHead>
                                                          <TableHead>Phone</TableHead>
                                                          <TableHead>Registered rounds</TableHead>
                                                          <TableHead>Overall status</TableHead>
                                                        </TableRow>
                                                      </TableHeader>
                                                      <TableBody>
                                                        {sessionParticipants[session.id].map(participant => (
                                                          <TableRow key={participant.token}>
                                                            <TableCell>
                                                              {onNavigateToParticipant ? (
                                                                <button
                                                                  onClick={() => onNavigateToParticipant(participant.email)}
                                                                  className="text-primary hover:underline cursor-pointer"
                                                                >
                                                                  {participant.name}
                                                                </button>
                                                              ) : (
                                                                participant.name
                                                              )}
                                                            </TableCell>
                                                            <TableCell className="font-mono text-xs">{participant.email}</TableCell>
                                                            <TableCell>{participant.phone}</TableCell>
                                                            <TableCell>
                                                              <div className="flex flex-wrap gap-1">
                                                                {participant.registeredRounds.map((round, idx) => (
                                                                  <div key={idx} className="text-xs">
                                                                    {round.roundName}: <OrganizerStatusBadge status={round.status} />
                                                                  </div>
                                                                ))}
                                                              </div>
                                                            </TableCell>
                                                            <TableCell>
                                                              <OrganizerStatusBadge status={participant.overallStatus} />
                                                            </TableCell>
                                                          </TableRow>
                                                        ))}
                                                      </TableBody>
                                                      </Table>
                                                    </div>
                                                  ) : (
                                                    <div>
                                                    <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-950 rounded text-xs">
                                                      <div className="flex items-center justify-between mb-2">
                                                        <p className="font-semibold">Debug information</p>
                                                        <Button
                                                          size="sm"
                                                          variant="outline"
                                                          onClick={async () => {
                                                            const debugInfo = `
=== SESSION DEBUG INFO ===
Session ID: ${session.id}
Session Name: ${session.name}
User ID: ${user.id}
User Email: ${user.email}
User URL Slug: ${user.urlSlug}

Response received: ${sessionParticipants[session.id] ? (sessionParticipants[session.id].length > 0 ? `Yes (${sessionParticipants[session.id].length} participants)` : 'Yes (empty array)') : 'No'}

DB Key pattern: participant:${session.id}:*

All participant keys in database (${debugParticipantKeys.length}):
${debugParticipantKeys.join('\n')}

Keys matching this session (${debugParticipantKeys.filter(key => key.startsWith(`participant:${session.id}:`)).length}):
${debugParticipantKeys.filter(key => key.startsWith(`participant:${session.id}:`)).join('\n') || 'NONE'}
                                                            `.trim();
                                                            try {
                                                              await copyToClipboard(debugInfo);
                                                              toast.success('Debug info copied to clipboard');
                                                            } catch (error) {
                                                              toast.error('Failed to copy to clipboard');
                                                            }
                                                          }}
                                                        >
                                                          Copy debug info
                                                        </Button>
                                                      </div>
                                                      <p><strong>DEBUG:</strong> Session ID: {session.id}</p>
                                                      <p><strong>DEBUG:</strong> User ID: {user.id}</p>
                                                      {sessionParticipants[session.id] && sessionParticipants[session.id].length > 0 && (
                                                        <div className="mt-2">
                                                          <p className="text-sm"><strong>Response received:</strong> Yes ({sessionParticipants[session.id].length} participants)</p>
                                                          {sessionParticipants[session.id].map((p: any, index: number) => (
                                                            <p key={index} className="text-xs text-gray-600">• {p.name} ({p.email})</p>
                                                          ))}
                                                        </div>
                                                      )}
                                                      {sessionParticipants[session.id] && sessionParticipants[session.id].length === 0 && (
                                                        <p className="text-sm"><strong>Response received:</strong> Yes (empty array)</p>
                                                      )}
                                                      {!sessionParticipants[session.id] && (
                                                        <p className="text-sm"><strong>Response received:</strong> No</p>
                                                      )}
                                                      <div className="mt-2">
                                                        <p className="text-xs"><strong>DB Key pattern:</strong> participant:{session.id}:*</p>
                                                      </div>
                                                      {debugSessionId === session.id && debugParticipantKeys.length > 0 && (
                                                        <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded">
                                                          <p className="font-semibold mb-1">All participant keys in database ({debugParticipantKeys.length}):</p>
                                                          <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-xs">
                                                            {debugParticipantKeys.filter(key => key.startsWith(`participant:${session.id}:`)).length > 0 ? (
                                                              debugParticipantKeys.filter(key => key.startsWith(`participant:${session.id}:`)).map((key, idx) => (
                                                                <p key={idx} className="text-green-700 dark:text-green-400">✓ {key}</p>
                                                              ))
                                                            ) : (
                                                              <p className="text-red-600 dark:text-red-400 font-semibold">⚠ NO KEYS MATCH THIS SESSION</p>
                                                            )}
                                                            <div className="mt-2 pt-2 border-t border-orange-200 dark:border-orange-800">
                                                              <p className="text-gray-500 font-semibold mb-1">Other sessions:</p>
                                                              {debugParticipantKeys.filter(key => !key.startsWith(`participant:${session.id}:`)).map((key, idx) => (
                                                                <p key={idx} className="text-gray-600 dark:text-gray-400">{key}</p>
                                                              ))}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                      <p className="text-sm text-muted-foreground">No participants found.</p>
                                                    </div>
                                                  )}
                                                </div>
                                              </TableCell>
                                            </TableRow>
                                          )}
                                        </React.Fragment>
                                      ))}
                                    </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No sessions found.</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit organizer</DialogTitle>
              <DialogDescription>
                Update organizer information for {editingOrganizer?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editUrlSlug">URL slug</Label>
                <Input
                  id="editUrlSlug"
                  value={editFormData.urlSlug || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, urlSlug: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editUserRole">User role</Label>
                <Select 
                  value={editFormData.userRole || ''} 
                  onValueChange={(value) => setEditFormData({ ...editFormData, userRole: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="founder">Founder/Co-founder</SelectItem>
                    <SelectItem value="ceo">CEO/Executive</SelectItem>
                    <SelectItem value="marketing">Marketing manager</SelectItem>
                    <SelectItem value="events">Events manager</SelectItem>
                    <SelectItem value="operations">Operations manager</SelectItem>
                    <SelectItem value="business-dev">Business development</SelectItem>
                    <SelectItem value="community">Community manager</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCompanySize">Company size</Label>
                <Select 
                  value={editFormData.companySize || ''} 
                  onValueChange={(value) => setEditFormData({ ...editFormData, companySize: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Just me</SelectItem>
                    <SelectItem value="2-10">2-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="500+">500+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser}>
                  Save changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}