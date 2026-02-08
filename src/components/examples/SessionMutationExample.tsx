import { useState } from 'react';
import { useCreateSession, useUpdateSession, useDeleteSession } from '../../hooks/useQueryHooks';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';

/**
 * Example component demonstrating React Query mutations
 * 
 * This shows how to use mutation hooks for:
 * - Creating sessions (with optimistic updates)
 * - Updating sessions (with automatic cache invalidation)
 * - Deleting sessions (with rollback on error)
 * 
 * Benefits over manual API calls:
 * - Automatic loading states
 * - Built-in error handling
 * - Optimistic updates
 * - Automatic cache invalidation
 * - Toast notifications
 * - Request deduplication
 */

interface SessionMutationExampleProps {
  initialSessionId?: string;
  onSuccess?: () => void;
}

export function SessionMutationExample({ 
  initialSessionId,
  onSuccess 
}: SessionMutationExampleProps) {
  const [sessionName, setSessionName] = useState('');
  const [sessionId, setSessionId] = useState(initialSessionId);

  // Mutation hooks
  const createMutation = useCreateSession({
    onSuccess: (data) => {
      setSessionId(data.id);
      setSessionName('');
      onSuccess?.();
    }
  });

  const updateMutation = useUpdateSession({
    onSuccess: () => {
      onSuccess?.();
    }
  });

  const deleteMutation = useDeleteSession({
    onSuccess: () => {
      setSessionId(undefined);
      setSessionName('');
      onSuccess?.();
    }
  });

  const handleCreate = () => {
    if (!sessionName.trim()) return;

    createMutation.mutate({
      name: sessionName,
      status: 'draft',
      rounds: []
    });
  };

  const handleUpdate = () => {
    if (!sessionId || !sessionName.trim()) return;

    updateMutation.mutate({
      sessionId,
      data: { name: sessionName }
    });
  };

  const handleDelete = () => {
    if (!sessionId) return;

    if (confirm('Are you sure you want to delete this session?')) {
      deleteMutation.mutate(sessionId);
    }
  };

  const isLoading = createMutation.isLoading || 
                     updateMutation.isLoading || 
                     deleteMutation.isLoading;

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <div>
        <h3 className="mb-2">React Query mutation example</h3>
        <p className="text-sm text-muted-foreground">
          Demonstrates automatic loading states, error handling, and cache updates
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Enter session name..."
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          disabled={isLoading}
        />

        {!sessionId ? (
          <Button
            onClick={handleCreate}
            disabled={!sessionName.trim() || isLoading}
          >
            {createMutation.isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create
              </>
            )}
          </Button>
        ) : (
          <>
            <Button
              onClick={handleUpdate}
              disabled={!sessionName.trim() || isLoading}
              variant="default"
            >
              {updateMutation.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update
                </>
              )}
            </Button>

            <Button
              onClick={handleDelete}
              disabled={isLoading}
              variant="destructive"
            >
              {deleteMutation.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Error display */}
      {createMutation.isError && (
        <div className="text-sm text-destructive">
          Create error: {createMutation.error?.message}
        </div>
      )}
      {updateMutation.isError && (
        <div className="text-sm text-destructive">
          Update error: {updateMutation.error?.message}
        </div>
      )}
      {deleteMutation.isError && (
        <div className="text-sm text-destructive">
          Delete error: {deleteMutation.error?.message}
        </div>
      )}

      {/* Success state */}
      {sessionId && !isLoading && (
        <div className="text-sm text-muted-foreground">
          Session ID: {sessionId}
        </div>
      )}
    </div>
  );
}
