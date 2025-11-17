// src/utils/toast.ts
import { toast as sonnerToast } from 'sonner';

/**
 * Toast Utility Wrapper
 *
 * A consistent wrapper around Sonner toast library for displaying
 * notifications throughout the application.
 *
 * Usage:
 * ```ts
 * import { toast } from '@/utils/toast';
 *
 * toast.success('Operation successful');
 * toast.error('Something went wrong', 'Please try again');
 * toast.info('Important information');
 * toast.warning('Be careful!');
 * ```
 */

interface ToastOptions {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const toast = {
  /**
   * Show a success toast
   * @param message - Main message to display
   * @param description - Optional description
   * @param options - Additional options
   */
  success: (message: string, description?: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      description,
      duration: options?.duration || 3000,
      action: options?.action,
    });
  },

  /**
   * Show an error toast
   * @param message - Main error message
   * @param description - Optional description
   * @param options - Additional options
   */
  error: (message: string, description?: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      description,
      duration: options?.duration || 5000,
      action: options?.action,
    });
  },

  /**
   * Show an info toast
   * @param message - Main message
   * @param description - Optional description
   * @param options - Additional options
   */
  info: (message: string, description?: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      description,
      duration: options?.duration || 3000,
      action: options?.action,
    });
  },

  /**
   * Show a warning toast
   * @param message - Warning message
   * @param description - Optional description
   * @param options - Additional options
   */
  warning: (message: string, description?: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      description,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  },

  /**
   * Show a loading toast
   * Returns a toast ID that can be used to dismiss or update the toast
   * @param message - Loading message
   */
  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  /**
   * Dismiss a specific toast or all toasts
   * @param toastId - Optional toast ID to dismiss specific toast
   */
  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId);
  },

  /**
   * Show a promise toast that automatically updates based on promise state
   * @param promise - The promise to track
   * @param messages - Messages for loading, success, and error states
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },

  /**
   * Show a custom toast
   * @param message - Custom message
   * @param options - Custom options
   */
  custom: (message: string | React.ReactNode, options?: ToastOptions) => {
    return sonnerToast(message, {
      duration: options?.duration,
      description: options?.description,
      action: options?.action,
    });
  },
};

// Re-export sonner toast for advanced usage
export { sonnerToast };

export default toast;
