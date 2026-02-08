# Administračné rozhranie - Oliwonder

## Prístup k administračnému rozhraniu

### 1. Admin práva
Na prístup k administračnému rozhraniu potrebujete admin práva. Admin používatelia sú definovaní v server kóde (`/supabase/functions/server/index.tsx`):

```typescript
const adminEmails = ['admin@oliwonder.com', 'support@oliwonder.com'];
```

### 2. Ako sa dostať k admin rozhraniu

#### Krok 1: Registrácia/Prihlásenie
1. Vytvorte si účet s admin email adresou (`admin@oliwonder.com` alebo `support@oliwonder.com`)
2. Alebo si zmeňte existujúci účet na admin email

#### Krok 2: Prístup k admin panelu
1. Prihláste sa do aplikácie s admin email adresou
2. Po úspešnom prihlásení uvidíte v header-i tlačidlo **"Admin Panel"**
3. Kliknite na "Admin Panel" pre vstup do administračného rozhrania

### 3. Funkcie administračného rozhrania

#### 📊 Dashboard s štatistikami
- **Total users** - celkový počet zaregistrovaných používateľov
- **Confirmed users** - počet používateľov s potvrdeným emailom
- **New this week** - noví používatelia za posledný týždeň
- **Active sessions** - aktívne sessions (pripravované)

#### 👥 Správa používateľov
- **Zobrazenie všetkých používateľov** v tabuľke
- **Filtrovanie a vyhľadávanie** podľa email, URL slug, role, company size
- **Detailný pohľad** na jednotlivých používateľov
- **Editácia používateľov** - zmena email, URL slug, role, company size
- **Mazanie používateľov** s potvrdením
- **Export do CSV** - export všetkých používateľov

#### 🔍 Informácie o používateľoch
Pre každého používateľa vidíte:
- Email adresu
- URL slug (oliwonder.com/[slug])
- Rolu v spoločnosti
- Veľkosť spoločnosti
- Zdroj objavenia aplikácie
- Dátum registrácie
- Posledné prihlásenie
- Stav potvrdenia emailu

### 4. Bezpečnosť

#### Backend ochrana
- Všetky admin endpointy sú chránené `requireAdmin` middleware
- Kontrola admin email adresy na server strane
- Validácia access token pre každý request

#### Frontend ochrana
- "Admin Panel" tlačidlo sa zobrazuje len admin používateľom
- Kontrola admin práv v `isAdminUser()` funkcii

### 5. API Endpointy (pre admin)

```
GET /make-server-ce05600a/admin/users - Zoznam všetkých používateľov
GET /make-server-ce05600a/admin/users/:userId - Detail používateľa  
PUT /make-server-ce05600a/admin/users/:userId - Aktualizácia používateľa
DELETE /make-server-ce05600a/admin/users/:userId - Zmazanie používateľa
GET /make-server-ce05600a/admin/stats - Administračné štatistiky
```

### 6. Pridanie nového admin používateľa

Pre pridanie nového admin používateľa:

1. **Server strana** - upravte pole `adminEmails` v `/supabase/functions/server/index.tsx`:
```typescript
const adminEmails = [
  'admin@oliwonder.com', 
  'support@oliwonder.com',
  'novy-admin@oliwonder.com'  // Pridajte nový email
];
```

2. **Redeploy server** - zmeny sa prejavia po redeploy server funkcie

### 7. Troubleshooting

#### Admin panel sa nezobrazuje
- Skontrolujte, či ste prihlásení s admin email adresou
- Overte, že admin email je v zozname `adminEmails` na serveri
- Skontrolujte browser konzolu pre chyby

#### API volania zlyhávajú
- Overte, že máte platný access token
- Skontrolujte, či admin email má správne práva na serveri
- Skontrolujte network tab v browser devtools

---

**Poznámka:** Admin rozhranie je určené len pre administrátorov aplikácie. Neposielaj admin prihlasovacie údaje nikomu tretiemu.