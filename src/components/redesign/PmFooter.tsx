/* Wonderelo — matching-flow footer (Claude Design `.pm-footer`), shared by all
   Participant Matching screens (mirrors the dashboard/account footer). */
export function PmFooter({ onBrandClick }: { onBrandClick?: () => void }) {
  return (
    <footer className="pm-footer">
      <a className="pd-brand" role="button" tabIndex={0} onClick={onBrandClick}>
        <span className="mark"><span className="inner" /></span>
        <span className="word">wond<em>e</em>relo</span>
      </a>
      <p className="tagline">Break your bubble, meet new people</p>
      <p className="copy">© 2026 Wonderelo</p>
    </footer>
  );
}
