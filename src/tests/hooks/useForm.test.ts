/**
 * useForm Hook Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useForm } from '../../hooks/useForm';

describe('useForm Hook', () => {
  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: {
            email: '',
            name: '',
          },
        })
      );
      
      expect(result.current.values).toEqual({
        email: '',
        name: '',
      });
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isDirty).toBe(false);
    });
    
    it('should initialize with provided values', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: {
            email: 'test@example.com',
            name: 'Test User',
          },
        })
      );
      
      expect(result.current.values.email).toBe('test@example.com');
      expect(result.current.values.name).toBe('Test User');
    });
  });
  
  describe('Field Management', () => {
    it('should update field value', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: {
            email: '',
          },
        })
      );
      
      act(() => {
        result.current.setFieldValue('email', 'test@example.com');
      });
      
      expect(result.current.values.email).toBe('test@example.com');
      expect(result.current.isDirty).toBe(true);
    });
    
    it('should mark field as touched', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: {
            email: '',
          },
        })
      );
      
      act(() => {
        result.current.setFieldTouched('email', true);
      });
      
      expect(result.current.touched.email).toBe(true);
    });
    
    it('should set field error', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: {
            email: '',
          },
        })
      );
      
      act(() => {
        result.current.setFieldError('email', 'Invalid email');
      });
      
      expect(result.current.errors.email).toBe('Invalid email');
    });
  });
  
  describe('Validation', () => {
    it('should validate required fields', async () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: {
            email: '',
          },
          validationRules: {
            email: {
              required: true,
            },
          },
        })
      );
      
      await act(async () => {
        await result.current.validateField('email');
      });
      
      expect(result.current.errors.email).toBe('Email is required');
    });
    
    it('should validate pattern', async () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: {
            email: 'invalid',
          },
          validationRules: {
            email: {
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Invalid email format',
              },
            },
          },
        })
      );
      
      await act(async () => {
        await result.current.validateField('email');
      });
      
      expect(result.current.errors.email).toBe('Invalid email format');
    });
    
    it('should validate min length', async () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: {
            password: '12',
          },
          validationRules: {
            password: {
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
            },
          },
        })
      );
      
      await act(async () => {
        await result.current.validateField('password');
      });
      
      expect(result.current.errors.password).toBe('Password must be at least 8 characters');
    });
    
    it('should validate max length', async () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: {
            name: 'A'.repeat(51),
          },
          validationRules: {
            name: {
              maxLength: {
                value: 50,
                message: 'Name must be less than 50 characters',
              },
            },
          },
        })
      );
      
      await act(async () => {
        await result.current.validateField('name');
      });
      
      expect(result.current.errors.name).toBe('Name must be less than 50 characters');
    });
    
    it('should validate custom function', async () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: {
            age: 15,
          },
          validationRules: {
            age: {
              validate: (value) => value >= 18 || 'Must be 18 or older',
            },
          },
        })
      );
      
      await act(async () => {
        await result.current.validateField('age');
      });
      
      expect(result.current.errors.age).toBe('Must be 18 or older');
    });
    
    it('should validate all fields', async () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: {
            email: '',
            password: '123',
          },
          validationRules: {
            email: { required: true },
            password: {
              minLength: {
                value: 8,
                message: 'Too short',
              },
            },
          },
        })
      );
      
      let isValid: boolean = false;
      
      await act(async () => {
        isValid = await result.current.validate();
      });
      
      expect(isValid).toBe(false);
      expect(result.current.errors.email).toBe('Email is required');
      expect(result.current.errors.password).toBe('Too short');
    });
  });
  
  describe('Form Submission', () => {
    it('should call onSubmit with valid data', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      
      const { result } = renderHook(() =>
        useForm({
          initialValues: {
            email: 'test@example.com',
          },
          validationRules: {
            email: { required: true },
          },
          onSubmit,
        })
      );
      
      await act(async () => {
        await result.current.handleSubmit();
      });
      
      expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result.current.isSubmitting).toBe(false);
    });
    
    it('should not call onSubmit with invalid data', async () => {
      const onSubmit = vi.fn();
      
      const { result } = renderHook(() =>
        useForm({
          initialValues: {
            email: '',
          },
          validationRules: {
            email: { required: true },
          },
          onSubmit,
        })
      );
      
      await act(async () => {
        await result.current.handleSubmit();
      });
      
      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.errors.email).toBe('Email is required');
    });
    
    it('should set isSubmitting during submission', async () => {
      const onSubmit = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      const { result } = renderHook(() =>
        useForm({
          initialValues: { email: 'test@example.com' },
          onSubmit,
        })
      );
      
      act(() => {
        result.current.handleSubmit();
      });
      
      expect(result.current.isSubmitting).toBe(true);
      
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });
    
    it('should handle submission errors', async () => {
      const error = new Error('Submission failed');
      const onSubmit = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();
      
      const { result } = renderHook(() =>
        useForm({
          initialValues: { email: 'test@example.com' },
          onSubmit,
          onError,
        })
      );
      
      await act(async () => {
        await result.current.handleSubmit();
      });
      
      expect(onError).toHaveBeenCalledWith(error);
      expect(result.current.isSubmitting).toBe(false);
    });
  });
  
  describe('Form Reset', () => {
    it('should reset to initial values', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: {
            email: '',
            name: '',
          },
        })
      );
      
      act(() => {
        result.current.setFieldValue('email', 'test@example.com');
        result.current.setFieldValue('name', 'Test User');
        result.current.setFieldTouched('email', true);
        result.current.setFieldError('email', 'Error');
      });
      
      expect(result.current.isDirty).toBe(true);
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.values).toEqual({
        email: '',
        name: '',
      });
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
      expect(result.current.isDirty).toBe(false);
    });
    
    it('should reset to new values', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: {
            email: '',
          },
        })
      );
      
      act(() => {
        result.current.reset({ email: 'new@example.com' });
      });
      
      expect(result.current.values.email).toBe('new@example.com');
    });
  });
  
  describe('getFieldProps', () => {
    it('should return field props', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: {
            email: 'test@example.com',
          },
        })
      );
      
      const fieldProps = result.current.getFieldProps('email');
      
      expect(fieldProps).toHaveProperty('name', 'email');
      expect(fieldProps).toHaveProperty('value', 'test@example.com');
      expect(fieldProps).toHaveProperty('onChange');
      expect(fieldProps).toHaveProperty('onBlur');
    });
    
    it('should handle onChange', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: {
            email: '',
          },
        })
      );
      
      const fieldProps = result.current.getFieldProps('email');
      
      act(() => {
        fieldProps.onChange({
          target: { value: 'test@example.com' },
        } as any);
      });
      
      expect(result.current.values.email).toBe('test@example.com');
    });
    
    it('should handle onBlur', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: {
            email: '',
          },
        })
      );
      
      const fieldProps = result.current.getFieldProps('email');
      
      act(() => {
        fieldProps.onBlur();
      });
      
      expect(result.current.touched.email).toBe(true);
    });
  });
});
