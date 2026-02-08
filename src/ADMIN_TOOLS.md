# Admin Tools - Okamžité riešenie problémov

## Participant Status System

Každá registrácia participanta má **participant status** ktorý sleduje celý lifecycle:

### Statusy a ich význam:
- **Verification pending** 🟠 - Čaká na potvrdenie emailu
- **Registered** ⚪ - Email potvrdený, čaká na round
- **Waiting for confirmation** 🔵 - T-5 min, participant musí potvrdiť účasť (automatický status)
- **Confirmed** 🟢 - Participant potvrdil svoju účasť
- **Unconfirmed** 🟡 - Participant nepotvrdil účasť včas
- **Cancelled** 🔴 - Participant zrušil registráciu
- **Met** 🔵 - Bol na rounde a bol matched
- **Missed** 🔴 - Neprišiel na round
- **Left alone** 🟠 - Prišiel ale nebol matched

**Participant Dashboard zobrazuje VŠETKY statusy** - participant vidí kompletnú históriu vrátane cancelled/missed rounds.

**Detailná dokumentácia:** Pozri `/PARTICIPANT_STATUS_SYSTEM.md`

---

## Problém: Nemáš email ale si registrovaný

### Riešenie 1: Pošli si Magic Link (NAJRÝCHLEJŠIE)

Na stránke `oliwonder.com/andyhokonfera` klikni na button **"🔗 Send Magic Link"**

1. Zadaj email: `andy.double.a@gmail.com`
2. Počkaj na potvrdenie
3. Skontroluj inbox (aj SPAM)
4. Klikni na magic link v emaili
5. Dostaneš sa na My Rounds!

**Console script (alternatívne):**
```javascript
// Skopíruj a vlož do browser console
(async () => {
  const projectId = 'dqoybysbooxngrsxaekd';
  const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxb3lieXNib294bmdyc3hhZWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkyNTEwNDcsImV4cCI6MjA0NDgyNzA0N30.N1yT_c-xhHQD9xHEqppNNEwxQZJLl2fKEjLVZ-TTWGE';
  
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/send-magic-link`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: 'andy.double.a@gmail.com' 
      }),
    }
  );
  
  const result = await response.json();
  console.log('Result:', result);
  
  if (response.ok) {
    alert('✅ Magic link sent! Check andy.double.a@gmail.com inbox!');
  } else {
    alert('❌ Error: ' + (result.error || 'Unknown error'));
  }
})();
```

---

### Riešenie 2: Vymaž registráciu a zaregistruj sa znova

**Vymaž VŠETKY registrácie:**
```javascript
(async () => {
  const projectId = 'dqoybysbooxngrsxaekd';
  const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxb3lieXNib294bmdyc3hhZWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkyNTEwNDcsImV4cCI6MjA0NDgyNzA0N30.N1yT_c-xhHQD9xHEqppNNEwxQZJLl2fKEjLVZ-TTWGE';
  
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/delete-registration`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: 'andy.double.a@gmail.com'
        // Bez roundId vymaže VŠETKY registrácie
      }),
    }
  );
  
  const result = await response.json();
  console.log('Result:', result);
  
  if (response.ok) {
    // Vymaž aj localStorage
    localStorage.clear();
    alert('✅ All registrations deleted! localStorage cleared!\n\nNow you can register again.');
    // Refresh page
    window.location.reload();
  } else {
    alert('❌ Error: ' + (result.error || 'Unknown error'));
  }
})();
```

**Vymaž konkrétny round:**
```javascript
(async () => {
  const projectId = 'dqoybysbooxngrsxaekd';
  const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxb3lieXNib294bmdyc3hhZWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkyNTEwNDcsImV4cCI6MjA0NDgyNzA0N30.N1yT_c-xhHQD9xHEqppNNEwxQZJLl2fKEjLVZ-TTWGE';
  
  const roundId = '1730543034646-09:55'; // ZMEŇ NA KONKRÉTNE ROUND ID
  
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/delete-registration`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: 'andy.double.a@gmail.com',
        roundId: roundId
      }),
    }
  );
  
  const result = await response.json();
  console.log('Result:', result);
  
  if (response.ok) {
    alert('✅ Registration deleted for round: ' + roundId);
  } else {
    alert('❌ Error: ' + (result.error || 'Unknown error'));
  }
})();
```

---

## Ako nájsť Round ID

Ak potrebuješ zmazať konkrétny round, musíš nájsť jeho ID:

```javascript
// Skopíruj a vlož do browser console
(async () => {
  const projectId = 'dqoybysbooxngrsxaekd';
  const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxb3lieXNib294bmdyc3hhZWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkyNTEwNDcsImV4cCI6MjA0NDgyNzA0N30.N1yT_c-xhHQD9xHEqppNNEwxQZJLl2fKEjLVZ-TTWGE';
  
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/public/user/andyhokonfera`,
    {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  const result = await response.json();
  
  console.log('Sessions:', result.sessions);
  
  // Zobraz všetky rounds
  result.sessions.forEach(session => {
    console.log(`\nSession: ${session.name}`);
    session.rounds.forEach(round => {
      console.log(`  Round: ${round.roundName}`);
      console.log(`  Round ID: ${round.roundId}`);
    });
  });
})();
```

---

## Po vymazaní registrácie

1. **Vymaž localStorage:**
   ```javascript
   localStorage.clear();
   ```

2. **Refresh stránku:**
   ```javascript
   window.location.reload();
   ```

3. **Zaregistruj sa znova**
   - Choď na `oliwonder.com/andyhokonfera`
   - Vyplň formulár
   - Tentokrát by mal prísť email (po deploy novej verzie)

---

## Overenie či máš token

```javascript
const token = localStorage.getItem('oliwonder_participant_token');
if (token) {
  console.log('✅ Token exists:', token);
} else {
  console.log('❌ No token in localStorage');
}
```

---

## Prečo emaily nefungovali

**Hlavný problém:** Build version je starý (2025-11-04T21:00:00Z)

Všetky moje opravy sa ešte **NEDEPLOYLI** do production!

**Riešenie:**
1. Počkaj na nový deploy (automatický)
2. Alebo manuálne redeploy Supabase Edge Function
3. Zatiaľ použi admin tools vyššie

---

## Kontakt s podporou

Ak nič nefunguje, napíš mi:
- Console output z "Send Magic Link"
- Console output z "Delete Registration"
- Screenshot z Gmail (ak email prišiel)