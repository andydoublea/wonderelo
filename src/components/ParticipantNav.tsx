import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { User, LogOut, Home, UserCircle, LayoutDashboard, BookUser } from 'lucide-react';

interface ParticipantNavProps {
  participantToken?: string;
  firstName?: string;
  lastName?: string;
  onLogoClick: () => void;
  onHomeClick: () => void;
  onDashboardClick: () => void;
  onProfileClick: () => void;
  onAddressBookClick: () => void;
  onLogout: () => void;
}

export function ParticipantNav({ participantToken, firstName, lastName, onLogoClick, onHomeClick, onDashboardClick, onProfileClick, onAddressBookClick, onLogout }: ParticipantNavProps) {
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : firstName || 'Participant';

  return (
    <nav className="border-b border-border">
      <div className="container mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onLogoClick}
            className="text-xl font-semibold text-primary wonderelo-logo hover:opacity-80 transition-opacity"
          >
            Wonderelo
          </button>
          
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  {displayName}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onHomeClick}>
                  <Home className="h-4 w-4 mr-2" />
                  Homepage
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDashboardClick}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onProfileClick}>
                  <UserCircle className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onAddressBookClick}>
                  <BookUser className="h-4 w-4 mr-2" />
                  Address Book
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}