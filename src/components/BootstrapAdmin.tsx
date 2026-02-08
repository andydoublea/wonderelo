import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner@2.0.3';
import { Shield, AlertTriangle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { debugLog, errorLog } from '../utils/debug';

export function BootstrapAdmin() {
  const [email, setEmail] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBootstrap = async () => {
    if (!email || !adminSecret) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/bootstrap-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, adminSecret }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success('Admin access granted! Please refresh the page.');
        debugLog('Admin bootstrapped:', data);
        setEmail('');
        setAdminSecret('');
        
        // Reload page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to grant admin access');
      }
    } catch (error) {
      errorLog('Error bootstrapping admin:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to grant admin access');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Shield className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <CardTitle>Bootstrap admin access</CardTitle>
              <CardDescription>Grant admin privileges to your account</CardDescription>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg mt-4">
            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-800">
              <p className="font-medium mb-1">Security Notice</p>
              <p className="text-xs">This endpoint should only be used once to set up the first admin. The default secret is: <code className="bg-orange-100 px-1 py-0.5 rounded">wonderelo-admin-2024</code></p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Your email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Enter the email address of your Wonderelo account
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminSecret">Admin secret</Label>
            <Input
              id="adminSecret"
              type="password"
              placeholder="Enter admin secret"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Use the default secret or set ADMIN_BOOTSTRAP_SECRET env variable
            </p>
          </div>

          <Button 
            onClick={handleBootstrap} 
            disabled={isLoading || !email || !adminSecret}
            className="w-full"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                Granting access...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Grant admin access
              </>
            )}
          </Button>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              After granting admin access, the page will automatically reload.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
