import React, { useState } from 'react';
import { awardPoints, POINT_TYPES, POINT_CATEGORIES } from '../firebase/pointsSystem';
import './AwardPointsForm.css';

const AwardPointsForm = ({ 
  targetUserId, 
  targetUserName, 
  awarderId, 
  awarderRole, 
  onSuccess, 
  onCancel,
  className = '' 
}) => {
  const [formData, setFormData] = useState({
    pointType: 'blue',
    amount: '',
    reason: '',
    category: 'achievement'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Define point types based on awarder role
  const getAvailablePointTypes = () => {
    switch (awarderRole) {
      case 'teacher':
        return [
          { value: 'blue', label: 'Student Points', icon: '🎓' },
          { value: 'green', label: 'Teacher Points', icon: '👨‍🏫' }
        ];
      case 'parent':
        return [
          { value: 'purple', label: 'Parent Points', icon: '👨‍👩‍👧‍👦' }
        ];
      case 'admin':
        return [
          { value: 'blue', label: 'Student Points', icon: '🎓' },
          { value: 'green', label: 'Teacher Points', icon: '👨‍🏫' },
          { value: 'purple', label: 'Parent Points', icon: '👨‍👩‍👧‍👦' }
        ];
      default:
        return [{ value: 'blue', label: 'Student Points', icon: '🎓' }];
    }
  };

  const availableCategories = [
    { value: 'attendance', label: 'Attendance', icon: '✅' },
    { value: 'participation', label: 'Participation', icon: '🙋‍♂️' },
    { value: 'achievement', label: 'Achievement', icon: '🏆' },
    { value: 'behavior', label: 'Good Behavior', icon: '😊' },
    { value: 'homework', label: 'Homework', icon: '📝' },
    { value: 'bonus', label: 'Bonus', icon: '🎁' },
    { value: 'other', label: 'Other', icon: '📋' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    
    if (!formData.reason.trim()) {
      setError('Please provide a reason for awarding points');
      return;
    }
    
    if (formData.reason.trim().length < 5) {
      setError('Reason must be at least 5 characters long');
      return;
    }

    try {
      setLoading(true);
      
      const result = await awardPoints(
        awarderId,
        targetUserId,
        parseFloat(formData.amount),
        formData.pointType,
        formData.reason.trim(),
        formData.category
      );
      
      if (result.success) {
        onSuccess && onSuccess({
          amount: parseFloat(formData.amount),
          pointType: formData.pointType,
          reason: formData.reason.trim(),
          category: formData.category
        });
        
        // Reset form
        setFormData({
          pointType: formData.pointType,
          amount: '',
          reason: '',
          category: 'achievement'
        });
      } else {
        setError(result.error || 'Failed to award points');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const availablePointTypes = getAvailablePointTypes();

  return (
    <div className={`award-points-form ${className}`}>
      <div className="form-header">
        <h3>Award Points</h3>
        <p>Awarding points to: <strong>{targetUserName || targetUserId}</strong></p>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="points-form">
        <div className="form-group">
          <label htmlFor="pointType">Point Type</label>
          <div className="point-type-options">
            {availablePointTypes.map(type => (
              <label 
                key={type.value} 
                className={`point-type-option ${formData.pointType === type.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="pointType"
                  value={type.value}
                  checked={formData.pointType === type.value}
                  onChange={handleInputChange}
                />
                <span className="point-type-content">
                  <span className="point-icon">{type.icon}</span>
                  <span className="point-label">{type.label}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Enter points amount"
              min="1"
              max="1000"
              step="1"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              disabled={loading}
            >
              {availableCategories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reason">Reason</label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            placeholder="Explain why you're awarding these points..."
            rows="3"
            maxLength="200"
            required
            disabled={loading}
          />
          <div className="char-count">
            {formData.reason.length}/200 characters
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="cancel-btn"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !formData.amount || !formData.reason.trim()}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Awarding...
              </>
            ) : (
              <>
                🎯 Award {formData.amount || '0'} Points
              </>
            )}
          </button>
        </div>
      </form>

      <div className="form-footer">
        <small>
          💡 Points will be immediately added to the recipient's balance and recorded in transaction history.
        </small>
      </div>
    </div>
  );
};

export default AwardPointsForm;