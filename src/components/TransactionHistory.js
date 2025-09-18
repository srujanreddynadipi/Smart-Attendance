import React, { useState, useEffect } from 'react';
import { getUserTransactionHistory } from '../firebase/pointsSystem';
import './TransactionHistory.css';

const TransactionHistory = ({ userId, isOpen, onClose, pointType = null }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (isOpen && userId) {
      fetchTransactions();
    }
  }, [isOpen, userId, filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filterType = filter === 'all' ? null : filter;
      const result = await getUserTransactionHistory(userId, 50, filterType);
      
      if (result.success) {
        setTransactions(result.transactions);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sortTransactions = (transactions) => {
    const sorted = [...transactions];
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.timestamp?.toDate?.() || b.timestamp) - new Date(a.timestamp?.toDate?.() || a.timestamp));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.timestamp?.toDate?.() || a.timestamp) - new Date(b.timestamp?.toDate?.() || b.timestamp));
      case 'amount-high':
        return sorted.sort((a, b) => b.amount - a.amount);
      case 'amount-low':
        return sorted.sort((a, b) => a.amount - b.amount);
      default:
        return sorted;
    }
  };

  const formatDate = (timestamp) => {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      default: return '🔹';
    }
  };

  const getTransactionIcon = (category) => {
    switch (category) {
      case 'attendance': return '✅';
      case 'participation': return '🙋‍♂️';
      case 'achievement': return '🏆';
      case 'bonus': return '🎁';
      case 'penalty': return '⚠️';
      case 'transfer': return '💸';
      case 'coupon_redemption': return '🎫';
      case 'admin_award': return '👑';
      default: return '📝';
    }
  };

  const getAmountDisplay = (transaction) => {
    const isReceived = transaction.toUserId === userId;
    const sign = isReceived ? '+' : '-';
    const colorClass = isReceived ? 'positive' : 'negative';
    
    return (
      <span className={`amount ${colorClass}`}>
        {sign}{transaction.amount}
      </span>
    );
  };

  if (!isOpen) return null;

  const sortedTransactions = sortTransactions(transactions);

  return (
    <div className="transaction-history-overlay">
      <div className="transaction-history-modal">
        <div className="modal-header">
          <h2>Transaction History</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-controls">
          <div className="filter-controls">
            <label>Filter by:</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Points</option>
              <option value="blue">Student Points</option>
              <option value="green">Teacher Points</option>
              <option value="purple">Parent Points</option>
            </select>
          </div>

          <div className="sort-controls">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount-high">Highest Amount</option>
              <option value="amount-low">Lowest Amount</option>
            </select>
          </div>

          <button 
            onClick={fetchTransactions} 
            className="refresh-btn"
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>

        <div className="modal-content">
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <span>Loading transactions...</span>
            </div>
          )}

          {error && (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <span>Error: {error}</span>
              <button onClick={fetchTransactions} className="retry-btn">
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && sortedTransactions.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No Transactions Found</h3>
              <p>You haven't made any point transactions yet.</p>
            </div>
          )}

          {!loading && !error && sortedTransactions.length > 0 && (
            <div className="transactions-list">
              {sortedTransactions.map((transaction, index) => (
                <div key={transaction.id || index} className="transaction-item">
                  <div className="transaction-icon">
                    {getTransactionIcon(transaction.category)}
                  </div>
                  
                  <div className="transaction-details">
                    <div className="transaction-main">
                      <span className="transaction-reason">
                        {transaction.reason || 'Point Transaction'}
                      </span>
                      <span className="transaction-category">
                        {transaction.category?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="transaction-meta">
                      <span className="transaction-date">
                        {formatDate(transaction.timestamp)}
                      </span>
                      
                      <div className="point-type-indicator">
                        <span 
                          className="point-type-badge"
                          style={{ backgroundColor: getPointTypeColor(transaction.pointType) }}
                        >
                          {getPointTypeIcon(transaction.pointType)} {transaction.pointType}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="transaction-amount">
                    {getAmountDisplay(transaction)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="transaction-summary">
            <span>Showing {sortedTransactions.length} transactions</span>
          </div>
          <button onClick={onClose} className="close-modal-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;