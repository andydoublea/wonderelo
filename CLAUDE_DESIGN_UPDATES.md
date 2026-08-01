# Zmeny na zapracovanie do Claude Design (v06)

Tento dokument zbiera **zámerné odchýlky implementácie od dodaného Claude Design mocku**, ktoré chceme premietnuť späť do Claude Design — aby sa mocky zhodovali s appkou a ďalší export nezaniesol staré rozdiely.

Formát: čo zmeniť · kde v mocku · prečo.

---

## 1. Organizer nav — pridať „Admin panel" do user dropdownu (len pre adminov)

- **Čo:** Do dropdownu pod user chipom (menom) pridať položku **„Admin panel"** medzi „Billing" a oddeľovač pred „Go to homepage". Ikona: osoba/štít. Zobrazuje sa **len administrátorom**, nie bežným organizérom.
- **Kde v mocku:** `design/v06/project/pages/organizer-shared.jsx` — `OrgNav` dropdown (aktuálne: Account settings / Billing / — / Go to homepage / — / Sign out, ~riadky 176–181).
- **Prečo:** Reálna appka má admin rolu; admini potrebujú prístup do admin panelu (správa participantov, organizérov, billing). Mock je pre bežného organizéra, tak ho nezobrazuje — ale kvôli 1:1 parite pre admin pohľad ho treba do mocku doplniť (ideálne ako admin-only variant).

---

## 2. Organizer nav — sticky správanie + priesvitný/blur podklad

- **Čo:** OrgNav je pri scrollovaní **pripnutý hore** (`position: sticky; top: 0`), s priesvitným podkladom (`rgba(251,246,236,.92)`) + `backdrop-filter: blur`. Obsah pri scrolle presvitá pod navom.
- **Kde v mocku:** `organizer-shared.jsx` — `OrgNav` (statický mock scroll nerieši).
- **Prečo:** Menu je vždy dostupné (bežný moderný vzor). Zamýšľané správanie — do mocku doplniť ako poznámku o sticky nave.

---

## 3. Organizer dashboard — ODSTRÁNIŤ „Get started" onboarding checklist

- **Čo:** Z dashboard mocku **odstrániť** celý „🚀 Get started · 1 of 4 steps completed" checklist card (progress bar + 4 kroky Choose URL / Open event page / Create round / Publish round).
- **Kde v mocku:** `design/v06/project/pages/screen-dashboard-merged.jsx` (~riadky 267–297, blok `onboarding`).
- **Prečo:** Túto funkcionalitu nechceme — appka onboarding checklist mať nebude.

---

## 4. Organizer dashboard — pridať live-round monitor (počas bežiaceho roundu)

- **Čo:** Do dashboard mocku pridať **live-round monitor** — banner medzi hero a „Your rounds", ktorý sa zobrazí, keď práve beží round: **countdown ring** (mm:ss + fáza Walking/Finding/Networking), eyebrow „LIVE ROUND MONITOR", „Round report: {názov}", tlačidlo **„Open live monitor →"** a **4-stat strip** (fáza · aktuálny round · počet · celkovo rounds).
- **Kde v mocku:** `screen-dashboard-merged.jsx` — pridať nový podmienený blok (medzi hero a rounds). Vizuál prevzatý z `screen-live-round.jsx` (countdown ring).
- **Prečo:** Organizér vidí priebeh živého roundu priamo na dashboarde bez preklikávania. Zamýšľané.

---

## 5. Round form — date/time picker: pridať pomocné tlačidlá

- **Čo:** V mocku doplniť do popoverov pickerov pomocné tlačidlá: **DateField** → riadok „Today · Clear" pod kalendárom; **TimeField** → „As soon as possible · Clear" popri „Done".
- **Kde v mocku:** `design/v06/project/pages/screen-round-form.jsx` — `DateField` (~154–176) a `TimeField` (~181–216) popovery.
- **Prečo:** Praktické skratky (skok na dnešok, vyčistiť pole, čas „čo najskôr"). Zamýšľané.

---

## 6. DONAVRHNÚŤ: loading / error / timeout stavy (v mocku úplne chýbajú)

Claude Design navrhol len **happy-path** obrazovky. **Loading, error a timeout stavy nie sú navrhnuté** — appka ich preto renderuje starým generickým UI (`min-h-screen bg-background` wrapper + shadcn `animate-spin` spinner / žltý ⚠️ emoji + generický „Error"/„Loading" text). Treba ich donavrhnúť v brand štýle (referencia: auth error-pattern — BigIcon + eyebrow + správa + ghost tlačidlo), potom sa zapracujú do appky.

**A. Matching flow — loading + error/timeout stavy** (`Participant Matching.html` má len 7 happy-path stavov):
- `MatchInfo`: loading spinner + error „Matching is taking longer than expected. Please go back and try again." (timeout).
- `MatchNetworking`: loading „Loading networking session…" + ⚠️ error.
- `MatchPartner`: loading spinner + ⚠️ error.
- `ContactSharing`: loading spinner + error.
- (MissedRound je OK.)

**B. Participant dashboard** (`Participant Dashboard.html`) — **loading stav** pred načítaním dát (aktuálne starý spinner).

**C. Event stránka** (`Event Page.html` → `UserPublicPage` / `SessionRegistration`) — **loading + error/empty stavy** (napr. token bez registrácií, výpadok backendu). Pozn.: časť starého kódu je mŕtva (`if(false)`) z portu — pri redizajne vyčistiť.

**D. `ParticipantRoundDetail`** (route `/p/:token/r/:roundId`) — **celá stránka je neredizajnovaná** a navyše **osirelá** (nič v appke na ňu nenaviguje; žije len v admin preview). Rozhodnúť: zmazať alebo redizajnovať + znovu zapojiť.

**Mimo scope** (nikdy neboli v Claude Design, netreba): celý Admin panel (`Admin*`), CRM (`crm/*`), `ErrorBoundary`, `ProtectedRoute`, `QRScanner`, `ui/LoadingSpinner`, `RegistrationFlow` (mŕtvy kód), `DemoPage`, debug nástroje.

Do tejto kategórie (donavrhnúť) patria aj:
- **404 / „Page not found" stránka** (`AppRouter.tsx` NotFound) — teraz staré generické shadcn („404 / Page not found", `min-h-screen bg-background`).
- **App-level loading stavy** (celoobrazovkové „Loading…" pri štarte / medzi routami) — teraz generický spinner + „Loading…".

---

## 7. VYJASNIŤ: dva rôzne dizajny Event Promo slide

- **Čo:** V bundli sú **dva odlišné promo dizajny**: `Event Promo Slide.html` (svetlý „paper" stage, QR vľavo, „Break your bubble, meet new people", kroky 01–03) **vs** `screen-event-promo.jsx` (tmavý slide, „Spot your match in the crowd", Wonderimage). **Appka implementuje ten tmavý** (`EventPromoPage` → `screen-event-promo.jsx`).
- **Treba:** rozhodnúť, ktorý je kanonický. Ak svetlý (`Event Promo Slide.html`), celý promo slide v appke je off-design a treba ho prerobiť.

---

## 8. VYJASNIŤ: „pro" varianty dashboardu / rounds

- **Čo:** V bundli sú `screen-dashboard-pro.jsx` a `screen-rounds-pro.jsx` (alternatívne „pro" verzie). Appka používa **zlúčený** dashboard (`screen-dashboard-merged.jsx`).
- **Treba:** potvrdiť, že „pro" varianty sú **zámerne vypustené** (nahradené merged verziou), alebo či majú byť samostatný režim.

---

## 9. Mobilné / responzívne layouty (pozn. — skôr app-úloha)

- **Čo:** Bundle má mobilné mocky: `home/Homepage Mobile*.html`, `screen-mobile-studio*.jsx`, `screen-mobile-roundform.jsx`. Redizajn bol **desktop-first**. Participant obrazovky sú mobile-native (OK), ale **organizer studio + round form + homepage** neboli overené/zladené voči týmto mobilným mockom.
- **Treba (v appke):** responzívny pass — zladiť organizer/homepage mobil s existujúcimi mobilnými mockmi. (Mocky už existujú, takže nie je to nový dizajn, ale app-implementácia.)
