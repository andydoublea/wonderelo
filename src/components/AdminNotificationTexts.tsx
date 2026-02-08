import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Mail, MessageSquare, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AdminNotificationTextsProps {
  accessToken: string;
  onBack: () => void;
}

interface NotificationTexts {
  // SMS Templates
  smsConfirmationReminder: string;
  smsRoundStartingSoon: string;
  
  // Email Templates
  emailWelcomeSubject: string;
  emailWelcomeBody: string;
  emailConfirmationReminderSubject: string;
  emailConfirmationReminderBody: string;
}

const DEFAULT_TEXTS: NotificationTexts = {
  // SMS
  smsConfirmationReminder: 'Hi {name}! Please confirm your attendance for "{sessionName}" round starting at {time}. Confirm here: {link}',
  smsRoundStartingSoon: '⏰ Reminder: "{sessionName}" round starts in {minutes} minutes at {location}!',
  
  // Email
  emailWelcomeSubject: '{eventName} - Oliwonder round details',
  emailWelcomeBody: `Hi {firstName}!

You've successfully registered for the following rounds:

{sessionsList}

🔔 An SMS reminder will arrive 5 minutes before each round to confirm your attendance.

🗓️ Check the attached calendar event and add it to your schedule!

📍 MEETING POINTS
Stay close to <a href="{eventUrl}#meeting-points">Meeting points</a> before your round to be on time.

🎲 ROUND RULES
Follow <a href="{eventUrl}#round-rules">these rules</a> to make most out of the round.

✏️ MANAGE YOUR REGISTRATIONS:
{myRoundsUrl}

Let the wonder begin! ✨

{eventName} & Oliwonder team`,
  emailConfirmationReminderSubject: 'Confirm your registration',
  emailConfirmationReminderBody: `Hi {firstName},

Click the button below to confirm your registration:

{verificationUrl}

This link expires in 48 hours.

If you didn't register for this event, please ignore this email.

Best regards,
Oliwonder Team`,
};

export function AdminNotificationTexts({ accessToken, onBack }: AdminNotificationTextsProps) {
  const [texts, setTexts] = useState<NotificationTexts>(DEFAULT_TEXTS);
  const [originalTexts, setOriginalTexts] = useState<NotificationTexts>(DEFAULT_TEXTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTexts();
  }, []);

  const fetchTexts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/notification-texts`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const loadedTexts = data.texts || DEFAULT_TEXTS;
        setTexts(loadedTexts);
        setOriginalTexts(loadedTexts);
      } else {
        toast.error('Failed to load notification texts');
      }
    } catch (error) {
      console.error('Error fetching notification texts:', error);
      toast.error('Failed to load notification texts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/notification-texts`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ texts }),
        }
      );

      if (response.ok) {
        setOriginalTexts(texts);
        toast.success('Notification texts saved successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save notification texts');
      }
    } catch (error) {
      console.error('Error saving notification texts:', error);
      toast.error('Failed to save notification texts');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all notification texts to defaults?')) {
      setTexts(DEFAULT_TEXTS);
      toast.info('Notification texts reset to defaults (not saved yet)');
    }
  };

  const handleRevert = () => {
    setTexts(originalTexts);
    toast.info('Reverted to last saved values');
  };

  const hasChanges = JSON.stringify(texts) !== JSON.stringify(originalTexts);

  const isFieldChanged = <K extends keyof NotificationTexts>(key: K): boolean => {
    return texts[key] !== originalTexts[key];
  };

  const updateText = <K extends keyof NotificationTexts>(
    key: K,
    value: NotificationTexts[K]
  ) => {
    setTexts(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading notification texts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Notification texts</h1>
                <p className="text-sm text-muted-foreground">Customize SMS and email notification templates</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to defaults
              </Button>
              <Button onClick={handleRevert} disabled={!hasChanges}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Revert changes
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="space-y-6">
          
          {/* Available Variables Info */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="text-blue-500 flex-shrink-0">
                  💡
                </div>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-blue-900">Available variables:</p>
                  <div className="grid grid-cols-2 gap-4 text-blue-800">
                    <div>
                      <strong>Participant:</strong> {'{firstName}'}, {'{name}'}, {'{email}'}, {'{phone}'}
                    </div>
                    <div>
                      <strong>Event:</strong> {'{eventName}'}, {'{eventUrl}'}
                    </div>
                    <div>
                      <strong>Session:</strong> {'{sessionName}'}, {'{sessionsList}'}, {'{location}'}
                    </div>
                    <div>
                      <strong>Links:</strong> {'{myRoundsUrl}'}, {'{verificationUrl}'}
                    </div>
                    <div>
                      <strong>Time:</strong> {'{time}'}, {'{date}'}, {'{minutes}'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SMS Templates Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardTitle>SMS templates</CardTitle>
                  <CardDescription>Text messages sent to participants (keep concise, ~160 characters)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* SMS Confirmation Reminder */}
              <div className="space-y-2">
                <Label htmlFor="smsConfirmationReminder">
                  Confirmation reminder SMS
                  <span className="text-xs text-muted-foreground ml-2">
                    (sent when confirmation window opens)
                  </span>
                </Label>
                <Textarea
                  id="smsConfirmationReminder"
                  value={texts.smsConfirmationReminder}
                  onChange={(e) => updateText('smsConfirmationReminder', e.target.value)}
                  rows={3}
                  className={isFieldChanged('smsConfirmationReminder') ? 'border-amber-400 border-2' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  {texts.smsConfirmationReminder.length} characters
                  {isFieldChanged('smsConfirmationReminder') && (
                    <span className="text-amber-600 ml-2">(modified)</span>
                  )}
                </p>
              </div>

              {/* SMS Round Starting Soon */}
              <div className="space-y-2">
                <Label htmlFor="smsRoundStartingSoon">
                  Round starting soon SMS
                  <span className="text-xs text-muted-foreground ml-2">
                    (sent X minutes before round start)
                  </span>
                </Label>
                <Textarea
                  id="smsRoundStartingSoon"
                  value={texts.smsRoundStartingSoon}
                  onChange={(e) => updateText('smsRoundStartingSoon', e.target.value)}
                  rows={3}
                  className={isFieldChanged('smsRoundStartingSoon') ? 'border-amber-400 border-2' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  {texts.smsRoundStartingSoon.length} characters
                  {isFieldChanged('smsRoundStartingSoon') && (
                    <span className="text-amber-600 ml-2">(modified)</span>
                  )}
                </p>
              </div>

            </CardContent>
          </Card>

          {/* Email Templates Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle>Email templates</CardTitle>
                  <CardDescription>Email notifications sent to participants</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Email Welcome */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium">Welcome email</h4>
                <div className="space-y-2">
                  <Label htmlFor="emailWelcomeSubject">Subject line</Label>
                  <Textarea
                    id="emailWelcomeSubject"
                    value={texts.emailWelcomeSubject}
                    onChange={(e) => updateText('emailWelcomeSubject', e.target.value)}
                    rows={1}
                    className={isFieldChanged('emailWelcomeSubject') ? 'border-amber-400 border-2' : ''}
                  />
                  {isFieldChanged('emailWelcomeSubject') && (
                    <p className="text-xs text-amber-600">(modified)</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailWelcomeBody">Email body</Label>
                  <Textarea
                    id="emailWelcomeBody"
                    value={texts.emailWelcomeBody}
                    onChange={(e) => updateText('emailWelcomeBody', e.target.value)}
                    rows={20}
                    className={`font-mono text-sm ${isFieldChanged('emailWelcomeBody') ? 'border-amber-400 border-2' : ''}`}
                  />
                  {isFieldChanged('emailWelcomeBody') && (
                    <p className="text-xs text-amber-600">(modified)</p>
                  )}
                </div>
              </div>

              {/* Email Confirmation Reminder */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium">Confirmation reminder email</h4>
                <div className="space-y-2">
                  <Label htmlFor="emailConfirmationReminderSubject">Subject line</Label>
                  <Textarea
                    id="emailConfirmationReminderSubject"
                    value={texts.emailConfirmationReminderSubject}
                    onChange={(e) => updateText('emailConfirmationReminderSubject', e.target.value)}
                    rows={1}
                    className={isFieldChanged('emailConfirmationReminderSubject') ? 'border-amber-400 border-2' : ''}
                  />
                  {isFieldChanged('emailConfirmationReminderSubject') && (
                    <p className="text-xs text-amber-600">(modified)</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailConfirmationReminderBody">Email body</Label>
                  <Textarea
                    id="emailConfirmationReminderBody"
                    value={texts.emailConfirmationReminderBody}
                    onChange={(e) => updateText('emailConfirmationReminderBody', e.target.value)}
                    rows={8}
                    className={`font-mono text-sm ${isFieldChanged('emailConfirmationReminderBody') ? 'border-amber-400 border-2' : ''}`}
                  />
                  {isFieldChanged('emailConfirmationReminderBody') && (
                    <p className="text-xs text-amber-600">(modified)</p>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Preview Note */}
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="text-purple-500 flex-shrink-0">
                  👁️
                </div>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-purple-900">Template preview:</p>
                  <p className="text-purple-800">
                    Variables like {'{name}'} and {'{sessionName}'} will be automatically replaced with actual values when notifications are sent. 
                    Keep SMS messages concise (under 160 characters recommended) to avoid splitting into multiple messages.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}