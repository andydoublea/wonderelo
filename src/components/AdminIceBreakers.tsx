import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { MessageCircle, Plus, Edit2, Trash2, Check, X, ArrowLeft, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { toast } from 'sonner@2.0.3';
import { errorLog } from '../utils/debug';
import { useIceBreakers, useSaveIceBreakers } from '../hooks/useAdminQueries';

interface AdminIceBreakersProps {
  accessToken: string;
  onBack: () => void;
}

export function AdminIceBreakers({ accessToken, onBack }: AdminIceBreakersProps) {
  const [newIceBreaker, setNewIceBreaker] = useState('');
  const [editingIceBreakerIndex, setEditingIceBreakerIndex] = useState<number | null>(null);
  const [editingIceBreakerText, setEditingIceBreakerText] = useState('');

  // React Query hooks
  const { data: iceBreakers = [], isLoading: isFetching, isFetching: isRefetching } = useIceBreakers(accessToken);
  const saveMutation = useSaveIceBreakers(accessToken);

  const handleAddIceBreaker = async () => {
    if (!newIceBreaker.trim()) {
      toast.error('Please enter an ice breaker question');
      return;
    }

    const updatedIceBreakers = [...iceBreakers, newIceBreaker.trim()];
    saveMutation.mutate(updatedIceBreakers, {
      onSuccess: () => {
        setNewIceBreaker('');
        toast.success('Ice breaker added successfully');
      },
    });
  };

  const handleUpdateIceBreaker = async (index: number) => {
    if (!editingIceBreakerText.trim()) {
      toast.error('Ice breaker question cannot be empty');
      return;
    }

    const updatedIceBreakers = [...iceBreakers];
    updatedIceBreakers[index] = editingIceBreakerText.trim();

    saveMutation.mutate(updatedIceBreakers, {
      onSuccess: () => {
        setEditingIceBreakerIndex(null);
        setEditingIceBreakerText('');
        toast.success('Ice breaker updated successfully');
      },
    });
  };

  const handleDeleteIceBreaker = async (index: number) => {
    const updatedIceBreakers = iceBreakers.filter((_: string, i: number) => i !== index);
    saveMutation.mutate(updatedIceBreakers, {
      onSuccess: () => {
        toast.success('Ice breaker deleted successfully');
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Ice breaker questions
                  {(isFetching || isRefetching) && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </CardTitle>
                <CardDescription>
                  Manage the pool of ice breaker questions available to event organizers
                </CardDescription>
              </div>
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to admin
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Add new ice breaker */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a new ice breaker question..."
                  value={newIceBreaker}
                  onChange={(e) => setNewIceBreaker(e.target.value)}
                  className="flex-1"
                  maxLength={60}
                />
                <Button
                  onClick={handleAddIceBreaker}
                  className="shrink-0"
                  disabled={!newIceBreaker.trim() || saveMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              {/* List of ice breakers */}
              {iceBreakers.length > 0 ? (
                <div className="space-y-2">
                  {iceBreakers.map((iceBreaker: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                      {editingIceBreakerIndex === index ? (
                        <>
                          <Input
                            value={editingIceBreakerText}
                            onChange={(e) => setEditingIceBreakerText(e.target.value)}
                            className="flex-1"
                            maxLength={60}
                            autoFocus
                          />
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateIceBreaker(index)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              disabled={saveMutation.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingIceBreakerIndex(null);
                                setEditingIceBreakerText('');
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="flex-1">{iceBreaker}</p>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingIceBreakerIndex(index);
                                setEditingIceBreakerText(iceBreaker);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete ice breaker</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this ice breaker question? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteIceBreaker(index)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No ice breaker questions yet. Add your first one above.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
