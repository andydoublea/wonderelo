# Phase 02 — Onboarding + Participant flow · Handoff

**Scope:** 10 screens covering organizer onboarding (sign in / 3-step sign up / verify / reset) and the participant flow (register → dashboard → round detail → match → in-round → contact sharing → rate Wonderelo → missed).

**Where mockups live:**
- Canvas with all 10 → `public-redesign/Wonderelo Participant Flow.html`
- Screen components → `public-redesign/participant-screens.jsx` (one exported function per screen)

The canvas is a Figma-like grid — pan/zoom, drag to reorder, click any artboard to open it fullscreen.

---

## Mockup → component mapping

### A · Organizer onboarding (desktop card on cream backdrop)

| ID | Screen | Replaces (TSX) | Notes |
|---|---|---|---|
| A1 | Sign in | `SignInFlow.tsx` → `SignInFlowView` | Tabs: Organizer + Participant. Keep the existing `SignInFlowViewProps` shape — only the markup changes. |
| A2 | Sign up · organizer (3-step) | `SignUpFlow.tsx` → `SignUpFlowView` | **Final — every step is designed. Do not design anything here.** It is a **3-step** wizard (not 5, no URL-pick step): **Step 1 · Account** (`osu1-account`), **Step 2 · Discovery** (`osu2-discovery`), **Step 3 · Organisation** (`osu3-org`), then **Verify email** (`osu4-verify`, listed as A3). Desktop **and** mobile artboards exist for all four in `Participant Flow.html` (section `o-signup`, ids `osu1..osu4` + `-m` variants) → `OSAccount / OSDiscovery / OSOrg / OSVerify` in `auth-screens.jsx`. The steps deliberately share `<DesktopCard>` + the `<Steps>` indicator (that's the design system); each has its own distinct field body — nothing is left to fill in. |
| A3 | Email verify · waiting | `EmailVerificationWaiting.tsx` | This is the same screen as the organizer sign-up flow's final step (`osu4-verify` / `OSVerify`). `getEmailProviderLink()` already exists — feed its result into the "Open Gmail" button label/URL. |
| A4 | Reset password | `ResetPasswordFlow.tsx` | Password-strength meter logic is currently inside the component — keep it, just restyle. |

### B · Participant flow (mobile, iPhone framing in mocks)

| ID | Screen | Replaces (TSX) | Notes |
|---|---|---|---|
| B1 | Register for event | `SessionRegistration.tsx` + `RegistrationFlow.tsx` | Email + first-name only. The full multi-step flow only triggers if the event opts into extra fields. |
| B2 | Participant dashboard | `ParticipantDashboard.tsx` → `ParticipantDashboardView` | Live banner pinned to whichever round has `status === 'matched'`. List below shows all rounds in the registered session(s). |
| B3 | Round detail | `ParticipantRoundDetail.tsx` | Meeting points come from `session.meetingPoints[]`. Reminder toggle hits `PATCH /round-registration` with `notificationsEnabled`. |
| B4 | Find your match | `MatchPartner.tsx` → `MatchPartnerView` | The big own-ID number visual is `<GeometricIdentification>` — that component stays, we just rewrap. The 3-up number picker is `getOptionsForPartner()` output. |
| B5 | In the round | `MatchNetworking.tsx` → `MatchNetworkingView` | Dark purple background is a brand-vocabulary lift. The countdown is the existing `<CountdownTimer>` component, restyled via parent styles. |
| B6 | Contact sharing | `ContactSharing.tsx` → `ContactSharingPartnerFeedbackView` | **Flow split — approved.** Today `ContactSharing.tsx` renders partner-contact sharing **and** the Wonderelo rating in one view; the redesign splits them into two sequential screens. This is the first: partner cards + share row. Mock: `Participant Matching.html?screen=contact-sharing`. |
| B7 | Rate Wonderelo | `ContactSharing.tsx` → `ContactSharingWondereloFeedbackView` | **Second half of the split (approved).** Standalone “rate the round” screen. Mock: `Participant Matching.html?screen=wonderelo-feedback`. Keep the two views' existing state/handlers in `ContactSharing.tsx`; just render them as two routed steps instead of one stacked page. |
| B8 | Missed the round | `MissedRound.tsx` | The "Next round" CTA reuses the same registration-toggle endpoint as B3. |

---

---

## System states (net-new — designed)

Loading, empty, error, offline, 404 and the three form conditions were missing from the happy-path mocks. They're now designed in **`System States.html`** (7 panels with per-state mapping captions). Treat it as the shared fallback set for **every** shell (public, participant, studio):

- **404** → route catch-all (`NotFound.tsx`)
- **Error** → `ErrorBoundary.tsx`
- **Offline** → `useOnlineStatus()` banner + view
- **Loading** → `<Skeleton />` card + inline button spinner
- **Empty** → per-list empty state
- **Form** → field-level hint + form-level banner + success view

Only two new colors are introduced (`--destructive #c0392b`, `--success #1f8a4d`); everything else is existing `--w-*` tokens. Error / Offline / Empty / 404 share one `<StatePlaceholder>` component (glyph + title + body + actions).

---

## Brand vocabulary that's identical to Phase 01

Same tokens as `wonderelo-public.css`:
- Cream `#f7f1e6` paper background for organizer cards and the participant `bg-background` surface
- Bricolage Grotesque for display, Instrument Serif italic for one-or-two-word accents (the orange "italic moment" — Italic in the JSX is `<span style={{ fontFamily, fontStyle: 'italic', color: orange }}>`)
- Diamonds (rotated 45° squares) as the decorative motif
- Buttons follow the same `primary / secondary / ghost` variant set — already shadcn-mappable

For Claude Code: **after porting Phase 01 tokens into `globals.css`, Phase 02 needs no new tokens.** Every color and font in the participant screens reads from the same `--w-*` variables.

---

## Mobile-specific notes (B1 – B6)

These differ from public pages in a few ways the port needs to respect:

1. **Touch targets are 44 px minimum.** The buttons in the mocks already meet this. When porting back to shadcn `<Button>`, prefer `size="lg"` for primary actions.
2. **No sticky desktop nav.** Participant screens have a custom `<PHeader>` (44 px tall, event name + slug) — port as a small `ParticipantHeader.tsx`. Reuse across B1–B3 and B6.
3. **Status colors carry weight.** Done rounds = `paper-deep` background, 55% opacity, line-through. Live = orange or purple-deep solid card with white text. Upcoming = white card. Keep this mapping in the `RoundItem` component.
4. **Geometric ID visual.** `<GeometricIdentification>` from the existing codebase is fine as-is — the mock uses a placeholder. Don't replace it; just ensure its border-radius matches the card around it.
5. **In-round screen goes dark on purpose.** When a participant is *in* a 5-minute round, the dark purple background dims the phone so it doesn't distract from the conversation. Keep that contrast in the port.

---

## What stays out of scope (Phase 02)

- The participant-flow sub-states: round-ended-with-confirmation, no-show report, contact-sharing dialog. Those will land in Phase 03 if scoped.
- Push notification permission prompts (browser-native).

---

## Suggested PR breakdown

```
PR 8  · feat(auth): redesign SignInFlow + SignUpFlow + ResetPasswordFlow + EmailVerificationWaiting
PR 9  · feat(participant): new ParticipantHeader.tsx + restyled ParticipantLayout
PR 10 · feat(participant): redesign ParticipantDashboard + RoundItem
PR 11 · feat(participant): redesign ParticipantRoundDetail + MeetingPointsDialog
PR 12 · feat(match): redesign MatchPartner + MatchNetworking + MissedRound
```

PRs 9 and 10 are the riskiest — they share state (`useRegistrations`, `useTime`) and touch the most users. Test the live round at staging with a real `supabase db reset` seed before merging to `main`.

---

## Files in this batch

```
public-redesign/
  ├─ Wonderelo Participant Flow.html   ← canvas with all 10 artboards
  ├─ participant-screens.jsx            ← one exported function per screen
  ├─ design-canvas.jsx                  ← starter (do not edit)
  ├─ ios-frame.jsx                      ← starter (do not edit)
  └─ HANDOFF_PARTICIPANT.md             ← this document
```

---

## Phase 03 — what's still open

After this batch the remaining surfaces are (in the order I'd tackle them):

1. **Organizer studio** — `RoundFormPage.tsx`, `SessionForm.tsx`, `EventPageSettings.tsx`, `NetworkingDashboard.tsx`. These are where the organizer spends hours, so polish &amp; density matter. *(Calendar view was removed from the product; blog management stays on the existing admin-panel screen — neither is being redesigned.)*
2. **Account &amp; billing** — `AccountSettings.tsx`, `BillingSettings.tsx`. Light touch — mostly form layouts.
3. **Public event page** — `EventPromoPage.tsx` + the QR/promo-slide flow. Customer-facing, so re-uses the Phase 01 voice.

**Out of scope (keep existing design, not being redesigned):** the **admin panel** (~25 internal screens) and the **CRM module** (`src/components/crm/*`). Both stay on their current design — frozen for this redesign.
