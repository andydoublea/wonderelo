import { useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

/**
 * Custom hook for confirmation dialogs
 * Prevents duplication of dialog patterns across components
 */

export interface ConfirmDialogOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  isOpen: boolean;
  onConfirm?: () => void | Promise<void>;
}

/**
 * Hook for showing confirmation dialogs
 * 
 * @example
 * ```tsx
 * const { confirm, ConfirmDialog } = useConfirmDialog();
 * 
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete item',
 *     description: 'Are you sure? This cannot be undone.',
 *     confirmText: 'Delete',
 *     variant: 'destructive'
 *   });
 *   
 *   if (confirmed) {
 *     await deleteItem();
 *   }
 * };
 * 
 * return (
 *   <>
 *     <Button onClick={handleDelete}>Delete</Button>
 *     <ConfirmDialog />
 *   </>
 * );
 * ```
 */
export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: 'Are you sure?',
    description: 'This action cannot be undone.',
    confirmText: 'Continue',
    cancelText: 'Cancel',
    variant: 'default'
  });

  /**
   * Show confirmation dialog and return a promise that resolves to true/false
   */
  const confirm = useCallback(
    (options: ConfirmDialogOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setDialogState({
          isOpen: true,
          title: options.title || 'Are you sure?',
          description: options.description || 'This action cannot be undone.',
          confirmText: options.confirmText || 'Continue',
          cancelText: options.cancelText || 'Cancel',
          variant: options.variant || 'default',
          onConfirm: async () => {
            setDialogState(prev => ({ ...prev, isOpen: false }));
            resolve(true);
          }
        });

        // Auto-resolve to false if dialog is closed without confirming
        const handleClose = () => {
          resolve(false);
        };

        // Store the cancel handler
        (window as any).__confirmDialogCancel = handleClose;
      });
    },
    []
  );

  /**
   * Close dialog programmatically
   */
  const closeDialog = useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
    if ((window as any).__confirmDialogCancel) {
      (window as any).__confirmDialogCancel();
      delete (window as any).__confirmDialogCancel;
    }
  }, []);

  /**
   * Dialog component to render
   */
  const ConfirmDialog = useCallback(() => {
    const handleCancel = () => {
      setDialogState(prev => ({ ...prev, isOpen: false }));
      if ((window as any).__confirmDialogCancel) {
        (window as any).__confirmDialogCancel();
        delete (window as any).__confirmDialogCancel;
      }
    };

    const handleConfirm = async () => {
      if (dialogState.onConfirm) {
        await dialogState.onConfirm();
      }
    };

    return (
      <AlertDialog 
        open={dialogState.isOpen} 
        onOpenChange={(open) => {
          if (!open) {
            handleCancel();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogState.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {dialogState.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                dialogState.variant === 'destructive'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {dialogState.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }, [dialogState]);

  return {
    confirm,
    closeDialog,
    ConfirmDialog,
    isOpen: dialogState.isOpen
  };
}

/**
 * Quick confirmation dialogs with predefined configurations
 */
export const ConfirmDialogPresets = {
  delete: (itemName: string = 'this item'): ConfirmDialogOptions => ({
    title: `Delete ${itemName}`,
    description: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'destructive'
  }),

  cancel: (actionName: string = 'this action'): ConfirmDialogOptions => ({
    title: `Cancel ${actionName}`,
    description: `Are you sure you want to cancel ${actionName}? Any unsaved changes will be lost.`,
    confirmText: 'Yes, cancel',
    cancelText: 'No, continue',
    variant: 'destructive'
  }),

  leave: (): ConfirmDialogOptions => ({
    title: 'Leave page',
    description: 'You have unsaved changes. Are you sure you want to leave?',
    confirmText: 'Leave',
    cancelText: 'Stay',
    variant: 'destructive'
  }),

  remove: (itemName: string = 'this item'): ConfirmDialogOptions => ({
    title: `Remove ${itemName}`,
    description: `Are you sure you want to remove ${itemName}?`,
    confirmText: 'Remove',
    cancelText: 'Cancel',
    variant: 'destructive'
  }),

  logout: (): ConfirmDialogOptions => ({
    title: 'Sign out',
    description: 'Are you sure you want to sign out?',
    confirmText: 'Sign out',
    cancelText: 'Cancel',
    variant: 'default'
  }),

  reset: (): ConfirmDialogOptions => ({
    title: 'Reset to defaults',
    description: 'This will reset all settings to their default values. Are you sure?',
    confirmText: 'Reset',
    cancelText: 'Cancel',
    variant: 'destructive'
  }),

  publish: (itemName: string = 'this'): ConfirmDialogOptions => ({
    title: `Publish ${itemName}`,
    description: `Are you sure you want to publish ${itemName}? It will be visible to all users.`,
    confirmText: 'Publish',
    cancelText: 'Cancel',
    variant: 'default'
  }),

  unpublish: (itemName: string = 'this'): ConfirmDialogOptions => ({
    title: `Unpublish ${itemName}`,
    description: `Are you sure you want to unpublish ${itemName}? It will no longer be visible to users.`,
    confirmText: 'Unpublish',
    cancelText: 'Cancel',
    variant: 'default'
  })
};

/**
 * Hook for confirm dialog with preset configurations
 * 
 * @example
 * ```tsx
 * const { confirmDelete, ConfirmDialog } = useConfirmDialogWithPresets();
 * 
 * const handleDelete = async () => {
 *   if (await confirmDelete('session')) {
 *     await deleteSession();
 *   }
 * };
 * ```
 */
export function useConfirmDialogWithPresets() {
  const { confirm, closeDialog, ConfirmDialog, isOpen } = useConfirmDialog();

  return {
    confirm,
    closeDialog,
    ConfirmDialog,
    isOpen,
    confirmDelete: (itemName?: string) => confirm(ConfirmDialogPresets.delete(itemName)),
    confirmCancel: (actionName?: string) => confirm(ConfirmDialogPresets.cancel(actionName)),
    confirmLeave: () => confirm(ConfirmDialogPresets.leave()),
    confirmRemove: (itemName?: string) => confirm(ConfirmDialogPresets.remove(itemName)),
    confirmLogout: () => confirm(ConfirmDialogPresets.logout()),
    confirmReset: () => confirm(ConfirmDialogPresets.reset()),
    confirmPublish: (itemName?: string) => confirm(ConfirmDialogPresets.publish(itemName)),
    confirmUnpublish: (itemName?: string) => confirm(ConfirmDialogPresets.unpublish(itemName))
  };
}
