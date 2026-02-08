import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Clock, Users, CheckCircle, XCircle, UserPlus, UserX, UserMinus, Handshake, Minus, AlertCircle, Settings } from 'lucide-react';

export function AdminStatusesGuide() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-gray-900 mb-2">Statuses and flags guide</h1>
          <p className="text-gray-600">
            Complete reference for all statuses and dynamic flags in the Oliwonder system
          </p>
        </div>

        {/* Session Statuses */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-gray-900">Session statuses</h2>
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
                "Will automatically change to 'completed' when endTime is reached",
                "Can be updated, managed, completed, duplicated, or deleted"
              ]}
            />
            
            <StatusItem
              badge={<Badge variant="secondary">Completed</Badge>}
              title="Completed"
              description="Session has ended"
              details={[
                "Not visible on event page",
                "Can view results and statistics",
                "Can be duplicated or deleted"
              ]}
            />
          </div>
        </Card>

        {/* Session Flags */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-purple-600" />
            <h2 className="text-gray-900">Session flags (dynamic)</h2>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <p className="text-purple-900 text-sm">
              These are NOT statuses - they are computed on-the-fly based on current time and round times
            </p>
          </div>

          <div className="space-y-4">
            <StatusItem
              badge={<Badge className="bg-green-600">Running</Badge>}
              title="hasRunningRounds()"
              description="At least one round is currently in progress"
              details={[
                "Calculated: current time is between round startTime and endTime",
                "Displayed as green badge next to session status",
                "Does not affect session visibility or registration"
              ]}
            />
            
            <StatusItem
              badge={<Badge className="bg-blue-600">Registration open</Badge>}
              title="hasUpcomingRounds()"
              description="At least one round is still accepting registrations"
              details={[
                "Calculated: at least one round starts more than safetyWindowMinutes in the future",
                "Used to determine if session should be visible on event page",
                "Registration closes safetyWindowMinutes before round start (configurable in Parameters)"
              ]}
            />
          </div>
        </Card>

        {/* Round Statuses */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-orange-600" />
            <h2 className="text-gray-900">Round statuses</h2>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-orange-900 text-sm">
              Round status is calculated based on parent session status and current time
            </p>
          </div>
          
          <div className="space-y-4">
            <StatusItem
              badge={<Badge variant="secondary">Draft</Badge>}
              title="Draft"
              description="Parent session is not yet published"
              details={[
                "Round exists but is not accessible to public",
                "Changes to 'scheduled' when session is published or scheduled"
              ]}
            />
            
            <StatusItem
              badge={<Badge variant="outline" className="border-blue-500 text-blue-700">Scheduled</Badge>}
              title="Scheduled"
              description="Session is published but round registration not yet open"
              details={[
                "Session is published but this specific round hasn't opened for registration yet",
                "Changes to 'open-to-registration' when appropriate time comes"
              ]}
            />
            
            <StatusItem
              badge={<Badge className="bg-green-600">Open to registration</Badge>}
              title="Open to registration"
              description="Participants can register for this round"
              details={[
                "Time period: from registration opening until T-6 minutes before start",
                "Participants can join during this time on event page",
                "Changes to 'registration-safety-window' at T-6 minutes"
              ]}
            />
            
            <StatusItem
              badge={<Badge className="bg-blue-500">Registration safety window</Badge>}
              title="Registration safety window"
              description="Grace period for completing ongoing registrations"
              details={[
                "Time period: T-safetyWindowMinutes to T-confirmationWindowMinutes",
                "New participants cannot start registration on event page",
                "Participants who started registration before safetyWindow can still complete it",
                "Changes to 'waiting-for-attendance-confirmation' at confirmationWindow minutes"
              ]}
            />
            
            <StatusItem
              badge={<Badge className="bg-yellow-600">Waiting for attendance confirmation</Badge>}
              title="Waiting for attendance confirmation"
              description="Confirmation phase before matching"
              details={[
                "Time period: T-confirmationWindowMinutes to T-0 minutes (configurable)",
                "Participants must confirm their attendance",
                "Non-confirmed participants will not be included in matching",
                "Changes to 'matching' at T-0"
              ]}
            />
            
            <StatusItem
              badge={<Badge className="bg-purple-600">Matching</Badge>}
              title="Matching"
              description="Algorithm creates groups and reveals matches"
              details={[
                "Time period: T-0 (instant)",
                "System matches confirmed participants into groups",
                "Matches are revealed immediately to participants",
                "matchRevealedAt timestamp is set",
                "Changes to 'walking-to-meeting-point' immediately after matching"
              ]}
            />
            
            <StatusItem
              badge={<Badge className="bg-blue-600">Walking to meeting point</Badge>}
              title="Walking to meeting point"
              description="Participants have 3 minutes to find their group and meeting point"
              details={[
                "Time period: T-0 to first 'We met' confirmation (max 3 minutes)",
                "Participants see their group members and assigned meeting point",
                "Groups can confirm 'We met' when they all arrive",
                "Individual groups track: matchRevealedAt, meetConfirmedAt",
                "Changes to 'networking' when group confirms 'We met'"
              ]}
            />
            
            <StatusItem
              badge={<Badge className="bg-green-600">Networking</Badge>}
              title="Networking"
              description="Groups are networking for the configured round duration"
              details={[
                "Time period: From meetConfirmedAt to meetConfirmedAt + round duration",
                "Duration is configurable per round (not fixed)",
                "Individual groups track: meetConfirmedAt, networkingEndAt (meetConfirmedAt + duration)",
                "QR check-ins can happen during this time",
                "Round status changes to 'completed' when last group finishes or max time elapsed"
              ]}
            />
            
            <StatusItem
              badge={<Badge variant="secondary">Completed</Badge>}
              title="Completed"
              description="Round has finished"
              details={[
                "Round duration has elapsed",
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
            <h2 className="text-gray-900">Participant statuses</h2>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
            <p className="text-indigo-900 text-sm">
              Each participant has a status for each round they register for. Participant dashboard shows ALL statuses including cancelled/missed rounds for complete history.
            </p>
          </div>
          
          <div className="space-y-4">
            <StatusItem
              badge={
                <Badge variant="outline" className="border-orange-300 text-orange-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Verification pending
                </Badge>
              }
              title="Verification pending"
              description="Participant registered but hasn't confirmed their email yet"
              details={[
                "Participant submitted registration form without existing token",
                "Verification email sent with confirmation link",
                "Status changes to 'Registered' after email verification",
                "Can resend verification email if needed",
                "🔒 SECURITY: Each verification email only verifies the specific rounds included in that email. Multiple pending registrations require separate verifications to prevent unauthorized registrations.",
                "🔄 UX: If participant registers for additional rounds while still having pending verifications, old verification emails are invalidated and ONE new email is sent that verifies ALL pending rounds at once.",
                "📧 OLD LINKS: If participant clicks an old/invalidated verification link, they see a friendly error message instructing them to check their inbox for the most recent verification email."
              ]}
            />
            
            <StatusItem
              badge={
                <Badge className="bg-blue-600 flex items-center gap-1">
                  <UserPlus className="w-3 h-3" />
                  Registered
                </Badge>
              }
              title="Registered"
              description="Email verified (or verification skipped) - participant signed up for the round"
              details={[
                "Status after email verification OR if participant already had token",
                "Waiting for confirmation phase (T-5 minutes)",
                "Can cancel registration before confirmation phase",
                "Visible to participant and organizer"
              ]}
            />
            
            <StatusItem
              badge={
                <Badge variant="default" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Waiting for attendance confirmation
                </Badge>
              }
              title="Waiting for attendance confirmation"
              description="⚡ AUTO: System automatically changed participant status at T-5 minutes before round start"
              details={[
                "🤖 AUTOMATIC TRANSITION: Frontend (RoundItem.tsx) detects confirmation-window phase and calls backend endpoint",
                "⏰ Time period: T-5 to T-0 minutes (5 minute window)",
                "🎯 Participant must confirm attendance before T-0 to be included in matching",
                "🔔 Notification: Push notification will be sent when implemented (currently auto-status change only)",
                "📱 User sees: Countdown timer and 'Confirm attendance' button in participant dashboard",
                "✅ Success path: Clicking confirm → status changes to 'Confirmed'",
                "❌ Failure path: Not confirming by T-0 → status changes to 'Unconfirmed'",
                "🔐 Backend: Logs status change and participant action to audit log",
                "📊 Visibility: Participant and organizer both see this status",
                "🔄 API endpoint: POST /rounds/:roundId/enter-confirmation-window/:participantId",
                "💾 Database: Sets confirmationWindowEnteredAt timestamp"
              ]}
            />
            
            <StatusItem
              badge={
                <Badge className="bg-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Confirmed
                </Badge>
              }
              title="Confirmed"
              description="Participant confirmed attendance during confirmation phase (T-5 to T-0)"
              details={[
                "Participant clicked 'Confirm attendance' button during confirmation window",
                "Will be included in matching algorithm at T-0",
                "Can still report no-show if needed"
              ]}
            />
            
            <StatusItem
              badge={
                <Badge className="bg-orange-600 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  Unconfirmed
                </Badge>
              }
              title="Unconfirmed"
              description="Participant did not confirm attendance in time"
              details={[
                "Participant did not respond during T-5 to T-4 window",
                "Not included in matching",
                "Considered as not attending"
              ]}
            />
            
            <StatusItem
              badge={
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Minus className="w-3 h-3" />
                  Cancelled
                </Badge>
              }
              title="Cancelled"
              description="Participant cancelled their registration"
              details={[
                "Participant actively cancelled before confirmation phase",
                "Not included in any matching",
                "Can re-register if registration is still open",
                "Still visible in participant's dashboard history"
              ]}
            />
            
            <StatusItem
              badge={
                <Badge className="bg-emerald-600 flex items-center gap-1">
                  <Handshake className="w-3 h-3" />
                  Met
                </Badge>
              }
              title="Met"
              description="Participant successfully met with their match"
              details={[
                "Both participant and match completed QR check-in",
                "Meeting confirmed as successful",
                "Final positive status"
              ]}
            />
            
            <StatusItem
              badge={
                <Badge className="bg-pink-600 flex items-center gap-1">
                  <UserX className="w-3 h-3" />
                  Missed
                </Badge>
              }
              title="Missed"
              description="Participant confirmed but did not show up (no-show)"
              details={[
                "Participant confirmed attendance but did not arrive",
                "Did not complete QR check-in",
                "Negative outcome for participant"
              ]}
            />
            
            <StatusItem
              badge={
                <Badge className="bg-amber-600 flex items-center gap-1">
                  <UserMinus className="w-3 h-3" />
                  Left alone
                </Badge>
              }
              title="Left alone"
              description="Participant showed up but their match did not"
              details={[
                "Participant arrived and checked in",
                "Their matched partner(s) did not show up",
                "Participant waited but meeting did not happen"
              ]}
            />
          </div>
        </Card>

        {/* Lifecycle Flow */}
        <Card className="p-6">
          <h2 className="text-gray-900 mb-6">Typical lifecycle flow</h2>
          
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
              <h3 className="text-gray-900 mb-3">Round</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Draft</Badge>
                <span className="text-gray-400">→</span>
                <Badge variant="outline" className="border-blue-500 text-blue-700">Scheduled</Badge>
                <span className="text-gray-400">→</span>
                <Badge className="bg-green-600">Open to registration</Badge>
                <span className="text-gray-400 text-xs"> (until T-6)</span>
                <span className="text-gray-400">→</span>
                <Badge className="bg-blue-500">Safety window</Badge>
                <span className="text-gray-400 text-xs"> (T-6 to T-5)</span>
                <span className="text-gray-400">→</span>
                <Badge className="bg-yellow-600">Waiting for confirmation</Badge>
                <span className="text-gray-400 text-xs"> (T-5 to T-0)</span>
                <span className="text-gray-400">→</span>
                <Badge className="bg-purple-600">Matching</Badge>
                <span className="text-gray-400 text-xs"> (T-0)</span>
                <span className="text-gray-400">→</span>
                <Badge className="bg-blue-600">Walking to meeting point</Badge>
                <span className="text-gray-400 text-xs"> (max 3 min)</span>
                <span className="text-gray-400">→</span>
                <Badge className="bg-green-600">Networking</Badge>
                <span className="text-gray-400 text-xs"> (configurable duration)</span>
                <span className="text-gray-400">→</span>
                <Badge variant="secondary">Completed</Badge>
              </div>
              <p className="text-gray-600 text-sm mt-2">
                T = round start time. Duration per round is configurable (not fixed).
              </p>
            </div>

            {/* Participant Flow */}
            <div>
              <h3 className="text-gray-900 mb-3">Participant (happy path)</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-600 text-sm mb-2">New participant (no token):</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-orange-300 text-orange-600">Verification pending</Badge>
                    <span className="text-gray-400">→</span>
                    <Badge className="bg-blue-600">Registered</Badge>
                    <span className="text-gray-400 text-xs"> (T-5 auto)</span>
                    <span className="text-gray-400">→</span>
                    <Badge variant="default">Waiting for confirmation</Badge>
                    <span className="text-gray-400">→</span>
                    <Badge className="bg-green-600">Confirmed</Badge>
                    <span className="text-gray-400">→</span>
                    <Badge className="bg-emerald-600">Met</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-2">Returning participant (has token):</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-blue-600">Registered</Badge>
                    <span className="text-gray-400 text-xs"> (T-5 auto)</span>
                    <span className="text-gray-400">→</span>
                    <Badge variant="default">Waiting for confirmation</Badge>
                    <span className="text-gray-400">→</span>
                    <Badge className="bg-green-600">Confirmed</Badge>
                    <span className="text-gray-400">→</span>
                    <Badge className="bg-emerald-600">Met</Badge>
                  </div>
                  <p className="text-gray-500 text-xs mt-1 ml-2">Skips Verification pending (email already verified)</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-gray-900 mb-3">Participant (unhappy paths)</h3>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-blue-600">Registered</Badge>
                  <span className="text-gray-400">→</span>
                  <Badge variant="destructive">Cancelled</Badge>
                  <span className="text-gray-500 text-sm ml-2">(participant cancels)</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-blue-600">Registered</Badge>
                  <span className="text-gray-400 text-xs"> (T-5 auto)</span>
                  <span className="text-gray-400">→</span>
                  <Badge variant="default">Waiting for confirmation</Badge>
                  <span className="text-gray-400">→</span>
                  <Badge className="bg-orange-600">Unconfirmed</Badge>
                  <span className="text-gray-500 text-sm ml-2">(no confirmation by T-0)</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-blue-600">Registered</Badge>
                  <span className="text-gray-400">→</span>
                  <Badge variant="default">Waiting for confirmation</Badge>
                  <span className="text-gray-400">→</span>
                  <Badge className="bg-green-600">Confirmed</Badge>
                  <span className="text-gray-400">→</span>
                  <Badge className="bg-pink-600">Missed</Badge>
                  <span className="text-gray-500 text-sm ml-2">(no-show)</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-blue-600">Registered</Badge>
                  <span className="text-gray-400">→</span>
                  <Badge variant="default">Waiting for confirmation</Badge>
                  <span className="text-gray-400">→</span>
                  <Badge className="bg-green-600">Confirmed</Badge>
                  <span className="text-gray-400">→</span>
                  <Badge className="bg-amber-600">Left alone</Badge>
                  <span className="text-gray-500 text-sm ml-2">(match no-show)</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Session Creation - Time Constraints */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-teal-600" />
            <h2 className="text-gray-900">Session creation - time constraints</h2>
          </div>

          <div className="space-y-6">
            {/* Registration Start */}
            <div>
              <h3 className="text-gray-900 mb-2">Registration start</h3>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 space-y-2">
                <p className="text-teal-900 text-sm">
                  <strong>When creating a new session:</strong>
                </p>
                <ul className="space-y-1 text-teal-800 text-sm ml-4">
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Cannot be set to the past</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Can be set to current time (button "Publish on event page")</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Can be set to future time (button "Schedule")</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Must be at least 10 minutes before Start time (in input field)</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Validation on publish checks for 9 minutes (not 10) to account for time spent filling the form when using "as soon as possible" option</span>
                  </li>
                </ul>
                <p className="text-teal-900 text-sm mt-3">
                  <strong>When editing a published session:</strong>
                </p>
                <ul className="space-y-1 text-teal-800 text-sm ml-4">
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Button "Publish to event page": Registration start remains unchanged (can be in the past)</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Button "Schedule": Registration start changes to future time</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Start Time */}
            <div>
              <h3 className="text-gray-900 mb-2">Start time (first round)</h3>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <ul className="space-y-1 text-teal-800 text-sm">
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Must be rounded to 5-minute intervals (e.g., 14:00, 14:05, 14:10)</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Must be at least 9-10 minutes after Registration start</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* End Time */}
            <div>
              <h3 className="text-gray-900 mb-2">End time (last round)</h3>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <ul className="space-y-1 text-teal-800 text-sm">
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Automatically calculated based on the last round's start time + duration</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Cannot be manually set</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Round Times */}
            <div>
              <h3 className="text-gray-900 mb-2">Round times</h3>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <ul className="space-y-1 text-teal-800 text-sm">
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Minimum round duration: 5 minutes</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Rounds must be sequential (cannot overlap)</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Each round follows immediately after the previous one ends</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Publishing Constraints */}
            <div>
              <h3 className="text-gray-900 mb-2">Publishing constraints</h3>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <ul className="space-y-1 text-teal-800 text-sm">
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>A draft session can only be published if Start time is at least 9 minutes in the future</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>This means you cannot publish a session 2 minutes before it starts</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Minimum lead time ensures participants have time to register before registration closes at T-6</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Important Notes */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-gray-900 mb-4">Important notes</h2>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Session flags (hasRunningRounds, hasUpcomingRounds) are NOT stored in database - they are calculated in real-time</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Round statuses are also calculated dynamically based on session status and current time</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Only Session status and Participant status are stored in the database</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Automatic status transitions happen every 60 seconds in AppRouter.tsx</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Registration closes at T-6 minutes to allow time for safety window (T-6 to T-5) and confirmation (T-5 to T-0) before matching starts</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Individual groups track their own meeting timers during Running phase via: matchRevealedAt, meetConfirmedAt, networkingEndAt</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">•</span>
              <span>Participant can manually change status in admin panel, overriding automatic transitions</span>
            </li>
            <li className="flex gap-2">
              <span className="text-orange-600">🔒</span>
              <span><strong>Email verification security:</strong> When a participant clicks a verification link, ONLY the specific rounds included in that verification email are verified. This prevents malicious actors from registering someone else's email and having it verified when the victim registers for a different round.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600">🔄</span>
              <span><strong>Email verification UX:</strong> When a participant registers for multiple rounds before verifying email, each new registration invalidates previous verification emails and creates a NEW verification link that verifies ALL pending rounds at once. This ensures one-click verification for better user experience.</span>
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