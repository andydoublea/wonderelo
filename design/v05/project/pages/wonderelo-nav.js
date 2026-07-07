/* ============================================================
   <wonderelo-nav> — shared marketing top nav (single source of truth)
   • Desktop (>980px): EXACTLY the homepage-desktop menu
       (logoSize 120 mascot + "wonderelo", links: Who is it for? / How it
        works / Pricing, Sign in + Start for free pill).
   • Mobile (≤980px): the Event-page-mobile logo lockup (symbol + typography)
       + a hamburger that drops down the same links.
   Usage:  <wonderelo-nav active="pricing"></wonderelo-nav>
           <script src="wonderelo-nav.js"></script>
   Attributes:
     active = who | how | pricing   (highlights the current link)
     logo   = path to symbol png (default assets/Wonderelo-logo-symbol.png)
   ============================================================ */
(function () {
  const LINKS = [
    { key: 'who',     label: 'Who is it for?', href: '#' },
    { key: 'how',     label: 'How it works',   href: '#' },
    { key: 'pricing', label: 'Pricing',        href: '#' },
  ];

  const css = `
    :host { display: block; position: sticky; top: 0; z-index: 50; font-family: "Space Grotesk", system-ui, sans-serif; }

    .bar {
      position: relative; box-sizing: border-box;
      border-bottom: 1px solid rgba(76,25,77,.10);
      background: rgba(247,241,230,.85);
      backdrop-filter: saturate(140%) blur(10px);
      -webkit-backdrop-filter: saturate(140%) blur(10px);
    }
    /* Bar background bleeds full-width; content caps at 1440px (site content standard). */
    .bar-inner {
      box-sizing: border-box;
      height: 80px; max-width: 1440px; margin: 0 auto; padding: 0 60px;
      display: flex; align-items: center; justify-content: space-between;
    }

    /* ── Logo lockup (desktop = homepage) ── */
    .lockup { position: relative; z-index: 70; display: flex; align-items: center; gap: 44px; cursor: pointer; text-decoration: none; transition: transform .3s cubic-bezier(.2,.7,.2,1); }
    .lockup:hover { transform: rotate(-1deg) scale(1.03); }
    .symbol { position: relative; width: 40px; height: 40px; flex-shrink: 0; }
    .symbol img {
      position: absolute; left: 50%; top: 50%;
      transform: translate(-50%, -50%) rotate(-6deg);
      width: 120px; height: 120px; object-fit: contain; pointer-events: none;
    }
    .word {
      font-family: "Bricolage Grotesque", system-ui, sans-serif;
      font-size: 32px; font-weight: 800; letter-spacing: -0.03em; line-height: 1;
      color: #4b1d51;
    }
    .word em { font: inherit; color: inherit; font-style: normal; }
    /* Wordmark has its own tilt on top of the lockup's — matches homepage */
    .word { transition: transform .3s cubic-bezier(.2,.7,.2,1); }
    .word:hover { transform: rotate(-1deg) scale(1.04); }

    /* ── Center links ── */
    .links { display: flex; align-items: center; gap: 32px; }
    .links a {
      font-size: 14px; font-weight: 500; color: rgba(76,25,77,.78);
      text-decoration: none; padding: 6px 0; transition: color .2s ease;
    }
    .links a:hover { color: #4b1d51; }
    .links a.is-active { color: #4b1d51; }

    /* ── Right actions ── */
    .actions { display: flex; align-items: center; gap: 12px; }
    .signin { font-size: 14px; font-weight: 500; color: #4b1d51; text-decoration: none; cursor: pointer; }
    .signin:hover { color: #dd531c; }
    .cta {
      background: #dd531c; color: #fff; border: none;
      padding: 10px 18px; border-radius: 999px;
      font-family: inherit; font-weight: 600; font-size: 14px; cursor: pointer; text-decoration: none;
      transition: background-color .2s ease, transform .2s ease, box-shadow .2s ease;
    }
    .cta:hover { background: #c14617; transform: translateY(-1px); box-shadow: 0 10px 24px rgba(221,83,28,.34); }

    /* ── Hamburger + mobile menu (hidden on desktop) ── */
    .burger { display: none; }
    .mobile { display: none; }

    @media (max-width: 980px) {
      .bar-inner { height: auto; padding: 12px 18px; }
      .links, .actions { display: none; }

      /* Logo lockup = Event-page-mobile spec exactly */
      .lockup { gap: 52px; }
      .symbol { width: 26px; height: 26px; }
      .symbol img {
        width: 92px; height: 92px;
        transform: translate(calc(-50% + 16px), -50%) rotate(-6deg);
      }
      .word { font-size: 17px; letter-spacing: -0.025em; }

      .burger {
        display: inline-flex; flex-direction: column; justify-content: center; align-items: center; gap: 5px;
        width: 42px; height: 42px; border-radius: 11px; cursor: pointer; padding: 0;
        border: 1px solid rgba(76,25,77,.18); background: rgba(255,255,255,.6);
      }
      .burger span { display: block; width: 18px; height: 2px; background: #4b1d51; border-radius: 2px; transition: transform .25s ease, opacity .2s ease; }
      :host([data-open]) .burger span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
      :host([data-open]) .burger span:nth-child(2) { opacity: 0; }
      :host([data-open]) .burger span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

      .mobile {
        display: flex; flex-direction: column;
        position: absolute; top: 100%; left: 0; right: 0;
        background: #fbf6ec; border-bottom: 1px solid rgba(76,25,77,.10);
        box-shadow: 0 20px 44px rgba(76,25,77,.16);
        padding: 8px 18px 18px;
        transform: translateY(-10px); opacity: 0; pointer-events: none;
        transition: opacity .22s ease, transform .22s ease; z-index: 60;
      }
      :host([data-open]) .mobile { opacity: 1; transform: none; pointer-events: auto; }
      .mobile a.m-link {
        padding: 14px 4px; font-family: "Bricolage Grotesque", system-ui, sans-serif;
        font-weight: 600; font-size: 17px; color: #4b1d51; text-decoration: none;
        border-bottom: 1px solid rgba(76,25,77,.08);
      }
      .mobile a.m-link.is-active { color: #dd531c; }
      .m-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
      .m-actions a {
        display: block; text-align: center; text-decoration: none;
        padding: 13px; border-radius: 999px; font-weight: 600; font-size: 15px;
        font-family: "Space Grotesk", system-ui, sans-serif;
      }
      .m-signin { background: rgba(76,25,77,.06); color: #4b1d51; }
      .m-cta { background: #dd531c; color: #fff; }
    }
  `;

  class WonderEloNav extends HTMLElement {
    connectedCallback() {
      if (this._mounted) return;
      this._mounted = true;
      const active = (this.getAttribute('active') || '').toLowerCase();
      const logo = this.getAttribute('logo') || 'assets/Wonderelo-logo-symbol.png';

      const linkRow = LINKS.map(l =>
        `<a href="${l.href}" class="${active === l.key ? 'is-active' : ''}">${l.label}</a>`).join('');
      const mLinks = LINKS.map(l =>
        `<a href="${l.href}" class="m-link ${active === l.key ? 'is-active' : ''}">${l.label}</a>`).join('');

      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>${css}</style>
        <div class="bar">
          <div class="bar-inner">
            <a class="lockup" href="#" aria-label="Wonderelo home">
              <span class="symbol"><img src="${logo}" alt="" /></span>
              <span class="word">wonderelo</span>
            </a>
            <nav class="links">${linkRow}</nav>
            <div class="actions">
              <a class="signin" href="#">Sign in</a>
              <a class="cta" href="#">Start for free</a>
            </div>
            <button class="burger" type="button" aria-label="Open menu" aria-expanded="false">
              <span></span><span></span><span></span>
            </button>
          </div>
          <nav class="mobile">
            ${mLinks}
            <div class="m-actions">
              <a class="m-signin" href="#">Sign in</a>
              <a class="m-cta" href="#">Start for free</a>
            </div>
          </nav>
        </div>`;

      const burger = root.querySelector('.burger');
      burger.addEventListener('click', () => {
        const open = this.toggleAttribute('data-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      // Close the menu after choosing a destination
      root.querySelectorAll('.mobile a').forEach(a =>
        a.addEventListener('click', () => {
          this.removeAttribute('data-open');
          burger.setAttribute('aria-expanded', 'false');
        }));
    }
  }

  if (!customElements.get('wonderelo-nav')) {
    customElements.define('wonderelo-nav', WonderEloNav);
  }

  /* Dev hook — lets the Overview board open/close the mobile menu without a
     real click on the hamburger (board iframes aren't directly clickable). */
  window.setNavMenu = function (v) {
    const open = v === 'open' || v === true || v === 'show' || v === 'on';
    const el = document.querySelector('wonderelo-nav');
    if (!el) return;
    if (open) el.setAttribute('data-open', ''); else el.removeAttribute('data-open');
    const b = el.shadowRoot && el.shadowRoot.querySelector('.burger');
    if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
})();
