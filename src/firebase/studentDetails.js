import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where
} from 'firebase/firestore';
import { db } from './config';

// Get comprehensive child details including academic information
export const getChildDetails = async (studentId) => {
  try {
    console.log('📚 Getting comprehensive details for student:', studentId);
    
    // Get student basic info
    let studentData = null;
    
    // Try multiple approaches to find the student
    // Approach 1: Query by studentId field
    let studentsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('studentId', '==', studentId)
    );
    
    let studentSnapshot = await getDocs(studentsQuery);
    
    if (!studentSnapshot.empty) {
      const studentDoc = studentSnapshot.docs[0];
      studentData = {
        id: studentDoc.id,
        ...studentDoc.data()
      };
    } else {
      // Approach 2: Try by UID
      const studentDoc = await getDoc(doc(db, 'users', studentId));
      if (studentDoc.exists() && studentDoc.data().role === 'student') {
        studentData = {
          id: studentDoc.id,
          ...studentDoc.data()
        };
      } else {
        // Approach 3: Try students collection
        const studentDocAlt = await getDoc(doc(db, 'students', studentId));
        if (studentDocAlt.exists()) {
          studentData = {
            id: studentDocAlt.id,
            ...studentDocAlt.data()
          };
        }
      }
    }

    if (!studentData) {
      return {
        success: false,
        error: 'Student not found'
      };
    }

    // Get attendance records
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('studentId', '==', studentId)
    );
    
    const attendanceSnapshot = await getDocs(attendanceQuery);
    const attendanceRecords = [];
    attendanceSnapshot.forEach(doc => {
      attendanceRecords.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort attendance records by date in descending order (most recent first)
    attendanceRecords.sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateB - dateA;
    });

    // Get grades/marks
    const gradesQuery = query(
      collection(db, 'grades'),
      where('studentId', '==', studentId)
    );
    
    const gradesSnapshot = await getDocs(gradesQuery);
    const grades = [];
    gradesSnapshot.forEach(doc => {
      grades.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort grades by semester in descending order
    grades.sort((a, b) => {
      const semesterA = a.semester || 0;
      const semesterB = b.semester || 0;
      return semesterB - semesterA;
    });

    // Get timetable
    const timetableQuery = query(
      collection(db, 'timetables'),
      where('class', '==', studentData.class || studentData.academic?.course)
    );
    
    const timetableSnapshot = await getDocs(timetableQuery);
    const timetable = [];
    timetableSnapshot.forEach(doc => {
      timetable.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Get subjects
    const subjectsQuery = query(
      collection(db, 'subjects'),
      where('class', '==', studentData.class || studentData.academic?.course)
    );
    
    const subjectsSnapshot = await getDocs(subjectsQuery);
    const subjects = [];
    subjectsSnapshot.forEach(doc => {
      subjects.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Get assignments and homework
    const assignmentsQuery = query(
      collection(db, 'assignments'),
      where('class', '==', studentData.class || studentData.academic?.course)
    );
    
    const assignmentsSnapshot = await getDocs(assignmentsQuery);
    const assignments = [];
    assignmentsSnapshot.forEach(doc => {
      assignments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort assignments by due date in descending order
    assignments.sort((a, b) => {
      const dueDateA = a.dueDate?.toDate ? a.dueDate.toDate() : new Date(a.dueDate);
      const dueDateB = b.dueDate?.toDate ? b.dueDate.toDate() : new Date(b.dueDate);
      return dueDateB - dueDateA;
    });

    // Generate sample data if none exists
    const sampleData = generateSampleStudentData(studentData);

    return {
      success: true,
      data: {
        student: studentData,
        attendance: attendanceRecords.length > 0 ? attendanceRecords : sampleData.attendance,
        grades: grades.length > 0 ? grades : sampleData.grades,
        timetable: timetable.length > 0 ? timetable : sampleData.timetable,
        subjects: subjects.length > 0 ? subjects : sampleData.subjects,
        assignments: assignments.length > 0 ? assignments : sampleData.assignments,
        statistics: calculateStudentStatistics(attendanceRecords, grades)
      }
    };

  } catch (error) {
    console.error('❌ Error getting child details:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate sample data for demonstration
const generateSampleStudentData = (studentData) => {
  const subjects = [
    { id: 'sub1', name: 'Mathematics', code: 'MATH101', credits: 4, teacher: 'Dr. Sarah Wilson' },
    { id: 'sub2', name: 'Physics', code: 'PHYS101', credits: 4, teacher: 'Prof. Michael Chen' },
    { id: 'sub3', name: 'Chemistry', code: 'CHEM101', credits: 3, teacher: 'Dr. Lisa Johnson' },
    { id: 'sub4', name: 'English', code: 'ENG101', credits: 3, teacher: 'Ms. Emma Davis' },
    { id: 'sub5', name: 'Computer Science', code: 'CS101', credits: 4, teacher: 'Dr. James Miller' }
  ];

  const timetable = [
    {
      id: 'tt1',
      day: 'Monday',
      periods: [
        { time: '9:00-10:00', subject: 'Mathematics', teacher: 'Dr. Sarah Wilson', room: 'Room 101' },
        { time: '10:15-11:15', subject: 'Physics', teacher: 'Prof. Michael Chen', room: 'Lab 201' },
        { time: '11:30-12:30', subject: 'English', teacher: 'Ms. Emma Davis', room: 'Room 103' },
        { time: '1:30-2:30', subject: 'Chemistry', teacher: 'Dr. Lisa Johnson', room: 'Lab 301' },
        { time: '2:45-3:45', subject: 'Computer Science', teacher: 'Dr. James Miller', room: 'Lab 401' }
      ]
    },
    {
      id: 'tt2',
      day: 'Tuesday',
      periods: [
        { time: '9:00-10:00', subject: 'Computer Science', teacher: 'Dr. James Miller', room: 'Lab 401' },
        { time: '10:15-11:15', subject: 'Mathematics', teacher: 'Dr. Sarah Wilson', room: 'Room 101' },
        { time: '11:30-12:30', subject: 'Chemistry', teacher: 'Dr. Lisa Johnson', room: 'Lab 301' },
        { time: '1:30-2:30', subject: 'Physics', teacher: 'Prof. Michael Chen', room: 'Lab 201' },
        { time: '2:45-3:45', subject: 'English', teacher: 'Ms. Emma Davis', room: 'Room 103' }
      ]
    },
    {
      id: 'tt3',
      day: 'Wednesday',
      periods: [
        { time: '9:00-10:00', subject: 'Physics', teacher: 'Prof. Michael Chen', room: 'Lab 201' },
        { time: '10:15-11:15', subject: 'English', teacher: 'Ms. Emma Davis', room: 'Room 103' },
        { time: '11:30-12:30', subject: 'Mathematics', teacher: 'Dr. Sarah Wilson', room: 'Room 101' },
        { time: '1:30-2:30', subject: 'Computer Science', teacher: 'Dr. James Miller', room: 'Lab 401' },
        { time: '2:45-3:45', subject: 'Chemistry', teacher: 'Dr. Lisa Johnson', room: 'Lab 301' }
      ]
    },
    {
      id: 'tt4',
      day: 'Thursday',
      periods: [
        { time: '9:00-10:00', subject: 'Chemistry', teacher: 'Dr. Lisa Johnson', room: 'Lab 301' },
        { time: '10:15-11:15', subject: 'Computer Science', teacher: 'Dr. James Miller', room: 'Lab 401' },
        { time: '11:30-12:30', subject: 'Physics', teacher: 'Prof. Michael Chen', room: 'Lab 201' },
        { time: '1:30-2:30', subject: 'English', teacher: 'Ms. Emma Davis', room: 'Room 103' },
        { time: '2:45-3:45', subject: 'Mathematics', teacher: 'Dr. Sarah Wilson', room: 'Room 101' }
      ]
    },
    {
      id: 'tt5',
      day: 'Friday',
      periods: [
        { time: '9:00-10:00', subject: 'English', teacher: 'Ms. Emma Davis', room: 'Room 103' },
        { time: '10:15-11:15', subject: 'Chemistry', teacher: 'Dr. Lisa Johnson', room: 'Lab 301' },
        { time: '11:30-12:30', subject: 'Computer Science', teacher: 'Dr. James Miller', room: 'Lab 401' },
        { time: '1:30-2:30', subject: 'Mathematics', teacher: 'Dr. Sarah Wilson', room: 'Room 101' },
        { time: '2:45-3:45', subject: 'Physics', teacher: 'Prof. Michael Chen', room: 'Lab 201' }
      ]
    }
  ];

  const grades = [
    {
      id: 'grade1',
      semester: 'Fall 2024',
      subjects: [
        { subject: 'Mathematics', midterm: 85, final: 88, assignments: 90, total: 87.6, grade: 'A-' },
        { subject: 'Physics', midterm: 78, final: 82, assignments: 85, total: 81.4, grade: 'B+' },
        { subject: 'Chemistry', midterm: 92, final: 89, assignments: 94, total: 91.4, grade: 'A' },
        { subject: 'English', midterm: 88, final: 90, assignments: 87, total: 88.4, grade: 'A-' },
        { subject: 'Computer Science', midterm: 95, final: 93, assignments: 96, total: 94.6, grade: 'A' }
      ],
      gpa: 3.68,
      rank: 15,
      totalStudents: 120
    }
  ];

  const assignments = [
    {
      id: 'assign1',
      title: 'Calculus Problem Set #5',
      subject: 'Mathematics',
      type: 'Assignment',
      dueDate: '2024-09-25',
      status: 'submitted',
      score: 88,
      maxScore: 100,
      feedback: 'Good work on integration problems'
    },
    {
      id: 'assign2',
      title: 'Physics Lab Report - Momentum',
      subject: 'Physics',
      type: 'Lab Report',
      dueDate: '2024-09-28',
      status: 'pending',
      score: null,
      maxScore: 100,
      feedback: null
    },
    {
      id: 'assign3',
      title: 'Essay: Shakespeare Analysis',
      subject: 'English',
      type: 'Essay',
      dueDate: '2024-09-30',
      status: 'in-progress',
      score: null,
      maxScore: 100,
      feedback: null
    }
  ];

  const attendance = [];
  const today = new Date();
  
  // Generate 30 days of sample attendance
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      const dayTimetable = timetable.find(tt => tt.day === date.toLocaleDateString('en-US', { weekday: 'long' }));
      
      if (dayTimetable) {
        dayTimetable.periods.forEach((period, index) => {
          const status = Math.random() > 0.1 ? 'present' : (Math.random() > 0.7 ? 'absent' : 'late');
          attendance.push({
            id: `att_${i}_${index}`,
            date: date.toISOString().split('T')[0],
            subject: period.subject,
            teacher: period.teacher,
            status: status,
            timeIn: status !== 'absent' ? period.time.split('-')[0] : null,
            room: period.room
          });
        });
      }
    }
  }

  return {
    subjects,
    timetable,
    grades,
    assignments,
    attendance
  };
};

// Calculate student statistics
const calculateStudentStatistics = (attendance, grades) => {
  const totalClasses = attendance.length;
  const presentClasses = attendance.filter(record => record.status === 'present').length;
  const absentClasses = attendance.filter(record => record.status === 'absent').length;
  const lateClasses = attendance.filter(record => record.status === 'late').length;
  
  const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
  
  const averageGrade = grades.length > 0 ? 
    grades.reduce((sum, semester) => sum + (semester.gpa || 0), 0) / grades.length : 0;

  return {
    attendanceRate,
    totalClasses,
    presentClasses,
    absentClasses,
    lateClasses,
    averageGrade: averageGrade.toFixed(2),
    currentRank: grades.length > 0 ? grades[0].rank : null,
    totalStudents: grades.length > 0 ? grades[0].totalStudents : null
  };
};