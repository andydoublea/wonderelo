import { useState, useCallback } from 'react';

/**
 * Custom hook for managing dialog open/close state
 * Prevents duplication of dialog state management
 */

export interface UseDialogReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setIsOpen: (isOpen: boolean) => void;
}

/**
 * Simple hook for dialog state management
 * 
 * @example
 * ```tsx
 * const dialog = useDialog();
 * 
 * return (
 *   <>
 *     <Button onClick={dialog.open}>Open Dialog</Button>
 *     <Dialog open={dialog.isOpen} onOpenChange={dialog.setIsOpen}>
 *       <DialogContent>
 *         <DialogTitle>My Dialog</DialogTitle>
 *         <Button onClick={dialog.close}>Close</Button>
 *       </DialogContent>
 *     </Dialog>
 *   </>
 * );
 * ```
 */
export function useDialog(initialState: boolean = false): UseDialogReturn {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen
  };
}

/**
 * Hook for managing multiple dialogs
 * 
 * @example
 * ```tsx
 * const dialogs = useMultipleDialogs(['create', 'edit', 'delete']);
 * 
 * return (
 *   <>
 *     <Button onClick={() => dialogs.open('create')}>Create</Button>
 *     <Button onClick={() => dialogs.open('edit')}>Edit</Button>
 *     
 *     <Dialog open={dialogs.isOpen('create')} onOpenChange={(open) => dialogs.setOpen('create', open)}>
 *       ...
 *     </Dialog>
 *   </>
 * );
 * ```
 */
export function useMultipleDialogs<T extends string>(dialogKeys: T[]) {
  const [openDialogs, setOpenDialogs] = useState<Record<T, boolean>>(
    dialogKeys.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<T, boolean>)
  );

  const open = useCallback((key: T) => {
    setOpenDialogs(prev => ({ ...prev, [key]: true }));
  }, []);

  const close = useCallback((key: T) => {
    setOpenDialogs(prev => ({ ...prev, [key]: false }));
  }, []);

  const toggle = useCallback((key: T) => {
    setOpenDialogs(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const closeAll = useCallback(() => {
    setOpenDialogs(
      dialogKeys.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<T, boolean>)
    );
  }, [dialogKeys]);

  const isOpen = useCallback((key: T) => openDialogs[key], [openDialogs]);

  const setOpen = useCallback((key: T, isOpen: boolean) => {
    setOpenDialogs(prev => ({ ...prev, [key]: isOpen }));
  }, []);

  return {
    open,
    close,
    toggle,
    closeAll,
    isOpen,
    setOpen,
    openDialogs
  };
}

/**
 * Hook for dialog with data
 * Useful when you need to pass data to a dialog
 * 
 * @example
 * ```tsx
 * const dialog = useDialogWithData<User>();
 * 
 * const handleEdit = (user: User) => {
 *   dialog.openWith(user);
 * };
 * 
 * return (
 *   <>
 *     <Button onClick={() => handleEdit(user)}>Edit</Button>
 *     <Dialog open={dialog.isOpen} onOpenChange={dialog.setIsOpen}>
 *       <DialogContent>
 *         {dialog.data && <UserForm user={dialog.data} />}
 *       </DialogContent>
 *     </Dialog>
 *   </>
 * );
 * ```
 */
export function useDialogWithData<T>(initialData?: T | null) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(initialData ?? null);

  const openWith = useCallback((newData: T) => {
    setData(newData);
    setIsOpen(true);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const closeAndClear = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  const updateData = useCallback((newData: T) => {
    setData(newData);
  }, []);

  return {
    isOpen,
    data,
    open,
    openWith,
    close,
    closeAndClear,
    updateData,
    setIsOpen,
    setData
  };
}

/**
 * Hook for step-based dialogs (wizards)
 * 
 * @example
 * ```tsx
 * const wizard = useWizardDialog(3); // 3 steps
 * 
 * return (
 *   <Dialog open={wizard.isOpen} onOpenChange={wizard.setIsOpen}>
 *     <DialogContent>
 *       {wizard.currentStep === 0 && <Step1 />}
 *       {wizard.currentStep === 1 && <Step2 />}
 *       {wizard.currentStep === 2 && <Step3 />}
 *       
 *       <DialogFooter>
 *         {wizard.canGoBack && <Button onClick={wizard.goBack}>Back</Button>}
 *         {wizard.canGoNext && <Button onClick={wizard.goNext}>Next</Button>}
 *         {wizard.isLastStep && <Button onClick={wizard.close}>Finish</Button>}
 *       </DialogFooter>
 *     </DialogContent>
 *   </Dialog>
 * );
 * ```
 */
export function useWizardDialog(totalSteps: number) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const open = useCallback(() => {
    setIsOpen(true);
    setCurrentStep(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setCurrentStep(0);
  }, []);

  const goNext = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const goBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, totalSteps - 1)));
  }, [totalSteps]);

  const reset = useCallback(() => {
    setCurrentStep(0);
  }, []);

  const canGoNext = currentStep < totalSteps - 1;
  const canGoBack = currentStep > 0;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return {
    isOpen,
    currentStep,
    open,
    close,
    goNext,
    goBack,
    goToStep,
    reset,
    setIsOpen,
    canGoNext,
    canGoBack,
    isFirstStep,
    isLastStep,
    progress,
    totalSteps
  };
}
