// Wonderelo — full homepage redesign sections (everything below the hero).
// Uses the same brand vocabulary as hero-variants.js: cream paper background,
// Bricolage Grotesque display, Instrument Serif italic accents, deep purple ink,
// orange highlights. Placeholder image boxes where real photography goes.

const SC = {
  purple: "#5C2277",
  purpleDeep: "#4b1d51",
  purpleInk: "#2d1133",
  orange: "#dd531c",
  orangeBright: "#ff6a2a",
  cream: "#f7f1e6",
  paper: "#fbf6ec",
  paperDeep: "#f1e9d8",
  ink: "#3a2e34"
};

// ─────────────────────────────────────────────────────────────
// Reusable bits
// ─────────────────────────────────────────────────────────────
function SectionEyebrow({ children, color = SC.orange }) {
  return null;
}

function SectionTitle({ children, align = "center", maxWidth = 900 }) {
  return (
    <h2 style={{
      margin: "16px auto 0",
      maxWidth,
      textAlign: align,
      fontFamily: '"Bricolage Grotesque", sans-serif',
      fontWeight: 800,
      fontSize: 56,
      lineHeight: 1.0,
      letterSpacing: "-0.035em",
      color: SC.purpleDeep,
      textWrap: "balance"
    }}>
      {children}
    </h2>);

}

function Italic({ children, color = SC.orange }) {
  return <span style={{ color, fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontWeight: 400 }}>{children}</span>;
}

function Lede({ children, align = "center", maxWidth = 640 }) {
  return (
    <p style={{ margin: "20px auto 0", maxWidth, textAlign: align, fontSize: 18, lineHeight: 1.55, color: SC.ink }}>{children}</p>);

}

function ArrowS({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>;
}

function CheckS({ size = 18, color = SC.orange }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}

function StarS({ size = 16, color = SC.orange }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill={color}><path d="M8 1.6l1.94 4.06L14.4 6.3l-3.32 3.06L11.94 14 8 11.66 4.06 14l.86-4.64L1.6 6.3l4.46-.64z" /></svg>;
}

// ─────────────────────────────────────────────────────────────
// 1. AS SEEN IN — slim media logo strip
// ─────────────────────────────────────────────────────────────
function AsSeenIn() {
  const media = [
  { src: "assets/logos/business-insider.svg", alt: "Business Insider", h: 26 },
  { src: "assets/logos/digital-journal.svg", alt: "Digital Journal", h: 26 },
  { src: "assets/logos/big-news-network.svg", alt: "Big News Network", h: 26 },
  { src: "assets/logos/techbullion.svg", alt: "TechBullion", h: 26 },
  { src: "assets/logos/ips.svg", alt: "IPS", h: 26 },
  { src: "assets/logos/starkville.svg", alt: "Starkville Daily News", h: 26 }];

  // Tiny diamond pattern (decorative)
  const Diamond = ({ size = 8, color = SC.orange, opacity = 1 }) =>
  <span style={{ display: "inline-block", width: size, height: size, background: color, transform: "rotate(45deg)", opacity }} />;

  return (
    <section style={{ background: SC.paper, padding: "56px 60px", borderTop: `1px solid rgba(76,25,77,.10)`, borderBottom: `1px solid rgba(76,25,77,.10)`, position: "relative", overflow: "hidden" }}>
      {/* Diamond pattern band */}
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: 0, height: 6, display: "flex", justifyContent: "space-between", padding: "0 24px", alignItems: "center" }}>
        {Array.from({ length: 40 }).map((_, i) => <Diamond key={i} size={5} color={i % 3 === 0 ? SC.orange : SC.purpleDeep} opacity={.5} />)}
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", alignItems: "center", gap: 48 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, paddingRight: 32, borderRight: "1px solid rgba(76,25,77,.15)" }}>
          <Diamond size={10} color={SC.orange} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".26em", color: SC.purpleDeep, textTransform: "uppercase", lineHeight: 1.3, whiteSpace: "nowrap" }}>
            As<br />seen in
          </span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          {media.map((m) =>
          <img key={m.alt} src={m.src} alt={m.alt} style={{ height: m.h, width: "auto", maxWidth: 150, objectFit: "contain", opacity: .85, filter: "grayscale(100%)" }} />
          )}
        </div>
      </div>
    </section>);

}

// ─────────────────────────────────────────────────────────────
// 2. THE PROBLEM
// ─────────────────────────────────────────────────────────────
function ProblemSection() {
  const items = [
  { img: "assets/experience-schnitzel.png", text: "Waiting for schnitzel, hoping to meet someone" },
  { img: "assets/experience-wave.png", text: "Awkwardly approaching strangers before the talk starts" },
  { img: "assets/experience-fingers.png", text: "Bumping into someone in the hallway — never again" }];

  return (
    <section style={{ background: SC.paperDeep, padding: "120px 60px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: "8%", top: 80, width: 18, height: 18, background: SC.orange, transform: "rotate(45deg)" }} />
      <div style={{ position: "absolute", right: "10%", top: 140, width: 14, height: 14, background: SC.purpleDeep, transform: "rotate(45deg)" }} />
      <div style={{ position: "absolute", left: "14%", bottom: 100, width: 22, height: 22, background: SC.purpleDeep, transform: "rotate(45deg)" }} />
      <div style={{ position: "absolute", right: "6%", bottom: 60, width: 16, height: 16, background: SC.orange, transform: "rotate(45deg)" }} />
      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center", position: "relative" }}>
        <SectionEyebrow>The reality</SectionEyebrow>
        <SectionTitle>
          <Italic color={SC.orange}>9 out of 10</Italic> people go to events to meet someone new
        </SectionTitle>
        <Lede>Here's the networking experience they usually get instead:</Lede>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 56, maxWidth: 1100, marginLeft: "auto", marginRight: "auto" }}>
          {items.map((it, i) =>
          <div key={i} style={{ background: SC.paper, borderRadius: 24, padding: 28, border: "1px solid rgba(76,25,77,.10)", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, minHeight: 280 }}>
              <div style={{ width: "100%", height: 160, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.6)", borderRadius: 16 }}>
                <img src={it.img} alt="" style={{ maxWidth: "70%", maxHeight: "85%", objectFit: "contain" }} />
              </div>
              <p style={{ margin: 0, fontSize: 16, color: SC.purpleInk, fontWeight: 500, textAlign: "center", textWrap: "balance" }}>{it.text}</p>
            </div>
          )}
        </div>
        <p style={{ margin: "56px auto 0", maxWidth: 720, fontSize: 17, lineHeight: 1.55, color: SC.ink }}>
          Too many attendees leave without new connections — approaching strangers is hard, groups stay closed, and solo participants get stuck on the sidelines.
        </p>
      </div>
    </section>);

}

function ProblemSectionFocused() {
  // Same element pattern as codebase Homepage.tsx (vertical list of small
  // horizontal cards, image-left + label-right) — restyled with the new
  // homepage's design language (paper bg, deep purple ink, orange accents,
  // Bricolage Grotesque + Instrument Serif italic, diamond decorations).

  // Closed group: tight cluster of 3 facing inward + 1 outsider
  const ClosedGroup =
  <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <g fill={SC.purpleDeep}>
        <circle cx="100" cy="62" r="14" />
        <path d="M100 78 q-22 2 -22 26 v18 h44 v-18 q0 -24 -22 -26z" />
        <circle cx="78" cy="86" r="13" />
        <path d="M78 100 q-22 2 -22 26 v8 h44 v-8 q0 -24 -22 -26z" />
        <circle cx="122" cy="86" r="13" />
        <path d="M122 100 q-22 2 -22 26 v8 h44 v-8 q0 -24 -22 -26z" />
      </g>
      <circle cx="100" cy="92" r="44" fill="none" stroke={SC.purpleDeep} strokeOpacity=".25" strokeWidth="1.4" strokeDasharray="3 4" />
      <g fill={SC.orange} opacity=".95">
        <circle cx="186" cy="78" r="11" />
        <path d="M186 91 q-17 2 -17 20 v15 h34 v-15 q0 -18 -17 -20z" />
      </g>
      <line x1="160" y1="92" x2="170" y2="92" stroke={SC.purpleDeep} strokeOpacity=".35" strokeWidth="2" strokeDasharray="2 3" />
    </svg>;


  const Sidelines =
  <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <g fill={SC.purpleDeep}>
        <circle cx="50" cy="76" r="12" />
        <path d="M50 90 q-19 2 -19 22 v22 h38 v-22 q0 -20 -19 -22z" />
        <circle cx="84" cy="68" r="13" />
        <path d="M84 82 q-21 2 -21 24 v30 h42 v-30 q0 -22 -21 -24z" />
        <circle cx="118" cy="76" r="12" />
        <path d="M118 90 q-19 2 -19 22 v22 h38 v-22 q0 -20 -19 -22z" />
      </g>
      <g fill={SC.orange}>
        <circle cx="76" cy="46" r="2.4" />
        <circle cx="84" cy="42" r="2.4" />
        <circle cx="92" cy="46" r="2.4" />
      </g>
      <line x1="160" y1="20" x2="160" y2="148" stroke={SC.purpleDeep} strokeOpacity=".25" strokeWidth="1.4" strokeDasharray="3 5" />
      <g fill={SC.orange}>
        <circle cx="190" cy="80" r="11" />
        <path d="M190 92 q-17 2 -17 20 v22 h34 v-22 q0 -18 -17 -20z" />
      </g>
      <rect x="196" y="104" width="8" height="13" rx="1.5" fill={SC.purpleDeep} />
    </svg>;


  const ByChance =
  <svg viewBox="0 0 220 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
      <rect x="20" y="120" width="180" height="6" rx="2" fill={SC.purpleDeep} opacity=".35" />
      <g fill={SC.purpleDeep}>
        <circle cx="55" cy="74" r="12" />
        <path d="M55 88 q-19 2 -19 22 v18 h38 v-18 q0 -20 -19 -22z" />
        <circle cx="100" cy="74" r="12" />
        <path d="M100 88 q-19 2 -19 22 v18 h38 v-18 q0 -20 -19 -22z" />
      </g>
      <g fill={SC.orange}>
        <circle cx="145" cy="74" r="12" />
        <path d="M145 88 q-19 2 -19 22 v18 h38 v-18 q0 -20 -19 -22z" />
      </g>
      <g transform="translate(178 30)">
        <rect x="0" y="0" width="28" height="28" rx="5" fill={SC.orange} />
        <circle cx="9" cy="9" r="2.2" fill="#fff" />
        <circle cx="19" cy="14" r="2.2" fill="#fff" />
        <circle cx="9" cy="19" r="2.2" fill="#fff" />
        <circle cx="19" cy="19" r="2.2" fill="#fff" />
      </g>
      <path d="M180 60 q-15 8 -28 14" fill="none" stroke={SC.purpleDeep} strokeOpacity=".4" strokeWidth="1.6" strokeDasharray="3 4" />
    </svg>;


  const items = [
  { img: "assets/reality-closed-circles.png", title: "Groups stay\nclosed", text: "People arrive with their team and rarely break out.", zoom: 1.2, focus: "center 55%" },
  { img: "assets/reality-solo.png", title: "Solo attendees stuck on the sidelines", text: "Solo-goers end up scrolling phone instead of meeting anyone.", zoom: 1, focus: "center" },
  { img: "assets/reality-waiting.png", title: "Socializing happens by chance", text: "A connection usually sparks if you happen to queue for schnitzel.", zoom: 1, focus: "center" }];

  return (
    <section style={{ background: SC.paperDeep, padding: "120px 60px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: "8%", top: 80, width: 18, height: 18, background: SC.orange, transform: "rotate(45deg)" }} />
      <div style={{ position: "absolute", right: "10%", top: 140, width: 14, height: 14, background: SC.purpleDeep, transform: "rotate(45deg)" }} />
      <div style={{ position: "absolute", left: "14%", bottom: 100, width: 22, height: 22, background: SC.purpleDeep, transform: "rotate(45deg)" }} />
      <div style={{ position: "absolute", right: "6%", bottom: 60, width: 16, height: 16, background: SC.orange, transform: "rotate(45deg)" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center", position: "relative" }}>
        <SectionEyebrow>The reality</SectionEyebrow>
        <SectionTitle>
          <Italic color={SC.orange}>9 out of 10</Italic> people go to events to meet someone new
        </SectionTitle>
        <Lede>But here's what actually happens at most events:</Lede>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 56, maxWidth: 1100, marginLeft: "auto", marginRight: "auto" }}>
          {items.map((it, i) =>
          <div key={i} style={{
            background: SC.paper,
            borderRadius: 24,
            padding: 28,
            border: "1px solid rgba(76,25,77,.10)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 18,
            minHeight: 320
          }}>
              <div style={{ width: "100%", aspectRatio: "16 / 10", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.6)", borderRadius: 16, overflow: "hidden" }}>
                <img src={it.img} alt={it.title} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: it.focus || "center", transform: `scale(${it.zoom || 1})`, transformOrigin: "center" }} />
              </div>
              <h3 style={{ margin: 0, fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: SC.purpleDeep, textAlign: "center", textWrap: "balance", whiteSpace: "pre-line" }}>{it.title}</h3>
              <p style={{ margin: 0, fontSize: 15, color: SC.ink, lineHeight: 1.5, textAlign: "center", textWrap: "pretty" }}>{it.text}</p>
            </div>
          )}
        </div>

        {/* Closing line — visually weighted callout, framed by diamonds */}
        <div style={{ marginTop: 72, display: "flex", alignItems: "center", justifyContent: "center", gap: 22 }}>
          <span aria-hidden style={{ width: 14, height: 14, background: SC.orange, transform: "rotate(45deg)", flexShrink: 0 }} />
          <p style={{
            margin: 0,
            fontFamily: '"Bricolage Grotesque", sans-serif',
            fontWeight: 800,
            fontSize: 36,
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            color: SC.purpleDeep,
            textAlign: "center",
            textWrap: "balance"
          }}>
            Too many attendees leave{" "}
            <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontWeight: 400, color: SC.orange, letterSpacing: "-0.01em" }}>
              without new connections
            </span>
            <span style={{ color: SC.orange }}>.</span>
          </p>
          <span aria-hidden style={{ width: 14, height: 14, background: SC.orange, transform: "rotate(45deg)", flexShrink: 0 }} />
        </div>
      </div>
    </section>);

}

// ─────────────────────────────────────────────────────────────
// 3. HOW IT WORKS — 5 alternating steps
// ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
  { n: 1, title: "Organizer promotes his Wonderelo event page", body: "Share your Event page link — show it on slides, screens, or roll-ups using a QR code or the event hashtag.", img: "assets/how-it-works-1.png", contain: false, position: null },
  { n: 2, title: "Participants register to rounds", body: "People choose their time and optionally topic or group. Zero attendee setup for the organizer.", img: "assets/Hand-with-phone.png", contain: true, position: null },
  { n: 3, title: "Then they confirm attendance", body: "SMS notification sent 5 minutes before the round reminds them to do so.", img: "assets/how-it-works-3.png", contain: false, position: "calc(50% + 55px) calc(50% + 7px)" },
  { n: 4, title: "Participants meet & network", body: "Wonderelo shows every participant their designated meeting point and match partners. They find each other using a unique Wonderimage™. Ice breakers handle the smooth start.", img: "assets/Wonderelo-step4.png", contain: false, position: null },
  { n: 5, title: "Finally they decide whether to exchange contacts", body: "If both parties agree, contacts are exchanged 15 minutes after the round. New contacts are made, new worlds emerge.", img: "assets/how-it-works-5.png", contain: true, position: null }];


  return (
    <section style={{ background: SC.cream, padding: "140px 60px", position: "relative" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 100 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, color: SC.purple, fontSize: 12, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase" }}>
            <span style={{ width: 28, height: 1, background: SC.purple }} />
            Stop leaving socializing to chance
            <span style={{ width: 28, height: 1, background: SC.purple }} />
          </div>
          <SectionTitle>
            Organize <Italic>networking rounds!</Italic>
          </SectionTitle>
          <Lede>Give your attendees what they came for — new connections.</Lede>
        </div>

        {/* Vertical rail with steps */}
        <div style={{ position: "relative" }}>
          {/* center rail line — clipped so it doesn't extend past the first/last node */}
          <div style={{ position: "absolute", left: "50%", top: 200, bottom: 200, width: 2, background: `repeating-linear-gradient(to bottom, ${SC.purpleDeep} 0 6px, transparent 6px 14px)`, opacity: .25, transform: "translateX(-50%)" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 96 }}>
            {steps.map((s, i) => {
              const reversed = i % 2 === 1;
              return (
                <div key={s.n} className="fx-step-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", position: "relative" }}>
                  {/* number node on rail */}
                  <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 56, height: 56, borderRadius: "50%", background: SC.cream, border: `2px solid ${SC.purpleDeep}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 22, color: SC.purpleDeep, zIndex: 2 }}>
                    {s.n}
                  </div>

                  {/* image */}
                  <div style={{ gridColumn: reversed ? 2 : 1, gridRow: 1 }}>
                    <div style={{ aspectRatio: "16/10", background: SC.paperDeep, borderRadius: 28, border: "1px solid rgba(76,25,77,.10)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 30px 60px rgba(76,25,77,.10)" }}>
                      <img src={s.img} alt={s.title} style={{ width: "100%", height: "100%", objectFit: s.contain ? "contain" : "cover", objectPosition: s.position || "center", transform: s.scale ? `scale(${s.scale})` : "none" }} />
                    </div>
                  </div>

                  {/* text */}
                  <div style={{ gridColumn: reversed ? 1 : 2, gridRow: 1, paddingRight: reversed ? 60 : 0, paddingLeft: reversed ? 0 : 60 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, color: SC.orange, fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontSize: 22 }}>
                      Step {s.n.toString().padStart(2, "0")}
                    </div>
                    <h3 style={{ margin: "10px 0 16px", fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 36, lineHeight: 1.05, letterSpacing: "-0.025em", color: SC.purpleDeep }}>{s.title}</h3>
                    <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: SC.ink, maxWidth: 480 }}>{s.body}</p>
                  </div>
                </div>);

            })}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 96 }}>
          <button style={{
            background: SC.orange, color: "#fff", border: "none",
            padding: "18px 28px", borderRadius: 14,
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: 17, fontWeight: 600, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 12,
            boxShadow: "0 12px 24px rgba(221,83,28,.35)"
          }}>
            Let's make your event better! <ArrowS />
          </button>
        </div>
      </div>
    </section>);

}

// ─────────────────────────────────────────────────────────────
// 4. WHO IS IT FOR — 7 event types
// ─────────────────────────────────────────────────────────────
function ConferencesTile({ type }) {
  // Small circles ("people") that re-group into different cluster configurations every few seconds.
  const N = 12;
  // 4 configurations of group centers (groups of varying sizes)
  const groupings = React.useMemo(() => [
    // 4 groups of 3
    { groups: [[0,1,2],[3,4,5],[6,7,8],[9,10,11]], centers: [[80,70],[230,70],[80,200],[230,200]] },
    // 3 groups of 4
    { groups: [[0,1,2,3],[4,5,6,7],[8,9,10,11]], centers: [[80,90],[230,90],[155,210]] },
    // 2 groups of 6
    { groups: [[0,1,2,3,4,5],[6,7,8,9,10,11]], centers: [[90,140],[220,140]] },
    // 6 groups of 2
    { groups: [[0,1],[2,3],[4,5],[6,7],[8,9],[10,11]], centers: [[60,70],[155,70],[250,70],[60,210],[155,210],[250,210]] }
  ], []);
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % groupings.length), 2400);
    return () => clearInterval(t);
  }, [groupings.length]);

  const W = 310, H = 280;
  // For current step, compute each dot's target (cx,cy) in a small circle around its group center
  const positions = React.useMemo(() => {
    const cfg = groupings[step];
    const arr = new Array(N);
    cfg.groups.forEach((indices, gi) => {
      const [cx, cy] = cfg.centers[gi];
      const r = indices.length <= 2 ? 14 : indices.length <= 3 ? 18 : indices.length <= 4 ? 22 : 28;
      indices.forEach((idx, k) => {
        const ang = (k / indices.length) * Math.PI * 2 - Math.PI / 2;
        arr[idx] = { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r, gi };
      });
    });
    return arr;
  }, [step, groupings]);

  const groupColor = (gi) => {
    const palette = ["#fff", "#ffd9c2", "#fff", "#ffd9c2", "#fff", "#ffd9c2"];
    return palette[gi % palette.length];
  };

  return (
    <div
      className="fx-stagger"
      style={{ gridColumn: "span 6", gridRow: "span 2", background: SC.orange, borderRadius: 28, padding: 40, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 420, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontSize: 22, color: "rgba(255,255,255,.85)" }}>01</div>
        <h3 style={{ margin: "10px 0 16px", fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 44, lineHeight: 1.0, letterSpacing: "-0.03em", color: "#fff" }}>{type.title}</h3>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "rgba(255,255,255,.9)", maxWidth: 420 }}>{type.desc}</p>
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "#fff", fontWeight: 600, fontSize: 15, borderBottom: "1.5px solid #fff", alignSelf: "flex-start", paddingBottom: 4, position: "relative", zIndex: 2 }}>
        Learn more <ArrowS size={14} />
      </div>
      {/* People-as-circles regrouping animation */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ position: "absolute", right: -10, bottom: -10, width: 360, height: 220, pointerEvents: "none", zIndex: 1, opacity: .9 }}>
        {/* soft halos behind each group */}
        {groupings[step].centers.map((c, gi) => (
          <circle key={`h${step}-${gi}`} cx={c[0]} cy={c[1]} r={groupings[step].groups[gi].length <= 2 ? 22 : groupings[step].groups[gi].length <= 3 ? 28 : groupings[step].groups[gi].length <= 4 ? 34 : 42}
            fill="rgba(255,255,255,.10)" style={{ transition: "all .9s cubic-bezier(.4,0,.2,1)" }} />
        ))}
        {positions.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="6" fill={groupColor(p.gi)}
            style={{ transition: "cx 1.1s cubic-bezier(.4,0,.2,1), cy 1.1s cubic-bezier(.4,0,.2,1), fill .9s ease" }} />
        ))}
      </svg>
    </div>);

}

// ─────────────────────────────────────────────────────────────
// 4. WHO IS IT FOR — editorial bento layout
// ─────────────────────────────────────────────────────────────
function WhoIsItForSection({ photoStyle = "rect" }) {
  const types = [
  { title: "Conferences & barcamps", desc: "Ensure everyone leaves with new contacts — even introverts and solo attendees." },
  { title: "Meetups", desc: "Mix people beyond their usual circles and create fresh conversations every time." },
  { title: "Festivals & parties", desc: "Break the ice between groups, make solo guests feel included – make your event more fun!" },
  { title: "Weddings", desc: "Mix Team Bride and Team Groom so the two sides finally get to know each other." },
  { title: "Bars & cafés", desc: "Host speed datings, quiz nights, board game evenings — give regulars a reason to come back." },
  { title: "Schools & universities", desc: "Help students get to know each other, form project teams, or break the ice at the start of a new semester." },
  { title: "Company teams", desc: "Build deeper relationships across departments and help remote colleagues connect face-to-face." }];

  return (
    <section style={{ background: SC.purpleDeep, padding: "140px 60px", color: "#fff", position: "relative", overflow: "hidden" }}>
      {/* big italic background word */}
      <div aria-hidden style={{ position: "absolute", left: "-2%", bottom: -80, fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontSize: 280, color: "rgba(255,255,255,.04)", lineHeight: 1, fontWeight: 400, letterSpacing: "-0.04em", pointerEvents: "none" }}>unforgettable</div>

      <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <SectionEyebrow color={SC.orangeBright}>Who is it for</SectionEyebrow>
          <h2 style={{ margin: "16px auto 0", maxWidth: 900, textAlign: "center", fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 56, lineHeight: 1.0, letterSpacing: "-0.035em", color: "#fff", textWrap: "balance" }}>
            Every gathering becomes unforgettable when <Italic color={SC.orangeBright}>people connect</Italic>
          </h2>
          <p style={{ margin: "20px auto 0", maxWidth: 640, textAlign: "center", fontSize: 18, lineHeight: 1.55, color: "rgba(255,255,255,.7)" }}>Make yours one of them!

          </p>
        </div>

        {/* Editorial 3-2-2 layout */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 20 }}>
          {/* Featured (large) tile */}
          <ConferencesTile type={types[0]} />

          {/* Other 6 tiles */}
          {types.slice(1).map((t, i) =>
          <div key={i} className="fx-stagger" style={{
            gridColumn: "span 3",
            background: i === 1 ? SC.cream : "rgba(255,255,255,.05)",
            color: i === 1 ? SC.purpleDeep : "#fff",
            borderRadius: 22,
            padding: 24,
            border: i === 1 ? "none" : "1px solid rgba(255,255,255,.10)",
            minHeight: 200,
            display: "flex", flexDirection: "column", justifyContent: "space-between"
          }}>
              <div>
                <div style={{ fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontSize: 18, color: i === 1 ? SC.orange : SC.orangeBright, marginBottom: 8 }}>0{i + 2}</div>
                <h4 style={{ margin: "0 0 10px", fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 700, fontSize: 22, lineHeight: 1.1, letterSpacing: "-0.02em" }}>{t.title}</h4>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: i === 1 ? SC.ink : "rgba(255,255,255,.7)" }}>{t.desc}</p>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: i === 1 ? SC.orange : SC.orangeBright, marginTop: 12 }}>
                Learn more <ArrowS size={12} />
              </div>
            </div>
          )}

          {/* Photo tile filling bottom-right of bento grid */}
          {photoStyle === "diamond" ? (
            <div className="fx-stagger" style={{
              gridColumn: "span 6",
              borderRadius: 22,
              padding: "32px 28px",
              position: "relative",
              minHeight: 260,
              background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.10)",
              display: "flex", alignItems: "center", justifyContent: "space-around", gap: 20
            }}>
              {[
                { src: "images/photo7.png", pos: "center 30%", size: 180, dy: -10 },
                { src: "images/photo3.png", pos: "center 30%", size: 220, dy: 14 },
                { src: "images/photo5.png", pos: "center 35%", size: 180, dy: -10 }
              ].map((p, i) => (
                <div key={i} style={{
                  width: p.size, height: p.size, transform: `translateY(${p.dy}px)`,
                  clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                  WebkitClipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                  position: "relative", overflow: "hidden", flexShrink: 0
                }}>
                  <img src={p.src} alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: p.pos, display: "block" }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="fx-stagger" style={{
              gridColumn: "span 6",
              borderRadius: 22,
              overflow: "hidden",
              position: "relative",
              minHeight: 380,
              border: "1px solid rgba(255,255,255,.10)"
            }}>
              <img src="images/photo7.png" alt="People connecting at a conference"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", objectPosition: "center 35%" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(76,25,77,.65) 0%, rgba(76,25,77,.10) 45%, rgba(76,25,77,.0) 100%)" }} />
              <div style={{ position: "absolute", left: 32, bottom: 32, color: "#fff", maxWidth: 360 }}>
                <div style={{ fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontSize: 20, color: "rgba(255,255,255,.85)", marginBottom: 8 }}>Real connections</div>
                <div style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 700, fontSize: 26, lineHeight: 1.15, letterSpacing: "-0.02em" }}>Whoever your audience is — Wonderelo helps them meet.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>);

}

// ─────────────────────────────────────────────────────────────
// 5. FEATURES — image left, 7 features right
// ─────────────────────────────────────────────────────────────
function FeaturesSection() {
  const features = [
  { name: "Flexible duration", desc: "Choose the right length for each session, from speed chats to deeper conversations." },
  { name: "Group size control", desc: "Decide whether participants meet in pairs, trios, or quads — everyone meets everyone." },
  { name: "Discussion topics", desc: "Add topics to spark conversations around shared interests." },
  { name: "Group matching", desc: "Choose whether attendees meet within or across groups." },
  { name: "Meeting points", desc: "Define exactly where participants should meet." },
  { name: "Ice breakers", desc: "Provide optional starter questions to help conversations begin." },
  { name: "Matching memory", desc: "Sessions remember past pairings, so people always meet someone new." }];

  return (
    <section style={{ background: SC.cream, padding: "140px 60px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 96, alignItems: "center" }}>
        {/* Left — visual */}
        <div style={{ position: "relative", aspectRatio: "1/1.05" }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src="assets/Wonderelo-magic-by-networking.png" alt="Magic by networking" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          {/* floating tag */}
          <div style={{ position: "absolute", left: -20, bottom: 40, background: "#fff", borderRadius: 18, padding: "14px 18px", boxShadow: "0 20px 40px rgba(76,25,77,.18)", display: "flex", alignItems: "center", gap: 12, border: "1px solid rgba(76,25,77,.08)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: SC.orange, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800 }}>✦</div>
            <div>
              <div style={{ fontSize: 13, color: SC.purpleDeep, fontWeight: 700 }}>Wonderimage™</div>
              <div style={{ fontSize: 11, color: "rgba(76,25,77,.55)" }}>Find your match instantly</div>
            </div>
          </div>
          <div style={{ position: "absolute", right: -16, top: 40, background: SC.purpleDeep, color: "#fff", borderRadius: 18, padding: "14px 18px", boxShadow: "0 20px 40px rgba(76,25,77,.18)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>⏱</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>5 min rounds</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)" }}>Fully configurable</div>
            </div>
          </div>
        </div>

        {/* Right — content */}
        <div>
          <SectionEyebrow color={SC.purple}>Features</SectionEyebrow>
          <h2 style={{ margin: "16px 0 0", fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 56, lineHeight: 1.0, letterSpacing: "-0.035em", color: SC.purpleDeep, textWrap: "balance" }}>
            Tailor each round to <Italic>fit your event</Italic>
          </h2>
          <p style={{ margin: "20px 0 0", fontSize: 18, lineHeight: 1.55, color: SC.ink, maxWidth: 480 }}>
            Every event is different. Configure each networking round to match your audience, format, and goals.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 20px", marginTop: 40 }}>
            {features.map((f, i) =>
            <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: SC.orange, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                  <CheckS size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 700, fontSize: 16, color: SC.purpleDeep, letterSpacing: "-0.01em" }}>{f.name}</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.5, color: SC.ink, marginTop: 4 }}>{f.desc}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>);

}

// ─────────────────────────────────────────────────────────────
// 6. TESTIMONIALS
// ─────────────────────────────────────────────────────────────
function CyclingPhoto({ sources, interval = 4500, objectPosition = "center", className, style }) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % sources.length), interval);
    return () => clearInterval(t);
  }, [sources.length, interval]);
  return (
    <div className={className} style={style}>
      {sources.map((src, k) => (
        <img key={src} src={src} alt="" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block",
          objectPosition,
          opacity: i === k ? 1 : 0,
          transition: "opacity 1.2s ease"
        }} />
      ))}
    </div>);
}

function TestimonialsSection({ photoStyle = "rect" }) {
  const ts = [
  { q: "It was the first event where we felt confident nobody was left out of networking.", a: "Anna Müller", e: "TechFuture Conference", color: SC.orange },
  { q: "Our attendees used to stick to their own groups. Wonderelo changed that in one evening.", a: "David Novak", e: "CreativeMinds Meetup", color: SC.purpleDeep },
  { q: "At our company offsite, the sales and manufacturing departments finally found their way to each other.", a: "Sophie Laurent", e: "BrightPath Consulting", color: SC.orange },
  { q: "Mixing the bride's team and the groom's team led to a massive party.", a: "Marko & Elena", e: "Wedding in Vienna", color: SC.purpleDeep },
  { q: "People laughed, made new friends, and kept asking when the next quiz night would be.", a: "Lucia Rossi", e: "Caffè Centrale", color: SC.orange },
  { q: "Setup took 5 minutes and participants figured it out on their own. Zero stress.", a: "Jan Horváth", e: "EuroSummit Bratislava", color: SC.purpleDeep }];

  // Initials avatar generator (since we don't have real photos)
  const initials = (name) => name.split(/[\s&]+/).filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  return (
    <section style={{ background: SC.paperDeep, padding: "140px 60px", position: "relative", overflow: "hidden" }}>
      {/* Diamond field — varied sizes scattered across the section as bg pattern */}
      <div aria-hidden style={{ position: "absolute", inset: 0, opacity: .12, pointerEvents: "none" }}>
        <svg width="100%" height="100%" viewBox="0 0 1440 1400" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0 }}>
          {[
          [120, 200, 36, "o"], [340, 140, 18, "p"], [580, 220, 28, "p"], [820, 150, 14, "o"], [1080, 200, 44, "o"], [1280, 160, 20, "p"],
          [200, 1100, 24, "p"], [460, 1180, 40, "o"], [700, 1080, 16, "p"], [960, 1160, 30, "o"], [1220, 1100, 22, "p"],
          [80, 700, 32, "o"], [1340, 720, 18, "p"],
          [260, 480, 12, "p"], [620, 560, 22, "o"], [980, 480, 16, "p"], [1340, 540, 26, "o"],
          [180, 920, 14, "o"], [780, 880, 20, "p"], [1140, 920, 12, "o"]].
          map(([x, y, s, c], i) =>
          <rect key={i} x={x - s / 2} y={y - s / 2} width={s} height={s} transform={`rotate(45 ${x} ${y})`} fill={c === "o" ? SC.orange : SC.purpleDeep} />
          )}
          {/* connection lines */}
          <g stroke={SC.orange} strokeWidth="2" strokeDasharray="4 6" fill="none" opacity=".5">
            <path d="M 120 230 Q 230 100 340 170" />
            <path d="M 580 250 Q 700 180 820 180" />
            <path d="M 1080 230 Q 1180 160 1280 190" />
            <path d="M 200 1130 Q 330 1180 460 1210" />
            <path d="M 700 1110 Q 830 1160 960 1190" />
          </g>
        </svg>
      </div>

      {/* Diamond accents — varied sizes scattered through the section background */}
      <div style={{ position: "absolute", left: "4%", top: 80, width: 28, height: 28, background: SC.orange, transform: "rotate(45deg)", opacity: .9 }} />
      <div style={{ position: "absolute", left: "12%", top: 220, width: 12, height: 12, background: SC.purpleDeep, transform: "rotate(45deg)", opacity: .55 }} />
      <div style={{ position: "absolute", left: "8%", bottom: 160, width: 18, height: 18, background: SC.orange, transform: "rotate(45deg)", opacity: .35 }} />
      <div style={{ position: "absolute", left: "22%", bottom: 60, width: 8, height: 8, background: SC.purpleDeep, transform: "rotate(45deg)", opacity: .7 }} />
      <div style={{ position: "absolute", right: "6%", top: 110, width: 22, height: 22, background: SC.purpleDeep, transform: "rotate(45deg)", opacity: .8 }} />
      <div style={{ position: "absolute", right: "16%", top: 260, width: 10, height: 10, background: SC.orange, transform: "rotate(45deg)", opacity: .55 }} />
      <div style={{ position: "absolute", right: "4%", bottom: 90, width: 32, height: 32, background: SC.orange, transform: "rotate(45deg)", opacity: .35 }} />
      <div style={{ position: "absolute", right: "20%", bottom: 200, width: 14, height: 14, background: SC.purpleDeep, transform: "rotate(45deg)", opacity: .45 }} />

      <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative" }}>
        {/* Photo strip above the title */}
        {photoStyle === "diamond" ? (
          <div className="fx-stagger" style={{ marginBottom: 56, display: "flex", justifyContent: "center", alignItems: "center", gap: 24, padding: "20px 0" }}>
            {[
              { src: "images/photo1.png", pos: "center 35%", size: 180, dy: 10 },
              { src: "images/photo4.png", pos: "center 30%", size: 220, dy: -8 },
              { src: "images/photo2.png", pos: "center 35%", size: 200, dy: 16 },
              { src: "images/photo5.png", pos: "center 30%", size: 180, dy: -10 }
            ].map((p, i) => (
              <div key={i} style={{
                width: p.size, height: p.size, transform: `translateY(${p.dy}px)`,
                clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                WebkitClipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                position: "relative", overflow: "hidden", flexShrink: 0
              }}>
                <img src={p.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: p.pos, display: "block" }} />
              </div>
            ))}
          </div>
        ) : (
          <CyclingPhoto className="fx-stagger" style={{ marginBottom: 64, borderRadius: 24, overflow: "hidden", position: "relative", aspectRatio: "16/5", border: "1px solid rgba(76,25,77,.10)" }}
            sources={["images/photo2.png", "images/photo4.png", "images/photo5.png"]}
            objectPosition="center 35%"
            interval={4500} />
        )}
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <SectionEyebrow>Testimonials</SectionEyebrow>
          <SectionTitle>Here's what happened when organizers <Italic>used Wonderelo</Italic></SectionTitle>
          <Lede>New friendships, deeper connections and lots of fun</Lede>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {ts.map((t, i) =>
          <div key={i} className="fx-testimonial-card" style={{
            background: SC.paper,
            borderRadius: 22,
            padding: 28,
            border: "1px solid rgba(76,25,77,.10)",
            display: "flex", flexDirection: "column", gap: 18,
            minHeight: 280,
            position: "relative"
          }}>
              <div className="fx-testimonial-stars" style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2, 3, 4].map((k) => <StarS key={k} size={16} color={SC.orange} />)}
              </div>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.45, color: SC.purpleDeep, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 600, letterSpacing: "-0.01em", flex: 1 }}>
                "{t.q}"
              </p>
              <div style={{ paddingTop: 14, borderTop: "1px solid rgba(76,25,77,.10)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: t.color, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 15,
                letterSpacing: "-0.02em", flexShrink: 0
              }}>{initials(t.a)}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: SC.purpleDeep }}>{t.a}</div>
                  <div style={{ fontSize: 13, color: SC.ink, opacity: .7, fontFamily: '"Instrument Serif", serif', fontStyle: "italic" }}>{t.e}</div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Photo strip below the testimonial cards */}
        {photoStyle === "diamond" ? (
          <div className="fx-stagger" style={{ marginTop: 80, display: "flex", justifyContent: "center", alignItems: "center", gap: 24, padding: "20px 0" }}>
            {[
              { src: "images/photo6.png", pos: "center 45%", size: 200, dy: -10 },
              { src: "images/photo3.png", pos: "center 30%", size: 240, dy: 16 },
              { src: "images/photo7.png", pos: "center 35%", size: 200, dy: -10 }
            ].map((p, i) => (
              <div key={i} style={{
                width: p.size, height: p.size, transform: `translateY(${p.dy}px)`,
                clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                WebkitClipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                position: "relative", overflow: "hidden", flexShrink: 0
              }}>
                <img src={p.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: p.pos, display: "block" }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="fx-stagger" style={{ marginTop: 80, display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 24, alignItems: "stretch" }}>
            {/* Featured testimonial card on the left */}
            <div className="fx-testimonial-card" style={{
              background: SC.purpleDeep,
              color: "#fff",
              borderRadius: 24,
              padding: "36px 36px 32px",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              border: "1px solid rgba(255,255,255,.08)",
              position: "relative", overflow: "hidden"
            }}>
              <div aria-hidden style={{ position: "absolute", top: -24, right: -10, fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontSize: 200, lineHeight: 1, color: "rgba(255,255,255,.06)" }}>"</div>
              <div className="fx-testimonial-stars" style={{ display: "flex", gap: 4, position: "relative" }}>
                {[0,1,2,3,4].map((k) => <StarS key={k} size={18} color={SC.orange} />)}
              </div>
              <p style={{ margin: "20px 0 0", fontSize: 22, lineHeight: 1.35, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 600, letterSpacing: "-0.015em", position: "relative", color: "#fff" }}>
                "We organized a 200-person company offsite — by the second round, the office was buzzing like a festival. Wonderelo turned awkward small talk into the highlight of our year."
              </p>
              <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.12)", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: SC.orange, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", flexShrink: 0 }}>KP</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Klára Petrová</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,.65)", fontFamily: '"Instrument Serif", serif', fontStyle: "italic" }}>Head of People · Bright Holding</div>
                </div>
              </div>
            </div>
            {/* Narrower cycling photo on the right */}
            <CyclingPhoto style={{ borderRadius: 24, overflow: "hidden", position: "relative", border: "1px solid rgba(76,25,77,.10)", minHeight: 360 }}
              sources={["images/photo3.png", "images/photo4.png", "images/photo6.png"]}
              objectPosition="center 40%"
              interval={4500} />
          </div>
        )}
      </div>
    </section>);

}

// ─────────────────────────────────────────────────────────────
// 7. TRUSTED BY — real customer/event logos
// ─────────────────────────────────────────────────────────────
function TrustedBySection() {
  const logos = [
  { src: "assets/logos/ecommercebridge.svg", alt: "Ecommerce Bridge", h: 32 },
  { src: "assets/logos/upterdam.svg", alt: "Upterdam", h: 14 },
  { src: "assets/logos/bezcyklenia.png", alt: "Bez Cyklenia", h: 30 },
  { src: "assets/logos/blanc-academy.svg", alt: "Blanc Academy", h: 28 },
  { src: "assets/logos/web-summit.svg", alt: "Web Summit", h: 20 },
  { src: "assets/logos/sxsw.svg", alt: "SXSW", h: 22 },
  { src: "assets/logos/slush.svg", alt: "Slush", h: 20 },
  { src: "assets/logos/collision.svg", alt: "Collision", h: 18 },
  { src: "assets/logos/techcrunch-disrupt.svg", alt: "TechCrunch Disrupt", h: 30 },
  { src: "assets/logos/tnw.svg", alt: "TNW", h: 22 },
  { src: "assets/logos/ces.svg", alt: "CES", h: 22 },
  { src: "assets/logos/founders-summit.svg", alt: "Founders Summit", h: 28 }];

  return (
    <section style={{ background: SC.cream, padding: "100px 60px", borderBottom: "1px solid rgba(76,25,77,.10)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: ".26em", color: "rgba(76,25,77,.55)", textTransform: "uppercase" }}>Trusted by event organizers at</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "40px 48px", marginTop: 48, alignItems: "center", justifyItems: "center" }}>
          {logos.map((l) =>
          <img key={l.alt} src={l.src} alt={l.alt} style={{ height: l.h, width: "auto", maxWidth: 140, objectFit: "contain", opacity: .85 }} />
          )}
        </div>
      </div>
    </section>);

}

// ─────────────────────────────────────────────────────────────
// 8. BLOG SECTION
// ─────────────────────────────────────────────────────────────
function BlogSection() {
  const posts = [
  { tag: "Networking", title: "Meeting points: the secret ingredient of great networking rounds", desc: "Why designated meeting spots make networking less awkward and way more fun.", time: "5 min read" },
  { tag: "Strategy", title: "How to promote your event and get more signups", desc: "From social media to on-site QR codes — practical ways to drive attendance.", time: "7 min read" },
  { tag: "Research", title: "Random vs AI matching: which one actually works?", desc: "We tested both approaches at real events. The results surprised us.", time: "6 min read" }];

  return (
    <section style={{ background: SC.cream, padding: "140px 60px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 60, gap: 40 }}>
          <div>
            <SectionEyebrow color={SC.purple}>From the journal</SectionEyebrow>
            <h2 style={{ margin: "16px 0 0", maxWidth: 700, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 56, lineHeight: 1.0, letterSpacing: "-0.035em", color: SC.purpleDeep, textWrap: "balance" }}>
              Discover the <Italic>magic</Italic> of networking
            </h2>
          </div>
          <button style={{ background: "transparent", color: SC.purpleDeep, border: `1.5px solid ${SC.purpleDeep}`, padding: "14px 24px", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
            All articles <ArrowS />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
          {posts.map((p, i) =>
          <article key={i} style={{ background: SC.paper, borderRadius: 24, overflow: "hidden", border: "1px solid rgba(76,25,77,.10)", display: "flex", flexDirection: "column" }}>
              <div style={{ aspectRatio: "16/10", background: `linear-gradient(135deg, ${i === 0 ? SC.orange : i === 1 ? SC.purpleDeep : "#c44a17"}, ${i === 0 ? "#ff8a4a" : i === 1 ? "#7a3d8a" : SC.orange})`, position: "relative", overflow: "hidden" }}>
                {/* abstract illustration */}
                <div style={{ position: "absolute", left: "20%", top: "30%", width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.18)" }} />
                <div style={{ position: "absolute", right: "15%", bottom: "20%", width: 50, height: 50, borderRadius: 12, background: "rgba(255,255,255,.22)", transform: "rotate(20deg)" }} />
                <div style={{ position: "absolute", left: "55%", top: "55%", width: 30, height: 30, background: "rgba(255,255,255,.25)", transform: "rotate(45deg)" }} />
              </div>
              <div style={{ padding: 28, flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: SC.orange }}>{p.tag}</span>
                  <span style={{ fontSize: 12, color: "rgba(76,25,77,.55)" }}>{p.time}</span>
                </div>
                <h3 style={{ margin: 0, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 700, fontSize: 22, lineHeight: 1.15, letterSpacing: "-0.02em", color: SC.purpleDeep, textWrap: "balance" }}>{p.title}</h3>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: SC.ink }}>{p.desc}</p>
                <div style={{ marginTop: "auto", paddingTop: 8, display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: SC.orange }}>
                  Read article <ArrowS size={14} />
                </div>
              </div>
            </article>
          )}
        </div>
      </div>
    </section>);

}

// ─────────────────────────────────────────────────────────────
// 9. CTA — bold finale
// ─────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section style={{ background: SC.orange, padding: "140px 60px", position: "relative", overflow: "hidden", color: "#fff" }}>
      {/* decorative diamonds */}
      <div style={{ position: "absolute", left: "8%", top: 80, width: 22, height: 22, background: SC.purpleDeep, transform: "rotate(45deg)" }} />
      <div style={{ position: "absolute", left: "20%", bottom: 100, width: 14, height: 14, background: "#fff", transform: "rotate(45deg)", opacity: .4 }} />
      <div style={{ position: "absolute", right: "10%", top: 120, width: 18, height: 18, background: SC.purpleDeep, transform: "rotate(45deg)" }} />
      <div style={{ position: "absolute", right: "22%", bottom: 80, width: 16, height: 16, background: "#fff", transform: "rotate(45deg)", opacity: .5 }} />
      <div style={{ position: "absolute", left: "45%", top: 50, width: 10, height: 10, background: "#fff", transform: "rotate(45deg)", opacity: .5 }} />

      <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative" }}>
        <h2 style={{
          margin: 0,
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontWeight: 800,
          fontSize: 88,
          lineHeight: .95,
          letterSpacing: "-0.04em",
          color: "#fff",
          textWrap: "balance"
        }}>
          Ready to make your event <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontWeight: 400, color: SC.purpleDeep }}>unforgettable?</span>
        </h2>
        <p style={{ margin: "28px auto 0", maxWidth: 420, fontSize: 19, lineHeight: 1.5, color: "rgba(255,255,255,.9)" }}>
          Set up your first networking round in 5 minutes. No credit card required
        </p>
        <div style={{ marginTop: 40, display: "flex", justifyContent: "center", gap: 16, alignItems: "center" }}>
          <button style={{
            background: "#fff", color: SC.orange, border: "none",
            padding: "20px 32px", borderRadius: 14,
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: 17, fontWeight: 700, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 12,
            boxShadow: "0 16px 32px rgba(0,0,0,.15)"
          }}>
            Start for free <ArrowS />
          </button>
        </div>
      </div>
    </section>);

}

// ─────────────────────────────────────────────────────────────
// 10. LEAD MAGNET
// ─────────────────────────────────────────────────────────────
function LeadMagnetSection() {
  const bullets = [
  "How to structure networking sessions",
  "Ice breaker questions that actually work",
  "Timing and group size best practices",
  "Post-event follow-up templates"];

  return (
    <section style={{ background: SC.cream, padding: "140px 60px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 80, alignItems: "center" }}>
        <div>
          <SectionEyebrow>Free guide</SectionEyebrow>
          <h2 style={{ margin: "16px 0 0", fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 52, lineHeight: 1.0, letterSpacing: "-0.035em", color: SC.purpleDeep, textWrap: "balance" }}>
            The Ultimate Guide to <Italic>Event Networking</Italic>
          </h2>
          <p style={{ margin: "20px 0 0", fontSize: 17, lineHeight: 1.55, color: SC.ink, maxWidth: 440 }}>
            Learn proven strategies to turn networking from an afterthought into the highlight of your event. Includes templates, timelines, and real examples.
          </p>
          <ul style={{ margin: "32px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
            {bullets.map((b, i) =>
            <li key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15, color: SC.purpleDeep, fontWeight: 500 }}>
                <CheckS size={18} /> {b}
              </li>
            )}
          </ul>
        </div>

        {/* Form card */}
        <div style={{ background: "#fff", borderRadius: 28, padding: 40, boxShadow: "0 30px 60px rgba(76,25,77,.12)", border: "1px solid rgba(76,25,77,.08)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[
            { label: "Name", placeholder: "Your name" },
            { label: "Email", placeholder: "you@example.com" }].
            map((f, i) =>
            <div key={i}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: SC.purpleDeep, marginBottom: 6 }}>{f.label}</label>
                <div style={{ height: 46, border: "1.5px solid rgba(76,25,77,.18)", borderRadius: 10, padding: "0 14px", display: "flex", alignItems: "center", fontSize: 14, color: "rgba(76,25,77,.5)", background: SC.paper }}>{f.placeholder}</div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: SC.purpleDeep, marginBottom: 6 }}>Event type</label>
                <div style={{ height: 46, border: "1.5px solid rgba(76,25,77,.18)", borderRadius: 10, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, color: "rgba(76,25,77,.5)", background: SC.paper }}>
                  Select <span style={{ opacity: .5 }}>▾</span>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: SC.purpleDeep, marginBottom: 6 }}>Participants</label>
                <div style={{ height: 46, border: "1.5px solid rgba(76,25,77,.18)", borderRadius: 10, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14, color: "rgba(76,25,77,.5)", background: SC.paper }}>
                  Select <span style={{ opacity: .5 }}>▾</span>
                </div>
              </div>
            </div>
            <button style={{
              marginTop: 8, width: "100%",
              background: SC.purpleDeep, color: "#fff", border: "none",
              padding: "16px 24px", borderRadius: 12,
              fontFamily: '"Space Grotesk", sans-serif',
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10
            }}>
              Get the free guide <ArrowS />
            </button>
            <p style={{ margin: 0, textAlign: "center", fontSize: 12, color: "rgba(76,25,77,.55)" }}>No spam, ever. We only send useful content.</p>
          </div>
        </div>
      </div>
    </section>);

}

// ─────────────────────────────────────────────────────────────
// 11. FOOTER
// ─────────────────────────────────────────────────────────────
function FooterSection() {
  const cols = [
  { title: "Product", links: ["Features", "How it works", "Pricing"] },
  { title: "Company", links: ["Our story", "Newsroom", "Contact us"] },
  { title: "Support", links: ["Help center"] },
  { title: "Legal", links: ["Terms of use", "Privacy policy"] }];

  const Social = ({ children }) =>
  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, color: "rgba(255,255,255,.6)" }}>{children}</span>;

  return (
    <footer style={{ background: SC.purpleInk, color: "rgba(255,255,255,.7)", padding: "80px 60px 40px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(4, 1fr)", gap: 60, marginBottom: 60 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <img src="assets/Wonderelo-logo-symbol.png" alt="" style={{ width: 96, height: 96, transform: "rotate(-6deg)" }} />
              <span style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: "#fff" }}>wonderelo</span>
            </div>
          </div>
          {cols.map((c) =>
          <div key={c.title}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 18 }}>{c.title}</div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {c.links.map((l) =>
              <li key={l} className="wn-footer-link" style={{ fontSize: 14, color: "rgba(255,255,255,.65)", cursor: "pointer", transition: "color .2s ease, transform .2s ease", width: "fit-content" }}>{l}</li>
              )}
              </ul>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,.10)", paddingTop: 30, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)" }}>© 2025 Wonderelo. All rights reserved.{(() => {try {const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";return tz.startsWith("Europe/") || tz === "Atlantic/Reykjavik" || tz === "Atlantic/Faroe" || tz === "Atlantic/Canary" || tz === "Atlantic/Madeira" || tz === "Atlantic/Azores" ? " Created in Europe." : "";} catch (e) {return "";}})()}</div>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <Social>
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
            </Social>
            <Social>
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            </Social>
            <Social>
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            </Social>
            <Social>
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" /></svg>
            </Social>
          </div>
        </div>
      </div>
    </footer>);

}

// ─────────────────────────────────────────────────────────────
// COMBINER — full homepage that stacks everything below the hero.
// Hero is rendered separately; this just renders sections 1..11.
// ─────────────────────────────────────────────────────────────
function HomepageBelowHero({ photoStyle = "rect" }) {
  return (
    <div style={{ width: "100%", fontFamily: '"Space Grotesk", sans-serif', background: SC.cream }}>
      <ProblemSectionFocused />
      <HowItWorksSection />
      <WhoIsItForSection photoStyle={photoStyle} />
      <FeaturesVisualSection />
      <TestimonialsSection photoStyle={photoStyle} />
      <TrustedBySection />
      <BlogSection />
      <CTASection />
      <LeadMagnetSection />
      <FooterSection />
    </div>);

}

// ─────────────────────────────────────────────────────────────
// 5b. FEATURES VISUAL — every feature gets its own illustrated tile
// ─────────────────────────────────────────────────────────────
function FeaturesVisualSection() {
  return (
    <section style={{ background: SC.cream, padding: "140px 60px", position: "relative" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <SectionEyebrow color={SC.purple}>Features</SectionEyebrow>
          <SectionTitle>Tailor each round to <Italic>fit your event</Italic></SectionTitle>
          <Lede>Every event is different. Configure each networking round to match your audience, format, and goals.</Lede>
        </div>

        {/* Bento grid: featured first row (wide+narrow), then 3+3 standard tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 20 }}>
          {/* 1. Flexible duration — wide hero tile */}
          <FeatureTile
            span={4}
            tall
            label="01 · Duration"
            title="Flexible duration"
            desc="Choose the right length for each session — from 3-minute speed chats to hour-long deep dives."
            visual={<DurationVisual />}
            topLeftBadge={<FlipClock start={600} />}
            bg={SC.orange}
            fg="#fff" />
          

          {/* 2. Group size control — tall narrow */}
          <FeatureTile
            span={2}
            tall
            label="02 · Size"
            title="Group size"
            desc="Set anything from intimate one-on-ones to larger group brainstorms — whatever the moment calls for."
            visual={<GroupSizeVisual />}
            bg={SC.paper}
            fg={SC.purpleDeep} />
          

          {/* 3. Discussion topics */}
          <FeatureTile
            span={2}
            label="03 · Topics"
            title="Discussion topics"
            desc="Match people who share the same interests so every conversation starts on common ground."
            visual={<TopicsVisual />}
            bg={SC.purpleDeep}
            fg="#fff" />
          

          {/* 4. Group matching */}
          <FeatureTile
            span={2}
            label="04 · Matching"
            title="Group matching"
            desc="Great for companies. Matching within groups builds the teams. Matching across groups sparks cross-department collaboration."
            visual={<MatchingVisual />}
            bg={SC.paper}
            fg={SC.purpleDeep} />
          

          {/* 5. Meeting points */}
          <FeatureTile
            span={2}
            label="05 · Locations"
            title="Meeting points"
            desc="You can use distinctive spots already in your venue — so people always know exactly where to go, no extra signage required."
            visual={<MeetingPointsVisual />}
            bg={SC.paperDeep}
            fg={SC.purpleDeep} />
          

          {/* 6. Ice breakers — wide */}
          <FeatureTile
            span={4}
            label="06 · Conversation"
            title="Ice breakers"
            desc="Optional starter questions help even the shyest attendees begin a real conversation."
            visual={<IcebreakersVisual />}
            bg={SC.purpleDeep}
            fg="#fff" />
          

          {/* 7. Matching memory — wide */}
          <FeatureTile
            span={2}
            label="07 · Memory"
            title="Matching memory"
            desc="Rounds remember past pairings — people always meet someone new."
            visual={<MemoryVisual />}
            bg={SC.orange}
            fg="#fff" />
          
        </div>
      </div>
    </section>);

}

// Shared state so the Duration slider and the Flip Clock stay in sync.
const _durationStore = { val: 10, listeners: new Set() };
function setDurationVal(v) {
  _durationStore.val = v;
  _durationStore.listeners.forEach((l) => l(v));
}
function useDurationVal() {
  const [v, setV] = React.useState(_durationStore.val);
  React.useEffect(() => {
    _durationStore.listeners.add(setV);
    return () => _durationStore.listeners.delete(setV);
  }, []);
  return [v, setDurationVal];
}

function FlipDigit({ digit }) {
  const [prev, setPrev] = React.useState(digit);
  const [animKey, setAnimKey] = React.useState(0);
  React.useEffect(() => {
    if (prev !== digit) {
      setAnimKey((k) => k + 1);
      const id = setTimeout(() => setPrev(digit), 580);
      return () => clearTimeout(id);
    }
  }, [digit, prev]);
  const flipping = prev !== digit;
  return (
    <div className="fc-cell">
      {/* Static halves — show NEW digit (bottom static stays as PREV until flip ends) */}
      <div className="fc-half fc-top"><span>{digit}</span></div>
      <div className="fc-half fc-bot"><span>{flipping ? prev : digit}</span></div>
      {/* Hinge highlight */}
      <div className="fc-hinge" />
      {flipping && (
        <React.Fragment>
          {/* Top flap: shows OLD digit, rotates 0 → -90 (origin bottom) */}
          <div key={"t" + animKey} className="fc-flap fc-flap-top"><span>{prev}</span></div>
          {/* Bottom flap: shows NEW digit, rotates 90 → 0 (origin top, delayed) */}
          <div key={"b" + animKey} className="fc-flap fc-flap-bot"><span>{digit}</span></div>
        </React.Fragment>
      )}
    </div>
  );
}

function FlipClock({ start = 600 }) {
  const [minutes] = useDurationVal();
  const total = Math.max(1, minutes) * 60;
  const [s, setS] = React.useState(total);
  // Reset countdown whenever the chosen duration changes.
  React.useEffect(() => { setS(total); }, [total]);
  React.useEffect(() => {
    const t = setInterval(() => setS((v) => (v <= 1 ? total : v - 1)), 1000);
    return () => clearInterval(t);
  }, [total]);
  const m = Math.floor(s / 60), sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  const [m1, m2] = pad(m).split("");
  const [s1, s2] = pad(sec).split("");
  return (
    <div className="fc-clock" aria-label="Round timer">
      <FlipDigit digit={m1} />
      <FlipDigit digit={m2} />
      <span className="fc-colon">:</span>
      <FlipDigit digit={s1} />
      <FlipDigit digit={s2} />
    </div>
  );
}

function FeatureTile({ span, tall, label, title, desc, visual, bg, fg, topLeftBadge }) {
  return (
    <div className="fx-feature-tile" style={{
      gridColumn: `span ${span}`,
      gridRow: tall ? "span 2" : "span 1",
      background: bg,
      color: fg,
      borderRadius: 28,
      padding: 28,
      minHeight: tall ? 460 : 280,
      display: "flex", flexDirection: "column",
      gap: 16,
      border: bg === SC.paper || bg === SC.paperDeep ? "1px solid rgba(76,25,77,.10)" : "none",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase",
          color: fg === "#fff" ? "rgba(255,255,255,.7)" : "rgba(76,25,77,.5)",
          marginTop: topLeftBadge ? 8 : 0
        }}>{label}</span>
        {topLeftBadge}
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: tall ? 220 : 100, position: "relative" }}>
        {visual}
      </div>

      <div>
        <h3 style={{
          margin: 0,
          fontFamily: '"Bricolage Grotesque", sans-serif',
          fontWeight: 800,
          fontSize: tall ? 28 : 20,
          lineHeight: 1.05,
          letterSpacing: "-0.025em",
          color: fg
        }}>{title}</h3>
        <p style={{
          margin: "8px 0 0",
          fontSize: tall ? 15 : 13,
          lineHeight: 1.5,
          color: fg === "#fff" ? "rgba(255,255,255,.85)" : SC.ink,
          opacity: fg === "#fff" ? 1 : .85
        }}>{desc}</p>
      </div>
    </div>);

}

// ── Visuals ────────────────────────────────────────────────────────

function DurationVisual() {
  // Single draggable handle. Range 3–60 min; default 10 ("Standard").
  const MIN = 3;
  const MAX = 60;
  const stops = [3, 15, 30, 60];
  const [val, setVal] = useDurationVal();
  const trackRef = React.useRef(null);

  const pctFor = (v) => (v - MIN) / (MAX - MIN) * 100;
  const pct = pctFor(val);

  const updateFromClientX = (clientX) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const raw = MIN + ratio * (MAX - MIN);
    setVal(Math.round(raw));
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    updateFromClientX(e.clientX);
    const onMove = (ev) => updateFromClientX(ev.clientX);
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // Active chip follows the value with sensible bands.
  const activeChip =
  val <= 5 ? 0 :
  val <= 20 ? 1 :
  val <= 40 ? 2 : 3;

  return (
    <div style={{ width: "100%", padding: "12px 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, opacity: .85, fontSize: 12, fontWeight: 600 }}>
        {stops.map((s) =>
        <span key={s} style={{ color: "#fff" }}>{s} min</span>
        )}
      </div>
      {/* track */}
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        style={{ position: "relative", height: 8, borderRadius: 999, background: "rgba(255,255,255,.25)", cursor: "pointer", touchAction: "none" }}>
        {/* fill */}
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, top: 0, bottom: 0, borderRadius: 999, background: "#fff" }} />
        {/* single handle */}
        <div style={{ position: "absolute", left: `${pct}%`, top: "50%", transform: "translate(-50%,-50%)", width: 22, height: 22, borderRadius: "50%", background: "#fff", border: `4px solid ${SC.purpleDeep}`, boxShadow: "0 2px 6px rgba(0,0,0,.2)" }} />
        {/* live value bubble */}
        <div style={{ position: "absolute", left: `${pct}%`, top: -34, transform: "translateX(-50%)", background: "#fff", color: SC.purpleDeep, fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>{val} min</div>
      </div>
      <div style={{ marginTop: 28, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
        { l: "Speed chat · 3 min", v: 3 },
        { l: "Standard · 10 min", v: 10 },
        { l: "Long form · 30 min", v: 30 },
        { l: "Panel · 60 min", v: 60 }].
        map((c, i) => {
          const on = i === activeChip;
          return (
            <span
              key={i}
              className="duration-chip"
              onClick={() => setVal(c.v)}
              onKeyDown={(e) => {if (e.key === "Enter" || e.key === " ") {e.preventDefault();setVal(c.v);}}}
              tabIndex={0}
              style={{
                background: on ? "#fff" : "rgba(255,255,255,.12)",
                color: on ? SC.purpleDeep : "#fff",
                border: on ? "none" : "1px solid rgba(255,255,255,.3)",
                padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                userSelect: "none",
                transition: "background .15s ease, color .15s ease, transform .15s ease"
              }}>{c.l}</span>);

        })}
      </div>
    </div>);

}

function GroupSizeVisual() {
  // Three options framed as group sizes — pairs (2), trios (3), quads (4) — where everyone meets everyone
  const Avatar = ({ c = SC.orange, s = 18 }) =>
  <div style={{ width: s, height: s, borderRadius: "50%", background: c, border: `2px solid ${SC.cream}`, flexShrink: 0 }} />;

  const Row = ({ active, label, count, palette }) =>
  <div style={{
    width: "100%", padding: "12px 14px", borderRadius: 14,
    background: active ? SC.purpleDeep : "rgba(76,25,77,.08)",
    color: active ? "#fff" : SC.purpleDeep,
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10
  }}>
      <div style={{ display: "flex", gap: 5 }}>
        {Array.from({ length: count }).map((_, i) =>
      <Avatar key={i} c={palette[i % palette.length]} />
      )}
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, opacity: active ? 1 : .6, whiteSpace: "nowrap" }}>{label}</span>
    </div>;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
      <Row active label="Pairs" count={2} palette={[SC.orange, "#fff"]} />
      <Row label="Trios" count={3} palette={[SC.orange, SC.purpleDeep, SC.orange]} />
      <Row label="Quads" count={4} palette={[SC.orange, SC.purpleDeep, SC.orange, SC.purpleDeep]} />
    </div>);

}

function TopicsVisual() {
  const tags = ["#startups", "#design", "#ai", "#climate", "#travel", "#parenting"];
  const [active, setActive] = React.useState({ 0: true, 3: true });
  const toggle = (i) => setActive((a) => ({ ...a, [i]: !a[i] }));
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", alignItems: "center", padding: 8 }}>
      {tags.map((t, i) => {
        const on = !!active[i];
        return (
          <span
            key={t}
            role="button"
            tabIndex={0}
            className="wn-topic-tag"
            onClick={() => toggle(i)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(i); } }}
            style={{
              background: on ? SC.orange : "rgba(255,255,255,.08)",
              color: "#fff",
              border: on ? "1px solid transparent" : "1px solid rgba(255,255,255,.2)",
              padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
              fontFamily: '"Space Grotesk", sans-serif',
              userSelect: "none"
            }}>{t}</span>);

      })}
    </div>);

}

function MatchingVisual() {
  // Two circular cohorts. Toggle Within / Across. Within draws lines among
  // dots inside each circle; Across draws lines between the two circles.
  const [mode, setMode] = React.useState("across");

  const Dot = ({ cx, cy, c }) =>
  <circle cx={cx} cy={cy} r="6" fill={c} stroke={SC.cream} strokeWidth="2" />;

  // Group A — left circle, center (60, 70)
  const A = [
  { x: 60, y: 40 },
  { x: 36, y: 70 },
  { x: 84, y: 70 },
  { x: 60, y: 100 }];

  // Group B — right circle, center (160, 70)
  const B = [
  { x: 160, y: 40 },
  { x: 136, y: 70 },
  { x: 184, y: 70 },
  { x: 160, y: 100 }];

  // Within-group connection pairs (indices into A / B) — full mesh: every dot connected to every other
  const withinPairs = [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];

  const tabBase = {
    flex: 1, textAlign: "center", padding: "6px 10px", borderRadius: 999,
    fontSize: 11, fontWeight: 700, cursor: "pointer", userSelect: "none",
    transition: "background .15s ease, color .15s ease, opacity .15s ease"
  };
  const tabActive = { background: SC.purpleDeep, color: "#fff" };
  const tabIdle = { color: SC.purpleDeep, opacity: .55 };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
      {/* mode toggle */}
      <div style={{ display: "flex", gap: 6, padding: 4, background: "rgba(76,25,77,.08)", borderRadius: 999 }}>
        <span
          role="button"
          tabIndex={0}
          onClick={() => setMode("within")}
          onKeyDown={(e) => {if (e.key === "Enter" || e.key === " ") {e.preventDefault();setMode("within");}}}
          style={{ ...tabBase, ...(mode === "within" ? tabActive : tabIdle) }}>Within</span>
        <span
          role="button"
          tabIndex={0}
          onClick={() => setMode("across")}
          onKeyDown={(e) => {if (e.key === "Enter" || e.key === " ") {e.preventDefault();setMode("across");}}}
          style={{ ...tabBase, ...(mode === "across" ? tabActive : tabIdle) }}>Across</span>
      </div>

      {/* canvas with two circles + connections */}
      <div style={{ position: "relative", width: "100%", height: 150, background: SC.cream, borderRadius: 14, border: "1px solid rgba(76,25,77,.12)", overflow: "hidden" }}>
        <svg viewBox="0 0 220 140" preserveAspectRatio="xMidYMid meet" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          {/* circle outlines */}
          <circle cx="60" cy="70" r="38" fill="none" stroke={SC.orange} strokeOpacity=".4" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="160" cy="70" r="38" fill="none" stroke={SC.purpleDeep} strokeOpacity=".4" strokeWidth="1.5" strokeDasharray="3 3" />

          {mode === "across" ?
          <g>
              {A.map((a, i) =>
            <line key={i} x1={a.x} y1={a.y} x2={B[i].x} y2={B[i].y} stroke={SC.purpleDeep} strokeOpacity=".5" strokeWidth="1.4" />
            )}
              <line x1={A[0].x} y1={A[0].y} x2={B[3].x} y2={B[3].y} stroke={SC.orange} strokeOpacity=".5" strokeWidth="1.4" />
              <line x1={A[3].x} y1={A[3].y} x2={B[0].x} y2={B[0].y} stroke={SC.orange} strokeOpacity=".5" strokeWidth="1.4" />
            </g> :

          <g>
              {withinPairs.map(([i, j], k) =>
            <line key={`aw${k}`} x1={A[i].x} y1={A[i].y} x2={A[j].x} y2={A[j].y} stroke={SC.orange} strokeOpacity=".55" strokeWidth="1.4" />
            )}
              {withinPairs.map(([i, j], k) =>
            <line key={`bw${k}`} x1={B[i].x} y1={B[i].y} x2={B[j].x} y2={B[j].y} stroke={SC.purpleDeep} strokeOpacity=".55" strokeWidth="1.4" />
            )}
            </g>
          }

          {/* dots */}
          {A.map((p, i) => <Dot key={`a${i}`} cx={p.x} cy={p.y} c={SC.orange} />)}
          {B.map((p, i) => <Dot key={`b${i}`} cx={p.x} cy={p.y} c={SC.purpleDeep} />)}
        </svg>
      </div>
    </div>);

}

function MeetingPointsVisualMap() {
  // Backup of original: mini map with pins
  const Pin = ({ x, y, c = SC.orange, n }) =>
  <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-100%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ background: c, color: "#fff", width: 24, height: 24, borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 8px rgba(0,0,0,.2)" }}>
        <span style={{ transform: "rotate(45deg)", fontSize: 11, fontWeight: 700 }}>{n}</span>
      </div>
    </div>;

  return (
    <div style={{ position: "relative", width: "100%", height: 150, background: "#fff", borderRadius: 14, border: "1px solid rgba(76,25,77,.12)", overflow: "hidden" }}>
      <svg viewBox="0 0 200 150" width="100%" height="100%">
        <path d="M0 50 L200 70" stroke="rgba(76,25,77,.1)" strokeWidth="8" />
        <path d="M50 0 L70 150" stroke="rgba(76,25,77,.1)" strokeWidth="8" />
        <path d="M130 0 L160 150" stroke="rgba(76,25,77,.1)" strokeWidth="8" />
        <path d="M0 110 L200 130" stroke="rgba(76,25,77,.1)" strokeWidth="8" />
      </svg>
      <Pin x={28} y={45} c={SC.orange} n="A" />
      <Pin x={68} y={70} c={SC.purpleDeep} n="B" />
      <Pin x={82} y={35} c={SC.orange} n="C" />
    </div>);

}

function MeetingPointsVisual() {
  // Three concrete meeting points, illustrated as picked-from-the-venue scenes.
  // Vertical layout mirrors the Matching card: a label "tab" on top (level with
  // the Within/Across toggle), then a fixed-height image (level with the canvas).
  const Card = ({ src, alt, label, num }) =>
  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
      {/* label tab — height/padding mirror the Within/Across toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 10px", background: "rgba(76,25,77,.08)", borderRadius: 999 }}>
        <span style={{ width: 16, height: 16, borderRadius: "50%", background: SC.orange, color: "#fff", fontSize: 9, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{num}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: SC.purpleDeep, letterSpacing: ".02em", whiteSpace: "nowrap" }}>{label}</span>
      </div>
      {/* image card — height matches Matching's canvas */}
      <div style={{ width: "100%", height: 150, borderRadius: 14, border: "1px solid rgba(76,25,77,.12)", overflow: "hidden", background: "#f3c9cc" }}>
        <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
      </div>
    </div>;


  return (
    <div style={{ width: "100%", display: "flex", gap: 8 }}>
      <Card num="1" label="Table" src="assets/meeting-table.png" alt="Cocktail table with a flower vase" />
      <Card num="2" label="Tree" src="assets/meeting-tree.png" alt="Chair beside a tree" />
      <Card num="3" label="Bar" src="assets/meeting-bar.png" alt="Bar counter with a stool" />
    </div>);

}

function IcebreakersVisual() {
  const questions = [
  "What's a good movie you've seen lately?",
  "If you could swap jobs with anyone for a day, who?",
  "What's a small thing that recently made you happy?"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", padding: "0 8px" }}>
      {questions.map((q, i) =>
      <div key={i} style={{
        background: i === 0 ? SC.orange : "rgba(255,255,255,.08)",
        color: "#fff",
        border: i === 0 ? "none" : "1px solid rgba(255,255,255,.18)",
        borderRadius: 14,
        padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 12,
        fontSize: 14
      }}>
          <div style={{
          flexShrink: 0,
          width: 26, height: 26, borderRadius: "50%",
          background: i === 0 ? "#fff" : "rgba(255,255,255,.15)",
          color: i === 0 ? SC.orange : "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontWeight: 700, fontSize: 14
        }}>?</div>
          <span style={{ fontStyle: "italic", fontFamily: '"Instrument Serif", serif', fontSize: 17, lineHeight: 1.3 }}>"{q}"</span>
        </div>
      )}
    </div>);

}

function MemoryVisual() {
  // History list with strikethrough = already met
  return (
    <div style={{ width: "100%", padding: "0 4px", display: "flex", flexDirection: "column", gap: 8 }}>
      {[
      { name: "Sara M.", met: true },
      { name: "Tom K.", met: true },
      { name: "Lukas H.", met: false }].
      map((r, i) =>
      <div key={i} style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "rgba(255,255,255,.12)",
        padding: "10px 12px", borderRadius: 12,
        textDecoration: r.met ? "line-through" : "none",
        opacity: r.met ? .55 : 1
      }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", flexShrink: 0 }} />
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 600, flex: 1 }}>{r.name}</span>
          {r.met ?
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 600 }}>met</span> :
        <span style={{ fontSize: 11, color: "#fff", fontWeight: 700, background: "rgba(255,255,255,.2)", padding: "3px 8px", borderRadius: 999 }}>NEXT</span>
        }
        </div>
      )}
    </div>);

}

Object.assign(window, { HomepageBelowHero, ProblemSection, ProblemSectionFocused, OrganizeBannerVariants });

// ─────────────────────────────────────────────────────────────
// CTA BANNER — 3 variants for "Organize networking rounds!"
// Two-line, orange background — meant to sit under the How it works lede
// ─────────────────────────────────────────────────────────────
function OrganizeBannerVariants() {
  const wrap = { display: "flex", flexDirection: "column", gap: 80, padding: 80, background: SC.cream, fontFamily: '"Space Grotesk", sans-serif' };
  const Caption = ({ n, t }) =>
  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      <span style={{ width: 26, height: 26, borderRadius: "50%", background: SC.purpleDeep, color: "#fff", fontSize: 12, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{n}</span>
      <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".22em", color: SC.purpleDeep, textTransform: "uppercase" }}>{t}</span>
    </div>;

  return (
    <div style={wrap}>
      {/* Variant 1 — Solid orange slab, two-line stacked, exclamation as own diamond */}
      <div>
        <Caption n="1" t="Solid slab — chunky stacked type" />
        <div style={{ background: SC.orange, color: "#fff", borderRadius: 32, padding: "56px 64px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
          <h3 style={{ margin: 0, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 96, lineHeight: .92, letterSpacing: "-0.04em", textTransform: "uppercase" }}>
            Organize<br />
            <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontWeight: 400, textTransform: "none", letterSpacing: "-0.01em" }}>networking</span> rounds
          </h3>
          <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
            <span style={{ position: "absolute", inset: 0, background: "#fff", transform: "rotate(45deg)", borderRadius: 8 }} />
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 80, color: SC.orange, lineHeight: 1 }}>!</span>
          </div>
        </div>
      </div>

      {/* Variant 2 — Two-line stacked, second line set on a tilted sticker */}
      <div>
        <Caption n="2" t="Sticker stack — tilted second line" />
        <div style={{ background: SC.orange, color: "#fff", borderRadius: 32, padding: "64px 64px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          {/* big faint diamond decoration */}
          <span aria-hidden style={{ position: "absolute", left: -60, top: -60, width: 200, height: 200, background: "rgba(255,255,255,.08)", transform: "rotate(45deg)" }} />
          <span aria-hidden style={{ position: "absolute", right: -40, bottom: -40, width: 140, height: 140, background: "rgba(255,255,255,.08)", transform: "rotate(45deg)" }} />
          <div style={{ fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 84, lineHeight: 1, letterSpacing: "-0.04em", textTransform: "uppercase" }}>
            Organize
          </div>
          <div style={{ display: "inline-block", marginTop: 18, padding: "12px 36px", background: "#fff", color: SC.orange, transform: "rotate(-2.5deg)", borderRadius: 18, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 84, lineHeight: 1, letterSpacing: "-0.04em", textTransform: "uppercase", boxShadow: "0 8px 0 0 rgba(76,25,77,.3)" }}>
            networking rounds<span style={{ color: SC.orange }}>!</span>
          </div>
        </div>
      </div>

      {/* Variant 3 — Two-line, framed by diamond rule lines + arrow */}
      <div>
        <Caption n="3" t="Framed banner — rule lines + arrow" />
        <div style={{ background: SC.orange, color: "#fff", borderRadius: 32, padding: "64px 80px", display: "flex", flexDirection: "column", gap: 14, position: "relative" }}>
          {/* top rule */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 14, height: 14, background: "#fff", transform: "rotate(45deg)", flexShrink: 0 }} />
            <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,.6)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".26em", textTransform: "uppercase", opacity: .85 }}>Take action</span>
            <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,.6)" }} />
            <span style={{ width: 14, height: 14, background: "#fff", transform: "rotate(45deg)", flexShrink: 0 }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
            <h3 style={{ margin: 0, fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 800, fontSize: 100, lineHeight: .92, letterSpacing: "-0.045em" }}>
              Organize<br />
              networking rounds<span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontWeight: 400, paddingLeft: 6 }}>!</span>
            </h3>
            <button style={{ background: "#fff", color: SC.orange, border: "none", borderRadius: 999, padding: "20px 36px", fontFamily: '"Bricolage Grotesque", sans-serif', fontWeight: 700, fontSize: 18, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 12, flexShrink: 0, whiteSpace: "nowrap" }}>
              Start for free
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>);

}