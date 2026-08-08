# Zmeny pre Claude Design (v06) — DODATOK v3 (jedna nová/opravná požiadavka)

> Predošlé dávky (v1 aj v2) už boli odovzdané do Claude Design. Tento súbor obsahuje **jedinú novú požiadavku**, ktorá **opravuje / nahrádza** skoršiu požiadavku na „live-round monitor" (bola vo v1 ako „doplniť live-round monitor na dashboard — countdown ring + stat strip").

---

## OPRAVA: Live-round monitor — BEZ fázového countdown ringu

### Kontext / prečo (dôležité)
Pôvodná požiadavka navrhovala na dashboarde počas bežiaceho roundu **veľký countdown ring s fázou** (napr. „Walking · 06:49"), ktorý hovorí o stave **celého roundu**. **To je sémanticky nesprávne** a nesmie sa tak navrhnúť.

Dôvod: v jednom rounde **každá vylosovaná skupina/pár môže začať v trochu iný čas**. Systém počíta walking timer **per-skupinu od momentu spárovania** (`walkingDeadline = matchedAt + walkingTime`), nie od štartu roundu — a to zámerne (každý má dostať plný walking čas; párovanie prebieha pri potvrdení účasti, re-match pri no-show, atď.). Preto v jednom okamihu **skupina A už networkuje, kým skupina B ešte kráča**. Neexistuje jednoznačná „fáza celého roundu", takže jeden ring s fázou zavádza.

### Čo JE pre celý round jednotné (a teda sa smie zobraziť)
- **Čas konca roundu** je round-wide (`roundStart + walking + finding + duration`) → odpočet **„Round končí o HH:MM" / „končí o X:XX"** je korektný.
- **Agregované počty** cez skupiny sú korektné.

### Čo navrhnúť namiesto fázového ringu
Live-monitor na dashboarde (počas bežiaceho roundu) navrhnúť ako **prehľad stavu roundu bez tvrdenia o jednej fáze**:
1. **Odpočet do KONCA roundu** (nie do konca fázy) — napr. „Round ends in 06:49" / „Ends at 19:45". Ring/veľký čas je OK, pokiaľ odpočítava **koniec roundu**, nie fázu.
2. **Živý rozpad počtov účastníkov** — koľko je: **Registered / Confirmed / On the way (walking) / Met / No-show / No match**. Toto je to, čo organizéra reálne zaujíma (agregát cez všetky skupiny).
3. Voliteľne: názov roundu + „LIVE" indikátor + odkaz „Open live monitor / Round report".

**Nepoužiť:** jeden fázový label („Walking / Finding / Networking") pre celý round.

### Kde v mocku
- `screen-dashboard-merged.jsx` — podmienený blok medzi hero a „Your rounds" (zobrazí sa len počas bežiaceho roundu).
- (Fázová logika a per-skupinové stavy patria do participant matching obrazoviek, nie do súhrnu na dashboarde.)

### Poznámka pre appku
Po novom mocku sa v appke `NetworkingDashboard` live-monitor prerobí: odstrániť fázový ring (`getRoundStatus`-based CountdownRing s labelom Walking/Finding/Networking) a nahradiť odpočtom do konca roundu + živými počtami.
