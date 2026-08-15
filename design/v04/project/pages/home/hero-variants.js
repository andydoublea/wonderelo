// Hero variants — 5 bold redesigns of the Wonderelo above-the-fold area.
// Each component renders inside a 1440x900 artboard and uses the SAME copy
// taken from the live homepage (Homepage.tsx). Headline, subtitle, CTA and
// badges never change — only the visual treatment does.

const HERO_HEAD = "Enrich your event by making people really meet!";
const HERO_SUB = "Easily turn socializing from side effect into program highlight! Networking rounds perfect for conferences, meet-ups, festivals, internal meetings, weddings and parties";
const HERO_CTA = "Organize networking rounds";
const HERO_BADGES = ["Ready in five minutes", "No attendee list needed", "Organize networking rounds"];
const NAV_LINKS = ["Who is it for?", "How it works", "Pricing"];

// Core brand colors — same as live site
const C = {
  purple: "#5C2277",
  purpleDeep: "#4b1d51",
  purpleInk: "#2d1133",
  orange: "#dd531c",
  orangeBright: "#ff6a2a",
  cream: "#f7f1e6",
  paper: "#fbf6ec"
};

// ─────────────────────────────────────────────────────────────
// Variant 9 — CONFETTI BURST v2
// Evolution of variant 01. Hero illustration moved to the LEFT and made
// much larger (~720px). Mascot logo symbol scaled up and bleeds off the
// viewport edge. Full headline text.
// ─────────────────────────────────────────────────────────────
function HeroConfettiV2({ noNav } = {}) {
  return (
    <div className="hero-v2" style={{ position: "relative", width: "100%", background: C.cream, overflow: "hidden", fontFamily: '"Space Grotesk", sans-serif' }}>
      {/* texture grain */}
      <div style={{ position: "absolute", inset: 0, opacity: .06, backgroundImage: "radial-gradient(rgba(76,25,77,.6) 1px, transparent 1px)", backgroundSize: "4px 4px", pointerEvents: "none" }} />

      {!noNav && <Nav variant="light" logoSize={120} showBottomBorder />}
      <ParticipantBar variant="light" topOffset={noNav ? 0 : 80} />

      {/* Content row — capped at 1440 and centered; stacks at ≤1024 */}
      <div className="hero-inner">
        {/* Headline column */}
        <div className="hero-text">
          <Pill bg={C.orange} fg="#fff">Networking rounds</Pill>
          <h1 className="hero-head" style={{
            margin: "22px 0 0 0",
            fontFamily: '"Bricolage Grotesque", sans-serif',
            fontWeight: 800,
            fontSize: "clamp(46px, 5.4vw, 84px)",
            lineHeight: .92,
            letterSpacing: "-0.04em",
            color: C.purpleDeep
          }}>
            Enrich <span style={{ color: C.orange, fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontWeight: 400 }}>your event</span><br />
            by bringing<br />
            <span style={{ color: C.orange, fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontWeight: 400 }}>people together</span>
          </h1>
          <p style={{ maxWidth: 560, marginTop: 28, fontSize: 18, lineHeight: 1.5, color: "#3a2e34" }}>
            {HERO_SUB}
          </p>

          <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 32, flexWrap: "wrap" }}>
            <CTAButton kind="primary" />
            <CTASecondary label="Try the demo →" />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 28px", marginTop: 30, color: C.purpleDeep, fontSize: 14, fontWeight: 500 }}>
            {HERO_BADGES.map((b, i) =>
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Star size={14} color={C.orange} fill />
                {b}
              </div>
            )}
          </div>
        </div>

        {/* Hero illustration — live-site SVG (16:9) */}
        <div className="hero-art">
          <div className="hero-art-glow" />
          <img src="assets/Wonderelo-hero-section-networking-rounds.svg" alt="Wonderelo networking" className="hero-art-img" />
        </div>
      </div>

      <LogoStrip variant="light" />
    </div>);

}

// ─────────────────────────────────────────────────────────────
// Variant 9 — CONFETTI BURST v2 (image left)
// ─────────────────────────────────────────────────────────────
function HeroConfettiV2_imageLeft() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: C.cream, overflow: "hidden", fontFamily: '"Space Grotesk", sans-serif' }}>
      <div style={{ position: "absolute", inset: 0, opacity: .06, backgroundImage: "radial-gradient(rgba(76,25,77,.6) 1px, transparent 1px)", backgroundSize: "4px 4px", pointerEvents: "none" }} />

      <Nav variant="light" logoSize={120} />
      <Confetti exclude={[3, 5, 6, 8, 9]} />

      {/* Hero illustration — LEFT, much bigger */}
      <div style={{ position: "absolute", left: -40, top: 30, width: 720, height: 720, zIndex: 2 }}>
        <div style={{ position: "absolute", inset: 60, borderRadius: "50%", background: `radial-gradient(circle at 50% 55%, #ffffff 0%, #ffffff 35%, transparent 60%)` }} />
        <img src="assets/Wonderelo-hero-section-dog.png" alt="Wonderelo networking"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 30px 60px rgba(76,25,77,.22))" }} />
      </div>

      {/* Headline column — RIGHT */}
      <div style={{ position: "absolute", right: 60, top: 170, width: 680, zIndex: 5 }}>
        <Pill bg={C.orange} fg="#fff">Networking rounds</Pill>
        <h1 style={{
          margin: "22px 0 0 0",
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontWeight: 800,
          fontSize: 84,
          lineHeight: .92,
          letterSpacing: "-0.04em",
          color: C.purpleDeep
        }}>
          Enrich your event<br />
          by making people<br />
          <span style={{ color: C.orange, fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontWeight: 400 }}>really</span>{" "}
          <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontWeight: 400 }}>meet.</span>
        </h1>
        <p style={{ maxWidth: 560, marginTop: 28, fontSize: 18, lineHeight: 1.5, color: "#3a2e34" }}>
          {HERO_SUB}
        </p>

        <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 32 }}>
          <CTAButton kind="primary" />
          <CTASecondary label="See it live →" />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 28px", marginTop: 30, color: C.purpleDeep, fontSize: 14, fontWeight: 500 }}>
          {HERO_BADGES.map((b, i) =>
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Star size={14} color={C.orange} fill />
              {b}
            </div>
          )}
        </div>
      </div>

      <LogoStrip variant="light" />
    </div>);

}

// ─────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────

function Nav({ variant, logoSize = 40, wordmarkSize = 24, showBottomBorder, mode = "absolute" }) {
  const dark = variant === "dark";
  const ink = dark ? "#fff" : C.purpleDeep;
  const linkColor = dark ? "rgba(255,255,255,.78)" : "rgba(76,25,77,.78)";
  const borderCol = dark ? "rgba(255,255,255,.12)" : "rgba(76,25,77,.10)";
  const sticky = mode === "sticky";
  const wrapStyle = sticky
    ? { position: "sticky", top: 0, left: 0, right: 0, height: 80, zIndex: 50, borderBottom: `1px solid ${borderCol}`, background: dark ? "rgba(26,15,28,.92)" : "rgba(247,241,230,.85)", backdropFilter: "saturate(140%) blur(10px)", WebkitBackdropFilter: "saturate(140%) blur(10px)" }
    : { position: "absolute", left: 0, right: 0, top: 0, height: 80, zIndex: 10, borderBottom: showBottomBorder ? `1px solid ${borderCol}` : "none" };
  // Inner row capped at 1440 and centered — only the bar's border/background spans full width.
  const innerStyle = { maxWidth: 1440, height: "100%", margin: "0 auto", padding: "0 60px", display: "flex", alignItems: "center", justifyContent: "space-between" };
  return (
    <div className={"wn-nav " + (dark ? "wn-nav-dark" : "wn-nav-light")} style={wrapStyle}>
      <div style={innerStyle}>
      <div className="wn-nav-lockup" style={{ display: "flex", alignItems: "center", gap: Math.max(8, (logoSize - 40) / 2 + 4), cursor: "pointer" }}>
        {/* Logo symbol — scales from its own center, doesn't push wordmark */}
        <div style={{ position: "relative", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <img src="assets/Wonderelo-logo-symbol.png" alt=""
          style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%) rotate(-6deg)", width: logoSize, height: logoSize, objectFit: "contain" }} />
        </div>
        <div style={{ ...{ fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: wordmarkSize, fontWeight: 800, letterSpacing: "-0.03em", color: ink }, fontSize: "32px" }}>wonderelo</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 32, fontSize: 14, color: linkColor, fontWeight: 500 }}>
        {NAV_LINKS.map((l) => <a key={l} href="#" className="wn-nav-link" style={{ color: linkColor, textDecoration: "none", padding: "6px 0", position: "relative" }}>{l}</a>)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: ink }}>
        <a href="#" className="wn-nav-signin" style={{ cursor: "pointer", fontWeight: 500, color: ink, textDecoration: "none" }}>Sign in</a>
        <button className="wn-nav-cta" style={{ background: C.orange, color: "#fff", border: "none", padding: "10px 18px", borderRadius: 999, fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Start for free</button>
      </div>
      </div>
    </div>);

}

function ParticipantBar({ variant = "light", topOffset = 80 }) {
  const dark = variant === "dark";
  const ink = dark ? "rgba(255,255,255,.85)" : "rgba(76,25,77,.7)";
  const inputBg = dark ? "rgba(255,255,255,.08)" : "#fff";
  const inputBorder = dark ? "rgba(255,255,255,.18)" : "rgba(76,25,77,.18)";
  const inputInk = dark ? "#fff" : C.purpleDeep;
  const hashColor = dark ? "rgba(255,255,255,.55)" : "rgba(76,25,77,.45)";
  const borderCol = dark ? "rgba(255,255,255,.12)" : "rgba(76,25,77,.10)";
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: topOffset, height: 52,
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 14,
      borderBottom: `1px solid ${borderCol}`,
      zIndex: 9,
      fontFamily: '"Space Grotesk", sans-serif'
    }}>
      <span style={{ fontSize: 13, color: ink, fontWeight: 500 }}>Joining as a participant?</span>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span style={{ position: "absolute", left: 12, fontSize: 13, color: hashColor, pointerEvents: "none", zIndex: 1 }}>#</span>
        <input
          type="text"
          placeholder="Enter code here"
          className="wn-participant-input"
          style={{
            background: inputBg,
            border: `1px solid ${inputBorder}`,
            borderRadius: 8,
            height: 32,
            width: 170,
            paddingLeft: 26,
            paddingRight: 10,
            fontSize: 13,
            color: inputInk,
            outline: "none",
            fontFamily: '"Space Grotesk", sans-serif'
          }} />
      </div>
      <button className="wn-participant-join" style={{
        height: 32, padding: "0 16px",
        background: C.purpleDeep, color: "#fff",
        border: "none", borderRadius: 8,
        fontSize: 13, fontWeight: 600, cursor: "pointer",
        opacity: .5,
        transition: "opacity .2s ease, transform .2s ease"
      }}>Join</button>
    </div>);

}

function Pill({ bg, fg, children }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: bg, color: fg, borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 600, letterSpacing: ".02em" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: fg }} />
      {children}
    </div>);

}

function CTAButton({ kind, full }) {
  const isPrimary = kind === "primary";
  const isPurple = kind === "purple";
  const bg = isPurple ? C.purpleDeep : C.orange;
  const fg = "#fff";
  return (
    <button style={{
      background: bg, color: fg, border: "none",
      padding: "18px 28px", borderRadius: 14,
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: 17, fontWeight: 600,
      cursor: "pointer",
      display: "inline-flex", alignItems: "center", gap: 12,
      boxShadow: `0 12px 24px ${isPurple ? "rgba(76,25,77,.35)" : "rgba(221,83,28,.35)"}`,
      width: full ? "100%" : "auto",
      justifyContent: full ? "center" : "flex-start"
    }}>
      <CalIcon /> {HERO_CTA} <Arrow />
    </button>);

}

function CTASecondary({ label }) {
  return <span style={{ color: C.purpleDeep, fontWeight: 600, fontSize: 16, cursor: "pointer", borderBottom: `2px solid ${C.purpleDeep}` }}>{label}</span>;
}

function Star({ size = 14, color = "#dd531c", fill }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={fill ? color : "none"} stroke={color} strokeWidth="1.4">
      <path d="M8 1.6l1.94 4.06L14.4 6.3l-3.32 3.06L11.94 14 8 11.66 4.06 14l.86-4.64L1.6 6.3l4.46-.64z" />
    </svg>);

}

function CalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>);

}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>);

}

function FloatBadge({ style, bg, fg, children }) {
  return (
    <div style={{
      position: "absolute",
      background: bg, color: fg,
      padding: "10px 14px",
      borderRadius: 14,
      boxShadow: "0 14px 28px rgba(0,0,0,.18)",
      fontSize: 14,
      ...style
    }}>{children}</div>);

}

function Confetti({ exclude = [] } = {}) {
  // a sprinkling of geometric orange/purple shapes
  const pieces = [
  { x: 8, y: 18, r: 18, c: C.orange, t: "sq" }, { x: 14, y: 48, r: -22, c: C.purpleDeep, t: "tri" },
  { x: 22, y: 78, r: 14, c: C.orange, t: "dot" }, { x: 46, y: 8, r: -12, c: C.purpleDeep, t: "sq" },
  { x: 54, y: 88, r: 6, c: C.orange, t: "tri" }, { x: 88, y: 8, r: 8, c: C.purpleDeep, t: "dot" },
  { x: 94, y: 60, r: -18, c: C.orange, t: "sq" }, { x: 6, y: 90, r: 0, c: C.purpleDeep, t: "dot" },
  { x: 50, y: 42, r: 24, c: C.orange, t: "line" }, { x: 80, y: 38, r: -20, c: C.purpleDeep, t: "line" }];

  return (
    <>
      {pieces.map((p, i) => {
        if (exclude.includes(i)) return null;
        const common = { position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.r}deg)` };
        if (p.t === "sq") return <div key={i} style={{ ...common, width: 18, height: 18, background: p.c, borderRadius: 3 }} />;
        if (p.t === "dot") return <div key={i} style={{ ...common, width: 14, height: 14, background: p.c, borderRadius: "50%" }} />;
        if (p.t === "tri") return <svg key={i} style={common} width="22" height="22" viewBox="0 0 22 22"><polygon points="11,2 21,20 1,20" fill={p.c} /></svg>;
        if (p.t === "line") return <div key={i} style={{ ...common, width: 36, height: 5, background: p.c, borderRadius: 4 }} />;
        return null;
      })}
    </>);

}

function ConfettiDiamonds({ exclude = [] } = {}) {
  // Diamond-only confetti — purple + orange. Slow drift + rotate animation.
  const O = C.orange,P = C.purpleDeep;
  const pieces = [
  // Top band
  { x: 6, y: 6, s: 18, r: 18, c: O },
  { x: 18, y: 14, s: 12, r: -14, c: P },
  { x: 32, y: 5, s: 22, r: 8, c: P },
  { x: 44, y: 11, s: 14, r: -22, c: O },
  { x: 58, y: 4, s: 18, r: 14, c: O },
  { x: 70, y: 13, s: 10, r: -8, c: P },
  { x: 82, y: 6, s: 24, r: 20, c: P },
  { x: 92, y: 14, s: 14, r: -18, c: O },

  // Upper-mid band
  { x: 4, y: 30, s: 16, r: -10, c: P },
  { x: 48, y: 24, s: 12, r: 24, c: O },
  { x: 96, y: 32, s: 20, r: -6, c: O },

  // Mid band — only edges
  { x: 2, y: 52, s: 14, r: 12, c: O },
  { x: 50, y: 50, s: 10, r: -30, c: P },
  { x: 97, y: 54, s: 18, r: 6, c: P },

  // Lower-mid band
  { x: 6, y: 70, s: 16, r: -22, c: P },
  { x: 30, y: 74, s: 12, r: 14, c: O },
  { x: 54, y: 68, s: 20, r: -10, c: O },
  { x: 74, y: 76, s: 14, r: 24, c: P },
  { x: 90, y: 70, s: 18, r: -14, c: P },

  // Bottom band
  { x: 12, y: 84, s: 14, r: 8, c: O },
  { x: 26, y: 88, s: 18, r: -18, c: P },
  { x: 40, y: 84, s: 12, r: 22, c: O },
  { x: 60, y: 88, s: 16, r: -8, c: P },
  { x: 78, y: 84, s: 20, r: 16, c: O },
  { x: 94, y: 88, s: 12, r: -24, c: P }];

  return (
    <>
      <style>{`
        @keyframes wonderelo-confetti-float {
          0%   { transform: translate(-50%, -50%) translate(0, 0) rotate(var(--r, 0deg)); }
          25%  { transform: translate(-50%, -50%) translate(6px, -10px) rotate(calc(var(--r, 0deg) + 90deg)); }
          50%  { transform: translate(-50%, -50%) translate(-4px, -16px) rotate(calc(var(--r, 0deg) + 180deg)); }
          75%  { transform: translate(-50%, -50%) translate(-8px, -6px) rotate(calc(var(--r, 0deg) + 270deg)); }
          100% { transform: translate(-50%, -50%) translate(0, 0) rotate(calc(var(--r, 0deg) + 360deg)); }
        }
      `}</style>
      {pieces.map((p, i) => {
        if (exclude.includes(i)) return null;
        // Rotate + slight drift, with per-item delay to stagger
        const dur = 7 + i * 7 % 6;
        const delay = -(i * 1.3 % 8);
        return (
          <div key={i} style={{
            position: "absolute",
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.s, height: p.s,
            background: p.c,
            "--r": `${45 + p.r}deg`,
            transform: `translate(-50%,-50%) rotate(${45 + p.r}deg)`,
            borderRadius: 2,
            zIndex: 1,
            animation: `wonderelo-confetti-float ${dur}s ease-in-out ${delay}s infinite`,
            willChange: "transform"
          }} />);

      })}
    </>);

}

function LogoStrip({ variant }) {
  const dark = variant === "dark";
  const c = dark ? "rgba(255,255,255,.7)" : "rgba(76,25,77,.5)";
  // Real press logos — moved up from the (now removed) AsSeenIn section
  const media = [
    { src: "assets/logos/business-insider.svg", alt: "Business Insider", h: 22 },
    { src: "assets/logos/digital-journal.svg", alt: "Digital Journal", h: 22 },
    { src: "assets/logos/big-news-network.svg", alt: "Big News Network", h: 22 },
    { src: "assets/logos/techbullion.svg", alt: "TechBullion", h: 22 },
    { src: "assets/logos/ips.svg", alt: "IPS", h: 22 },
    { src: "assets/logos/starkville.svg", alt: "Starkville Daily News", h: 22 }
  ];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, borderTop: `1px solid ${dark ? "rgba(255,255,255,.12)" : "rgba(76,25,77,.15)"}` }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "24px 60px", display: "flex", alignItems: "center", gap: 40, color: c, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em" }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".22em", flexShrink: 0 }}>As seen in</span>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          {media.map((m) => (
            <img key={m.alt} src={m.src} alt={m.alt} style={{ height: m.h, width: "auto", maxWidth: 140, objectFit: "contain", opacity: dark ? .85 : .8, filter: "grayscale(100%)" }} />
          ))}
        </div>
      </div>
    </div>);

}

Object.assign(window, { HeroConfettiV2, HeroConfettiV2_imageLeft });