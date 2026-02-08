import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { User, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { toast } from 'sonner@2.0.3';

interface NavigationProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

export function Navigation({ onGetStarted, onSignIn }: NavigationProps) {
  const navigate = useNavigate();
  const [participantToken, setParticipantToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('participant_token');
    setParticipantToken(token);
  }, []);

  return (
    <nav className="border-b border-border">
      <div className="container mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h2 
              className="text-primary cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
            >
              Wonderelo
            </h2>
            <div className="hidden md:flex items-center space-x-6">
              <Button variant="ghost" onClick={() => {
                navigate('/');
                setTimeout(() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}>
                Features
              </Button>
              <Button variant="ghost">
                How it works
              </Button>
              <Button variant="ghost">
                Pricing
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {participantToken ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <User className="h-4 w-4 mr-2" />
                    My account
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate(`/p/${participantToken}`)}>
                    My dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      localStorage.removeItem('participant_token');
                      setParticipantToken(null);
                      toast.success('Logged out successfully');
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                {onSignIn && (
                  <Button variant="ghost" onClick={onSignIn}>
                    Log in
                  </Button>
                )}
                {onGetStarted && (
                  <Button onClick={onGetStarted}>
                    Sign up
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
