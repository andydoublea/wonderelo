import { useNavigate, useParams } from 'react-router';

/**
 * Minimal Wonderelo header for participant-facing pages (match flow, etc).
 * Shows only the Wonderelo logo. Clicking the logo navigates to participant dashboard
 * if a token is available; otherwise to homepage.
 */
export function WondereloHeader() {
  const navigate = useNavigate();
  const { token } = useParams<{ token?: string }>();

  const handleLogoClick = () => {
    if (token) {
      navigate(`/p/${token}`);
    } else {
      navigate('/');
    }
  };

  return (
    <nav className="border-b border-border bg-background">
      <div className="container mx-auto max-w-6xl px-6 py-4">
        <button
          onClick={handleLogoClick}
          className="text-xl font-semibold text-primary wonderelo-logo hover:opacity-80 transition-opacity"
        >
          Wonderelo
        </button>
      </div>
    </nav>
  );
}
