// Wonderelo — Phase 04 · Event Promo Page (1920×1080 stage slide)
// Maps to: src/components/EventPromoPage.tsx
// Shown projected at the venue. Cycles through 3 steps every 5s in production;
// this mock captures one frame ("step 02 — find your meeting match").

function EventPromoScreen() {
  const { WC: C, Italic, Diamond, Logo } = window;

  const STAGE_W = 1920;
  const STAGE_H = 1080;

  return (
    <div style={{
      width: STAGE_W, height: STAGE_H,
      background: C.purpleDeep, color: '#fff',
      fontFamily: C.fontBody,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative diamonds */}
      <Diamond size={28} color={C.orange} style={{ position: 'absolute', left: '8%', top: '12%' }} />
      <Diamond size={18} color="rgba(255,255,255,.35)" style={{ position: 'absolute', right: '24%', top: '8%' }} />
      <Diamond size={36} color="rgba(255,255,255,.08)" style={{ position: 'absolute', left: '20%', bottom: '14%' }} />
      <Diamond size={22} color={C.orangeBright} style={{ position: 'absolute', right: '8%', bottom: '20%' }} />

      {/* Big italic backdrop word */}
      <span style={{
        position: 'absolute', left: -80, bottom: -260,
        fontFamily: C.fontSerif, fontStyle: 'italic',
        fontSize: 880, color: 'rgba(255,255,255,.04)',
        lineHeight: 1, pointerEvents: 'none', letterSpacing: '-0.04em',
      }}>meet</span>

      {/* Top bar */}
      <div style={{
        padding: '40px 64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Logo size={42} dark />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 14,
          padding: '14px 22px', borderRadius: 999,
          background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.18)',
          fontFamily: C.fontMono, fontSize: 18, fontWeight: 600,
        }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 0 4px rgba(74,222,128,.18)' }} />
          Round 02 starts in <strong style={{ color: C.orangeBright, fontWeight: 700 }}>14:38</strong>
        </div>
      </div>

      {/* Big body — split layout */}
      <div style={{
        padding: '40px 80px 0',
        display: 'grid', gridTemplateColumns: '1.1fr 1fr',
        gap: 96, alignItems: 'start',
      }}>

        {/* Left — copy + steps */}
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 14,
            padding: '10px 18px', borderRadius: 999,
            background: 'rgba(221,83,28,.18)', color: C.orangeBright,
            fontSize: 16, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase',
          }}>
            <Diamond size={9} color={C.orangeBright} /> Step 02 · find your match
          </div>

          <h1 style={{
            margin: '34px 0 0', fontFamily: C.fontDisplay, fontWeight: 800,
            fontSize: 160, lineHeight: 0.92, letterSpacing: '-0.04em',
            color: '#fff', textWrap: 'balance',
          }}>
            Spot your<br /><Italic color={C.orangeBright}>match</Italic> in the<br />crowd.
          </h1>

          <p style={{
            margin: '40px 0 0', maxWidth: 720,
            fontSize: 30, lineHeight: 1.4, color: 'rgba(255,255,255,.78)',
          }}>
            A unique <strong style={{ color: '#fff', fontWeight: 600 }}>Wonderimage™</strong> on your phone helps you find each other — no awkward "are you Anna?"
          </p>

          {/* Step pager */}
          <div style={{ marginTop: 64, display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ fontFamily: C.fontMono, fontSize: 18, color: 'rgba(255,255,255,.55)', letterSpacing: '.04em', minWidth: 70 }}>02 / 03</span>
            <div style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 360 }}>
              <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,.20)', borderRadius: 3 }} />
              <div style={{ flex: 1, height: 5, background: C.orangeBright, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: '#fff', width: '64%' }} />
              </div>
              <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,.20)', borderRadius: 3 }} />
            </div>
          </div>

          {/* Steps mini-list */}
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 660 }}>
            {[
              ['01', 'Pick a time to meet', 'SMS reminds you 5 min before start.', false],
              ['02', 'Find your meeting match', 'Look for the Wonderimage on your screen.', true],
              ['03', 'Talk & exchange contacts', 'Only if both of you agree.', false],
            ].map(([n, t, d, on]) => (
              <div key={n} style={{
                display: 'flex', alignItems: 'center', gap: 22,
                padding: '14px 18px', borderRadius: 16,
                background: on ? 'rgba(255,255,255,.10)' : 'transparent',
                border: on ? '1px solid rgba(255,255,255,.20)' : '1px solid transparent',
              }}>
                <span style={{
                  fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 28,
                  color: on ? C.orangeBright : 'rgba(255,255,255,.35)',
                  letterSpacing: '-0.025em', minWidth: 48,
                }}>{n}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 22, color: on ? '#fff' : 'rgba(255,255,255,.5)', letterSpacing: '-0.015em' }}>{t}</div>
                  <div style={{ marginTop: 4, fontSize: 16, color: on ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.35)' }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — phone with the Wonderimage example */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          {/* "Wonderimage" sample — a big colorful tile */}
          <div style={{
            width: 460, aspectRatio: '3/4', borderRadius: 36,
            background: `linear-gradient(140deg, ${C.orange} 0%, ${C.orangeBright} 100%)`,
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(0,0,0,.40)',
            border: '3px solid rgba(255,255,255,.20)',
          }}>
            <svg width="100%" height="100%" viewBox="0 0 100 130" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
              <polygon points="0,0 40,0 0,40" fill="rgba(255,255,255,.20)" />
              <polygon points="100,130 60,130 100,90" fill="rgba(0,0,0,.18)" />
              <circle cx="80" cy="28" r="14" fill="rgba(255,255,255,.22)" />
              <polygon points="50,60 75,100 25,100" fill="rgba(255,255,255,.16)" />
              <rect x="10" y="92" width="38" height="8" rx="4" fill="rgba(0,0,0,.20)" />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 280,
              color: '#fff', letterSpacing: '-0.04em',
              textShadow: '0 8px 24px rgba(0,0,0,.25)',
            }}>07</div>

            {/* Caption strip */}
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0,
              padding: '16px 24px',
              background: 'rgba(0,0,0,.30)', backdropFilter: 'blur(6px)',
              borderTop: '1px solid rgba(255,255,255,.18)',
              fontFamily: C.fontDisplay, fontWeight: 700, color: '#fff', fontSize: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              letterSpacing: '-0.02em',
            }}>
              <span>Anna</span>
              <span style={{ fontFamily: C.fontSerif, fontStyle: 'italic', color: C.cream, fontWeight: 400, fontSize: 24 }}>Coffee bar · A</span>
            </div>
          </div>

          {/* Mini partner card floating beside */}
          <div style={{
            position: 'absolute', right: -8, bottom: 60, width: 240,
            padding: '16px 18px', borderRadius: 20,
            background: '#fff', color: C.purpleDeep,
            boxShadow: '0 20px 50px rgba(0,0,0,.35)',
            border: `2px solid ${C.orangeBright}`,
            transform: 'rotate(3deg)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `linear-gradient(140deg, ${C.purpleDeep}, ${C.purple})`, color: '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 22,
              }}>38</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.18em', color: C.purple, opacity: .7, textTransform: 'uppercase' }}>Your match</div>
                <div style={{ marginTop: 2, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 24, letterSpacing: '-0.02em' }}>Marek</div>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '6px 10px', borderRadius: 7, background: 'rgba(34,197,94,.12)', color: '#1f7a40', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} /> Already at the spot
            </div>
          </div>
        </div>
      </div>

      {/* Bottom-right · QR + URL */}
      <div style={{
        position: 'absolute', bottom: 48, right: 64,
        display: 'flex', alignItems: 'center', gap: 24,
        padding: '20px 24px',
        background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.18)',
        borderRadius: 22,
      }}>
        <div style={{
          width: 140, height: 140, borderRadius: 12, background: '#fff',
          backgroundImage: `linear-gradient(45deg, ${C.purpleInk} 25%, transparent 25%, transparent 75%, ${C.purpleInk} 75%), linear-gradient(45deg, ${C.purpleInk} 25%, transparent 25%, transparent 75%, ${C.purpleInk} 75%)`,
          backgroundSize: '14px 14px',
          backgroundPosition: '0 0, 7px 7px',
          padding: 14, position: 'relative', flexShrink: 0,
        }}>
          {/* Center logo cutout */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 56, height: 56, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: '4px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,.05)' }}>
              <img src="assets/Wonderelo-logo-symbol.png" alt="" style={{ width: 44, height: 44, objectFit: 'contain' }} />
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.22em', textTransform: 'uppercase', color: C.orangeBright }}>Scan to join</div>
          <div style={{ marginTop: 10, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 38, lineHeight: 1, letterSpacing: '-0.03em', color: '#fff' }}>
            wonderelo.com<br /><span style={{ color: 'rgba(255,255,255,.5)', fontFamily: C.fontMono, fontWeight: 400, fontSize: 30 }}>/</span><span style={{ fontFamily: C.fontSerif, fontStyle: 'italic', color: C.orangeBright, fontWeight: 400 }}>founder-summit-26</span>
          </div>
        </div>
      </div>
    </div>
  );
}

window.EventPromoScreen = EventPromoScreen;
