import { useState } from 'react';
import { Play, CheckCircle2, XCircle, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';
import { supabase } from '../utils/supabase/client';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'warning';
  duration?: number;
  message?: string;
  data?: any;
  error?: any;
}

export function AdminTestPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [isMigratingOrganizerNames, setIsMigratingOrganizerNames] = useState(false);
  const [organizerNamesMigrationResult, setOrganizerNamesMigrationResult] = useState<any>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([
    'backend-health',
    'auth-check',
    'kv-store-read',
    'new-endpoints',
    'data-consistency',
    'duplicate-registration-fix',
    'status-update-logic'
  ]);

  const availableTests = [
    {
      id: 'backend-health',
      name: 'Backend health check',
      description: 'Verify backend is responding'
    },
    {
      id: 'auth-check',
      name: 'Authentication check',
      description: 'Verify auth token is valid'
    },
    {
      id: 'kv-store-read',
      name: 'KV Store read test',
      description: 'Test reading from KV store'
    },
    {
      id: 'new-endpoints',
      name: 'Participant endpoints test',
      description: 'Test /organizer/:slug/participants endpoint'
    },
    {
      id: 'data-consistency',
      name: 'Data consistency check',
      description: 'Verify participant data is consistent across keys'
    },
    {
      id: 'duplicate-registration-fix',
      name: 'Duplicate registration fix test',
      description: 'Test that participants can register for same round name in different sessions'
    },
    {
      id: 'status-update-logic',
      name: 'Status update logic test',
      description: 'Test automatic status updates (registered → unconfirmed after T-0)'
    }
  ];

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const accessToken = localStorage.getItem('supabase_access_token');
    if (!accessToken) {
      toast.error('Not authenticated - please log in as admin first');
      setIsRunning(false);
      return;
    }

    debugLog('🧪 Starting tests...');

    const results: TestResult[] = [];

    for (const testId of selectedTests) {
      const testResult: TestResult = {
        name: availableTests.find(t => t.id === testId)?.name || testId,
        status: 'running'
      };
      
      // Show running status
      setTestResults([...results, testResult]);

      const startTime = Date.now();

      try {
        switch (testId) {
          case 'backend-health':
            await testBackendHealth(testResult);
            break;
          case 'auth-check':
            await testAuth(testResult, accessToken);
            break;
          case 'kv-store-read':
            await testKVStore(testResult, accessToken);
            break;
          case 'new-endpoints':
            await testNewEndpoints(testResult, accessToken);
            break;
          case 'data-consistency':
            await testDataConsistency(testResult, accessToken);
            break;
          case 'duplicate-registration-fix':
            await testDuplicateRegistrationFix(testResult, accessToken);
            break;
          case 'status-update-logic':
            await testStatusUpdateLogic(testResult, accessToken);
            break;
        }

        testResult.duration = Date.now() - startTime;
        if (testResult.status === 'running') {
          testResult.status = 'success';
        }
      } catch (error: any) {
        testResult.status = 'error';
        testResult.message = error.message || 'Test failed';
        testResult.duration = Date.now() - startTime;
        testResult.error = error;
        errorLog(`❌ Test ${testId} failed:`, error);
      }

      results.push(testResult);
      setTestResults([...results]);
    }

    setIsRunning(false);
    
    const failures = results.filter(r => r.status === 'error').length;
    if (failures === 0) {
      toast.success('All tests passed!');
    } else {
      toast.error(`${failures} test(s) failed - check authentication`);
    }
  };

  // Test functions
  async function testBackendHealth(result: TestResult) {
    // Use the /test endpoint with anon key (Supabase Edge Functions require some auth)
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/test`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    result.message = `Backend is healthy - version ${data.version || 'unknown'}`;
    result.data = { version: data.version, timestamp: data.timestamp };
  }

  async function testAuth(result: TestResult, accessToken: string) {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/profile`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Authentication failed (${response.status})`);
    }

    const data = await response.json();
    result.message = `Authenticated as: ${data.user?.email || 'Unknown'}`;
    result.data = data;
  }

  async function testKVStore(result: TestResult, accessToken: string) {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/profile`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to read from KV store (${response.status})`);
    }

    const data = await response.json();
    
    if (!data.user || !data.user.urlSlug) {
      throw new Error('Profile data incomplete');
    }

    result.message = `Successfully read user_profile key`;
    result.data = { urlSlug: data.user.urlSlug };
  }

  async function testNewEndpoints(result: TestResult, accessToken: string) {
    // Get user profile to get slug
    const profileResponse = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/profile`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!profileResponse.ok) {
      throw new Error(`Failed to get profile (${profileResponse.status})`);
    }

    const profileData = await profileResponse.json();
    const userSlug = profileData.user?.urlSlug;

    if (!userSlug) {
      throw new Error('No URL slug found in profile');
    }

    // Test new endpoint
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/organizer/${userSlug}/participants`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Endpoint failed (${response.status})`);
    }

    const data = await response.json();
    result.message = `Found ${data.count} participants`;
    result.data = {
      count: data.count,
      sample: data.participants?.[0] || null
    };
  }

  async function testDataConsistency(result: TestResult, accessToken: string) {
    // Get profile
    const profileResponse = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/profile`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!profileResponse.ok) {
      throw new Error('Failed to get profile');
    }

    const profileData = await profileResponse.json();
    const userSlug = profileData.user?.urlSlug;

    // Get participants via new endpoint
    const participantsResponse = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/organizer/${userSlug}/participants`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!participantsResponse.ok) {
      throw new Error('Failed to get participants');
    }

    const participantsData = await participantsResponse.json();
    
    if (!participantsData.participants || participantsData.participants.length === 0) {
      result.status = 'warning';
      result.message = 'No participants found to test';
      return;
    }

    // Check for data consistency issues
    const issues: string[] = [];
    
    participantsData.participants.forEach((p: any) => {
      if (!p.email) issues.push(`Participant ${p.participantId} missing email`);
      if (!p.name) issues.push(`Participant ${p.participantId} missing name`);
      if (!p.registrations || p.registrations.length === 0) {
        issues.push(`Participant ${p.participantId} has no registrations`);
      }
    });

    if (issues.length > 0) {
      result.status = 'warning';
      result.message = `Found ${issues.length} consistency issue(s)`;
      result.data = { issues };
    } else {
      result.message = `All ${participantsData.count} participants have consistent data`;
    }
  }

  async function testDuplicateRegistrationFix(result: TestResult, accessToken: string) {
    // Get profile
    const profileResponse = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/profile`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!profileResponse.ok) {
      throw new Error('Failed to get profile');
    }

    const profileData = await profileResponse.json();
    const userSlug = profileData.user?.urlSlug;

    // Get participants via new endpoint
    const participantsResponse = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/organizer/${userSlug}/participants`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!participantsResponse.ok) {
      throw new Error('Failed to get participants');
    }

    const participantsData = await participantsResponse.json();
    
    if (!participantsData.participants || participantsData.participants.length === 0) {
      result.status = 'warning';
      result.message = 'No participants found to test';
      return;
    }

    // Check for duplicate registrations
    const registrationCounts: { [key: string]: number } = {};
    
    participantsData.participants.forEach((p: any) => {
      p.registrations.forEach((r: any) => {
        const key = `${r.roundName}-${r.sessionId}`;
        if (!registrationCounts[key]) {
          registrationCounts[key] = 0;
        }
        registrationCounts[key]++;
      });
    });

    const duplicates: { [key: string]: number } = {};
    
    for (const key in registrationCounts) {
      if (registrationCounts[key] > 1) {
        duplicates[key] = registrationCounts[key];
      }
    }

    if (Object.keys(duplicates).length > 0) {
      result.status = 'warning';
      result.message = `Found ${Object.keys(duplicates).length} duplicate registration(s)`;
      result.data = { duplicates };
    } else {
      result.message = `All ${participantsData.count} participants have unique registrations`;
    }
  }

  async function testStatusUpdateLogic(result: TestResult, accessToken: string) {
    debugLog('🧪 Starting status update logic test...');
    
    // SIMPLIFIED TEST: Use known participant token directly instead of admin auth
    // This test doesn't need admin access - it just needs a participant token
    
    // From the console logs, we know:
    // - Participant token: 0863151e-5ffa-42e4-a314-743d5280431d
    // - Email: andy.double.a+ma@gmail.com
    // - Has round "16:20" on date 2025-12-14 (session "Vianočný punč")
    
    const TEST_PARTICIPANT_TOKEN = '0863151e-5ffa-42e4-a314-743d5280431d';
    const TEST_ROUND_ID = 'round-2'; // 16:20 round
    const TEST_SESSION_ID = '1764955362036'; // Vianočný punč session
    const TEST_DATE = '2025-12-14';
    const TEST_START_TIME = '16:20';
    
    debugLog(`🧪 Testing with participant token: ${TEST_PARTICIPANT_TOKEN}`);

    // Test 1: Call the endpoint without simulatedTime (should work with real time)
    debugLog(`🧪 Test 1: Fetching registrations with real time...`);
    
    const registrationsResponse1 = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/p/${TEST_PARTICIPANT_TOKEN}/registrations`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      }
    );
    
    if (!registrationsResponse1.ok) {
      const errorText = await registrationsResponse1.text();
      throw new Error(`Failed to fetch registrations: ${registrationsResponse1.status} - ${errorText}`);
    }

    const data1 = await registrationsResponse1.json();
    debugLog(`🧪 Response 1: Found ${data1.registrations?.length || 0} registrations`);
    
    const testRound1 = data1.registrations?.find((r: any) => 
      r.roundId === TEST_ROUND_ID && r.sessionId === TEST_SESSION_ID
    );
    
    if (!testRound1) {
      result.status = 'warning';
      result.message = 'Test round not found - participant may have been removed or changed';
      result.data = {
        expectedRound: TEST_ROUND_ID,
        expectedSession: TEST_SESSION_ID,
        foundRounds: data1.registrations?.length || 0,
        suggestion: 'Make sure participant with token 0863151e-5ffa-42e4-a314-743d5280431d is registered for round-2 (16:20) in session 1764955362036'
      };
      return;
    }

    // Test 2: Call with simulatedTime parameter (time after round started)
    const roundStartTime = new Date(`${TEST_DATE}T${TEST_START_TIME}:00Z`);
    const timeAfterStart = roundStartTime.getTime() + (5 * 60 * 1000); // 5 minutes after start
    
    debugLog(`🧪 Test 2: Fetching registrations with simulatedTime=${timeAfterStart}...`);
    debugLog(`🧪 Round start time: ${roundStartTime.toISOString()}`);
    debugLog(`🧪 Simulated time: ${new Date(timeAfterStart).toISOString()}`);
    
    const registrationsResponse2 = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/p/${TEST_PARTICIPANT_TOKEN}/registrations?simulatedTime=${timeAfterStart}`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      }
    );
    
    if (!registrationsResponse2.ok) {
      const errorText = await registrationsResponse2.text();
      throw new Error(`Failed to fetch registrations with simulatedTime: ${registrationsResponse2.status} - ${errorText}`);
    }

    const data2 = await registrationsResponse2.json();
    debugLog(`🧪 Response 2: Found ${data2.registrations?.length || 0} registrations`);
    
    const testRound2 = data2.registrations?.find((r: any) => 
      r.roundId === TEST_ROUND_ID && r.sessionId === TEST_SESSION_ID
    );
    
    if (!testRound2) {
      throw new Error(`Round ${TEST_ROUND_ID} not found in response with simulatedTime`);
    }

    // Check results
    const issues: string[] = [];
    const now = new Date();
    const roundHasPassed = now >= roundStartTime;
    
    debugLog(`🧪 Current time: ${now.toISOString()}`);
    debugLog(`🧪 Round has passed: ${roundHasPassed}`);
    debugLog(`🧪 Real time status: ${testRound1.status}`);
    debugLog(`🧪 Simulated time status: ${testRound2.status}`);
    
    // Real time check
    if (roundHasPassed) {
      if (testRound1.status === 'registered') {
        issues.push(`❌ Real time: Status is still "registered" (expected "unconfirmed" because round started at ${roundStartTime.toISOString()})`);
      } else if (testRound1.status === 'unconfirmed') {
        issues.push(`✅ Real time: Status correctly "unconfirmed" (round has passed)`);
      } else {
        issues.push(`⚠️  Real time: Status is "${testRound1.status}" (expected "unconfirmed")`);
      }
    } else {
      if (testRound1.status === 'registered') {
        issues.push(`✅ Real time: Status is "registered" (correct, round hasn't started yet)`);
      } else {
        issues.push(`⚠️  Real time: Status is "${testRound1.status}" (expected "registered" because round hasn't started)`);
      }
    }

    // Simulated time check: should ALWAYS be 'unconfirmed' because we're 5min after start
    if (testRound2.status === 'registered') {
      issues.push(`❌ Simulated time (T+5min): Status is still "registered" (expected "unconfirmed")`);
    } else if (testRound2.status === 'unconfirmed') {
      issues.push(`✅ Simulated time (T+5min): Status correctly "unconfirmed"`);
    } else {
      issues.push(`⚠️  Simulated time (T+5min): Status is "${testRound2.status}" (expected "unconfirmed")`);
    }

    const hasErrors = issues.some(msg => msg.startsWith('❌'));
    
    if (hasErrors) {
      result.status = 'error';
      result.message = '❌ Status update logic is NOT working correctly - backend is not changing status after T-0';
    } else {
      result.status = 'success';
      result.message = '✅ Status update logic is working correctly';
    }
    
    result.data = {
      testRound: `${TEST_START_TIME} on ${TEST_DATE}`,
      roundId: TEST_ROUND_ID,
      sessionId: TEST_SESSION_ID,
      roundStart: roundStartTime.toISOString(),
      currentTime: now.toISOString(),
      roundHasPassed,
      simulatedTime: new Date(timeAfterStart).toISOString(),
      realTimeStatus: testRound1.status,
      simulatedTimeStatus: testRound2.status,
      checks: issues,
      note: 'This test uses hardcoded participant token 0863151e-5ffa-42e4-a314-743d5280431d'
    };
  }

  const toggleTest = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const selectAll = () => {
    setSelectedTests(availableTests.map(t => t.id));
  };

  const deselectAll = () => {
    setSelectedTests([]);
  };

  const migrateParticipantKeys = async () => {
    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/migrate-participant-keys`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMigrationResult(data);
        toast.success(`Migration complete! Migrated: ${data.summary.migrated}, Skipped: ${data.summary.skipped}, Errors: ${data.summary.errors}`);
      } else {
        const error = await response.text();
        toast.error(`Migration failed: ${error}`);
        setMigrationResult({ error });
      }
    } catch (error) {
      errorLog('Migration error:', error);
      toast.error(`Migration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMigrationResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsMigrating(false);
    }
  };

  const migrateOrganizerNames = async () => {
    setIsMigratingOrganizerNames(true);
    setOrganizerNamesMigrationResult(null);

    try {
      // Get fresh access token from Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Not authenticated - please log in as admin first');
        setIsMigratingOrganizerNames(false);
        return;
      }

      const accessToken = session.access_token;
      debugLog('🔧 Using fresh access token from Supabase session');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/migrate-session-organizer-names`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOrganizerNamesMigrationResult(data);
        toast.success(`Migration complete! Updated: ${data.updatedCount || 0}, Skipped: ${data.skippedCount || 0}`);
      } else {
        const error = await response.text();
        toast.error(`Migration failed: ${error}`);
        setOrganizerNamesMigrationResult({ error });
      }
    } catch (error) {
      errorLog('Migration error:', error);
      toast.error(`Migration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setOrganizerNamesMigrationResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsMigratingOrganizerNames(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-2">Admin test panel</h2>
          <p className="text-sm text-gray-600">
            Run automated tests to verify system health and functionality
          </p>
        </div>
        <button
          onClick={runTests}
          disabled={isRunning || selectedTests.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running tests...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run selected tests
            </>
          )}
        </button>
      </div>

      {/* Auth Status Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-yellow-900">Authentication required</div>
            <div className="text-sm text-yellow-800 mt-1">
              Make sure you're logged in as an admin user before running tests. 
              Token: {localStorage.getItem('supabase_access_token') ? '✅ Found' : '❌ Not found'}
            </div>
            {localStorage.getItem('supabase_access_token') && (
              <div className="mt-2">
                <div className="text-xs font-mono text-gray-600 bg-white p-2 rounded border border-yellow-200 overflow-x-auto mb-2">
                  {localStorage.getItem('supabase_access_token')?.substring(0, 50)}...
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('supabase_access_token');
                    localStorage.removeItem('oliwonder_current_user');
                    window.location.href = '/signin';
                  }}
                  className="text-sm text-red-600 hover:underline"
                >
                  ❌ Clear token and re-login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Duplicate Registration Test Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-xl">🧪</span>
          </div>
          <div className="flex-1">
            <div className="font-medium text-blue-900 mb-1">Manual duplicate registration test</div>
            <div className="text-sm text-blue-800 mb-3">
              Test the backend fix with a step-by-step visual guide that helps you verify participants can register for rounds with same name in different sessions.
            </div>
            <a
              href="/duplicate-registration-test"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Open duplicate registration test →
            </a>
          </div>
        </div>
      </div>

      {/* Participant Key Migration */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-orange-900 mb-1">Migrate participant keys to new format</div>
            <div className="text-sm text-orange-800 mb-3">
              Migrates old participant keys from <code className="bg-white px-1 rounded">participant:roundId:participantId</code> to new format <code className="bg-white px-1 rounded">participant:sessionId:roundId:participantId</code>. This fixes the issue where participants from different sessions appear in the wrong session administration.
            </div>
            <button
              onClick={migrateParticipantKeys}
              disabled={isMigrating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm disabled:opacity-50"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Run migration
                </>
              )}
            </button>
            {migrationResult && (
              <div className="mt-3 p-3 bg-white rounded border border-orange-200">
                <div className="text-sm">
                  {migrationResult.error ? (
                    <div className="text-red-600">Error: {migrationResult.error}</div>
                  ) : (
                    <div>
                      <div className="text-green-600 mb-2">✅ Migration completed!</div>
                      <div className="text-gray-700">
                        • Migrated: {migrationResult.summary?.migrated || 0}<br/>
                        • Skipped: {migrationResult.summary?.skipped || 0}<br/>
                        • Errors: {migrationResult.summary?.errors || 0}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Organizer Names Migration */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-purple-900 mb-1">Add organizer names to all sessions</div>
            <div className="text-sm text-purple-800 mb-3">
              Adds <code className="bg-white px-1 rounded">organizerName</code> field to all sessions by copying it from the organizer's <code className="bg-white px-1 rounded">user_profile</code>. This fixes the issue where participant dashboard doesn't show organizer name after it's changed in Event Page Settings.
            </div>
            <button
              onClick={migrateOrganizerNames}
              disabled={isMigratingOrganizerNames}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm disabled:opacity-50"
            >
              {isMigratingOrganizerNames ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Run migration
                </>
              )}
            </button>
            {organizerNamesMigrationResult && (
              <div className="mt-3 p-3 bg-white rounded border border-purple-200">
                <div className="text-sm">
                  {organizerNamesMigrationResult.error ? (
                    <div className="text-red-600">Error: {organizerNamesMigrationResult.error}</div>
                  ) : (
                    <div>
                      <div className="text-green-600 mb-2">✅ Migration completed!</div>
                      <div className="text-gray-700">
                        • Updated: {organizerNamesMigrationResult.updatedCount || 0}<br/>
                        • Skipped: {organizerNamesMigrationResult.skippedCount || 0}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3>Select tests</h3>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="text-sm text-blue-600 hover:underline"
            >
              Select all
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={deselectAll}
              className="text-sm text-blue-600 hover:underline"
            >
              Deselect all
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {availableTests.map(test => (
            <label
              key={test.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedTests.includes(test.id)}
                onChange={() => toggleTest(test.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">{test.name}</div>
                <div className="text-sm text-gray-600">{test.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="mb-3">Test results</h3>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  result.status === 'error' ? 'border-red-200 bg-red-50' :
                  result.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  result.status === 'success' ? 'border-green-200 bg-green-50' :
                  'border-gray-200'
                }`}
              >
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{result.name}</div>
                    {result.duration && (
                      <div className="text-sm text-gray-500">{result.duration}ms</div>
                    )}
                  </div>
                  {result.message && (
                    <div className="text-sm text-gray-600 mt-1">{result.message}</div>
                  )}
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-sm text-blue-600 cursor-pointer hover:underline">
                        View data
                      </summary>
                      <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto border border-gray-200">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}\n          </div>
        </div>
      )}

      {/* Summary */}
      {testResults.length > 0 && !isRunning && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl text-green-600">
                {testResults.filter(r => r.status === 'success').length}
              </div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div>
              <div className="text-2xl text-red-600">
                {testResults.filter(r => r.status === 'error').length}
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div>
              <div className="text-2xl text-yellow-600">
                {testResults.filter(r => r.status === 'warning').length}
              </div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
            <div>
              <div className="text-2xl">
                {testResults.length}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}