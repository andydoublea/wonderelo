import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { MessageCircle, Plus, Edit2, Trash2, Check, X, ArrowLeft } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/info';
import { errorLog } from '../utils/debug';

interface AdminIceBreakersProps {
  accessToken: string;
  onBack: () => void;
}

export function AdminIceBreakers({ accessToken, onBack }: AdminIceBreakersProps) {
  const [iceBreakers, setIceBreakers] = useState<string[]>([]);
  const [newIceBreaker, setNewIceBreaker] = useState('');
  const [editingIceBreakerIndex, setEditingIceBreakerIndex] = useState<number | null>(null);
  const [editingIceBreakerText, setEditingIceBreakerText] = useState('');

  const fetchIceBreakers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/ice-breakers`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setIceBreakers(result.iceBreakers || []);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to fetch ice breakers');
      }
    } catch (error) {
      errorLog('Error fetching ice breakers:', error);
      toast.error('Network error while fetching ice breakers');
    }
  };

  const handleAddIceBreaker = async () => {
    if (!newIceBreaker.trim()) {
      toast.error('Please enter an ice breaker question');
      return;
    }

    try {
      const updatedIceBreakers = [...iceBreakers, newIceBreaker.trim()];
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/ice-breakers`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ iceBreakers: updatedIceBreakers }),
        }
      );

      if (response.ok) {
        setIceBreakers(updatedIceBreakers);
        setNewIceBreaker('');
        toast.success('Ice breaker added successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add ice breaker');
      }
    } catch (error) {
      errorLog('Error adding ice breaker:', error);
      toast.error('Network error while adding ice breaker');
    }
  };

  const handleUpdateIceBreaker = async (index: number) => {
    if (!editingIceBreakerText.trim()) {
      toast.error('Ice breaker question cannot be empty');
      return;
    }

    try {
      const updatedIceBreakers = [...iceBreakers];
      updatedIceBreakers[index] = editingIceBreakerText.trim();
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/ice-breakers`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ iceBreakers: updatedIceBreakers }),
        }
      );

      if (response.ok) {
        setIceBreakers(updatedIceBreakers);
        setEditingIceBreakerIndex(null);
        setEditingIceBreakerText('');
        toast.success('Ice breaker updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update ice breaker');
      }
    } catch (error) {
      errorLog('Error updating ice breaker:', error);
      toast.error('Network error while updating ice breaker');
    }
  };

  const handleDeleteIceBreaker = async (index: number) => {
    try {
      const updatedIceBreakers = iceBreakers.filter((_, i) => i !== index);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ce05600a/admin/ice-breakers`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ iceBreakers: updatedIceBreakers }),
        }
      );

      if (response.ok) {
        setIceBreakers(updatedIceBreakers);
        toast.success('Ice breaker deleted successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete ice breaker');
      }
    } catch (error) {
      errorLog('Error deleting ice breaker:', error);
      toast.error('Network error while deleting ice breaker');
    }
  };

  useEffect(() => {
    fetchIceBreakers();
  }, []);

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
                  disabled={!newIceBreaker.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              {/* List of ice breakers */}
              {iceBreakers.length > 0 ? (
                <div className="space-y-2">
                  {iceBreakers.map((iceBreaker, index) => (
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