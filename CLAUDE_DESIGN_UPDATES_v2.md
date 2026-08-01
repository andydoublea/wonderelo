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

## N5. (FYI — app-úloha, nie nový dizajn): mobilné layouty

Nie je to požiadavka na návrh — **mobilné mocky už v bundli sú** (`home/Homepage Mobile*.html`, `screen-mobile-studio*.jsx`, `screen-mobile-roundform.jsx`). Ide o **app-implementáciu**: organizer studio + round form + homepage treba na mobile zladiť s týmito existujúcimi mockmi (redizajn bol desktop-first; participant obrazovky sú mobile-native a OK). Uvádzam len pre úplnosť — v Claude Design netreba nič nové kresliť, pokiaľ nechceš tie mobilné mocky upraviť.
