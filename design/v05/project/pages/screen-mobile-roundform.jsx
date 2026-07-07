// Wonderelo — Round form MOBILE (full parity with the desktop RoundFormScreen).
// Every desktop card/field is present: Event capacity · Basic information ·
// Rounds (date+time pickers, counts, gap, custom-times) · Meeting points ·
// Ice breakers · Advanced (limit groups · teams + matching illustration ·
// topics + multi-select) · actions. Single-column, sticky publish bar.
(function () {
  const C = window.WC;
  const R = React;
  const MShell = window.MStudioShell;
  const { Italic, Eyebrow } = window.MStudioAtoms;
  const Btn = window.Btn;

  const Icon = ({ d, size = 18, sw = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
  );
  const IC = {
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    up: '<polyline points="18 15 12 9 6 15"/>',
    down: '<polyline points="6 9 12 15 18 9"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    spark: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    chevL: '<polyline points="15 18 9 12 15 6"/>',
    chevR: '<polyline points="9 18 15 12 9 6"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
  };

  function RoundFormMobileScreen() {
    const [mp, setMp] = R.useState(['Main entrance — far left of the lobby', 'Coffee bar — under the skylight', 'Rooftop terrace — by the bar']);
    const [schedMenu, setSchedMenu] = R.useState(false);
    const [schedOpen, setSchedOpen] = R.useState(false);
    const [publishOpen, setPublishOpen] = R.useState(false);
    const [pubHover, setPubHover] = R.useState(false);
    const [billing, setBilling] = R.useState((typeof window !== 'undefined' && window.__wBilling) || 'subscription');
    R.useEffect(() => {
      const h = () => setBilling(window.__wBilling || 'subscription');
      window.addEventListener('w-billing', h);
      return () => window.removeEventListener('w-billing', h);
    }, []);
    const [teams, setTeams] = R.useState(['Team Bride', 'Team Groom']);
    const [topics, setTopics] = R.useState(['Fundraising', 'Hiring & team', 'Product & growth']);
    const [date, setDate] = R.useState('14-06-2026');
    const [time, setTime] = R.useState('14:00');
    const [matching, setMatching] = R.useState('across');
    const [picker, setPicker] = R.useState(null);
    const IB_POOL = [
      'What brought you to this event?', "What's a problem you wish someone would solve?",
      'What are you working on right now?', "What's the best thing that happened to you this week?",
      'If you could instantly master one skill, what would it be?', "What's a hill you'll happily die on?",
      'Who would you love to be introduced to today?', "What's the last thing that genuinely surprised you?",
    ];
    const [ib, setIb] = R.useState(IB_POOL.slice(0, 3));
    const regen = () => setIb([...IB_POOL].sort(() => Math.random() - 0.5).slice(0, 3));

    // ── atoms ──
    const Card = ({ icon, title, children, hint, hintList }) => (
      <section style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 16, padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: (hint || hintList) ? 8 : 16 }}>
          <span style={{ color: C.orange, display: 'inline-flex' }}><Icon d={icon} size={18} /></span>
          <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 17, letterSpacing: '-.02em', color: C.purpleDeep }}>{title}</h3>
        </div>
        {hint && <p style={{ margin: '0 0 16px', fontSize: 12.5, color: C.ink, opacity: .65 }}>{hint}</p>}
        {hintList && <ul style={{ margin: '0 0 16px', padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: C.ink, opacity: .65 }}>{hintList.map((h, i) => <li key={i}>{h}</li>)}</ul>}
        {children}
      </section>
    );
    const Lbl = ({ children, help }) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: C.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', color: C.purpleDeep, textTransform: 'uppercase' }}>
        {children}{help && <span style={{ color: 'rgba(75,29,81,.4)', display: 'inline-flex' }}><Icon d={IC.help} size={13} /></span>}
      </span>
    );
    const TextField = ({ value, focused }) => (
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderRadius: 11, background: '#fff', border: `1.5px solid ${focused ? C.orange : C.hairStrong}`, boxShadow: focused ? '0 0 0 3px rgba(221,83,28,.10)' : 'none' }}>
        <input defaultValue={value} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: C.fontBody, fontSize: 14.5, color: C.ink, minWidth: 0 }} />
      </div>
    );
    const NumField = ({ label, value, suffix, help, w }) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: w }}>
        <Lbl help={help}>{label}</Lbl>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 11, background: '#fff', border: `1.5px solid ${C.hairStrong}` }}>
          <input defaultValue={value} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: C.fontBody, fontSize: 14.5, color: C.ink, minWidth: 0 }} />
          {suffix && <span style={{ fontSize: 13, color: C.ink, opacity: .55, whiteSpace: 'nowrap' }}>{suffix}</span>}
        </div>
      </div>
    );
    const Toggle = ({ on, onClick }) => (
      <span onClick={onClick} style={{ width: 42, height: 24, borderRadius: 999, background: on ? C.orange : 'rgba(76,25,77,.18)', position: 'relative', flexShrink: 0, cursor: 'pointer' }}>
        <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .15s' }} />
      </span>
    );
    const ToggleRow = ({ label, help, on, setOn, note }) => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <div><Lbl help={help}>{label}</Lbl>{note && <p style={{ margin: '5px 0 0', fontSize: 12, color: C.ink, opacity: .6 }}>{note}</p>}</div>
        <Toggle on={on} onClick={() => setOn && setOn(!on)} />
      </div>
    );
    const Separator = () => <div style={{ height: 1, background: C.hair, margin: '20px 0' }} />;

    function EditableList({ rows, setRows, placeholder, addLabel, onRegen }) {
      const move = (i, dir) => { const j = i + dir; if (j < 0 || j >= rows.length) return; const n = [...rows]; const t = n[i]; n[i] = n[j]; n[j] = t; setRows(n); };
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((val, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 11, border: `1px solid ${C.hair}`, borderRadius: 11, background: C.cream }}>
              <input value={val} placeholder={placeholder} onChange={(e) => setRows(rows.map((r, j) => j === i ? e.target.value : r))} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: C.fontBody, fontSize: 13.5, color: C.ink, minWidth: 0 }} />
              <span style={{ display: 'inline-flex', gap: 2 }}>
                <span onClick={() => move(i, -1)} style={{ color: i === 0 ? 'rgba(75,29,81,.2)' : 'rgba(75,29,81,.5)', cursor: i === 0 ? 'default' : 'pointer', display: 'inline-flex' }}><Icon d={IC.up} size={15} /></span>
                <span onClick={() => move(i, 1)} style={{ color: i === rows.length - 1 ? 'rgba(75,29,81,.2)' : 'rgba(75,29,81,.5)', cursor: i === rows.length - 1 ? 'default' : 'pointer', display: 'inline-flex' }}><Icon d={IC.down} size={15} /></span>
                <span onClick={() => setRows(rows.filter((_, j) => j !== i))} style={{ color: '#c0392b', cursor: 'pointer', display: 'inline-flex' }}><Icon d={IC.x} size={15} /></span>
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setRows([...rows, ''])} style={{ flex: 1, padding: '11px 14px', background: 'transparent', borderRadius: 11, border: `1.5px solid ${C.hairStrong}`, color: C.purpleDeep, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontFamily: C.fontBody }}>
              <Icon d={IC.plus} size={15} /> {addLabel}
            </button>
            {onRegen && (
              <button onClick={onRegen} style={{ padding: '11px 14px', background: 'rgba(221,83,28,.08)', borderRadius: 11, border: `1.5px solid rgba(221,83,28,.3)`, color: C.orange, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: C.fontBody, whiteSpace: 'nowrap' }}>
                <Icon d={IC.refresh} size={15} /> Regenerate
              </button>
            )}
          </div>
        </div>
      );
    }

    function DateField() {
      const days = Array.from({ length: 30 }, (_, i) => i + 1);
      const sel = parseInt((date || '').split('-')[0], 10);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
          <Lbl>Date of first round</Lbl>
          <div onClick={() => setPicker(picker === 'date' ? null : 'date')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 11, background: '#fff', border: `1.5px solid ${picker === 'date' ? C.orange : C.hairStrong}`, cursor: 'pointer' }}>
            <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><Icon d={IC.cal} size={16} /></span>
            <span style={{ flex: 1, fontSize: 14, color: C.ink }}>{date}</span>
          </div>
          {picker === 'date' && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 30, width: 280, background: '#fff', borderRadius: 14, border: `1px solid ${C.hairStrong}`, boxShadow: '0 18px 40px rgba(75,29,81,.18)', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: 'rgba(75,29,81,.4)', display: 'inline-flex' }}><Icon d={IC.chevL} size={16} /></span>
                <span style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 15, color: C.purpleDeep }}>June 2026</span>
                <span style={{ color: 'rgba(75,29,81,.4)', display: 'inline-flex' }}><Icon d={IC.chevR} size={16} /></span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: 'rgba(75,29,81,.45)', padding: '4px 0' }}>{d}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                {days.map((d) => {
                  const on = d === sel;
                  return <div key={d} onClick={() => { setDate(`${String(d).padStart(2, '0')}-06-2026`); setPicker(null); }} style={{ textAlign: 'center', padding: '7px 0', borderRadius: 8, fontSize: 13, fontWeight: on ? 700 : 500, cursor: 'pointer', background: on ? C.orange : 'transparent', color: on ? '#fff' : C.ink }}>{d}</div>;
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    function TimeField() {
      const [h, m] = (time || '14:00').split(':');
      const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
      const mins = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
          <Lbl>Time of first round</Lbl>
          <div onClick={() => setPicker(picker === 'time' ? null : 'time')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 11, background: '#fff', border: `1.5px solid ${picker === 'time' ? C.orange : C.hairStrong}`, cursor: 'pointer' }}>
            <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><Icon d={IC.clock} size={16} /></span>
            <span style={{ flex: 1, fontSize: 14, color: C.ink }}>{time}</span>
          </div>
          {picker === 'time' && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 30, width: 300, background: '#fff', borderRadius: 14, border: `1px solid ${C.hairStrong}`, boxShadow: '0 18px 40px rgba(75,29,81,.18)', padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', color: 'rgba(75,29,81,.5)', textTransform: 'uppercase', marginBottom: 8 }}>Hour</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
                    {hours.map((hh) => { const on = hh === h; return <div key={hh} onClick={() => setTime(`${hh}:${m}`)} style={{ textAlign: 'center', padding: '6px 0', borderRadius: 7, fontSize: 12, fontWeight: on ? 700 : 500, cursor: 'pointer', background: on ? C.purpleDeep : C.cream, color: on ? '#fff' : C.ink }}>{hh}</div>; })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', color: 'rgba(75,29,81,.5)', textTransform: 'uppercase', marginBottom: 8 }}>Minute</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                    {mins.map((mm) => { const on = mm === m; return <div key={mm} onClick={() => setTime(`${h}:${mm}`)} style={{ textAlign: 'center', padding: '6px 0', borderRadius: 7, fontSize: 12, fontWeight: on ? 700 : 500, cursor: 'pointer', background: on ? C.orange : C.cream, color: on ? '#fff' : C.ink }}>{mm}</div>; })}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button onClick={() => setPicker(null)} style={{ padding: '7px 16px', borderRadius: 9, border: 'none', background: C.purpleDeep, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: C.fontBody }}>Done</button>
              </div>
            </div>
          )}
        </div>
      );
    }

    function MatchingCard({ mode, label, desc }) {
      const on = matching === mode;
      const cream = C.cream, O = C.orange, P = C.purpleDeep;
      const A = [{ x: 60, y: 40 }, { x: 36, y: 70 }, { x: 84, y: 70 }, { x: 60, y: 100 }];
      const B = [{ x: 160, y: 40 }, { x: 136, y: 70 }, { x: 184, y: 70 }, { x: 160, y: 100 }];
      const withinPairs = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
      const Dot = ({ p, c }) => <circle cx={p.x} cy={p.y} r="6" fill={c} stroke={cream} strokeWidth="2" />;
      return (
        <div onClick={() => setMatching(mode)} style={{ cursor: 'pointer', borderRadius: 14, padding: 12, background: on ? 'rgba(221,83,28,.05)' : '#fff', border: `2px solid ${on ? C.orange : C.hairStrong}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ position: 'relative', width: '100%', height: 110, background: cream, borderRadius: 11, border: `1px solid rgba(76,25,77,.12)`, overflow: 'hidden' }}>
            <svg viewBox="0 0 220 140" preserveAspectRatio="xMidYMid meet" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
              <circle cx="60" cy="70" r="38" fill="none" stroke={O} strokeOpacity=".4" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="160" cy="70" r="38" fill="none" stroke={P} strokeOpacity=".4" strokeWidth="1.5" strokeDasharray="3 3" />
              {mode === 'across' ? (
                <g>
                  {A.map((a, i) => <line key={i} x1={a.x} y1={a.y} x2={B[i].x} y2={B[i].y} stroke={P} strokeOpacity=".5" strokeWidth="1.4" />)}
                  <line x1={A[0].x} y1={A[0].y} x2={B[3].x} y2={B[3].y} stroke={O} strokeOpacity=".5" strokeWidth="1.4" />
                  <line x1={A[3].x} y1={A[3].y} x2={B[0].x} y2={B[0].y} stroke={O} strokeOpacity=".5" strokeWidth="1.4" />
                </g>
              ) : (
                <g>
                  {withinPairs.map(([i, j], k) => <line key={'a' + k} x1={A[i].x} y1={A[i].y} x2={A[j].x} y2={A[j].y} stroke={O} strokeOpacity=".55" strokeWidth="1.4" />)}
                  {withinPairs.map(([i, j], k) => <line key={'b' + k} x1={B[i].x} y1={B[i].y} x2={B[j].x} y2={B[j].y} stroke={P} strokeOpacity=".55" strokeWidth="1.4" />)}
                </g>
              )}
              {A.map((p, i) => <Dot key={'a' + i} p={p} c={O} />)}
              {B.map((p, i) => <Dot key={'b' + i} p={p} c={P} />)}
            </svg>
            {on && <span style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: C.orange, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon d={IC.check} size={11} sw={3.4} /></span>}
          </div>
          <div>
            <div style={{ fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 14, color: on ? C.purpleDeep : C.ink }}>{label}</div>
            <div style={{ marginTop: 3, fontSize: 11.5, color: C.ink, opacity: .6, lineHeight: 1.4 }}>{desc}</div>
          </div>
        </div>
      );
    }

    function AdvancedToggle({ label, children, def = true }) {
      const [on, setOn] = R.useState(def);
      return (
        <div>
          <ToggleRow label={label} help on={on} setOn={setOn} />
          {on && <div style={{ marginTop: 16 }}>{children}</div>}
        </div>
      );
    }

    return (
      <MShell active="Rounds" fab={
        <div style={{ position: 'sticky', bottom: 0, marginTop: 8, padding: '14px 18px calc(14px + env(safe-area-inset-bottom))', background: 'rgba(251,246,236,.95)', backdropFilter: 'blur(10px)', borderTop: `1px solid ${C.hair}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Split publish button — Publish to event page + Schedule (mirrors SessionForm.tsx) */}
          <div onMouseEnter={() => setPubHover(true)} onMouseLeave={() => setPubHover(false)} style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
            <button type="button" className="wpub" onClick={() => setPublishOpen(true)} style={{ flex: 1, fontFamily: C.fontBody, fontWeight: 700, fontSize: 14.5, border: 'none', cursor: 'pointer', background: pubHover ? '#c14617' : C.orange, color: '#fff', padding: '13px 16px', borderRadius: '12px 0 0 12px', boxShadow: '0 8px 18px rgba(221,83,28,.3)', transition: 'background .15s' }}>Publish to event page</button>
            <button type="button" className="wpub" onClick={() => setSchedMenu(o => !o)} aria-label="More publish options" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', background: pubHover ? '#c14617' : C.orange, color: '#fff', padding: '0 13px', borderRadius: '0 12px 12px 0', borderLeft: '1px solid rgba(255,255,255,.32)', boxShadow: '0 8px 18px rgba(221,83,28,.3)', transition: 'background .15s' }}>
              <Icon d={IC.down} size={17} />
            </button>
            {schedMenu && (
              <React.Fragment>
                <div onClick={() => setSchedMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', right: 0, zIndex: 41, minWidth: 180, padding: 6, background: '#fff', borderRadius: 12, border: `1px solid ${C.hairStrong}`, boxShadow: '0 -10px 40px rgba(75,29,81,.18)' }}>
                  <div onClick={() => { setSchedMenu(false); setSchedOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: C.fontBody, fontSize: 14, fontWeight: 600, color: C.purpleDeep }}>
                    <Icon d={IC.cal} size={16} /> Schedule
                  </div>
                </div>
              </React.Fragment>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}><Btn variant="ghost" full>Save draft</Btn></div>
            <div style={{ flex: 1 }}><Btn variant="ghost" full>Cancel</Btn></div>
          </div>
        </div>
      }>
        <div style={{ marginBottom: 20 }}>
          <Eyebrow>New round</Eyebrow>
          <h1 style={{ margin: '10px 0 0', fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 32, lineHeight: 1.02, letterSpacing: '-0.035em', color: C.purpleDeep }}>Create a <Italic>round</Italic></h1>
        </div>

        {/* Event capacity */}
        <Card icon={IC.users} title="Event capacity">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 10, marginBottom: 16, background: 'rgba(31,138,77,.08)', border: '1px solid rgba(31,138,77,.25)' }}>
            <span style={{ color: '#1f8a4d', display: 'inline-flex', flexShrink: 0 }}><Icon d={IC.spark} size={16} /></span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#176b3c' }}>Events up to 5 participants free for testing purposes</span>
          </div>
          <NumField label="Expected number of participants" value="80" suffix="participants" />
          <p style={{ margin: '8px 0 0', fontSize: 11.5, color: C.ink, opacity: .55 }}>This determines the pricing tier for your event</p>
        </Card>

        {/* Basic information */}
        <Card icon={IC.cal} title="Basic information">
          <div style={{ marginBottom: 16 }}>
            <Lbl>Round name</Lbl>
            <div style={{ height: 8 }} />
            <TextField value="Morning Networking for IT Professionals" focused />
          </div>
          <NumField label="Group size" help w={160} value="2" />
        </Card>

        {/* Rounds */}
        <Card icon={IC.clock} title="Rounds" hintList={[
          'First round must be at least 10 minutes in the future',
          'Participants receive SMS notification 5 minutes before the round to confirm attendance',
          'Time must be rounded to 5 minutes',
        ]}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 14 }}>
            <DateField />
            <TimeField />
          </div>
          <div style={{ height: 16 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 14 }}>
            <NumField label="Number of rounds" value="3" />
            <NumField label="Round duration" value="5" suffix="min" />
          </div>
          <div style={{ height: 16 }} />
          <NumField label="Gap between rounds" value="10" suffix="min" w={'50%'} />
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.hair}` }}>
            <ToggleRow label="Custom round times" on={false} note="Set individual start times for each round" />
          </div>
        </Card>

        {/* Meeting points */}
        <Card icon={IC.pin} title="Meeting points" hint="Enter locations that are distinctive and easy to recognize">
          <EditableList rows={mp} setRows={setMp} placeholder="e.g. Main entrance" addLabel="Add meeting point" />
        </Card>

        {/* Ice breakers */}
        <Card icon={IC.msg} title="Ice breakers">
          <EditableList rows={ib} setRows={setIb} placeholder="Write a prompt…" addLabel="Add ice breaker" onRegen={regen} />
        </Card>

        {/* Advanced */}
        <Card icon={IC.settings} title="Advanced">
          <AdvancedToggle label="Limit number of groups">
            <NumField label="Maximum groups" value="12" w={160} />
          </AdvancedToggle>
          <Separator />
          <AdvancedToggle label="Enable teams">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Lbl>Team names</Lbl>
              <EditableList rows={teams} setRows={setTeams} placeholder="e.g. Sales, Marketing, Team Bride, …" addLabel="Add team" />
              <div style={{ marginTop: 6 }}>
                <Lbl>Matching type</Lbl>
                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 10 }}>
                  <MatchingCard mode="within" label="Within the team" desc="Members meet others on their own team." />
                  <MatchingCard mode="across" label="Across teams" desc="Members meet people from other teams." />
                </div>
              </div>
            </div>
          </AdvancedToggle>
          <Separator />
          <AdvancedToggle label="Enable topics">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Lbl>Topic names</Lbl>
              <EditableList rows={topics} setRows={setTopics} placeholder="Topic name" addLabel="Add topic" />
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: 13.5, color: C.ink }}>
                <span style={{ width: 18, height: 18, borderRadius: 5, background: C.orange, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}><Icon d={IC.check} size={11} sw={3.4} /></span>
                Participant can select multiple topics
              </label>
            </div>
          </AdvancedToggle>
        </Card>

        {/* Schedule making live dialog */}
        {schedOpen && (
          <div onClick={() => setSchedOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(45,17,51,.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 18, border: `1px solid ${C.hairStrong}`, boxShadow: '0 30px 70px rgba(75,29,81,.30)', padding: 22 }}>
              <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 20, letterSpacing: '-.02em', color: C.purpleDeep }}>Schedule making live</h3>
              <p style={{ margin: '8px 0 18px', fontSize: 13, lineHeight: 1.5, color: C.ink, opacity: .72 }}>Choose when this round becomes visible on the event page. Time must be at least 10 minutes in the future.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Lbl>Date</Lbl>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', borderRadius: 11, background: '#fff', border: `1.5px solid ${C.hairStrong}` }}>
                    <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><Icon d={IC.cal} size={15} /></span>
                    <span style={{ flex: 1, fontSize: 13.5, color: C.ink, minWidth: 0 }}>13-06-2026</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Lbl>Time</Lbl>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', borderRadius: 11, background: '#fff', border: `1.5px solid ${C.hairStrong}` }}>
                    <span style={{ color: 'rgba(75,29,81,.5)', display: 'inline-flex' }}><Icon d={IC.clock} size={15} /></span>
                    <span style={{ flex: 1, fontSize: 13.5, color: C.ink, minWidth: 0 }}>09:00</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
                <button type="button" onClick={() => setSchedOpen(false)} style={{ fontFamily: C.fontBody, fontWeight: 600, fontSize: 14, padding: '11px 16px', borderRadius: 12, cursor: 'pointer', background: 'transparent', color: C.purpleDeep, border: `1px solid ${C.hairStrong}` }}>Cancel</button>
                <button type="button" onClick={() => setSchedOpen(false)} style={{ fontFamily: C.fontBody, fontWeight: 600, fontSize: 14, padding: '11px 18px', borderRadius: 12, cursor: 'pointer', background: C.purpleDeep, color: '#fff', border: 'none' }}>Confirm</button>
              </div>
            </div>
          </div>
        )}

        {/* Publish event dialog — credit-deduction confirmation */}
        {publishOpen && (
          <div onClick={() => setPublishOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(45,17,51,.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 18, border: `1px solid ${C.hairStrong}`, boxShadow: '0 30px 70px rgba(75,29,81,.30)', padding: 22 }}>
              <h3 style={{ margin: 0, fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 20, letterSpacing: '-.02em', color: C.purpleDeep }}>Publish event</h3>
              <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.5, color: C.ink, opacity: .72 }}>Your round will go live on your event page.</p>
              {billing === 'credits' && (
                <React.Fragment>
                  <div style={{ marginTop: 16, borderRadius: 12, border: `1px solid ${C.hair}`, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'rgba(31,138,77,.07)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.purpleDeep }}><span style={{ color: '#1f8a4d', display: 'inline-flex' }}><Icon d="<circle cx='12' cy='12' r='8'/><path d='M9.5 9.5h5M9.5 14.5h5'/>" size={15} /></span>Up to 200 participants</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1f7a40' }}>3 credits</span>
                    </div>
                  </div>
                  <p style={{ margin: '13px 0 0', fontSize: 13, lineHeight: 1.5, color: C.ink, opacity: .82 }}><strong style={{ color: C.purpleDeep }}>1 credit</strong> (up to 200 participants) will be used. You'll have <strong style={{ color: C.purpleDeep }}>2 credits</strong> left.</p>
                </React.Fragment>
              )}
              {billing === 'subscription' && (
                <div style={{ marginTop: 16, display: 'flex', gap: 10, padding: '13px 15px', borderRadius: 12, background: 'rgba(31,138,77,.08)', border: '1px solid rgba(31,138,77,.25)' }}>
                  <span style={{ color: '#1f8a4d', display: 'inline-flex', flexShrink: 0, marginTop: 1 }}><Icon d="<polyline points='20 6 9 17 4 12'/>" size={16} /></span>
                  <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.5 }}><strong style={{ color: C.purpleDeep }}>Unlimited events</strong> — your subscription covers this round. No credit needed.</div>
                </div>
              )}
              {billing === 'free' && (
                <div style={{ marginTop: 16, display: 'flex', gap: 10, padding: '13px 15px', borderRadius: 12, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.30)' }}>
                  <span style={{ color: '#d98a0b', display: 'inline-flex', flexShrink: 0, marginTop: 1 }}><Icon d="<path d='M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/>" size={17} /></span>
                  <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.5 }}>This round expects up to <strong style={{ color: C.purpleDeep }}>200 participants</strong>. The free plan covers events up to 5 — you'll need a single-event credit (€99) or a subscription.</div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                {billing === 'free' ? (
                  <button type="button" onClick={() => setPublishOpen(false)} style={{ width: '100%', fontFamily: C.fontBody, fontWeight: 700, fontSize: 14, padding: '12px 16px', borderRadius: 12, cursor: 'pointer', background: C.purpleDeep, color: '#fff', border: 'none' }}>Go to Billing</button>
                ) : (
                  <button type="button" onClick={() => setPublishOpen(false)} style={{ width: '100%', fontFamily: C.fontBody, fontWeight: 700, fontSize: 14, padding: '12px 16px', borderRadius: 12, cursor: 'pointer', background: C.orange, color: '#fff', border: 'none', boxShadow: '0 8px 18px rgba(221,83,28,.28)' }}>{billing === 'credits' ? 'Use 1 credit & publish' : 'Publish'}</button>
                )}
                <button type="button" onClick={() => setPublishOpen(false)} style={{ width: '100%', fontFamily: C.fontBody, fontWeight: 600, fontSize: 14, padding: '12px 16px', borderRadius: 12, cursor: 'pointer', background: 'transparent', color: C.purpleDeep, border: `1px solid ${C.hairStrong}` }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </MShell>
    );
  }

  window.RoundFormMobileScreen = RoundFormMobileScreen;
})();
