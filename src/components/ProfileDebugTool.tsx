import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2, RefreshCw, User, Edit2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { debugLog, errorLog } from '../utils/debug';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';

interface ProfileDebugToolProps {
  accessToken: string;
  userSlug: string;
}

export function ProfileDebugTool({ accessToken, userSlug }: ProfileDebugToolProps) {
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [organizerName, setOrganizerName] = useState('');

  const checkProfile = async () => {
    try {
      setIsCheckingProfile(true);
      debugLog('🔍 Checking profile for slug:', userSlug);
      
      const response = await fetch(
        `${apiBaseUrl}/debug/user/${userSlug}/profile`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        debugLog('📋 Profile data:', data);
        setProfileData(data);
        
        if (data.userProfile?.organizerName) {
          setOrganizerName(data.userProfile.organizerName);
        }
        
        toast.success('Profile data retrieved');
      } else {
        const error = await response.json();
        errorLog('Error checking profile:', error);
        toast.error(error.error || 'Failed to check profile');
      }
    } catch (error) {
      errorLog('Error checking profile:', error);
      toast.error('Failed to check profile');
    } finally {
      setIsCheckingProfile(false);
    }
  };

  const refreshProfile = async () => {
    try {
      setIsRefreshingProfile(true);
      debugLog('🔄 Refreshing profile...');
      
      const response = await fetch(
        `${apiBaseUrl}/refresh-my-profile`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        debugLog('✅ Profile refreshed:', data);
        toast.success('Profile refreshed successfully!');
        
        // Re-check profile to see updated data
        setTimeout(() => {
          checkProfile();
        }, 500);
      } else {
        const error = await response.json();
        errorLog('Error refreshing profile:', error);
        toast.error(error.error || 'Failed to refresh profile');
      }
    } catch (error) {
      errorLog('Error refreshing profile:', error);
      toast.error('Failed to refresh profile');
    } finally {
      setIsRefreshingProfile(false);
    }
  };

  const updateOrganizerName = async () => {
    if (!organizerName.trim()) {
      toast.error('Please enter an organizer name');
      return;
    }

    try {
      debugLog('💾 Updating organizer name to:', organizerName);
      
      const { authenticatedFetch } = await import('../utils/supabase/apiClient');
      const response = await authenticatedFetch(
        '/profile',
        {
          method: 'PUT',
          body: JSON.stringify({
            organizerName: organizerName.trim(),
          }),
        },
        accessToken
      );

      if (response.ok) {
        const data = await response.json();
        debugLog('✅ Organizer name updated:', data);
        toast.success('Organizer name updated successfully!');
        
        // Re-check profile to see updated data
        setTimeout(() => {
          checkProfile();
        }, 500);
      } else {
        const error = await response.json();
        errorLog('Error updating organizer name:', error);
        toast.error(error.error || 'Failed to update organizer name');
      }
    } catch (error) {
      errorLog('Error updating organizer name:', error);
      toast.error('Failed to update organizer name');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile debug tool</CardTitle>
        <CardDescription>
          Check and fix your profile data in the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This tool helps diagnose and fix profile data issues. Use it if your event page shows incorrect organizer name.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Button 
            onClick={checkProfile}
            disabled={isCheckingProfile}
            className="w-full"
          >
            {isCheckingProfile ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Check profile data
              </>
            )}
          </Button>

          <Button 
            onClick={refreshProfile}
            disabled={isRefreshingProfile}
            variant="outline"
            className="w-full"
          >
            {isRefreshingProfile ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh profile
              </>
            )}
          </Button>
        </div>

        {profileData && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <h4 className="font-medium">Current profile data:</h4>
              <div className="space-y-1 text-sm font-mono">
                <div>
                  <strong>User ID:</strong> {profileData.userId}
                </div>
                <div>
                  <strong>URL slug:</strong> {profileData.userSlugMapping || 'Not set'}
                </div>
                <div>
                  <strong>Email:</strong> {profileData.userProfile?.email || 'Not set'}
                </div>
                <div>
                  <strong>Organizer name:</strong>{' '}
                  <span className={profileData.userProfile?.organizerName ? 'text-green-600' : 'text-red-600'}>
                    {profileData.userProfile?.organizerName || 'NOT SET ❌'}
                  </span>
                </div>
                <div>
                  <strong>Service type:</strong> {profileData.userProfile?.serviceType || 'Not set'}
                </div>
                <div>
                  <strong>Last updated:</strong> {profileData.userProfile?.updatedAt || 'Never'}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="organizer-name-fix">Fix organizer name:</Label>
              <div className="flex gap-2">
                <Input
                  id="organizer-name-fix"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  placeholder="Enter organizer name"
                />
                <Button onClick={updateOrganizerName}>
                  Update
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t">
              <strong>Raw data:</strong>
              <pre className="mt-2 p-2 bg-background rounded overflow-auto max-h-48">
                {JSON.stringify(profileData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}