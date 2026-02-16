import React, { useState } from 'react';
import { Gift, Plus, Trash2, ToggleLeft, ToggleRight, Eye, Calendar, Percent, DollarSign, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useGiftCards, useCreateGiftCard, useToggleGiftCard, useDeleteGiftCard } from '../hooks/useAdminQueries';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface GiftCard {
  id: string;
  code: string;
  discountType: 'absolute' | 'percentage';
  discountValue: number;
  applicableTo: 'yearly_subscription' | 'monthly_subscription' | 'single_event';
  validFrom: string;
  validUntil: string;
  maxUses?: number;
  usedCount: number;
  usedBy: Array<{
    organizerId: string;
    organizerEmail: string;
    usedAt: string;
  }>;
  createdAt: string;
  createdBy: string;
  isActive: boolean;
}

interface AdminGiftCardsProps {
  accessToken: string;
}

export function AdminGiftCards({ accessToken }: AdminGiftCardsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'absolute' as 'absolute' | 'percentage',
    discountValue: '',
    applicableTo: 'single_event' as 'yearly_subscription' | 'monthly_subscription' | 'single_event',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    maxUses: '',
  });

  // React Query hooks
  const { data: giftCards = [], isLoading: isFetching, isFetching: isRefetching } = useGiftCards(accessToken);
  const createMutation = useCreateGiftCard(accessToken);
  const toggleMutation = useToggleGiftCard(accessToken);
  const deleteMutation = useDeleteGiftCard(accessToken);

  const isLoading = createMutation.isPending || toggleMutation.isPending || deleteMutation.isPending;

  const createGiftCard = async () => {
    if (!formData.code.trim()) {
      toast.error('Please enter a gift card code');
      return;
    }

    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
      toast.error('Please enter a valid discount value');
      return;
    }

    if (!formData.validUntil) {
      toast.error('Please set expiration date');
      return;
    }

    createMutation.mutate(
      {
        code: formData.code.toUpperCase().trim(),
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        applicableTo: formData.applicableTo,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
      },
      {
        onSuccess: () => {
          setShowCreateDialog(false);
          resetForm();
        },
      }
    );
  };

  const toggleGiftCard = async (code: string, _currentStatus: boolean) => {
    toggleMutation.mutate({ code });
  };

  const deleteGiftCard = async (code: string) => {
    if (!confirm(`Are you sure you want to delete gift card "${code}"?`)) {
      return;
    }
    deleteMutation.mutate(code);
  };

  const viewDetails = (card: GiftCard) => {
    setSelectedCard(card);
    setShowDetailDialog(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'absolute',
      discountValue: '',
      applicableTo: 'single_event',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '',
      maxUses: '',
    });
  };

  const formatDiscountType = (type: string) => {
    return type === 'absolute' ? 'Fixed amount' : 'Percentage';
  };

  const formatApplicableTo = (type: string) => {
    switch (type) {
      case 'yearly_subscription':
        return 'Yearly subscription';
      case 'monthly_subscription':
        return 'Monthly subscription';
      case 'single_event':
        return 'Single event';
      default:
        return type;
    }
  };

  const formatDiscountValue = (card: GiftCard) => {
    if (card.discountType === 'absolute') {
      return `€${card.discountValue}`;
    }
    return `${card.discountValue}%`;
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const isNotYetValid = (validFrom: string) => {
    return new Date(validFrom) > new Date();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="mb-2">Gift cards management</h2>
                {(isFetching || isRefetching) && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <p className="text-muted-foreground">
                Create and manage promotional gift cards for organizers
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create gift card
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total cards</p>
                    <p className="text-2xl font-bold">{giftCards.length}</p>
                  </div>
                  <Gift className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active cards</p>
                    <p className="text-2xl font-bold text-green-600">
                      {giftCards.filter(c => c.isActive && !isExpired(c.validUntil)).length}
                    </p>
                  </div>
                  <ToggleRight className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total uses</p>
                    <p className="text-2xl font-bold">
                      {giftCards.reduce((sum, card) => sum + card.usedCount, 0)}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Expired</p>
                    <p className="text-2xl font-bold text-red-600">
                      {giftCards.filter(c => isExpired(c.validUntil)).length}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gift Cards Table */}
          <Card>
            <CardHeader>
              <CardTitle>Gift cards</CardTitle>
              <CardDescription>
                Manage all promotional codes and track their usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && giftCards.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : giftCards.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No gift cards yet. Create your first one!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Applicable to</TableHead>
                      <TableHead>Valid period</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {giftCards.map((card) => (
                      <TableRow key={card.id}>
                        <TableCell className="font-mono font-semibold">
                          {card.code}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {card.discountType === 'absolute' ? (
                              <DollarSign className="w-4 h-4 text-green-600" />
                            ) : (
                              <Percent className="w-4 h-4 text-blue-600" />
                            )}
                            <span>{formatDiscountValue(card)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatApplicableTo(card.applicableTo)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{new Date(card.validFrom).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">
                            to {new Date(card.validUntil).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{card.usedCount}</span>
                            {card.maxUses && (
                              <span className="text-muted-foreground">/ {card.maxUses}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isExpired(card.validUntil) ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : isNotYetValid(card.validFrom) ? (
                            <Badge variant="secondary">Not yet valid</Badge>
                          ) : card.isActive ? (
                            <Badge className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewDetails(card)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleGiftCard(card.code, card.isActive)}
                              disabled={isLoading}
                            >
                              {card.isActive ? (
                                <ToggleRight className="w-4 h-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-gray-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteGiftCard(card.code)}
                              disabled={isLoading}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create new gift card</DialogTitle>
            <DialogDescription>
              Create a promotional code for organizers to use when purchasing subscriptions or events
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="code">Gift card code</Label>
              <Input
                id="code"
                placeholder="e.g., SUMMER2024"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This code will be shared with organizers
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discountType">Discount type</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value: 'absolute' | 'percentage') =>
                    setFormData({ ...formData, discountType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="absolute">Fixed amount (€)</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="discountValue">
                  {formData.discountType === 'absolute' ? 'Amount (€)' : 'Percentage (%)'}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  min="0"
                  step={formData.discountType === 'absolute' ? '0.01' : '1'}
                  max={formData.discountType === 'percentage' ? '100' : undefined}
                  placeholder={formData.discountType === 'absolute' ? '10.00' : '20'}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="applicableTo">Applicable to</Label>
              <Select
                value={formData.applicableTo}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, applicableTo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_event">Single event payment</SelectItem>
                  <SelectItem value="monthly_subscription">Monthly subscription</SelectItem>
                  <SelectItem value="yearly_subscription">Yearly subscription</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="validFrom">Valid from</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="validUntil">Valid until</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="maxUses">Maximum uses (optional)</Label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for unlimited uses
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createGiftCard} disabled={isLoading}>
              Create gift card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gift card details: {selectedCard?.code}</DialogTitle>
            <DialogDescription>
              View usage statistics and organizers who used this gift card
            </DialogDescription>
          </DialogHeader>

          {selectedCard && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Discount</Label>
                  <p className="text-lg font-semibold">{formatDiscountValue(selectedCard)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="text-lg">{formatDiscountType(selectedCard.discountType)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Applicable to</Label>
                  <p className="text-lg">{formatApplicableTo(selectedCard.applicableTo)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total uses</Label>
                  <p className="text-lg font-semibold">
                    {selectedCard.usedCount}
                    {selectedCard.maxUses && ` / ${selectedCard.maxUses}`}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Valid period</Label>
                <p className="text-lg">
                  {new Date(selectedCard.validFrom).toLocaleDateString()} - {new Date(selectedCard.validUntil).toLocaleDateString()}
                </p>
              </div>

              {selectedCard.usedBy && selectedCard.usedBy.length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Used by organizers</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Organizer email</TableHead>
                          <TableHead>Used at</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCard.usedBy.map((usage, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{usage.organizerEmail}</TableCell>
                            <TableCell>
                              {new Date(usage.usedAt).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {(!selectedCard.usedBy || selectedCard.usedBy.length === 0) && (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  This gift card hasn't been used yet
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
