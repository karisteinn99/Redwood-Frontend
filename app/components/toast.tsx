'use client';

import toast, { Toaster } from 'react-hot-toast';

// Custom toast utility functions
export const showSuccessToast = (message: string) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-center',
    style: {
      border: '1px solid #10B981',
      background: '#F0FDF4',
      color: '#065F46',
      borderRadius: '6px',
      padding: '16px',
      fontSize: '14px',
      fontWeight: '500',
      maxWidth: '400px',
    },
    iconTheme: {
      primary: '#10B981',
      secondary: '#F0FDF4',
    },
  });
};

export const showErrorToast = (message: string) => {
  toast.error(message, {
    duration: 3000,
    position: 'top-center',
    style: {
      border: '1px solid #EF4444',
      background: '#FEF2F2',
      color: '#991B1B',
      borderRadius: '6px',
      padding: '16px',
      fontSize: '14px',
      fontWeight: '500',
      maxWidth: '400px',
    },
    iconTheme: {
      primary: '#EF4444',
      secondary: '#FEF2F2',
    },
  });
};

// Toaster component to be added to your app
export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{
        top: 16,
        left: 16,
        bottom: 16,
        right: 16,
      }}
      toastOptions={{
        // Default options for all toasts
        duration: 3000,
        style: {
          maxWidth: '400px',
          transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
        },
        // Slower, smoother animations
        success: {
          style: {
            transform: 'translateY(0px)',
            transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
          },
        },
        error: {
          style: {
            transform: 'translateY(0px)',
            transition: 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
          },
        },
      }}
    />
  );
}

export default ToastProvider;
