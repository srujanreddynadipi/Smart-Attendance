import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from './config';
import { 
  validateCouponData, 
  hasPermission, 
  getCurrentUser, 
  logSecurityEvent,
  sanitizeInput,
  checkRateLimit,
  PERMISSIONS
} from '../utils/security';
import { notifyCouponRedeemed } from '../utils/rewardNotifications';

// Brand partnerships configuration
export const BRAND_PARTNERS = {
  MCDONALDS: {
    name: "McDonald's",
    logo: '/brands/mcdonalds-logo.png',
    color: '#FFC72C'
  },
  KFC: {
    name: 'KFC',
    logo: '/brands/kfc-logo.png',
    color: '#E4002B'
  },
  STARBUCKS: {
    name: 'Starbucks',
    logo: '/brands/starbucks-logo.png',
    color: '#00704A'
  },
  AMAZON: {
    name: 'Amazon',
    logo: '/brands/amazon-logo.png',
    color: '#FF9900'
  },
  FLIPKART: {
    name: 'Flipkart',
    logo: '/brands/flipkart-logo.png',
    color: '#2874F0'
  }
};

// Coupon categories
export const COUPON_CATEGORIES = {
  FOOD: 'food',
  RETAIL: 'retail',
  ENTERTAINMENT: 'entertainment',
  BOOKS: 'books',
  ELECTRONICS: 'electronics'
};

// Create a new coupon (Admin only)
export const createCoupon = async (couponData) => {
  try {
    const {
      brandName,
      title,
      description,
      pointsRequired,
      validityDays,
      category,
      termsAndConditions,
      imageUrl,
      isActive = true
    } = couponData;

    // Validation
    if (!brandName || !title || !pointsRequired || pointsRequired <= 0) {
      throw new Error('Missing required coupon fields');
    }

    const coupon = {
      brandName,
      title,
      description,
      pointsRequired,
      validityDays: validityDays || 30,
      category: category || COUPON_CATEGORIES.RETAIL,
      termsAndConditions: termsAndConditions || '',
      imageUrl: imageUrl || '',
      isActive,
      totalRedemptions: 0,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'coupons'), coupon);
    
    console.log(`✅ Coupon created: ${title} - ${pointsRequired} points`);
    return { 
      success: true, 
      couponId: docRef.id,
      message: 'Coupon created successfully'
    };

  } catch (error) {
    console.error('Error creating coupon:', error);
    return { success: false, error: error.message };
  }
};

// Get all available coupons
export const getAvailableCoupons = async (category = null, isActive = true) => {
  try {
    let q = query(collection(db, 'coupons'));
    
    if (isActive) {
      q = query(q, where('isActive', '==', true));
    }
    
    if (category) {
      q = query(q, where('category', '==', category));
    }
    
    q = query(q, orderBy('pointsRequired', 'asc'));
    
    const querySnapshot = await getDocs(q);
    const coupons = [];
    
    querySnapshot.forEach((doc) => {
      coupons.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, coupons };
  } catch (error) {
    console.error('Error getting coupons:', error);
    return { success: false, error: error.message };
  }
};

// Redeem a coupon
export const redeemCoupon = async (userId, couponId, pointType = 'blue') => {
  try {
    const result = await runTransaction(db, async (transaction) => {
      // Get coupon details
      const couponRef = doc(db, 'coupons', couponId);
      const couponDoc = await transaction.get(couponRef);
      
      if (!couponDoc.exists()) {
        throw new Error('Coupon not found');
      }
      
      const couponData = couponDoc.data();
      
      if (!couponData.isActive) {
        throw new Error('Coupon is not active');
      }
      
      // Get user points
      const userPointsRef = doc(db, 'userPoints', userId);
      const userPointsDoc = await transaction.get(userPointsRef);
      
      if (!userPointsDoc.exists()) {
        throw new Error('User points not found');
      }
      
      const userPoints = userPointsDoc.data();
      const colorKey = pointType.toLowerCase();
      
      // Check if user has enough points
      if (userPoints.colorPoints[colorKey] < couponData.pointsRequired) {
        throw new Error(`Insufficient ${pointType} points. Need ${couponData.pointsRequired}, have ${userPoints.colorPoints[colorKey]}`);
      }
      
      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + couponData.validityDays);
      
      // Generate unique coupon code
      const couponCode = generateCouponCode(couponData.brandName);
      
      // Deduct points from user
      const pointsUpdate = {
        [`colorPoints.${colorKey}`]: userPoints.colorPoints[colorKey] - couponData.pointsRequired,
        totalSpent: (userPoints.totalSpent || 0) + couponData.pointsRequired,
        lastUpdated: serverTimestamp()
      };
      
      transaction.update(userPointsRef, pointsUpdate);
      
      // Update coupon redemption count
      transaction.update(couponRef, {
        totalRedemptions: (couponData.totalRedemptions || 0) + 1,
        lastUpdated: serverTimestamp()
      });
      
      // Create redeemed coupon record
      const redeemedCouponRef = doc(collection(db, 'redeemedCoupons'));
      const redeemedCouponData = {
        userId,
        couponId,
        couponCode,
        brandName: couponData.brandName,
        title: couponData.title,
        description: couponData.description,
        pointsSpent: couponData.pointsRequired,
        pointType: colorKey,
        redeemedDate: serverTimestamp(),
        expiryDate,
        status: 'active', // active, used, expired
        termsAndConditions: couponData.termsAndConditions
      };
      
      transaction.set(redeemedCouponRef, redeemedCouponData);
      
      // Create transaction record for point deduction
      const pointTransactionRef = doc(collection(db, 'pointTransactions'));
      transaction.set(pointTransactionRef, {
        fromUserId: userId,
        toUserId: 'coupon_system',
        pointType: colorKey,
        amount: couponData.pointsRequired,
        reason: `Redeemed coupon: ${couponData.title}`,
        category: 'coupon_redemption',
        timestamp: serverTimestamp(),
        status: 'completed',
        couponId,
        couponCode
      });
      
      return {
        redeemedCouponId: redeemedCouponRef.id,
        couponCode,
        expiryDate,
        couponData // Include couponData for notifications
      };
    });
    
    // Send notification about the coupon redemption
    try {
      const lowerPointType = (pointType || 'blue').toLowerCase();
      await notifyCouponRedeemed({
        userId,
        couponId,
        couponCode: result.couponCode,
        brandName: result.couponData.brandName,
        title: result.couponData.title,
        pointsSpent: result.couponData.pointsRequired,
        pointType: lowerPointType,
        expiryDate: result.expiryDate
      });
    } catch (notificationError) {
      console.error('Error sending coupon redemption notification:', notificationError);
      // Don't fail the transaction if notification fails
    }
    
    console.log(`✅ Coupon redeemed: ${couponId} by user ${userId}`);
    return { 
      success: true, 
      ...result,
      message: 'Coupon redeemed successfully!' 
    };
    
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    return { success: false, error: error.message };
  }
};

// Generate unique coupon code
const generateCouponCode = (brandName) => {
  const brandCode = brandName.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${brandCode}${timestamp}${random}`;
};

// Get user's redeemed coupons
export const getUserRedeemedCoupons = async (userId, status = null) => {
  try {
    let q = query(
      collection(db, 'redeemedCoupons'),
      where('userId', '==', userId),
      orderBy('redeemedDate', 'desc')
    );
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    const querySnapshot = await getDocs(q);
    const redeemedCoupons = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const expiryDate = data.expiryDate?.toDate?.() || new Date(data.expiryDate);
      const isExpired = new Date() > expiryDate;
      
      redeemedCoupons.push({
        id: doc.id,
        ...data,
        isExpired,
        daysUntilExpiry: Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24))
      });
    });
    
    return { success: true, redeemedCoupons };
  } catch (error) {
    console.error('Error getting redeemed coupons:', error);
    return { success: false, error: error.message };
  }
};

// Mark coupon as used
export const markCouponAsUsed = async (redeemedCouponId, userId) => {
  try {
    const redeemedCouponRef = doc(db, 'redeemedCoupons', redeemedCouponId);
    const redeemedCouponDoc = await getDoc(redeemedCouponRef);
    
    if (!redeemedCouponDoc.exists()) {
      throw new Error('Redeemed coupon not found');
    }
    
    const couponData = redeemedCouponDoc.data();
    
    if (couponData.userId !== userId) {
      throw new Error('Unauthorized: Cannot modify this coupon');
    }
    
    if (couponData.status === 'used') {
      throw new Error('Coupon already used');
    }
    
    if (couponData.status === 'expired') {
      throw new Error('Coupon has expired');
    }
    
    await updateDoc(redeemedCouponRef, {
      status: 'used',
      usedDate: serverTimestamp(),
      lastUpdated: serverTimestamp()
    });
    
    console.log(`✅ Coupon marked as used: ${redeemedCouponId}`);
    return { success: true, message: 'Coupon marked as used' };
  } catch (error) {
    console.error('Error marking coupon as used:', error);
    return { success: false, error: error.message };
  }
};

// Update coupon (Admin only)
export const updateCoupon = async (couponId, updateData) => {
  try {
    const couponRef = doc(db, 'coupons', couponId);
    const updatePayload = {
      ...updateData,
      lastUpdated: serverTimestamp()
    };
    
    await updateDoc(couponRef, updatePayload);
    
    console.log(`✅ Coupon updated: ${couponId}`);
    return { success: true, message: 'Coupon updated successfully' };
  } catch (error) {
    console.error('Error updating coupon:', error);
    return { success: false, error: error.message };
  }
};

// Delete coupon (Admin only)
export const deleteCoupon = async (couponId) => {
  try {
    await deleteDoc(doc(db, 'coupons', couponId));
    
    console.log(`✅ Coupon deleted: ${couponId}`);
    return { success: true, message: 'Coupon deleted successfully' };
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return { success: false, error: error.message };
  }
};

// Check and update expired coupons (background job)
export const updateExpiredCoupons = async () => {
  try {
    const q = query(
      collection(db, 'redeemedCoupons'),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    const batch = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const expiryDate = data.expiryDate?.toDate?.() || new Date(data.expiryDate);
      
      if (new Date() > expiryDate) {
        batch.push({
          id: doc.id,
          ref: doc.ref
        });
      }
    });
    
    // Update expired coupons
    const updatePromises = batch.map(item => 
      updateDoc(item.ref, {
        status: 'expired',
        lastUpdated: serverTimestamp()
      })
    );
    
    await Promise.all(updatePromises);
    
    console.log(`✅ Updated ${batch.length} expired coupons`);
    return { success: true, expiredCount: batch.length };
  } catch (error) {
    console.error('Error updating expired coupons:', error);
    return { success: false, error: error.message };
  }
};

// Get coupon redemption statistics (Admin)
export const getCouponStatistics = async () => {
  try {
    const [couponsSnapshot, redeemedSnapshot] = await Promise.all([
      getDocs(collection(db, 'coupons')),
      getDocs(collection(db, 'redeemedCoupons'))
    ]);
    
    let totalCoupons = 0;
    let activeCoupons = 0;
    const brandStats = {};
    
    couponsSnapshot.forEach((doc) => {
      const data = doc.data();
      totalCoupons++;
      
      if (data.isActive) {
        activeCoupons++;
      }
      
      if (!brandStats[data.brandName]) {
        brandStats[data.brandName] = {
          totalCoupons: 0,
          totalRedemptions: 0
        };
      }
      
      brandStats[data.brandName].totalCoupons++;
      brandStats[data.brandName].totalRedemptions += data.totalRedemptions || 0;
    });
    
    let totalRedemptions = 0;
    let activeRedemptions = 0;
    let expiredRedemptions = 0;
    let usedRedemptions = 0;
    
    redeemedSnapshot.forEach((doc) => {
      const data = doc.data();
      totalRedemptions++;
      
      switch (data.status) {
        case 'active':
          activeRedemptions++;
          break;
        case 'expired':
          expiredRedemptions++;
          break;
        case 'used':
          usedRedemptions++;
          break;
        default:
          break;
      }
    });
    
    return {
      success: true,
      statistics: {
        totalCoupons,
        activeCoupons,
        totalRedemptions,
        activeRedemptions,
        expiredRedemptions,
        usedRedemptions,
        brandStats
      }
    };
  } catch (error) {
    console.error('Error getting coupon statistics:', error);
    return { success: false, error: error.message };
  }
};

// Validate coupon code (for merchants)
export const validateCouponCode = async (couponCode) => {
  try {
    const q = query(
      collection(db, 'redeemedCoupons'),
      where('couponCode', '==', couponCode)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { 
        success: false, 
        error: 'Invalid coupon code',
        valid: false 
      };
    }
    
    const couponDoc = querySnapshot.docs[0];
    const couponData = couponDoc.data();
    const expiryDate = couponData.expiryDate?.toDate?.() || new Date(couponData.expiryDate);
    const isExpired = new Date() > expiryDate;
    
    return {
      success: true,
      valid: couponData.status === 'active' && !isExpired,
      coupon: {
        ...couponData,
        isExpired,
        canUse: couponData.status === 'active' && !isExpired
      }
    };
  } catch (error) {
    console.error('Error validating coupon code:', error);
    return { success: false, error: error.message };
  }
};