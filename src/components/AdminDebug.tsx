import React, { useState } from 'react';
import { AlertCircle, Database, FileJson, Search, Trash2, Copy, RefreshCw, Users, Mail, Zap, Bug, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { debugLog, errorLog, enableDebugMode, disableDebugMode } from '../utils/debug';
import { Switch } from './ui/switch';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ServerLogsViewer } from './ServerLogsViewer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface AdminDebugProps {
  accessToken: string;
}

export function AdminDebug({ accessToken }: AdminDebugProps) {
  const [allKeysData, setAllKeysData] = useState<any>(null);
  const [participantId, setParticipantId] = useState('');
  const [participantData, setParticipantData] = useState<any>(null);
  const [migrateAllResult, setMigrateAllResult] = useState<any>(null);
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  const [orphanedVerifications, setOrphanedVerifications] = useState<any>(null);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [emailSearch, setEmailSearch] = useState('');
  const [emailSearchResult, setEmailSearchResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [verificationTokenData, setVerificationTokenData] = useState<any>(null);
  const [participantKeysAnalysis, setParticipantKeysAnalysis] = useState<any>(null);

  const [organizerSlug, setOrganizerSlug] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [roundTimeFilter, setRoundTimeFilter] = useState('');
  const [organizerSessionsData, setOrganizerSessionsData] = useState<any>(null);
  
  // Quick session list
  const [quickSessionsSlug, setQuickSessionsSlug] = useState('');
  const [quickSessionsList, setQuickSessionsList] = useState<any>(null);
  
  // Fix match data
  const [fixMatchSessionId, setFixMatchSessionId] = useState('');
  const [fixMatchRoundId, setFixMatchRoundId] = useState('');
  const [fixMatchResult, setFixMatchResult] = useState<any>(null);
  
  // Reset database
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);
  
  // Seed database
  const [showSeedDialog, setShowSeedDialog] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);
  const [seedConfig, setSeedConfig] = useState({
    organizerCount: 3,
    sessionsPerOrganizer: 2,
    roundsPerSession: 4,
    participantsPerOrganizer: 30
  });
  
  // Debug mode state - default is true now
  const [debugMode, setDebugMode] = useState(() => {
    const value = localStorage.getItem('debug_mode');
    // Default to true if not set
    return value === null ? true : value === 'true';
  });

  // Auto-migrations state
  const [autoMigrationsEnabled, setAutoMigrationsEnabled] = useState<boolean | null>(null);
  const [isLoadingAutoMigrations, setIsLoadingAutoMigrations] = useState(false);

  const toggleDebugMode = (enabled: boolean) => {
    setDebugMode(enabled);
    if (enabled) {
      enableDebugMode();
      toast.success('Debug mode enabled! Console logs are now visible.');
    } else {
      disableDebugMode();
      toast.info('Debug mode disabled. Console logs are now hidden.');
    }
  };

  const fetchAutoMigrationsStatus = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/auto-migrations-status`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        setAutoMigrationsEnabled(result.enabled);
      } else {
        errorLog('Failed to fetch auto-migrations status:', result.error);
      }
    } catch (error) {
      errorLog('Error fetching auto-migrations status:', error);
    }
  };

  const toggleAutoMigrations = async (enabled: boolean) => {
    try {
      setIsLoadingAutoMigrations(true);
      toast.loading(enabled ? 'Enabling auto-migrations...' : 'Disabling auto-migrations...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/auto-migrations-toggle`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ enabled }),
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        setAutoMigrationsEnabled(enabled);
        toast.success(result.message);
        debugLog('Auto-migrations toggled:', result);
      } else {
        toast.error(result.error || 'Failed to toggle auto-migrations');
      }
    } catch (error) {
      errorLog('Error:', error);
      toast.error('Network error');
    } finally {
      setIsLoadingAutoMigrations(false);
    }
  };

  // Fetch auto-migrations status on mount
  React.useEffect(() => {
    fetchAutoMigrationsStatus();
  }, []);

  const checkAllKeys = async () => {
    try {
      setIsLoading(true);
      toast.loading('Fetching all keys...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/list-all-keys`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        setAllKeysData(result);
        toast.success('Keys loaded successfully');
        debugLog('All Keys:', result);
      } else {
        toast.error(result.error || 'Failed to fetch keys');
      }
    } catch (error) {
      errorLog('Error:', error);
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const checkParticipant = async () => {
    if (!participantId.trim()) {
      toast.error('Please enter a participant ID');
      return;
    }

    try {
      setIsLoading(true);
      toast.loading('Checking participant data...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/participant/${participantId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        setParticipantData(result);
        toast.success('Participant data loaded');
        debugLog('Participant Data:', result);
      } else {
        toast.error(result.error || 'Failed to fetch participant');
      }
    } catch (error) {
      errorLog('Error:', error);
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const migrateAllParticipants = async () => {
    if (!confirm('🔄 Are you sure you want to migrate ALL old participant data to the new format?')) {
      return;
    }

    try {
      setIsLoading(true);
      toast.loading('Migrating all participants...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/migrate-all`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        setMigrateAllResult(result);
        toast.success(result.message);
        debugLog('Migration Result:', result);
      } else {
        toast.error(result.error || 'Migration failed');
      }
    } catch (error) {
      errorLog('Error:', error);
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeParticipantKeys = async () => {
    try {
      setIsLoading(true);
      toast.loading('Analyzing participant keys...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/analyze-participant-keys`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch keys');
      }

      const data = await response.json();
      
      setParticipantKeysAnalysis({
        total: data.total,
        oldFormat: data.oldFormat,
        newFormat: data.newFormat,
        unknown: data.unknown,
        keys: data.keys
      });

      toast.success(`Found ${data.total} participant keys (${data.oldFormat} old, ${data.newFormat} new)`);
      debugLog('Participant Keys Analysis:', data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to analyze keys');
    } finally {
      setIsLoading(false);
    }
  };

  const migrateParticipantKeys = async () => {
    if (!confirm('🔄 PARTICIPANT KEYS MIGRATION\n\nThis will migrate all participant keys from old format to new format:\n\nOLD: participant:{roundId}:{participantId}\nNEW: participant:{sessionId}:{roundId}:{participantId}\n\nContinue?')) {
      return;
    }

    try {
      setIsLoading(true);
      toast.loading('Migrating participant keys...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/migrate-participants`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        setMigrationResult(result);
        toast.success(
          `Migration complete! Migrated: ${result.migrated}, Skipped: ${result.skipped}, Errors: ${result.errors}`
        );
        debugLog('Participant Keys Migration Result:', result);
        
        // Refresh the analysis after migration
        await analyzeParticipantKeys();
      } else {
        toast.error(result.error || 'Migration failed');
      }
    } catch (error) {
      errorLog('Error:', error);
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupOldKeys = async () => {
    if (!confirm('🧹 Are you sure you want to DELETE all old participant registration keys?\n\nThis will permanently delete keys like:\n• participant:UUID:registrations\n\nNew format keys (participant_registrations:UUID) will NOT be deleted.')) {
      return;
    }

    try {
      setIsLoading(true);
      toast.loading('Deleting old keys...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/cleanup-old-keys`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        setCleanupResult(result);
        toast.success(result.message);
        debugLog('Cleanup Result:', result);
        
        // Refresh keys list
        if (allKeysData) {
          await checkAllKeys();
        }
      } else {
        toast.error(result.error || 'Cleanup failed');
      }
    } catch (error) {
      errorLog('Error:', error);
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const findOrphanedVerifications = async () => {
    try {
      setIsLoading(true);
      toast.loading('Searching for orphaned verifications...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/debug/orphaned-verifications`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        setOrphanedVerifications(result);
        toast.success(result.orphanedCount > 0 
          ? `Found ${result.orphanedCount} orphaned verification(s)` 
          : 'No orphaned verifications found'
        );
        debugLog('Orphaned Verifications:', result);
      } else {
        toast.error(result.error || 'Failed to search');
      }
    } catch (error) {
      errorLog('Error:', error);
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const migrateOrganizerIds = async () => {
    if (!confirm('🔧 This will scan all participant registrations and fix missing organizerIds.\n\nContinue?')) {
      return;
    }

    try {
      setIsLoading(true);
      toast.loading('Migrating organizer IDs...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/debug/migrate-organizer-ids`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        setMigrationResult(result.results);
        toast.success(
          `Migration complete! Fixed ${result.results.fixed} registration(s)`
        );
        debugLog('Migration Result:', result);
      } else {
        toast.error(result.error || 'Migration failed');
      }
    } catch (error) {
      errorLog('Error:', error);
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const recoverRegistration = async (verificationToken: string) => {
    if (!confirm('🔧 Are you sure you want to recover this registration?\n\nThis will create the missing participant_email and participant_registrations records.')) {
      return;
    }

    try {
      setIsLoading(true);
      toast.loading('Recovering registration...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/debug/recover-registration`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ verificationToken }),
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        toast.success(result.message);
        debugLog('Recovery Result:', result);
        
        // Refresh orphaned verifications list
        await findOrphanedVerifications();
      } else {
        toast.error(result.error || 'Recovery failed');
      }
    } catch (error) {
      errorLog('Error:', error);
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const searchByEmail = async () => {
    if (!emailSearch.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      setIsLoading(true);
      toast.loading('Searching by email...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/debug/search-by-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: emailSearch }),
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        setEmailSearchResult(result);
        toast.success(result.message);
        debugLog('Email Search Result:', result);
      } else {
        toast.error(result.error || 'Search failed');
      }
    } catch (error) {
      errorLog('Error:', error);
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const checkVerificationToken = async () => {
    if (!verificationToken.trim()) {
      toast.error('Please enter a verification token');
      return;
    }

    try {
      setIsLoading(true);
      toast.loading('Checking verification token...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/debug/check-verification-token`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ verificationToken }),
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        setVerificationTokenData(result);
        toast.success(result.message);
        debugLog('Verification Token Data:', result);
      } else {
        toast.error(result.error || 'Check failed');
      }
    } catch (error) {
      errorLog('Error:', error);
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const searchOrganizerSessions = async () => {
    if (!organizerSlug.trim()) {
      toast.error('Please enter organizer slug');
      return;
    }

    try {
      setIsLoading(true);
      toast.loading('Searching organizer sessions...');
      
      const params = new URLSearchParams();
      if (sessionFilter) params.append('sessionName', sessionFilter);
      if (roundTimeFilter) params.append('roundTime', roundTimeFilter);
      
      const queryString = params.toString();
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/organizer-sessions/${organizerSlug}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        setOrganizerSessionsData(result);
        toast.success(`Found ${result.filteredSessions} session(s)`);
        debugLog('Organizer Sessions:', result);
      } else {
        toast.error(result.error || 'Search failed');
      }
    } catch (error) {
      errorLog('Error:', error);
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const getQuickSessionsList = async () => {
    if (!quickSessionsSlug.trim()) {
      toast.error('Please enter organizer slug');
      return;
    }

    try {
      setIsLoading(true);
      toast.loading('Loading all sessions...');
      
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/user/${quickSessionsSlug}/all-sessions`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        setQuickSessionsList(result);
        toast.success(`Found ${result.sessions?.length || 0} session(s)`);
        debugLog('Quick Sessions List:', result);
      } else {
        toast.error(result.error || 'Failed to load sessions');
      }
    } catch (error) {
      errorLog('Error:', error);
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (data: any, label: string) => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      
      // Fallback method using textarea (works even when Clipboard API is blocked)
      const textarea = document.createElement('textarea');
      textarea.value = jsonString;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        toast.success(`${label} copied to clipboard!`);
      } else {
        throw new Error('Copy command failed');
      }
    } catch (error) {
      errorLog('Failed to copy:', error);
      
      // Last resort: show the data in an alert (not ideal but works)
      const jsonString = JSON.stringify(data, null, 2);
      toast.error('Could not copy automatically. Check console for data.');
      debugLog(`\n=== ${label.toUpperCase()} ===\n`, jsonString);
    }
  };

  const fixMatchData = async () => {
    if (!fixMatchSessionId.trim() || !fixMatchRoundId.trim()) {
      toast.error('Please enter both Session ID and Round ID');
      return;
    }

    try {
      setIsLoading(true);
      toast.loading('Fixing match data...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/debug/fix-match-data/${fixMatchSessionId}/${fixMatchRoundId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        setFixMatchResult(result);
        toast.success(result.message || 'Match data fixed successfully');
        debugLog('Fix Match Data Result:', result);
      } else {
        toast.error(result.error || 'Failed to fix match data');
      }
    } catch (error) {
      errorLog('Error:', error);
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetDatabase = async () => {
    try {
      setIsLoading(true);
      toast.loading('Resetting database...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/reset-database`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        setResetResult(result);
        const adminMsg = result.skippedAdminUsers > 0 ? ` (preserved ${result.skippedAdminUsers} admin account${result.skippedAdminUsers > 1 ? 's' : ''})` : '';
        toast.success(`Database reset! Deleted ${result.deletedAuthUsers} auth users and ${result.deletedCount} KV keys${adminMsg}.`);
        debugLog('Reset Database Result:', result);
        
        // Clear all displayed data
        setAllKeysData(null);
        setParticipantData(null);
        setMigrateAllResult(null);
        setCleanupResult(null);
        setOrphanedVerifications(null);
        setMigrationResult(null);
        setEmailSearchResult(null);
        setVerificationTokenData(null);
        setParticipantKeysAnalysis(null);
        setOrganizerSessionsData(null);
        setQuickSessionsList(null);
        setFixMatchResult(null);
        setSeedResult(null);
      } else {
        toast.error(result.error || 'Failed to reset database');
      }
    } catch (error) {
      errorLog('Error:', error);
      toast.error('Network error');
    } finally {
      setIsLoading(false);
      setShowResetDialog(false);
    }
  };

  const seedDatabase = async () => {
    try {
      setIsLoading(true);
      toast.loading('Seeding database with test data...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/seed-database`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(seedConfig),
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        setSeedResult(result);
        toast.success(`Database seeded! Created ${result.created.organizers} organizers, ${result.created.sessions} sessions, ${result.created.participants} participants.`);
        debugLog('Seed Database Result:', result);
      } else {
        toast.error(result.error || 'Failed to seed database');
        errorLog('Seed error details:', result.details);
      }
    } catch (error) {
      errorLog('Error:', error);
      toast.error('Network error');
    } finally {
      setIsLoading(false);
      setShowSeedDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="space-y-8">
          <div>
            <h2 className="mb-2">Admin debug panel</h2>
            <p className="text-muted-foreground">
              Tools for debugging, data migration, and system diagnostics
            </p>
          </div>

      {/* ===== SYSTEM SETTINGS ===== */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800">System settings</h3>
        
        {/* Debug Mode Toggle */}
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Debug mode</CardTitle>
                <CardDescription>
                  Enable or disable console logging throughout the application
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${debugMode ? 'text-green-600' : 'text-gray-500'}`}>
                  {debugMode ? 'Enabled' : 'Disabled'}
                </span>
                <Switch
                  checked={debugMode}
                  onCheckedChange={toggleDebugMode}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                When enabled, the application will log detailed information to the browser console including:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Registration flow steps and data</li>
                <li>Server requests and responses</li>
                <li>Email verification process</li>
                <li>Participant dashboard updates</li>
                <li>Round status changes and countdowns</li>
              </ul>
              <p className="text-xs mt-3 bg-white p-2 rounded border">
                💡 <strong>Tip:</strong> Enable debug mode before testing registration flows or troubleshooting issues. Remember to disable it when not needed to keep the console clean.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Auto-migrations Toggle */}
        <Card className="border-2 border-orange-500/20 bg-orange-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Auto-migrations</CardTitle>
                <CardDescription>
                  Automatically update database schema when code changes
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {autoMigrationsEnabled === null ? (
                  <span className="text-sm text-gray-400">Loading...</span>
                ) : (
                  <>
                    <span className={`text-sm font-medium ${autoMigrationsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                      {autoMigrationsEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <Switch
                      checked={autoMigrationsEnabled}
                      onCheckedChange={toggleAutoMigrations}
                      disabled={isLoadingAutoMigrations || autoMigrationsEnabled === null}
                    />
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                When enabled, the server will automatically handle database schema changes:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Add new fields to existing entities with random valid data</li>
                <li>Remove deprecated fields from existing entities</li>
                <li>Migrate data formats automatically</li>
              </ul>
              <div className="mt-3 p-3 bg-orange-100 border border-orange-300 rounded">
                <p className="text-xs font-semibold text-orange-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Production warning
                </p>
                <p className="text-xs text-orange-800 mt-1">
                  <strong>Disable this before going live!</strong> Auto-migrations are designed for development only. In production, schema changes should be planned and executed manually.
                </p>
              </div>
              <p className="text-xs mt-2 bg-white p-2 rounded border">
                💡 <strong>Tip:</strong> Keep this enabled during development for seamless schema evolution. Turn it off when you're ready to launch to prevent unintended data modifications.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== DIAGNOSTIC TOOLS ===== */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800">Diagnostic tools</h3>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick diagnostic pages</CardTitle>
            <CardDescription>
              Fast access to diagnostic pages and testing utilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => window.open('/debug-session-lookup', '_blank')}
              variant="outline"
              className="w-full justify-start"
            >
              <Search className="w-4 h-4 mr-2" />
              Session lookup diagnostic
              <span className="ml-auto text-xs text-muted-foreground">Find where sessions are stored</span>
            </Button>
            
            <Button 
              onClick={() => window.open('/duplicate-registration-test', '_blank')}
              variant="outline"
              className="w-full justify-start"
            >
              <Users className="w-4 h-4 mr-2" />
              Duplicate registration test
              <span className="ml-auto text-xs text-muted-foreground">Test registration flows</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ===== DATA LOOKUP & SEARCH ===== */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800">Data lookup & search</h3>
        
        <Card>
          <CardHeader>
            <CardTitle>Search tools</CardTitle>
            <CardDescription>
              Look up participants, emails, and sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Participant Lookup */}
            <div>
              <h4 className="font-medium mb-3 text-sm">Participant lookup</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter participant ID (UUID)"
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkParticipant()}
                  disabled={isLoading}
                />
                <Button 
                  onClick={checkParticipant} 
                  disabled={isLoading || !participantId.trim()}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Check
                </Button>
              </div>
            </div>

            {/* Email Search */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 text-sm">Email search</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address"
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchByEmail()}
                  disabled={isLoading}
                />
                <Button 
                  onClick={searchByEmail} 
                  disabled={isLoading || !emailSearch.trim()}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {/* Verification Token Check */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 text-sm">Verification token lookup</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter verification token"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkVerificationToken()}
                  disabled={isLoading}
                />
                <Button 
                  onClick={checkVerificationToken} 
                  disabled={isLoading || !verificationToken.trim()}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Check
                </Button>
              </div>
            </div>

            {/* Organizer Sessions Search */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 text-sm">Organizer sessions search</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter organizer slug"
                  value={organizerSlug}
                  onChange={(e) => setOrganizerSlug(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Input
                  placeholder="Session name (optional)"
                  value={sessionFilter}
                  onChange={(e) => setSessionFilter(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Input
                  placeholder="Round time (optional)"
                  value={roundTimeFilter}
                  onChange={(e) => setRoundTimeFilter(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={searchOrganizerSessions} 
                  disabled={isLoading || !organizerSlug.trim()}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {/* Quick Sessions List */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 text-sm">Quick sessions list</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter organizer slug"
                  value={quickSessionsSlug}
                  onChange={(e) => setQuickSessionsSlug(e.target.value)}
                  disabled={isLoading}
                />
                <Button 
                  onClick={getQuickSessionsList} 
                  disabled={isLoading || !quickSessionsSlug.trim()}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Load
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== DATA MIGRATION ===== */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800">Data migration</h3>
        
        {/* Participant Keys Migration */}
        <Card>
          <CardHeader>
            <CardTitle>Migrate participant keys</CardTitle>
            <CardDescription>
              Migrate participant keys from old format to new format with sessionId included
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium mb-2">Key format change</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Migrates all participants from old format to new format with sessionId included:
              </p>
              <div className="text-xs font-mono bg-white p-2 rounded border space-y-1">
                <div className="text-red-600">OLD: participant:{'{roundId}'}:{'{participantId}'}</div>
                <div className="text-green-600">NEW: participant:{'{sessionId}'}:{'{roundId}'}:{'{participantId}'}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={analyzeParticipantKeys} 
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                <Database className="w-4 h-4 mr-2" />
                Step 1: Analyze keys
              </Button>
              <Button 
                onClick={migrateParticipantKeys} 
                disabled={isLoading || (participantKeysAnalysis && participantKeysAnalysis.oldFormat === 0)}
                variant="default"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Step 2: Migrate ({participantKeysAnalysis?.oldFormat || 0} keys)
              </Button>
            </div>

            {/* Analysis Results */}
            {participantKeysAnalysis && (
              <div className="border rounded p-4 bg-muted/50">
                <h4 className="font-medium text-sm mb-3">Key analysis</h4>
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div className="bg-white p-3 rounded border">
                    <div className="text-xs text-muted-foreground mb-1">Total</div>
                    <div className="text-lg font-medium">{participantKeysAnalysis.total}</div>
                  </div>
                  <div className={`p-3 rounded border ${participantKeysAnalysis.oldFormat > 0 ? 'bg-yellow-50 border-yellow-300' : 'bg-white'}`}>
                    <div className="text-xs text-muted-foreground mb-1">Old format</div>
                    <div className={`text-lg font-medium ${participantKeysAnalysis.oldFormat > 0 ? 'text-yellow-700' : ''}`}>
                      {participantKeysAnalysis.oldFormat}
                    </div>
                  </div>
                  <div className={`p-3 rounded border ${participantKeysAnalysis.newFormat > 0 ? 'bg-green-50 border-green-300' : 'bg-white'}`}>
                    <div className="text-xs text-muted-foreground mb-1">New format</div>
                    <div className={`text-lg font-medium ${participantKeysAnalysis.newFormat > 0 ? 'text-green-700' : ''}`}>
                      {participantKeysAnalysis.newFormat}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-xs text-muted-foreground mb-1">Unknown</div>
                    <div className="text-lg font-medium">{participantKeysAnalysis.unknown}</div>
                  </div>
                </div>
                {participantKeysAnalysis.oldFormat > 0 && (
                  <div className="mt-3 text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                    ⚠️ {participantKeysAnalysis.oldFormat} keys need migration. Click "Step 2: Migrate" to convert them.
                  </div>
                )}
                {participantKeysAnalysis.oldFormat === 0 && participantKeysAnalysis.total > 0 && (
                  <div className="mt-3 text-xs text-green-700 bg-green-50 p-2 rounded border border-green-200">
                    ✅ All participant keys are already in the new format!
                  </div>
                )}
              </div>
            )}

            {/* Migration Results */}
            {migrationResult && migrationResult.migrated !== undefined && (
              <div className="border rounded p-4 bg-muted/50">
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Migrated:</span>
                      <span className="ml-2 font-medium text-green-600">{migrationResult.migrated}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Skipped:</span>
                      <span className="ml-2 font-medium text-gray-600">{migrationResult.skipped}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Errors:</span>
                      <span className="ml-2 font-medium text-red-600">{migrationResult.errors}</span>
                    </div>
                  </div>

                  {migrationResult.details && migrationResult.details.length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-primary hover:underline">
                        View details ({migrationResult.details.length} items)
                      </summary>
                      <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                        {migrationResult.details.map((item: any, idx: number) => (
                          <div 
                            key={idx} 
                            className={`text-xs p-2 rounded ${
                              item.status === 'migrated' 
                                ? 'bg-green-50 border border-green-200' 
                                : item.status === 'skipped'
                                ? 'bg-gray-50 border border-gray-200'
                                : 'bg-red-50 border border-red-200'
                            }`}
                          >
                            <div className="font-medium font-mono">
                              {item.oldKey}
                            </div>
                            {item.newKey && (
                              <div className="text-green-600 font-mono">
                                → {item.newKey}
                              </div>
                            )}
                            <div className="text-muted-foreground mt-1">
                              Status: {item.status}
                              {item.participantEmail && ` | ${item.participantEmail}`}
                              {item.error && ` | Error: ${item.error}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      copyToClipboard(migrationResult, 'Participant Keys Migration Result');
                    }}
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    Copy full result
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fix missing organizer IDs */}
        <Card>
          <CardHeader>
            <CardTitle>Fix missing organizer IDs</CardTitle>
            <CardDescription>
              Scan and fix participant registrations that are missing organizerId field
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">What does this do?</p>
                  <p>This migration scans all participant registrations and fills in missing organizerId fields by looking up the session data. This is needed for participants to see their registered sessions in the dashboard.</p>
                </div>
              </div>
            </div>

            <Button
              onClick={migrateOrganizerIds}
              disabled={isLoading}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Run migration
            </Button>

            {migrationResult && (
              <div className="border rounded p-4 bg-muted/50">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Scanned:</span>
                      <span className="ml-2 font-medium">{migrationResult.scanned}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fixed:</span>
                      <span className="ml-2 font-medium text-green-600">{migrationResult.fixed}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Failed:</span>
                      <span className="ml-2 font-medium text-red-600">{migrationResult.failed}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Skipped:</span>
                      <span className="ml-2 font-medium text-gray-600">{migrationResult.skipped}</span>
                    </div>
                  </div>

                  {migrationResult.details && migrationResult.details.length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-primary hover:underline">
                        View details ({migrationResult.details.length} items)
                      </summary>
                      <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                        {migrationResult.details.map((item: any, idx: number) => (
                          <div 
                            key={idx} 
                            className={`text-xs p-2 rounded ${
                              item.status === 'fixed' 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-red-50 border border-red-200'
                            }`}
                          >
                            <div className="font-medium">
                              {item.sessionName} - {item.roundName}
                            </div>
                            <div className="text-muted-foreground">
                              Status: {item.status}
                              {item.organizerId && ` | Organizer ID: ${item.organizerId.substring(0, 12)}...`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      copyToClipboard(migrationResult, 'Migration Result');
                    }}
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    Copy full result
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Migrate all participants (old) */}
        <Card>
          <CardHeader>
            <CardTitle>Migrate all participants (legacy)</CardTitle>
            <CardDescription>
              Legacy migration tool for old participant data format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={migrateAllParticipants} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Migrate all data (legacy)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ===== DATABASE CLEANUP ===== */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800">Database cleanup</h3>
        
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-600" />
              Fix inconsistent match data
            </CardTitle>
            <CardDescription>
              Fix match data in participant_registrations for a specific round (adds matchId, partners, meeting point)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Session ID</label>
                <Input
                  value={fixMatchSessionId}
                  onChange={(e) => setFixMatchSessionId(e.target.value)}
                  placeholder="Enter session ID"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Round ID</label>
                <Input
                  value={fixMatchRoundId}
                  onChange={(e) => setFixMatchRoundId(e.target.value)}
                  placeholder="Enter round ID"
                />
              </div>
              <Button 
                onClick={fixMatchData} 
                disabled={isLoading || !fixMatchSessionId.trim() || !fixMatchRoundId.trim()}
                variant="default"
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Fix match data for round
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Database maintenance</CardTitle>
            <CardDescription>
              Tools for managing database keys and orphaned records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                onClick={checkAllKeys} 
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                <Database className="w-4 h-4 mr-2" />
                Check all keys
              </Button>
              
              <Button 
                onClick={findOrphanedVerifications} 
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Find orphaned
              </Button>
              
              <Button 
                onClick={cleanupOldKeys} 
                disabled={isLoading}
                variant="destructive"
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete old keys
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== DANGEROUS OPERATIONS ===== */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-red-600">Dangerous operations</h3>
        
        <Card className="border-2 border-red-500 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Reset entire database
            </CardTitle>
            <CardDescription className="text-red-600">
              ⚠️ WARNING: This will permanently delete ALL data including organizers, sessions, participants, and all related data. This action cannot be undone!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowResetDialog(true)}
              disabled={isLoading}
              variant="destructive"
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Reset entire database
            </Button>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Database className="w-5 h-5" />
              Seed database with test data
            </CardTitle>
            <CardDescription className="text-green-600">
              Generate random organizers, sessions, participants with realistic data for testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Organizers</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={seedConfig.organizerCount}
                    onChange={(e) => setSeedConfig({...seedConfig, organizerCount: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Sessions per organizer</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={seedConfig.sessionsPerOrganizer}
                    onChange={(e) => setSeedConfig({...seedConfig, sessionsPerOrganizer: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Rounds per session</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={seedConfig.roundsPerSession}
                    onChange={(e) => setSeedConfig({...seedConfig, roundsPerSession: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Participants per organizer</label>
                  <Input
                    type="number"
                    min="5"
                    max="100"
                    value={seedConfig.participantsPerOrganizer}
                    onChange={(e) => setSeedConfig({...seedConfig, participantsPerOrganizer: parseInt(e.target.value) || 5})}
                  />
                </div>
              </div>
              <Button 
                onClick={() => setShowSeedDialog(true)}
                disabled={isLoading}
                variant="default"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Database className="w-4 h-4 mr-2" />
                Seed database with test data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== RESULTS SECTION ===== */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800">Results</h3>

        {/* All Keys Result */}
        {allKeysData && (
          <Card>
            <CardHeader>
              <CardTitle>All Keys</CardTitle>
              <CardDescription>
                {allKeysData.note}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(allKeysData.allKeys).map(([prefix, data]: [string, any]) => (
                  <div key={prefix} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{prefix}</h4>
                      <span className={`px-2 py-1 rounded text-sm ${
                        data.count === 0 ? 'bg-gray-100' : 'bg-blue-100'
                      }`}>
                        {data.count} keys
                      </span>
                    </div>
                    
                    {data.count > 0 && (
                      <div className="mt-3 space-y-2">
                        {data.keys.map((item: any, idx: number) => (
                          <div key={idx} className="text-sm bg-muted p-2 rounded font-mono">
                            <div className="flex items-center justify-between">
                              <span className="text-blue-600">{item.key}</span>
                              <span className="text-xs text-gray-500">
                                {item.valueType}
                                {item.valueLength !== undefined && ` (${item.valueLength})`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Participant Data Result */}
        {participantData && (
          <Card>
            <CardHeader>
              <CardTitle>Participant data</CardTitle>
              <CardDescription>
                {participantData.participantId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Profile */}
                {participantData.participantProfile && (
                  <div>
                    <h4 className="font-medium mb-2">Profile</h4>
                    <div className="bg-muted p-3 rounded">
                      <div className="text-sm space-y-1">
                        <div><strong>Name:</strong> {participantData.participantProfile.firstName} {participantData.participantProfile.lastName}</div>
                        <div><strong>Email:</strong> {participantData.participantProfile.email}</div>
                        <div><strong>Phone:</strong> {participantData.participantProfile.phoneCountry} {participantData.participantProfile.phone}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Old Key Data */}
                <div>
                  <h4 className="font-medium mb-2">
                    Old key: <code className="text-xs bg-red-100 px-2 py-1 rounded">{participantData.oldKey}</code>
                  </h4>
                  {participantData.oldData && participantData.oldData.length > 0 ? (
                    <div className="bg-red-50 p-3 rounded">
                      <div className="text-sm">
                        <strong>{participantData.oldData.length} registrations</strong>
                        {participantData.oldData.slice(0, 3).map((reg: any, idx: number) => (
                          <div key={idx} className="mt-2 p-2 bg-white rounded">
                            {reg.sessionName} - {reg.roundName} ({reg.status})
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-500">
                      No data
                    </div>
                  )}
                </div>

                {/* New Key Data */}
                <div>
                  <h4 className="font-medium mb-2">
                    New key: <code className="text-xs bg-green-100 px-2 py-1 rounded">{participantData.newKey}</code>
                  </h4>
                  {participantData.newData && participantData.newData.length > 0 ? (
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-sm">
                        <strong>{participantData.newData.length} registrations</strong>
                        {participantData.newData.slice(0, 3).map((reg: any, idx: number) => (
                          <div key={idx} className="mt-2 p-2 bg-white rounded">
                            {reg.sessionName} - {reg.roundName} ({reg.status})
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-500">
                      No data
                    </div>
                  )}
                </div>
              </div>

              {/* Raw JSON */}
              <details className="mt-4">
                <summary className="cursor-pointer font-medium text-sm mb-2">Raw data (JSON)</summary>
                <pre className="text-xs overflow-auto bg-muted p-3 rounded">
                  {JSON.stringify(participantData, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        )}

        {/* Fix Match Data Result */}
        {fixMatchResult && (
          <Card className="border-2 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-600" />
                Fix match data result
              </CardTitle>
              <CardDescription>
                {fixMatchResult.message}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Fixed</div>
                    <div className="text-2xl font-bold text-green-600">{fixMatchResult.fixed?.length || 0}</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Errors</div>
                    <div className="text-2xl font-bold text-red-600">{fixMatchResult.errors?.length || 0}</div>
                  </div>
                </div>

                {fixMatchResult.fixed && fixMatchResult.fixed.length > 0 && (
                  <details>
                    <summary className="cursor-pointer font-medium text-sm mb-2 text-green-700">
                      ✅ Fixed participants ({fixMatchResult.fixed.length})
                    </summary>
                    <div className="space-y-1 mt-2 max-h-64 overflow-y-auto">
                      {fixMatchResult.fixed.map((item: string, idx: number) => (
                        <div key={idx} className="p-2 bg-green-50 rounded text-sm">
                          {item}
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {fixMatchResult.errors && fixMatchResult.errors.length > 0 && (
                  <details>
                    <summary className="cursor-pointer font-medium text-sm mb-2 text-red-700">
                      ❌ Errors ({fixMatchResult.errors.length})
                    </summary>
                    <div className="space-y-1 mt-2 max-h-64 overflow-y-auto">
                      {fixMatchResult.errors.map((item: string, idx: number) => (
                        <div key={idx} className="p-2 bg-red-50 rounded text-sm">
                          {item}
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                <details>
                  <summary className="cursor-pointer font-medium text-sm mb-2">Raw data (JSON)</summary>
                  <pre className="text-xs overflow-auto bg-muted p-3 rounded mt-2">
                    {JSON.stringify(fixMatchResult, null, 2)}
                  </pre>
                </details>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Migration Result */}
        {migrateAllResult && (
          <Card>
            <CardHeader>
              <CardTitle>Migration result</CardTitle>
              <CardDescription>
                {migrateAllResult.message}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Total found</div>
                    <div className="text-2xl font-bold">{migrateAllResult.totalFound}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Migrated</div>
                    <div className="text-2xl font-bold text-green-600">{migrateAllResult.migratedCount}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Skipped</div>
                    <div className="text-2xl font-bold">{migrateAllResult.skippedCount}</div>
                  </div>
                </div>

                {migrateAllResult.results && migrateAllResult.results.length > 0 && (
                  <details>
                    <summary className="cursor-pointer font-medium text-sm mb-2">
                      View details ({migrateAllResult.results.length} items)
                    </summary>
                    <div className="space-y-2 mt-2 max-h-96 overflow-y-auto">
                      {migrateAllResult.results.map((item: any, idx: number) => (
                        <div key={idx} className={`p-2 rounded text-sm ${
                          item.status === 'migrated' ? 'bg-green-50' : 'bg-gray-50'
                        }`}>
                          <div className="font-mono text-xs mb-1">{item.participantId}</div>
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.status === 'migrated' ? 'bg-green-200' : 'bg-gray-200'
                            }`}>
                              {item.status}
                            </span>
                            {item.registrationsCount && (
                              <span className="text-xs text-gray-600">
                                {item.registrationsCount} registrations
                              </span>
                            )}
                            {item.reason && (
                              <span className="text-xs text-gray-500">{item.reason}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cleanup Result */}
        {cleanupResult && (
          <Card>
            <CardHeader>
              <CardTitle>Cleanup result</CardTitle>
              <CardDescription>
                {cleanupResult.message}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-red-50 p-4 rounded">
                  <div className="text-sm text-gray-600 mb-1">Deleted keys</div>
                  <div className="text-3xl font-bold text-red-600">{cleanupResult.deletedCount}</div>
                </div>

                {cleanupResult.deletedKeys && cleanupResult.deletedKeys.length > 0 && (
                  <details>
                    <summary className="cursor-pointer font-medium text-sm mb-2">
                      View deleted keys ({cleanupResult.deletedKeys.length} items)
                    </summary>
                    <div className="space-y-1 mt-2 max-h-96 overflow-y-auto">
                      {cleanupResult.deletedKeys.map((key: string, idx: number) => (
                        <div key={idx} className="font-mono text-xs bg-red-50 p-2 rounded">
                          {key}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orphaned Verifications */}
        {orphanedVerifications && (
          <Card>
            <CardHeader>
              <CardTitle>Orphaned verifications</CardTitle>
              <CardDescription>
                {orphanedVerifications.orphanedCount > 0 
                  ? `Found ${orphanedVerifications.orphanedCount} orphaned verification(s) - these are verification emails that were sent but registrations were not saved` 
                  : 'No orphaned verifications found - all verification tokens have corresponding registrations'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orphanedVerifications.orphanedCount === 0 ? (
                <div className="bg-green-50 p-4 rounded text-center">
                  <p className="text-green-800">✅ All verification tokens are valid!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">What are orphaned verifications?</p>
                        <p>These are participants who received verification emails but their registration data was not saved to the database. This can happen if the registration process was interrupted.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {orphanedVerifications.orphanedVerifications.map((item: any, idx: number) => (
                      <div key={idx} className="border border-yellow-200 bg-yellow-50 p-4 rounded">
                        <div className="space-y-3">
                          <div>
                            <div className="font-medium text-sm">{item.firstName} {item.lastName}</div>
                            <div className="text-xs text-gray-600 font-mono">{item.email}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Participant ID: <span className="font-mono">{item.participantId}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white p-2 rounded">
                              <span className="text-gray-500">Phone:</span> {item.phoneCountry} {item.phone}
                            </div>
                            <div className="bg-white p-2 rounded">
                              <span className="text-gray-500">Rounds:</span> {item.roundIds?.length || 0}
                            </div>
                          </div>

                          {item.newRounds && item.newRounds.length > 0 && (
                            <div className="bg-white p-2 rounded">
                              <div className="text-xs text-gray-600 mb-1">Sessions to recover:</div>
                              {item.newRounds.slice(0, 3).map((round: any, roundIdx: number) => (
                                <div key={roundIdx} className="text-xs py-1">
                                  • {round.sessionName} - {round.roundName}
                                </div>
                              ))}
                              {item.newRounds.length > 3 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  ...and {item.newRounds.length - 3} more
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <div className={`text-xs px-2 py-1 rounded ${
                              item.hasParticipantEmail ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {item.hasParticipantEmail ? '✓' : '✗'} Email mapping
                            </div>
                            <div className={`text-xs px-2 py-1 rounded ${
                              item.hasRegistrations ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {item.hasRegistrations ? '✓' : '✗'} Registrations ({item.registrationsCount})
                            </div>
                          </div>

                          <Button
                            onClick={() => recoverRegistration(item.verificationToken)}
                            disabled={isLoading}
                            className="w-full"
                            size="sm"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Recover registration
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Email Search Result */}
        {emailSearchResult && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Email search result</CardTitle>
                  <CardDescription>
                    Searching for: {emailSearchResult.email}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => copyToClipboard(emailSearchResult, 'Email search data')}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy all data
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {emailSearchResult.totalFound === 0 ? (
                <div className="bg-yellow-50 p-4 rounded text-center">
                  <p className="text-yellow-800">⚠️ No records found for this email address</p>
                  <p className="text-sm text-gray-600 mt-2">
                    This email has never been used to register for any event.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Total records found</div>
                    <div className="text-2xl font-bold">{emailSearchResult.totalFound}</div>
                  </div>

                  <div className="space-y-3">
                    {emailSearchResult.results.map((item: any, idx: number) => (
                      <div key={idx} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{item.keyType}</span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {item.key}
                          </span>
                        </div>
                        
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-blue-600 hover:underline">
                            View data
                          </summary>
                          <pre className="text-xs overflow-auto bg-gray-50 p-3 rounded mt-2 max-h-96">
                            {JSON.stringify(item.data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Verification Token Data */}
        {verificationTokenData && (
          <Card>
            <CardHeader>
              <CardTitle>Verification token data</CardTitle>
              <CardDescription>
                Token: {verificationTokenData.verificationToken}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verificationTokenData.isValid ? (
                <div className="bg-green-50 p-4 rounded text-center">
                  <p className="text-green-800">✅ This verification token is valid!</p>
                  <p className="text-sm text-gray-600 mt-2">
                    This token can be used to recover a registration.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 p-4 rounded text-center">
                  <p className="text-red-800">⚠️ This verification token is invalid!</p>
                  <p className="text-sm text-gray-600 mt-2">
                    This token cannot be used to recover a registration.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Organizer Sessions Data */}
        {organizerSessionsData && (
          <Card>
            <CardHeader>
              <CardTitle>Organizer sessions</CardTitle>
              <CardDescription>
                Organizer: {organizerSlug}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {organizerSessionsData.filteredSessions === 0 ? (
                <div className="bg-yellow-50 p-4 rounded text-center">
                  <p className="text-yellow-800">⚠️ No sessions found for this organizer</p>
                  <p className="text-sm text-gray-600 mt-2">
                    No sessions match the provided filters.
                  </p>
                  <div className="mt-3 text-left text-xs text-gray-500 bg-white p-3 rounded border">
                    <div>User ID: <span className="font-mono">{organizerSessionsData.userId || 'N/A'}</span></div>
                    <div>Total sessions in database: <span className="font-mono">{organizerSessionsData.totalSessions || 0}</span></div>
                    <div>Filtered sessions: <span className="font-mono">{organizerSessionsData.filteredSessions || 0}</span></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Total sessions found</div>
                    <div className="text-2xl font-bold">{organizerSessionsData.filteredSessions}</div>
                  </div>

                  <div className="space-y-3">
                    {organizerSessionsData.sessions.map((item: any, idx: number) => (
                      <div key={idx} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{item.sessionName}</span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {item.roundName}
                          </span>
                        </div>
                        
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-blue-600 hover:underline">
                            View data
                          </summary>
                          <pre className="text-xs overflow-auto bg-gray-50 p-3 rounded mt-2 max-h-96">
                            {JSON.stringify(item, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Sessions List */}
        {quickSessionsList && (
          <Card>
            <CardHeader>
              <CardTitle>Quick sessions list</CardTitle>
              <CardDescription>
                Organizer: {quickSessionsSlug}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quickSessionsList.sessions?.length === 0 ? (
                <div className="bg-yellow-50 p-4 rounded text-center">
                  <p className="text-yellow-800">⚠️ No sessions found for this organizer</p>
                  <p className="text-sm text-gray-600 mt-2">
                    No sessions match the provided filters.
                  </p>
                  <div className="mt-3 text-left text-xs text-gray-500 bg-white p-3 rounded border">
                    <div>User ID: <span className="font-mono">{quickSessionsList.userId || 'N/A'}</span></div>
                    <div>Total sessions in database: <span className="font-mono">{quickSessionsList.totalSessions || 0}</span></div>
                    <div>Filtered sessions: <span className="font-mono">{quickSessionsList.sessions?.length || 0}</span></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Total sessions found</div>
                    <div className="text-2xl font-bold">{quickSessionsList.sessions?.length || 0}</div>
                  </div>

                  <div className="space-y-3">
                    {quickSessionsList.sessions.map((item: any, idx: number) => (
                      <div key={idx} className="border rounded p-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{item.sessionName}</span>
                            <Button
                              onClick={() => copyToClipboard(item.sessionId, 'Session ID')}
                              variant="ghost"
                              size="sm"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy ID
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="text-gray-500 mb-1">Session ID</div>
                              <div className="font-mono text-blue-600 break-all">{item.sessionId}</div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded">
                              <div className="text-gray-500 mb-1">Date</div>
                              <div>{item.date || 'N/A'}</div>
                            </div>
                          </div>

                          {item.rounds && item.rounds.length > 0 && (
                            <div className="bg-blue-50 p-2 rounded text-xs">
                              <div className="text-gray-600 mb-1">Rounds ({item.rounds.length})</div>
                              <div className="space-y-1">
                                {item.rounds.slice(0, 3).map((round: any, roundIdx: number) => (
                                  <div key={roundIdx} className="flex items-center justify-between">
                                    <span>• {round.name}</span>
                                    <span className="font-mono text-gray-500">{round.startTime}</span>
                                  </div>
                                ))}
                                {item.rounds.length > 3 && (
                                  <div className="text-gray-500">...and {item.rounds.length - 3} more</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-blue-600 hover:underline">
                            View full data
                          </summary>
                          <pre className="text-xs overflow-auto bg-gray-50 p-3 rounded mt-2 max-h-96">
                            {JSON.stringify(item, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Reset Database Result */}
        {resetResult && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-700">Database reset completed</CardTitle>
              <CardDescription>
                All data has been successfully deleted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center p-3 bg-white rounded border">
                    <span className="text-sm text-gray-500 mb-1">Auth users</span>
                    <span className="text-2xl font-bold text-green-600">{resetResult.deletedAuthUsers || 0}</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-white rounded border">
                    <span className="text-sm text-gray-500 mb-1">KV keys</span>
                    <span className="text-2xl font-bold text-green-600">{resetResult.deletedCount}</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-white rounded border border-blue-300">
                    <span className="text-sm text-blue-600 mb-1">Protected admins</span>
                    <span className="text-2xl font-bold text-blue-600">{resetResult.skippedAdminUsers || 0}</span>
                  </div>
                </div>
                <p className="text-sm text-green-700">{resetResult.message}</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Seed Database Result */}
        {seedResult && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-700">Database seeded successfully</CardTitle>
              <CardDescription>
                Random test data has been generated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center p-3 bg-white rounded border">
                    <span className="text-sm text-gray-500 mb-1">Organizers</span>
                    <span className="text-2xl font-bold text-blue-600">{seedResult.created.organizers}</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-white rounded border">
                    <span className="text-sm text-gray-500 mb-1">Sessions</span>
                    <span className="text-2xl font-bold text-blue-600">{seedResult.created.sessions}</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-white rounded border">
                    <span className="text-sm text-gray-500 mb-1">Participants</span>
                    <span className="text-2xl font-bold text-blue-600">{seedResult.created.participants}</span>
                  </div>
                </div>
                <p className="text-sm text-blue-700">{seedResult.message}</p>
                {seedResult.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:underline">
                      View created data details
                    </summary>
                    <div className="mt-3 space-y-2">
                      <div className="bg-white p-3 rounded border">
                        <h4 className="font-semibold text-sm mb-2">Organizers:</h4>
                        <div className="space-y-1 text-xs">
                          {seedResult.details.organizers.map((org: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between py-1 border-b last:border-b-0">
                              <span>{org.name}</span>
                              <code className="text-blue-600">/{org.slug}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <h4 className="font-semibold text-sm mb-2">Password for all test organizers:</h4>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">Test1234!</code>
                      </div>
                    </div>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ===== SERVER LOGS ===== */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800">Server logs</h3>
        <ServerLogsViewer />
      </div>
        </div>
      </div>
      
      {/* Reset Database Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold text-red-600">
                This will permanently delete ALL data from the database:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All organizer accounts and profiles</li>
                <li>All sessions and rounds</li>
                <li>All participants and registrations</li>
                <li>All URL slugs and email mappings</li>
                <li>All verification tokens</li>
                <li>All meeting points and round rules</li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                <p className="text-sm text-blue-700 font-medium">
                  ℹ️ Admin accounts will be preserved and remain active.
                </p>
              </div>
              <p className="font-semibold text-red-600">
                This action cannot be undone!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={resetDatabase}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Resetting...' : 'Yes, reset database'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Seed Database Confirmation Dialog */}
      <AlertDialog open={showSeedDialog} onOpenChange={setShowSeedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-green-600">
              <Database className="w-5 h-5" />
              Seed database with test data?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This will create random test data with the following configuration:
              </p>
              <div className="bg-green-50 p-3 rounded border border-green-200 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Organizers:</span>
                  <span>{seedConfig.organizerCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sessions per organizer:</span>
                  <span>{seedConfig.sessionsPerOrganizer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Rounds per session:</span>
                  <span>{seedConfig.roundsPerSession}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Participants per organizer:</span>
                  <span>{seedConfig.participantsPerOrganizer}</span>
                </div>
                <div className="border-t border-green-300 mt-2 pt-2 flex justify-between font-semibold">
                  <span>Total estimated records:</span>
                  <span className="text-green-700">
                    ~{seedConfig.organizerCount * (1 + seedConfig.sessionsPerOrganizer + seedConfig.participantsPerOrganizer)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                💡 All test organizers will have password: <code className="bg-gray-100 px-1 rounded">Test1234!</code>
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={seedDatabase}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Seeding...' : 'Yes, seed database'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
