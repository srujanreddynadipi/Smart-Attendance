import { useState, useEffect } from 'react';
import { 
  getPendingChildRequests, 
  approveChildRequest, 
  rejectChildRequest, 
  getAllChildRequests 
} from '../../../firebase/childRequests';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';

export const useChildRequests = () => {
  const { userData } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [childRequests, setChildRequests] = useState([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadChildRequests = async () => {
    try {
      const result = await getAllChildRequests();
      if (result.success) {
        setChildRequests(result.requests);
        const pendingCount = result.requests.filter(req => req.status === 'pending').length;
        setPendingRequestsCount(pendingCount);
        console.log('✅ Loaded child requests:', result.requests.length, 'total,', pendingCount, 'pending');
      }
    } catch (error) {
      console.error('❌ Error loading child requests:', error);
    }
  };

  const handleApproveChildRequest = async (requestId, requestData) => {
    try {
      setLoading(true);
      const result = await approveChildRequest(requestId, userData?.uid, userData?.name || 'Admin');
      
      if (result.success) {
        showSuccess(result.message);
        await loadChildRequests(); // Reload requests
        return { success: true };
      } else {
        showError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error approving child request:', error);
      showError('Failed to approve request');
      return { success: false, error: 'Failed to approve request' };
    } finally {
      setLoading(false);
    }
  };

  const handleRejectChildRequest = async (requestId, reason = '') => {
    try {
      setLoading(true);
      const result = await rejectChildRequest(requestId, userData?.uid, userData?.name || 'Admin', reason);
      
      if (result.success) {
        showSuccess(result.message);
        await loadChildRequests(); // Reload requests
        return { success: true };
      } else {
        showError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error rejecting child request:', error);
      showError('Failed to reject request');
      return { success: false, error: 'Failed to reject request' };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChildRequests();
  }, []);

  return {
    childRequests,
    pendingRequestsCount,
    loading,
    loadChildRequests,
    handleApproveChildRequest,
    handleRejectChildRequest
  };
};