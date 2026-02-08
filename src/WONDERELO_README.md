# Wonderelo - Networking Events Platform

## 🎯 Čo je Wonderelo?

Wonderelo je webová platforma pre organizátorov eventov, ktorá umožňuje vytvárať a spravovať networking sessions s pokročilými funkciami pre matching participantov.

**Deployed URL:** https://www.oliwonder.com

## ✨ Hlavné Features

### Pre Organizátorov:
- ✅ **Session Management** - Vytváranie networking sessions s nastaviteľnými parametrami
- ✅ **Multi-day Sessions** - Podpora eventov s viacerými dňami a roundmi
- ✅ **Participant Management** - Prehľad a správa registrovaných participantov
- ✅ **Dashboard so štatistikami** - Real-time prehľad statusov a audit log
- ✅ **Email verifikácia** - Bezpečný systém na zmenu emailu s dvojstupňovou verifikáciou
- ✅ **Teams & Topics** - Networking "within team" alebo "across teams"
- ✅ **Meeting Points** - Definovanie stretávacích miest s fotkami
- ✅ **Ice Breakers** - Otázky na rozbehnutie konverzácie

### Pre Participantov:
- ✅ **Unique Token System** - Každý participant má unikátny permanentný token
- ✅ **Live Countdown Timers** - Odpočty do začiatku roundov
- ✅ **Attendance Confirmation** - Potvrdenie účasti pred začiatkom roundu
- ✅ **Smart Matching** - Sofistikovaný algoritmus s scoring systémom:
  - Meeting memory (30 bodov) - preferencia tých, čo sa ešte nestretli
  - Teams matching (20 bodov) - podľa nastavenia within/across teams
  - Topics matching (10 bodov) - podobné záujmy
- ✅ **Match Flow** - Krok-po-kroku proces stretnutia:
  1. `/match` - Informácie o meeting pointe + "I am here"
  2. `/match-partner` - Identifikácia partnera s číslami
  3. `/networking` - Icebreakers + contact sharing
- ✅ **Contact Sharing** - Výmena kontaktov len ak obe strany súhlasia
- ✅ **No-match handling** - Odd participant sa pridá do existujúcej skupiny

### Platobný Systém (Planned):
- 💳 **Stripe Integration**
  - Jednorazová platba za event
  - Mesačný Premium subscription
- 📊 **Pricing Tiers** (podľa počtu participantov):
  - Free: do 10 participantov
  - Paid: 50, 200, 500, 1000, 5000+ participantov

## 🛠 Tech Stack

### Frontend:
- **React** + TypeScript
- **React Router** - Client-side routing
- **Tailwind CSS v4** - Styling
- **Zustand** - State management
- **Shadcn/ui** - UI komponenty
- **Lucide React** - Ikony

### Backend:
- **Supabase Edge Functions** (Deno runtime)
- **Hono** - Web framework
- **Supabase Auth** - Autentifikácia organizátorov
- **Supabase KV Store** - Key-Value databáza

### Architecture:
```
Frontend (React) → Server (Hono) → Database (KV Store)
```

## 📱 Status Flow Participanta

```
registered → confirmed → matched → checked-in → met
     ↓           ↓          ↓
unconfirmed  no-match   missed/left-alone
```

## 🚀 Ako spustiť lokálne

### Prerequisites:
- Node.js 18+
- npm alebo yarn
- Supabase CLI (pre backend development)

### Frontend:
```bash
npm install
npm run dev
```

### Backend (Supabase Functions):
```bash
# V adresári /supabase/functions/server/
supabase functions serve make-server-ce05600a
```

## 🔑 Environment Variables

Backend má preddefinované secrets:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (pre emaily)
- `STRIPE_SECRET_KEY` (pre platby)
- `TWILIO_*` / `VONAGE_*` (pre SMS notifikácie)

## 📁 Projekt Štruktúra

```
/
├── components/          # React komponenty
│   ├── Dashboard.tsx
│   ├── SessionForm.tsx
│   ├── ParticipantDashboard.tsx
│   ├── MatchInfo.tsx
│   ├── MatchPartner.tsx
│   ├── MatchNetworking.tsx
│   └── ...
├── supabase/
│   └── functions/
│       └── server/      # Backend moduly
│           ├── index.tsx
│           ├── matching.tsx
│           ├── route-participants.tsx
│           ├── route-registration.tsx
│           └── ...
├── styles/
│   └── globals.css      # Tailwind CSS
└── App.tsx / AppRouter.tsx
```

## 📖 Ďalšia Dokumentácia

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technická architektúra
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API referencia
- [PARTICIPANT_FLOW.md](./PARTICIPANT_FLOW.md) - User journey participanta
- [ORGANIZER_FEATURES.md](./ORGANIZER_FEATURES.md) - Organizer funkcionalita

## 🎨 UI/UX Princípy

- **Angličtina** - Všetky texty
- **Sentence case** - Len prvé slovo má veľké začiatočné písmeno
- **Live updates** - Real-time countdown timers a status updates
- **Responsive** - Funguje na mobile aj desktop
- **Toast notifications** - User feedback pre akcie

## 📅 Verzia

**Current Version:** 7.2.1-ultra-safe-logging
**Last Updated:** 2026-02-07

## 👥 Kontakt

Vytvoril: Andy & Claude
Web: https://www.oliwonder.com
