import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './config';

// Generate unique classroom code
const generateClassroomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Create a new classroom
export const createClassroom = async (classroomData) => {
  try {
    const classroomCode = generateClassroomCode();
    
    const classroom = {
      ...classroomData,
      code: classroomCode,
      students: [],
      subjects: [],
      studentCount: 0,
      createdAt: serverTimestamp(),
      isActive: true
    };

    console.log('Creating classroom with data:', classroom);
    
    const docRef = await addDoc(collection(db, 'classrooms'), classroom);
    
    console.log('Classroom created with ID:', docRef.id);
    
    return {
      success: true,
      classroomId: docRef.id,
      code: classroomCode,
      message: `Classroom created successfully with code: ${classroomCode}`
    };
  } catch (error) {
    console.error('Error creating classroom:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get all classrooms for a teacher
export const getTeacherClassrooms = async (teacherId) => {
  try {
    console.log('Getting classrooms for teacherId:', teacherId);
    
    const q = query(
      collection(db, 'classrooms'),
      where('teacherId', '==', teacherId),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const classrooms = [];
    
    console.log('Query snapshot size:', querySnapshot.size);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Classroom document:', doc.id, data);
      classrooms.push({
        id: doc.id,
        ...data
      });
    });
    
    // Sort by createdAt on the client side
    classrooms.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return bTime - aTime;
    });
    
    console.log('Final classrooms array:', classrooms);
    
    return {
      success: true,
      classrooms
    };
  } catch (error) {
    console.error('Error getting teacher classrooms:', error);
    return {
      success: false,
      error: error.message,
      classrooms: []
    };
  }
};

// Get classroom by ID
export const getClassroomById = async (classroomId) => {
  try {
    console.log('Getting classroom by ID:', classroomId);
    
    const classroomRef = doc(db, 'classrooms', classroomId);
    const classroomDoc = await getDoc(classroomRef);
    
    if (!classroomDoc.exists()) {
      console.error('Classroom not found:', classroomId);
      return {
        success: false,
        error: 'Classroom not found'
      };
    }
    
    const classroomData = {
      id: classroomDoc.id,
      ...classroomDoc.data()
    };
    
    console.log('Classroom found:', classroomData);
    
    return {
      success: true,
      classroom: classroomData
    };
  } catch (error) {
    console.error('Error getting classroom by ID:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update classroom
export const updateClassroom = async (classroomId, updateData) => {
  try {
    const classroomRef = doc(db, 'classrooms', classroomId);
    await updateDoc(classroomRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error updating classroom:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete classroom (soft delete)
export const deleteClassroom = async (classroomId) => {
  try {
    const classroomRef = doc(db, 'classrooms', classroomId);
    await updateDoc(classroomRef, {
      isActive: false,
      deletedAt: serverTimestamp()
    });
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting classroom:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Student joins classroom by code
export const joinClassroom = async (studentId, studentData, classroomCode) => {
  try {
    console.log('Student attempting to join classroom with code:', classroomCode);
    console.log('Student data:', studentData);
    
    // Find classroom by code
    const q = query(
      collection(db, 'classrooms'),
      where('code', '==', classroomCode),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    console.log('Classroom search result:', querySnapshot.size, 'classrooms found');
    
    if (querySnapshot.empty) {
      return {
        success: false,
        error: 'Invalid classroom code'
      };
    }
    
    const classroomDoc = querySnapshot.docs[0];
    const classroomData = classroomDoc.data();
    console.log('Found classroom:', classroomDoc.id, classroomData);
    
    // Check if student is already in classroom
    if (classroomData.students?.some(student => student.id === studentId)) {
      return {
        success: false,
        error: 'You are already in this classroom'
      };
    }
    
    // Create join request
    const joinRequest = {
      studentId,
      studentName: studentData.name,
      studentEmail: studentData.email,
      classroomId: classroomDoc.id,
      classroomName: classroomData.name,
      teacherId: classroomData.teacherId,
      status: 'pending',
      requestedAt: serverTimestamp()
    };
    
    console.log('Creating join request:', joinRequest);
    
    const docRef = await addDoc(collection(db, 'joinRequests'), joinRequest);
    console.log('Join request created with ID:', docRef.id);
    
    return {
      success: true,
      message: 'Join request sent successfully'
    };
  } catch (error) {
    console.error('Error joining classroom:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get join requests for teacher
export const getClassroomJoinRequests = async (teacherId) => {
  try {
    console.log('Getting join requests for teacher:', teacherId);
    
    const q = query(
      collection(db, 'joinRequests'),
      where('teacherId', '==', teacherId),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    const requests = [];
    
    console.log('Join requests query result:', querySnapshot.size, 'requests found');
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Join request:', doc.id, data);
      requests.push({
        id: doc.id,
        ...data
      });
    });
    
    // Sort by requestedAt on client side
    requests.sort((a, b) => {
      const aTime = a.requestedAt?.toDate?.() || new Date(a.requestedAt || 0);
      const bTime = b.requestedAt?.toDate?.() || new Date(b.requestedAt || 0);
      return bTime - aTime;
    });
    
    console.log('Final join requests:', requests);
    
    return {
      success: true,
      requests
    };
  } catch (error) {
    console.error('Error getting join requests:', error);
    return {
      success: false,
      error: error.message,
      requests: []
    };
  }
};

// Approve join request
export const approveJoinRequest = async (requestId, classroomId) => {
  try {
    console.log('Approving join request:', requestId, 'for classroom:', classroomId);
    
    // Get the join request
    const requestRef = doc(db, 'joinRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      console.error('Join request not found:', requestId);
      return {
        success: false,
        error: 'Join request not found'
      };
    }
    
    const requestData = requestDoc.data();
    console.log('Join request data:', requestData);
    
    // Get current classroom data
    const classroomRef = doc(db, 'classrooms', classroomId);
    const classroomDoc = await getDoc(classroomRef);
    
    if (!classroomDoc.exists()) {
      console.error('Classroom not found:', classroomId);
      return {
        success: false,
        error: 'Classroom not found'
      };
    }
    
    const classroomData = classroomDoc.data();
    console.log('Current classroom data:', classroomData);
    
    // Add student to classroom
    const studentData = {
      id: requestData.studentId,
      name: requestData.studentName,
      email: requestData.studentEmail,
      joinedAt: new Date() // Use regular Date instead of serverTimestamp for arrayUnion
    };
    
    console.log('Adding student to classroom:', studentData);
    
    const currentStudents = classroomData.students || [];
    const currentStudentCount = classroomData.studentCount || 0;
    
    await updateDoc(classroomRef, {
      students: arrayUnion(studentData),
      studentCount: currentStudentCount + 1,
      lastUpdated: serverTimestamp() // serverTimestamp can be used at the document level
    });
    
    console.log('Student added to classroom successfully');
    
    // Update request status
    await updateDoc(requestRef, {
      status: 'approved',
      approvedAt: serverTimestamp()
    });
    
    console.log('Join request status updated to approved');
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error approving join request:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Reject join request
export const rejectJoinRequest = async (requestId) => {
  try {
    const requestRef = doc(db, 'joinRequests', requestId);
    await updateDoc(requestRef, {
      status: 'rejected',
      rejectedAt: serverTimestamp()
    });
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error rejecting join request:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Add subject to classroom
export const addSubjectToClassroom = async (classroomId, subjectData) => {
  try {
    const subjectId = Date.now().toString();
    const subject = {
      id: subjectId,
      ...subjectData,
      createdAt: new Date().toISOString() // Use ISO string instead of serverTimestamp for arrayUnion
    };
    
    const classroomRef = doc(db, 'classrooms', classroomId);
    await updateDoc(classroomRef, {
      subjects: arrayUnion(subject)
    });
    
    return {
      success: true,
      subjectId
    };
  } catch (error) {
    console.error('Error adding subject:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update subject in classroom
export const updateSubject = async (classroomId, subjectId, updateData) => {
  try {
    // Get current classroom data
    const classroomRef = doc(db, 'classrooms', classroomId);
    const classroomDoc = await getDoc(classroomRef);
    
    if (!classroomDoc.exists()) {
      return {
        success: false,
        error: 'Classroom not found'
      };
    }
    
    const classroomData = classroomDoc.data();
    const subjects = classroomData.subjects || [];
    
    // Find and update the subject
    const updatedSubjects = subjects.map(subject => 
      subject.id === subjectId 
        ? { ...subject, ...updateData, updatedAt: new Date() }
        : subject
    );
    
    await updateDoc(classroomRef, {
      subjects: updatedSubjects
    });
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error updating subject:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete subject from classroom
export const deleteSubject = async (classroomId, subjectId) => {
  try {
    // Get current classroom data
    const classroomRef = doc(db, 'classrooms', classroomId);
    const classroomDoc = await getDoc(classroomRef);
    
    if (!classroomDoc.exists()) {
      return {
        success: false,
        error: 'Classroom not found'
      };
    }
    
    const classroomData = classroomDoc.data();
    const subjects = classroomData.subjects || [];
    
    // Remove the subject
    const updatedSubjects = subjects.filter(subject => subject.id !== subjectId);
    
    await updateDoc(classroomRef, {
      subjects: updatedSubjects
    });
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting subject:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Remove student from classroom
export const removeStudentFromClassroom = async (classroomId, studentId) => {
  try {
    // Get current classroom data
    const classroomRef = doc(db, 'classrooms', classroomId);
    const classroomDoc = await getDoc(classroomRef);
    
    if (!classroomDoc.exists()) {
      return {
        success: false,
        error: 'Classroom not found'
      };
    }
    
    const classroomData = classroomDoc.data();
    const students = classroomData.students || [];
    
    // Find the student to remove
    const studentToRemove = students.find(student => student.id === studentId);
    
    if (!studentToRemove) {
      return {
        success: false,
        error: 'Student not found in classroom'
      };
    }
    
    // Remove student
    await updateDoc(classroomRef, {
      students: arrayRemove(studentToRemove),
      studentCount: Math.max(0, (classroomData.studentCount || 0) - 1)
    });
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error removing student:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get classroom by code (for students)
export const getClassroomByCode = async (classroomCode) => {
  try {
    const q = query(
      collection(db, 'classrooms'),
      where('code', '==', classroomCode),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        success: false,
        error: 'Invalid classroom code'
      };
    }
    
    const classroomDoc = querySnapshot.docs[0];
    
    return {
      success: true,
      classroom: {
        id: classroomDoc.id,
        ...classroomDoc.data()
      }
    };
  } catch (error) {
    console.error('Error getting classroom by code:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get student's classrooms
export const getStudentClassrooms = async (studentId) => {
  try {
    const q = query(
      collection(db, 'classrooms'),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const classrooms = [];
    
    querySnapshot.forEach((doc) => {
      const classroomData = doc.data();
      const isStudentInClassroom = classroomData.students?.some(
        student => student.id === studentId
      );
      
      if (isStudentInClassroom) {
        classrooms.push({
          id: doc.id,
          ...classroomData
        });
      }
    });
    
    return {
      success: true,
      classrooms
    };
  } catch (error) {
    console.error('Error getting student classrooms:', error);
    return {
      success: false,
      error: error.message,
      classrooms: []
    };
  }
};