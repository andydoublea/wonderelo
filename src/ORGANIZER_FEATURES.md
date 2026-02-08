# Wonderelo - Organizer Features

## 🎯 Prehľad Funkcionalít

Tento dokument popisuje všetky features dostupné pre organizátorov eventov.

---

## 🔐 Autentifikácia

### Sign Up

**URL:** `https://oliwonder.com/signup`

**Form Fields:**
- Email address
- Password (min 8 characters)
- Organizer name (názov firmy/organizácie)
- URL slug (jedinečný identifikátor pre public page)

**Process:**
1. Backend validuje email uniqueness
2. Backend validuje slug uniqueness
3. Vytvorí Supabase Auth user
4. Vytvorí user profile v KV store
5. Auto sign-in + redirect na dashboard

**Endpoints:**
- `GET /check-email/:email` - Validácia dostupnosti
- `GET /check-slug/:slug` - Validácia dostupnosti
- `POST /signup` - Vytvorenie účtu

---

### Sign In

**URL:** `https://oliwonder.com/signin`

**Form Fields:**
- Email address
- Password

**Process:**
1. Supabase Auth validation
2. Získa access token
3. Načíta user profile
4. Redirect na dashboard

**Endpoint:** `POST /signin`

---

### Password Reset (TODO)

- Forgot password link
- Email s reset linkom
- Supabase Auth reset flow

---

## 📊 Dashboard

### URL: `/dashboard`

**Overview Cards:**
1. **Total Sessions** - Počet vytvorených sessions
2. **Active Participants** - Participanti v upcoming events
3. **Upcoming Rounds** - Najbližšie roundy
4. **Recent Activity** - Posledné akcie

**Sessions List:**
- Tabuľka všetkých sessions
- Columns:
  - Session name
  - Date
  - Status (draft, scheduled, published, completed)
  - Participants count
  - Actions (Edit, View, Delete)

**Quick Actions:**
- ➕ "Create new session" button
- 🔍 Search/filter sessions
- 📅 Calendar view (TODO)

**Endpoint:** `GET /sessions`

---

## ⚙️ Account Settings

### URL: `/account`

**Sections:**

#### 1. Profile Information
**Editable Fields:**
- Organizer name
- URL slug
- Email address (with verification)
- Phone number
- Website
- Description/Bio
- Profile photo

**Email Change Flow:**
1. Zadá nový email
2. Dostane verification email na starý email
3. Potvrdí na starom emaili
4. Dostane verification email na nový email
5. Potvrdí na novom emaili
6. Email sa zmení

**Endpoint:** `PUT /profile`

#### 2. Password Change (TODO)
- Current password
- New password
- Confirm new password

#### 3. Notifications (TODO)
- Email notifications ON/OFF
- SMS notifications ON/OFF
- Notification preferences

---

## 💳 Billing Settings (Planned)

### URL: `/billing`

**Current Plan:**
- Free trial (do 10 participants)
- Upgrade options

**Pricing Tiers:**
- 50 participants: $X/event alebo $Y/month
- 200 participants: $X/event alebo $Y/month
- 500 participants: $X/event alebo $Y/month
- 1000 participants: $X/event alebo $Y/month
- 5000+ participants: Custom pricing

**Payment Methods:**
- Credit card (Stripe)
- Invoice (pre enterprise)

**Billing History:**
- List of invoices
- Download PDF

---

## 📅 Session Management

### Create New Session

**URL:** `/sessions/new`

**Form - Basic Information:**
- Session name*
- Description
- Date* (can be TBD)
- Status (draft, scheduled, published)

**Form - Participant Settings:**
- **Limit participants**
  - Toggle ON/OFF
  - Max participants (number)
- **Group size**
  - 2, 3, 4, 5... participants per match
- **Limit groups**
  - Toggle ON/OFF
  - Max groups (number)

**Form - Teams:**
- **Enable teams** (toggle)
- **Matching type:**
  - "Within the team" - páruje len v rámci teamu
  - "Across teams" - páruje medzi teamami
- **Team list:**
  - Add/remove teams
  - Example: "Engineering", "Product", "Design"
- **Allow multiple teams per participant** (toggle)

**Form - Topics:**
- **Enable topics** (toggle)
- **Topic list:**
  - Add/remove topics
  - Example: "AI", "Web3", "Cloud Computing"
- **Allow multiple topics per participant** (toggle)

**Form - Meeting Points:**
- **Meeting point list:**
  - Name*
  - Description
  - Image upload (TODO: implement image storage)
- Add/remove meeting points

**Form - Ice Breakers:**
- **Ice breaker questions:**
  - Add/remove questions
  - Default suggestions available
  - Example: "What's your favorite hobby?"

**Endpoint:** `POST /sessions`

---

### Edit Session

**URL:** `/sessions/:id/edit`

**Same form as Create** + additional options:
- View participants
- View rounds
- Duplicate session
- Archive session

**Endpoint:** `PUT /sessions/:sessionId`

---

### Session Status Flow

```
draft → scheduled → published → completed
```

**Draft:**
- Session is being created
- Not visible to public
- Can edit all fields

**Scheduled:**
- Session is planned
- Not yet visible to public
- Date is set

**Published:**
- Session is live on public page
- Participants can register
- Limited editing (can't change date, teams, topics)

**Completed:**
- All rounds finished
- Read-only mode
- Available for analytics

---

## 🎯 Round Management

### URL: `/sessions/:id/rounds`

**Round List:**
- Table of all rounds
- Columns:
  - Round name
  - Date & time
  - Duration
  - Group size
  - Participants count
  - Status
  - Actions

**Add Round:**
- Round name*
- Date* (can inherit from session or be different)
- Start time*
- Duration (minutes)*
- Group size (inherit from session or override)
- Meeting points (select from session's meeting points)

**Multi-Day Sessions:**
- Add rounds for different days
- Each round can have different date
- Example: "Day 1 - Morning", "Day 1 - Afternoon", "Day 2 - Morning"

**Round Status:**
- draft
- scheduled
- open-to-registration
- registration-safety-window (close to start)
- matching (T-0, algorithm running)
- running (currently happening)
- completed

**Endpoints:**
- Round creation is done through session update
- No separate round endpoints (rounds are part of session object)

---

## 👥 Participant Management

### URL: `/sessions/:id/admin`

**Tabs:**
1. **Overview** - Statistics
2. **Participants** - List view
3. **Rounds** - Per-round view
4. **Matches** - Match results
5. **Audit Log** - History

---

### Tab 1: Overview

**Statistics Cards:**
- Total registered participants
- Confirmed participants
- Matched participants
- No-match participants
- Participation rate (%)

**Charts:**
- Registration timeline
- Status distribution (pie chart)
- Teams distribution (if enabled)
- Topics distribution (if enabled)

---

### Tab 2: Participants

**Participant Table:**

**Columns:**
- Name (First + Last)
- Email
- Phone
- Team (if enabled)
- Topics (if enabled)
- Registered rounds count
- Status (per round)
- Actions

**Actions:**
- 👁️ **View detail** - Zobrazí modál s detailmi
- ✉️ **Send email** (TODO)
- 🗑️ **Remove** - Odstráni z roundu

**Filters:**
- Status filter (all, registered, confirmed, matched, ...)
- Team filter
- Topic filter
- Round filter

**Search:**
- By name, email, phone

**Export:**
- CSV download
- Excel download (TODO)

**Bulk Actions:**
- Select multiple participants
- Send bulk email (TODO)
- Export selection

---

### Tab 3: Rounds (Per-Round View)

**Round Selector:**
- Dropdown s všetkými roundmi
- Zobrazuje count participantov pre každý round

**Round Details:**
- Round name
- Date & time
- Duration
- Status
- Countdown timer (ak je upcoming)

**Participants Table (for selected round):**

**Columns:**
- Name
- Email
- Team
- Topics
- Meeting point
- Status
- Confirmed at
- Checked in at
- Match ID
- Match partners
- Actions

**Status Badges:**
- registered (gray)
- confirmed (blue)
- unconfirmed (orange)
- matched (green)
- checked-in (purple)
- met (dark green)
- no-match (red)
- missed (dark red)

**Real-time Updates:**
- Auto-refresh každých 10 sekúnd
- Manual refresh button
- Last updated timestamp

---

### Tab 4: Matches

**Match Results:**

Po matching (T-0) zobrazí:

**Match List:**
- Match ID
- Participants (names)
- Meeting point
- Group size
- Created at
- Status

**Match Detail (expandable):**
- Participant names, emails
- Teams
- Topics
- Matching score (debug info)
- Check-in status per participant
- Meeting confirmation status

**Unmatched Participants:**
- List participantov s `no-match` status
- Dôvod (solo participant, odd participant, ...)
- Option to manually create match (TODO)

---

### Tab 5: Audit Log

**Event Log:**

**Tracked Events:**
- Participant registered
- Participant confirmed attendance
- Participant unconfirmed (timeout)
- Matching started
- Match created
- Participant checked in
- Participant met partner
- Contact sharing saved
- Status manually changed by admin

**Log Entry:**
```typescript
{
  timestamp: "2026-06-15T13:45:00Z",
  event: "participant_confirmed",
  participantId: "participant-456",
  participantName: "John Doe",
  roundId: "round-1",
  roundName: "Round 1",
  details: {
    oldStatus: "registered",
    newStatus: "confirmed"
  },
  triggeredBy: "participant" // or "system" or "admin"
}
```

**Filters:**
- Date range
- Event type
- Participant
- Round
- Triggered by

**Export:**
- CSV download

---

## 🔄 Bi-directional Navigation

### Organizer Management ↔ Participant Management

**Feature:** SessionStorage-based navigation

**Scenario 1: Organizer → Participant**
1. Admin klikne na participant emailu v Organizer Management
2. System uloží context do sessionStorage:
   ```typescript
   {
     fromPage: 'organizer-management',
     sessionId: 'session-123',
     roundId: null,
     participantId: 'participant-456'
   }
   ```
3. Redirect na `/sessions/:id/admin` (Participant Management)
4. Auto-scroll na participanta
5. Highlight participant row

**Scenario 2: Participant → Organizer**
1. Admin klikne "Back to organizer email" v Participant Management
2. System načíta context zo sessionStorage
3. Redirect na Organizer Management
4. Otvorí správny modal/view
5. Auto-scroll na participanta

**Benefit:**
- Bezproblémová navigácia medzi views
- Zachovaný kontext
- Žiadne stratené filtre/pozície

---

## 📧 Email Management (TODO)

### Email Templates

**Template Types:**
1. **Registration Confirmation**
   - Potvrdenie registrácie
   - Zoznam roundov
   - Magic link na dashboard
   - Organizer contact

2. **Attendance Reminder**
   - Pripomienka T-X hours pred roundom
   - Confirm attendance link
   - Meeting point info

3. **Round Start Notification**
   - Round začína o X minút
   - Meeting point reminder
   - Match info (ak je matched)

4. **Match Notification**
   - "You have a match!"
   - Partner info
   - Meeting point
   - Countdown timer

5. **Contact Exchange**
   - Výmena kontaktov (ak obe strany súhlasili)
   - Partner email, phone

**Template Customization:**
- Custom email subject
- Custom message
- Branding (logo, colors)
- Footer (unsubscribe, contact)

**Email Service:** Resend API

---

## 📱 SMS Notifications (TODO)

**Service:** Twilio alebo Vonage

**SMS Types:**
1. Registration confirmation
2. Attendance reminder
3. Round start alert
4. Match found alert

**Opt-in:**
- Participant musí poskytnúť telefón
- Participant môže zapnúť/vypnúť per-round

**Cost:**
- SMS kredity (pay-as-you-go)
- Included in premium plans

---

## 📊 Analytics & Reports (TODO)

### Session Analytics

**Metrics:**
- Total registrations
- Confirmation rate (%)
- Show-up rate (%)
- Matching success rate (%)
- Average group size
- Contact exchange rate (%)

**Charts:**
- Registration over time
- Status distribution
- Teams heatmap (who met whom)
- Topics correlation

**Export:**
- PDF report
- Excel spreadsheet

---

### Participant Insights

**Individual Participant:**
- Registration history
- Attendance history
- Match history
- Favorite topics
- Preferred teams

**Cohort Analysis:**
- Compare different events
- Team performance
- Topic popularity

---

## 🎨 Event Page Settings

### URL: `/sessions/:id/settings`

**Public Page Customization:**

**Sections:**

1. **Event Information**
   - Event name
   - Description (rich text)
   - Cover image
   - Event type (conference, meetup, workshop, ...)

2. **Branding**
   - Primary color
   - Secondary color
   - Logo upload
   - Custom CSS (advanced)

3. **Registration Settings**
   - Registration open/closed
   - Registration deadline
   - Require approval (admin must approve each registration)
   - Registration form fields (custom fields TODO)

4. **Social Sharing**
   - OG image
   - Meta description
   - Twitter card

5. **Domain (Enterprise feature)**
   - Custom domain (events.yourcompany.com)
   - CNAME setup

**Endpoint:** Part of session update (`PUT /sessions/:sessionId`)

---

## 🔧 Advanced Features

### 1. Session Defaults

**URL:** Admin settings (global)

**Admin může nastaviť default hodnoty:**
- Default round duration (minutes)
- Default gap between rounds (minutes)
- Default number of rounds
- Default max participants
- Default group size

**Endpoint:** `PUT /admin/parameters`

**Benefit:**
- Rýchlejšie vytváranie sessions
- Konzistentné nastavenia

---

### 2. System Parameters

**URL:** Admin settings (global)

**Parametres:**
- Confirmation window (minutes before round start)
- Safety window (additional buffer)
- Walking time (expected time to reach meeting point)
- Notification timing (early, late)
- Minimal time to first round (prevent last-minute sessions)

**Endpoint:** `PUT /admin/parameters`

---

### 3. Ice Breaker Library

**Predefined Questions:**
- Personal (hobby, travel, books, ...)
- Professional (projects, skills, goals, ...)
- Fun (superpowers, time travel, ...)

**Custom Questions:**
- Admin môže pridať vlastné
- Shared across sessions (reusable)

**Endpoint:** `GET /ice-breakers`

---

## 🚀 Workflow Example

**Typical Organizer Workflow:**

1. **Sign up** → Create account
2. **Account settings** → Set profile, logo
3. **Create session** → Fill basic info
4. **Add rounds** → Set dates & times
5. **Configure teams** → Add "Engineering", "Product", "Design"
6. **Configure topics** → Add "AI", "Web3", "Cloud"
7. **Add meeting points** → "Main Entrance", "Coffee Bar"
8. **Add ice breakers** → Select from library
9. **Publish session** → Status = published
10. **Share link** → oliwonder.com/techevents
11. **Monitor registrations** → Participant Management
12. **Day of event:**
    - Check participants confirmed
    - Monitor check-ins
    - View matches
    - Review contact exchanges
13. **After event:**
    - Export participant list
    - Send thank you email
    - Analyze metrics

---

## 🐛 Common Admin Tasks

### 1. Manually Add Participant (TODO)
- Admin vstúpi na Participant Management
- Klikne "+ Add participant"
- Vyplní email, name
- Vyberie rounds
- System pošle invitation email

### 2. Cancel Registration (TODO)
- Admin nájde participanta
- Klikne "Remove"
- Confirm modal
- Participant je odstránený
- System pošle cancellation email

### 3. Change Participant Status (TODO)
- Admin klikne na participant
- Zmení status dropdown
- System zapíše audit log
- Participant dostane email (optional)

### 4. Resend Invitation (TODO)
- Admin klikne "Resend email"
- System pošle nový magic link
- Nový token generovaný (optional)

### 5. Export Data
- Admin klikne "Export"
- Vyberie formát (CSV, Excel)
- Download file
- Contains: names, emails, phones, teams, topics, statuses

---

## 🔒 Permissions & Roles (Future)

**Current:** Single organizer per account

**Planned:**
- **Owner** - Full access
- **Admin** - Manage sessions & participants
- **Editor** - Edit sessions only
- **Viewer** - Read-only access

**Team Collaboration:**
- Invite team members
- Assign roles
- Activity log per user

---

## 📈 Success Metrics

**KPIs for Organizers:**

1. **Registration Rate**
   - Views vs Registrations
   - Conversion funnel

2. **Confirmation Rate**
   - Registered vs Confirmed
   - Target: >80%

3. **Show-up Rate**
   - Confirmed vs Checked-in
   - Target: >90%

4. **Matching Success**
   - Matched vs No-match
   - Target: >95%

5. **Contact Exchange**
   - Met vs Shared contacts
   - Networking quality indicator

---

## 💡 Tips & Best Practices

### For Better Matching Results:

1. **Enable Teams** - Cross-team networking creates diversity
2. **Set Topics** - Similar interests = better conversations
3. **Optimal Group Size** - 2-3 people work best
4. **Multiple Rounds** - More networking opportunities
5. **Clear Meeting Points** - Reduce check-in time
6. **Good Ice Breakers** - Help break the ice quickly

### For Higher Show-up Rates:

1. **Send Reminders** - 24h, 1h before event
2. **Clear Instructions** - Meeting point, time, duration
3. **Enable Notifications** - SMS/Email alerts
4. **Confirmation Window** - 30-60 minutes before works best
5. **Buffer Time** - Account for late arrivals

### For Better Participant Experience:

1. **Test Registration Flow** - Try it yourself first
2. **Upload Meeting Point Photos** - Visual helps
3. **Quality Ice Breakers** - Engaging questions
4. **Realistic Timing** - Don't rush rounds
5. **Follow-up Email** - Thank participants, share contacts

---

## 🎯 Roadmap

**Q1 2026:**
- ✅ Core session management
- ✅ Participant dashboard
- ✅ Matching algorithm
- ✅ Contact sharing

**Q2 2026:**
- 🔄 Email notifications (Resend)
- 🔄 SMS notifications (Twilio)
- 🔄 Payment integration (Stripe)
- 📋 Advanced analytics

**Q3 2026:**
- 📋 Team collaboration
- 📋 Custom domains
- 📋 White-label option
- 📋 Mobile app

**Q4 2026:**
- 📋 AI-powered matching
- 📋 Real-time chat during events
- 📋 Post-event surveys
- 📋 CRM integration

---

## 📞 Support

**For Organizers:**
- 📧 Email: support@oliwonder.com
- 💬 Live chat (TODO)
- 📖 Help center (TODO)
- 🎥 Video tutorials (TODO)

**Resources:**
- Getting started guide
- Best practices
- Template library
- Community forum (TODO)
