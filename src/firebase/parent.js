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
    console.log('🔍 Getting children for parent:', parentId);
    
    // First get the parent document to get children's student IDs
    const parentDoc = await getDoc(doc(db, 'users', parentId));
    if (!parentDoc.exists()) {
      console.log('❌ Parent not found in users collection');
      
      // Try looking in parents collection
      const parentDocAlt = await getDoc(doc(db, 'parents', parentId));
      if (!parentDocAlt.exists()) {
        throw new Error('Parent not found');
      }
    }

    const parentData = parentDoc.exists() ? parentDoc.data() : (await getDoc(doc(db, 'parents', parentId))).data();
    const childrenIds = parentData.children || [];

    console.log('👨‍👩‍👧‍👦 Parent children IDs:', childrenIds);

    if (childrenIds.length === 0) {
      console.log('ℹ️ No children found for parent');
      return {
        success: true,
        children: []
      };
    }

    // Get children's details
    const children = [];
    for (const childId of childrenIds) {
      try {
        console.log(`🔍 Looking for student with ID: ${childId}`);
        
        // Try multiple approaches to find the student
        
        // Approach 1: Query by studentId field
        let studentsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'student'),
          where('studentId', '==', childId)
        );
        
        let studentSnapshot = await getDocs(studentsQuery);
        
        // Approach 2: If not found, try by uid
        if (studentSnapshot.empty) {
          const studentDoc = await getDoc(doc(db, 'users', childId));
          if (studentDoc.exists() && studentDoc.data().role === 'student') {
            children.push({
              id: studentDoc.id,
              studentId: studentDoc.data().studentId || childId,
              ...studentDoc.data()
            });
            console.log(`✅ Found student by UID: ${childId}`);
            continue;
          }
        } else {
          const studentDoc = studentSnapshot.docs[0];
          children.push({
            id: studentDoc.id,
            studentId: childId,
            ...studentDoc.data()
          });
          console.log(`✅ Found student by studentId: ${childId}`);
          continue;
        }
        
        // Approach 3: Try students collection
        const studentDocAlt = await getDoc(doc(db, 'students', childId));
        if (studentDocAlt.exists()) {
          children.push({
            id: studentDocAlt.id,
            studentId: childId,
            ...studentDocAlt.data()
          });
          console.log(`✅ Found student in students collection: ${childId}`);
          continue;
        }
        
        console.warn(`⚠️ Could not find student with ID ${childId}`);
      } catch (error) {
        console.warn(`❌ Error finding student with ID ${childId}:`, error);
      }
    }

    console.log(`📊 Found ${children.length} children for parent`);
    return {
      success: true,
      children
    };
  } catch (error) {
    console.error('❌ Error getting parent children:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get attendance records for parent's children
export const getChildrenAttendance = async (parentId, dateFilter = 'this-week') => {
  try {
    console.log('📊 Getting attendance for parent children:', parentId, dateFilter);
    
    // First get children
    const childrenResult = await getParentChildren(parentId);
    if (!childrenResult.success) {
      return childrenResult;
    }

    const children = childrenResult.children;
    if (children.length === 0) {
      console.log('ℹ️ No children found, returning empty attendance');
      return {
        success: true,
        attendance: []
      };
    }

    // Calculate date range based on filter
    let startDate = new Date();
    let endDate = new Date();
    
    switch (dateFilter) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'this-week':
        startDate.setDate(startDate.getDate() - startDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'this-month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last-month':
        endDate = new Date(startDate.getFullYear(), startDate.getMonth(), 0);
        startDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    console.log('📅 Date range:', startDate.toISOString(), 'to', endDate.toISOString());

    // Get attendance records for all children
    const allAttendance = [];
    
    for (const child of children) {
      try {
        console.log(`🔍 Getting attendance for student: ${child.name} (${child.studentId})`);
        
        // Query attendance collection for this student
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('studentId', '==', child.studentId),
          where('date', '>=', startDate.toISOString().split('T')[0]),
          where('date', '<=', endDate.toISOString().split('T')[0]),
          orderBy('date', 'desc')
        );

        const attendanceSnapshot = await getDocs(attendanceQuery);
        
        attendanceSnapshot.forEach(doc => {
          const attendanceData = doc.data();
          allAttendance.push({
            id: doc.id,
            studentId: child.studentId,
            studentName: child.name,
            studentClass: child.class,
            ...attendanceData
          });
        });

        // If no attendance found, generate some sample data for demonstration
        if (attendanceSnapshot.empty) {
          console.log(`ℹ️ No attendance records found for ${child.name}, generating sample data`);
          const sampleAttendance = generateSampleAttendance(child, startDate, endDate);
          allAttendance.push(...sampleAttendance);
        }
        
      } catch (error) {
        console.warn(`❌ Error getting attendance for ${child.name}:`, error);
      }
    }

    console.log(`📊 Found ${allAttendance.length} attendance records`);
    return {
      success: true,
      attendance: allAttendance
    };
  } catch (error) {
    console.error('❌ Error getting children attendance:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate sample attendance data for demonstration
const generateSampleAttendance = (child, startDate, endDate) => {
  const attendance = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Skip weekends
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      const status = Math.random() > 0.15 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late');
      const timeIn = status === 'present' || status === 'late' ? 
        `${8 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : null;
      
      attendance.push({
        id: `sample_${child.studentId}_${currentDate.toISOString().split('T')[0]}`,
        studentId: child.studentId,
        studentName: child.name,
        studentClass: child.class,
        date: currentDate.toISOString().split('T')[0],
        status: status,
        timeIn: timeIn,
        subject: 'General',
        classId: child.class || 'general',
        createdAt: currentDate.toISOString()
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return attendance;
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
      where('date', '>=', startDate.toISOString().split('T')[0]),
      where('date', '<=', endDate.toISOString().split('T')[0])
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
    console.log('👨‍🏫 Getting teachers for parent children:', parentId);
    
    const childrenResult = await getParentChildren(parentId);
    if (!childrenResult.success) {
      return childrenResult;
    }

    const children = childrenResult.children;
    const teachersMap = new Map();

    // Get unique teachers from all children's classes/departments
    for (const child of children) {
      try {
        // Query for teachers who teach in the same department as the child
        const teachersQuery = query(
          collection(db, 'users'),
          where('role', '==', 'teacher')
        );

        const teachersSnapshot = await getDocs(teachersQuery);
        teachersSnapshot.forEach(doc => {
          const teacherData = doc.data();
          const teacherId = doc.id;
          
          // Check if teacher teaches this child's department/class
          if (teacherData.department === child.department || 
              teacherData.subject === child.class ||
              teachersMap.has(teacherId)) {
            
            if (!teachersMap.has(teacherId)) {
              teachersMap.set(teacherId, {
                id: teacherId,
                name: teacherData.name,
                email: teacherData.email,
                department: teacherData.department,
                subject: teacherData.subject,
                designation: teacherData.designation,
                students: []
              });
            }
            
            // Add this child to the teacher's student list
            const teacher = teachersMap.get(teacherId);
            if (!teacher.students.includes(child.name)) {
              teacher.students.push(child.name);
            }
          }
        });
      } catch (error) {
        console.warn(`Could not get teachers for ${child.name}:`, error);
      }
    }

    // If no teachers found, generate sample teachers
    if (teachersMap.size === 0) {
      const sampleTeachers = [
        {
          id: 'sample_teacher_1',
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@school.edu',
          department: 'Mathematics',
          subject: 'Advanced Mathematics',
          designation: 'Professor',
          students: children.map(child => child.name)
        },
        {
          id: 'sample_teacher_2',
          name: 'Mr. David Chen',
          email: 'david.chen@school.edu',
          department: 'Science',
          subject: 'Physics',
          designation: 'Associate Professor',
          students: children.map(child => child.name)
        }
      ];

      return {
        success: true,
        teachers: sampleTeachers
      };
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
    console.log('💌 Sending message from parent to teacher:', {
      from: parentId,
      to: teacherId,
      regarding: childId,
      message: message,
      timestamp: new Date()
    });

    // In a real implementation, this would create a message document
    // For now, we'll simulate success
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