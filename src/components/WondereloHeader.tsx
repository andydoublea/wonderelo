import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { User, LogOut, Home, UserCircle, LayoutDashboard, BookUser } from 'lucide-react';

/**
 * Shared header for participant-facing pages (match flow, etc).
 * Shows Wonderelo logo on the left and participant menu on the right.
 * Logo click → participant dashboard. Menu provides navigation + logout.
 */
export function WondereloHeader() {
  const navigate = useNavigate();
  const { token } = useParams<{ token?: string }>();
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');

  // Load participant name from cached profile / dashboard data
  useEffect(() => {
    if (!token) return;
    try {
      // Try profile cache first
      const profileCache = localStorage.getItem(`participant_profile_${token}`);
      if (profileCache) {
        const p = JSON.parse(profileCache);
        if (p.firstName) setFirstName(p.firstName);
        if (p.lastName) setLastName(p.lastName);
        return;
      }
      // Fallback: dashboard cache
      const dashCache = localStorage.getItem(`participant_dashboard_${token}`);
      if (dashCache) {
        const d = JSON.parse(dashCache);
        if (d.firstName) setFirstName(d.firstName);
        if (d.lastName) setLastName(d.lastName);
      }
    } catch { /* ignore */ }
  }, [token]);

  const displayName = firstName && lastName ? `${firstName} ${lastName}` : firstName || 'Participant';

  const handleLogoClick = () => {
    if (token) navigate(`/p/${token}`);
    else navigate('/');
  };

  const handleDashboard = () => { if (token) navigate(`/p/${token}`); };
  const handleProfile = () => { if (token) navigate(`/p/${token}/profile`); };
  const handleAddressBook = () => { if (token) navigate(`/p/${token}/address-book`); };
  const handleHome = () => {
    sessionStorage.setItem('allow_participant_browsing', 'true');
    navigate('/');
  };
  const handleLogout = () => {
    localStorage.removeItem('participant_token');
    navigate('/');
  };

  return (
    <nav className="border-b border-border bg-background">
      <div className="container mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleLogoClick}
            className="text-xl font-semibold text-primary wonderelo-logo hover:opacity-80 transition-opacity"
          >
            Wonderelo
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                {displayName}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDashboard}>
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleProfile}>
                <UserCircle className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddressBook}>
                <BookUser className="h-4 w-4 mr-2" />
                Address Book
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleHome}>
                <Home className="h-4 w-4 mr-2" />
                Homepage
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
