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
  limit as firestoreLimit,
  serverTimestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { getCurrentUser, logSecurityEvent } from '../utils/security';

// Notification types specific to rewards system
export const REWARD_NOTIFICATION_TYPES = {
  POINTS_AWARDED: 'points_awarded',
  POINTS_RECEIVED: 'points_received',
  COUPON_REDEEMED: 'coupon_redeemed',
  LEADERBOARD_UPDATE: 'leaderboard_update',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  COUPON_EXPIRED: 'coupon_expired',
  BULK_POINTS_AWARDED: 'bulk_points_awarded',
  SYSTEM_ANNOUNCEMENT: 'system_announcement'
};

/**
 * Create a reward notification
 */
export const createRewardNotification = async (data) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    const notification = {
      ...data,
      createdAt: serverTimestamp(),
      createdBy: currentUser.uid,
      read: false,
      priority: data.priority || 'normal' // low, normal, high, urgent
    };

    const docRef = await addDoc(collection(db, 'rewardNotifications'), notification);
    
    // Log the notification creation
    await logSecurityEvent(currentUser.uid, 'NOTIFICATION_CREATED', {
      notificationId: docRef.id,
      type: data.type,
      recipientId: data.recipientId
    });

    return { success: true, notificationId: docRef.id };
  } catch (error) {
    console.error('Error creating reward notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Notify when points are awarded
 */
export const notifyPointsAwarded = async (awardData) => {
  const { fromUserId, toUserId, amount, pointType, reason, category } = awardData;
  
  try {
    // Notification for recipient
    await createRewardNotification({
      type: REWARD_NOTIFICATION_TYPES.POINTS_RECEIVED,
      recipientId: toUserId,
      title: '🎉 Points Received!',
      message: `You received ${amount} ${pointType} points for ${reason}`,
      data: {
        amount,
        pointType,
        reason,
        category,
        fromUserId
      },
      priority: 'normal'
    });

    // Notification for awarder (if different from recipient)
    if (fromUserId !== toUserId) {
      await createRewardNotification({
        type: REWARD_NOTIFICATION_TYPES.POINTS_AWARDED,
        recipientId: fromUserId,
        title: '✅ Points Awarded',
        message: `You successfully awarded ${amount} ${pointType} points`,
        data: {
          amount,
          pointType,
          reason,
          category,
          toUserId
        },
        priority: 'low'
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating points award notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Notify when coupon is redeemed
 */
export const notifyCouponRedeemed = async (redemptionData) => {
  const { userId, couponTitle, pointsCost, brand } = redemptionData;
  
  try {
    await createRewardNotification({
      type: REWARD_NOTIFICATION_TYPES.COUPON_REDEEMED,
      recipientId: userId,
      title: '🎫 Coupon Redeemed!',
      message: `You successfully redeemed "${couponTitle}" from ${brand} for ${pointsCost} points`,
      data: {
        couponTitle,
        pointsCost,
        brand,
        redemptionDate: new Date().toISOString()
      },
      priority: 'normal'
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating coupon redemption notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Notify about leaderboard position changes
 */
export const notifyLeaderboardUpdate = async (userData) => {
  const { userId, newPosition, previousPosition, totalPoints } = userData;
  
  try {
    let title = '📊 Leaderboard Update';
    let message = `Your current position: #${newPosition} with ${totalPoints} points`;
    let priority = 'low';

    // Special notifications for significant changes
    if (newPosition <= 3 && (previousPosition > 3 || !previousPosition)) {
      title = '🏆 Top 3 Achievement!';
      message = `Congratulations! You're now #${newPosition} on the leaderboard!`;
      priority = 'high';
    } else if (newPosition <= 10 && (previousPosition > 10 || !previousPosition)) {
      title = '⭐ Top 10 Achievement!';
      message = `Great job! You've reached #${newPosition} on the leaderboard!`;
      priority = 'normal';
    } else if (previousPosition && newPosition < previousPosition) {
      const improvement = previousPosition - newPosition;
      title = '📈 Leaderboard Climb!';
      message = `You moved up ${improvement} position${improvement > 1 ? 's' : ''} to #${newPosition}!`;
      priority = 'normal';
    }

    await createRewardNotification({
      type: REWARD_NOTIFICATION_TYPES.LEADERBOARD_UPDATE,
      recipientId: userId,
      title,
      message,
      data: {
        newPosition,
        previousPosition,
        totalPoints,
        improvement: previousPosition ? previousPosition - newPosition : 0
      },
      priority
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating leaderboard notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Notify about achievements unlocked
 */
export const notifyAchievementUnlocked = async (achievementData) => {
  const { userId, achievementTitle, achievementDescription, pointsAwarded } = achievementData;
  
  try {
    await createRewardNotification({
      type: REWARD_NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED,
      recipientId: userId,
      title: '🏅 Achievement Unlocked!',
      message: `"${achievementTitle}" - ${achievementDescription}`,
      data: {
        achievementTitle,
        achievementDescription,
        pointsAwarded,
        unlockedAt: new Date().toISOString()
      },
      priority: 'high'
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating achievement notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Notify about expiring coupons
 */
export const notifyExpiringCoupons = async (expirationData) => {
  const { userId, coupons } = expirationData;
  
  try {
    for (const coupon of coupons) {
      await createRewardNotification({
        type: REWARD_NOTIFICATION_TYPES.COUPON_EXPIRED,
        recipientId: userId,
        title: '⏰ Coupon Expiring Soon',
        message: `Your "${coupon.title}" coupon expires in ${coupon.daysUntilExpiry} days`,
        data: {
          couponId: coupon.id,
          couponTitle: coupon.title,
          expiryDate: coupon.expiryDate,
          daysUntilExpiry: coupon.daysUntilExpiry
        },
        priority: 'normal'
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating expiring coupon notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create system-wide announcements
 */
export const createSystemAnnouncement = async (announcementData) => {
  const { targetUserIds, title, message, priority = 'normal' } = announcementData;
  
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    const notifications = targetUserIds.map(userId => ({
      type: REWARD_NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
      recipientId: userId,
      title,
      message,
      data: {
        isSystemAnnouncement: true,
        createdBy: currentUser.uid
      },
      priority,
      createdAt: serverTimestamp(),
      createdBy: currentUser.uid,
      read: false
    }));

    // Batch create notifications
    const batch = writeBatch(db);
    notifications.forEach(notification => {
      const docRef = doc(collection(db, 'rewardNotifications'));
      batch.set(docRef, notification);
    });

    await batch.commit();

    await logSecurityEvent(currentUser.uid, 'SYSTEM_ANNOUNCEMENT_CREATED', {
      targetUserCount: targetUserIds.length,
      title,
      priority
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating system announcement:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get notifications for a user
 */
export const getUserNotifications = async (userId, options = {}) => {
  try {
    const { 
      limit = 20, 
      unreadOnly = false, 
      types = null 
    } = options;

    let q = query(
      collection(db, 'rewardNotifications'),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    if (unreadOnly) {
      q = query(
        collection(db, 'rewardNotifications'),
        where('recipientId', '==', userId),
        where('read', '==', false),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );
    }

    if (types && types.length > 0) {
      q = query(
        collection(db, 'rewardNotifications'),
        where('recipientId', '==', userId),
        where('type', 'in', types),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );
    }

    const querySnapshot = await getDocs(q);
    const notifications = [];

    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      });
    });

    return { success: true, notifications };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return { success: false, error: error.message, notifications: [] };
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'rewardNotifications', notificationId), {
      read: true,
      readAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Set up real-time notification listener
 */
export const setupNotificationListener = (userId, callback) => {
  const q = query(
    collection(db, 'rewardNotifications'),
    where('recipientId', '==', userId),
    where('read', '==', false),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const notifications = [];
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      });
    });

    callback(notifications);
  }, (error) => {
    console.error('Error in notification listener:', error);
    callback([]);
  });
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async (userId) => {
  try {
    const allNotificationsQuery = query(
      collection(db, 'rewardNotifications'),
      where('recipientId', '==', userId)
    );

    const unreadNotificationsQuery = query(
      collection(db, 'rewardNotifications'),
      where('recipientId', '==', userId),
      where('read', '==', false)
    );

    const [allSnapshot, unreadSnapshot] = await Promise.all([
      getDocs(allNotificationsQuery),
      getDocs(unreadNotificationsQuery)
    ]);

    return {
      success: true,
      stats: {
        total: allSnapshot.size,
        unread: unreadSnapshot.size,
        read: allSnapshot.size - unreadSnapshot.size
      }
    };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return { 
      success: false, 
      error: error.message, 
      stats: { total: 0, unread: 0, read: 0 } 
    };
  }
};

// Clear/delete a notification
export const clearUserNotification = async (userId, notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notificationRef);
    
    console.log(`✅ Notification ${notificationId} cleared for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error clearing notification:', error);
    throw error;
  }
};

export default {
  createRewardNotification,
  notifyPointsAwarded,
  notifyCouponRedeemed,
  notifyLeaderboardUpdate,
  notifyAchievementUnlocked,
  notifyExpiringCoupons,
  createSystemAnnouncement,
  getUserNotifications,
  markNotificationAsRead,
  clearUserNotification,
  setupNotificationListener,
  getNotificationStats,
  REWARD_NOTIFICATION_TYPES
};