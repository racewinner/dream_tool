import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Snackbar, Alert, AlertColor, Slide, SlideProps } from '@mui/material';
import { setNotificationHandler, NotificationOptions } from '../utils/notification';

type Notification = {
  id: string;
  message: string;
  severity: AlertColor;
  autoHideDuration?: number | null;
};

type NotificationContextType = {
  showNotification: (message: string, severity?: AlertColor, autoHideDuration?: number | null) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="left" />;
}

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  
  // Create adapter to bridge the notification utility with the context implementation
  // This connects the utility's object-based API with the context's parameter-based API

  // Define showNotification callback first, before it's used in the effect
  const showNotification = useCallback((message: string, severity: AlertColor = 'info', autoHideDuration: number | null = 6000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { id, message, severity, autoHideDuration };
    setNotifications(prev => [...prev, newNotification]);
    
    // If no notification is currently being shown, display this one immediately
    if (!currentNotification) {
      setCurrentNotification(newNotification);
      setOpen(true);
    }
  }, [currentNotification]);
  
  // Add adapter hook to connect with the utility
  useEffect(() => {
    // Create adapter function that converts from options object to individual parameters
    const notificationAdapter = (options: NotificationOptions) => {
      showNotification(options.message, options.type as AlertColor, options.duration || 6000);
    };
    
    // Register our adapter with the utility
    setNotificationHandler(notificationAdapter);
    
    // No cleanup needed as we want the handler to remain throughout the app lifecycle
  }, [showNotification]);

  const showNextNotification = useCallback((notification: Notification) => {
    setCurrentNotification(notification);
    setOpen(true);
    
    // Auto-hide the notification after the specified duration
    if (notification.autoHideDuration !== null) {
      setTimeout(() => {
        handleClose();
      }, notification.autoHideDuration);
    }
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    
    // After the close animation completes, show the next notification if available
    setTimeout(() => {
      setCurrentNotification(null);
      setNotifications(prev => {
        const newNotifications = [...prev];
        newNotifications.shift(); // Remove the first notification
        
        // If there are more notifications, show the next one
        if (newNotifications.length > 0) {
          showNextNotification(newNotifications[0]);
        }
        
        return newNotifications;
      });
    }, 300); // Match this with the transition duration
  }, [showNextNotification]);

  const showError = useCallback((message: string) => {
    showNotification(message, 'error');
  }, [showNotification]);

  const showSuccess = useCallback((message: string) => {
    showNotification(message, 'success');
  }, [showNotification]);

  const showWarning = useCallback((message: string) => {
    showNotification(message, 'warning');
  }, [showNotification]);

  const showInfo = useCallback((message: string) => {
    showNotification(message, 'info');
  }, [showNotification]);

  return (
    <NotificationContext.Provider 
      value={{ 
        showNotification, 
        showError, 
        showSuccess, 
        showWarning, 
        showInfo 
      }}
    >
      {children}
      
      {currentNotification && (
        <Snackbar
          open={open}
          autoHideDuration={null} // We'll handle auto-hiding manually
          onClose={(_, reason) => {
            if (reason === 'clickaway') {
              return;
            }
            handleClose();
          }}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          TransitionComponent={SlideTransition}
          sx={{ mt: 6 }}
        >
          <Alert 
            onClose={handleClose} 
            severity={currentNotification.severity} 
            variant="filled"
            sx={{ width: '100%', minWidth: 300 }}
            elevation={6}
          >
            {currentNotification.message}
          </Alert>
        </Snackbar>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
