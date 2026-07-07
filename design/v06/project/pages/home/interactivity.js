/* ─────────────────────────────────────────────────────────────────────────
   Wonderelo — Homepage interaction layer
   Runs after React mounts, tags inline-styled elements with fx-* classes,
   and wires up cursor / scroll-reveal / parallax / click-ripple.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // 1 ── Click ripple
  document.addEventListener('click', (e) => {
    const tgt = e.target.closest('button, a, [role="button"]');
    if (!tgt) return;
    const r = document.createElement('div');
    r.className = 'fx-ripple';
    r.style.left = e.clientX + 'px';
    r.style.top  = e.clientY + 'px';
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 600);
  });

  // 3 ── Tag elements after React renders
  function tagAll() {
    const root = document.getElementById('root');
    if (!root) return;

    // Cards: divs whose inline style mentions border-radius: 24 (the section card pattern)
    root.querySelectorAll('div[style*="border-radius: 24"], div[style*="border-radius:24"]').forEach((el) => {
      if (el.classList.contains('fx-card')) return;
      el.classList.add('fx-card');
      // Find the first descendant img/svg container and tag it as the media zoom target
      const media = el.querySelector('div[style*="border-radius: 16"], div[style*="border-radius:16"]');
      if (media) media.classList.add('fx-card-media');
    });

    // Diamonds: anything with rotate(45deg) inline that isn't already a card child decoration
    root.querySelectorAll('[style*="rotate(45deg)"]').forEach((el) => {
      // Skip mark inners (those are inside lockups)
      if (el.classList.contains('fx-diamond')) return;
      el.classList.add('fx-diamond');
      // Float-animate larger absolutely-positioned ones
      const s = el.getAttribute('style') || '';
      if (s.includes('position: absolute') || s.includes('position:absolute')) {
        el.classList.add('fx-float');
        el.style.animationDelay = (Math.random() * 6) + 's';
      }
    });

    // Buttons + role buttons
    root.querySelectorAll('button, [role="button"]').forEach((el) => el.classList.add('fx-btn'));

    // Italic Instrument Serif accents
    root.querySelectorAll('span, em').forEach((el) => {
      const f = el.style && el.style.fontFamily;
      if (f && /Instrument Serif/i.test(f)) el.classList.add('fx-ember');
    });

    // Anchors → grow underline (text links) or icon-only
    root.querySelectorAll('a').forEach((el) => {
      const hasOnlyMedia = el.querySelector('img,svg') && !el.textContent.trim();
      if (hasOnlyMedia) {
        el.classList.add('fx-icon');
      } else if (el.textContent.trim()) {
        el.classList.add('fx-link');
      }
    });

    // Generic clickables — elements with cursor:pointer in inline style or onClick handlers
    root.querySelectorAll('[style*="cursor: pointer"], [style*="cursor:pointer"]').forEach((el) => {
      if (el.matches('button, a, [role="button"], .fx-card')) return;
      el.classList.add('fx-clickable');
    });

    // Pills / badges — small inline rounded elements (border-radius >= 999 or capsule shape)
    root.querySelectorAll('[style*="border-radius: 999"], [style*="border-radius:999"], [style*="border-radius: 100"]').forEach((el) => {
      // Only treat as clickable pill if it's a button/anchor/has cursor:pointer or role=button
      const isClickable = el.matches('button, a, [role="button"]') ||
                          /cursor:\s*pointer/.test(el.getAttribute('style') || '');
      if (isClickable) el.classList.add('fx-pill');
    });

    // Lockups — anything containing a tilted-square "mark" + wordmark next to it
    root.querySelectorAll('div, a').forEach((el) => {
      const txt = el.textContent || '';
      if (/wonderelo/i.test(txt) && txt.length < 30 && el.children.length <= 4) {
        el.classList.add('fx-lockup');
      }
    });

    // Images that sit inside a clickable card already have the media zoom; tag standalone clickable images
    root.querySelectorAll('img').forEach((el) => {
      const parent = el.closest('button, a, [role="button"], .fx-clickable');
      if (parent && !el.closest('.fx-card')) el.classList.add('fx-img-click');
    });

    // Scroll reveal — tag every direct <section> and major card grid
    root.querySelectorAll('section').forEach((sec) => {
      if (sec.classList.contains('fx-reveal')) return;
      sec.classList.add('fx-reveal');
      // Tag immediate card siblings as stagger items
      sec.querySelectorAll('.fx-card').forEach((c) => c.classList.add('fx-stagger'));
    });

    // Per-step reveal in How-it-works — observe each step row individually
    root.querySelectorAll('.fx-step-row').forEach((row) => {
      if (row.dataset.fxStepObserved) return;
      row.dataset.fxStepObserved = '1';
      stepIO.observe(row);
    });
  }

  // 4 ── IntersectionObserver for reveals
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  // Per-step IO — fires later in the scroll so each step pops in as it nears center
  const stepIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        stepIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -15% 0px' });

  function observeAll() {
    document.querySelectorAll('.fx-reveal:not(.is-in)').forEach((el) => io.observe(el));
  }

  // 5 ── Parallax for diamond decorations on scroll
  let scrollY = window.scrollY;
  function parallax() {
    const targets = document.querySelectorAll('.fx-diamond.fx-float');
    targets.forEach((el, i) => {
      const speed = 0.04 + (i % 5) * 0.01;
      const r = el.getBoundingClientRect();
      const offset = (window.innerHeight / 2 - r.top) * speed;
      el.style.translate = `0 ${offset.toFixed(1)}px`;
    });
    requestAnimationFrame(parallax);
  }

  // 6 ── Magnetic pull on buttons
  function wireMagnetic() {
    document.querySelectorAll('.fx-btn').forEach((btn) => {
      if (btn.dataset.fxMag) return;
      btn.dataset.fxMag = '1';
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const mx = (e.clientX - r.left - r.width / 2) / r.width;
        const my = (e.clientY - r.top - r.height / 2) / r.height;
        btn.style.transform = `translate(${(mx * 6).toFixed(1)}px, ${(my * 6 - 2).toFixed(1)}px) scale(1.02)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  // 7 ── Run after React mounts; re-run on tree mutations
  function pass() { tagAll(); observeAll(); wireMagnetic(); }
  // Initial: poll until something is rendered
  let tries = 0;
  (function waitMount() {
    const root = document.getElementById('root');
    if (root && root.children.length > 0) {
      pass();
      requestAnimationFrame(parallax);
      // Watch for further DOM additions (artboards, etc.)
      const mo = new MutationObserver(() => pass());
      mo.observe(root, { childList: true, subtree: true });
    } else if (tries++ < 80) {
      setTimeout(waitMount, 80);
    }
  })();
})();