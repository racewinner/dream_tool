import { AlertColor } from '@mui/material/Alert';

// Notification options
export interface NotificationOptions {
  message: string;
  type: AlertColor;
  duration?: number;
}

// Notification callback type
export type NotificationCallback = (options: NotificationOptions) => void;

// Default notification handler that logs to console
// This will be replaced by the actual implementation in components
export let showNotification: NotificationCallback = (options: NotificationOptions) => {
  console.log(`[Notification ${options.type}]: ${options.message}`);
};

// Function to set the notification handler
export const setNotificationHandler = (handler: NotificationCallback) => {
  showNotification = handler;
};

// Helper functions for common notification types
export const showSuccess = (message: string, duration = 4000) => 
  showNotification({ message, type: 'success', duration });

export const showError = (message: string, duration = 6000) => 
  showNotification({ message, type: 'error', duration });

export const showWarning = (message: string, duration = 5000) => 
  showNotification({ message, type: 'warning', duration });

export const showInfo = (message: string, duration = 3000) => 
  showNotification({ message, type: 'info', duration });
