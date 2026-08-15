// Wonderelo — Phase 03 · Event Page Settings
// Maps to: src/components/EventPageSettings.tsx (EventPageSettingsView)
// Fields match the codebase EXACTLY: Event organizer name · Event page URL · Profile image.
function EventSettingsScreen() {
  const { WC: C, Italic, Btn, FormField, PageShell, PageHead } = window;

  return (
    <PageShell navActive="Event page">
      <PageHead
        eyebrow="Event page"
        title={<>Event page <Italic>settings</Italic></>}
        lede="This information is visible on your event page."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 440px', gap: 28, alignItems: 'start' }}>
        <div style={{ maxWidth: 720 }}>
        <section style={{ background: '#fff', border: `1px solid ${C.hair}`, borderRadius: 18, padding: 28 }}>
          <h3 style={{ margin: '0 0 6px', fontFamily: C.fontDisplay, fontWeight: 700, fontSize: 19, color: C.purpleDeep, letterSpacing: '-0.015em' }}>Event page</h3>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: C.ink, opacity: .68 }}>This information is visible on your event page</p>

          {/* Event organizer name */}
          <FormField label="Event organizer name" value="Founder Summit 2026" />

          <div style={{ height: 22 }} />

          {/* Event page URL */}
          <FormField label="Event page URL" prefix="wonderelo.com /" value="founder-summit" suffix="✓ available" focused />

          <div style={{ height: 24 }} />

          {/* Profile image */}
          <div>
            <span style={{ fontFamily: C.fontBody, fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', color: C.purpleDeep, textTransform: 'uppercase' }}>Profile image</span>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginTop: 12 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', position: 'relative',
                background: `linear-gradient(135deg, ${C.purpleDeep} 0%, ${C.purple} 60%, ${C.orange} 130%)`,
                border: `2px solid ${C.hair}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: C.fontDisplay, fontWeight: 800, fontSize: 28, color: '#fff', letterSpacing: '-.02em' }}>FS</span>
              </div>
              <div style={{ flex: 1, maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 9 }}>
                <button style={{
                  width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                  padding: '11px 16px', borderRadius: 11, background: '#fff', border: `1.5px solid ${C.hairStrong}`,
                  color: C.purpleDeep, fontFamily: C.fontBody, fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  Upload image
                </button>
                <p style={{ margin: 0, fontSize: 12, color: C.ink, opacity: .6, lineHeight: 1.5 }}>JPG, PNG, WEBP, GIF, HEIC · Up to 5MB · 200×200px or larger</p>
              </div>
            </div>
          </div>
        </section>

        {/* Save changes */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <Btn variant="primary" leadingIcon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>}>Save changes</Btn>
        </div>
        </div>

        {/* Event page preview — live, identical to the Round form */}
        <div style={{ position: 'sticky', top: 96 }}>
          <style>{`
            .rf-preview-scroll { overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; scrollbar-color: rgba(76,25,77,.28) transparent; -webkit-overflow-scrolling: touch; }
            .rf-preview-scroll::-webkit-scrollbar { width: 6px; }
            .rf-preview-scroll::-webkit-scrollbar-track { background: transparent; }
            .rf-preview-scroll::-webkit-scrollbar-thumb { background: rgba(76,25,77,.22); border-radius: 999px; border: 2px solid transparent; background-clip: padding-box; }
            .rf-preview-scroll:hover::-webkit-scrollbar-thumb { background: rgba(76,25,77,.42); background-clip: padding-box; }
          `}</style>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, background: C.orange, transform: 'rotate(45deg)', display: 'inline-block' }} />
            <span style={{ fontFamily: C.fontBody, fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.purpleDeep }}>Event page preview</span>
          </div>
          <div style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${C.hairStrong}`, background: '#fff', boxShadow: '0 22px 48px rgba(75,29,81,.16)' }}>
            <div style={{ padding: '11px 16px', background: C.purpleDeep, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'inline-flex', gap: 5 }}>{['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}</span>
              <span style={{ fontFamily: C.fontMono, fontSize: 10.5, opacity: .8 }}>wonderelo.com/founder-summit</span>
            </div>
            <div className="rf-preview-scroll" style={{ height: 760, background: C.cream }}>
              <iframe src="Event Page.html" scrolling="no" title="Event page preview" style={{ width: 438, height: 2000, border: 0, display: 'block' }} />
            </div>
          </div>
          <p style={{ margin: '12px 2px 0', fontSize: 12, color: C.ink, opacity: .6, lineHeight: 1.5, whiteSpace: 'nowrap' }}>Changes here update your public event page.</p>
        </div>
      </div>
    </PageShell>
  );
}

window.EventSettingsScreen = EventSettingsScreen;
