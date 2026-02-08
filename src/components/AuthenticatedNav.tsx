import { Button } from './ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel
} from './ui/dropdown-menu';
import { Settings, Bell, CreditCard, LogOut, ChevronDown, FileText } from 'lucide-react';
import { APP_VERSION } from '../utils/version';
import { useNavigate } from 'react-router';

interface AuthenticatedNavProps {
  currentView: string;
  currentUser: any;
  isAdminUser: boolean;
  onNavigateToDashboard?: () => void;
  onNavigateToRounds: () => void;
  onNavigateToAccountSettings: () => void;
  onNavigateToEventPageSettings?: () => void;
  onNavigateToBilling?: () => void;
  onNavigateToAdmin?: () => void;
  onSignOut: () => void;
}

export function AuthenticatedNav({
  currentView,
  currentUser,
  isAdminUser,
  onNavigateToDashboard,
  onNavigateToRounds,
  onNavigateToAccountSettings,
  onNavigateToEventPageSettings,
  onNavigateToBilling,
  onNavigateToAdmin,
  onSignOut,
}: AuthenticatedNavProps) {
  const navigate = useNavigate();
  
  // Extract build number and increment by 2 for display
  const buildNumber = parseInt(APP_VERSION.replace('Build ', '')) + 2;
  const displayVersion = `Build ${buildNumber}`;

  // All available pages in the app
  const allPages = [
    { label: 'Homepage', path: '/', public: true },
    { label: 'Sign up', path: '/signup', public: true },
    { label: 'Sign in', path: '/signin', public: true },
    { label: 'Reset password', path: '/reset-password', public: true },
    { label: 'Dashboard', path: '/dashboard', protected: true },
    { label: 'Rounds', path: '/rounds', protected: true },
    { label: 'New round', path: '/rounds/new', protected: true },
    { label: 'Round detail', path: '/rounds/[id]', protected: true, template: true },
    { label: 'Account settings', path: '/account-settings', protected: true },
    { label: 'Admin panel', path: '/admin', protected: true, admin: true },
    { label: 'Participant dashboard', path: '/p/[token]', public: true, template: true },
    { label: 'Participant round detail', path: '/p/[token]/r/[roundId]', public: true, template: true },
    { label: 'User public page', path: '/[slug]', public: true, template: true },
  ];

  const handleQuickNav = (path: string) => {
    // For template routes, use a default example or current user data
    let navigatePath = path;
    if (path.includes('[id]')) {
      // Use first available session ID or example
      navigatePath = path.replace('[id]', 'example-id');
    }
    if (path.includes('[token]')) {
      navigatePath = path.replace('[token]', 'example-token');
    }
    if (path.includes('[roundId]')) {
      navigatePath = path.replace('[roundId]', 'example-round-id');
    }
    if (path.includes('[slug]')) {
      // Use current user's URL slug
      navigatePath = path.replace('[slug]', currentUser?.urlSlug || 'example-slug');
    }
    navigate(navigatePath);
  };

  return (
    <div className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="text-2xl font-semibold text-primary cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onNavigateToDashboard || onNavigateToRounds}
          >
            <h2>Wonderelo</h2>
          </div>
          
          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {/* Dashboard link */}
            {onNavigateToDashboard && (
              <Button
                variant={currentView === 'dashboard' ? 'secondary' : 'ghost'}
                onClick={onNavigateToDashboard}
              >
                Dashboard
              </Button>
            )}
            
            {/* Rounds link */}
            <Button
              variant={currentView === 'rounds' ? 'secondary' : 'ghost'}
              onClick={onNavigateToRounds}
            >
              Rounds
            </Button>
            
            {/* Admin Panel - only for admin users */}
            {isAdminUser && localStorage.getItem('is_impersonation') !== 'true' && (
              <Button
                variant={currentView === 'admin' ? 'secondary' : 'ghost'}
                onClick={onNavigateToAdmin}
              >
                Admin panel
              </Button>
            )}
            
            {/* End impersonation button */}
            {localStorage.getItem('is_impersonation') === 'true' && (
              <Button 
                variant="outline" 
                onClick={() => {
                  localStorage.removeItem('is_impersonation');
                  window.close();
                }}
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                End impersonation
              </Button>
            )}
            
            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  {currentUser?.organizerName || 'Your name'}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={onNavigateToAccountSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onNavigateToEventPageSettings}>
                  <FileText className="mr-2 h-4 w-4" />
                  Event page settings
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onNavigateToBilling}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </div>
  );
}