import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

// Get total counts for dashboard overview
export const getDashboardOverview = async () => {
  try {
    console.log('📊 Fetching  data...');
    
    // Get total students
    const studentsSnapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'student'))
    );
    const totalStudents = studentsSnapshot.size;
    
    // Get total teachers
    const teachersSnapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'teacher'))
    );
    const totalTeachers = teachersSnapshot.size;
    
    // Get total parents (assuming parents are stored separately or linked to students)
    const parentsSnapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'parent'))
    );
    const totalParents = parentsSnapshot.size;
    
    // Get total attendance records to calculate average
    const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
    const attendanceRecords = attendanceSnapshot.docs.map(doc => doc.data());
    
    // Calculate average attendance percentage
    const presentRecords = attendanceRecords.filter(record => record.status === 'present').length;
    const totalRecords = attendanceRecords.length;
    const avgAttendance = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
    
    return {
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalParents,
        avgAttendance,
        totalRecords
      }
    };
  } catch (error) {
    console.error('❌ Error fetching dashboard overview:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get enrollment and attendance trend data
export const getEnrollmentTrend = async () => {
  try {
    console.log('📈 Fetching enrollment trend data...');
    
    const now = new Date();
    const monthsData = [];
    
    // Get data for last 5 months
    for (let i = 4; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
      
      // Get students enrolled before this month
      const studentsSnapshot = await getDocs(
        query(
          collection(db, 'users'),
          where('role', '==', 'student'),
          where('createdAt', '<=', Timestamp.fromDate(nextMonthDate))
        )
      );
      
      // Get attendance records for this month
      const attendanceSnapshot = await getDocs(
        query(
          collection(db, 'attendance'),
          where('timestamp', '>=', Timestamp.fromDate(monthDate)),
          where('timestamp', '<', Timestamp.fromDate(nextMonthDate))
        )
      );
      
      const attendanceRecords = attendanceSnapshot.docs.map(doc => doc.data());
      const presentRecords = attendanceRecords.filter(record => record.status === 'present').length;
      const attendancePercentage = attendanceRecords.length > 0 
        ? Math.round((presentRecords / attendanceRecords.length) * 100) 
        : 0;
      
      monthsData.push({
        month: monthName,
        students: studentsSnapshot.size,
        attendance: attendancePercentage
      });
    }
    
    return {
      success: true,
      data: monthsData
    };
  } catch (error) {
    console.error('❌ Error fetching enrollment trend:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get department distribution data
export const getDepartmentDistribution = async () => {
  try {
    console.log('🏢 Fetching department distribution data...');
    
    // Get all students with their academic info
    const studentsSnapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'student'))
    );
    
    const departmentCounts = {};
    let totalStudents = 0;
    
    studentsSnapshot.docs.forEach(doc => {
      const student = doc.data();
      const department = student.academic?.course || student.academic?.department || 'Other';
      
      departmentCounts[department] = (departmentCounts[department] || 0) + 1;
      totalStudents++;
    });
    
    // Convert to percentage and format for pie chart
    const departmentData = Object.entries(departmentCounts).map(([dept, count]) => ({
      name: dept,
      value: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0,
      count: count
    }));
    
    return {
      success: true,
      data: departmentData
    };
  } catch (error) {
    console.error('❌ Error fetching department distribution:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get recent activities
export const getRecentActivities = async () => {
  try {
    console.log('📝 Fetching recent activities...');
    
    const activities = [];
    
    // Get recent user registrations
    const recentUsersSnapshot = await getDocs(
      query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(5)
      )
    );
    
    recentUsersSnapshot.docs.forEach(doc => {
      const user = doc.data();
      
      // Handle different timestamp formats safely
      let userDate = null;
      if (user.createdAt && typeof user.createdAt.toDate === 'function') {
        userDate = user.createdAt.toDate();
      } else if (user.createdAt && user.createdAt.seconds) {
        userDate = new Date(user.createdAt.seconds * 1000);
      } else if (user.createdAt) {
        userDate = new Date(user.createdAt);
      } else {
        userDate = new Date(); // Fallback to current date
      }
      
      const timeDiff = Date.now() - userDate.getTime();
      const timeAgo = getTimeAgo(timeDiff);
      
      activities.push({
        type: user.role === 'student' ? 'student_registered' : 'teacher_added',
        title: user.role === 'student' ? 'New student registered' : 'Teacher added',
        description: user.name || 'Unknown User',
        timeAgo: timeAgo,
        timestamp: userDate
      });
    });
    
    // Get recent attendance sessions
    const recentSessionsSnapshot = await getDocs(
      query(
        collection(db, 'attendanceSessions'),
        orderBy('createdAt', 'desc'),
        limit(3)
      )
    );
    
    recentSessionsSnapshot.docs.forEach(doc => {
      const session = doc.data();
      
      // Handle different timestamp formats safely
      let sessionDate = null;
      if (session.createdAt && typeof session.createdAt.toDate === 'function') {
        sessionDate = session.createdAt.toDate();
      } else if (session.createdAt && session.createdAt.seconds) {
        sessionDate = new Date(session.createdAt.seconds * 1000);
      } else if (session.createdAt) {
        sessionDate = new Date(session.createdAt);
      } else {
        sessionDate = new Date(); // Fallback to current date
      }
      
      const timeDiff = Date.now() - sessionDate.getTime();
      const timeAgo = getTimeAgo(timeDiff);
      
      activities.push({
        type: 'attendance_report',
        title: 'Attendance report generated',
        description: session.subject || 'System',
        timeAgo: timeAgo,
        timestamp: sessionDate
      });
    });
    
    // Sort activities by timestamp
    activities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    return {
      success: true,
      data: activities.slice(0, 10) // Return top 10 recent activities
    };
  } catch (error) {
    console.error('❌ Error fetching recent activities:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get all users for management
export const getAllUsers = async () => {
  try {
    console.log('👥 Fetching all users...');
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = {
      students: [],
      teachers: [],
      parents: []
    };
    
    for (const doc of usersSnapshot.docs) {
      const user = { id: doc.id, ...doc.data() };
      
      if (user.role === 'student') {
        // Get attendance percentage for students
        const attendanceSnapshot = await getDocs(
          query(collection(db, 'attendance'), where('studentId', '==', doc.id))
        );
        const attendanceRecords = attendanceSnapshot.docs.map(d => d.data());
        const presentRecords = attendanceRecords.filter(record => record.status === 'present').length;
        const attendancePercentage = attendanceRecords.length > 0 
          ? Math.round((presentRecords / attendanceRecords.length) * 100) 
          : 0;
        
        users.students.push({
          ...user,
          class: user.academic?.course || user.academic?.class || 'N/A',
          attendance: attendancePercentage,
          status: user.status || 'approved'
        });
      } else if (user.role === 'teacher') {
        // Get number of classes for teachers
        const classroomsSnapshot = await getDocs(
          query(collection(db, 'classrooms'), where('teacherId', '==', doc.id))
        );
        
        users.teachers.push({
          ...user,
          subject: user.academic?.subject || user.subject || 'N/A',
          classes: classroomsSnapshot.size
        });
      } else if (user.role === 'parent') {
        users.parents.push({
          ...user,
          children: user.children || [],
          phone: user.phone || 'N/A'
        });
      }
    }
    
    return {
      success: true,
      data: users
    };
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Helper function to calculate time ago
const getTimeAgo = (timeDiff) => {
  const minutes = Math.floor(timeDiff / (1000 * 60));
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) return `${minutes} mins ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

// Export all functions
export default {
  getDashboardOverview,
  getEnrollmentTrend,
  getDepartmentDistribution,
  getRecentActivities,
  getAllUsers
};