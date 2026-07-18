/* Wonderelo — shared public-site footer (Claude Design `.w-footer`).
   Ported verbatim from design/v06/project/pages/Our Story.html.
   Renders inside a page that already carries the `.wonderelo` scope — do NOT
   self-scope here. Styles live in src/styles/wonderelo-public.css.

   Phase 1: footer links are visual-only (href="#") EXCEPT the four routes wired
   below via react-router (Pricing, Our story, Blog, Sign up→home). */
import { useNavigate } from 'react-router';

export function PublicFooter() {
  const navigate = useNavigate();

  const go = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <footer className="w-footer">
      <span className="w-foot-deco">wonder</span>
      <div className="w-footer-inner">
        <div className="w-footer-grid">
          <div className="w-foot-brand">
            <div className="w-foot-logo">
              <div className="w-mark"><div className="w-inner" /></div>
              <div className="w-word">wonderelo</div>
            </div>
            <p>Speed-networking for events. The room you booked, the people you invited, every introduction worth having.</p>
            <a className="w-foot-cta" href="#"><span className="w-dot" /> All systems normal</a>
          </div>
          <div className="w-foot-col">
            <h5>Product</h5>
            <ul>
              <li><a className="w-foot-link" href="#">How it works</a></li>
              <li><a className="w-foot-link" href="#">Features</a></li>
              <li><a className="w-foot-link" href="#" onClick={go('/pricing')}>Pricing</a></li>
              <li><a className="w-foot-link" href="#" onClick={go('/')}>Sign up</a></li>
            </ul>
          </div>
          <div className="w-foot-col">
            <h5>For</h5>
            <ul>
              <li><a className="w-foot-link" href="#">Conferences</a></li>
              <li><a className="w-foot-link" href="#">Meetups</a></li>
              <li><a className="w-foot-link" href="#">Weddings</a></li>
              <li><a className="w-foot-link" href="#">Teams</a></li>
            </ul>
          </div>
          <div className="w-foot-col">
            <h5>Learn</h5>
            <ul>
              <li><a className="w-foot-link" href="#" onClick={go('/our-story')}>Our story</a></li>
              <li><a className="w-foot-link" href="#" onClick={go('/blog')}>Blog</a></li>
              <li><a className="w-foot-link" href="#">Case studies</a></li>
              <li><a className="w-foot-link" href="#">Help center</a></li>
            </ul>
          </div>
          <div className="w-foot-col">
            <h5>Company</h5>
            <ul>
              <li><a className="w-foot-link" href="#">About</a></li>
              <li><a className="w-foot-link" href="#">Careers</a></li>
              <li><a className="w-foot-link" href="#">Contact</a></li>
              <li><a className="w-foot-link" href="#">Press kit</a></li>
            </ul>
          </div>
        </div>
        <div className="w-foot-bottom">
          <span>© 2026 Wonderelo · Made in Bratislava with rounds that don't feel like rounds.</span>
          <div className="w-foot-legal">
            <a className="w-foot-link" href="#">Privacy</a>
            <a className="w-foot-link" href="#">Terms</a>
            <a className="w-foot-link" href="#">Cookies</a>
            <a className="w-foot-link" href="#">GDPR</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
