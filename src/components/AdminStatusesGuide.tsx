import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Clock, Users, CheckCircle, XCircle, UserPlus, UserX, Handshake, Minus, AlertCircle, Settings, MapPin, Search, MessageCircle } from 'lucide-react';

export function AdminStatusesGuide() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-gray-900 mb-2">Statuses guide</h1>
          <p className="text-gray-600">
            Complete reference for all statuses in the Wonderelo system.
            Session statuses and participant statuses are stored in the database.
            Round statuses are computed dynamically based on time.
          </p>
        </div>

        {/* Session Statuses */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-gray-900">Session statuses (4, DB-stored)</h2>
          </div>

          <div className="space-y-4">
            <StatusItem
              badge={<Badge variant="secondary">Draft</Badge>}
              title="Draft"
              description="Session is being created and is not visible to the public"
              details={[
                "Not visible on event page",
                "Can be edited, duplicated, or deleted",
                "Can be scheduled or published"
              ]}
            />

            <StatusItem
              badge={<Badge variant="outline" className="border-blue-500 text-blue-700">Scheduled</Badge>}
              title="Scheduled"
              description="Session is planned for future publication"
              details={[
                "Not visible on event page yet",
                "Will automatically change to 'published' when registrationStart time is reached",
                "Can be rescheduled, published immediately, duplicated, or deleted"
              ]}
            />

            <StatusItem
              badge={<Badge className="bg-green-600">Published</Badge>}
              title="Published"
              description="Session is live on event page and accepting registrations"
              details={[
                "Visible on event page",
                "Participants can register for rounds",
                "Will automatically change to 'completed' when all rounds end"
              ]}
            />

            <StatusItem
              badge={<Badge variant="secondary">Completed</Badge>}
              title="Completed"
              description="All rounds have ended"
              details={[
                "Auto-set when all rounds pass their end time",
                "Can view results and statistics",
                "Can be duplicated or deleted"
              ]}
            />
          </div>
        </Card>

        {/* Round Statuses */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-orange-600" />
            <h2 className="text-gray-900">Round statuses (8, computed — NOT stored in DB)</h2>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-orange-900 text-sm">
              Round status is calculated dynamically by <code>getRoundStatus()</code> based on session status,
              current time, and system parameters. It is never written to the database.
            </p>
          </div>

          <div className="space-y-4">
            <StatusItem
              badge={<Badge variant="secondary">Draft</Badge>}
              title="Draft"
              description="Parent session is not yet published, or round is missing date/time"
              details={[
                "Round exists but is not accessible to public",
                "Changes to 'scheduled' when session is published or scheduled"
              ]}
            />

            <StatusItem
              badge={<Badge variant="outline" className="border-blue-500 text-blue-700">Scheduled</Badge>}
              title="Scheduled"
              description="Session is published but round registration hasn't opened yet"
              details={[
                "Session is published or scheduled",
                "Changes to 'registration-open' when appropriate time comes"
              ]}
            />

            <StatusItem
              badge={<Badge className="bg-green-600">Registration open</Badge>}
              title="Registration open"
              description="Participants can register for this round"
              details={[
                "Time: from session publication until T-safetyWindowMinutes",
                "Participants can join during this window on event page",
                "Changes to 'confirmation-window' at T-safetyWindowMinutes"
              ]}
            />

            <StatusItem
              badge={<Badge className="bg-yellow-600">Confirmation window</Badge>}
              title="Confirmation window"
              description="No new registrations; participants must confirm attendance"
              details={[
                "Time: T-safetyWindowMinutes to T-0",
                "New registrations are blocked",
                "Participants must click 'Confirm attendance' to be included in matching",
                "Non-confirmed participants become 'unconfirmed' at T-0"
              ]}
            />

            <StatusItem
              badge={
                <Badge className="bg-blue-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Walking
                </Badge>
              }
              title="Walking"
              description="Matching done, participants heading to meeting points"
              details={[
                "Time: T-0 to T-0 + walkingTimeMinutes",
                "Matching algorithm runs at T-0, creating groups instantly",
                "Participants see their match and assigned meeting point",
                "Participants walk to their meeting point"
              ]}
            />

            <StatusItem
              badge={
                <Badge className="bg-cyan-500 flex items-center gap-1">
                  <Search className="w-3 h-3" />
                  Finding
                </Badge>
              }
              title="Finding"
              description="Participants at meeting point, identifying each other"
              details={[
                "Time: T-0 + walkingTimeMinutes to T-0 + walkingTime + findingTimeMinutes",
                "Participants use identification images and numbers to find their match",
                "Check-in (\"I am here\") can happen during this phase"
              ]}
            />

            <StatusItem
              badge={
                <Badge className="bg-indigo-500 flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  Networking
                </Badge>
              }
              title="Networking"
              description="Participants are having their conversation"
              details={[
                "Time: T-0 + walkingTime + findingTime to T-0 + walkingTime + findingTime + round.duration",
                "Participants are networking for the configured round duration",
                "Meet confirmation and contact sharing happen during this phase"
              ]}
            />

            <StatusItem
              badge={<Badge variant="secondary">Completed</Badge>}
              title="Completed"
              description="Round has finished (all time phases elapsed)"
              details={[
                "Time: after T-0 + walkingTime + findingTime + round.duration",
                "No further actions available",
                "Statistics can be viewed"
              ]}
            />
          </div>
        </Card>

        {/* Participant Statuses */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-indigo-600" />
            <h2 className="text-gray-900">Participant statuses (9, DB-stored)</h2>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
            <p className="text-indigo-900 text-sm">
              Each participant has a status per round registration. All 9 statuses are persisted in the database.
              When a round ends, <code>round_completed_at</code> timestamp is set — the status field preserves
              the last active status (e.g. 'met', 'checked-in', 'missed').
            </p>
          </div>

          <h3 className="text-gray-900 mb-3 mt-4">Forward path (happy flow)</h3>
          <div className="space-y-4 mb-6">
            <StatusItem
              badge={
                <Badge variant="secondary" className="text-muted-foreground/60 flex items-center gap-1">
                  <UserPlus className="w-3 h-3" />
                  Registered
                </Badge>
              }
              title="Registered"
              description="Participant signed up for the round"
              details={[
                "Set by: registration endpoint",
                "Trigger: participant submits registration form",
                "Next: 'confirmed' (user clicks Confirm) or 'unconfirmed' (T-0 passes) or 'cancelled' (user cancels)"
              ]}
            />

            <StatusItem
              badge={
                <Badge className="bg-green-100 text-green-700 border-green-300 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Confirmed
                </Badge>
              }
              title="Confirmed"
              description="Participant confirmed attendance during confirmation window"
              details={[
                "Set by: confirm endpoint",
                "Trigger: user clicks 'Confirm attendance' (during confirmation window, before T-0)",
                "Will be included in matching algorithm at T-0",
                "Next: 'matched' or 'no-match' (after matching) or 'cancelled' (user cancels)"
              ]}
            />

            <StatusItem
              badge={
                <Badge className="bg-purple-100 text-purple-700 border-purple-300 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Matched
                </Badge>
              }
              title="Matched"
              description="Pair/group assigned by matching algorithm"
              details={[
                "Set by: matching algorithm (matching.tsx)",
                "Trigger: matching runs at T-0, assigns participant to a group",
                "Participant sees their match, meeting point, and identification image",
                "Next: 'checked-in' (user clicks 'I am here') or 'missed' (walking deadline expires)"
              ]}
            />

            <StatusItem
              badge={
                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Checked-in
                </Badge>
              }
              title="Checked-in"
              description="Arrived at meeting point"
              details={[
                "Set by: check-in endpoint (route-participants.tsx)",
                "Trigger: user clicks 'I am here' at the meeting point",
                "Next: 'met' (user confirms partner found)"
              ]}
            />

            <StatusItem
              badge={
                <Badge className="bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1">
                  <Handshake className="w-3 h-3" />
                  Met
                </Badge>
              }
              title="Met"
              description="Partners found each other and are networking"
              details={[
                "Set by: confirm-match endpoint (route-participants.tsx)",
                "Trigger: user confirms they found their partner",
                "Final positive status — no further transitions",
                "When round ends, round_completed_at is set but status stays 'met'"
              ]}
            />
          </div>

          <h3 className="text-gray-900 mb-3">Terminal statuses (drop-off / failure)</h3>
          <div className="space-y-4">
            <StatusItem
              badge={
                <Badge variant="outline" className="text-yellow-700 border-yellow-300 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  Unconfirmed
                </Badge>
              }
              title="Unconfirmed"
              description="Didn't confirm attendance before T-0"
              details={[
                "Set by: auto-detection in dashboard + matching algorithm",
                "Trigger: T-0 passes while status is still 'registered'",
                "Terminal status — no transitions out",
                "Not included in matching"
              ]}
            />

            <StatusItem
              badge={
                <Badge variant="outline" className="text-gray-600 border-gray-300 bg-gray-50 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  No match
                </Badge>
              }
              title="No match"
              description="No suitable pair/group found by matching algorithm"
              details={[
                "Set by: matching algorithm (matching.tsx)",
                "Trigger: participant confirmed but was left over (odd count, no compatible match)",
                "Terminal status — no transitions out"
              ]}
            />

            <StatusItem
              badge={
                <Badge variant="destructive" className="flex items-center gap-1">
                  <UserX className="w-3 h-3" />
                  Missed
                </Badge>
              }
              title="Missed"
              description="Matched but didn't show up (walking deadline expired)"
              details={[
                "Set by: auto-detection in dashboard",
                "Trigger: matchedAt + walkingTimeMinutes passed, status still 'matched' (no check-in)",
                "Terminal status — no transitions out"
              ]}
            />

            <StatusItem
              badge={
                <Badge variant="destructive" className="bg-red-50 border-red-200 text-red-600 flex items-center gap-1">
                  <Minus className="w-3 h-3" />
                  Cancelled
                </Badge>
              }
              title="Cancelled"
              description="Participant explicitly cancelled their registration"
              details={[
                "Set by: cancel/unregister endpoint",
                "Trigger: user clicks 'Unregister' (allowed from 'registered' or 'confirmed', before matching)",
                "Terminal status — no transitions out",
                "Can re-register if registration is still open"
              ]}
            />
          </div>
        </Card>

        {/* Lifecycle Flow */}
        <Card className="p-6">
          <h2 className="text-gray-900 mb-6">Lifecycle flows</h2>

          <div className="space-y-6">
            {/* Session Flow */}
            <div>
              <h3 className="text-gray-900 mb-3">Session</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Draft</Badge>
                <span className="text-gray-400">→</span>
                <Badge variant="outline" className="border-blue-500 text-blue-700">Scheduled</Badge>
                <span className="text-gray-400">→</span>
                <Badge className="bg-green-600">Published</Badge>
                <span className="text-gray-400">→</span>
                <Badge variant="secondary">Completed</Badge>
              </div>
              <p className="text-gray-600 text-sm mt-2">
                Or skip 'Scheduled' and go directly from Draft → Published
              </p>
            </div>

            {/* Round Flow */}
            <div>
              <h3 className="text-gray-900 mb-3">Round (computed from time)</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Draft</Badge>
                <span className="text-gray-400">→</span>
                <Badge variant="outline" className="border-blue-500 text-blue-700">Scheduled</Badge>
                <span className="text-gray-400">→</span>
                <Badge className="bg-green-600">Registration open</Badge>
                <span className="text-gray-400 text-xs">(until T-safety)</span>
                <span className="text-gray-400">→</span>
                <Badge className="bg-yellow-600">Confirmation window</Badge>
                <span className="text-gray-400 text-xs">(T-safety to T-0)</span>
                <span className="text-gray-400">→</span>
                <Badge className="bg-blue-500">Walking</Badge>
                <span className="text-gray-400 text-xs">(T-0 + walking)</span>
                <span className="text-gray-400">→</span>
                <Badge className="bg-cyan-500">Finding</Badge>
                <span className="text-gray-400 text-xs">(+ finding)</span>
                <span className="text-gray-400">→</span>
                <Badge className="bg-indigo-500">Networking</Badge>
                <span className="text-gray-400 text-xs">(+ duration)</span>
                <span className="text-gray-400">→</span>
                <Badge variant="secondary">Completed</Badge>
              </div>
              <p className="text-gray-600 text-sm mt-2">
                T = round start time. All sub-phases are based on system parameters.
              </p>
            </div>

            {/* Participant Flow - Happy */}
            <div>
              <h3 className="text-gray-900 mb-3">Participant (happy path)</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-muted-foreground/60">Registered</Badge>
                <span className="text-gray-400">→</span>
                <Badge className="bg-green-100 text-green-700 border-green-300">Confirmed</Badge>
                <span className="text-gray-400">→</span>
                <Badge className="bg-purple-100 text-purple-700 border-purple-300">Matched</Badge>
                <span className="text-gray-400">→</span>
                <Badge className="bg-indigo-100 text-indigo-700 border-indigo-300">Checked-in</Badge>
                <span className="text-gray-400">→</span>
                <Badge className="bg-blue-100 text-blue-700 border-blue-300">Met</Badge>
                <span className="text-gray-400 text-xs ml-1">+ round_completed_at</span>
              </div>
            </div>

            {/* Participant Flow - Unhappy */}
            <div>
              <h3 className="text-gray-900 mb-3">Participant (unhappy paths)</h3>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-muted-foreground/60">Registered</Badge>
                  <span className="text-gray-400">→</span>
                  <Badge variant="destructive" className="bg-red-50 text-red-600">Cancelled</Badge>
                  <span className="text-gray-500 text-sm ml-2">(user cancels before matching)</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-muted-foreground/60">Registered</Badge>
                  <span className="text-gray-400">→</span>
                  <Badge variant="outline" className="text-yellow-700 border-yellow-300">Unconfirmed</Badge>
                  <span className="text-gray-500 text-sm ml-2">(T-0 passes, never confirmed)</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-green-100 text-green-700 border-green-300">Confirmed</Badge>
                  <span className="text-gray-400">→</span>
                  <Badge variant="outline" className="text-gray-600 border-gray-300 bg-gray-50">No match</Badge>
                  <span className="text-gray-500 text-sm ml-2">(odd one out after matching)</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-green-100 text-green-700 border-green-300">Confirmed</Badge>
                  <span className="text-gray-400">→</span>
                  <Badge variant="destructive" className="bg-red-50 text-red-600">Cancelled</Badge>
                  <span className="text-gray-500 text-sm ml-2">(user cancels after confirming, before matching)</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-700 border-purple-300">Matched</Badge>
                  <span className="text-gray-400">→</span>
                  <Badge variant="destructive">Missed</Badge>
                  <span className="text-gray-500 text-sm ml-2">(walking deadline expired, no check-in)</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Transition Rules */}
        <Card className="p-6">
          <h2 className="text-gray-900 mb-4">Transition rules</h2>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-900 text-sm font-medium">
              Status transitions are strictly enforced by the backend. Invalid transitions are rejected.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">From</th>
                  <th className="text-left py-2">Allowed transitions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 pr-4"><Badge variant="secondary" className="text-muted-foreground/60">registered</Badge></td>
                  <td className="py-2">→ confirmed, unconfirmed, cancelled</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><Badge className="bg-green-100 text-green-700 border-green-300">confirmed</Badge></td>
                  <td className="py-2">→ matched, no-match, cancelled</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><Badge className="bg-purple-100 text-purple-700 border-purple-300">matched</Badge></td>
                  <td className="py-2">→ checked-in, missed</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><Badge className="bg-indigo-100 text-indigo-700 border-indigo-300">checked-in</Badge></td>
                  <td className="py-2">→ met</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><Badge className="bg-blue-100 text-blue-700 border-blue-300">met</Badge></td>
                  <td className="py-2 text-gray-500 italic">terminal (no transitions)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><Badge variant="outline" className="text-yellow-700 border-yellow-300">unconfirmed</Badge></td>
                  <td className="py-2 text-gray-500 italic">terminal (no transitions)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><Badge variant="outline" className="text-gray-600 border-gray-300 bg-gray-50">no-match</Badge></td>
                  <td className="py-2 text-gray-500 italic">terminal (no transitions)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><Badge variant="destructive">missed</Badge></td>
                  <td className="py-2 text-gray-500 italic">terminal (no transitions)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><Badge variant="destructive" className="bg-red-50 text-red-600">cancelled</Badge></td>
                  <td className="py-2 text-gray-500 italic">terminal (no transitions)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Auto-detection */}
        <Card className="p-6">
          <h2 className="text-gray-900 mb-4">Auto-detection (dashboard poll)</h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-900 text-sm">
              The participant dashboard endpoint runs auto-detection checks on each poll.
              These transitions are persisted to the database automatically.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Condition</th>
                  <th className="text-left py-2 pr-4">From</th>
                  <th className="text-left py-2 pr-4">To</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 pr-4">now &ge; T-0 (round start passed)</td>
                  <td className="py-2 pr-4">registered</td>
                  <td className="py-2 pr-4">unconfirmed</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">now &ge; matchedAt + walkingTimeMinutes</td>
                  <td className="py-2 pr-4">matched</td>
                  <td className="py-2 pr-4">missed</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">now &ge; round end time</td>
                  <td className="py-2 pr-4">any active</td>
                  <td className="py-2 pr-4">keep status, set round_completed_at</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Important Notes */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-gray-900 mb-4">Important notes</h2>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Session status and participant status are stored in the database</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Round statuses are computed dynamically by <code>getRoundStatus()</code> — never written to DB</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Session flags (hasRunningRounds, hasUpcomingRounds) are computed on-the-fly, not stored</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Round completion is tracked via <code>round_completed_at</code> timestamp — NOT a separate status</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Terminal statuses (unconfirmed, no-match, missed, cancelled) have no transitions out</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Registration closes at T-safetyWindowMinutes. Confirmation window runs from T-safetyWindowMinutes to T-0</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Walking deadline for 'missed' auto-detection: matchedAt + walkingTimeMinutes (configurable)</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function StatusItem({
  badge,
  title,
  description,
  details
}: {
  badge: React.ReactNode;
  title: string;
  description: string;
  details: string[];
}) {
  return (
    <div className="border-l-4 border-gray-200 pl-4 py-2">
      <div className="flex items-center gap-3 mb-2">
        {badge}
        <h3 className="text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 text-sm mb-2">{description}</p>
      <ul className="space-y-1">
        {details.map((detail, index) => (
          <li key={index} className="text-gray-500 text-sm flex gap-2">
            <span className="text-gray-400">•</span>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
