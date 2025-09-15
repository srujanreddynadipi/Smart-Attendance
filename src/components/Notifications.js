import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Trash2, UserCheck } from 'lucide-react';

// Custom Hook for managing notifications
export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const success = (message, duration) => showNotification(message, 'success', duration);
  const error = (message, duration) => showNotification(message, 'error', duration);
  const info = (message, duration) => showNotification(message, 'info', duration);
  const warning = (message, duration) => showNotification(message, 'warning', duration);

  return {
    notifications,
    success,
    error,
    info,
    warning,
    removeNotification
  };
};

// Notification Component
const Notification = ({ notification, onRemove }) => {
  const { id, message, type } = notification;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className={`
      ${getColors()}
      border rounded-lg p-4 shadow-lg backdrop-blur-sm
      transform transition-all duration-300 ease-in-out
      animate-slide-in-right
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={getIconColor()}>
            {getIcon()}
          </div>
          <p className="font-medium">{message}</p>
        </div>
        <button
          onClick={() => onRemove(id)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Notification Container
export const NotificationContainer = ({ notifications, onRemove }) => {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

// Custom Confirm Dialog Hook
export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    onConfirm: null,
    onCancel: null
  });

  const confirm = ({
    title = 'Confirm Action',
    message = 'Are you sure you want to continue?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    onConfirm = () => {},
    onCancel = () => {}
  }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => {
          onConfirm();
          resolve(true);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        },
        onCancel: () => {
          onCancel();
          resolve(false);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      });
    });
  };

  const close = () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  return { confirmState, confirm, close };
};

// Confirm Dialog Component
export const ConfirmDialog = ({ confirmState, onClose }) => {
  const { isOpen, title, message, confirmText, cancelText, type, onConfirm, onCancel } = confirmState;

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="w-8 h-8 text-red-600" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-8 h-8 text-yellow-600" />;
      default:
        return <UserCheck className="w-8 h-8 text-blue-600" />;
    }
  };

  const getConfirmButtonColors = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all duration-300 scale-100 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
        </div>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 ${getConfirmButtonColors()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Loading Overlay Component
export const LoadingOverlay = ({ isVisible, message = 'Processing...' }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default {
  useNotification,
  NotificationContainer,
  useConfirm,
  ConfirmDialog,
  LoadingOverlay
};