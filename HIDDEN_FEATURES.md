# Hidden features — design-parity pass (v06)

During the "design is the single source of truth" pass, real app features that the **static design mocks don't depict** were **hidden in code (not deleted)** — each is wrapped in `{false && …}` or an equivalent guard, so it can be restored by flipping one condition. Decide per item whether to add it to the Claude Design mocks (then re-enable) or drop it.

## Public site nav (`redesign/PublicNav.tsx`)
1. **"Who is it for?" dropdown** — 7 `/for/:slug` landing-page links (now a flat link like homepage).
2. **Language switcher** (SK/EN) in the public nav.
3. **"Our story" + "Blog"** center nav links (still reachable via footer).

## Organizer dashboard (`NetworkingDashboard.tsx`, `SessionDisplayCard.tsx`)
4. **Round card ⋮ menu** → Duplicate / Complete / Delete round (design card shows only "Manage →"). ⚠️ These actions now have **no home on the dashboard** — only Edit/Report via "Manage".
5. **Sort dropdown** (Date newest first, etc.).
6. **Table view + Calendar view** toggles.

## Round form (`SessionForm.tsx`, `MeetingPointsManager.tsx`, `IceBreakersManager.tsx`)
7. Meeting point **Physical/Virtual type** toggle.
8. Meeting point **Video call link** field.
9. Meeting point **"Add photo" / image upload**.
10. Ice breakers **intro paragraph**.
11. Per-round **Custom Round Times editor**.
12. Advanced **"Limit number of groups" triggered-rounds** disabled state + note.
13. **Maximum groups** triggered-rounds note.

## Live round / report (`SessionAdministration.tsx`)
14. **"Export CSV"** button (header now shows only Refresh).

## Event page settings (`EventPageSettings.tsx`)
15. **Live URL-availability** spinner / check / X + "This URL is available" / error text (design shows a static "✓ available").

## Account settings (`AccountSettings.tsx`)
16. **"Save changes" button** (replaced by autosave-on-blur + "Saves automatically" hint).

## Billing (`BillingSettings.tsx`)
17. **"Subscription cancelled"** banner.
18. **"Payment failed" / past-due** banner.
19. **"Frequently asked questions"** card.
20. **Cancel-dialog warning icon**.

## Auth (`SignInFlow.tsx`, `SignUpFlow.tsx`)
21. Participant **"Quick test logins"** (Alice / Bob) — dev only.
22. Organizer **"Quick test login"** — dev only.
23. Participant footer **"Are you an organizer? Sign in here →"**.
24. Forgot-password top **Logo + "← Back to sign in"** link.
25. Forgot-password **"Don't have an account? Sign up for free →"** footer.
26. Sign-up discovery option **"Partner/integration"** (list now 6, design has 6).
27. Sign-up **"Describe your event type"** field (when "Other").

## Event page (`UserPublicPage.tsx`)
28. Bespoke **4-step "How rounds work" dialog** (replaced by the design's Round Rules bottom-sheet).

## Participant / matching (`MatchInfo.tsx`, `MatchPartner.tsx`)
29. **Virtual "Join the call"** meeting-point variant.
30. Per-partner **"Didn't make it / missed"** state.
31. Inline **"({countdown} left)"** in the waiting helper.

## Marketing (`AuthorSignature.tsx`)
32. **Author signature block** (LinkedIn link, "Founder & CEO at Wonderelo", the "49 countries… Justin Timberlake" bio) — replaced by the design's shorter `.st-author` / `.bp-author` markup. The `AuthorSignature.tsx` component is now unreferenced.

---

## Behavioural fixes worth noting (not "hidden", but changed)
- **OSVerify** ("Verify your email") after organizer signup now has a working **"Continue to dashboard"** path — the backend pre-confirms accounts and never sends a verification email, so the previous gating was a dead-end. Copy changed from "we sent a verification link" to "your account is ready."
- **event_name vs organizer_name**: `EventPageSettings` "Event organizer name" now writes `eventName`; `AccountSettings` "Your name" writes `organizerName` (person). A migration `20260726000000_organizer_event_name.sql` adds the `event_name` column — apply via `supabase db reset` / deploy.
- **Follow-up (not yet changed):** the public event page `<title>` and notification emails still use `organizerName` as the event title (should be `eventName`).
