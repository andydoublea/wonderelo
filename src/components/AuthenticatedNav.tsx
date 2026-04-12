import { useState } from 'react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Settings, CreditCard, LogOut, ChevronDown, FileText, Menu, X } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Extract build number and increment by 2 for display
  const buildNumber = parseInt(APP_VERSION.replace('Build ', '')) + 2;
  const displayVersion = `Build ${buildNumber}`;

  const isImpersonating = localStorage.getItem('is_impersonation') === 'true';

  return (
    <div className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="text-2xl font-semibold text-primary cursor-pointer"
            onClick={onNavigateToDashboard || onNavigateToRounds}
          >
            <h2 className="wonderelo-logo">Wonderelo</h2>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {onNavigateToDashboard && (
              <Button
                variant={currentView === 'dashboard' ? 'secondary' : 'ghost'}
                onClick={onNavigateToDashboard}
              >
                Dashboard
              </Button>
            )}

            <Button
              variant={currentView === 'rounds' ? 'secondary' : 'ghost'}
              onClick={onNavigateToRounds}
            >
              Rounds
            </Button>

            {isAdminUser && !isImpersonating && (
              <Button
                variant={currentView === 'admin' ? 'secondary' : 'ghost'}
                onClick={onNavigateToAdmin}
              >
                Admin panel
              </Button>
            )}

            {isImpersonating && (
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
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onNavigateToAccountSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onNavigateToEventPageSettings}>
                  <FileText className="mr-2 h-4 w-4" />
                  Event page
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

          {/* Mobile hamburger button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-6 py-3 space-y-1">
            {onNavigateToDashboard && (
              <button
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${currentView === 'dashboard' ? 'bg-secondary font-medium' : 'hover:bg-muted'}`}
                onClick={() => { onNavigateToDashboard(); setMobileMenuOpen(false); }}
              >
                Dashboard
              </button>
            )}

            <button
              className={`w-full text-left px-3 py-2 rounded-md text-sm ${currentView === 'rounds' ? 'bg-secondary font-medium' : 'hover:bg-muted'}`}
              onClick={() => { onNavigateToRounds(); setMobileMenuOpen(false); }}
            >
              Rounds
            </button>

            {isAdminUser && !isImpersonating && (
              <button
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${currentView === 'admin' ? 'bg-secondary font-medium' : 'hover:bg-muted'}`}
                onClick={() => { onNavigateToAdmin?.(); setMobileMenuOpen(false); }}
              >
                Admin panel
              </button>
            )}

            <div className="border-t border-border my-2" />

            <button
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted flex items-center gap-2"
              onClick={() => { onNavigateToAccountSettings(); setMobileMenuOpen(false); }}
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              Account
            </button>
            <button
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted flex items-center gap-2"
              onClick={() => { onNavigateToEventPageSettings?.(); setMobileMenuOpen(false); }}
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              Event page
            </button>
            <button
              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted flex items-center gap-2"
              onClick={() => { onNavigateToBilling?.(); setMobileMenuOpen(false); }}
            >
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Billing
            </button>

            {isImpersonating && (
              <>
                <div className="border-t border-border my-2" />
                <button
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                  onClick={() => {
                    localStorage.removeItem('is_impersonation');
                    window.close();
                  }}
                >
                  End impersonation
                </button>
              </>
            )}

            <div className="border-t border-border my-2" />

            <button
              className="w-full text-left px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
              onClick={() => { onSignOut(); setMobileMenuOpen(false); }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
