# Public Pages Redesign — Handoff for Claude Code

**Scope:** Phase 01 — 5 marketing pages restyled in the new Wonderelo brand language (cream paper, Bricolage Grotesque display, Instrument Serif italic accents, deep purple ink, orange highlights).

**Reference:** the already-shipped `Wonderelo Homepage Redesign.html` and `Wonderelo Dashboard.html` define the visual vocabulary. The 5 new mockups below follow it 1:1.

**Where things live:**
- Mockups (HTML, this design project) → `public-redesign/`
- Target codebase → `/Users/andy/Claude/Wonderelo/src/components/`

---

## Mockup → component mapping

| # | Mockup file (HTML) | Replaces (TSX) | Data dependencies |
|---|---|---|---|
| 01 | `Wonderelo Pricing.html` | `PricingPage.tsx` + `PricingPanel.tsx` | `src/config/pricing.ts` — `PRICING_TIERS`, `CAPACITY_OPTIONS`, `formatPrice`, `getTierForCapacity` |
| 02 | `Wonderelo Our Story.html` | `OurStoryPage.tsx` | Static narrative · uses `AuthorSignature.tsx` |
| 03 | `Wonderelo Blog.html` | `BlogListingPage.tsx` | `GET /blog-posts` via `apiBaseUrl`, falls back to `fallbackPosts[]` |
| 04 | `Wonderelo Blog Post.html` | `BlogDetailPage.tsx` | `GET /blog-posts/:slug`, post body rendered via `dangerouslySetInnerHTML` |
| 05 | `Wonderelo Use Case.html` | `UseCaseLandingPage.tsx` (`/for/:slug`) | `useCases[slug]` map — 7 variants: conferences/meetups/festivals/weddings/bars/schools/teams |

Each HTML file starts with a `<!-- … -->` comment block listing this mapping inline.

---

## Recommended migration order

The pages are not equally risky to port. Suggested order:

1. **Shared tokens** — copy `wonderelo-public.css` `:root` block into `src/styles/globals.css`. Re-route the shadcn token names (`--background`, `--primary`, etc.) to point at the new `--w-*` brand tokens. This single PR will visually shift every page in the app — review carefully.
2. **Footer + Navigation** — these are shared across all 5 pages (and in fact across the whole site). Port them first, in one PR, before touching any individual page.
3. **Our Story** — pure-content page, no API, no state, no shared data. Lowest risk. Good warm-up.
4. **Use Case Landing** — content-only (data is in the `useCases` map inside the component already). Wraps all 7 slugs in one go.
5. **Blog Listing + Blog Post** — share the `BlogPost` type and `fallbackPosts`. Port in one PR so the two stay consistent.
6. **Pricing** — the most state-heavy page. The slider + plan-card mock is laid out; the existing `PricingPanel` logic (Stripe checkout, gift cards, billing toggle) stays — only the surrounding markup/styling changes.

---

## What to copy verbatim

### 1. CSS custom-property block

The `:root { --w-purple: …; --w-orange: …; … }` block in `wonderelo-public.css` is the canonical token list. Copy it into `src/styles/globals.css` (or `tokens.css` if you split it out). Then rewrite the existing shadcn token block to reference these:

```css
:root {
  /* (paste the --w-* block from wonderelo-public.css here) */

  /* shadcn token re-routing */
  --background:           var(--w-paper);
  --foreground:           var(--w-ink);
  --primary:              var(--w-orange);
  --primary-foreground:   #ffffff;
  --secondary:            var(--w-purple-deep);
  --secondary-foreground: #ffffff;
  --muted:                var(--w-cream);
  --muted-foreground:     var(--w-purple);
  --card:                 var(--w-paper);
  --card-foreground:      var(--w-ink);
  --border:               rgba(76, 25, 77, 0.10);
  --input:                rgba(76, 25, 77, 0.18);
  --ring:                 var(--w-orange);
  --radius:               14px;
}
```

This single change is enough to lift the brand on every screen that currently uses `bg-background`, `text-primary`, `border-border`, etc.

### 2. Google Fonts import

Same `<link>` tag as every mockup, paste into `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Instrument+Serif:ital@0;1&family=Caveat:wght@500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

Then in `tailwind.config.ts`:

```ts
fontFamily: {
  display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
  serif:   ['"Instrument Serif"', 'Georgia', 'serif'],
  body:    ['"Space Grotesk"', 'system-ui', 'sans-serif'],
  hand:    ['"Caveat"', 'cursive'],
  mono:    ['ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
}
```

### 3. The italic-serif accent helper

The single most distinctive type move is replacing one or two words in every heading with an italic serif accent in orange. Wrap it as a tiny component:

```tsx
// src/components/ui/Italic.tsx
export const Italic = ({ children }: { children: React.ReactNode }) => (
  <span className="font-serif italic font-normal text-primary">{children}</span>
);
```

Then in headings: `<h1>Simple pricing, <Italic>no worry.</Italic></h1>`

All `<span class="w-italic">…</span>` occurrences in the mockups map directly to this.

---

## Reusable primitives the mockups assume

These are already in `src/components/ui/` (shadcn) — re-skin them through CSS variables, don't fork:

| Mockup class | shadcn primitive | Notes |
|---|---|---|
| `.w-btn .w-btn-primary` | `Button` (default variant) | After token re-route, default already maps to orange |
| `.w-btn .w-btn-secondary` | `Button variant="secondary"` | Deep purple — already mapped |
| `.w-btn .w-btn-ghost` | `Button variant="outline"` | Tweak border to `var(--w-hairline-strong)` |
| `.bl-chip` | `Badge` (with `as="button"`) | Round-pill variant |
| `.pr-faq-item` | `Accordion` from `accordion.tsx` | Native `<details>` in mock; swap to Accordion for keyboard nav |
| `.pr-plan-toggle` | `Tabs` or `ToggleGroup` | Already exists |
| Slider in `.pr-slider` | `Slider` from `slider.tsx` | Reuse — `PricingPanel.tsx` already uses it |

---

## Component-by-component notes

### 01 · Pricing

`PricingPage.tsx` becomes mostly a layout shell. The heavy lifting stays in `PricingPanel.tsx` — the Stripe checkout flow, gift-card validation, slider state, billing-interval toggle. **Don't rewrite the logic**, only swap the JSX wrapping.

Specific changes:
- **Hero** — new block, currently `Navigation + <section className="py-20 ...">` in `PricingPage.tsx`. Replace with the cream-paper hero from the mock.
- **Capacity selector** — `PricingPanel` already uses `<Slider>`. Wrap it in the new `.pr-cap` card; show the selected value in giant Bricolage display type with an italic-serif "participants" word.
- **Plan cards** — current cards live in `PricingPanel`. Restructure to match the new layout. The "Most popular" tag should pin to the top-left corner of the featured card; keep the Annual/Monthly toggle inside the card head.
- **Comparison table** — new section, doesn't exist in current code. Add it below `<PricingPanel>` inside `PricingPage.tsx`. Static table; data can live in a small constant inside the file.
- **FAQ** — also new. Use `Accordion` from shadcn. Six entries, content in the mock.
- **CTA strip** — replaces the existing `<CtaSection />` call for the pricing page only (or update `CtaSection.tsx` to accept variant props).

### 02 · Our Story

Pure content. Current `OurStoryPage.tsx` uses prose Tailwind classes; replace with the editorial chapter layout from the mock.

- The "chapter number" (`.ch-num`) is decorative — use absolutely-positioned text with `-webkit-text-stroke` so it sits as a faint background numeral.
- Drop-cap on first paragraph of chapter 01 — use `::first-letter` (mock already does this; just port the CSS).
- The marginalia handwritten note (`.st-margin`) hides under 980px — keep that responsive guard.
- The `<AuthorSignature />` component stays — slot it where the `.bp-author` block sits in the mock.
- Timeline section is new (4 dated milestones).

### 03 · Blog Listing

`BlogListingPage.tsx` already fetches posts from `/blog-posts` and falls back to `fallbackPosts[]`. Keep that flow.

- **Featured post** — show `posts[0]` in the large left-cover, right-body layout.
- **Recent grid** — `posts.slice(1)` in 3-col grid.
- **Category chips** — derive from `post.tags` (currently unused). For now the chip set can be hardcoded.
- **Search input** — non-functional in mock. Wire it as a client-side filter over `posts` on a future iteration.
- **Newsletter signup** — needs a backend endpoint. For phase 01 it can submit to a stub; user expectation is just visual.

### 04 · Blog Post

`BlogDetailPage.tsx` already renders `post.content` via `dangerouslySetInnerHTML`. The mock styles the resulting `<h2>`, `<p>`, `<ul>` inside `.bp-body` — those rules will apply automatically to the injected HTML.

- **TOC** — derive from the H2s inside `post.content`. Use a small `useEffect` to scan the rendered article, populate the list, and IntersectionObserver to set `is-active`.
- **Pull quote** — the mock shows one inline. To make these authorable, recognize a `<blockquote class="bp-pull">` wrapper inside post HTML, or extend the post schema with a `pullQuote` field.
- **Cover image** — `post.coverImage || post.imageUrl` goes in `.bp-cover`. Currently the mock uses a gradient placeholder.
- **`<AuthorSignature />`** — slot into `.bp-author` block.
- **Related posts** — fetch the 3 most-recent excluding current, or pick by shared `tags`.

### 05 · Use Case Landing

`UseCaseLandingPage.tsx` already has the `useCases` map with 7 slugs. Don't change the data — just rework the rendering.

- **Hero scene** — the venue illustration in `.uc-hero-scene` is decorative CSS-only. Don't try to make it a real image — it's intentionally diagrammatic.
- **Sibling switcher** at the top — generate from the 7 slugs (`Object.keys(useCases)`).
- **Benefits** — 4 cards driven by `data.benefits[]`. First card uses the dark "featured" variant.
- **How it works** — 4 steps from `data.howItWorks[]`.
- **3 scenarios** — new content, currently not in `useCases`. Either hardcode per-variant or extend `useCases` schema.
- **Testimonial** — currently not in `useCases`. Same — add per-variant or hardcode a default.
- **Logo strip** — wordmarks-as-text placeholder. Drop in real customer logos later.

---

## What stays out of scope (Phase 01)

- The Footer's social/legal links — visual only, no routing yet.
- Newsletter form backend.
- Blog search & category filtering — visual only.
- Use-case sibling switcher routing — `<a href="#">` placeholders, wire to `/for/:slug` in a follow-up.

---

## Files in this batch

```
public-redesign/
  ├─ wonderelo-public.css           ← shared design tokens + nav + footer + buttons
  ├─ index.html                     ← thumbnail index of all 5 pages
  ├─ Wonderelo Pricing.html         → PricingPage.tsx + PricingPanel.tsx
  ├─ Wonderelo Our Story.html       → OurStoryPage.tsx
  ├─ Wonderelo Blog.html            → BlogListingPage.tsx
  ├─ Wonderelo Blog Post.html       → BlogDetailPage.tsx
  ├─ Wonderelo Use Case.html        → UseCaseLandingPage.tsx
  └─ HANDOFF_PUBLIC.md              ← this document
```

---

## Suggested PR breakdown

For a clean review history:

```
PR 1 · feat(tokens): brand-token refresh in globals.css
PR 2 · feat(layout): redesign Navigation + Footer
PR 3 · feat(pricing): redesign Pricing page + plan cards
PR 4 · feat(story): redesign Our Story page
PR 5 · feat(blog): redesign Blog Listing
PR 6 · feat(blog): redesign Blog Detail
PR 7 · feat(usecase): redesign Use Case Landing — all 7 slugs
```

Each PR is independently reviewable and can be merged to `development` → `staging` → `main` per the project's standard flow (see `CLAUDE.md`).

---

## Phase 02 (next)

After public pages: **Onboarding + Participant flow**. Touches:
`SignInFlow.tsx`, `SignUpFlow.tsx`, `ResetPasswordFlow.tsx`, `EmailVerification.tsx`, `RegistrationFlow.tsx`, `ParticipantDashboard.tsx`, `ParticipantLayout.tsx`, `MatchPartner.tsx`, `MatchNetworking.tsx`, `MissedRound.tsx`.

The same brand vocabulary applies, but with one shift: **density + touch targets**. Participant screens are mobile-first; the marketing-page spacing scale would feel airless on a 390 px screen.
