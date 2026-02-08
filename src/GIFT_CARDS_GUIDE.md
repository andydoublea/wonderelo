# Gift cards system guide

## Overview

Gift cards systém umožňuje administrátorom vytvárať a spravovať promo kódy pre organizátorov. Tieto kódy môžu poskytnúť zľavy na subscriptions alebo jednorazové eventy.

## Prístup

Gift cards sa spravujú cez **Admin Panel** → **Gift cards**

## Typy zliav

### 1. Absolútna zľava (Fixed amount)
- Pevná suma v eurách (€)
- Príklad: €10 zľava, €50 zľava
- Odčíta sa od celkovej sumy pri platbe

### 2. Percentuálna zľava (Percentage)
- Zľava v percentách (%)
- Príklad: 20% zľava, 50% zľava
- Percentuálne zníženie celkovej sumy

## Aplikovateľné na

Gift card môže byť použitá na jeden z nasledujúcich typov platby:

1. **Single event payment** - Jednorazová platba za event
2. **Monthly subscription** - Mesačné predplatné
3. **Yearly subscription** - Ročné predplatné

## Vytvorenie gift card

### Povinné pola

1. **Gift card code** - Unikátny kód (napr. SUMMER2024, LAUNCH50)
   - Automaticky sa konvertuje na veľké písmená
   - Musí byť unikátny v celom systéme

2. **Discount type** - Typ zľavy
   - Fixed amount (€) - absolútna suma
   - Percentage (%) - percentuálna zľava

3. **Discount value** - Hodnota zľavy
   - Pre absolútnu: suma v eurách (napr. 10.00)
   - Pre percentuálnu: percento (napr. 20, max 100)

4. **Applicable to** - Na čo sa vzťahuje
   - Single event payment
   - Monthly subscription
   - Yearly subscription

5. **Valid from** - Dátum začiatku platnosti
   - Gift card nebude platný pred týmto dátumom

6. **Valid until** - Dátum expirácie
   - Gift card prestane byť platný po tomto dátume

### Voliteľné polia

1. **Maximum uses** - Maximálny počet použití
   - Ak nevyplnené: neobmedzený počet použití
   - Ak vyplnené: gift card sa dá použiť max X-krát

## Stavy gift card

### Active (Aktívny)
- Zelený badge
- Gift card je aktívny a môže byť použitý
- Splňuje všetky podmienky

### Inactive (Neaktívny)
- Šedý outline badge
- Gift card bol vypnutý adminom
- Nie je možné ho použiť

### Expired (Expirovaný)
- Červený destructive badge
- Gift card prešiel dátumom expirácie
- Už nie je možné ho použiť

### Not yet valid (Ešte neplatný)
- Šedý secondary badge
- Gift card ešte nedosiahol dátum začiatku platnosti
- Zatiaľ nie je možné ho použiť

## Správa gift cards

### Zobrazenie detailov
- Kliknutím na ikonu oka (Eye) sa otvorí detail dialog
- Zobrazuje kompletné informácie o gift card
- Obsahuje zoznam organizátorov ktorí ho použili

### Aktivácia/Deaktivácia
- Toggle switch ikona (ToggleRight/ToggleLeft)
- Rýchle zapnutie/vypnutie gift card
- Vypnutý gift card sa nedá použiť

### Zmazanie
- Ikona koša (Trash)
- Permanentné zmazanie gift card
- Vyžaduje potvrdenie

## Štatistiky

V hornej časti stránky sú 4 karty so štatistikami:

1. **Total cards** - Celkový počet gift cards
2. **Active cards** - Počet aktívnych a neexpirovaných gift cards
3. **Total uses** - Celkový počet použití všetkých gift cards
4. **Expired** - Počet expirovaných gift cards

## Validácia a použitie (pre organizers)

Keď organizátor zadá gift card kód pri platbe, server vykoná nasledujúce kontroly:

### Automatické validácie

1. **Existencia** - Gift card musí existovať v databáze
2. **Aktívny stav** - Musí byť aktívny (isActive = true)
3. **Časová platnosť** - Aktuálny dátum musí byť medzi validFrom a validUntil
4. **Typ platby** - applicableTo musí zodpovedať typu platby
5. **Maximálny počet použití** - Ak je nastavený, nesmie byť prekročený

### Po úspešnej validácii

1. Zvýši sa `usedCount` o 1
2. Pridá sa záznam do `usedBy` array:
   ```json
   {
     "organizerId": "uuid",
     "organizerEmail": "organizer@example.com",
     "usedAt": "2026-01-31T12:00:00.000Z"
   }
   ```
3. Vráti sa informácia o zľave pre aplikáciu na frontend

## Data model

```typescript
{
  id: string,                    // gc_1738324800000
  code: string,                  // SUMMER2024
  discountType: 'absolute' | 'percentage',
  discountValue: number,         // 10.00 alebo 20
  applicableTo: 'yearly_subscription' | 'monthly_subscription' | 'single_event',
  validFrom: string,             // ISO date "2026-06-01"
  validUntil: string,            // ISO date "2026-08-31"
  maxUses?: number,              // 100 (optional)
  usedCount: number,             // 0
  usedBy: [
    {
      organizerId: string,
      organizerEmail: string,
      usedAt: string             // ISO timestamp
    }
  ],
  createdAt: string,             // ISO timestamp
  createdBy: string,             // admin user ID
  isActive: boolean              // true
}
```

## Storage

- **Key pattern**: `gift_card:{CODE}`
- **Example**: `gift_card:SUMMER2024`

## API Endpoints

### Admin endpoints (require admin auth)

```typescript
GET    /admin/gift-cards/list           // List all gift cards
POST   /admin/gift-cards/create         // Create new gift card
PUT    /admin/gift-cards/:code/toggle   // Activate/deactivate
DELETE /admin/gift-cards/:code          // Delete gift card
```

### Public endpoint (requires organizer auth)

```typescript
POST   /validate-gift-card              // Validate and apply gift card
```

## Príklady použitia

### Letná kampaň
```
Code: SUMMER2024
Type: Percentage
Value: 25%
Applicable to: Yearly subscription
Valid from: 2026-06-01
Valid until: 2026-08-31
Max uses: 50
```

### Launch promo
```
Code: LAUNCH50
Type: Absolute
Value: €50
Applicable to: Single event
Valid from: 2026-01-01
Valid until: 2026-03-31
Max uses: (unlimited)
```

### VIP gift card
```
Code: VIP100
Type: Absolute
Value: €100
Applicable to: Yearly subscription
Valid from: 2026-01-01
Valid until: 2026-12-31
Max uses: 10
```

## Audit Log

Všetky akcie sú zaznamenané v audit logu:

- **gift_card_created** - Vytvorenie novej gift card
- **gift_card_toggled** - Aktivácia/deaktivácia
- **gift_card_deleted** - Zmazanie

Každý záznam obsahuje:
- Timestamp
- User ID admina
- Akcia
- Gift card code
- Relevantné detaily

## Best practices

1. **Naming convention**: Používaj popisné kódy (SUMMER2024, LAUNCH50)
2. **Time limits**: Vždy nastav validUntil aby sa predišlo neobmedzenému používaniu
3. **Max uses**: Pre drahé zľavy nastav maxUses
4. **Regular cleanup**: Pravidelne mazaj expirované gift cards
5. **Track usage**: Monitoruj používanie v detail dialógu
6. **Test before sharing**: Overiť platnosť pred zdieľaním s organizátormi

## Bezpečnosť

- Všetky admin endpointy vyžadujú admin autentifikáciu
- Gift card kódy sú case-insensitive (automaticky konvertované na uppercase)
- Validácia je robená na serveri, nie na frontende
- Používanie gift card je zaznamenané s organizerId a email
