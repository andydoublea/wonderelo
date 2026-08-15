import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Download, Loader2, Image as ImageIcon, FileText, StickyNote, Printer } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { debugLog, errorLog } from '../utils/debug';

interface DownloadableAssetsProps {
  eventSlug: string;
  eventName?: string;
  eventPageUrl: string;
}

type AssetKind = 'rollup' | 'promo' | 'stickers';
type OutputMode = 'download' | 'print';

export function DownloadableAssets({ eventSlug, eventName, eventPageUrl }: DownloadableAssetsProps) {
  // Which asset is currently rendering — blocks its buttons and shows a spinner.
  const [busy, setBusy] = useState<AssetKind | null>(null);

  // Render a real, scannable QR of the event URL to an <img> we can drawImage
  // onto the asset canvases. Mirrors EventPromoPage's usage of the same `qrcode`
  // lib (dynamic import, toDataURL, black-on-white) so the printed QR matches
  // the live promo slide's QR exactly.
  const loadQrImage = async (url: string): Promise<HTMLImageElement> => {
    const QRCode = (await import('qrcode')).default;
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('QR image failed to load'));
      img.src = qrDataUrl;
    });
    return img;
  };

  const buildRollupCanvas = async (): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    // Rollup banner proportions (85cm x 205cm at 72 DPI = ~2410 x 5811 px)
    // Scale down for practical download: 850 x 2050 px
    canvas.width = 850;
    canvas.height = 2050;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Primary color bar at top
    ctx.fillStyle = '#7c3aed'; // primary purple
    ctx.fillRect(0, 0, canvas.width, 120);

    // Wonderelo logo text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Wonderelo', canvas.width / 2, 80);

    // Main headline
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const headline = 'Meet Someone New';
    ctx.fillText(headline, canvas.width / 2, 300);

    // Subheadline
    ctx.font = '36px system-ui, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Scan the QR code below', canvas.width / 2, 380);
    ctx.fillText('to join the networking round', canvas.width / 2, 430);

    // QR code — real, scannable QR of the event URL (drawn onto the canvas).
    // The QR image already carries a white quiet-zone (margin) so it scans
    // cleanly against the white banner background.
    const qrSize = 400;
    const qrX = (canvas.width - qrSize) / 2;
    const qrY = 520;
    const qrImg = await loadQrImage(eventPageUrl);
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // Event URL
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText(eventPageUrl, canvas.width / 2, qrY + qrSize + 80);

    // Event name
    if (eventName) {
      ctx.fillStyle = '#1a1a2e';
      ctx.font = 'bold 40px system-ui, sans-serif';
      ctx.fillText(eventName, canvas.width / 2, qrY + qrSize + 160);
    }

    // Instructions section
    const instructionsY = 1300;
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(40, instructionsY, canvas.width - 80, 400);

    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 32px system-ui, sans-serif';
    ctx.fillText('How it works', canvas.width / 2, instructionsY + 50);

    ctx.font = '24px system-ui, sans-serif';
    ctx.fillStyle = '#4b5563';
    ctx.textAlign = 'left';
    const steps = [
      '1. Scan the QR code with your phone',
      '2. Enter your name and email',
      '3. Get matched with someone new',
      '4. Meet at your meeting point',
      '5. Have a great conversation!',
    ];
    steps.forEach((step, i) => {
      ctx.fillText(step, 80, instructionsY + 100 + i * 50);
    });

    // Bottom bar
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('wonderelo.com', canvas.width / 2, canvas.height - 30);

    return canvas;
  };

  const buildPromoCanvas = async (): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    // 16:9 promo slide
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative circles
    ctx.fillStyle = 'rgba(124, 58, 237, 0.15)';
    ctx.beginPath();
    ctx.arc(200, 200, 300, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(1700, 800, 250, 0, Math.PI * 2);
    ctx.fill();

    // Wonderelo logo
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Wonderelo', 80, 80);

    // Main text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Networking Round', canvas.width / 2, 350);

    ctx.font = '48px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('Scan the QR code to join', canvas.width / 2, 440);

    // QR code — real, scannable QR of the event URL. The slide background is
    // dark, so paint a white quiet-zone panel behind the QR to guarantee the
    // contrast a scanner needs.
    const qrSize = 300;
    const qrX = (canvas.width - qrSize) / 2;
    const qrY = 500;
    const qrImg = await loadQrImage(eventPageUrl);
    const qrPad = 16;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX - qrPad, qrY - qrPad, qrSize + qrPad * 2, qrSize + qrPad * 2);
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // Event URL
    ctx.fillStyle = '#a78bfa';
    ctx.font = 'bold 32px system-ui, sans-serif';
    ctx.fillText(eventPageUrl, canvas.width / 2, qrY + qrSize + 60);

    // Bottom text
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText('Meet someone new • Takes 30 seconds to register', canvas.width / 2, canvas.height - 60);

    return canvas;
  };

  const buildStickersCanvas = async (): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    // A4 landscape with 6 stickers (2 rows x 3 columns)
    canvas.width = 2480; // ~A4 at 300 DPI
    canvas.height = 1754;
    const ctx = canvas.getContext('2d')!;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const stickerSize = 500;
    const gap = 80;
    const startX = (canvas.width - (3 * stickerSize + 2 * gap)) / 2;
    const startY = (canvas.height - (2 * stickerSize + gap)) / 2;

    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const x = startX + col * (stickerSize + gap);
        const y = startY + row * (stickerSize + gap);
        const label = labels[row * 3 + col];

        // Circular sticker outline (for cutting)
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(x + stickerSize / 2, y + stickerSize / 2, stickerSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Colored fill
        ctx.fillStyle = '#7c3aed';
        ctx.beginPath();
        ctx.arc(x + stickerSize / 2, y + stickerSize / 2, stickerSize / 2 - 10, 0, Math.PI * 2);
        ctx.fill();

        // White inner ring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x + stickerSize / 2, y + stickerSize / 2, stickerSize / 2 - 30, 0, Math.PI * 2);
        ctx.stroke();

        // Label letter
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 200px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + stickerSize / 2, y + stickerSize / 2 - 20);

        // "Meeting Point" text
        ctx.font = '28px system-ui, sans-serif';
        ctx.fillText('Meeting Point', x + stickerSize / 2, y + stickerSize / 2 + 100);
      }
    }

    // Title
    ctx.fillStyle = '#6b7280';
    ctx.font = '24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Wonderelo Floor Stickers — Cut along the dashed lines', canvas.width / 2, 60);

    return canvas;
  };

  // canvas -> PNG -> <a download>
  const downloadCanvas = (canvas: HTMLCanvasElement, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // canvas -> PNG -> print window. Returns false if the browser blocked the
  // pop-up so the caller can skip the success toast.
  const printCanvas = (canvas: HTMLCanvasElement, title: string): boolean => {
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) {
      toast.error('Allow pop-ups to print');
      return false;
    }
    win.document.write(
      '<!doctype html><html><head>' +
      `<title>${title}</title>` +
      '<style>@page{margin:0}html,body{margin:0;padding:0}' +
      'img{display:block;width:100%;height:auto}</style>' +
      '</head><body>' +
      `<img src="${dataUrl}" alt="${title}" onload="window.focus();window.print();" />` +
      '</body></html>'
    );
    win.document.close();
    return true;
  };

  const CONFIG: Record<AssetKind, { build: () => Promise<HTMLCanvasElement>; filename: string; label: string }> = {
    rollup: { build: buildRollupCanvas, filename: `wonderelo-rollup-${eventSlug}.png`, label: 'Rollup banner' },
    promo: { build: buildPromoCanvas, filename: `wonderelo-promo-${eventSlug}.png`, label: 'Promo image' },
    stickers: { build: buildStickersCanvas, filename: `wonderelo-floor-stickers-${eventSlug}.png`, label: 'Floor stickers' },
  };

  const run = async (kind: AssetKind, mode: OutputMode) => {
    setBusy(kind);
    try {
      const { build, filename, label } = CONFIG[kind];
      const canvas = await build();
      if (mode === 'download') {
        downloadCanvas(canvas, filename);
        toast.success(`${label} downloaded`);
      } else if (printCanvas(canvas, filename)) {
        toast.success(`${label} sent to print`);
      }
      debugLog(`[Assets] ${label} ${mode}`);
    } catch (err) {
      errorLog(`[Assets] Error generating ${kind}:`, err);
      toast.error(`Failed to generate ${CONFIG[kind].label.toLowerCase()}`);
    } finally {
      setBusy(null);
    }
  };

  const renderActions = (kind: AssetKind) => (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => run(kind, 'download')}
        disabled={busy !== null}
        className="flex-1"
      >
        {busy === kind ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        Download PNG
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => run(kind, 'print')}
        disabled={busy !== null}
        aria-label="Print"
        title="Print"
      >
        {busy === kind ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Printer className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Downloadable Assets</CardTitle>
        <CardDescription>
          Download or print ready-made materials to promote your networking event
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rollup Banner */}
          <Card className="border-dashed">
            <CardContent className="p-5 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Rollup Banner</h3>
              <p className="text-xs text-muted-foreground mb-4">
                85×205 cm banner template with a scannable QR code and event info
              </p>
              {renderActions('rollup')}
            </CardContent>
          </Card>

          {/* Promo Slide */}
          <Card className="border-dashed">
            <CardContent className="p-5 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Promo Slide</h3>
              <p className="text-xs text-muted-foreground mb-4">
                16:9 slide for TVs and presentations with a scannable QR code
              </p>
              {renderActions('promo')}
            </CardContent>
          </Card>

          {/* Floor Stickers */}
          <Card className="border-dashed">
            <CardContent className="p-5 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <StickyNote className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Floor Stickers</h3>
              <p className="text-xs text-muted-foreground mb-4">
                A-F meeting point stickers with cut lines for printing
              </p>
              {renderActions('stickers')}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
