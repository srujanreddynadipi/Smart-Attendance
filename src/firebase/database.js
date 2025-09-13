import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';

// Collections
const COLLECTIONS = {
  STUDENTS: 'students',
  SESSIONS: 'sessions',
  ATTENDANCE: 'attendance',
  CLASSES: 'classes'
};

// Student Management
export const studentService = {
  // Add a new student
  async addStudent(studentData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.STUDENTS), {
        ...studentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id, ...studentData };
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  },

  // Get all students
  async getAllStudents() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, COLLECTIONS.STUDENTS), orderBy('name'))
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting students:', error);
      throw error;
    }
  },

  // Get students by class
  async getStudentsByClass(classId) {
    try {
      const q = query(
        collection(db, COLLECTIONS.STUDENTS),
        where('classId', '==', classId),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting students by class:', error);
      throw error;
    }
  },

  // Update student
  async updateStudent(studentId, updateData) {
    try {
      const studentRef = doc(db, COLLECTIONS.STUDENTS, studentId);
      await updateDoc(studentRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      return { id: studentId, ...updateData };
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  },

  // Delete student
  async deleteStudent(studentId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.STUDENTS, studentId));
      return studentId;
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }
};

// Session Management
export const sessionService = {
  // Create a new attendance session
  async createSession(sessionData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.SESSIONS), {
        ...sessionData,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id, ...sessionData };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  // Get active session
  async getActiveSession(teacherId) {
    try {
      const q = query(
        collection(db, COLLECTIONS.SESSIONS),
        where('teacherId', '==', teacherId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting active session:', error);
      throw error;
    }
  },

  // End session
  async endSession(sessionId) {
    try {
      const sessionRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
      await updateDoc(sessionRef, {
        isActive: false,
        endedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return sessionId;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  },

  // Get session history
  async getSessionHistory(teacherId, limit = 20) {
    try {
      const q = query(
        collection(db, COLLECTIONS.SESSIONS),
        where('teacherId', '==', teacherId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting session history:', error);
      throw error;
    }
  }
};

// Attendance Management
export const attendanceService = {
  // Mark attendance
  async markAttendance(attendanceData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.ATTENDANCE), {
        ...attendanceData,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...attendanceData };
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  },

  // Get attendance for a session
  async getSessionAttendance(sessionId) {
    try {
      const q = query(
        collection(db, COLLECTIONS.ATTENDANCE),
        where('sessionId', '==', sessionId),
        orderBy('timestamp')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting session attendance:', error);
      throw error;
    }
  },

  // Update attendance status
  async updateAttendanceStatus(attendanceId, status, reason = '') {
    try {
      const attendanceRef = doc(db, COLLECTIONS.ATTENDANCE, attendanceId);
      await updateDoc(attendanceRef, {
        status,
        reason,
        updatedAt: serverTimestamp()
      });
      return { id: attendanceId, status, reason };
    } catch (error) {
      console.error('Error updating attendance status:', error);
      throw error;
    }
  },

  // Bulk update attendance for manual marking
  async bulkUpdateAttendance(updates) {
    try {
      const batch = writeBatch(db);
      
      updates.forEach(({ studentId, sessionId, status, reason = '' }) => {
        const attendanceRef = doc(collection(db, COLLECTIONS.ATTENDANCE));
        batch.set(attendanceRef, {
          studentId,
          sessionId,
          status,
          reason,
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp()
        });
      });

      await batch.commit();
      return updates;
    } catch (error) {
      console.error('Error bulk updating attendance:', error);
      throw error;
    }
  },

  // Get attendance statistics
  async getAttendanceStats(sessionId) {
    try {
      const attendance = await this.getSessionAttendance(sessionId);
      const stats = {
        total: attendance.length,
        present: attendance.filter(a => a.status === 'present').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        late: attendance.filter(a => a.status === 'late').length
      };
      return stats;
    } catch (error) {
      console.error('Error getting attendance stats:', error);
      throw error;
    }
  }
};

// Real-time listeners
export const realtimeService = {
  // Listen to session attendance updates
  subscribeToSessionAttendance(sessionId, callback) {
    const q = query(
      collection(db, COLLECTIONS.ATTENDANCE),
      where('sessionId', '==', sessionId),
      orderBy('timestamp')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const attendance = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(attendance);
    });
  },

  // Listen to active sessions
  subscribeToActiveSession(teacherId, callback) {
    const q = query(
      collection(db, COLLECTIONS.SESSIONS),
      where('teacherId', '==', teacherId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        callback({ id: doc.id, ...doc.data() });
      } else {
        callback(null);
      }
    });
  },

  // Listen to students list
  subscribeToStudents(classId, callback) {
    const q = query(
      collection(db, COLLECTIONS.STUDENTS),
      where('classId', '==', classId),
      orderBy('name')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const students = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(students);
    });
  }
};

// Utility functions
export const dbUtils = {
  // Generate session QR data
  generateSessionQRData(sessionData) {
    return JSON.stringify({
      sessionId: sessionData.id,
      teacherId: sessionData.teacherId,
      classId: sessionData.classId,
      subject: sessionData.subject,
      location: sessionData.location,
      timestamp: new Date().toISOString()
    });
  },

  // Validate attendance location
  validateAttendanceLocation(sessionLocation, studentLocation, radiusMeters = 50) {
    const toRadians = (degrees) => degrees * (Math.PI / 180);
    
    const lat1 = toRadians(sessionLocation.lat);
    const lon1 = toRadians(sessionLocation.lng);
    const lat2 = toRadians(studentLocation.lat);
    const lon2 = toRadians(studentLocation.lng);
    
    const R = 6371000; // Earth's radius in meters
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance <= radiusMeters;
  },

  // Format timestamp
  formatTimestamp(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },

  // Get attendance status based on time
  determineAttendanceStatus(checkInTime, sessionStartTime, lateThresholdMinutes = 15) {
    const sessionStart = new Date(sessionStartTime);
    const checkIn = new Date(checkInTime);
    const diffMinutes = (checkIn - sessionStart) / (1000 * 60);
    
    if (diffMinutes <= 0) return 'present';
    if (diffMinutes <= lateThresholdMinutes) return 'late';
    return 'absent';
  }
};