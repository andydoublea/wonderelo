import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ArrowLeft, UserCheck, Clock, CheckCircle, Users, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';

interface AdminParticipantFlowProps {
  onBack: () => void;
}

export function AdminParticipantFlow({ onBack }: AdminParticipantFlowProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Participant flow</h1>
              <p className="text-sm text-muted-foreground">Complete journey from registration to meeting confirmation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="space-y-8">
          
          {/* Introduction */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                This document describes the complete participant journey through a networking round, including all status changes, 
                database operations, and UI feedback at each step.
              </p>
            </CardContent>
          </Card>

          {/* Step 1: Registration */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <UserCheck className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h2 className="mb-3">1. Registration</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Anytime before the round starts
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">What participant does:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Clicks "Register" on event page for specific round</li>
                        <li>Selects team and/or topic if required</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">System operations:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Creates record with status <Badge variant="outline" className="ml-1">registered</Badge></li>
                        <li>Saves to <code className="text-xs bg-muted px-1 py-0.5 rounded">participant_registrations:&#123;participantId&#125;</code></li>
                        <li>Saves to <code className="text-xs bg-muted px-1 py-0.5 rounded">participant:&#123;sessionId&#125;:&#123;roundId&#125;:&#123;participantId&#125;</code></li>
                        <li>Sends confirmation email to participant</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">What participant sees:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Round appears on dashboard with <Badge variant="outline" className="ml-1">Registered</Badge> badge</li>
                        <li>Shows start time and duration</li>
                        <li>Can unregister using "×" button</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Confirmation Window */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <h2 className="mb-3">2. Confirmation window</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    T-5 minutes before round start
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Automatic system changes:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>5 minutes before start, round enters confirmation window</li>
                        <li>Round status changes to <Badge variant="outline" className="ml-1">waiting-for-attendance-confirmation</Badge></li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">What participant sees:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Green button <Badge className="ml-1 bg-green-500">Confirm attendance</Badge> appears</li>
                        <li>Countdown shows time until start (e.g., "Starting in 4m 32s")</li>
                        <li>Badge still shows <Badge variant="outline" className="ml-1">Registered</Badge></li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Backend operations:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Periodic status checks via dashboard refetch (every 60s)</li>
                        <li>RoundItem countdown auto-detects T-5 moment</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Confirm Attendance */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <h2 className="mb-3">3. Confirm attendance</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Participant clicks "Confirm attendance" button
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Backend endpoint: <code className="text-xs bg-muted px-1 py-0.5 rounded">/p/&#123;token&#125;/confirm/&#123;roundId&#125;</code></h3>
                      <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside ml-2">
                        <li>Loads current participant registration from database</li>
                        <li>Changes status to <Badge variant="outline" className="ml-1">confirmed</Badge></li>
                        <li>Updates registration in <code className="text-xs bg-muted px-1 py-0.5 rounded">registrations</code> table (sets status + confirmedAt)</li>
                        <li>Validates confirmation window (rejects if round already started)</li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Frontend flow:</h3>
                      <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside ml-2">
                        <li><strong>Optimistic update:</strong> UI immediately updates (button disappears, badge → Confirmed)</li>
                        <li><strong>Wait 1 second:</strong> Allows database to sync</li>
                        <li><strong>Refetch:</strong> Loads fresh data from backend</li>
                        <li><strong>Verification:</strong> Checks if status is confirmed
                          <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                            <li>If not confirmed → waits another second and retries refetch</li>
                          </ul>
                        </li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">What participant sees:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Button immediately disappears (optimistic update)</li>
                        <li>Badge changes to <Badge className="ml-1 bg-green-500">Confirmed</Badge></li>
                        <li>Toast: "Attendance confirmed! You will be matched at the start time."</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 4: No Confirmation */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-500/10 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-gray-500" />
                </div>
                <div className="flex-1">
                  <h2 className="mb-3">4. No confirmation (T-0)</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    If participant doesn't confirm by exact start time
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Automatic system changes:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Status automatically changes to <Badge variant="secondary" className="ml-1">unconfirmed</Badge></li>
                        <li><strong className="text-destructive">Not included in matching!</strong></li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">When this happens:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Backend checks during every fetchData (dashboard endpoint)</li>
                        <li>Check: <code className="text-xs bg-muted px-1 py-0.5 rounded">if (now &gt;= roundStartTime && status === 'registered') → status = 'unconfirmed'</code></li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">What participant sees:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Badge changes to <Badge variant="secondary" className="ml-1">Unconfirmed</Badge></li>
                        <li>No match will be assigned</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 5: Matching */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h2 className="mb-3">5. Matching (T-0)</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Exactly at round start time
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Trigger mechanism:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Automatically triggered at T-0 moment</li>
                        <li>RoundItem detects T-0 and calls <code className="text-xs bg-muted px-1 py-0.5 rounded">/rounds/&#123;roundId&#125;/auto-match</code></li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Backend endpoint flow:</h3>
                      <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside ml-2">
                        <li><strong>Check if already run:</strong> Checks <code className="text-xs bg-muted px-1 py-0.5 rounded">round.matchingCompletedAt</code>
                          <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                            <li>If exists → returns "already completed"</li>
                            <li>Ensures matching runs only once, even if multiple participants trigger it</li>
                          </ul>
                        </li>
                        <li><strong>Load all participants:</strong> Gets <code className="text-xs bg-muted px-1 py-0.5 rounded">participant:&#123;sessionId&#125;:&#123;roundId&#125;:*</code></li>
                        <li><strong>Mark unconfirmed:</strong> All with status registered or waiting-for-attendance-confirmation → changes to <Badge variant="secondary" className="ml-1">unconfirmed</Badge>
                          <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                            <li>Reason: "Did not confirm attendance before round start (T-0)"</li>
                          </ul>
                        </li>
                        <li><strong>Filter confirmed only:</strong> Only participants with status <Badge variant="outline" className="ml-1">confirmed</Badge> go to matching</li>
                        <li><strong>Run matching algorithm:</strong> 
                          <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                            <li><strong>Greedy algorithm</strong> - creates groups of groupSize (2, 3, 4...)</li>
                            <li><strong>Scoring system:</strong></li>
                            <li className="ml-6"><strong>Meeting memory</strong> (30 points) - participants who haven't met get higher score</li>
                            <li className="ml-6"><strong>Teams matching</strong> (20 points) - tries to match different teams</li>
                            <li className="ml-6"><strong>Topics matching</strong> (10 points) - tries to match similar topics</li>
                            <li>Creates groups (negative score = how many times they met + bonuses)</li>
                            <li>Participants who never met have higher score and match first</li>
                          </ul>
                        </li>
                        <li><strong>Assign meeting points:</strong> Randomly assigns meeting point to each group</li>
                        <li><strong>Update statuses to waiting-for-match:</strong>
                          <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                            <li>All matched participants get status <Badge variant="outline" className="ml-1">waiting-for-match</Badge></li>
                            <li>Saves to both database keys with matchData (partner, meeting point)</li>
                          </ul>
                        </li>
                        <li><strong>Mark matching complete:</strong>
                          <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                            <li><code className="text-xs bg-muted px-1 py-0.5 rounded">round.matchingCompletedAt = now()</code></li>
                            <li><code className="text-xs bg-muted px-1 py-0.5 rounded">round.roundStatus = 'matching-phase'</code></li>
                          </ul>
                        </li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">What participant sees (after matching):</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Initially: Badge shows <Badge variant="outline" className="ml-1">Waiting for match</Badge></li>
                        <li>After auto-refetch (within 60s or sooner if tab visible):
                          <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                            <li>Status → <Badge className="ml-1 bg-green-500">Matched</Badge></li>
                            <li>Shows partner info (name, team, topic)</li>
                            <li>Shows meeting point</li>
                            <li>Shows button <Badge className="ml-1 bg-orange-500">I'm on my way</Badge></li>
                          </ul>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 6: Walking */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <UserCheck className="h-6 w-6 text-orange-500" />
                </div>
                <div className="flex-1">
                  <h2 className="mb-3">6. Walking to meeting point</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">What participant does:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Clicks "I'm on my way"</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">System changes:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Status → <Badge variant="outline" className="ml-1">walking-to-meeting-point</Badge></li>
                        <li>Badge → <Badge className="ml-1 bg-orange-500">Walking to meeting point</Badge></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 7: Check-in */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h2 className="mb-3">7. Check-in at meeting point</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">What participant does:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Arrives at meeting point</li>
                        <li>Clicks button with check-in code (e.g., "🔢 1234")</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">System changes:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Status → <Badge variant="outline" className="ml-1">waiting-for-meet-confirmation</Badge></li>
                        <li>Badge → <Badge variant="outline" className="ml-1">Waiting for meet confirmation</Badge></li>
                        <li>Shows: "Waiting for your partner to check in..."</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">When partner also checks in:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Both participants see button <Badge className="ml-1 bg-green-500">Confirm meeting</Badge></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 8: Meeting Confirmed */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <h2 className="mb-3">8. Confirm meeting</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">What participant does:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Clicks "Confirm meeting"</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">System changes:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Status → <Badge className="ml-1 bg-green-500">met</Badge></li>
                        <li>Toast: "Meeting confirmed! Enjoy your conversation."</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 9: Completion */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-500/10 rounded-lg">
                  <Clock className="h-6 w-6 text-gray-500" />
                </div>
                <div className="flex-1">
                  <h2 className="mb-3">9. Round completion</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Automatic after round duration passes
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">Automatic system changes:</h3>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>When <code className="text-xs bg-muted px-1 py-0.5 rounded">startTime + duration</code> minutes passes</li>
                        <li>All participants (except unconfirmed) → status <Badge variant="secondary" className="ml-1">completed</Badge></li>
                        <li>Badge → <Badge variant="secondary" className="ml-1">Completed</Badge></li>
                        <li>Round moves to "Completed rounds" section</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Periodic Updates */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-4">Periodic updates</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Frontend:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Refetch every 60 seconds (only when tab is visible)</li>
                    <li>Refetch on visibility change (when user returns to tab)</li>
                    <li>Countdown updates every second (only if simulatedTime is active)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Backend:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Real-time status updates on every dashboard fetch</li>
                    <li>Checks:
                      <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                        <li><code className="text-xs bg-muted px-1 py-0.5 rounded">now &gt;= roundStart && status === 'registered' → unconfirmed</code></li>
                        <li><code className="text-xs bg-muted px-1 py-0.5 rounded">now &gt;= roundEnd → completed</code></li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Summary Table */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-4">Status summary</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Status</th>
                      <th className="text-left py-2 pr-4">When</th>
                      <th className="text-left py-2">What participant sees</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-2 pr-4"><Badge variant="outline">registered</Badge></td>
                      <td className="py-2 pr-4 text-muted-foreground">After registration, before T-5</td>
                      <td className="py-2 text-muted-foreground">Blue "Registered" badge, "×" unregister button</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4"><Badge variant="outline">waiting-for-attendance-confirmation</Badge></td>
                      <td className="py-2 pr-4 text-muted-foreground">T-5 to T-0</td>
                      <td className="py-2 text-muted-foreground">Blue "Registered" badge, green "Confirm attendance" button</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4"><Badge className="bg-green-500">confirmed</Badge></td>
                      <td className="py-2 pr-4 text-muted-foreground">After clicking "Confirm"</td>
                      <td className="py-2 text-muted-foreground">Green "Confirmed" badge</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4"><Badge variant="secondary">unconfirmed</Badge></td>
                      <td className="py-2 pr-4 text-muted-foreground">If didn't confirm by T-0</td>
                      <td className="py-2 text-muted-foreground">Gray "Unconfirmed" (not matched)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4"><Badge variant="outline">waiting-for-match</Badge></td>
                      <td className="py-2 pr-4 text-muted-foreground">After matching starts (T-0)</td>
                      <td className="py-2 text-muted-foreground">Blue "Waiting for match"</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4"><Badge className="bg-green-500">matched</Badge></td>
                      <td className="py-2 pr-4 text-muted-foreground">After matching completes</td>
                      <td className="py-2 text-muted-foreground">Green "Matched" + partner info + meeting point</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4"><Badge className="bg-orange-500">walking-to-meeting-point</Badge></td>
                      <td className="py-2 pr-4 text-muted-foreground">After "I'm on my way"</td>
                      <td className="py-2 text-muted-foreground">Orange "Walking to meeting point"</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4"><Badge variant="outline">waiting-for-meet-confirmation</Badge></td>
                      <td className="py-2 pr-4 text-muted-foreground">After check-in</td>
                      <td className="py-2 text-muted-foreground">"Waiting for meet confirmation"</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4"><Badge className="bg-green-500">met</Badge></td>
                      <td className="py-2 pr-4 text-muted-foreground">After "Confirm meeting"</td>
                      <td className="py-2 text-muted-foreground">Green "Met"</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4"><Badge variant="secondary">completed</Badge></td>
                      <td className="py-2 pr-4 text-muted-foreground">After round duration passes</td>
                      <td className="py-2 text-muted-foreground">Gray "Completed"</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
