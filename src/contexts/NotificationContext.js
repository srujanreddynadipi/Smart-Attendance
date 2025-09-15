import React, { createContext, useContext } from 'react';
import { 
  useNotification, 
  NotificationContainer, 
  useConfirm, 
  ConfirmDialog,
  LoadingOverlay 
} from '../components/Notifications';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { notifications, success, error, info, warning, removeNotification } = useNotification();
  const { confirmState, confirm, close } = useConfirm();
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState('Processing...');

  const showLoading = (message = 'Processing...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  // Enhanced notification methods with better UX
  const showSuccess = (message, duration = 4000) => {
    return success(message, duration);
  };

  const showError = (message, duration = 5000) => {
    return error(message, duration);
  };

  const showInfo = (message, duration = 4000) => {
    return info(message, duration);
  };

  const showWarning = (message, duration = 4000) => {
    return warning(message, duration);
  };

  // Enhanced confirm dialog with different types
  const confirmDelete = (itemName, onConfirm) => {
    return confirm({
      title: 'Delete Confirmation',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm
    });
  };

  const confirmAction = (title, message, onConfirm, type = 'info') => {
    return confirm({
      title,
      message,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      type,
      onConfirm
    });
  };

  const confirmApproval = (studentName, onConfirm) => {
    return confirm({
      title: 'Approve Student Request',
      message: `Are you sure you want to approve ${studentName}'s request to join this classroom?`,
      confirmText: 'Approve',
      cancelText: 'Cancel',
      type: 'success',
      onConfirm
    });
  };

  const confirmRejection = (studentName, onConfirm) => {
    return confirm({
      title: 'Reject Student Request',
      message: `Are you sure you want to reject ${studentName}'s request to join this classroom?`,
      confirmText: 'Reject',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm
    });
  };

  const value = {
    // Basic notifications
    showSuccess,
    showError,
    showInfo,
    showWarning,
    
    // Loading states
    showLoading,
    hideLoading,
    
    // Confirm dialogs
    confirm,
    confirmDelete,
    confirmAction,
    confirmApproval,
    confirmRejection,
    
    // Direct access for custom usage
    notifications,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      <ConfirmDialog 
        confirmState={confirmState} 
        onClose={close} 
      />
      <LoadingOverlay 
        isVisible={isLoading} 
        message={loadingMessage} 
      />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;