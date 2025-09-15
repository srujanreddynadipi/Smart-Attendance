import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from './config';

// Get parent's children information
export const getParentChildren = async (parentId) => {
  try {
    // First get the parent document to get children's student IDs
    const parentDoc = await getDoc(doc(db, 'users', parentId));
    if (!parentDoc.exists()) {
      throw new Error('Parent not found');
    }

    const parentData = parentDoc.data();
    const childrenIds = parentData.children || [];

    if (childrenIds.length === 0) {
      return {
        success: true,
        children: []
      };
    }

    // Get children's details
    const children = [];
    for (const childId of childrenIds) {
      try {
        // Query users collection for students with matching studentId
        const studentsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'student'),
          where('studentId', '==', childId)
        );
        
        const studentSnapshot = await getDocs(studentsQuery);
        if (!studentSnapshot.empty) {
          const studentDoc = studentSnapshot.docs[0];
          children.push({
            id: studentDoc.id,
            studentId: childId,
            ...studentDoc.data()
          });
        }
      } catch (error) {
        console.warn(`Could not find student with ID ${childId}:`, error);
      }
    }

    return {
      success: true,
      children
    };
  } catch (error) {
    console.error('Error getting parent children:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get attendance records for parent's children
export const getChildrenAttendance = async (parentId, dateFilter = 'this-week') => {
  try {
    // First get children
    const childrenResult = await getParentChildren(parentId);
    if (!childrenResult.success) {
      return childrenResult;
    }

    const children = childrenResult.children;
    if (children.length === 0) {
      return {
        success: true,
        attendance: []
      };
    }

    // Calculate date range based on filter
    let startDate = new Date();
    switch (dateFilter) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'this-week':
        startDate.setDate(startDate.getDate() - startDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'this-month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'last-month':
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    // Get attendance records for all children
    const allAttendance = [];
    for (const child of children) {
      try {
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('studentId', '==', child.studentId),
          where('timestamp', '>=', startDate),
          orderBy('timestamp', 'desc')
        );

        const attendanceSnapshot = await getDocs(attendanceQuery);
        attendanceSnapshot.forEach(doc => {
          allAttendance.push({
            id: doc.id,
            childId: child.id,
            childName: child.name,
            studentId: child.studentId,
            ...doc.data()
          });
        });
      } catch (error) {
        console.warn(`Could not get attendance for ${child.name}:`, error);
      }
    }

    return {
      success: true,
      attendance: allAttendance
    };
  } catch (error) {
    console.error('Error getting children attendance:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get attendance statistics for a specific child
export const getChildAttendanceStats = async (studentId, dateRange = 30) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - dateRange);

    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('studentId', '==', studentId),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate)
    );

    const attendanceSnapshot = await getDocs(attendanceQuery);
    const records = [];
    attendanceSnapshot.forEach(doc => {
      records.push(doc.data());
    });

    const totalClasses = records.length;
    const presentClasses = records.filter(record => record.status === 'present').length;
    const absentClasses = records.filter(record => record.status === 'absent').length;
    const lateClasses = records.filter(record => record.status === 'late').length;
    const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

    return {
      success: true,
      stats: {
        totalClasses,
        presentClasses,
        absentClasses,
        lateClasses,
        attendanceRate,
        dateRange
      }
    };
  } catch (error) {
    console.error('Error getting attendance stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get teachers for parent's children
export const getChildrenTeachers = async (parentId) => {
  try {
    const childrenResult = await getParentChildren(parentId);
    if (!childrenResult.success) {
      return childrenResult;
    }

    const children = childrenResult.children;
    const teachersMap = new Map();

    // Get unique teachers from all children's classes
    for (const child of children) {
      if (child.academic && child.academic.course) {
        // Query for teachers who teach this course
        try {
          const teachersQuery = query(
            collection(db, 'users'),
            where('role', '==', 'teacher'),
            where('teaching.department', '==', child.academic.course)
          );

          const teachersSnapshot = await getDocs(teachersQuery);
          teachersSnapshot.forEach(doc => {
            const teacherData = doc.data();
            const teacherId = doc.id;
            
            if (!teachersMap.has(teacherId)) {
              teachersMap.set(teacherId, {
                id: teacherId,
                name: teacherData.name,
                email: teacherData.email,
                department: teacherData.teaching?.department,
                subjects: teacherData.teaching?.subjects || [],
                students: []
              });
            }
            
            // Add this child to the teacher's student list
            teachersMap.get(teacherId).students.push(child.name);
          });
        } catch (error) {
          console.warn(`Could not get teachers for ${child.name}:`, error);
        }
      }
    }

    return {
      success: true,
      teachers: Array.from(teachersMap.values())
    };
  } catch (error) {
    console.error('Error getting children teachers:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send message to teacher
export const sendMessageToTeacher = async (parentId, teacherId, childId, message) => {
  try {
    // In a real implementation, this would create a message document
    // For now, we'll just log the message
    console.log('Message sent:', {
      from: parentId,
      to: teacherId,
      regarding: childId,
      message: message,
      timestamp: new Date()
    });

    // You could implement this by adding to a 'messages' collection
    /*
    await addDoc(collection(db, 'messages'), {
      fromId: parentId,
      toId: teacherId,
      regardingStudentId: childId,
      message: message,
      timestamp: serverTimestamp(),
      read: false,
      type: 'parent-to-teacher'
    });
    */

    return {
      success: true,
      message: 'Message sent successfully'
    };
  } catch (error) {
    console.error('Error sending message:', error);
    return {
      success: false,
      error: error.message
    };
  }
};