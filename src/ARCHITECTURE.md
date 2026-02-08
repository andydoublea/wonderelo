# Wonderelo - Technická Architektúra

## 🏗 System Overview

Wonderelo používa **three-tier architecture**:

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend      │─────▶│   Edge Function  │─────▶│   KV Database   │
│   (React)       │      │   (Hono/Deno)    │      │   (Supabase)    │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

## 📦 Frontend Štruktúra

### Routing (`/AppRouter.tsx`)

**Organizer Routes:**
```
/signin                 - Sign in page
/signup                 - Sign up page
/dashboard              - Main organizer dashboard
/sessions/new           - Create new session
/sessions/:id/edit      - Edit session
/sessions/:id/rounds    - Round management
/sessions/:id/admin     - Participant administration
/account                - Account settings
/billing                - Billing settings
```

**Participant Routes:**
```
/p/:token               - Participant dashboard
/p/:token/match         - Match info (meeting point)
/p/:token/match-partner - Partner identification
/p/:token/networking    - Ice breakers & contact sharing
/p/:token/profile       - Participant profile
```

**Public Routes:**
```
/:slug                  - Organizer public page
/:slug/register         - Session registration
```

### Key Components

#### Organizer Components:
- **Dashboard.tsx** - Main dashboard s session overview
- **SessionForm.tsx** - Session creation/editing form
- **SessionAdministration.tsx** - Participant management
- **RoundFormPage.tsx** - Round management
- **AccountSettings.tsx** - Email change with verification
- **BillingSettings.tsx** - Stripe integration (planned)

#### Participant Components:
- **ParticipantDashboard.tsx** - Registered rounds overview
- **SessionRegistration.tsx** - Multi-step registration form
- **MatchInfo.tsx** - Meeting point display
- **MatchPartner.tsx** - Partner identification screen
- **MatchNetworking.tsx** - Networking session with icebreakers
- **CountdownTimer.tsx** - Reusable countdown component

#### Shared Components:
- **ui/** - Shadcn/ui components (Button, Card, Input, etc.)
- **GeometricIdentification.tsx** - Visual identification system

### State Management

**Zustand Stores:**
```typescript
// /stores/index.ts
useAppStore     - Global app state
useAuth         - Authentication state
useAccessToken  - Access token management
```

**Session Storage:**
```typescript
// Used for cross-page navigation
sessionStorage.setItem('admin_return_context', JSON.stringify({
  fromPage: 'organizer-management',
  sessionId, roundId, participantId
}))
```

## 🔧 Backend Štruktúra

### Entry Point: `/supabase/functions/server/index.tsx`

**Server Setup:**
```typescript
import { Hono } from 'npm:hono';
const app = new Hono();

// Middleware
app.use('*', cors({ origin: '*' }));
app.use('*', logger(console.log));

// Routes
app.get('/make-server-ce05600a/...');
app.post('/make-server-ce05600a/...');

Deno.serve(app.fetch);
```

### Backend Modules

**Modular Architecture:**
```
/supabase/functions/server/
├── index.tsx                    # Main entry + organizer routes
├── route-participants.tsx       # Participant endpoints
├── route-registration.tsx       # Registration logic
├── matching.tsx                 # Matching algorithm
├── participant-dashboard.tsx    # Dashboard logic
├── kv_wrapper.tsx              # KV store utilities
├── debug.tsx                   # Logging utilities
├── time-helpers.tsx            # Time calculations
└── global-supabase.tsx         # Supabase client singleton
```

### Module Responsibilities

**matching.tsx:**
- `createMatchesForRound()` - Main matching function
- `runMatchingAlgorithm()` - Scoring & group creation
- `getMeetingHistory()` - Track past meetings
- `calculatePairingScores()` - 30/20/10 point system
- `findBestGroup()` - Greedy matching algorithm

**participant-dashboard.tsx:**
- `getParticipantDashboard()` - Enriched dashboard data
- Status calculation logic
- Auto-trigger matching at T-0
- Triple-layer protection against status overwrites

**route-participants.tsx:**
- `/p/:token/dashboard` - Dashboard endpoint
- `/participant/:token/match` - Match data
- `/participant/:token/match-partner` - Partner data
- `/participant/:token/networking` - Networking session
- `/participant/:token/check-in` - Check-in at meeting point
- `/participant/:token/confirm-match` - Confirm meeting
- `/participant/:token/contact-sharing` - Save contact preferences

**route-registration.tsx:**
- `registerParticipant()` - Handle registration
- Token generation
- Email verification logic
- Participant profile creation

## 💾 KV Storage Schema

### Data Structure

**User Profile:**
```
Key: user_profile:{userId}
Value: {
  userId, email, organizerName, urlSlug, phone, website,
  description, profileImageUrl, role, createdAt, updatedAt
}
```

**Slug Mapping:**
```
Key: slug_mapping:{urlSlug}
Value: userId
```

**Session:**
```
Key: user_sessions:{userId}:{sessionId}
Value: {
  id, userId, name, description, date, status,
  limitParticipants, maxParticipants, groupSize,
  enableTeams, matchingType, teams,
  enableTopics, allowMultipleTopics, topics,
  meetingPoints, iceBreakers, rounds: [...],
  createdAt, updatedAt
}
```

**Round Structure (inside Session):**
```typescript
{
  id, name, date, startTime, duration,
  groupSize, meetingPoints, status
}
```

**Participant Token:**
```
Key: participant_token:{token}
Value: {
  participantId, email, createdAt
}
```

**Participant Email Mapping:**
```
Key: participant_email:{normalizedEmail}
Value: {
  participantId, token, createdAt
}
```

**Participant Profile:**
```
Key: participant_profile:{participantId}
Value: {
  participantId, email, firstName, lastName,
  phone, phoneCountry, updatedAt
}
```

**Participant Registrations:**
```
Key: participant_registrations:{participantId}
Value: [
  {
    participantId, sessionId, roundId,
    sessionName, roundName,
    organizerId, organizerName, organizerUrlSlug,
    date, startTime, duration,
    status, team, topics, meetingPoint,
    matchId, matchPartnerNames, meetingPointId,
    registeredAt, confirmedAt, checkedInAt, metAt,
    lastStatusUpdate, notificationsEnabled
  }
]
```

**Participant Entry (per round):**
```
Key: participant:{sessionId}:{roundId}:{participantId}
Value: {
  participantId, email, firstName, lastName,
  phone, team, topics, meetingPoint,
  status, matchId,
  registeredAt, confirmedAt, checkedInAt, metAt
}
```

**Match:**
```
Key: match:{sessionId}:{roundId}:{matchId}
Value: {
  matchId, participantIds: [...],
  participants: [{ participantId, firstName, lastName, email, team, topics }],
  meetingPoint, createdAt
}
```

**Matching Lock (idempotency):**
```
Key: matching_lock:{sessionId}:{roundId}
Value: {
  completedAt, matchCount, unmatchedCount
}
```

**Contact Sharing Preferences:**
```
Key: contact_sharing:{matchId}:{participantId}
Value: {
  [targetParticipantId]: boolean
}
```

**System Parameters:**
```
Key: admin:system_parameters
Value: {
  confirmationWindowMinutes, safetyWindowMinutes,
  walkingTimeMinutes, notificationEarlyMinutes,
  defaultRoundDuration, defaultGroupSize, etc.
}
```

## 🎯 Matching Algorithm

### Scoring System

**Total Score = Meeting Memory + Teams + Topics**

```typescript
// 30 points: Haven't met before
if (!haveMet) score += 30;

// 20 points: Team matching
if (matchingType === 'across-teams') {
  if (team1 !== team2) score += 20;
} else if (matchingType === 'within-teams') {
  if (team1 === team2) score += 20;
}

// 10 points: Common topics
if (commonTopics.length > 0) score += 10;
```

### Greedy Algorithm

1. **Calculate all pairwise scores**
2. **Repeatedly pick best scoring group** of size `groupSize`
3. **Remove matched participants** from pool
4. **Handle odd participant** - add to smallest existing group

### Idempotency

- **Matching lock** prevents duplicate matching
- Lock key: `matching_lock:{sessionId}:{roundId}`
- Created before matching starts

## 🔄 Status Transitions

### Participant Status Flow

```
registered
    ↓ (user clicks "Confirm attendance" OR auto at T-0)
confirmed
    ↓ (matching algorithm runs at T-0)
matched / no-match
    ↓ (user clicks "I am here")
checked-in
    ↓ (user confirms partner number)
met
```

**Unconfirmed Path:**
```
registered → unconfirmed (didn't confirm before T-0)
```

**No-match Scenarios:**
```
confirmed → no-match (solo participant or odd participant if algorithm fails)
```

### Protected Statuses

**Triple-layer protection** prevents background processes from overwriting:

1. **Blacklist** - Never overwrite: confirmed, matched, checked-in, met, no-match
2. **Timestamp check** - If `confirmedAt` exists, don't overwrite
3. **Whitelist** - Only allow: completed, unconfirmed

## ⏰ Time-based Logic

### Round Timing

```typescript
// T-X: Registration window opens
registrationStart = roundStart - confirmationWindow - safetyWindow

// T-confirmation: Confirmation window opens
confirmationWindowStart = roundStart - confirmationWindow

// T-0: Round starts → Matching triggered
roundStart = new Date(`${date}T${startTime}`)

// T-end: Round ends
roundEnd = roundStart + (duration * 60000)
```

### Auto-status Updates

**Dashboard endpoint (`participant-dashboard.tsx`):**
- Calculates current status based on time
- Does NOT persist changes if status is protected
- Triggers matching at T-0 asynchronously

**Matching module (`matching.tsx`):**
- Runs at T-0 (triggered by dashboard)
- Changes `registered` → `unconfirmed` for no-shows
- Changes `confirmed` → `matched` for successful matches
- Changes `confirmed` → `no-match` for solo/odd participants

## 🔐 Authentication & Security

### Organizer Auth (Supabase)

```typescript
// Sign up
await supabase.auth.admin.createUser({
  email, password, email_confirm: true
});

// Sign in
await supabase.auth.signInWithPassword({ email, password });

// Protected routes
const { data: { user } } = await supabase.auth.getUser(token);
```

### Participant Auth (Token-based)

```typescript
// Generate unique token
const token = `${Date.now()}-${randomString}`;

// Store mappings
await kv.set(`participant_token:${token}`, { participantId, email });
await kv.set(`participant_email:${normalizedEmail}`, { token, participantId });
```

**Token Uniqueness:**
- Each participant has ONE permanent token
- Token tied to email address
- Old tokens redirect to current token

## 🚀 Performance Optimizations

### Frontend
- **Code splitting** - Lazy loading components
- **Memoization** - React.memo for expensive components
- **Debouncing** - Form inputs and API calls

### Backend
- **Parallel fetches** - Promise.all for multiple KV reads
- **Batch operations** - Single write for multiple registrations
- **Caching** - Session data cached in memory during matching

### Database
- **Prefix queries** - `getByPrefix()` for filtering
- **Denormalization** - Store computed data (e.g., matchPartnerNames)
- **Indexed lookups** - Token → participant, email → participant

## 📊 Monitoring & Debugging

### Logging

```typescript
// debug.tsx
export function debugLog(...args: any[]) {
  console.log('[DEBUG]', ...args);
}

export function errorLog(...args: any[]) {
  console.error('[ERROR]', ...args);
}
```

### Audit Trail

- All status changes logged with timestamp
- `lastStatusUpdate` field tracks changes
- Console logs in backend for debugging

## 🔮 Future Enhancements

- **Stripe payment integration** - Billing system
- **Email notifications** - Resend integration
- **SMS notifications** - Twilio/Vonage
- **Real-time updates** - WebSocket for live status
- **Analytics dashboard** - Event metrics
- **Multi-language support** - i18n
- **Mobile app** - React Native
