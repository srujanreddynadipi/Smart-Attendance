import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { 
  validatePointsTransaction, 
  hasPermission, 
  getCurrentUser, 
  logSecurityEvent,
  sanitizeInput,
  checkRateLimit,
  PERMISSIONS
} from '../utils/security';
import { 
  notifyPointsAwarded, 
  notifyLeaderboardUpdate 
} from '../utils/rewardNotifications';

// Point types configuration
export const POINT_TYPES = {
  STUDENT: {
    color: 'blue',
    name: 'Blue Points',
    code: 'BLUE'
  },
  TEACHER: {
    color: 'green', 
    name: 'Green Points',
    code: 'GREEN'
  },
  PARENT: {
    color: 'purple',
    name: 'Purple Points', 
    code: 'PURPLE'
  }
};

// Point categories for transactions
export const POINT_CATEGORIES = {
  ACADEMIC: 'academic',
  ATTENDANCE: 'attendance', 
  MENTORSHIP: 'mentorship',
  FRIENDSHIP: 'friendship',
  BEHAVIORAL: 'behavioral',
  ASSESSMENT: 'assessment',
  COMMUNICATION: 'communication',
  RESPONSIBILITY: 'responsibility'
};

// Transaction limits to prevent abuse
export const TRANSACTION_LIMITS = {
  DAILY_AWARD_LIMIT: 100,
  SINGLE_TRANSACTION_LIMIT: 50,
  STUDENT_TO_TEACHER_DAILY: 20,
  PARENT_TO_STUDENT_DAILY: 30,
  FRIENDSHIP_DAILY: 15
};

// Initialize user points when they first join
export const initializeUserPoints = async (userId, userRole) => {
  try {
    const userPointsRef = doc(db, 'userPoints', userId);
    const userPointsDoc = await getDoc(userPointsRef);
    
    if (!userPointsDoc.exists()) {
      const initialData = {
        userId,
        userRole,
        colorPoints: {
          blue: 0,
          green: 0,
          purple: 0
        },
        totalEarned: 0,
        totalSpent: 0,
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      
      await updateDoc(userPointsRef, initialData);
      console.log(`✅ Initialized points for user ${userId}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error initializing user points:', error);
    return { success: false, error: error.message };
  }
};

// Get user's current point balance
export const getUserPoints = async (userId) => {
  try {
    const userPointsRef = doc(db, 'userPoints', userId);
    const userPointsDoc = await getDoc(userPointsRef);
    
    if (userPointsDoc.exists()) {
      return {
        success: true,
        points: userPointsDoc.data()
      };
    } else {
      // Initialize if doesn't exist
      await initializeUserPoints(userId, 'student'); // Default role
      return {
        success: true,
        points: {
          colorPoints: { blue: 0, green: 0, purple: 0 },
          totalEarned: 0,
          totalSpent: 0
        }
      };
    }
  } catch (error) {
    console.error('Error getting user points:', error);
    return { success: false, error: error.message };
  }
};

// Award points from one user to another
export const awardPoints = async (fromUserId, toUserId, pointType, amount, reason, category) => {
  try {
    // Get current user for security checks
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    // Validate input data
    const validationResult = validatePointsTransaction({
      toUserId,
      amount,
      category,
      reason
    });
    
    if (!validationResult.isValid) {
      await logSecurityEvent(currentUser.uid, 'INVALID_POINTS_TRANSACTION', {
        errors: validationResult.errors,
        toUserId,
        amount
      });
      throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
    }

    // Sanitize inputs
    const sanitizedReason = sanitizeInput(reason);
    const sanitizedCategory = sanitizeInput(category);

    // Check rate limiting
    const rateCheck = checkRateLimit(fromUserId, 'AWARD_POINTS', 20, 60000); // 20 awards per minute
    if (!rateCheck.allowed) {
      await logSecurityEvent(fromUserId, 'RATE_LIMIT_EXCEEDED', {
        action: 'AWARD_POINTS',
        resetTime: rateCheck.resetTime
      });
      throw new Error('Too many point awards. Please wait before trying again.');
    }

    // Check permission to award points
    const canAwardPoints = await hasPermission(fromUserId, PERMISSIONS.AWARD_POINTS);
    if (!canAwardPoints && fromUserId !== toUserId) {
      await logSecurityEvent(fromUserId, 'UNAUTHORIZED_POINTS_AWARD', {
        toUserId,
        amount
      });
      throw new Error('Insufficient permissions to award points');
    }

    // Additional validation
    if (amount <= 0 || amount > TRANSACTION_LIMITS.SINGLE_TRANSACTION_LIMIT) {
      throw new Error(`Invalid amount. Must be between 1 and ${TRANSACTION_LIMITS.SINGLE_TRANSACTION_LIMIT}`);
    }

    // Check daily limits
    const dailyCheck = await checkDailyLimits(fromUserId, amount, sanitizedCategory);
    if (!dailyCheck.allowed) {
      await logSecurityEvent(fromUserId, 'DAILY_LIMIT_EXCEEDED', {
        toUserId,
        amount,
        category: sanitizedCategory
      });
      throw new Error(dailyCheck.message);
    }

    // Run transaction to ensure atomicity
    const result = await runTransaction(db, async (transaction) => {
      const fromUserRef = doc(db, 'userPoints', fromUserId);
      const toUserRef = doc(db, 'userPoints', toUserId);
      
      // Get current balances
      const fromUserDoc = await transaction.get(fromUserRef);
      const toUserDoc = await transaction.get(toUserRef);
      
      if (!fromUserDoc.exists() || !toUserDoc.exists()) {
        throw new Error('User points not found');
      }
      
      const fromUserData = fromUserDoc.data();
      const toUserData = toUserDoc.data();
      
      // Check if sender has enough points (only for non-admin awards)
      const colorKey = pointType.toLowerCase();
      if (fromUserData.colorPoints[colorKey] < amount && fromUserId !== 'admin') {
        throw new Error(`Insufficient ${pointType} points`);
      }
      
      // Update balances
      const updateFromUser = {
        [`colorPoints.${colorKey}`]: fromUserId === 'admin' ? 
          fromUserData.colorPoints[colorKey] : 
          increment(-amount),
        totalSpent: increment(amount),
        lastUpdated: serverTimestamp()
      };
      
      const updateToUser = {
        [`colorPoints.${colorKey}`]: increment(amount),
        totalEarned: increment(amount),
        lastUpdated: serverTimestamp()
      };
      
      transaction.update(fromUserRef, updateFromUser);
      transaction.update(toUserRef, updateToUser);
      
      // Create transaction record
      const transactionRef = doc(collection(db, 'pointTransactions'));
      transaction.set(transactionRef, {
        fromUserId,
        toUserId,
        pointType: colorKey,
        amount,
        reason,
        category,
        timestamp: serverTimestamp(),
        status: 'completed'
      });
      
      return { transactionId: transactionRef.id };
    });
    
    // Send notification about the points award
    try {
      await notifyPointsAwarded({
        fromUserId,
        toUserId,
        amount,
        pointType,
        reason: sanitizedReason,
        category: sanitizedCategory
      });
      
      // Check for leaderboard changes (only for point receivers)
      if (amount >= 10) { // Only check for significant point awards
        try {
          const leaderboardResult = await getPointsLeaderboard(pointType, 10);
          if (leaderboardResult.success) {
            const userPosition = leaderboardResult.leaderboard.findIndex(
              user => user.userId === toUserId
            ) + 1; // 1-indexed position
            
            if (userPosition > 0 && userPosition <= 5) { // Top 5 position
              await notifyLeaderboardUpdate({
                userId: toUserId,
                pointType,
                newPosition: userPosition,
                totalPoints: leaderboardResult.leaderboard[userPosition - 1]?.points || 0
              });
            }
          }
        } catch (leaderboardError) {
          console.error('Error checking leaderboard position:', leaderboardError);
        }
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the transaction if notification fails
    }
    
    console.log(`✅ Points awarded: ${amount} ${pointType} from ${fromUserId} to ${toUserId}`);
    return { success: true, transactionId: result.transactionId };
    
  } catch (error) {
    console.error('Error awarding points:', error);
    return { success: false, error: error.message };
  }
};

// Check daily transaction limits
export const checkDailyLimits = async (userId, amount, category) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, 'pointTransactions'),
      where('fromUserId', '==', userId),
      where('timestamp', '>=', today)
    );
    
    const querySnapshot = await getDocs(q);
    let dailyTotal = 0;
    
    querySnapshot.forEach((doc) => {
      dailyTotal += doc.data().amount;
    });
    
    // Check category-specific limits
    let limit = TRANSACTION_LIMITS.DAILY_AWARD_LIMIT;
    
    if (category === POINT_CATEGORIES.FRIENDSHIP) {
      limit = TRANSACTION_LIMITS.FRIENDSHIP_DAILY;
    }
    
    if (dailyTotal + amount > limit) {
      return {
        allowed: false,
        message: `Daily limit exceeded. You can award ${limit - dailyTotal} more points today.`
      };
    }
    
    return { allowed: true };
  } catch (error) {
    console.error('Error checking daily limits:', error);
    return { allowed: false, message: 'Error checking limits' };
  }
};

// Get user's transaction history
export const getUserTransactionHistory = async (userId, limitCount = 20) => {
  try {
    const sentQuery = query(
      collection(db, 'pointTransactions'),
      where('fromUserId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount / 2)
    );
    
    const receivedQuery = query(
      collection(db, 'pointTransactions'),
      where('toUserId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount / 2)
    );
    
    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      getDocs(sentQuery),
      getDocs(receivedQuery)
    ]);
    
    const transactions = [];
    
    sentSnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data(),
        type: 'sent'
      });
    });
    
    receivedSnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data(),
        type: 'received'
      });
    });
    
    // Sort by timestamp
    transactions.sort((a, b) => {
      const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp);
      const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp);
      return bTime - aTime;
    });
    
    return {
      success: true,
      transactions: transactions.slice(0, limitCount)
    };
  } catch (error) {
    console.error('Error getting transaction history:', error);
    return { success: false, error: error.message };
  }
};

// Get leaderboard for a specific point type
export const getPointsLeaderboard = async (pointType, limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'userPoints'),
      orderBy(`colorPoints.${pointType.toLowerCase()}`, 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const leaderboard = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      leaderboard.push({
        userId: doc.id,
        points: data.colorPoints[pointType.toLowerCase()],
        totalEarned: data.totalEarned,
        ...data
      });
    });
    
    return { success: true, leaderboard };
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return { success: false, error: error.message };
  }
};

// Admin function to award bonus points
export const adminAwardPoints = async (toUserId, pointType, amount, reason) => {
  try {
    const result = await awardPoints(
      'admin',
      toUserId,
      pointType,
      amount,
      reason,
      'admin_bonus'
    );
    
    return result;
  } catch (error) {
    console.error('Error in admin award:', error);
    return { success: false, error: error.message };
  }
};

// Get points statistics for admin dashboard
export const getPointsStatistics = async () => {
  try {
    const usersQuery = query(collection(db, 'userPoints'));
    const transactionsQuery = query(
      collection(db, 'pointTransactions'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    
    const [usersSnapshot, transactionsSnapshot] = await Promise.all([
      getDocs(usersQuery),
      getDocs(transactionsQuery)
    ]);
    
    let totalBluePoints = 0;
    let totalGreenPoints = 0;
    let totalPurplePoints = 0;
    let totalTransactions = 0;
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      totalBluePoints += data.colorPoints?.blue || 0;
      totalGreenPoints += data.colorPoints?.green || 0;
      totalPurplePoints += data.colorPoints?.purple || 0;
    });
    
    const recentTransactions = [];
    transactionsSnapshot.forEach((doc) => {
      recentTransactions.push({
        id: doc.id,
        ...doc.data()
      });
      totalTransactions++;
    });
    
    return {
      success: true,
      statistics: {
        totalBluePoints,
        totalGreenPoints,
        totalPurplePoints,
        totalTransactions,
        recentTransactions
      }
    };
  } catch (error) {
    console.error('Error getting points statistics:', error);
    return { success: false, error: error.message };
  }
};

// Batch update points for multiple users (useful for bulk operations)
export const batchUpdatePoints = async (updates) => {
  try {
    const batch = writeBatch(db);
    
    updates.forEach(({ userId, pointType, amount, operation = 'add' }) => {
      const userRef = doc(db, 'userPoints', userId);
      const updateData = {
        [`colorPoints.${pointType.toLowerCase()}`]: operation === 'add' ? 
          increment(amount) : increment(-amount),
        lastUpdated: serverTimestamp()
      };
      
      batch.update(userRef, updateData);
    });
    
    await batch.commit();
    
    return { success: true, message: `Batch updated ${updates.length} users` };
  } catch (error) {
    console.error('Error in batch update:', error);
    return { success: false, error: error.message };
  }
};