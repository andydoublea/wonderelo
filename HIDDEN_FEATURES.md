# Hidden features — design-parity pass (v06 → v07)

During the "design is the single source of truth" pass, real app features that the **v06 static design mocks didn't depict** were **hidden in code (not deleted)** — each wrapped in `{false && …}` or an equivalent guard.

A follow-up cleanup then **permanently deleted** the dead code for the features we decided to drop (see "Deleted" below). The remaining 11 were **selected to be added to Claude Design** (CLAUDE_DESIGN_UPDATES_v2.md, SF1–SF11).

## Un-hidden — now implemented (v07 designed all 11)

The **v07 design export designs all 11**, so during the full v06→v07 diff/port they were **un-hidden and implemented 1:1** to the v07 mocks. None remain guarded off.

1. **"Who is it for?" dropdown** — `redesign/PublicNav.tsx`: desktop hover mega-menu + mobile expandable, 7 `/for/:slug` items with icons.
2. **Round card actions** — `SessionDisplayCard.tsx`: "Manage →" is now a **"Manage ▾" dropdown** (Edit round / Round report / Duplicate round / Mark as completed / Delete round).
3. **Custom Round Times editor** — `SessionForm.tsx`: editor grid renders when the "Custom round times" toggle is on (restyled to v07).
4. **Live URL-availability** — `EventPageSettings.tsx`: "Checking…" spinner / green "available" / red "taken", wired to the real `/check-slug` endpoint (replaces the static "✓ available").
5. **Account explicit Save** — `AccountSettings.tsx`: "Save changes" + "Discard" + "Last saved …" (replaces autosave-on-blur).
6. **"Subscription cancelled"** banner — `BillingSettings.tsx`: gated on real subscription status.
7. **"Payment failed" / past-due** banner — `BillingSettings.tsx`: gated on real status (period-end + 14-day grace).
8. **"Frequently asked questions"** card — `BillingSettings.tsx`: v07 accordion, always shown.
9. Forgot-password **Logo + "← Back to sign in"** toprow + **"Don't have an account? Sign up for free →"** footer — `SignInFlow.tsx`.
10. Sign-up discovery option **"Partner/integration"** + **"Describe your event type"** field (when "Other", with validation) — `SignUpFlow.tsx`.
11. Per-partner **"Didn't make it / missed"** state — `MatchPartner.tsx`: re-enabled the real `partnerMissed` trigger (`!isCheckedIn && past walkingDeadline`).

---

## Deleted (dropped — dead code removed permanently)

These hidden/guarded features were removed entirely, along with any state/handlers/imports they left unused:

- Language switcher (SK/EN) in `PublicNav.tsx`. (The shared `i18n/LanguageSwitcher.tsx` component stays — still used by the legacy `Navigation.tsx`.)
- "Our story" + "Blog" center nav links — `PublicNav.tsx`.
- Sort dropdown; Table view + Calendar view toggles — `NetworkingDashboard.tsx` (already gone before this pass).
- Meeting point Physical/Virtual type toggle, Video call link field, and Add-photo / image upload — `MeetingPointsManager.tsx`.
- Ice breakers intro paragraph — `IceBreakersManager.tsx` (already gone).
- Advanced "Limit number of groups" + "Maximum groups" triggered-rounds disabled states / notes — `SessionForm.tsx`.
- "Export CSV" button + its `exportRegistrations` handler — `SessionAdministration.tsx`.
- Cancel-dialog warning icon — `BillingSettings.tsx`.
- Participant + organizer "Quick test logins" (dev only) — `SignInFlow.tsx`.
- Participant footer "Are you an organizer? Sign in here →" — `SignInFlow.tsx`.
- Bespoke 4-step "How rounds work" shadcn Dialog — `UserPublicPage.tsx` (the `UserPublicPageView` copy; the design's Round Rules bottom-sheet replaces it).
- Virtual "Join the call" meeting-point variant (eyebrow, video link, "I have joined the call" CTA) — `MatchInfo.tsx`.
- Inline "({countdown} left)" waiting helper — `MatchPartner.tsx`.
- Author signature block — `AuthorSignature.tsx` file deleted (was unreferenced).

---

## Behavioural fixes worth noting (not "hidden", but changed)
- **OSVerify** ("Verify your email") after organizer signup now has a working **"Continue to dashboard"** path — the backend pre-confirms accounts and never sends a verification email, so the previous gating was a dead-end. Copy changed from "we sent a verification link" to "your account is ready."
- **event_name vs organizer_name**: `EventPageSettings` "Event organizer name" now writes `eventName`; `AccountSettings` "Your name" writes `organizerName` (person). A migration `20260726000000_organizer_event_name.sql` adds the `event_name` column — apply via `supabase db reset` / deploy.
- **Follow-up (not yet changed):** the public event page `<title>` and notification emails still use `organizerName` as the event title (should be `eventName`).
