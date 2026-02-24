import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { QrCode, CheckCircle2, AlertTriangle, Loader2, UserX } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { errorLog } from '../utils/debug';

interface Match {
  id: string;
  roundId: string;
  sessionId: string;
  participantIds: string[];
  meetingPointId: string;
  identificationImageUrl: string;
  status: string;
  checkIns: any[];
  createdAt: string;
}

interface QRScannerProps {
  roundId: string;
  participantId: string;
  match: Match;
  onCheckInComplete: () => void;
  onReportNoShow: () => void;
}

export function QRScanner({
  roundId,
  participantId,
  match,
  onCheckInComplete,
  onReportNoShow
}: QRScannerProps) {
  const [scannedCode, setScannedCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleScan = async () => {
    if (!scannedCode.trim()) {
      toast.error('Please enter a participant code');
      return;
    }

    setIsScanning(true);
    setCheckInStatus('idle');

    try {
      const { apiBaseUrl, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(
        `${apiBaseUrl}/rounds/${roundId}/check-in`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            participantId,
            scannedParticipantId: scannedCode.trim()
          })
        }
      );

      if (response.ok) {
        setCheckInStatus('success');
        toast.success('Successfully checked in!');
        setTimeout(() => {
          onCheckInComplete();
        }, 2000);
      } else {
        const error = await response.json();
        setCheckInStatus('error');
        toast.error(error.error || 'Check-in failed');
      }
    } catch (error) {
      errorLog('Error during check-in:', error);
      setCheckInStatus('error');
      toast.error('Error during check-in');
    } finally {
      setIsScanning(false);
    }
  };

  const myQRCode = participantId; // In production, this would be a QR code image

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <QrCode className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Check-in at meeting point</CardTitle>
          <CardDescription>
            Scan your partner's QR code to confirm
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Identification image reminder */}
          <div className="space-y-2">
            <p className="text-sm text-center text-muted-foreground">
              Your group's identification image
            </p>
            <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-border max-w-[200px] mx-auto">
              <ImageWithFallback
                src={match.identificationImageUrl}
                alt="Group identification"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* My QR Code */}
          <div className="space-y-2 p-4 rounded-lg bg-muted/50 border">
            <p className="text-sm text-center text-muted-foreground">
              Show this code to your partner
            </p>
            <div className="bg-white p-4 rounded-lg mx-auto w-fit">
              <div className="text-center space-y-2">
                <QrCode className="h-24 w-24 mx-auto text-foreground" />
                <p className="text-xs font-mono break-all">{myQRCode}</p>
              </div>
            </div>
          </div>

          {/* Scan partner's code */}
          <div className="space-y-3">
            <Label htmlFor="qr-input">Scan your partner's code</Label>
            <div className="flex gap-2">
              <Input
                id="qr-input"
                placeholder="Enter participant code"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                disabled={isScanning || checkInStatus === 'success'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleScan();
                  }
                }}
              />
              <Button
                onClick={handleScan}
                disabled={isScanning || checkInStatus === 'success' || !scannedCode.trim()}
              >
                {isScanning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Status message */}
          {checkInStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">Check-in successful! Enjoy your networking round.</p>
            </div>
          )}

          {checkInStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">Check-in failed. Please try again or verify the code.</p>
            </div>
          )}

          {/* Check-in info */}
          <div className="space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm">Check-ins completed</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(match.checkIns.length / match.participantIds.length) * 100}%` }}
                />
              </div>
              <p className="text-sm tabular-nums">
                {match.checkIns.length} / {match.participantIds.length}
              </p>
            </div>
          </div>

          {/* Report no-show */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={onReportNoShow}
              className="w-full"
            >
              <UserX className="mr-2 h-4 w-4" />
              Partner didn't show up
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              We'll find you a new group
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}