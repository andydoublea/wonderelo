// Mount the design canvas with the final hero variant + full homepage redesign

function FullHomepage() {
  return (
    <div style={{ width: "100%", background: "#f7f1e6" }}>
      {/* Sticky top nav — sits above the hero and stays pinned while scrolling */}
      <Nav variant="light" logoSize={120} mode="sticky" />
      {/* Hero — responsive, manages its own height (no nav; rendered above as sticky) */}
      <HeroConfettiV2 noNav />
      {/* Everything below hero */}
      <HomepageBelowHero />
    </div>
  );
}

function App() {
  return (
    <DesignCanvas>
      <DCSection id="full-homepage" title="Wonderelo · Full homepage redesign" subtitle="Above-the-fold hero + every section below it · 1440 wide">
        <DCArtboard id="full-home" label="Full homepage — hero + sections" width={1440} height={13800}>
          <FullHomepage/>
        </DCArtboard>
      </DCSection>
      <DCSection id="heroes" title="Hero only" subtitle="Above-the-fold redesign · 1440×900 desktop">
        <DCArtboard id="confetti-v2" label="Confetti Burst v2 — text left, image right" width={1440} height={900}>
          <HeroConfettiV2/>
        </DCArtboard>
      </DCSection>
      <DCSection id="problem-section" title="Section · 9 out of 10" subtitle="The reality — networking pain points · 1440 wide">
        <DCArtboard id="problem-9-out-of-10" label="9 out of 10 — three experience cards" width={1440} height={1000}>
          <div style={{ width: "100%", fontFamily: '"Space Grotesk", sans-serif' }}>
            <ProblemSectionFocused/>
          </div>
        </DCArtboard>
      </DCSection>
      <DCSection id="organize-banner" title="CTA banner · Organize networking rounds!" subtitle="3 variants, two-line orange block · 1240 wide">
        <DCArtboard id="organize-banner-variants" label="Organize networking rounds — 3 variants" width={1240} height={1700}>
          <OrganizeBannerVariants/>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
