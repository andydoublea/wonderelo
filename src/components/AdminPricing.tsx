import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Save, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Badge } from './ui/badge';
import { PRICING_TIERS, type CapacityTier } from '../config/pricing';
import { toast } from 'sonner@2.0.3';

interface TierFormData {
  capacity: string;
  singleEventPrice: string;
  premiumMonthlyPrice: string;
  premiumAnnualPrice: string;
}

export function AdminPricing() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [freeCapacity, setFreeCapacity] = useState(
    PRICING_TIERS.free.capacity.toString()
  );

  // Initialize form data from current config (display in dollars)
  const [formData, setFormData] = useState<Record<string, TierFormData>>(() => {
    const data: Record<string, TierFormData> = {};
    const tiers: CapacityTier[] = ['50', '200', '500', '1000', '5000'];
    for (const tier of tiers) {
      const config = PRICING_TIERS[tier];
      data[tier] = {
        capacity: config.capacity.toString(),
        singleEventPrice: (config.singleEventPrice / 100).toString(),
        premiumMonthlyPrice: (config.premiumMonthlyPrice / 100).toString(),
        premiumAnnualPrice: (config.premiumAnnualPrice / 100).toString(),
      };
    }
    return data;
  });

  const updateTier = (tier: string, field: keyof TierFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [tier]: { ...prev[tier], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    // TODO: Save to backend/database when dynamic pricing is implemented
    setTimeout(() => {
      setSaving(false);
      toast.info('Pricing changes are not yet persisted. Edit src/config/pricing.ts directly for now.');
    }, 500);
  };

  const tierKeys: CapacityTier[] = ['50', '200', '500', '1000', '5000'];

  return (
    <div className="min-h-screen" style={{ background: '#fafafa' }}>
      {/* Header */}
      <div className="border-b" style={{ background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="container mx-auto" style={{ padding: '12px 24px' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold" style={{ letterSpacing: '-0.01em' }}>Pricing</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Admin
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto" style={{ padding: '24px', maxWidth: '900px' }}>
        {/* Free tier */}
        <Card style={{ marginBottom: '16px' }}>
          <CardContent style={{ padding: '16px 20px' }}>
            <div className="flex items-center gap-4 flex-wrap">
              <Badge variant="outline">Free</Badge>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Up to</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={freeCapacity}
                  onChange={(e) => setFreeCapacity(e.target.value)}
                  style={{ width: '70px' }}
                />
                <span className="text-sm text-muted-foreground">participants</span>
              </div>
              <span className="text-sm text-muted-foreground ml-auto">$0</span>
            </div>
          </CardContent>
        </Card>

        {/* Paid tiers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tierKeys.map((key) => {
            const tierData = formData[key];
            if (!tierData) return null;

            return (
              <Card key={key}>
                <CardHeader style={{ paddingBottom: '8px' }}>
                  <CardTitle className="text-base flex items-center gap-3">
                    <Badge>{key}</Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-normal text-muted-foreground">Up to</span>
                      <Input
                        type="number"
                        min="1"
                        max="100000"
                        value={tierData.capacity}
                        onChange={(e) => updateTier(key, 'capacity', e.target.value)}
                        style={{ width: '90px' }}
                      />
                      <span className="text-sm font-normal text-muted-foreground">participants</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Single event</Label>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={tierData.singleEventPrice}
                          onChange={(e) => updateTier(key, 'singleEventPrice', e.target.value)}
                          style={{ maxWidth: '120px' }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Monthly subscription</Label>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={tierData.premiumMonthlyPrice}
                          onChange={(e) => updateTier(key, 'premiumMonthlyPrice', e.target.value)}
                          style={{ maxWidth: '120px' }}
                        />
                        <span className="text-xs text-muted-foreground">/mo</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Annual subscription</Label>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={tierData.premiumAnnualPrice}
                          onChange={(e) => updateTier(key, 'premiumAnnualPrice', e.target.value)}
                          style={{ maxWidth: '120px' }}
                        />
                        <span className="text-xs text-muted-foreground">/yr</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save pricing'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground" style={{ marginTop: '12px', textAlign: 'right' }}>
          Note: Dynamic pricing persistence coming soon. Currently reads from static config.
        </p>
      </div>
    </div>
  );
}
