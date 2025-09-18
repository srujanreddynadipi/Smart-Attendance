import React, { useState, useEffect } from 'react';
import { Award, X, Shield } from 'lucide-react';
import AwardPointsForm from './AwardPointsForm';
import { hasPermission, getCurrentUser, PERMISSIONS } from '../utils/security';

const QuickAwardPoints = ({ targetUserId, targetUserName, awarderId, awarderRole, onSuccess }) => {
  const [showForm, setShowForm] = useState(false);
  const [canAwardPoints, setCanAwardPoints] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const checkPermissions = async () => {
      setLoading(true);
      const user = getCurrentUser();
      setCurrentUser(user);
      
      if (!user) {
        setCanAwardPoints(false);
        setLoading(false);
        return;
      }

      try {
        const permitted = await hasPermission(user.uid, 'AWARD_POINTS');
        setCanAwardPoints(permitted);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setCanAwardPoints(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, []);

  const handleSuccess = (awardData) => {
    setShowForm(false);
    onSuccess && onSuccess(awardData);
  };

  if (loading) {
    return (
      <button disabled className="flex items-center gap-2 bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed">
        <Award size={16} />
        Loading...
      </button>
    );
  }

  if (!currentUser) {
    return (
      <button disabled className="flex items-center gap-2 bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed">
        <Shield size={16} />
        Authentication Required
      </button>
    );
  }

  if (!canAwardPoints) {
    return (
      <button disabled className="flex items-center gap-2 bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed">
        <Shield size={16} />
        No Permission
      </button>
    );
  }

  if (showForm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold">Award Points</h3>
            <button 
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4">
            <AwardPointsForm
              targetUserId={targetUserId}
              targetUserName={targetUserName}
              awarderId={awarderId}
              awarderRole={awarderRole}
              onSuccess={handleSuccess}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all transform hover:scale-105"
    >
      <Award size={16} />
      Award Points
    </button>
  );
};

export default QuickAwardPoints;