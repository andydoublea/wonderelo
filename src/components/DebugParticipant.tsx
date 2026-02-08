import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Shield, ArrowLeft, Bug } from 'lucide-react';
import { useNavigate } from 'react-router';
import { debugLog, errorLog } from '../utils/debug';

export function DebugParticipant() {
  const navigate = useNavigate();
  const [participantId, setParticipantId] = useState('');
  const [email, setEmail] = useState('');
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lookingUpEmail, setLookingUpEmail] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migratingAll, setMigratingAll] = useState(false);
  const [migrateAllResult, setMigrateAllResult] = useState<any>(null);
  const [listingKeys, setListingKeys] = useState(false);
  const [allKeysData, setAllKeysData] = useState<any>(null);

  const lookupByEmail = async () => {
    if (!email) return;
    
    setLookingUpEmail(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/participant-by-email/${encodeURIComponent(email)}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          }
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.participantId) {
        setParticipantId(data.participantId);
        debugLog('Found participant:', data);
        // Automatically check participant data
        const pidToCheck = data.participantId;
        setTimeout(() => {
          // Use the participantId directly to avoid timing issues
          fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/participant/${pidToCheck}`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
              }
            }
          ).then(res => res.json()).then(debugData => {
            setDebugData(debugData);
            debugLog('Debug data:', debugData);
          });
        }, 100);
      } else {
        alert(data.error || 'Participant not found');
      }
    } catch (error) {
      errorLog('Error:', error);
      alert('Lookup failed');
    } finally {
      setLookingUpEmail(false);
    }
  };

  const checkParticipant = async () => {
    if (!participantId) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/participant/${participantId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          }
        }
      );
      
      const data = await response.json();
      setDebugData(data);
      debugLog('Debug data:', data);
    } catch (error) {
      errorLog('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const migrateData = async () => {
    if (!participantId) return;
    
    setMigrating(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/migrate/${participantId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      const data = await response.json();
      debugLog('Migration result:', data);
      alert(data.message || 'Migration complete');
      
      // Refresh debug data
      checkParticipant();
    } catch (error) {
      errorLog('Error:', error);
      alert('Migration failed');
    } finally {
      setMigrating(false);
    }
  };

  const migrateAllData = async () => {
    setMigratingAll(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/migrate-all`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      const data = await response.json();
      debugLog('Migration result:', data);
      setMigrateAllResult(data);
      alert(data.message || 'Migration complete');
    } catch (error) {
      errorLog('Error:', error);
      alert('Migration failed');
    } finally {
      setMigratingAll(false);
    }
  };

  const listAllKeys = async () => {
    setListingKeys(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/debug/list-all-keys`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          }
        }
      );
      
      const data = await response.json();
      debugLog('All keys:', data);
      setAllKeysData(data);
    } catch (error) {
      errorLog('Error:', error);
      alert('Failed to list keys');
    } finally {
      setListingKeys(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Bug className="h-6 w-6 text-primary" />
              <h1 className="cursor-pointer hover:text-primary/80 transition-colors" onClick={() => navigate('/admin')}>
                Debug tools
              </h1>
            </div>
            <p className="text-muted-foreground">
              Database diagnostics and migration tools
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to admin
          </Button>
        </div>

        <div className="max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Participant data inspector</CardTitle>
              <CardDescription>
                Check and migrate participant registration data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter participant ID"
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                />
                <Button onClick={checkParticipant} disabled={loading}>
                  {loading ? 'Checking...' : 'Check'}
                </Button>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Enter participant email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button onClick={lookupByEmail} disabled={lookingUpEmail}>
                  {lookingUpEmail ? 'Looking up...' : 'Lookup'}
                </Button>
              </div>

              {debugData && (
                <div className="space-y-4">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Participant ID: {debugData.participantId}</h3>
                    
                    <div className="mt-4">
                      <h4 className="font-semibold">Old Key:</h4>
                      <code className="text-sm">{debugData.oldKey}</code>
                      <p className="mt-1">
                        {debugData.oldData 
                          ? `✅ ${debugData.oldData.length} registrations found`
                          : '❌ No data'}
                      </p>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-semibold">New Key:</h4>
                      <code className="text-sm">{debugData.newKey}</code>
                      <p className="mt-1">
                        {debugData.newData 
                          ? `✅ ${debugData.newData.length} registrations found`
                          : '❌ No data'}
                      </p>
                    </div>

                    {debugData.oldData && debugData.oldData.length > 0 && (
                      <div className="mt-4">
                        <Button 
                          onClick={migrateData} 
                          disabled={migrating}
                          variant="default"
                        >
                          {migrating ? 'Migrating...' : 'Migrate Old → New'}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Raw Data:</h4>
                    <pre className="text-xs overflow-auto max-h-96">
                      {JSON.stringify(debugData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <Button 
                  onClick={migrateAllData} 
                  disabled={migratingAll}
                  variant="default"
                >
                  {migratingAll ? 'Migrating All...' : 'Migrate All Old → New'}
                </Button>
              </div>

              {migrateAllResult && (
                <div className="space-y-4">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Migration Result:</h4>
                    
                    {migrateAllResult.success && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-green-800">
                          ✅ {migrateAllResult.message}
                        </p>
                        <div className="mt-2 text-sm text-green-700">
                          <div>Total found: {migrateAllResult.totalFound}</div>
                          <div>Migrated: {migrateAllResult.migratedCount}</div>
                          <div>Skipped: {migrateAllResult.skippedCount}</div>
                        </div>
                      </div>
                    )}
                    
                    {migrateAllResult.results && migrateAllResult.results.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Details:</h5>
                        {migrateAllResult.results.map((result: any, idx: number) => (
                          <div 
                            key={idx} 
                            className={`p-2 rounded text-sm ${
                              result.status === 'migrated' 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-yellow-50 border border-yellow-200'
                            }`}
                          >
                            <div className="font-medium">
                              {result.status === 'migrated' ? '✅' : '⏭️'} Participant: {result.participantId}
                            </div>
                            {result.status === 'migrated' && (
                              <div className="text-xs mt-1 text-gray-600">
                                Registrations: {result.registrationsCount}
                              </div>
                            )}
                            {result.status === 'skipped' && (
                              <div className="text-xs mt-1 text-gray-600">
                                Reason: {result.reason}
                                {result.existingCount && ` (existing: ${result.existingCount})`}
                              </div>
                            )}
                            {result.oldKey && (
                              <div className="text-xs mt-1 font-mono text-gray-500">
                                {result.oldKey} → {result.newKey}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        Show raw JSON
                      </summary>
                      <pre className="text-xs overflow-auto max-h-96 mt-2">
                        {JSON.stringify(migrateAllResult, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <Button 
                  onClick={listAllKeys} 
                  disabled={listingKeys}
                  variant="default"
                >
                  {listingKeys ? 'Listing Keys...' : 'List All Keys'}
                </Button>
              </div>

              {allKeysData && (
                <div className="space-y-4">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">All Keys:</h4>
                    <pre className="text-xs overflow-auto max-h-96">
                      {JSON.stringify(allKeysData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}