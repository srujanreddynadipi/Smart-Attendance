import React, { useState } from 'react';
import { BRAND_PARTNERS } from '../firebase/couponSystem';
import './CouponCard.css';

const CouponCard = ({ 
  coupon, 
  userPoints = null, 
  onRedeem = null, 
  isRedeeming = false, 
  showRedeemButton = true,
  isRedeemed = false,
  redeemedData = null,
  className = '' 
}) => {
  const [selectedPointType, setSelectedPointType] = useState('blue');
  const [showDetails, setShowDetails] = useState(false);

  const brandInfo = BRAND_PARTNERS[coupon.brandName] || {
    name: coupon.brandName,
    logo: '/brands/default-logo.png',
    color: '#667eea'
  };

  const formatExpiryDate = (date) => {
    if (!date) return 'No expiry';
    const expiryDate = date.toDate?.() || new Date(date);
    return expiryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'food': return '🍔';
      case 'retail': return '🛒';
      case 'entertainment': return '🎬';
      case 'books': return '📚';
      case 'electronics': return '📱';
      default: return '🎫';
    }
  };

  const getAffordabilityStatus = () => {
    if (!userPoints) return { affordable: false, pointType: null };
    
    const { colorPoints } = userPoints;
    const affordable = {
      blue: colorPoints.blue >= coupon.pointsRequired,
      green: colorPoints.green >= coupon.pointsRequired,
      purple: colorPoints.purple >= coupon.pointsRequired
    };
    
    return {
      affordable: affordable.blue || affordable.green || affordable.purple,
      pointTypes: affordable
    };
  };

  const handleRedeemClick = () => {
    if (onRedeem) {
      onRedeem(coupon.id, selectedPointType);
    }
  };

  const affordability = getAffordabilityStatus();

  return (
    <div className={`coupon-card ${isRedeemed ? 'redeemed' : ''} ${className}`}>
      <div className="card-header" style={{ backgroundColor: brandInfo.color }}>
        <div className="brand-info">
          <img 
            src={brandInfo.logo} 
            alt={brandInfo.name}
            className="brand-logo"
            onError={(e) => {
              e.target.src = '/brands/default-logo.png';
            }}
          />
          <div className="brand-details">
            <h3 className="brand-name">{brandInfo.name}</h3>
            <div className="category-badge">
              {getCategoryIcon(coupon.category)} {coupon.category}
            </div>
          </div>
        </div>
        
        <div className="points-required">
          <span className="points-value">{coupon.pointsRequired}</span>
          <span className="points-label">Points</span>
        </div>
      </div>

      <div className="card-content">
        <h4 className="coupon-title">{coupon.title}</h4>
        
        {coupon.description && (
          <p className="coupon-description">{coupon.description}</p>
        )}

        {isRedeemed && redeemedData && (
          <div className="redeemed-info">
            <div className="coupon-code">
              <label>Coupon Code:</label>
              <span className="code-value">{redeemedData.couponCode}</span>
              <button 
                className="copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(redeemedData.couponCode);
                  alert('Coupon code copied to clipboard!');
                }}
                title="Copy to clipboard"
              >
                📋
              </button>
            </div>
            
            <div className="redemption-details">
              <div className="detail-item">
                <span>Redeemed:</span>
                <span>{formatExpiryDate(redeemedData.redeemedDate)}</span>
              </div>
              <div className="detail-item">
                <span>Expires:</span>
                <span>{formatExpiryDate(redeemedData.expiryDate)}</span>
              </div>
              <div className="detail-item">
                <span>Status:</span>
                <span className={`status-badge ${redeemedData.status}`}>
                  {redeemedData.status === 'active' && !redeemedData.isExpired && '✅ Active'}
                  {redeemedData.status === 'used' && '✅ Used'}
                  {redeemedData.status === 'expired' || redeemedData.isExpired && '❌ Expired'}
                </span>
              </div>
            </div>
          </div>
        )}

        {showRedeemButton && !isRedeemed && (
          <div className="redemption-section">
            {userPoints && (
              <div className="point-selector">
                <label>Redeem with:</label>
                <div className="point-options">
                  {Object.entries(affordability.pointTypes).map(([type, canAfford]) => {
                    const icons = {
                      blue: '🎓',
                      green: '👨‍🏫',
                      purple: '👨‍👩‍👧‍👦'
                    };
                    
                    return (
                      <label 
                        key={type}
                        className={`point-option ${!canAfford ? 'disabled' : ''} ${selectedPointType === type ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="pointType"
                          value={type}
                          checked={selectedPointType === type}
                          onChange={(e) => setSelectedPointType(e.target.value)}
                          disabled={!canAfford}
                        />
                        <span className="option-content">
                          <span className="option-icon">{icons[type]}</span>
                          <span className="option-text">
                            {userPoints.colorPoints[type]} {type}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              className={`redeem-btn ${!affordability.affordable ? 'disabled' : ''}`}
              onClick={handleRedeemClick}
              disabled={!affordability.affordable || isRedeeming || !onRedeem}
            >
              {isRedeeming ? (
                <>
                  <span className="loading-spinner"></span>
                  Redeeming...
                </>
              ) : !affordability.affordable ? (
                <>
                  ❌ Insufficient Points
                </>
              ) : (
                <>
                  🎫 Redeem Coupon
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="card-footer">
        <button 
          className="details-btn"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '▲ Hide Details' : '▼ Show Details'}
        </button>
        
        {!isRedeemed && (
          <div className="validity-info">
            Valid for {coupon.validityDays} days after redemption
          </div>
        )}
      </div>

      {showDetails && (
        <div className="card-details">
          <div className="details-content">
            <h5>Terms & Conditions</h5>
            <p>
              {coupon.termsAndConditions || 
               'Present this coupon code at the time of purchase. Cannot be combined with other offers. Valid only for the specified validity period.'}
            </p>
            
            <div className="coupon-stats">
              <div className="stat-item">
                <span className="stat-label">Redemptions:</span>
                <span className="stat-value">{coupon.totalRedemptions || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Category:</span>
                <span className="stat-value">{coupon.category}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Validity:</span>
                <span className="stat-value">{coupon.validityDays} days</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponCard;