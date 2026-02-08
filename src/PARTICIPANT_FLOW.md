# Wonderelo - Participant Flow

## 🎯 Complete User Journey

Tento dokument popisuje kompletnú cestu participanta od registrácie až po výmenu kontaktov.

---

## 📝 Fáza 1: Registrácia

### Krok 1.1: Navigácia na Event Page

**URL:** `https://oliwonder.com/{organizerSlug}`

**UI:**
- Organizer profil (meno, popis, foto)
- Zoznam publikovaných sessions
- Pre každú session: názov, dátum, popis, tlačidlo "Register"

**Akcia:** Participant klikne na "Register"

---

### Krok 1.2: Multi-step Registration Form

**URL:** `https://oliwonder.com/{organizerSlug}/register`

#### Step 1: Select Rounds
- Participant vyberie rounds, do ktorých sa chce registrovať
- Môže vybrať z viacerých sessions a ich roundov
- Pre každý round vidí:
  - Názov roundu
  - Dátum a čas
  - Trvanie
  - Meeting points (ak sú definované)

#### Step 2: Authentication Choice (len pre nových)
- **Option A:** "I have an account" → zadá email, dostane magic link
- **Option B:** "I'm new" → vyplní údaje (email, meno, priezvisko, telefón)

#### Step 3: Team & Topics Selection (ak sú povolené)
- Vyberie team (Engineering, Product, Design, ...)
- Vyberie topics (AI, Web3, Cloud, ...)
- Môže vybrať viacero (ak je `allowMultipleTopics: true`)

#### Step 4: Meeting Point Selection
- Pre každý round vyberie meeting point
- Vidí fotky meeting pointov (ak sú nahrané)

#### Step 5: Review & Confirm
- Prehľad všetkých vybraných roundov
- Zhrnutie: teams, topics, meeting points
- Tlačidlo: **"Finalise my registration!"**

**Backend:** `POST /register-participant`

---

### Krok 1.3: Email Verification (len pre nových)

**UI:** "Check your email" stránka

**Process:**
1. Backend pošle verification email
2. Participant klikne na link v emaile
3. Email obsahuje magic link: `https://oliwonder.com/p/{token}`

**Backend:** `POST /send-registration-email`

---

### Krok 1.4: Confirmation

**Pre nových:** Po kliknutí na email link → redirect na dashboard

**Pre existujúcich:** Okamžitý redirect na dashboard

**URL:** `https://oliwonder.com/p/{token}`

---

## 📱 Fáza 2: Dashboard & Waiting

### Krok 2.1: Participant Dashboard

**URL:** `https://oliwonder.com/p/{token}`

**UI Components:**
- **Upcoming rounds** - Rounds kam je registrovaný
- **Live countdown timer** - Odpočet do začiatku roundu
- **Status badge** - Aktuálny status (registered, confirmed, matched, ...)
- **Actions:**
  - "Confirm attendance" button (dostupný pred roundom)
  - "Toggle notifications" switch
  - Link na organizer page
  - Link na profile settings

**Backend:** `GET /p/:token/dashboard`

**Data:**
```typescript
{
  registrations: [
    {
      roundName: "Round 1",
      date: "2026-06-15",
      startTime: "14:00",
      status: "registered", // ← mení sa v čase
      meetingPoint: "Main Entrance",
      team: "Engineering",
      topics: ["AI", "Web3"]
    }
  ]
}
```

---

### Krok 2.2: Confirm Attendance

**Timing:** Participant môže potvrdiť účasť kedykoľvek po registrácii

**UI:**
- Button "Confirm attendance" pri každom rounde
- Po kliknutí → status zmení na "confirmed"
- Button zmizne, zobrazí sa badge "Confirmed ✓"

**Backend:** `POST /p/:token/confirm/:roundId`

**Status Transition:**
```
registered → confirmed
```

**Important:**
- Ak participant nepotvrdí do T-0, status sa zmení na `unconfirmed`
- Matching algoritmus berie do úvahy len `confirmed` participants

---

## 🎯 Fáza 3: Matching (T-0)

### Krok 3.1: Auto-matching Trigger

**Timing:** Presne pri T-0 (round start time)

**Process:**
1. Dashboard endpoint detekuje T-0
2. Asynchronne zavolá `createMatchesForRound()`
3. Matching algoritmus beží na pozadí

**Participant Experience:**
- Dashboard sa automaticky refreshuje (polling každé 3 sekundy)
- Status badge sa zmení z "confirmed" na "matched" alebo "no-match"

---

### Krok 3.2: Matching Algorithm

**Scoring System:**
```
Total Score = Meeting Memory (30) + Teams (20) + Topics (10)
```

**Process:**
1. Získa všetkých `confirmed` participantov
2. Vypočíta scores pre všetky páry
3. Greedy algorithm: opakuj
   - Nájdi best scoring group (size = groupSize)
   - Odstráň participantov z poolu
   - Vytvor match
4. Odd participant handling:
   - Ak ostane 1 participant, pridá ho do najmenšej skupiny

**Outcomes:**
- **matched** - Participant má partnera
- **no-match** - Sólo participant alebo neúspešný matching

**Backend:** `createMatchesForRound()` v `matching.tsx`

---

### Krok 3.3: Auto-redirect na Match Page

**Trigger:** Dashboard detekuje status = "matched"

**Process:**
1. Frontend localStorage check: `matched_shown_{token}_{roundId}`
2. Ak nie je nastavené → redirect
3. Nastaví flag aby sa redirect zobrazil len raz

**Redirect:** `https://oliwonder.com/p/{token}/match`

**Backend:** Status update v `participant_registrations`

---

## 🚶 Fáza 4: Going to Meeting Point

### Krok 4.1: Match Info Page

**URL:** `https://oliwonder.com/p/{token}/match`

**UI:**
- ⏰ **Countdown timer** - Čas do konca networking session
- 🎉 **"We have a match for you!"**
- 📍 **Meeting point:**
  - Názov meeting pointu
  - Foto meeting pointu (ak je)
  - Popis/inštrukcie
- 🔘 **Button: "📍 I am here"**

**Backend:** `GET /participant/:token/match`

**Data:**
```typescript
{
  matchData: {
    matchId: "match-abc123",
    meetingPointName: "Main Entrance",
    meetingPointImageUrl: "https://...",
    participants: [
      { firstName: "Alice", lastName: "Smith" }
    ],
    roundStartTime: "2026-06-15T14:00:00Z",
    networkingEndTime: "2026-06-15T14:15:00Z"
  }
}
```

---

### Krok 4.2: Check-in at Meeting Point

**Akcia:** Participant klikne "I am here"

**Process:**
1. Frontend zavolá `POST /participant/:token/check-in`
2. Backend zmení status na `checked-in`
3. Redirect na `/p/{token}/match-partner`

**Backend:** `POST /participant/:token/check-in`

**Status Transition:**
```
matched → checked-in
```

---

## 👥 Fáza 5: Partner Identification

### Krok 5.1: Match Partner Page

**URL:** `https://oliwonder.com/p/{token}/match-partner`

**UI - Top Section (My ID Card):**
- **"Have this image visible"**
- Veľká karta s:
  - Background gradient/image
  - Veľké číslo (1, 2, alebo 3)
  - Moje meno (John Doe)
- Inštrukcia: "Show this to your networking partner"

**UI - Bottom Section (Partners List):**
- **"Look for"**
- Pre každého partnera:
  - Meno partnera (Alice Smith)
  - Status ikona:
    - ✅ "At meeting point" (ak je checked-in)
    - ⭕ "Not yet arrived" (ak ešte nie je checked-in)
  - Button: **"Confirm you met"**

**Backend:** `GET /participant/:token/match-partner`

**Data:**
```typescript
{
  myIdentificationNumber: "2",
  myName: "John Doe",
  partners: [
    {
      id: "participant-789",
      firstName: "Alice",
      lastName: "Smith",
      isCheckedIn: true,
      identificationNumber: "1"
    }
  ],
  availableNumbers: [1, 2, 3],
  shouldStartNetworking: false
}
```

**Auto-refresh:**
- Polling každé 3 sekundy
- Aktualizuje `isCheckedIn` status partnerov
- Kontroluje `shouldStartNetworking` flag

---

### Krok 5.2: Number Selection

**Akcia:** Participant klikne "Confirm you met" pri partnerovi

**UI:**
- Zobrazí sa 3 tlačidlá s číslami (1, 2, 3)
- Inštrukcia: "Select the number they're showing:"
- Participant vyberie číslo ktoré vidí u partnera

**Backend:** `POST /participant/:token/confirm-match`

**Request:**
```json
{
  "matchId": "match-abc123",
  "targetParticipantId": "participant-789",
  "selectedNumber": 1
}
```

**Status Transition:**
```
checked-in → met
```

**Note:** Momentálne backend akceptuje akékoľvek číslo (TODO: validácia)

---

### Krok 5.3: Auto-redirect na Networking

**Trigger:** `shouldStartNetworking: true`

**Conditions:**
- Všetci participanti sú `checked-in`, **ALEBO**
- Aspoň 2 participanti sú `checked-in`

**Process:**
1. Polling detekuje `shouldStartNetworking: true`
2. Automatický redirect na `/p/{token}/networking`

---

## 💬 Fáza 6: Networking Session

### Krok 6.1: Networking Page

**URL:** `https://oliwonder.com/p/{token}/networking`

**UI - During Session:**

**1. Countdown Timer**
- ⏰ "Networking time remaining"
- Veľký countdown do `networkingEndTime`
- Countdown má callback `onComplete()` ktorý nastaví `isTimeUp: true`

**2. Ice Breakers Section**
- 👥 "Ice breakers"
- Očíslovaný zoznam otázok:
  1. What's your favorite hobby?
  2. If you could travel anywhere, where would you go?
  3. What's the best book you've read recently?
- Zobrazuje sa len **počas** networking (nie po skončení)

**Backend:** `GET /participant/:token/networking`

**Data:**
```typescript
{
  matchId: "match-abc123",
  roundName: "Round 1",
  networkingEndTime: "2026-06-15T14:15:00Z",
  partners: [
    {
      id: "participant-789",
      firstName: "Alice",
      lastName: "Smith",
      email: "alice@example.com"
    }
  ],
  iceBreakers: [
    "What's your favorite hobby?",
    "If you could travel anywhere, where would you go?",
    "What's the best book you've read recently?"
  ],
  myContactSharing: {}
}
```

---

### Krok 6.2: Time is Up!

**Trigger:** Countdown dosiahne 00:00

**UI:**
- ⏰ **Veľký banner:**
  - Emoji: ⏰
  - Veľký text: **"Time is up!"**
  - Podtext: "Great networking session! Now you can exchange contacts."
- Ice breakers section zmizne
- Zobrazí sa Contact Sharing section

---

### Krok 6.3: Contact Sharing

**UI - Contact Sharing Section:**

**Header:**
- "Share your contact information"
- Vysvetlenie: "Choose who you'd like to exchange contact information with."
- **Dôležité upozornenie:** "Contacts will only be shared if both parties agree."

**Partner Cards:**
Pre každého partnera:
- Meno: "Alice Smith"
- Email: "alice@example.com"
- Toggle button:
  - ✅ "Share" (zelený, ak je zapnuté)
  - ❌ "Don't share" (outline, ak je vypnuté)

**Action Buttons:**
1. **"Save preferences"** (primary button)
   - Uloží výber
   - Zavolá backend
   - Redirect na dashboard
2. **"Back to dashboard"** (outline button)
   - Preskoči saving
   - Priamy redirect

**Backend:** `POST /participant/:token/contact-sharing`

**Request:**
```json
{
  "matchId": "match-abc123",
  "preferences": {
    "participant-789": true,
    "participant-101": false
  }
}
```

**Storage:**
```
Key: contact_sharing:match-abc123:participant-456
Value: {
  "participant-789": true,
  "participant-101": false
}
```

---

### Krok 6.4: Return to Dashboard

**Akcia:** Klik na "Save preferences" alebo "Back to dashboard"

**Redirect:** `https://oliwonder.com/p/{token}`

**Dashboard Update:**
- Round status: "met" alebo "completed" (podľa času)
- Zobrazí sa prípadne výmena kontaktov (TODO: implementovať zobrazenie)

---

## 📊 Status Transitions - Complete Flow

```
Registration:
    registered
        ↓ (user clicks "Confirm attendance")
    confirmed

Matching at T-0:
    confirmed
        ↓ (matching algorithm)
    matched / no-match

Meeting:
    matched
        ↓ (user clicks "I am here")
    checked-in

Identification:
    checked-in
        ↓ (user selects partner's number)
    met

Completion:
    met
        ↓ (time passes)
    completed
```

**Alternative Paths:**

```
No Confirmation:
    registered
        ↓ (T-0 passed without confirmation)
    unconfirmed

Solo Participant:
    confirmed
        ↓ (only 1 participant confirmed)
    no-match (reason: "You were the only participant who confirmed attendance")

Missed Round:
    matched
        ↓ (didn't check-in before end time)
    missed
```

---

## 🎯 Key Features

### 1. Unique Token System
- Každý participant má **jeden permanentný token**
- Token je tied to email address
- Token sa používa pre všetky akcie (dashboard, match, networking)

### 2. Live Updates
- Dashboard polling (každé 3 sekundy)
- Status updates v real-time
- Countdown timers

### 3. Auto-redirects
- `matched` → `/match`
- `checked-in` + all partners ready → `/networking`
- Redirects sa dejú len raz (localStorage flags)

### 4. Progressive Disclosure
- Informácie sa zobrazujú postupne
- Participant vidí len to čo potrebuje v danom momente
- Jednoduchý, lineárny flow

### 5. Mutual Consent
- Contact sharing vyžaduje súhlas oboch strán
- Jasné upozornenie v UI
- Backend kontroluje obojstranný súhlas (TODO: implementovať výmenu)

---

## 📱 Mobile Experience

- Všetky stránky sú responsive
- Touch-friendly buttons
- Veľké fonty pre číselné identifikátory
- Optimalizované pre jednu ruku

---

## 🔔 Notifications (Planned)

**Email Notifications:**
- Registration confirmation
- Attendance reminder (T-X minutes)
- Round start notification (T-0)
- Match found notification
- Contact exchange confirmation

**SMS Notifications (Optional):**
- Same as email, via Twilio/Vonage
- Participant môže zapnúť/vypnúť per-round

---

## 🐛 Error Handling

**No Match:**
- Zobrazí sa "No match found" stránka
- Vysvetlenie prečo (solo participant, odd participant)
- Button: "Back to dashboard"

**Invalid Token:**
- Redirect na error page
- Možnosť zadať email pre nový magic link

**Network Errors:**
- Toast notification: "Failed to load data"
- Retry button
- Fallback na cached data (ak je)

---

## ✅ Testing Checklist

Pre každý release otestovať:

- [ ] Registrácia nového participanta
- [ ] Registrácia existujúceho participanta (s token)
- [ ] Potvrdenie účasti
- [ ] Auto-matching at T-0
- [ ] Auto-redirect na /match
- [ ] Check-in at meeting point
- [ ] Partner identification
- [ ] Auto-redirect na /networking
- [ ] Ice breakers zobrazenie
- [ ] Time is up! trigger
- [ ] Contact sharing save
- [ ] No-match scenár (solo participant)
- [ ] Odd participant (pridanie do skupiny)
- [ ] Unconfirmed status (nepotvrdený participant)
