# Wonderelo - API Documentation

**Base URL:** `https://{projectId}.supabase.co/functions/v1/make-server-ce05600a`

**Authentication:**
- Organizer endpoints: `Authorization: Bearer {accessToken}` (Supabase session token)
- Participant endpoints: `Authorization: Bearer {publicAnonKey}` (Supabase public key)

---

## 🔐 Authentication Endpoints

### POST `/signup`
Create new organizer account.

**Request:**
```json
{
  "email": "organizer@example.com",
  "password": "securePassword123",
  "organizerName": "TechEvents Inc",
  "urlSlug": "techevents"
}
```

**Response:**
```json
{
  "success": true,
  "user": { "id": "...", "email": "..." },
  "accessToken": "eyJ...",
  "urlSlug": "techevents"
}
```

---

### POST `/signin`
Sign in organizer.

**Request:**
```json
{
  "email": "organizer@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "user": { "id": "...", "email": "..." },
  "accessToken": "eyJ...",
  "urlSlug": "techevents"
}
```

---

### GET `/profile`
Get organizer profile.

**Headers:** `Authorization: Bearer {accessToken}`

**Response:**
```json
{
  "success": true,
  "profile": {
    "userId": "...",
    "email": "organizer@example.com",
    "organizerName": "TechEvents Inc",
    "urlSlug": "techevents",
    "phone": "+421...",
    "website": "https://...",
    "description": "...",
    "profileImageUrl": "https://...",
    "role": "organizer",
    "createdAt": "2026-02-07T10:00:00Z",
    "updatedAt": "2026-02-07T11:00:00Z"
  }
}
```

---

### PUT `/profile`
Update organizer profile.

**Headers:** `Authorization: Bearer {accessToken}`

**Request:**
```json
{
  "organizerName": "New Name",
  "urlSlug": "newslug",
  "phone": "+421123456789",
  "website": "https://example.com",
  "description": "...",
  "profileImageUrl": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "profile": { /* updated profile */ }
}
```

---

## 📅 Session Management Endpoints

### GET `/sessions`
Get all sessions for organizer.

**Headers:** `Authorization: Bearer {accessToken}`

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "session-123",
      "userId": "...",
      "name": "Summer Tech Meetup",
      "description": "...",
      "date": "2026-06-15",
      "status": "published",
      "limitParticipants": true,
      "maxParticipants": 50,
      "groupSize": 2,
      "enableTeams": true,
      "matchingType": "across-teams",
      "teams": ["Engineering", "Product", "Design"],
      "enableTopics": true,
      "topics": ["AI", "Web3", "Cloud"],
      "meetingPoints": [
        { "id": "mp1", "name": "Main Entrance", "imageUrl": "..." }
      ],
      "iceBreakers": ["What's your favorite hobby?", "..."],
      "rounds": [
        {
          "id": "round-1",
          "name": "Round 1",
          "date": "2026-06-15",
          "startTime": "14:00",
          "duration": 15,
          "groupSize": 2,
          "status": "scheduled"
        }
      ],
      "createdAt": "2026-02-07T10:00:00Z",
      "updatedAt": "2026-02-07T11:00:00Z"
    }
  ]
}
```

---

### POST `/sessions`
Create new session.

**Headers:** `Authorization: Bearer {accessToken}`

**Request:**
```json
{
  "name": "Summer Tech Meetup",
  "description": "Networking for tech professionals",
  "date": "2026-06-15",
  "status": "draft",
  "limitParticipants": true,
  "maxParticipants": 50,
  "groupSize": 2,
  "enableTeams": true,
  "matchingType": "across-teams",
  "teams": ["Engineering", "Product"],
  "enableTopics": true,
  "topics": ["AI", "Web3"],
  "meetingPoints": [
    { "id": "mp1", "name": "Main Entrance" }
  ],
  "iceBreakers": ["What's your favorite hobby?"],
  "rounds": []
}
```

**Response:**
```json
{
  "success": true,
  "session": { /* created session */ }
}
```

---

### PUT `/sessions/:sessionId`
Update session.

**Headers:** `Authorization: Bearer {accessToken}`

**Request:** (same as POST, partial updates allowed)

**Response:**
```json
{
  "success": true,
  "session": { /* updated session */ }
}
```

---

### DELETE `/sessions/:sessionId`
Delete session.

**Headers:** `Authorization: Bearer {accessToken}`

**Response:**
```json
{
  "success": true,
  "message": "Session deleted"
}
```

---

## 👥 Public Endpoints

### GET `/public/user/:slug`
Get organizer public page with published sessions.

**No authentication required**

**Response:**
```json
{
  "success": true,
  "user": {
    "organizerName": "TechEvents Inc",
    "urlSlug": "techevents",
    "profileImageUrl": "...",
    "website": "...",
    "description": "...",
    "email": "...",
    "id": "..."
  },
  "sessions": [ /* published sessions only */ ]
}
```

---

## 🎫 Participant Registration Endpoints

### POST `/register-participant`
Register participant for session rounds.

**Headers:** `Authorization: Bearer {publicAnonKey}`

**Request:**
```json
{
  "userSlug": "techevents",
  "participant": {
    "email": "participant@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+421123456789"
  },
  "sessions": [
    {
      "sessionId": "session-123",
      "rounds": [
        {
          "roundId": "round-1",
          "selectedTeam": "Engineering",
          "selectedTopics": ["AI", "Web3"],
          "selectedMeetingPoint": "Main Entrance"
        }
      ]
    }
  ],
  "existingToken": "existing-token-if-any"
}
```

**Response:**
```json
{
  "success": true,
  "token": "participant-token-abc123",
  "participantId": "participant-456",
  "isNewParticipant": true,
  "alreadyRegistered": false,
  "requiresVerification": true,
  "newRegistrationsCount": 1,
  "alreadyRegisteredCount": 0,
  "participantData": {
    "email": "participant@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+421123456789"
  }
}
```

---

### POST `/send-registration-email`
Send registration confirmation email.

**Headers:** `Authorization: Bearer {publicAnonKey}`

**Request:**
```json
{
  "email": "participant@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "sessions": [ /* session data */ ],
  "eventUrl": "https://oliwonder.com/techevents",
  "myRoundsUrl": "https://oliwonder.com/p/token-abc",
  "userSlug": "techevents",
  "eventName": "Summer Tech Meetup"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully (mock)"
}
```

---

## 🎯 Participant Dashboard Endpoints

### GET `/p/:token/dashboard`
Get participant dashboard with all registrations.

**Headers:** `Authorization: Bearer {publicAnonKey}`

**Response:**
```json
{
  "success": true,
  "participantId": "participant-456",
  "email": "participant@example.com",
  "phone": "+421123456789",
  "phoneCountry": "+421",
  "firstName": "John",
  "lastName": "Doe",
  "registrations": [
    {
      "participantId": "participant-456",
      "sessionId": "session-123",
      "roundId": "round-1",
      "sessionName": "Summer Tech Meetup",
      "roundName": "Round 1",
      "organizerId": "...",
      "organizerName": "TechEvents Inc",
      "organizerUrlSlug": "techevents",
      "date": "2026-06-15",
      "startTime": "14:00",
      "duration": 15,
      "status": "registered",
      "team": "Engineering",
      "topics": ["AI", "Web3"],
      "meetingPoint": "Main Entrance",
      "matchId": null,
      "matchPartnerNames": [],
      "meetingPointId": null,
      "registeredAt": "2026-02-07T10:00:00Z",
      "confirmedAt": null,
      "checkedInAt": null,
      "metAt": null,
      "lastStatusUpdate": "2026-02-07T10:00:00Z",
      "notificationsEnabled": true
    }
  ],
  "sessions": [ /* full session objects */ ],
  "organizerName": "TechEvents Inc",
  "organizerSlug": "techevents"
}
```

---

### GET `/p/:token`
Get participant basic info.

**Headers:** `Authorization: Bearer {publicAnonKey}`

**Response:**
```json
{
  "success": true,
  "participantId": "participant-456",
  "email": "participant@example.com",
  "phone": "+421123456789",
  "phoneCountry": "+421",
  "firstName": "John",
  "lastName": "Doe",
  "registrations": [ /* array of registrations */ ]
}
```

---

### POST `/p/:token/update-profile`
Update participant profile.

**Headers:** `Authorization: Bearer {publicAnonKey}`

**Request:**
```json
{
  "email": "newemail@example.com",
  "phone": "+421987654321",
  "phoneCountry": "+421",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response:**
```json
{
  "success": true,
  "profile": { /* updated profile */ }
}
```

---

### POST `/p/:token/confirm/:roundId`
Confirm attendance for a round.

**Headers:** `Authorization: Bearer {publicAnonKey}`

**Request:**
```json
{
  "sessionId": "session-123"
}
```

**Response:**
```json
{
  "success": true,
  "status": "confirmed",
  "confirmedAt": "2026-06-15T13:30:00Z",
  "message": "Attendance confirmed successfully"
}
```

---

### POST `/p/:token/notification-preference`
Set notification preference for a round.

**Headers:** `Authorization: Bearer {publicAnonKey}`

**Request:**
```json
{
  "roundId": "round-1",
  "sessionId": "session-123",
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "notificationsEnabled": true
}
```

---

## 🎲 Matching Endpoints

### GET `/participant/:token/match`
Get match information.

**Headers:** `Authorization: Bearer {publicAnonKey}`

**Response:**
```json
{
  "success": true,
  "participantId": "participant-456",
  "matchData": {
    "matchId": "match-abc123",
    "meetingPointName": "Main Entrance",
    "meetingPointImageUrl": null,
    "identificationImageUrl": null,
    "participants": [
      {
        "id": "participant-789",
        "firstName": "Alice",
        "lastName": "Smith",
        "identificationNumber": "123"
      }
    ],
    "roundStartTime": "2026-06-15T14:00:00Z",
    "networkingEndTime": "2026-06-15T14:15:00Z",
    "confirmations": [],
    "choices": []
  }
}
```

**Error (no match):**
```json
{
  "error": "No active match found",
  "reason": "no-match",
  "message": "You could not be matched with other participants"
}
```

---

### POST `/participant/:token/check-in`
Check in at meeting point.

**Headers:** `Authorization: Bearer {publicAnonKey}`

**Request:**
```json
{
  "matchId": "match-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "status": "checked-in",
  "checkedInAt": "2026-06-15T14:00:00Z"
}
```

---

### GET `/participant/:token/match-partner`
Get match partner data with check-in status.

**Headers:** `Authorization: Bearer {publicAnonKey}`

**Response:**
```json
{
  "matchId": "match-abc123",
  "myIdentificationNumber": "2",
  "myName": "John Doe",
  "backgroundImageUrl": null,
  "partners": [
    {
      "id": "participant-789",
      "firstName": "Alice",
      "lastName": "Smith",
      "isCheckedIn": true,
      "identificationNumber": "1"
    }
  ],
  "availableNumbers": [1, 2, 3],
  "shouldStartNetworking": true
}
```

---

### POST `/participant/:token/confirm-match`
Confirm meeting with partner (select their number).

**Headers:** `Authorization: Bearer {publicAnonKey}`

**Request:**
```json
{
  "matchId": "match-abc123",
  "targetParticipantId": "participant-789",
  "selectedNumber": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Match confirmed successfully"
}
```

---

## 🤝 Networking Endpoints

### GET `/participant/:token/networking`
Get networking session data (icebreakers, partners, end time).

**Headers:** `Authorization: Bearer {publicAnonKey}`

**Response:**
```json
{
  "matchId": "match-abc123",
  "roundName": "Round 1",
  "networkingEndTime": "2026-06-15T14:15:00Z",
  "partners": [
    {
      "id": "participant-789",
      "firstName": "Alice",
      "lastName": "Smith",
      "email": "alice@example.com"
    }
  ],
  "iceBreakers": [
    "What's your favorite hobby?",
    "If you could travel anywhere, where would you go?"
  ],
  "myContactSharing": {
    "participant-789": true
  }
}
```

---

### POST `/participant/:token/contact-sharing`
Save contact sharing preferences.

**Headers:** `Authorization: Bearer {publicAnonKey}`

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

**Response:**
```json
{
  "success": true,
  "message": "Contact sharing preferences saved"
}
```

---

## ⚙️ System Endpoints

### GET `/system-parameters`
Get system-wide parameters (public).

**No authentication required**

**Response:**
```json
{
  "confirmationWindowMinutes": 5,
  "safetyWindowMinutes": 6,
  "walkingTimeMinutes": 3,
  "notificationEarlyMinutes": 10,
  "notificationEarlyEnabled": true,
  "notificationLateMinutes": 5,
  "notificationLateEnabled": true
}
```

---

### GET `/session-defaults`
Get default session parameters (public).

**No authentication required**

**Response:**
```json
{
  "roundDuration": 10,
  "numberOfRounds": 1,
  "gapBetweenRounds": 10,
  "maxParticipants": 20,
  "groupSize": 2,
  "limitParticipants": false,
  "limitGroups": false,
  "minimalTimeToFirstRound": 10
}
```

---

### GET `/ice-breakers`
Get default ice breaker questions (public).

**No authentication required**

**Response:**
```json
{
  "questions": [
    "What's your favorite hobby?",
    "If you could travel anywhere, where would you go?",
    "What's the best book you've read recently?",
    "What's your dream project?",
    "What motivates you the most?"
  ]
}
```

---

### GET `/admin/parameters`
Get admin system parameters.

**Headers:** `Authorization: Bearer {accessToken}`

**Response:**
```json
{
  "success": true,
  "parameters": { /* all system parameters */ }
}
```

---

### PUT `/admin/parameters`
Update admin system parameters.

**Headers:** `Authorization: Bearer {accessToken}`

**Request:**
```json
{
  "parameters": {
    "confirmationWindowMinutes": 10,
    "defaultRoundDuration": 15,
    /* ... all parameters ... */
  }
}
```

**Response:**
```json
{
  "success": true,
  "parameters": { /* updated parameters */ }
}
```

---

## 🐛 Debug Endpoints

### GET `/test`
Health check endpoint.

**Response:**
```json
{
  "message": "Backend is working!",
  "timestamp": "2026-02-07T12:00:00Z",
  "version": "7.2.1-ultra-safe-logging"
}
```

---

### GET `/check-slug/:slug`
Check if URL slug is available.

**Response:**
```json
{
  "available": true
}
```

---

### GET `/check-email/:email`
Check if email is available for signup.

**Response:**
```json
{
  "available": false
}
```

---

## ❌ Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing parameters, validation failed)
- `401` - Unauthorized (invalid token)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## 📝 Notes

1. **All timestamps** are in ISO 8601 format (UTC)
2. **Participant tokens** are permanent and tied to email
3. **Status transitions** are enforced by backend logic
4. **Matching** is triggered automatically at T-0 (round start time)
5. **Idempotency** is guaranteed for matching (won't run twice)
6. **Contact sharing** requires mutual consent

---

## 👑 Admin Endpoints

These endpoints require admin privileges (admin email in backend config).

### GET `/admin/users`
Get list of all organizers.

**Headers:** `Authorization: Bearer {accessToken}` (admin only)

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "userId": "...",
      "email": "organizer@example.com",
      "organizerName": "TechEvents Inc",
      "urlSlug": "techevents",
      "createdAt": "2026-02-07T10:00:00Z",
      "lastSignInAt": "2026-02-07T12:00:00Z",
      "emailConfirmed": true
    }
  ]
}
```

---

### GET `/admin/users/:userId`
Get detailed information about specific organizer.

**Headers:** `Authorization: Bearer {accessToken}` (admin only)

**Response:**
```json
{
  "success": true,
  "user": {
    "userId": "...",
    "email": "organizer@example.com",
    "organizerName": "TechEvents Inc",
    "urlSlug": "techevents",
    "phone": "+421...",
    "website": "https://...",
    "description": "...",
    "createdAt": "2026-02-07T10:00:00Z",
    "sessionsCount": 5,
    "participantsCount": 150
  }
}
```

---

### PUT `/admin/users/:userId`
Update organizer information (admin action).

**Headers:** `Authorization: Bearer {accessToken}` (admin only)

**Request:**
```json
{
  "email": "newemail@example.com",
  "urlSlug": "newslug",
  "organizerName": "New Name"
}
```

**Response:**
```json
{
  "success": true,
  "user": { /* updated user */ }
}
```

---

### DELETE `/admin/users/:userId`
Delete organizer account (admin action).

**Headers:** `Authorization: Bearer {accessToken}` (admin only)

**Response:**
```json
{
  "success": true,
  "message": "User deleted"
}
```

---

### GET `/admin/stats`
Get platform-wide statistics.

**Headers:** `Authorization: Bearer {accessToken}` (admin only)

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "confirmedUsers": 120,
    "newThisWeek": 15,
    "totalSessions": 45,
    "activeSessions": 12,
    "totalParticipants": 2500,
    "totalMatches": 1200
  }
}
```

---

## ❌ Error Responses