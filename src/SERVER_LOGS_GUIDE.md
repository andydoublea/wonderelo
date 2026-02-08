# Server logs guide 🔍

## Kde nájsť logy z backendu

### 1. **Browser Console** (najrýchlejšie pre debugging)
Všetky server logy sa zobrazujú v browser konzole pri výskyte chyby:

1. Otvorte **Developer Tools** (F12)
2. Prejdite na záložku **Console**
3. Server logy budú označené prefixom `[ServerLogsViewer]`
4. Konkrétne error logy budú červené

**Príklad:**
```
[ServerLogsViewer] Fetched logs: 50 logs
[ServerLogsViewer] Error response: { error: "..." }
Full error: TypeError: Cannot read property 'key' of undefined
```

---

### 2. **Server Logs Viewer** (real-time monitoring)
Najlepší spôsob na monitoring server logov v reálnom čase:

1. Prejdite na **Admin Panel** → **Debug Tools**
2. Scrollujte dolu na sekciu **"Server logs viewer"**
3. Kliknite na **"Refresh"** pre načítanie logov
4. ALEBO zapnite **"Live"** mode pre automatický refresh každé 2 sekundy

**Features:**
- ✅ Real-time log streaming
- ✅ Filter by level (debug/info/error)
- ✅ Text search
- ✅ Copy logs to clipboard
- ✅ Clear server logs

**Shortcut:**
```
https://your-app.com/admin/debug
```

---

### 3. **Supabase Dashboard** (advanced debugging)
Pre pokročilé debugging priamo v Supabase:

1. Prejdite na [Supabase Dashboard](https://supabase.com/dashboard/project/dqoybysbooxngrsxaekd)
2. V ľavom menu kliknite na **Edge Functions**
3. Vyberte funkciu **`make-server-ce05600a`**
4. Kliknite na záložku **Logs**
5. Tu uvidíte všetky `console.log`, `debugLog`, `errorLog` výstupy

**Výhody:**
- Dlhšia história logov (až 24 hodín)
- Stacktrace pre chyby
- Request/Response detaily
- Performance metriky

---

## Debugging Workflow

### Pre migration endpoint `/admin/fix-participant-keys`:

1. **Spustite migration:**
   - Admin Panel → Participants → kliknite **"Fix participant keys"**

2. **Sledujte logy:**
   - Otvorte Browser Console (F12)
   - Toast notifikácia zobrazí summary
   - Console.log zobrazí `Full result:` s detailmi

3. **Ak je chyba:**
   ```javascript
   // Console ukáže:
   Error response: { error: "...", details: "..." }
   Full error: { ... }
   ```

4. **Detailné logy v Server Logs Viewer:**
   - Prejdite na `/admin/debug`
   - Enable "Live" mode
   - Spustite migration znova
   - Sledujte real-time debug output:
     ```
     🔧 ============================================
     🔧 FIX PARTICIPANT KEYS WITHOUT SESSIONID
     🔧 ============================================
     Found 30 participant keys
     🔍 Old format detected: participant:round123:part456
       ✅ Found sessionId: session789
       📝 Creating new key: participant:session789:round123:part456
       ✅ Fixed!
     ```

5. **Ak potrebujete stacktrace:**
   - Supabase Dashboard → Edge Functions → make-server-ce05600a → Logs
   - Filter by error level

---

## Debug Log Prefixes

Server používa tieto debug prefixes:
- `🔧` - Migration/Fix operations
- `🔍` - Search/Lookup operations
- `✅` - Success operations
- `⚠️` - Warning/Skip operations
- `❌` - Error operations
- `📝` - Write/Update operations

---

## Troubleshooting Tips

### "Fixed 0 participant keys! (Skipped: 0, Errors: 30)"
1. Otvorte Console a pozrite `Full result:`
2. Skontrolujte `results` array pre `status: 'error'` items
3. Každý error má `reason` field

### TypeError v migration
1. Server Logs Viewer → filter text: "TypeError"
2. Pozrite ktorý riadok spôsobil chybu
3. Skontrolujte formát dát v debug logoch pred errorom

### Empty logs v Server Logs Viewer
- Server môže byť v "cold start" - počkajte 2-3 sekundy a refresh
- Alebo logy boli vymazané - spustite operáciu znova s Live mode zapnutým

---

## Fixed Issue

**Problém:**
`getByPrefix` vracal len `values` namiesto objektov s `{ key, value }`

**Fix:**
Vytvoril som novú funkciu `getByPrefixWithKeys` v `/supabase/functions/server/kv_wrapper.tsx`
která vracia objekty s `{ key: string, value: any }`

**Migration endpoint teraz používa:**
```typescript
const allKeys = await kv.getByPrefixWithKeys('participant:');
// Returns: [{ key: "participant:...", value: {...} }, ...]
```

---

## Next Steps

Po spustení migration skontrolujte:
1. ✅ Browser Console pre summary
2. ✅ Server Logs Viewer pre detailné logy
3. ✅ Toast notifikáciu pre počet fixed/skipped/errors
4. ✅ Participant Management pre overenie že participanti sú viditeľní
5. ✅ Organizer Management pre overenie synchronizácie
