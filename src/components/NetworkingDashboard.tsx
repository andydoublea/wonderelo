import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from 'sonner@2.0.3';
import { NetworkingSession } from '../types';
import { Footer } from './Footer';
import { SessionForm } from './SessionForm';
import { SessionDisplayCard } from './SessionDisplayCard';
import { CalendarView } from './CalendarView';
import { SessionSuccessPage } from './SessionSuccessPage';
import { UserPublicPage } from './UserPublicPage';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Users, Clock, Globe, Copy, Check, QrCode, Download, Wrench, UserCheck, Edit, Play, CheckCircle2, LayoutGrid, Table as TableIcon, MoreVertical, Trash2, BarChart3, ArrowUpDown, Search, X, ArrowUp, ArrowDown, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { debugLog, errorLog } from '../utils/debug';
import { ServiceType } from '../App';

interface NetworkingDashboardProps {
  sessions: NetworkingSession[];
  isLoadingSessions: boolean;
  serviceType: ServiceType;
  eventSlug: string;
  userEmail?: string;
  organizerName?: string;
  profileImageUrl?: string;
  onAddSession: (session: Omit<NetworkingSession, 'id'>) => Promise<void>;
  onUpdateSession: (id: string, updates: Partial<NetworkingSession>) => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
  onDuplicateSession: (session: NetworkingSession) => Omit<NetworkingSession, 'id'>;
  onUpdateEventSlug: (slug: string) => void;
  onEditUrl?: () => void;
}

export function NetworkingDashboard({
  sessions,
  isLoadingSessions,
  serviceType,
  eventSlug,
  userEmail,
  organizerName,
  profileImageUrl,
  onAddSession,
  onUpdateSession,
  onDeleteSession,
  onDuplicateSession,
  onUpdateEventSlug,
  onEditUrl
}: NetworkingDashboardProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<'list' | 'calendar' | 'preview'>('list');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<NetworkingSession | null>(null);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [lastCreatedSession, setLastCreatedSession] = useState<NetworkingSession | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc' | 'name-asc' | 'name-desc' | 'status-asc' | 'status-desc'>('date-desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Check URL params for view, status filter, and success page
  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'calendar') {
      setCurrentView('calendar');
    } else if (view === 'preview') {
      setCurrentView('preview');
    } else {
      setCurrentView('list');
    }

    // Set filter status from URL parameter
    const status = searchParams.get('status');
    if (status && ['draft', 'scheduled', 'published', 'completed'].includes(status)) {
      setFilterStatus(status);
    }

    // Show success page for newly created session
    const successSessionId = searchParams.get('success');
    if (successSessionId) {
      const session = sessions.find(s => s.id === successSessionId);
      if (session) {
        setLastCreatedSession(session);
        setShowSuccessPage(true);
      }
    }
  }, [searchParams, sessions]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, sortBy]);

  const handleAddSession = async (session: Omit<NetworkingSession, 'id'>) => {
    try {
      const newSession = await onAddSession(session);
      setShowSessionForm(false);
      setEditingSession(null);
      setLastCreatedSession(newSession as NetworkingSession);
      setShowSuccessPage(true);
    } catch (error) {
      errorLog('Error adding session:', error);
    }
  };

  const handleUpdateSession = async (id: string, updates: Partial<NetworkingSession>) => {
    try {
      await onUpdateSession(id, updates);
      setShowSessionForm(false);
      setEditingSession(null);
    } catch (error) {
      errorLog('Error updating session:', error);
    }
  };

  const handleEditSession = (session: NetworkingSession) => {
    setEditingSession(session);
    setShowSessionForm(true);
  };

  const handleDuplicateSession = async (session: NetworkingSession) => {
    try {
      const duplicated = onDuplicateSession(session);
      await onAddSession(duplicated);
      toast.success('Session duplicated successfully');
    } catch (error) {
      errorLog('Error duplicating session:', error);
      toast.error('Failed to duplicate session');
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (confirm('Are you sure you want to delete this session?')) {
      try {
        await onDeleteSession(id);
      } catch (error) {
        errorLog('Error deleting session:', error);
      }
    }
  };

  const handleBackFromSuccess = () => {
    setShowSuccessPage(false);
    setLastCreatedSession(null);
    navigate('/rounds');
  };

  const handleManageSession = (session: NetworkingSession) => {
    navigate(`/rounds/${session.id}/manage`);
  };

  const handleEditFromList = (session: NetworkingSession) => {
    navigate(`/rounds/${session.id}`);
  };

  // Filter and sort sessions
  const filteredSessions = sessions.filter(session => {
    // Status filter
    if (filterStatus !== 'all' && session.status !== filterStatus) {
      return false;
    }
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        session.name.toLowerCase().includes(query) ||
        session.description?.toLowerCase().includes(query) ||
        session.location?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Sort sessions
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    debugLog('Sorting with sortBy:', sortBy); // DEBUG
    switch (sortBy) {
      case 'date-asc': {
        if (!a.date) return 1;
        if (!b.date) return -1;
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA === dateB) {
          // Sort by first round startTime if dates are equal
          const aTime = a.rounds?.[0]?.startTime || '';
          const bTime = b.rounds?.[0]?.startTime || '';
          return aTime.localeCompare(bTime);
        }
        return dateA - dateB;
      }
      case 'date-desc': {
        if (!a.date) return 1;
        if (!b.date) return -1;
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA === dateB) {
          const aTime = a.rounds?.[0]?.startTime || '';
          const bTime = b.rounds?.[0]?.startTime || '';
          return bTime.localeCompare(aTime);
        }
        return dateB - dateA;
      }
      case 'status-asc':
        return (a.status || '').localeCompare(b.status || '');
      case 'status-desc':
        return (b.status || '').localeCompare(a.status || '');
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  debugLog('Current sortBy state:', sortBy); // DEBUG
  debugLog('Sorted sessions count:', sortedSessions.length); // DEBUG
  debugLog('Sorted sessions order:', sortedSessions.map(s => ({ name: s.name, date: s.date }))); // DEBUG

  // Pagination
  const totalPages = Math.ceil(sortedSessions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSessions = sortedSessions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show success page after creating session
  if (showSuccessPage && lastCreatedSession) {
    return (
      <SessionSuccessPage
        session={lastCreatedSession}
        eventSlug={eventSlug}
        onBack={handleBackFromSuccess}
        onGoToDashboard={() => navigate('/dashboard')}
        onManageParticipants={() => handleManageSession(lastCreatedSession)}
      />
    );
  }

  // Show session form
  if (showSessionForm) {
    return (
      <SessionForm
        initialData={editingSession}
        onSubmit={(session) => {
          if (editingSession) {
            handleUpdateSession(editingSession.id, session);
          } else {
            handleAddSession(session);
          }
        }}
        onCancel={() => {
          setShowSessionForm(false);
          setEditingSession(null);
        }}
      />
    );
  }

  // Show different views
  if (currentView === 'calendar') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="mb-1">Networking rounds</h1>
            <p className="text-muted-foreground">
              {isLoadingSessions ? 'Loading...' : `${sortedSessions.length} ${sortedSessions.length === 1 ? 'round' : 'rounds'}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setCurrentView('preview')} variant="outline" size="sm">
              <Globe className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={() => navigate('/rounds/new')}>
              Create round
            </Button>
          </div>
        </div>

        {/* Filters and search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search rounds..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: any) => {
                debugLog('onValueChange called with:', value); // DEBUG
                setSortBy(value);
              }}>
                <SelectTrigger className="w-full md:w-[220px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-asc">Date (oldest first)</SelectItem>
                  <SelectItem value="date-desc">Date (newest first)</SelectItem>
                  <SelectItem value="name-asc">Name (A → Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z → A)</SelectItem>
                  <SelectItem value="status-asc">Status (A → Z)</SelectItem>
                  <SelectItem value="status-desc">Status (Z → A)</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2 ml-auto">
                <Button
                  variant={currentView === 'list' && viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setViewMode('grid');
                    setCurrentView('list');
                  }}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={currentView === 'list' && viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setViewMode('table');
                    setCurrentView('list');
                  }}
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={currentView === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView('calendar')}
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <CalendarView
          sessions={sortedSessions}
          onSessionClick={handleEditSession}
        />
      </div>
    );
  }

  if (currentView === 'preview') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="mb-1">Public page preview</h1>
            <p className="text-muted-foreground">Preview how participants see your event</p>
          </div>
          <Button onClick={() => setCurrentView('list')} variant="outline">
            Back to list
          </Button>
        </div>
        <UserPublicPage
          userSlug={eventSlug}
          onBack={() => setCurrentView('list')}
          isPreview={true}
        />
      </div>
    );
  }

  // Main list view
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="mb-1">Networking rounds</h1>
          <p className="text-muted-foreground">
            {isLoadingSessions ? 'Loading...' : `${sortedSessions.length} ${sortedSessions.length === 1 ? 'round' : 'rounds'}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCurrentView('preview')} variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Event page
          </Button>
          <Button onClick={() => navigate('/rounds/new')}>
            Create round
          </Button>
        </div>
      </div>

      {/* Filters and search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rounds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: any) => {
              debugLog('onValueChange called with:', value); // DEBUG
              setSortBy(value);
            }}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-asc">Date (oldest first)</SelectItem>
                <SelectItem value="date-desc">Date (newest first)</SelectItem>
                <SelectItem value="name-asc">Name (A → Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z → A)</SelectItem>
                <SelectItem value="status-asc">Status (A → Z)</SelectItem>
                <SelectItem value="status-desc">Status (Z → A)</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 ml-auto">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setViewMode('grid');
                  setCurrentView('list');
                }}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setViewMode('table');
                  setCurrentView('list');
                }}
              >
                <TableIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={currentView === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('calendar')}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions list */}
      {isLoadingSessions ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedSessions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="mb-2">No rounds yet</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterStatus !== 'all'
                ? 'No rounds match your filters'
                : 'Get started by creating your first networking round'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <Button onClick={() => navigate('/rounds/new')}>
                Create your first round
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedSessions.map((session, index) => (
            <SessionDisplayCard
              key={`${session.id}-${index}`}
              session={session}
              adminMode={true}
              onEdit={() => handleEditFromList(session)}
              onDelete={() => handleDeleteSession(session.id)}
              onDuplicate={() => handleDuplicateSession(session)}
              onUpdateStatus={(status) => onUpdateSession(session.id, { status })}
              onUpdateSession={onUpdateSession}
              onManage={() => handleManageSession(session)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSessions.map((session, index) => (
                <TableRow key={`${session.id}-${index}`}>
                  <TableCell className="font-medium">{session.name}</TableCell>
                  <TableCell>{session.date}</TableCell>
                  <TableCell>{session.startTime}</TableCell>
                  <TableCell>
                    <Badge variant={session.status === 'published' ? 'default' : 'secondary'}>
                      {session.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{session.participants?.length || 0}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditFromList(session)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleManageSession(session)}>
                          <Users className="h-4 w-4 mr-2" />
                          Manage
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateSession(session)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteSession(session.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, sortedSessions.length)} of {sortedSessions.length} rounds
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                const showPage = 
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1);
                
                const showEllipsis = 
                  (page === currentPage - 2 && currentPage > 3) ||
                  (page === currentPage + 2 && currentPage < totalPages - 2);

                if (showEllipsis) {
                  return (
                    <span key={page} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  );
                }

                if (!showPage) return null;

                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="min-w-[36px]"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}