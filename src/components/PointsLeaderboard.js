import React, { useState, useEffect } from 'react';
import { getPointsLeaderboard } from '../firebase/pointsSystem';
import './PointsLeaderboard.css';

const PointsLeaderboard = ({ 
  pointType = 'all', 
  limit = 10, 
  showCurrentUser = true, 
  currentUserId = null,
  className = '' 
}) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPointType, setSelectedPointType] = useState(pointType);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedPointType, limit]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getPointsLeaderboard(
        selectedPointType === 'all' ? null : selectedPointType,
        limit
      );
      
      if (result.success) {
        setLeaderboardData(result.leaderboard);
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

  const getPointTypeColor = (type) => {
    switch (type) {
      case 'blue': return '#3498db';
      case 'green': return '#27ae60';
      case 'purple': return '#9b59b6';
      default: return '#95a5a6';
    }
  };

  const getPointTypeIcon = (type) => {
    switch (type) {
      case 'blue': return '🎓';
      case 'green': return '👨‍🏫';
      case 'purple': return '👨‍👩‍👧‍👦';
      default: return '🏆';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankClass = (rank) => {
    switch (rank) {
      case 1: return 'rank-gold';
      case 2: return 'rank-silver';
      case 3: return 'rank-bronze';
      default: return 'rank-default';
    }
  };

  const pointTypeOptions = [
    { value: 'all', label: 'All Points', icon: '🏆' },
    { value: 'blue', label: 'Student Points', icon: '🎓' },
    { value: 'green', label: 'Teacher Points', icon: '👨‍🏫' },
    { value: 'purple', label: 'Parent Points', icon: '👨‍👩‍👧‍👦' }
  ];

  if (loading) {
    return (
      <div className={`leaderboard-container loading ${className}`}>
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <span>Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`leaderboard-container error ${className}`}>
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <span>Error: {error}</span>
          <button onClick={fetchLeaderboard} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`leaderboard-container ${className}`}>
      <div className="leaderboard-header">
        <h3>🏆 Leaderboard</h3>
        <button onClick={fetchLeaderboard} className="refresh-btn" title="Refresh">
          🔄
        </button>
      </div>

      <div className="point-type-selector">
        {pointTypeOptions.map(option => (
          <button
            key={option.value}
            className={`point-type-btn ${selectedPointType === option.value ? 'active' : ''}`}
            onClick={() => setSelectedPointType(option.value)}
          >
            <span className="btn-icon">{option.icon}</span>
            <span className="btn-label">{option.label}</span>
          </button>
        ))}
      </div>

      {leaderboardData.length === 0 ? (
        <div className="empty-leaderboard">
          <div className="empty-icon">📊</div>
          <h4>No Data Available</h4>
          <p>Be the first to earn points and appear on the leaderboard!</p>
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaderboardData.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = currentUserId && user.userId === currentUserId;
            const totalPoints = selectedPointType === 'all' 
              ? user.colorPoints.blue + user.colorPoints.green + user.colorPoints.purple
              : user.colorPoints[selectedPointType] || 0;

            return (
              <div 
                key={user.userId} 
                className={`leaderboard-item ${getRankClass(rank)} ${isCurrentUser ? 'current-user' : ''}`}
              >
                <div className="rank-section">
                  <div className="rank-icon">
                    {getRankIcon(rank)}
                  </div>
                </div>

                <div className="user-info">
                  <div className="user-name">
                    {user.displayName || user.userId}
                    {isCurrentUser && (
                      <span className="current-user-badge">You</span>
                    )}
                  </div>
                  <div className="user-stats">
                    {selectedPointType === 'all' ? (
                      <div className="all-points-breakdown">
                        <span className="point-breakdown blue">
                          🎓 {formatNumber(user.colorPoints.blue)}
                        </span>
                        <span className="point-breakdown green">
                          👨‍🏫 {formatNumber(user.colorPoints.green)}
                        </span>
                        <span className="point-breakdown purple">
                          👨‍👩‍👧‍👦 {formatNumber(user.colorPoints.purple)}
                        </span>
                      </div>
                    ) : (
                      <div className="single-point-type">
                        <span 
                          className="point-type-indicator"
                          style={{ backgroundColor: getPointTypeColor(selectedPointType) }}
                        >
                          {getPointTypeIcon(selectedPointType)} {selectedPointType} points
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="points-section">
                  <div className="points-value">
                    {formatNumber(totalPoints)}
                  </div>
                  <div className="points-label">
                    {selectedPointType === 'all' ? 'Total' : 'Points'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="leaderboard-footer">
        <small>
          🎯 Rankings update in real-time based on point activities
        </small>
      </div>
    </div>
  );
};

export default PointsLeaderboard;