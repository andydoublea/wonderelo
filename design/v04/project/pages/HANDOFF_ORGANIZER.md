# Phase 03 + 04 — Organizer studio, Account, Public event · Handoff

**Scope:** 8 screens covering the daily organizer workspace (round form, event branding, calendar, live monitoring, blog) plus the account/billing surfaces and the projected event-promo slide.

**Where mockups live:**
- Canvas with all 8 → `public-redesign/Wonderelo Organizer Studio.html`
- Screen components → one `screen-*.jsx` file each
- Shared atoms (palette, Btn, Italic, Diamond, OrgNav, FormField, PageShell) → `organizer-shared.jsx`

---

## Mockup → component mapping

### C · Organizer studio

| ID | Screen | Replaces (TSX) | Notes |
|---|---|---|---|
| C1 | Round form | `RoundFormPage.tsx` (wrapping `SessionForm.tsx`) | The bulk of organizer logic lives in `SessionForm`. Keep the existing field state, validation and credit-check flow — only the markup changes. The "Live preview" right column is new; populate it from the same form state. |
| C2 | Event page settings | `EventPageSettings.tsx` → `EventPageSettingsView` | The color-palette picker is new; either add it as a future feature or hide for v1. Hero-image upload reuses `optimizeImage()` from `utils/imageOptimization.ts`. |
| C3 | Calendar view | `CalendarView.tsx` (rendered inside `NetworkingDashboard.tsx` when `currentView === 'calendar'`) | Drop the search bar that's currently inside the calendar card — it moved into the page-header actions. |
| C4 | Live round monitor | `NetworkingDashboard.tsx` (live-round sub-view) + `RoundParticipantsAdmin.tsx` | New composition. The countdown ring + 4-stat strip is the highest-value addition — surface this whenever the organizer opens a round whose state is `live`. Activity feed plugs into the existing realtime channel. |
| C5 | Blog management | `BlogManagement.tsx` | Stats strip is new. The 4 cards (Total / Published / Reads / Subscribers) are derived from the same `/blog-posts` payload + a new `/blog-analytics` endpoint (Phase 03b). |

### D · Account & public event

| ID | Screen | Replaces (TSX) | Notes |
|---|---|---|---|
| D1 | Account settings | `AccountSettings.tsx` | The 7-section side nav matches the existing nav structure. "Integrations" and "API tokens" are new placeholders — wire them up when those features land. |
| D2 | Billing settings | `BillingSettings.tsx` | All existing logic (Stripe subscription, credit transactions, invoices) carries over. The dark plan-hero card replaces the current `<PricingPanel>` block when the org already has an active subscription. |
| D3 | Event promo slide | `EventPromoPage.tsx` → `EventPromoPageView` | Fixed 1920×1080 canvas, no chrome — it's projected. The mock shows step 02 of 3; the existing component already cycles every 5 s via `STEP_DURATION_MS`. Restyle the three steps to match the mock's split-layout treatment. |

---

## What this batch reuses vs. introduces

**Reused from Phase 01 + 02:**
- Tokens (`--w-*` in `wonderelo-public.css`)
- Italic-serif accent (`<Italic>` helper)
- Diamond motif
- Primary / secondary / ghost button variants
- Top-nav `OrgNav` already shipped in Phase 02

**New in this batch (port these as small new components):**

| New component | Where it lives in the mock | Purpose |
|---|---|---|
| `<PageShell>` | `organizer-shared.jsx` | Standard scaffold: nav + max-w-1240 main. Replaces the ad-hoc `<div className="container mx-auto p-6">` wrappers used across admin pages. |
| `<PageHead>` | same | Eyebrow + 44 px display title + lede + actions slot. Used on every C/D screen. Drop into `src/components/ui/` as `page-head.tsx`. |
| `<FormField>` | same | Styled wrapper around `<Input>`. Adds the uppercase label, prefix/suffix, and orange focus ring. Keep `<Input>` from shadcn underneath for accessibility — this is a pure visual wrapper. |
| Countdown ring (C4) | `screen-live-round.jsx` | Inline SVG dasharray ring. Promote to `<CountdownRing minutes={…} totalMinutes={…} />` and reuse from `CountdownTimer.tsx`. |
| Stats strip pattern | C4, C5 | 4-col grid with one accent-orange "featured" card. Promote to `<StatStrip>` so admin / CRM phases can share it. |

---

## Suggested PR breakdown

```
PR 13 · feat(ui): PageShell + PageHead + FormField (shared organizer chrome)
PR 14 · feat(rounds): redesign RoundFormPage + SessionForm (split, live preview)
PR 15 · feat(settings): redesign EventPageSettings + new branding picker
PR 16 · feat(calendar): redesign CalendarView (legend, day pills, drag-to-move)
PR 17 · feat(live): redesign NetworkingDashboard live-round view + RoundParticipantsAdmin
PR 18 · feat(blog): redesign BlogManagement (stats + filter chips + table)
PR 19 · feat(account): redesign AccountSettings + new side-nav
PR 20 · feat(billing): redesign BillingSettings (dark plan-hero card)
PR 21 · feat(promo): redesign EventPromoPage 1920×1080 stage slide
```

PRs 14, 15, 17, 19, 20 all depend on PR 13. Ship 13 first.

---

## Files in this batch

```
public-redesign/
  ├─ Wonderelo Organizer Studio.html      ← canvas with all 8 artboards
  ├─ organizer-shared.jsx                  ← atoms + PageShell + PageHead + OrgNav + FormField
  ├─ screen-round-form.jsx                 → RoundFormPage / SessionForm
  ├─ screen-event-settings.jsx             → EventPageSettings
  ├─ screen-calendar.jsx                   → CalendarView
  ├─ screen-live-round.jsx                 → NetworkingDashboard (live)
  ├─ screen-blog-mgmt.jsx                  → BlogManagement
  ├─ screen-account-billing.jsx            → AccountSettings + BillingSettings
  ├─ screen-event-promo.jsx                → EventPromoPage (1920×1080)
  ├─ browser-window.jsx                    ← starter (do not edit)
  └─ HANDOFF_ORGANIZER.md                  ← this document
```

---

## Phase 05 — what's still open

After this batch the remaining surfaces are:

- **Admin panel** — ~25 screens. Internal-only — same tokens but "utility" treatment: white surface (not cream), denser tables, no decorative diamonds inside the chrome. Includes the BPMN diagram, system tests, translations, organizers, leads, pricing, gift cards, ice-breakers, notification texts, parameters, registration funnel, status guide, style guide, version badge, etc.
- **CRM module** — ~14 screens. The CRM has its own visual stack (`src/components/crm/*`). Treatment-wise it can stay closer to the public brand since it's customer-facing for the organizer, but the table density needs to match the admin panel.

Ping me with which to do first.
