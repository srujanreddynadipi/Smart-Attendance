import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  arrayUnion,
  getDoc
} from 'firebase/firestore';
import { db } from './config';

// Create a new child addition request
export const createChildRequest = async (parentId, parentName, parentEmail, studentId, studentName, reason = '') => {
  try {
    console.log('📝 Creating child request:', { parentId, studentId, studentName });
    
    // Check if request already exists
    const existingRequestQuery = query(
      collection(db, 'childRequests'),
      where('parentId', '==', parentId),
      where('studentId', '==', studentId),
      where('status', '==', 'pending')
    );
    
    const existingRequestSnapshot = await getDocs(existingRequestQuery);
    if (!existingRequestSnapshot.empty) {
      return {
        success: false,
        error: 'A request for this child is already pending'
      };
    }

    // Check if child is already linked to this parent
    const parentDoc = await getDoc(doc(db, 'users', parentId));
    if (parentDoc.exists()) {
      const parentData = parentDoc.data();
      if (parentData.children && parentData.children.includes(studentId)) {
        return {
          success: false,
          error: 'This child is already linked to your account'
        };
      }
    }

    // Create the request
    const requestData = {
      parentId,
      parentName,
      parentEmail,
      studentId,
      studentName: studentName || '',
      reason: reason || 'Parent requesting to link child',
      status: 'pending',
      createdAt: new Date().toISOString(),
      requestType: 'child_addition'
    };

    const docRef = await addDoc(collection(db, 'childRequests'), requestData);
    
    console.log('✅ Child request created:', docRef.id);
    return {
      success: true,
      requestId: docRef.id,
      message: 'Request submitted successfully. Please wait for admin approval.'
    };
  } catch (error) {
    console.error('❌ Error creating child request:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get all pending child requests (for admin)
export const getPendingChildRequests = async () => {
  try {
    console.log('📋 Getting pending child requests');
    
    const requestsQuery = query(
      collection(db, 'childRequests'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const requestsSnapshot = await getDocs(requestsQuery);
    const requests = [];
    
    requestsSnapshot.forEach(doc => {
      requests.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log('✅ Found pending requests:', requests.length);
    return {
      success: true,
      requests
    };
  } catch (error) {
    console.error('❌ Error getting pending requests:', error);
    return {
      success: false,
      error: error.message,
      requests: []
    };
  }
};

// Approve a child request
export const approveChildRequest = async (requestId, adminId, adminName) => {
  try {
    console.log('✅ Approving child request:', requestId);
    
    // Get the request details
    const requestDoc = await getDoc(doc(db, 'childRequests', requestId));
    if (!requestDoc.exists()) {
      return {
        success: false,
        error: 'Request not found'
      };
    }

    const requestData = requestDoc.data();
    const { parentId, studentId, parentName, studentName } = requestData;

    // Update parent's children array
    const parentDocRef = doc(db, 'users', parentId);
    await updateDoc(parentDocRef, {
      children: arrayUnion(studentId)
    });

    // Try to update student's parent info if student exists in users collection
    try {
      const studentQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student'),
        where('studentId', '==', studentId)
      );
      
      const studentSnapshot = await getDocs(studentQuery);
      if (!studentSnapshot.empty) {
        const studentDoc = studentSnapshot.docs[0];
        await updateDoc(studentDoc.ref, {
          parentId: parentId,
          parentName: parentName
        });
      }
    } catch (error) {
      console.warn('⚠️ Could not update student parent info:', error);
    }

    // Update request status
    await updateDoc(doc(db, 'childRequests', requestId), {
      status: 'approved',
      approvedBy: adminId,
      approvedByName: adminName,
      approvedAt: new Date().toISOString()
    });

    console.log('✅ Child request approved successfully');
    return {
      success: true,
      message: `Successfully linked ${studentName} to ${parentName}`
    };
  } catch (error) {
    console.error('❌ Error approving child request:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Reject a child request
export const rejectChildRequest = async (requestId, adminId, adminName, reason = '') => {
  try {
    console.log('❌ Rejecting child request:', requestId);
    
    await updateDoc(doc(db, 'childRequests', requestId), {
      status: 'rejected',
      rejectedBy: adminId,
      rejectedByName: adminName,
      rejectedAt: new Date().toISOString(),
      rejectionReason: reason
    });

    console.log('✅ Child request rejected');
    return {
      success: true,
      message: 'Request rejected successfully'
    };
  } catch (error) {
    console.error('❌ Error rejecting child request:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get request history for a parent
export const getParentRequestHistory = async (parentId) => {
  try {
    console.log('📜 Getting request history for parent:', parentId);
    
    const requestsQuery = query(
      collection(db, 'childRequests'),
      where('parentId', '==', parentId),
      orderBy('createdAt', 'desc')
    );

    const requestsSnapshot = await getDocs(requestsQuery);
    const requests = [];
    
    requestsSnapshot.forEach(doc => {
      requests.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      requests
    };
  } catch (error) {
    console.error('❌ Error getting request history:', error);
    return {
      success: false,
      error: error.message,
      requests: []
    };
  }
};

// Get all child requests (for admin dashboard)
export const getAllChildRequests = async () => {
  try {
    console.log('📋 Getting all child requests');
    
    const requestsQuery = query(
      collection(db, 'childRequests'),
      orderBy('createdAt', 'desc')
    );

    const requestsSnapshot = await getDocs(requestsQuery);
    const requests = [];
    
    requestsSnapshot.forEach(doc => {
      requests.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      requests
    };
  } catch (error) {
    console.error('❌ Error getting all requests:', error);
    return {
      success: false,
      error: error.message,
      requests: []
    };
  }
};

// Delete a child request
export const deleteChildRequest = async (requestId) => {
  try {
    console.log('🗑️ Deleting child request:', requestId);
    
    await deleteDoc(doc(db, 'childRequests', requestId));
    
    console.log('✅ Child request deleted');
    return {
      success: true,
      message: 'Request deleted successfully'
    };
  } catch (error) {
    console.error('❌ Error deleting child request:', error);
    return {
      success: false,
      error: error.message
    };
  }
};