// hero-tweak-apply.js — applies hero-image size/position tweaks.
// Included by every homepage variant (desktop + mobile). Reads values from
// shared localStorage and from live postMessages sent by View.html, then
// injects a <style> that overrides the base hero transform at each breakpoint.
//
//   .hero-art  (desktop file) → lg (>1366) / md (1025–1366) / tb (≤1024)
//   .hero-img  (mobile file)  → mb
//
// Rules for both selectors are always emitted; the ones that match nothing on
// a given page are simply inert, so this is safe before React has rendered.
(function () {
  const KEY = 'wonderelo:heroTweaks';
  const DEFAULTS = {
    lg: { scale: 1.24, x: 0, y: 0 },
    md: { scale: 1.30, x: 0, y: 0 },
    tb: { scale: 1.00, x: 0, y: 0 },
    mb: { scale: 1.00, x: 0, y: 0 }
  };

  function read() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || '{}');
      return {
        lg: Object.assign({}, DEFAULTS.lg, v.lg),
        md: Object.assign({}, DEFAULTS.md, v.md),
        tb: Object.assign({}, DEFAULTS.tb, v.tb),
        mb: Object.assign({}, DEFAULTS.mb, v.mb)
      };
    } catch (e) { return DEFAULTS; }
  }

  function styleEl() {
    let el = document.getElementById('hero-tweak-style');
    if (!el) {
      el = document.createElement('style');
      el.id = 'hero-tweak-style';
      document.head.appendChild(el);
    }
    return el;
  }

  function apply(v) {
    v = {
      lg: Object.assign({}, DEFAULTS.lg, v && v.lg),
      md: Object.assign({}, DEFAULTS.md, v && v.md),
      tb: Object.assign({}, DEFAULTS.tb, v && v.tb),
      mb: Object.assign({}, DEFAULTS.mb, v && v.mb)
    };
    styleEl().textContent =
      `@media (min-width:1367px){.hero-art{transform:translate(${v.lg.x}px,${v.lg.y}px) scale(${v.lg.scale})!important;transform-origin:center right;}}` +
      `@media (min-width:1025px) and (max-width:1366px){.hero-art{transform:translate(${v.md.x}px,${v.md.y}px) scale(${v.md.scale})!important;transform-origin:center right;}}` +
      `@media (max-width:1024px){.hero-art{transform:translate(${v.tb.x}px,${v.tb.y}px) scale(${v.tb.scale})!important;transform-origin:center;}}` +
      `.hero-img{transform:translate(${v.mb.x}px,${v.mb.y}px) scale(${v.mb.scale});transform-origin:center;}`;
  }

  apply(read());

  // Live updates while the viewer is open
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'wonderelo-hero-tweak') apply(e.data.values);
  });
  // Same-origin storage sync (other frames / tabs)
  window.addEventListener('storage', function (e) { if (e.key === KEY) apply(read()); });

  window.__applyHeroTweaks = apply;
})();
