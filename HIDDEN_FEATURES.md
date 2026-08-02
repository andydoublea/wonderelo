# Hidden features — design-parity pass (v06)

During the "design is the single source of truth" pass, real app features that the **static design mocks don't depict** were **hidden in code (not deleted)** — each is wrapped in `{false && …}` or an equivalent guard, so it can be restored by flipping one condition.

A follow-up cleanup then **permanently deleted** the dead code for the features we decided to drop (see "Deleted" below). The features listed under **"Still hidden"** are the ones we intend to re-enable after they are added to the Claude Design mocks — leave their guards in place.

## Still hidden (KEEP — re-enable after redesign)

### Public site nav (`redesign/PublicNav.tsx`)
1. **"Who is it for?" dropdown** — 7 `/for/:slug` landing-page links (desktop hover dropdown + mobile sublist), guarded by `false`.

### Organizer dashboard (`SessionDisplayCard.tsx`)
2. **Round card ⋮ menu** → Duplicate / Complete / Delete round (design card shows only "Manage →").

### Round form (`SessionForm.tsx`)
3. Per-round **Custom Round Times editor** (only the "Custom round times" toggle is shown; the editor body is guarded off).

### Event page settings (`EventPageSettings.tsx`)
4. **Live URL-availability** spinner / check / X + "This URL is available" / error text (design shows a static "✓ available").

### Account settings (`AccountSettings.tsx`)
5. **"Save changes" button** (replaced by autosave-on-blur + "Saves automatically" hint).

### Billing (`BillingSettings.tsx`)
6. **"Subscription cancelled"** banner.
7. **"Payment failed" / past-due** banner.
8. **"Frequently asked questions"** card.

### Auth (`SignInFlow.tsx`, `SignUpFlow.tsx`)
9. Forgot-password top **Logo + "← Back to sign in"** link, and the forgot-password **"Don't have an account? Sign up for free →"** footer.
10. Sign-up discovery option **"Partner/integration"** and the **"Describe your event type"** field (when "Other").

### Participant / matching (`MatchPartner.tsx`)
11. Per-partner **"Didn't make it / missed"** state (forced off via `partnerMissed = false`).

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
