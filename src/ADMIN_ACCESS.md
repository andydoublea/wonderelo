# Administračné rozhranie - Wonderelo

## Prístup k administračnému rozhraniu

### 1. Admin práva
Admin status je určený stĺpcom `role` v tabuľke `organizer_profiles` v databáze. Hodnota `'admin'` znamená admin prístup, `'organizer'` je bežný používateľ.

### 2. Ako sa dostať k admin rozhraniu

1. Prihláste sa do aplikácie s účtom, ktorý má `role = 'admin'` v databáze
2. Po úspešnom prihlásení uvidíte v header-i tlačidlo **"Admin Panel"**
3. Kliknite na "Admin Panel" pre vstup do administračného rozhrania

### 3. Správa admin používateľov

Admin používatelia sa spravujú cez Admin Panel:

1. Otvorte **Admin Panel → Organizers**
2. Použite tlačidlo **"Admins only"** na filtrovanie len adminov
3. Rozbaľte používateľa a kliknite **"Make admin"** / **"Remove admin"**

Backend endpoint: `PUT /admin/users/:userId/role` — overuje, že žiadateľ je admin a neumožňuje odstrániť vlastný admin prístup.

### 4. Bezpečnosť

#### Backend ochrana
- Endpoint pre zmenu role overuje admin prístup žiadateľa v databáze
- Admin nemôže odstrániť svoj vlastný admin prístup
- Validácia access token pre každý request

#### Frontend ochrana
- "Admin Panel" tlačidlo sa zobrazuje len používateľom s `role === 'admin'`
- Kontrola admin práv v `isAdminUser()` funkcii (čítá z profilu v databáze)

### 5. Troubleshooting

#### Admin panel sa nezobrazuje
- Skontrolujte, či má váš účet `role = 'admin'` v tabuľke `organizer_profiles`
- Skúste sa odhlásiť a znova prihlásiť (role sa načíta pri prihlásení)
- Skontrolujte browser konzolu pre chyby

---

**Poznámka:** Admin rozhranie je určené len pre administrátorov aplikácie.
