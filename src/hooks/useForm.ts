import { useState, useCallback, ChangeEvent } from 'react';
import { debugLog } from '../utils/debug';

/**
 * Custom hook for form state management with validation
 * Prevents duplication of form handling patterns
 */

export interface FieldError {
  [key: string]: string;
}

export interface ValidationRule<T> {
  required?: boolean | string; // true or custom message
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  validate?: (value: any, formData: T) => string | undefined;
}

export interface ValidationRules<T> {
  [K in keyof T]?: ValidationRule<T>;
}

export interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: ValidationRules<T>;
  onSubmit?: (values: T) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface UseFormReturn<T> {
  values: T;
  errors: FieldError;
  touched: { [K in keyof T]?: boolean };
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (field: keyof T) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (field: keyof T) => () => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  clearFieldError: (field: keyof T) => void;
  setValues: (values: Partial<T>) => void;
  setErrors: (errors: FieldError) => void;
  clearErrors: () => void;
  validateField: (field: keyof T) => string | undefined;
  validateForm: () => boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: () => void;
  setTouched: (field: keyof T, isTouched: boolean) => void;
  getFieldProps: (field: keyof T) => {
    value: any;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: () => void;
    error: string | undefined;
    touched: boolean | undefined;
  };
}

/**
 * Form management hook with validation
 * 
 * @example
 * ```tsx
 * const form = useForm({
 *   initialValues: { email: '', password: '' },
 *   validationRules: {
 *     email: {
 *       required: true,
 *       pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' }
 *     },
 *     password: {
 *       required: 'Password is required',
 *       minLength: { value: 8, message: 'Must be at least 8 characters' }
 *     }
 *   },
 *   onSubmit: async (values) => {
 *     await saveData(values);
 *   }
 * });
 * 
 * // In JSX
 * <Input {...form.getFieldProps('email')} />
 * ```
 */
export function useForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrorsState] = useState<FieldError>({});
  const [touched, setTouchedState] = useState<{ [K in keyof T]?: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (field: keyof T): string | undefined => {
      const value = values[field];
      const rules = validationRules[field];

      if (!rules) return undefined;

      // Required validation
      if (rules.required) {
        if (value === undefined || value === null || value === '') {
          return typeof rules.required === 'string' 
            ? rules.required 
            : 'This field is required';
        }
      }

      // Only validate other rules if field has a value
      if (value === undefined || value === null || value === '') {
        return undefined;
      }

      // Min length validation
      if (rules.minLength && typeof value === 'string') {
        if (value.length < rules.minLength.value) {
          return rules.minLength.message;
        }
      }

      // Max length validation
      if (rules.maxLength && typeof value === 'string') {
        if (value.length > rules.maxLength.value) {
          return rules.maxLength.message;
        }
      }

      // Pattern validation
      if (rules.pattern && typeof value === 'string') {
        if (!rules.pattern.value.test(value)) {
          return rules.pattern.message;
        }
      }

      // Custom validation
      if (rules.validate) {
        return rules.validate(value, values);
      }

      return undefined;
    },
    [values, validationRules]
  );

  /**
   * Validate all fields
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: FieldError = {};
    let isValid = true;

    Object.keys(validationRules).forEach((field) => {
      const error = validateField(field as keyof T);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrorsState(newErrors);
    return isValid;
  }, [validationRules, validateField]);

  /**
   * Handle field change
   */
  const handleChange = useCallback(
    (field: keyof T) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : e.target.value;

      setValuesState(prev => ({ ...prev, [field]: value }));

      // Clear error when user starts typing
      if (errors[field as string]) {
        setErrorsState(prev => {
          const newErrors = { ...prev };
          delete newErrors[field as string];
          return newErrors;
        });
      }

      // Validate on change if enabled
      if (validateOnChange && touched[field]) {
        const error = validateField(field);
        if (error) {
          setErrorsState(prev => ({ ...prev, [field as string]: error }));
        }
      }
    },
    [errors, touched, validateOnChange, validateField]
  );

  /**
   * Handle field blur
   */
  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setTouchedState(prev => ({ ...prev, [field]: true }));

      // Validate on blur if enabled
      if (validateOnBlur) {
        const error = validateField(field);
        if (error) {
          setErrorsState(prev => ({ ...prev, [field as string]: error }));
        }
      }
    },
    [validateOnBlur, validateField]
  );

  /**
   * Set field value programmatically
   */
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValuesState(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Set field error
   */
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrorsState(prev => ({ ...prev, [field as string]: error }));
  }, []);

  /**
   * Clear field error
   */
  const clearFieldError = useCallback((field: keyof T) => {
    setErrorsState(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  /**
   * Set multiple values
   */
  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
  }, []);

  /**
   * Set errors
   */
  const setErrors = useCallback((newErrors: FieldError) => {
    setErrorsState(newErrors);
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrorsState({});
  }, []);

  /**
   * Set touched state for a field
   */
  const setTouched = useCallback((field: keyof T, isTouched: boolean) => {
    setTouchedState(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as { [K in keyof T]: boolean });
      setTouchedState(allTouched);

      // Validate form
      const isValid = validateForm();
      if (!isValid) {
        debugLog('Form validation failed:', errors);
        return;
      }

      if (onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [values, validateForm, onSubmit, errors]
  );

  /**
   * Reset form to initial values
   */
  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrorsState({});
    setTouchedState({});
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Get all props needed for a field
   */
  const getFieldProps = useCallback(
    (field: keyof T) => ({
      value: values[field] ?? '',
      onChange: handleChange(field),
      onBlur: handleBlur(field),
      error: errors[field as string],
      touched: touched[field]
    }),
    [values, errors, touched, handleChange, handleBlur]
  );

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    clearFieldError,
    setValues,
    setErrors,
    clearErrors,
    validateField,
    validateForm,
    handleSubmit,
    reset,
    setTouched,
    getFieldProps
  };
}

/**
 * Simple form field component helper
 */
export interface FormFieldProps {
  error?: string;
  touched?: boolean;
  showError?: boolean;
}

export function getFieldClassName(
  baseClassName: string = '',
  { error, touched, showError = true }: FormFieldProps = {}
): string {
  if (showError && error && touched) {
    return `${baseClassName} border-destructive focus-visible:ring-destructive`.trim();
  }
  return baseClassName;
}

export function shouldShowError(error?: string, touched?: boolean): boolean {
  return Boolean(error && touched);
}
