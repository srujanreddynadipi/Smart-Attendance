import React, { useState, useEffect } from 'react';
import { getUserRedeemedCoupons, markCouponAsUsed } from '../firebase/couponSystem';
import CouponCard from './CouponCard';
import './RedeemedCoupons.css';

const RedeemedCoupons = ({ userId, className = '' }) => {
  const [redeemedCoupons, setRedeemedCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchRedeemedCoupons();
  }, [userId, filter]);

  const fetchRedeemedCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filterStatus = filter === 'all' ? null : filter;
      const result = await getUserRedeemedCoupons(userId, filterStatus);
      
      if (result.success) {
        setRedeemedCoupons(result.redeemedCoupons);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsUsed = async (redeemedCouponId) => {
    try {
      const result = await markCouponAsUsed(redeemedCouponId, userId);
      
      if (result.success) {
        // Refresh the list to show updated status
        await fetchRedeemedCoupons();
        alert('✅ Coupon marked as used successfully!');
      } else {
        alert(`❌ Failed to mark coupon as used: ${result.error}`);
      }
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  const sortCoupons = (coupons) => {
    const sorted = [...coupons];
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => 
          new Date(b.redeemedDate?.toDate?.() || b.redeemedDate) - 
          new Date(a.redeemedDate?.toDate?.() || a.redeemedDate)
        );
      case 'oldest':
        return sorted.sort((a, b) => 
          new Date(a.redeemedDate?.toDate?.() || a.redeemedDate) - 
          new Date(b.redeemedDate?.toDate?.() || b.redeemedDate)
        );
      case 'expiry':
        return sorted.sort((a, b) => {
          const aExpiry = new Date(a.expiryDate?.toDate?.() || a.expiryDate);
          const bExpiry = new Date(b.expiryDate?.toDate?.() || b.expiryDate);
          return aExpiry - bExpiry;
        });
      case 'brand':
        return sorted.sort((a, b) => a.brandName.localeCompare(b.brandName));
      case 'points':
        return sorted.sort((a, b) => b.pointsSpent - a.pointsSpent);
      default:
        return sorted;
    }
  };

  const getStatusCounts = () => {
    const counts = {
      all: redeemedCoupons.length,
      active: 0,
      used: 0,
      expired: 0
    };
    
    redeemedCoupons.forEach(coupon => {
      if (coupon.isExpired || coupon.status === 'expired') {
        counts.expired++;
      } else if (coupon.status === 'used') {
        counts.used++;
      } else if (coupon.status === 'active') {
        counts.active++;
      }
    });
    
    return counts;
  };

  const filterOptions = [
    { value: 'all', label: 'All Coupons', icon: '🎫' },
    { value: 'active', label: 'Active', icon: '✅' },
    { value: 'used', label: 'Used', icon: '✔️' },
    { value: 'expired', label: 'Expired', icon: '❌' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'expiry', label: 'Expiring Soon' },
    { value: 'brand', label: 'Brand Name' },
    { value: 'points', label: 'Points Spent' }
  ];

  if (loading) {
    return (
      <div className={`redeemed-coupons loading ${className}`}>
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <span>Loading your redeemed coupons...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`redeemed-coupons error ${className}`}>
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <span>Error: {error}</span>
          <button onClick={fetchRedeemedCoupons} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();
  const sortedCoupons = sortCoupons(redeemedCoupons);

  return (
    <div className={`redeemed-coupons ${className}`}>
      <div className="coupons-header">
        <div className="header-content">
          <h2>🎫 My Redeemed Coupons</h2>
          <p>Manage and track your coupon redemptions</p>
        </div>
        
        <div className="status-summary">
          <div className="status-item active">
            <span className="count">{statusCounts.active}</span>
            <span className="label">Active</span>
          </div>
          <div className="status-item used">
            <span className="count">{statusCounts.used}</span>
            <span className="label">Used</span>
          </div>
          <div className="status-item expired">
            <span className="count">{statusCounts.expired}</span>
            <span className="label">Expired</span>
          </div>
        </div>
      </div>

      <div className="coupons-controls">
        <div className="filter-group">
          <label>Filter:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            {filterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sort-group">
          <label>Sort:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button 
          onClick={fetchRedeemedCoupons} 
          className="refresh-btn"
          title="Refresh"
        >
          🔄 Refresh
        </button>
      </div>

      {sortedCoupons.length === 0 ? (
        <div className="empty-coupons">
          <div className="empty-icon">🎫</div>
          <h3>No Redeemed Coupons</h3>
          <p>
            {filter === 'all' 
              ? "You haven't redeemed any coupons yet. Visit the coupon store to start earning rewards!"
              : `No ${filter} coupons found. Try changing the filter to see more coupons.`
            }
          </p>
        </div>
      ) : (
        <div className="coupons-grid">
          {sortedCoupons.map(coupon => (
            <div key={coupon.id} className="coupon-wrapper">
              <CouponCard
                coupon={{
                  id: coupon.couponId,
                  brandName: coupon.brandName,
                  title: coupon.title,
                  description: coupon.description,
                  pointsRequired: coupon.pointsSpent,
                  category: coupon.category || 'other',
                  termsAndConditions: coupon.termsAndConditions
                }}
                isRedeemed={true}
                redeemedData={coupon}
                showRedeemButton={false}
              />
              
              {coupon.status === 'active' && !coupon.isExpired && (
                <div className="coupon-actions">
                  <button
                    className="mark-used-btn"
                    onClick={() => handleMarkAsUsed(coupon.id)}
                  >
                    ✅ Mark as Used
                  </button>
                  
                  {coupon.daysUntilExpiry <= 7 && coupon.daysUntilExpiry > 0 && (
                    <div className="expiry-warning">
                      ⚠️ Expires in {coupon.daysUntilExpiry} day{coupon.daysUntilExpiry !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="coupons-footer">
        <div className="footer-stats">
          <span>Showing {sortedCoupons.length} of {redeemedCoupons.length} coupons</span>
        </div>
        <div className="footer-tips">
          <small>
            💡 Tip: Use coupon codes at participating merchants. 
            Mark coupons as "used" to keep track of your savings!
          </small>
        </div>
      </div>
    </div>
  );
};

export default RedeemedCoupons;