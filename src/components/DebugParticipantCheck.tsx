import React, { useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export default function DebugParticipantCheck() {
  const [email, setEmail] = useState('andy.double.a+ma@gmail.com');
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [checkingToken, setCheckingToken] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [checkingRaw, setCheckingRaw] = useState(false);
  const [checkingSessions, setCheckingSessions] = useState(false);
  const [simulatingDashboard, setSimulatingDashboard] = useState(false);
  const [checkingSelections, setCheckingSelections] = useState(false);
  const [syncingSelections, setSyncingSelections] = useState(false);
  const [bulkSyncing, setBulkSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [tokenCheckResult, setTokenCheckResult] = useState<any>(null);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [fixResult, setFixResult] = useState<any>(null);
  const [rawRegistrationsResult, setRawRegistrationsResult] = useState<any>(null);
  const [sessionsCheckResult, setSessionsCheckResult] = useState<any>(null);
  const [dashboardSimulation, setDashboardSimulation] = useState<any>(null);
  const [selectionsCheckResult, setSelectionsCheckResult] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [bulkSyncResult, setBulkSyncResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkParticipant = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/check-participant-email/${encodeURIComponent(email)}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
      console.log('🔍 Participant Check Result:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('❌ Error checking participant:', err);
    } finally {
      setLoading(false);
    }
  };

  const migrateParticipant = async () => {
    setMigrating(true);
    setError(null);
    setMigrationResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/migrate-participant-profile/${encodeURIComponent(email)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setMigrationResult(data);
      console.log('✅ Migration Result:', data);
      
      // Refresh the check after migration
      setTimeout(() => checkParticipant(), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('❌ Error migrating participant:', err);
    } finally {
      setMigrating(false);
    }
  };

  const checkToken = async () => {
    setCheckingToken(true);
    setError(null);
    setTokenCheckResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/check-token/${encodeURIComponent(email)}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setTokenCheckResult(data);
      console.log('🔍 Token Check Result:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('❌ Error checking token:', err);
    } finally {
      setCheckingToken(false);
    }
  };

  const compareTokens = async () => {
    setComparing(true);
    setError(null);
    setComparisonResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/compare-registrations/${encodeURIComponent(email)}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setComparisonResult(data);
      console.log('🔍 Registration Comparison Result:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('❌ Error comparing registrations:', err);
    } finally {
      setComparing(false);
    }
  };

  const fixMissingSelections = async () => {
    setFixing(true);
    setError(null);
    setFixResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/fix-missing-selections`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setFixResult(data);
      console.log('🔧 Fix Missing Selections Result:', data);
      
      // Auto-refresh comparison after fix
      setTimeout(() => {
        compareTokens();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('❌ Error fixing missing selections:', err);
    } finally {
      setFixing(false);
    }
  };

  const checkRawRegistrations = async () => {
    setCheckingRaw(true);
    setError(null);
    setRawRegistrationsResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/raw-registrations/${encodeURIComponent(email)}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setRawRegistrationsResult(data);
      console.log('🔍 Raw Registrations Result:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('❌ Error checking raw registrations:', err);
    } finally {
      setCheckingRaw(false);
    }
  };

  const checkSessions = async () => {
    setCheckingSessions(true);
    setError(null);
    setSessionsCheckResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/check-sessions-exist`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSessionsCheckResult(data);
      console.log('🔍 Sessions Check Result:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('❌ Error checking sessions:', err);
    } finally {
      setCheckingSessions(false);
    }
  };

  const simulateDashboard = async () => {
    setSimulatingDashboard(true);
    setError(null);
    setDashboardSimulation(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/simulate-participant-dashboard`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDashboardSimulation(data);
      console.log('🔍 Dashboard Simulation Result:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('❌ Error simulating dashboard:', err);
    } finally {
      setSimulatingDashboard(false);
    }
  };

  const checkSelections = async () => {
    setCheckingSelections(true);
    setError(null);
    setSelectionsCheckResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/check-participant-selections`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSelectionsCheckResult(data);
      console.log('🔍 Selections Check Result:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('❌ Error checking selections:', err);
    } finally {
      setCheckingSelections(false);
    }
  };

  const syncSelections = async () => {
    setSyncingSelections(true);
    setError(null);
    setSyncResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/sync-participant-selections`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSyncResult(data);
      console.log('✅ Sync Result:', data);
      
      // Auto-refresh selections check after sync
      if (data.success && data.addedCount > 0) {
        setTimeout(() => checkSelections(), 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('❌ Error syncing selections:', err);
    } finally {
      setSyncingSelections(false);
    }
  };

  const bulkSyncAllParticipants = async () => {
    if (!confirm('⚠️ This will sync ALL participants in the database. This may take a while. Continue?')) {
      return;
    }
    
    setBulkSyncing(true);
    setError(null);
    setBulkSyncResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/bulk-sync-all-participants`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setBulkSyncResult(data);
      console.log('✅ Bulk Sync All Result:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('❌ Error bulk syncing all participants:', err);
    } finally {
      setBulkSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl mb-6">Debug: Check participant by email</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-4">
            <label className="block mb-2">
              Email address:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="participant@example.com"
            />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={checkParticipant}
              disabled={loading || !email}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Participant'}
            </button>
            
            <button
              onClick={migrateParticipant}
              disabled={migrating || !email || !result}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {migrating ? 'Migrating...' : 'Fix Profile ID Mismatch'}
            </button>
            
            <button
              onClick={checkToken}
              disabled={checkingToken || !email}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {checkingToken ? 'Checking...' : 'Check Token'}
            </button>
            
            <button
              onClick={compareTokens}
              disabled={comparing || !email}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {comparing ? 'Comparing...' : 'Compare Tokens'}
            </button>
            
            <button
              onClick={fixMissingSelections}
              disabled={fixing || !email || !comparisonResult || comparisonResult.summary?.mismatchCount === 0}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {fixing ? 'Fixing...' : '🔧 Fix Missing'}
            </button>
            
            <button
              onClick={checkRawRegistrations}
              disabled={checkingRaw || !email}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {checkingRaw ? 'Checking...' : 'Check Raw Registrations'}
            </button>
            
            <button
              onClick={checkSessions}
              disabled={checkingSessions || !email}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {checkingSessions ? 'Checking...' : 'Check Sessions'}
            </button>
            
            <button
              onClick={simulateDashboard}
              disabled={simulatingDashboard || !email}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {simulatingDashboard ? 'Simulating...' : 'Simulate Dashboard'}
            </button>
            
            <button
              onClick={checkSelections}
              disabled={checkingSelections || !email}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {checkingSelections ? 'Checking...' : 'Check Selections'}
            </button>
            
            <button
              onClick={syncSelections}
              disabled={syncingSelections || !email}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {syncingSelections ? 'Syncing...' : 'Sync This Participant'}
            </button>
          </div>
          
          <div className="mt-4">
            <button
              onClick={bulkSyncAllParticipants}
              disabled={bulkSyncing}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-lg w-full"
            >
              {bulkSyncing ? '🔄 Syncing ALL participants...' : '🚀 Sync ALL Participants (fix all missing registrations)'}
            </button>
            <p className="mt-2 text-sm text-gray-600 text-center">
              This will check and fix all participants in the database
            </p>
          </div>
          
          {!result && (
            <p className="mt-4 text-sm text-gray-600">
              Check participant first to see if migration is needed
            </p>
          )}
          
          {comparisonResult && comparisonResult.summary?.mismatchCount > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                ⚠️ Found {comparisonResult.summary.mismatchCount} mismatched registration(s). Click "🔧 Fix Missing" to create missing participant selection records.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h2 className="text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl mb-4">Results for: {result.email}</h2>
            
            <div className="mb-6 p-4 bg-blue-50 rounded">
              <h3 className="font-semibold mb-2">Summary:</h3>
              <p>Total Participant IDs: <strong>{result.summary?.totalParticipantIds}</strong></p>
              <p>Total Registrations Across All: <strong>{result.summary?.totalRegistrationsAcrossAll}</strong></p>
            </div>

            {result.participantEmail && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Participant Email Record:</h3>
                <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
                  {JSON.stringify(result.participantEmail, null, 2)}
                </pre>
              </div>
            )}

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Participant IDs ({result.participantIds?.length || 0}):</h3>
              <ul className="list-disc list-inside bg-gray-100 p-4 rounded">
                {result.participantIds?.map((id: string) => (
                  <li key={id} className="font-mono text-sm">{id}</li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Matching Tokens ({result.matchingTokens?.length || 0}):</h3>
              {result.matchingTokens?.map((token: any, idx: number) => (
                <div key={idx} className="bg-gray-100 p-3 rounded mb-2">
                  <p className="font-mono text-sm">Token: {token.key}</p>
                  <p className="text-sm">Participant ID: {token.participantId}</p>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Matching Profiles ({result.matchingProfiles?.length || 0}):</h3>
              {result.matchingProfiles?.map((profile: any, idx: number) => (
                <div key={idx} className="bg-gray-100 p-3 rounded mb-2">
                  <p className="text-sm">Key: {profile.key}</p>
                  <p className="text-sm">Name: {profile.firstName} {profile.lastName}</p>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Registrations by Participant ID:</h3>
              {Object.entries(result.registrationsByParticipantId || {}).map(([pid, regs]: [string, any]) => (
                <div key={pid} className="mb-4 border border-gray-300 rounded p-4">
                  <h4 className="font-semibold mb-2">
                    Participant ID: {pid}
                    <span className="ml-2 text-sm text-gray-600">
                      ({regs.length} registration{regs.length !== 1 ? 's' : ''})
                    </span>
                  </h4>
                  {regs.length > 0 ? (
                    <div className="space-y-2">
                      {regs.map((reg: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded text-sm">
                          <p><strong>Session:</strong> {reg.sessionName} (ID: {reg.sessionId})</p>
                          <p><strong>Round:</strong> {reg.roundName} (ID: {reg.roundId})</p>
                          <p><strong>Date:</strong> {reg.date}</p>
                          <p><strong>Status:</strong> {reg.status}</p>
                          <p><strong>Registered at:</strong> {new Date(reg.registeredAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No registrations</p>
                  )}
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Full JSON Response:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {migrationResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl mb-4 text-green-800">✅ Migration completed for: {migrationResult.email}</h2>
            
            <div className="space-y-2 text-sm">
              <p><strong>Correct Participant ID:</strong> <span className="font-mono">{migrationResult.correctParticipantId}</span></p>
              <p><strong>Profiles Migrated:</strong> {migrationResult.migratedCount}</p>
              <p><strong>Old Profiles Deleted:</strong> {migrationResult.deletedOldProfiles?.join(', ') || 'None'}</p>
              <p><strong>Registration Count:</strong> {migrationResult.registrationCount}</p>
            </div>
            
            {migrationResult.finalProfile && (
              <div className="mt-4 p-3 bg-white rounded">
                <p className="font-semibold mb-1">Final Profile:</p>
                <p className="text-sm">{migrationResult.finalProfile.firstName} {migrationResult.finalProfile.lastName}</p>
                <p className="text-sm text-gray-600">{migrationResult.finalProfile.email}</p>
              </div>
            )}
          </div>
        )}

        {tokenCheckResult && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl mb-4 text-yellow-800">🔍 Token check result for: {tokenCheckResult.email}</h2>
            
            <div className="space-y-3">
              <div className="p-3 bg-white rounded">
                <p className="text-sm font-semibold mb-1">Token (from participant_email):</p>
                <p className="font-mono text-xs break-all">{tokenCheckResult.token}</p>
              </div>
              
              <div className="p-3 bg-white rounded">
                <p className="text-sm font-semibold mb-1">Token (from localStorage):</p>
                <p className="font-mono text-xs break-all">{localStorage.getItem('participant_token') || 'Not found'}</p>
                {localStorage.getItem('participant_token') !== tokenCheckResult.token && (
                  <div className="mt-2">
                    <p className="text-red-600 text-sm mb-2">⚠️ Token mismatch! localStorage has old token.</p>
                    <button
                      onClick={() => {
                        localStorage.setItem('participant_token', tokenCheckResult.token);
                        alert('✅ localStorage token updated! Refresh the participant dashboard to see all rounds.');
                        // Re-check to show updated value
                        checkToken();
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                    >
                      Fix localStorage token
                    </button>
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-green-50 rounded border border-green-200">
                <p className="text-sm font-semibold mb-2">✅ Quick access:</p>
                <button
                  onClick={() => {
                    window.location.href = `/p/${tokenCheckResult.token}`;
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm w-full"
                >
                  Open participant dashboard with correct token
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded">
                  <p className="text-sm font-semibold mb-1">Participant ID:</p>
                  <p className="font-mono text-xs">{tokenCheckResult.participantId}</p>
                </div>
                
                <div className="p-3 bg-white rounded">
                  <p className="text-sm font-semibold mb-1">Registration Count:</p>
                  <p className="text-2xl">{tokenCheckResult.registrationCount}</p>
                </div>
              </div>
            </div>
            
            {tokenCheckResult.profile && (
              <div className="mt-4 p-3 bg-white rounded">
                <p className="font-semibold mb-1">Profile:</p>
                <p className="text-sm">{tokenCheckResult.profile.firstName} {tokenCheckResult.profile.lastName}</p>
                <p className="text-sm text-gray-600">{tokenCheckResult.profile.email}</p>
              </div>
            )}
            
            {tokenCheckResult.endpointResponses && (
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-white rounded">
                  <p className="font-semibold mb-2">Endpoint: /p/:token</p>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(tokenCheckResult.endpointResponses.info, null, 2)}
                  </pre>
                </div>
                
                <div className="p-3 bg-white rounded">
                  <p className="font-semibold mb-2">Endpoint: /p/:token/registrations</p>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(tokenCheckResult.endpointResponses.registrations, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {comparisonResult && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl mb-4 text-red-800">🔍 Registration comparison for: {comparisonResult.email}</h2>
            
            <div className="mb-6 p-4 bg-white rounded">
              <h3 className="font-semibold mb-3">Summary:</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Participant Registrations</p>
                  <p className="text-3xl font-bold text-blue-600">{comparisonResult.summary?.participantRegistrationsCount}</p>
                  <p className="text-xs text-gray-500 mt-1">participant_registrations:{'{participantId}'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Session Selections</p>
                  <p className="text-3xl font-bold text-green-600">{comparisonResult.summary?.sessionSelectionsCount}</p>
                  <p className="text-xs text-gray-500 mt-1">participant:{'{roundId}'}:{'{participantId}'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mismatches</p>
                  <p className="text-3xl font-bold text-red-600">{comparisonResult.summary?.mismatchCount}</p>
                </div>
              </div>
            </div>
            
            {comparisonResult.summary?.mismatchCount > 0 && (
              <div className="space-y-4">
                {comparisonResult.mismatches?.inSessionNotInParticipant?.length > 0 && (
                  <div className="p-4 bg-white rounded">
                    <h3 className="font-semibold mb-2 text-red-700">
                      ⚠️ In Session but NOT in Participant Registrations ({comparisonResult.mismatches.inSessionNotInParticipant.length}):
                    </h3>
                    <div className="space-y-2">
                      {comparisonResult.mismatches.inSessionNotInParticipant.map((reg: any, idx: number) => (
                        <div key={idx} className="bg-red-50 p-3 rounded text-sm border border-red-200">
                          <p><strong>Session:</strong> {reg.sessionName}</p>
                          <p><strong>Round:</strong> {reg.roundName} ({reg.startTime})</p>
                          <p className="text-xs text-gray-600 mt-1">Session ID: {reg.sessionId} | Round ID: {reg.roundId}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {comparisonResult.mismatches?.inParticipantNotInSession?.length > 0 && (
                  <div className="p-4 bg-white rounded">
                    <h3 className="font-semibold mb-2 text-orange-700">
                      ⚠️ In Participant Registrations but NOT in Session ({comparisonResult.mismatches.inParticipantNotInSession.length}):
                    </h3>
                    <div className="space-y-2">
                      {comparisonResult.mismatches.inParticipantNotInSession.map((reg: any, idx: number) => (
                        <div key={idx} className="bg-orange-50 p-3 rounded text-sm border border-orange-200">
                          <p><strong>Session:</strong> {reg.sessionName}</p>
                          <p><strong>Round:</strong> {reg.roundName} ({reg.startTime})</p>
                          <p className="text-xs text-gray-600 mt-1">Session ID: {reg.sessionId} | Round ID: {reg.roundId}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {comparisonResult.summary?.mismatchCount === 0 && (
              <div className="p-4 bg-green-50 rounded border border-green-200">
                <p className="text-green-800 font-semibold">✅ No mismatches found! Data is synchronized.</p>
              </div>
            )}
            
            <div className="mt-6 space-y-3">
              <details className="bg-white rounded p-3">
                <summary className="cursor-pointer font-semibold">Show all participant registrations ({comparisonResult.participantRegistrations?.length})</summary>
                <pre className="mt-2 text-xs overflow-x-auto bg-gray-50 p-3 rounded">
                  {JSON.stringify(comparisonResult.participantRegistrations, null, 2)}
                </pre>
              </details>
              
              <details className="bg-white rounded p-3">
                <summary className="cursor-pointer font-semibold">Show all session selections ({comparisonResult.sessionSelections?.length})</summary>
                <pre className="mt-2 text-xs overflow-x-auto bg-gray-50 p-3 rounded">
                  {JSON.stringify(comparisonResult.sessionSelections, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
        
        {fixResult && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl mb-4">🔧 Fix Results</h2>
            
            <div className="mb-4 p-4 bg-green-50 rounded border border-green-200">
              <p className="text-green-800 font-semibold">✅ {fixResult.message}</p>
            </div>
            
            <div className="mb-4 grid grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded">
                <p className="text-sm text-gray-600">Total Registrations</p>
                <p className="text-2xl font-bold text-blue-600">{fixResult.summary?.totalRegistrations}</p>
              </div>
              <div className="p-4 bg-green-50 rounded">
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-2xl font-bold text-green-600">{fixResult.summary?.created}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Skipped</p>
                <p className="text-2xl font-bold text-gray-600">{fixResult.summary?.skipped}</p>
              </div>
            </div>
            
            <details className="bg-white rounded p-3">
              <summary className="cursor-pointer font-semibold">Show fix details ({fixResult.results?.length})</summary>
              <div className="mt-3 space-y-2">
                {fixResult.results?.map((item: any, idx: number) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded text-sm border ${
                      item.action === 'created' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <p><strong>{item.action === 'created' ? '✅ Created' : '⏭️  Skipped'}:</strong> {item.roundId}</p>
                    {item.reason && <p className="text-xs text-gray-600">Reason: {item.reason}</p>}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
        
        {rawRegistrationsResult && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl mb-4 text-gray-800">🔍 Raw Registrations for: {rawRegistrationsResult.email}</h2>
            
            <div className="mb-4 p-4 bg-white rounded">
              <h3 className="font-semibold mb-2">Summary:</h3>
              <p>Total Count: <strong>{rawRegistrationsResult.registrationsCount}</strong></p>
              <p>Missing Organizer ID: <strong className="text-red-600">{rawRegistrationsResult.missingOrganizerIdCount}</strong></p>
            </div>
            
            {rawRegistrationsResult.missingOrganizerIdCount > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
                <h3 className="font-semibold mb-2 text-red-800">⚠️ Registrations Missing Organizer ID:</h3>
                <div className="space-y-2">
                  {rawRegistrationsResult.registrationsWithMissingOrganizerId?.map((reg: any, idx: number) => (
                    <div key={idx} className="bg-white p-3 rounded text-sm">
                      <p><strong>Session:</strong> {reg.sessionName} (ID: {reg.sessionId})</p>
                      <p><strong>Round:</strong> {reg.roundName} (ID: {reg.roundId})</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <details className="bg-white rounded p-3">
              <summary className="cursor-pointer font-semibold">Show all raw registrations ({rawRegistrationsResult.registrationsCount})</summary>
              <div className="mt-3 space-y-3">
                {rawRegistrationsResult.rawRegistrations?.map((reg: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded text-sm border border-gray-200">
                    <p><strong>Round ID:</strong> <span className="font-mono text-xs">{reg.roundId}</span></p>
                    <p><strong>Session ID:</strong> <span className="font-mono text-xs">{reg.sessionId}</span></p>
                    <p><strong>Session Name:</strong> {reg.sessionName}</p>
                    <p><strong>Round Name:</strong> {reg.roundName}</p>
                    <p><strong>Organizer ID:</strong> <span className={!reg.organizerId ? 'text-red-600 font-semibold' : ''}>{reg.organizerId || '❌ MISSING'}</span></p>
                    <p><strong>Organizer Name:</strong> {reg.organizerName || '—'}</p>
                    <p><strong>Organizer URL Slug:</strong> {reg.organizerUrlSlug || '—'}</p>
                    <p><strong>Status:</strong> {reg.status}</p>
                    <p><strong>Date:</strong> {reg.date}</p>
                    <p><strong>Start Time:</strong> {reg.startTime}</p>
                    <p><strong>Duration:</strong> {reg.duration} min</p>
                  </div>
                ))}
              </div>
            </details>
            
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Full JSON Response:</h3>
              <pre className="bg-white p-4 rounded overflow-x-auto text-xs">
                {JSON.stringify(rawRegistrationsResult, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        {sessionsCheckResult && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl mb-4 text-gray-800">🔍 Sessions Check for: {sessionsCheckResult.email}</h2>
            
            <div className="mb-4 p-4 bg-white rounded">
              <h3 className="font-semibold mb-3">Summary:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                  <p className="text-3xl font-bold text-blue-600">{sessionsCheckResult.totalSessions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Missing Sessions</p>
                  <p className="text-3xl font-bold text-red-600">{sessionsCheckResult.missingSessions}</p>
                </div>
              </div>
              <p className="mt-3">
                All Sessions Exist: <strong className={sessionsCheckResult.allSessionsExist ? 'text-green-600' : 'text-red-600'}>{sessionsCheckResult.allSessionsExist ? '✅ YES' : '❌ NO'}</strong>
              </p>
            </div>
            
            {!sessionsCheckResult.allSessionsExist && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
                <h3 className="font-semibold mb-2 text-red-800">⚠️ Missing Sessions Found!</h3>
                <p className="text-sm text-red-700 mb-3">Some sessions that participant registered for are no longer in the database.</p>
              </div>
            )}
            
            <details className="bg-white rounded p-3" open>
              <summary className="cursor-pointer font-semibold mb-3">Show session details ({sessionsCheckResult.totalSessions})</summary>
              <div className="mt-3 space-y-3">
                {sessionsCheckResult.sessions?.map((session: any, idx: number) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded text-sm border ${
                      session.exists 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold">{session.sessionName}</p>
                      {session.exists ? (
                        <span className="text-green-600 text-xs">✅ EXISTS</span>
                      ) : (
                        <span className="text-red-600 text-xs">❌ MISSING</span>
                      )}
                    </div>
                    <p><strong>Session ID:</strong> <span className="font-mono text-xs">{session.sessionId}</span></p>
                    <p><strong>Organizer:</strong> {session.organizerName} ({session.organizerUrlSlug})</p>
                    <p><strong>Organizer ID:</strong> <span className="font-mono text-xs">{session.organizerId}</span></p>
                    <p><strong>Expected Key:</strong> <span className="font-mono text-xs">{session.expectedKey}</span></p>
                    <p><strong>Rounds in Registration:</strong> {session.roundsInRegistration}</p>
                    {session.exists && (
                      <>
                        <p><strong>Rounds in Session:</strong> {session.roundsInSession}</p>
                        <p><strong>Session Status:</strong> {session.sessionStatus}</p>
                        <p><strong>Session Date:</strong> {session.sessionDate}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </details>
            
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Full JSON Response:</h3>
              <pre className="bg-white p-4 rounded overflow-x-auto text-xs">
                {JSON.stringify(sessionsCheckResult, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        {dashboardSimulation && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl mb-4 text-gray-800">🔍 Dashboard Simulation for: {dashboardSimulation.email}</h2>
            
            <div className="mb-4 p-4 bg-white rounded">
              <h3 className="font-semibold mb-3">Summary:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Rounds</p>
                  <p className="text-3xl font-bold text-blue-600">{dashboardSimulation.totalRounds}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Missing Rounds</p>
                  <p className="text-3xl font-bold text-red-600">{dashboardSimulation.missingRounds}</p>
                </div>
              </div>
              <p className="mt-3">
                All Rounds Exist: <strong className={dashboardSimulation.allRoundsExist ? 'text-green-600' : 'text-red-600'}>{dashboardSimulation.allRoundsExist ? '✅ YES' : '❌ NO'}</strong>
              </p>
            </div>
            
            {!dashboardSimulation.allRoundsExist && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
                <h3 className="font-semibold mb-2 text-red-800">⚠️ Missing Rounds Found!</h3>
                <p className="text-sm text-red-700 mb-3">Some rounds that participant registered for are no longer in the database.</p>
              </div>
            )}
            
            <details className="bg-white rounded p-3" open>
              <summary className="cursor-pointer font-semibold mb-3">Show round details ({dashboardSimulation.totalRounds})</summary>
              <div className="mt-3 space-y-3">
                {dashboardSimulation.rounds?.map((round: any, idx: number) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded text-sm border ${
                      round.exists 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold">{round.roundName}</p>
                      {round.exists ? (
                        <span className="text-green-600 text-xs">✅ EXISTS</span>
                      ) : (
                        <span className="text-red-600 text-xs">❌ MISSING</span>
                      )}
                    </div>
                    <p><strong>Round ID:</strong> <span className="font-mono text-xs">{round.roundId}</span></p>
                    <p><strong>Organizer:</strong> {round.organizerName} ({round.organizerUrlSlug})</p>
                    <p><strong>Organizer ID:</strong> <span className="font-mono text-xs">{round.organizerId}</span></p>
                    <p><strong>Expected Key:</strong> <span className="font-mono text-xs">{round.expectedKey}</span></p>
                    <p><strong>Sessions in Registration:</strong> {round.sessionsInRegistration}</p>
                    {round.exists && (
                      <>
                        <p><strong>Sessions in Round:</strong> {round.sessionsInRound}</p>
                        <p><strong>Round Status:</strong> {round.roundStatus}</p>
                        <p><strong>Round Date:</strong> {round.roundDate}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </details>
            
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Full JSON Response:</h3>
              <pre className="bg-white p-4 rounded overflow-x-auto text-xs">
                {JSON.stringify(dashboardSimulation, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        {selectionsCheckResult && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl mb-4 text-gray-800">🔍 Selections Check for: {selectionsCheckResult.email}</h2>
            
            <div className="mb-4 p-4 bg-white rounded">
              <h3 className="font-semibold mb-3">Summary:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Selections</p>
                  <p className="text-3xl font-bold text-blue-600">{selectionsCheckResult.totalSelections}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Missing Selections</p>
                  <p className="text-3xl font-bold text-red-600">{selectionsCheckResult.missingSelections}</p>
                </div>
              </div>
              <p className="mt-3">
                All Selections Exist: <strong className={selectionsCheckResult.allSelectionsExist ? 'text-green-600' : 'text-red-600'}>{selectionsCheckResult.allSelectionsExist ? '✅ YES' : '❌ NO'}</strong>
              </p>
            </div>
            
            {!selectionsCheckResult.allSelectionsExist && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
                <h3 className="font-semibold mb-2 text-red-800">⚠️ Missing Selections Found!</h3>
                <p className="text-sm text-red-700 mb-3">Some selections that participant registered for are no longer in the database.</p>
              </div>
            )}
            
            <details className="bg-white rounded p-3" open>
              <summary className="cursor-pointer font-semibold mb-3">Show selection details ({selectionsCheckResult.totalSelections})</summary>
              <div className="mt-3 space-y-3">
                {selectionsCheckResult.selections?.map((selection: any, idx: number) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded text-sm border ${
                      selection.exists 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold">{selection.selectionName}</p>
                      {selection.exists ? (
                        <span className="text-green-600 text-xs">✅ EXISTS</span>
                      ) : (
                        <span className="text-red-600 text-xs">❌ MISSING</span>
                      )}
                    </div>
                    <p><strong>Selection ID:</strong> <span className="font-mono text-xs">{selection.selectionId}</span></p>
                    <p><strong>Organizer:</strong> {selection.organizerName} ({selection.organizerUrlSlug})</p>
                    <p><strong>Organizer ID:</strong> <span className="font-mono text-xs">{selection.organizerId}</span></p>
                    <p><strong>Expected Key:</strong> <span className="font-mono text-xs">{selection.expectedKey}</span></p>
                    <p><strong>Sessions in Registration:</strong> {selection.sessionsInRegistration}</p>
                    {selection.exists && (
                      <>
                        <p><strong>Sessions in Selection:</strong> {selection.sessionsInSelection}</p>
                        <p><strong>Selection Status:</strong> {selection.selectionStatus}</p>
                        <p><strong>Selection Date:</strong> {selection.selectionDate}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </details>
            
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Full JSON Response:</h3>
              <pre className="bg-white p-4 rounded overflow-x-auto text-xs">
                {JSON.stringify(selectionsCheckResult, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        {syncResult && (
          <div className={`border rounded-lg p-6 mb-6 ${
            syncResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h2 className={`text-xl mb-4 ${
              syncResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {syncResult.success ? '✅' : '❌'} Sync Results for: {syncResult.email}
            </h2>
            
            {syncResult.success && (
              <>
                <div className="mb-4 p-4 bg-white rounded">
                  <h3 className="font-semibold mb-3">Summary:</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Initial Count</p>
                      <p className="text-3xl font-bold text-blue-600">{syncResult.initialCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Added Count</p>
                      <p className="text-3xl font-bold text-green-600">{syncResult.addedCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Final Count</p>
                      <p className="text-3xl font-bold text-purple-600">{syncResult.finalCount}</p>
                    </div>
                  </div>
                  <p className="mt-3">
                    <strong>Participant ID:</strong> <span className="font-mono text-sm">{syncResult.participantId}</span>
                  </p>
                </div>
                
                {syncResult.addedCount > 0 ? (
                  <div className="mb-4 p-4 bg-white rounded">
                    <h3 className="font-semibold mb-3 text-green-700">
                      ✅ Added Registrations ({syncResult.addedRegistrations?.length}):
                    </h3>
                    <div className="space-y-2">
                      {syncResult.addedRegistrations?.map((reg: any, idx: number) => (
                        <div key={idx} className="bg-green-50 p-3 rounded text-sm border border-green-200">
                          <p><strong>Session:</strong> {reg.sessionName}</p>
                          <p><strong>Round:</strong> {reg.roundName}</p>
                          <p><strong>Status:</strong> {reg.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-4 bg-white rounded border border-gray-200">
                    <p className="text-gray-600">
                      ℹ️ No new registrations were added. All selections already have corresponding registrations.
                    </p>
                  </div>
                )}
                
                {syncResult.errors && syncResult.errors.length > 0 && (
                  <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded">
                    <h3 className="font-semibold mb-3 text-orange-700">
                      ⚠️ Errors ({syncResult.errors.length}):
                    </h3>
                    <div className="space-y-2">
                      {syncResult.errors.map((err: any, idx: number) => (
                        <div key={idx} className="bg-white p-3 rounded text-sm">
                          <p><strong>Session ID:</strong> {err.sessionId}</p>
                          <p className="text-orange-600"><strong>Error:</strong> {err.error}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Full JSON Response:</h3>
                  <pre className="bg-white p-4 rounded overflow-x-auto text-xs">
                    {JSON.stringify(syncResult, null, 2)}
                  </pre>
                </div>
              </>
            )}
            
            {!syncResult.success && (
              <div className="mb-4 p-4 bg-white rounded">
                <p className="text-red-600"><strong>Error:</strong> {syncResult.error}</p>
                {syncResult.details && (
                  <p className="text-sm text-gray-600 mt-2">{syncResult.details}</p>
                )}
              </div>
            )}
          </div>
        )}
        
        {bulkSyncResult && (
          <div className={`border rounded-lg p-6 mb-6 ${
            bulkSyncResult.success 
              ? 'bg-purple-50 border-purple-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h2 className={`text-xl mb-4 ${
              bulkSyncResult.success ? 'text-purple-800' : 'text-red-800'
            }`}>
              {bulkSyncResult.success ? '✅' : '❌'} Bulk Sync All Participants Results
            </h2>
            
            {bulkSyncResult.success && (
              <>
                <div className="mb-4 p-4 bg-white rounded">
                  <h3 className="font-semibold mb-3">Summary:</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Participants</p>
                      <p className="text-3xl font-bold text-blue-600">{bulkSyncResult.totalParticipants}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Participants With Missing Data</p>
                      <p className="text-3xl font-bold text-orange-600">{bulkSyncResult.participantsWithMissingData}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Registrations Added</p>
                      <p className="text-3xl font-bold text-green-600">{bulkSyncResult.totalRegistrationsAdded}</p>
                    </div>
                  </div>
                  {bulkSyncResult.summary && (
                    <p className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded text-sm">
                      {bulkSyncResult.summary}
                    </p>
                  )}
                </div>
                
                {bulkSyncResult.results && bulkSyncResult.results.length > 0 && (
                  <div className="mb-4 p-4 bg-white rounded">
                    <h3 className="font-semibold mb-3 text-green-700">
                      📋 Participants with missing data fixed ({bulkSyncResult.results.length}):
                    </h3>
                    <p className="text-xs text-gray-600 mb-3">Showing first 20 results</p>
                    <div className="space-y-3">
                      {bulkSyncResult.results.map((result: any, idx: number) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded text-sm border ${
                            result.error 
                              ? 'bg-red-50 border-red-200' 
                              : 'bg-green-50 border-green-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-semibold">{result.email}</p>
                            {!result.error && (
                              <span className="text-green-600 text-xs">
                                +{result.addedCount} registrations
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mb-2">
                            <strong>Participant ID:</strong> <span className="font-mono">{result.participantId}</span>
                          </p>
                          
                          {result.error ? (
                            <p className="text-red-600 text-xs">
                              <strong>Error:</strong> {result.error}
                            </p>
                          ) : result.addedRegistrations && result.addedRegistrations.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold mb-1">Added registrations:</p>
                              <div className="space-y-1">
                                {result.addedRegistrations.map((reg: any, regIdx: number) => (
                                  <div key={regIdx} className="bg-white p-2 rounded text-xs">
                                    <p><strong>{reg.sessionName}</strong> - {reg.roundName}</p>
                                    <p className="text-gray-600">Status: {reg.status}</p>
                                  </div>
                                ))}
                                {result.addedCount > result.addedRegistrations.length && (
                                  <p className="text-xs text-gray-500 italic">
                                    ... and {result.addedCount - result.addedRegistrations.length} more
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {bulkSyncResult.totalRegistrationsAdded === 0 && (
                  <div className="mb-4 p-4 bg-white rounded border border-gray-200">
                    <p className="text-gray-600">
                      ✅ Perfect! All participants have complete data. No missing registrations found.
                    </p>
                  </div>
                )}
                
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Full JSON Response:</h3>
                  <pre className="bg-white p-4 rounded overflow-x-auto text-xs">
                    {JSON.stringify(bulkSyncResult, null, 2)}
                  </pre>
                </div>
              </>
            )}
            
            {!bulkSyncResult.success && (
              <div className="mb-4 p-4 bg-white rounded">
                <p className="text-red-600"><strong>Error:</strong> {bulkSyncResult.error}</p>
                {bulkSyncResult.details && (
                  <p className="text-sm text-gray-600 mt-2">{bulkSyncResult.details}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}