# Email Setup Guide

## Resend API Integration

Aplikácia používa [Resend](https://resend.com) na posielanie emailov participantom.

### ⚠️ TESTING MODE

**Aplikácia je momentálne v TESTING MODE:**
- Všetky emaily sa posielajú na `andy.double.a@gmail.com` namiesto skutočných príjemcov
- Subject a body obsahujú informáciu o pôvodnom príjemcovi
- Toto je kvôli Resend limitácii - bez overenej domény môžeš posielať len na vlastný email

**Ako vypnúť testing mode:**
1. Overiť doménu v Resend dashboard ([resend.com/domains](https://resend.com/domains))
2. Upraviť `from` adresu z `delivered@resend.dev` na `your-email@your-domain.com`
3. V súbore `/supabase/functions/server/index.tsx` nájsť všetky výskyty `const TESTING_MODE = true;`
4. Zmeniť na `const TESTING_MODE = false;` (4 miesta v kóde)

### Prečo Resend?

- ✅ Jednoduchá integrácia
- ✅ 100 emailov/deň zdarma
- ✅ Dobrá deliverability
- ✅ Developer-friendly API

### Nastavenie (5 minút)

1. **Vytvor Resend účet**
   - Choď na [resend.com/signup](https://resend.com/signup)
   - Zaregistruj sa (môžeš použiť GitHub)

2. **Získaj API kľúč**
   - Po prihlásení choď do [API Keys](https://resend.com/api-keys)
   - Klikni "Create API Key"
   - Pomenuj ho napr. "Oliwonder Development"
   - Skopíruj API kľúč (začína `re_...`)

3. **Nastav environment variable**
   - API kľúč už môžeš nahrať cez modal ktorý sa práve zobrazil
   - Alebo ho pridaj neskôr v Settings

4. **Overiť doménu (voliteľné pre development, povinné pre production)**
   - Pre development môžeš posielať z `delivered@resend.dev` (ale len na vlastný email!)
   - Pre production musíš overiť svoju doménu v Resend dashboard
   - Po overení domény nezabudni vypnúť TESTING_MODE (viď vyššie)

### Ako to funguje

Aplikácia posiela 3 typy emailov:

**1. Email verification (pre nových participantov bez tokenu v localStorage)**
- Posiela sa keď participant registruje prvý krát alebo nemá token v localStorage
- Obsahuje verification link na potvrdenie emailu
- Link expiruje po 48 hodinách
- Po kliknutí na link sa participant dostane na My Rounds stránku

**2. Registration confirmation email (pre existujúcich participantov s tokenom)**
- Posiela sa po úspešnej registrácii na rounds
- Obsahuje zoznam registered rounds
- Obsahuje magic link na My Rounds stránku
- Obsahuje event link
- Posiela sa keď má participant token v localStorage z predchádzajúcej registrácie

**3. Magic link email**
- Posiela sa keď participant klikne "Manage my registrations"
- Obsahuje bezpečný link na prístup k My Rounds stránke
- Token je unikátny pre každého participanta

### Development bez API kľúča

Ak nemáš nastavený `RESEND_API_KEY`:
- Emaily sa nebudú skutočne posielať
- Obsah emailu sa vypíše do console.log
- Magic link sa vráti v API response pre testovanie

### Testovanie

Po nastavení API kľúča:

1. Zaregistruj sa na nejaký round s tvojím emailom
2. Skontroluj svoju mailovú schránku
3. Skús kliknúť na magic link v emaili
4. Overiť že vidíš My Rounds stránku

### Troubleshooting

**Email neprišiel?**
- Skontroluj spam folder
- Skontroluj Resend logs: [resend.com/emails](https://resend.com/emails)
- Skontroluj že API kľúč je správne nastavený
- Skontroluj server logs v Supabase

**Chyba "403 Forbidden"?**
- Skontroluj že API kľúč je platný
- Vytvor nový API kľúč v Resend dashboard

**Deliverability problémy?**
- Pre production over svoju doménu v Resend
- Nastav SPF a DKIM records
- Nepoužívaj `noreply@` adresu (je to anti-pattern)

### Náklady

- **Free tier**: 100 emailov/deň, 3,000/mesiac
- **Pro tier**: $20/mesiac za 50,000 emailov
- Pre väčšinu eventov by mal free tier úplne stačiť

### Alternatívy

Ak nechceš používať Resend, môžeš použiť:
- **SendGrid** - väčší free tier (100/deň)
- **Mailgun** - dobrý pre vysoký objem
- **Amazon SES** - najlacnejšie pre production

Stačí upraviť fetch request v `/supabase/functions/server/index.tsx` (vyhľadaj "resend.com/emails").
