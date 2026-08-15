# Zmeny pre Claude Design (v06) — DODATOK v2 (len NOVÉ požiadavky)

> Prvá dávka (`CLAUDE_DESIGN_UPDATES.md`, položky 1–6) už bola odovzdaná do Claude Design. Tento súbor obsahuje **iba nové požiadavky**, ktoré pribudli po odovzdaní. Nič z v1 tu nie je zopakované.

Formát: čo · kde v mocku · prečo.

---

## N1. Donavrhnúť: 404 / „Page not found" stránka

- **Čo:** Navrhnúť brandovú **404 stránku** (keď route neexistuje). Teraz je to staré generické shadcn („404" veľké číslo + „Page not found" + „Go back / Go to homepage"), nezhodné s brandom.
- **Kde v mocku:** nová obrazovka (v bundli nie je). Referenčný brand-pattern: auth error-card (BigIcon + eyebrow + nadpis so serif akcentom + správa + ghost/primárne tlačidlo).
- **Prečo:** Chýbajúca navrhnutá error-stránka na úrovni celej appky.

---

## N2. Donavrhnúť: app-level loading stavy (celoobrazovkové)

- **Čo:** Navrhnúť brandový **celoobrazovkový loading stav** — pri štarte appky a medzi routami (auth/profil/dáta sa načítavajú). Teraz je to generický spinner + „Loading…".
- **Kde v mocku:** nová obrazovka/stav (v bundli nie je). *(Súvisí s loading/error stavmi z v1 sekcie 6 — toto je konkrétne ten app-level „Loading…" pred vykreslením obsahu.)*
- **Prečo:** Neredizajnovaný stav, ktorý užívateľ reálne vidí pri každom načítaní.

---

## N3. Vyjasniť + rozhodnúť: DVA rôzne dizajny Event Promo slide

- **Čo:** V bundli sú **dva odlišné promo dizajny**:
  - `Event Promo Slide.html` — svetlý „paper" stage, QR vľavo, headline „Break your bubble, meet new people", číslované kroky 01–03.
  - `screen-event-promo.jsx` — tmavý slide, headline „Spot your match in the crowd", Wonderimage tile + match card.
- **Stav appky:** implementovaný je **tmavý** (`screen-event-promo.jsx`).
- **Treba:** rozhodnúť, ktorý je kanonický. Ak má byť svetlý (`Event Promo Slide.html`), celý promo slide v appke treba prerobiť naň.

---

## N4. Vyjasniť: „pro" varianty dashboardu / rounds

- **Čo:** V bundli sú `screen-dashboard-pro.jsx` a `screen-rounds-pro.jsx` (alternatívne „pro" verzie). Appka používa **zlúčený** dashboard (`screen-dashboard-merged.jsx`).
- **Treba:** potvrdiť, že „pro" varianty sú **zámerne vypustené** (nahradené merged verziou), alebo či majú byť samostatný režim/obrazovka.

---

## Skryté funkcie na DONAVRHNUTIE v Claude Design

Tieto funkcie appka má (kód zachovaný), ale v mocku nie sú — rozhodli sme sa ich **doplniť do dizajnu**. Claude Design nech ich najprv navrhne, potom sa zapoja v appke.

### SF1. Public menu — „Who is it for?" dropdown
- **Čo:** Vo vrchnom public menu (a mobilnom) navrhnúť pri „Who is it for?" **rozbaľovacie menu** so 7 landing stránkami: Conferences & barcamps, Meetups, Festivals & Parties, Weddings, Bars & cafés, Schools & universities, Company teams (cesty `/for/:slug`). Každá položka má ikonu + názov.
- **Kde:** shared public nav (`wonderelo-nav.js` / homepage nav) — teraz je „Who is it for?" plochý odkaz; treba variant s dropdownom.
- **Prečo:** Sú to reálne marketingové landing stránky; dropdown je hlavný navigačný vstup na ne.

### SF2. Dashboard round karta — akcie roundu (⋮ menu)
- **Čo:** Na round karte navrhnúť prístup k akciám **Duplikovať / Dokončiť / Zmazať** round (napr. trojbodkové ⋮ menu vedľa „Manage →"). Aktuálny mock karty má len „Manage →".
- **Kde:** `screen-dashboard-merged.jsx` round karta.
- **Prečo:** Sú to reálne funkcie; bez nich sa round z dashboardu nedá zmazať/duplikovať/dokončiť. Claude Design nech navrhne umiestnenie (⋮ menu alebo iné).

### SF3. Round form — Custom round times editor
- **Čo:** Navrhnúť editor **individuálnych časov štartu pre každý round** (keď je zapnutý toggle „Custom round times") — riadok na round s časom + trvaním, pridať/odobrať round. Mock má len samotný toggle, nie telo editora.
- **Kde:** `screen-round-form.jsx` — sekcia Rounds, pod toggle „Custom round times".
- **Prečo:** Umožňuje presné plánovanie časov jednotlivých kôl namiesto auto-rozostupu.

### SF4. Event settings — live kontrola dostupnosti URL
- **Čo:** Pri poli „EVENT PAGE URL" navrhnúť **živú kontrolu dostupnosti** slugu počas písania: stav loading (spinner) → ✓ „This URL is available" / ✗ chybová hláška (URL zabratá / neplatná). Mock má len statické „✓ available".
- **Kde:** `screen-event-settings.jsx` — pole URL.
- **Prečo:** Zabráni uloženiu zabratej/neplatnej URL; okamžitá spätná väzba.

### SF5. Account settings — „Save changes" tlačidlo
- **Čo:** Navrhnúť **manuálne tlačidlo „Save changes"** na Account obrazovke (namiesto / popri autosave). Mock má teraz autosave („Saves automatically").
- **Kde:** `screen-account-billing.jsx` — Account sekcia.
- **Prečo:** Používateľ preferuje explicitné uloženie. Claude Design nech rozhodne, či nahradiť autosave tlačidlom alebo doplniť.

### SF6. Billing — stavy predplatného (bannery)
- **Čo:** Navrhnúť **stavové bannery** v subscription karte: „Vaše predplatné bolo zrušené" (cancelled) a „Platba zlyhala / po splatnosti" (past-due). Mock je len statický (aktívny stav).
- **Kde:** `screen-account-billing.jsx` — Billing subscription karta.
- **Prečo:** Reálne stavy účtu, ktoré treba používateľovi jasne komunikovať.

### SF7. Billing — „Frequently asked questions" karta
- **Čo:** Navrhnúť **FAQ kartu** so 4 otázkami/odpoveďami na billing stránke (pod plánmi/faktúrami). V mocku nie je.
- **Kde:** `screen-account-billing.jsx` — Billing obrazovka.
- **Prečo:** Zníži otázky ohľadom platieb/predplatného.

### SF8. Forgot-password — nav pomôcky
- **Čo:** Na forgot-password obrazovke navrhnúť **vrchné logo + „← Back to sign in" odkaz** a dole **„Don't have an account? Sign up for free →" footer**. Mock je holá centrálna karta (bez nich).
- **Kde:** `auth-screens.jsx` — `OIForgot`.
- **Prečo:** Navigačné pomôcky (návrat na sign-in, cesta k registrácii).

### SF9. Sign-up krok 2 — možnosť „Partner/integration"
- **Čo:** Do zoznamu „How did you hear about us?" pridať **7. možnosť „Partner/integration"** (mock má 6).
- **Kde:** `auth-screens.jsx` — `OSDiscovery`.
- **Prečo:** Reálny akvizičný kanál.

### SF10. Sign-up krok 3 — pole „Describe your event type"
- **Čo:** Navrhnúť **podmienené textové pole „Describe your event type"**, ktoré sa zobrazí, keď je vybraný event type = „Other". Mock má len 3 selecty.
- **Kde:** `auth-screens.jsx` — `OSOrg`.
- **Prečo:** Doplňujúci vstup pre „Other" typ eventu.

### SF11. Matching — „Didn't make it" stav (partner nedorazil)
- **Čo:** Navrhnúť stav vo find-each-other obrazovke, keď **partner nedôjde na meeting point** v časovom limite — jasná hláška „They didn't make it to the meeting point in time." + čo ďalej. Mock má len way/here/done stavy.
- **Kde:** `Participant Matching.html` — find-each-other sekcia.
- **Prečo:** Reálny scenár (niekto nepríde); treba používateľovi povedať, čo sa deje.

---

## N5. (FYI — app-úloha, nie nový dizajn): mobilné layouty

Nie je to požiadavka na návrh — **mobilné mocky už v bundli sú** (`home/Homepage Mobile*.html`, `screen-mobile-studio*.jsx`, `screen-mobile-roundform.jsx`). Ide o **app-implementáciu**: organizer studio + round form + homepage treba na mobile zladiť s týmito existujúcimi mockmi (redizajn bol desktop-first; participant obrazovky sú mobile-native a OK). Uvádzam len pre úplnosť — v Claude Design netreba nič nové kresliť, pokiaľ nechceš tie mobilné mocky upraviť.
