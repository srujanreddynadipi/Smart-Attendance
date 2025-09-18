import React, { useState, useEffect } from 'react';
import { getUserPoints } from '../firebase/pointsSystem';
import { RefreshCw, GraduationCap, Users, User } from 'lucide-react';

const PointsBalance = ({ userId, showDetailed = false, className = '' }) => {
  const [pointsData, setPointsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setError('User ID required');
      setLoading(false);
      return;
    }

    fetchPointsData();
  }, [userId]);

  const fetchPointsData = async () => {
    try {
      setLoading(true);
      const result = await getUserPoints(userId);
      
      if (result.success) {
        setPointsData(result.points);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const PointDisplay = ({ color, points, label, icon: Icon }) => (
    <div className={`bg-white/20 backdrop-blur-sm border-l-4 ${
      color === 'blue' ? 'border-blue-400' : 
      color === 'green' ? 'border-green-400' : 
      'border-purple-400'
    } rounded-lg p-4 flex items-center gap-3 hover:bg-white/25 transition-colors`}>
      <div className="text-2xl opacity-90">
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <div className="text-xl font-bold text-white">{formatNumber(points)}</div>
        <div className="text-sm text-white/80">{label} Points</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white shadow-lg ${className}`}>
        <div className="flex items-center justify-center gap-3">
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading points...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">⚠️</div>
            <span>Error: {error}</span>
          </div>
          <button 
            onClick={fetchPointsData} 
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!pointsData) {
    return (
      <div className={`bg-gray-100 rounded-xl p-6 text-gray-600 ${className}`}>
        <div className="flex items-center justify-center gap-3">
          <div className="text-2xl">🎯</div>
          <span>No points data available</span>
        </div>
      </div>
    );
  }

  const { colorPoints, totalEarned, totalSpent } = pointsData;

  if (showDetailed) {
    return (
      <div className={`bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white shadow-lg ${className}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold">Your Points Balance</h3>
          <button 
            onClick={fetchPointsData} 
            className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all hover:rotate-180"
            title="Refresh"
          >
            <RefreshCw size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <PointDisplay 
            color="blue" 
            points={colorPoints.blue} 
            label="Student" 
            icon={GraduationCap}
          />
          <PointDisplay 
            color="green" 
            points={colorPoints.green} 
            label="Teacher" 
            icon={Users}
          />
          <PointDisplay 
            color="purple" 
            points={colorPoints.purple} 
            label="Parent" 
            icon={User}
          />
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-white/80 uppercase tracking-wide mb-1">Total Earned</div>
              <div className="text-lg font-semibold text-green-300">{formatNumber(totalEarned || 0)}</div>
            </div>
            <div>
              <div className="text-sm text-white/80 uppercase tracking-wide mb-1">Total Spent</div>
              <div className="text-lg font-semibold text-red-300">{formatNumber(totalSpent || 0)}</div>
            </div>
            <div>
              <div className="text-sm text-white/80 uppercase tracking-wide mb-1">Available</div>
              <div className="text-lg font-semibold text-yellow-300">
                {formatNumber(colorPoints.blue + colorPoints.green + colorPoints.purple)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact view
  const totalPoints = colorPoints.blue + colorPoints.green + colorPoints.purple;
  
  return (
    <div className={`bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-4 text-white shadow-lg ${className}`}>
      <div className="flex justify-between items-center">
        <div className="text-center">
          <div className="text-2xl font-bold">{formatNumber(totalPoints)}</div>
          <div className="text-sm text-white/80">Total Points</div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full text-xs" 
               title={`${colorPoints.blue} Student Points`}>
            <GraduationCap size={14} />
            {formatNumber(colorPoints.blue)}
          </div>
          <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full text-xs" 
               title={`${colorPoints.green} Teacher Points`}>
            <Users size={14} />
            {formatNumber(colorPoints.green)}
          </div>
          <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full text-xs" 
               title={`${colorPoints.purple} Parent Points`}>
            <User size={14} />
            {formatNumber(colorPoints.purple)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsBalance;