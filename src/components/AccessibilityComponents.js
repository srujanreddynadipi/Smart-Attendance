import React from 'react';

// Screen reader only text component
export const ScreenReaderOnly = ({ children, ...props }) => (
  <span className="sr-only" {...props}>
    {children}
  </span>
);

// Skip link component for better keyboard navigation
export const SkipLink = ({ href = "#main-content", children = "Skip to main content" }) => (
  <a href={href} className="skip-link">
    {children}
  </a>
);

// Accessible loading spinner with proper ARIA attributes
export const AccessibleSpinner = ({ 
  size = "medium", 
  label = "Loading...", 
  className = "" 
}) => {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-6 h-6", 
    large: "w-8 h-8"
  };

  return (
    <div 
      className={`inline-flex items-center gap-2 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div 
        className={`${sizeClasses[size]} border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

// Accessible button component with better focus management
export const AccessibleButton = ({ 
  children, 
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  className = "",
  onClick,
  ariaLabel,
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  };
  
  const sizeClasses = {
    small: "px-3 py-2 text-sm min-h-9",
    medium: "px-4 py-3 text-base min-h-12",
    large: "px-6 py-4 text-lg min-h-14"
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <AccessibleSpinner size="small" label="Processing..." />
          <span className="ml-2">Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Accessible form field component
export const AccessibleField = ({ 
  label, 
  children, 
  error, 
  required = false, 
  helpText,
  id,
  className = ""
}) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  return (
    <div className={`space-y-2 ${className}`}>
      <label 
        htmlFor={fieldId} 
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {React.cloneElement(children, {
        id: fieldId,
        'aria-describedby': [
          error && errorId,
          helpText && helpId
        ].filter(Boolean).join(' '),
        'aria-invalid': error ? 'true' : 'false',
        required
      })}
      
      {helpText && (
        <p id={helpId} className="text-sm text-gray-600">
          {helpText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible modal component
export const AccessibleModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = "",
  size = "medium"
}) => {
  const sizeClasses = {
    small: "max-w-md",
    medium: "max-w-lg", 
    large: "max-w-2xl",
    xlarge: "max-w-4xl"
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[95vh] overflow-hidden animate-slide-up ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  );
};