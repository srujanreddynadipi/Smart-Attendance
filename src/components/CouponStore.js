import React, { useState, useEffect } from 'react';
import { getAvailableCoupons, redeemCoupon, BRAND_PARTNERS, COUPON_CATEGORIES } from '../firebase/couponSystem';
import { getUserPoints } from '../firebase/pointsSystem';
import CouponCard from './CouponCard';
import './CouponStore.css';

const CouponStore = ({ userId, userRole, className = '' }) => {
  const [coupons, setCoupons] = useState([]);
  const [userPoints, setUserPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: 'all',
    pointType: 'all',
    sortBy: 'points-low'
  });

  useEffect(() => {
    fetchData();
  }, [userId, filters.category]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [couponsResult, pointsResult] = await Promise.all([
        getAvailableCoupons(filters.category === 'all' ? null : filters.category),
        getUserPoints(userId)
      ]);
      
      if (couponsResult.success) {
        setCoupons(couponsResult.coupons);
      } else {
        setError(couponsResult.error);
      }
      
      if (pointsResult.success) {
        setUserPoints(pointsResult.points);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemCoupon = async (couponId, pointType) => {
    try {
      setRedeeming(couponId);
      
      const result = await redeemCoupon(userId, couponId, pointType);
      
      if (result.success) {
        // Refresh data to show updated points and potentially remove redeemed coupon
        await fetchData();
        
        // Show success message
        alert(`🎉 Coupon redeemed successfully!\nCoupon Code: ${result.couponCode}\nExpires: ${result.expiryDate?.toDateString?.() || 'Check details'}`);
      } else {
        alert(`❌ Failed to redeem coupon: ${result.error}`);
      }
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setRedeeming(null);
    }
  };

  const filterAndSortCoupons = () => {
    let filtered = [...coupons];
    
    // Filter by point affordability
    if (filters.pointType !== 'all' && userPoints) {
      const availablePoints = userPoints.colorPoints[filters.pointType] || 0;
      filtered = filtered.filter(coupon => coupon.pointsRequired <= availablePoints);
    }
    
    // Sort coupons
    switch (filters.sortBy) {
      case 'points-low':
        filtered.sort((a, b) => a.pointsRequired - b.pointsRequired);
        break;
      case 'points-high':
        filtered.sort((a, b) => b.pointsRequired - a.pointsRequired);
        break;
      case 'brand':
        filtered.sort((a, b) => a.brandName.localeCompare(b.brandName));
        break;
      case 'newest':
        filtered.sort((a, b) => (b.createdAt?.toDate?.() || new Date(b.createdAt)) - (a.createdAt?.toDate?.() || new Date(a.createdAt)));
        break;
      default:
        break;
    }
    
    return filtered;
  };

  const categoryOptions = [
    { value: 'all', label: 'All Categories', icon: '🛍️' },
    { value: COUPON_CATEGORIES.FOOD, label: 'Food & Dining', icon: '🍔' },
    { value: COUPON_CATEGORIES.RETAIL, label: 'Retail & Shopping', icon: '🛒' },
    { value: COUPON_CATEGORIES.ENTERTAINMENT, label: 'Entertainment', icon: '🎬' },
    { value: COUPON_CATEGORIES.BOOKS, label: 'Books & Education', icon: '📚' },
    { value: COUPON_CATEGORIES.ELECTRONICS, label: 'Electronics', icon: '📱' }
  ];

  const pointTypeOptions = [
    { value: 'all', label: 'All Points', icon: '🏆' },
    { value: 'blue', label: 'Student Points', icon: '🎓' },
    { value: 'green', label: 'Teacher Points', icon: '👨‍🏫' },
    { value: 'purple', label: 'Parent Points', icon: '👨‍👩‍👧‍👦' }
  ];

  const sortOptions = [
    { value: 'points-low', label: 'Points: Low to High' },
    { value: 'points-high', label: 'Points: High to Low' },
    { value: 'brand', label: 'Brand Name' },
    { value: 'newest', label: 'Newest First' }
  ];

  const filteredCoupons = filterAndSortCoupons();

  if (loading) {
    return (
      <div className={`coupon-store loading ${className}`}>
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <span>Loading coupon store...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`coupon-store error ${className}`}>
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <span>Error: {error}</span>
          <button onClick={fetchData} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`coupon-store ${className}`}>
      <div className="store-header">
        <div className="header-content">
          <h2>🎫 Coupon Store</h2>
          <p>Redeem your points for exclusive coupons and deals!</p>
        </div>
        
        {userPoints && (
          <div className="user-points-summary">
            <div className="points-item blue">
              <span className="icon">🎓</span>
              <span className="value">{userPoints.colorPoints.blue}</span>
            </div>
            <div className="points-item green">
              <span className="icon">👨‍🏫</span>
              <span className="value">{userPoints.colorPoints.green}</span>
            </div>
            <div className="points-item purple">
              <span className="icon">👨‍👩‍👧‍👦</span>
              <span className="value">{userPoints.colorPoints.purple}</span>
            </div>
          </div>
        )}
      </div>

      <div className="store-controls">
        <div className="filter-group">
          <label>Category:</label>
          <select 
            value={filters.category} 
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Affordable with:</label>
          <select 
            value={filters.pointType} 
            onChange={(e) => setFilters(prev => ({ ...prev, pointType: e.target.value }))}
          >
            {pointTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Sort by:</label>
          <select 
            value={filters.sortBy} 
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button onClick={fetchData} className="refresh-btn" title="Refresh">
          🔄 Refresh
        </button>
      </div>

      {filteredCoupons.length === 0 ? (
        <div className="empty-store">
          <div className="empty-icon">🎫</div>
          <h3>No Coupons Available</h3>
          <p>
            {filters.category !== 'all' || filters.pointType !== 'all' 
              ? 'Try adjusting your filters to see more coupons.'
              : 'Check back later for new deals and offers!'
            }
          </p>
        </div>
      ) : (
        <div className="coupons-grid">
          {filteredCoupons.map(coupon => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              userPoints={userPoints}
              onRedeem={handleRedeemCoupon}
              isRedeeming={redeeming === coupon.id}
              showRedeemButton={true}
            />
          ))}
        </div>
      )}

      <div className="store-footer">
        <div className="footer-stats">
          <span>Showing {filteredCoupons.length} of {coupons.length} coupons</span>
        </div>
        <div className="footer-info">
          <small>
            💡 Points are deducted immediately upon redemption. 
            Redeemed coupons expire after their validity period.
          </small>
        </div>
      </div>
    </div>
  );
};

export default CouponStore;