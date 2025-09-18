import React from 'react';
import { auth } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// User roles configuration
export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher', 
  PARENT: 'parent',
  ADMIN: 'admin'
};

// Permission levels for different operations
export const PERMISSIONS = {
  AWARD_POINTS: ['teacher', 'admin'],
  VIEW_ALL_USERS: ['admin'],
  MANAGE_COUPONS: ['admin'],
  VIEW_CHILD_DATA: ['parent', 'admin'],
  RESET_POINTS: ['admin'],
  BULK_OPERATIONS: ['admin'],
  VIEW_ANALYTICS: ['teacher', 'admin']
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!auth.currentUser;
};

/**
 * Get user role from Firestore
 */
export const getUserRole = async (userId) => {
  try {
    if (!userId) return null;
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().role || USER_ROLES.STUDENT;
    }
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

/**
 * Check if user has specific permission
 */
export const hasPermission = async (userId, permission) => {
  try {
    if (!userId || !permission) return false;
    
    const userRole = await getUserRole(userId);
    if (!userRole) return false;
    
    const allowedRoles = PERMISSIONS[permission];
    return allowedRoles && allowedRoles.includes(userRole);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

/**
 * Validate points transaction data
 */
export const validatePointsTransaction = (data) => {
  const errors = [];
  
  // Required fields
  if (!data.toUserId) {
    errors.push('Recipient user ID is required');
  }
  
  if (!data.amount || data.amount <= 0) {
    errors.push('Points amount must be greater than 0');
  }
  
  if (data.amount > 1000) {
    errors.push('Points amount cannot exceed 1000 per transaction');
  }
  
  if (!data.category) {
    errors.push('Transaction category is required');
  }
  
  if (!data.reason || data.reason.trim().length < 3) {
    errors.push('Reason must be at least 3 characters long');
  }
  
  if (data.reason && data.reason.length > 500) {
    errors.push('Reason cannot exceed 500 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate coupon data
 */
export const validateCouponData = (data) => {
  const errors = [];
  
  if (!data.title || data.title.trim().length < 3) {
    errors.push('Coupon title must be at least 3 characters long');
  }
  
  if (!data.description || data.description.trim().length < 10) {
    errors.push('Coupon description must be at least 10 characters long');
  }
  
  if (!data.pointsCost || data.pointsCost <= 0) {
    errors.push('Points cost must be greater than 0');
  }
  
  if (data.pointsCost > 10000) {
    errors.push('Points cost cannot exceed 10,000');
  }
  
  if (!data.brand) {
    errors.push('Brand name is required');
  }
  
  if (!data.category) {
    errors.push('Coupon category is required');
  }
  
  if (data.expiryDate && new Date(data.expiryDate) <= new Date()) {
    errors.push('Expiry date must be in the future');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Rate limiting check
 */
const rateLimitStore = new Map();

export const checkRateLimit = (userId, action, limit = 10, windowMs = 60000) => {
  const key = `${userId}_${action}`;
  const now = Date.now();
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remainingRequests: limit - 1 };
  }
  
  const record = rateLimitStore.get(key);
  
  if (now > record.resetTime) {
    // Reset the window
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remainingRequests: limit - 1 };
  }
  
  if (record.count >= limit) {
    return { 
      allowed: false, 
      remainingRequests: 0,
      resetTime: record.resetTime
    };
  }
  
  record.count++;
  return { 
    allowed: true, 
    remainingRequests: limit - record.count 
  };
};

/**
 * Validate file uploads (for bulk operations)
 */
export const validateFileUpload = (file, allowedTypes = ['text/csv'], maxSize = 5 * 1024 * 1024) => {
  const errors = [];
  
  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  if (file.size > maxSize) {
    errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Security audit logging
 */
export const logSecurityEvent = async (userId, action, details = {}) => {
  try {
    const logData = {
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ip: 'client-side' // In production, this would be logged server-side
    };
    
    // In production, this would send to a secure logging service
    console.log('Security Event:', logData);
    
    // Store in local storage for development (in production, use secure server-side logging)
    const existingLogs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
    existingLogs.push(logData);
    
    // Keep only last 100 logs
    if (existingLogs.length > 100) {
      existingLogs.splice(0, existingLogs.length - 100);
    }
    
    localStorage.setItem('securityLogs', JSON.stringify(existingLogs));
  } catch (error) {
    console.error('Error logging security event:', error);
  }
};

/**
 * Enhanced permission decorator for components
 */
export const withPermissionCheck = (WrappedComponent, requiredPermission) => {
  return function PermissionCheckWrapper(props) {
    const [hasAccess, setHasAccess] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    
    React.useEffect(() => {
      const checkAccess = async () => {
        const user = getCurrentUser();
        if (!user) {
          setHasAccess(false);
          setLoading(false);
          return;
        }
        
        const permitted = await hasPermission(user.uid, requiredPermission);
        setHasAccess(permitted);
        setLoading(false);
        
        // Log access attempt
        await logSecurityEvent(user.uid, 'PERMISSION_CHECK', {
          permission: requiredPermission,
          granted: permitted
        });
      };
      
      checkAccess();
    }, [requiredPermission]);
    
    if (loading) {
      return <div className="p-4 text-center">Checking permissions...</div>;
    }
    
    if (!hasAccess) {
      return (
        <div className="p-6 text-center">
          <div className="text-red-600 font-semibold mb-2">Access Denied</div>
          <div className="text-gray-600">You don't have permission to access this feature.</div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};

/**
 * Secure data fetching with permission checks
 */
export const secureDataFetch = async (operation, requiredPermission, userId) => {
  try {
    // Check authentication
    if (!isAuthenticated()) {
      throw new Error('User not authenticated');
    }
    
    // Check permission
    if (requiredPermission && !(await hasPermission(userId, requiredPermission))) {
      await logSecurityEvent(userId, 'UNAUTHORIZED_ACCESS_ATTEMPT', {
        operation: operation.name,
        permission: requiredPermission
      });
      throw new Error('Insufficient permissions');
    }
    
    // Check rate limiting
    const rateCheck = checkRateLimit(userId, operation.name);
    if (!rateCheck.allowed) {
      await logSecurityEvent(userId, 'RATE_LIMIT_EXCEEDED', {
        operation: operation.name
      });
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // Execute operation
    const result = await operation();
    
    // Log successful operation
    await logSecurityEvent(userId, 'SECURE_OPERATION_SUCCESS', {
      operation: operation.name
    });
    
    return result;
  } catch (error) {
    await logSecurityEvent(userId, 'SECURE_OPERATION_FAILED', {
      operation: operation.name,
      error: error.message
    });
    throw error;
  }
};

export default {
  getCurrentUser,
  isAuthenticated,
  getUserRole,
  hasPermission,
  validatePointsTransaction,
  validateCouponData,
  sanitizeInput,
  checkRateLimit,
  validateFileUpload,
  logSecurityEvent,
  withPermissionCheck,
  secureDataFetch,
  USER_ROLES,
  PERMISSIONS
};