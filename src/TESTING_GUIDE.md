# 🧪 TESTING GUIDE - "Confirm Attendance" Fix

## 🎯 ČO TESTOVAŤ

Potrebujem od teba **presný console output** pri potvrdení účasti.

---

## 📋 TESTING STEPS

### 1️⃣ Príprava
1. Otvor participant dashboard
2. Otvor Developer Console (F12)
3. Vyčisti console (Clear button)

### 2️⃣ Test Flow
1. Klikni **"Confirm attendance"** button
2. Počkaj **15 sekúnd** (aby prešli 2-3 periodic refetch cykly)
3. Skopíruj **CELÝ console output**
4. Pošli mi ho

---

## 📊 ČO OČAKÁVAM V CONSOLE

### ✅ SPRÁVNY OUTPUT (fix funguje):

```
=== CONFIRM START ===
Round ID: round-xyz
1. Current status: registered
2. After optimistic update: confirmed
🚀 SENDING CONFIRM REQUEST
📡 RECEIVED RESPONSE: 200
✅ CONFIRM SUCCESS - Backend response: {...}
3. Backend says status: confirmed
🔄 Fetching updated status from backend...
4. After fetchData: confirmed  ← TOTO JE KĽÚČOVÉ!
=== CONFIRM END ===

[Po 5 sekundách - periodic refetch]
(žiadne ďalšie logy, alebo jen normálne refetch bez zmeny statusu)
```

**KĽÚČOVÝ BOD:** Riadok 4 musí ukazovať `confirmed` a musí ostať `confirmed` navždy.

---

### ❌ ZLÝCHAJ OUTPUT (fix nefunguje):

```
=== CONFIRM START ===
...
4. After fetchData: confirmed  ← OK tu
=== CONFIRM END ===

[Po 5-10 sekundách]
4. After fetchData: registered  ← ❌ PROBLÉM! Status sa vrátil!
```

---

## 🔍 DODATOČNÉ INFORMÁCIE

### Backend logy (ak máš prístup):

Hľadaj tieto riadky v backend logs:

**✅ Správne (fix funguje):**
```
🛡️ [PROTECTED] Skipping status update for round {roundId}: current="confirmed" is protected
```

**❌ Zlé (fix nefunguje):**
```
✅ [BACKGROUND UPDATE] Updating round {roundId}: "confirmed" → "registered"
```

---

## 📸 ČO MI POŠLI

1. **Console output** - celý text z console (skopíruj všetko)
2. **UI behavior** - povedz mi:
   - Kedy sa button skryl? (okamžite / po 2s / po 5s)
   - Objavil sa znova? (áno / nie)
   - Ak áno, po akej dobe?
3. **Backend logs** (ak máš prístup) - hľadaj `[PROTECTED]` alebo `[BACKGROUND UPDATE]`

---

## ⏱️ TIMELINE

```
T+0s:  Klikni "Confirm attendance"
       → Button by sa mal okamžite skryť (optimistic update)
       
T+0.5s: Backend response prichádza
       → Console log: "4. After fetchData: confirmed"
       
T+5s:  Prvý periodic refetch
       → Status by mal zostať "confirmed"
       → Button stále skrytý
       
T+10s: Druhý periodic refetch
       → Status by mal zostať "confirmed"
       → Button stále skrytý
       
T+15s: Tretí periodic refetch
       → Status by mal zostať "confirmed"
       → Button stále skrytý
```

**Ak button zostáva skrytý po 15 sekundách → FIX FUNGUJE! ✅**

---

## 🐛 AK FIX NEFUNGUJE

Pošli mi:
1. Celý console output
2. Screenshot / video z UI
3. Email participanta (aby som mohol skontrolovať KV store)
4. Round ID ktorý si testoval

Budem vedieť presne diagnostikovať problém.

---

## 💡 TIPS

- **Nerefreshuj stránku** počas testu (stratil by sa console log)
- **Počkaj celých 15 sekúnd** pred skopírovaním console
- **Neklikaj button viackrát** (to je iný test)
- **Skopíruj VŠETKO** z console, nie len časť

---

## ✅ SUCCESS CRITERIA

**Fix je ÚSPEŠNÝ ak:**
1. ✅ Console riadok 4 ukazuje `confirmed`
2. ✅ Po 15 sekundách status stále `confirmed`
3. ✅ Button sa nikdy neobjaví znova
4. ✅ Backend log obsahuje `[PROTECTED]` message

**Ak všetky 4 body platia → problém je VYRIEŠENÝ! 🎉**
