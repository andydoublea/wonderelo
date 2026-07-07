# Phase 02 — Onboarding + Participant flow · Handoff

**Scope:** 10 screens covering organizer onboarding (sign in / sign up / verify / reset) and the participant flow (register → dashboard → round detail → match → in-round → missed).

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
| A2 | Sign up · step 3/5 | `SignUpFlow.tsx` → `SignUpFlowView` | Multi-step. Mock shows the URL-pick step. Steps 1–2, 4–5 reuse the same card chrome with different field bodies. |
| A3 | Email verify · waiting | `EmailVerificationWaiting.tsx` | `getEmailProviderLink()` already exists — feed its result into the "Open Gmail" button label/URL. |
| A4 | Reset password | `ResetPasswordFlow.tsx` | Password-strength meter logic is currently inside the component — keep it, just restyle. |

### B · Participant flow (mobile, iPhone framing in mocks)

| ID | Screen | Replaces (TSX) | Notes |
|---|---|---|---|
| B1 | Register for event | `SessionRegistration.tsx` + `RegistrationFlow.tsx` | Email + first-name only. The full multi-step flow only triggers if the event opts into extra fields. |
| B2 | Participant dashboard | `ParticipantDashboard.tsx` → `ParticipantDashboardView` | Live banner pinned to whichever round has `status === 'matched'`. List below shows all rounds in the registered session(s). |
| B3 | Round detail | `ParticipantRoundDetail.tsx` | Meeting points come from `session.meetingPoints[]`. Reminder toggle hits `PATCH /round-registration` with `notificationsEnabled`. |
| B4 | Find your match | `MatchPartner.tsx` → `MatchPartnerView` | The big own-ID number visual is `<GeometricIdentification>` — that component stays, we just rewrap. The 3-up number picker is `getOptionsForPartner()` output. |
| B5 | In the round | `MatchNetworking.tsx` → `MatchNetworkingView` | Dark purple background is a brand-vocabulary lift. The countdown is the existing `<CountdownTimer>` component, restyled via parent styles. |
| B6 | Missed the round | `MissedRound.tsx` | The "Next round" CTA reuses the same registration-toggle endpoint as B3. |

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

- The Sign Up flow steps 1, 2, 4, 5 — only step 3 is mocked. They follow the same card chrome; the field bodies (radio groups, selects) port via shadcn `<RadioGroup>` and `<Select>` directly.
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

1. **Organizer studio** — `RoundFormPage.tsx`, `SessionForm.tsx`, `EventPageSettings.tsx`, `CalendarView.tsx`, `NetworkingDashboard.tsx`, `BlogManagement.tsx`. These are where the organizer spends hours, so polish &amp; density matter.
2. **Account &amp; billing** — `AccountSettings.tsx`, `BillingSettings.tsx`. Light touch — mostly form layouts.
3. **Public event page** — `EventPromoPage.tsx` + the QR/promo-slide flow. Customer-facing, so re-uses the Phase 01 voice.
4. **Admin panel** (~25 screens). Internal-only, so it can take the "stlmená verzia" treatment from the original questions form: same tokens, denser tables, less decoration.
5. **CRM module** (~14 screens). Same playbook as the admin panel.

When you're ready, point at any of those and we'll spin up Phase 03.
