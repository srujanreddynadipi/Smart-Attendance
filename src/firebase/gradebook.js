import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./config";
import {
  createAssessmentFunction,
  updateAssessmentFunction,
  deleteAssessmentFunction,
  updateStudentMarksFunction,
  calculateStudentGradeFunction,
  publishAssessmentMarksFunction,
  configureGradeWeightsFunction,
} from "./config";

// ========================
// ASSESSMENT MANAGEMENT
// ========================

/**
 * Create a new assessment using Cloud Function
 */
export const createAssessment = async (classroomId, assessmentData) => {
  try {
    const result = await createAssessmentFunction({
      classroomId,
      ...assessmentData,
    });

    if (result.data.success) {
      return {
        success: true,
        assessmentId: result.data.assessmentId,
      };
    }

    throw new Error("Failed to create assessment");
  } catch (error) {
    console.error("Error creating assessment:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Update an existing assessment
 */
export const updateAssessment = async (classroomId, assessmentId, updates) => {
  try {
    const result = await updateAssessmentFunction({
      classroomId,
      assessmentId,
      updates,
    });

    if (result.data.success) {
      return { success: true };
    }

    throw new Error("Failed to update assessment");
  } catch (error) {
    console.error("Error updating assessment:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Delete an assessment
 */
export const deleteAssessment = async (classroomId, assessmentId) => {
  try {
    const result = await deleteAssessmentFunction({
      classroomId,
      assessmentId,
    });

    if (result.data.success) {
      return { success: true };
    }

    throw new Error("Failed to delete assessment");
  } catch (error) {
    console.error("Error deleting assessment:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get all assessments for a classroom
 */
export const getClassroomAssessments = async (classroomId) => {
  try {
    const assessmentsQuery = query(
      collection(db, "classrooms", classroomId, "assessments"),
      orderBy("date", "desc")
    );

    const snapshot = await getDocs(assessmentsQuery);
    const assessments = [];

    snapshot.forEach((doc) => {
      assessments.push({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        publishedAt: doc.data().publishedAt?.toDate(),
      });
    });

    return {
      success: true,
      assessments,
    };
  } catch (error) {
    console.error("Error fetching assessments:", error);
    return {
      success: false,
      error: error.message,
      assessments: [],
    };
  }
};

/**
 * Subscribe to real-time assessment updates
 */
export const subscribeToAssessments = (classroomId, callback) => {
  const assessmentsQuery = query(
    collection(db, "classrooms", classroomId, "assessments"),
    orderBy("date", "desc")
  );

  return onSnapshot(assessmentsQuery, (snapshot) => {
    const assessments = [];
    snapshot.forEach((doc) => {
      assessments.push({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        publishedAt: doc.data().publishedAt?.toDate(),
      });
    });
    callback(assessments);
  });
};

// ========================
// MARKS MANAGEMENT
// ========================

/**
 * Bulk update student marks
 */
export const updateStudentMarks = async (classroomId, markUpdates) => {
  try {
    const result = await updateStudentMarksFunction({
      classroomId,
      markUpdates,
    });

    if (result.data.success) {
      return {
        success: true,
        updatedCount: result.data.updatedCount,
      };
    }

    throw new Error("Failed to update marks");
  } catch (error) {
    console.error("Error updating marks:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get all marks for an assessment
 */
export const getAssessmentMarks = async (classroomId, assessmentId) => {
  try {
    const marksQuery = collection(
      db,
      "classrooms",
      classroomId,
      "assessments",
      assessmentId,
      "marks"
    );
    const snapshot = await getDocs(marksQuery);

    const marks = {};
    snapshot.forEach((doc) => {
      marks[doc.id] = {
        studentId: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate(),
      };
    });

    return {
      success: true,
      marks,
    };
  } catch (error) {
    console.error("Error fetching assessment marks:", error);
    return {
      success: false,
      error: error.message,
      marks: {},
    };
  }
};

/**
 * Get all marks for a student across all assessments in a classroom
 */
export const getStudentMarks = async (classroomId, studentId) => {
  try {
    // Get all assessments first
    const assessmentsResult = await getClassroomAssessments(classroomId);
    if (!assessmentsResult.success) {
      throw new Error("Failed to fetch assessments");
    }

    const studentMarks = [];

    // Get marks for each assessment
    for (const assessment of assessmentsResult.assessments) {
      try {
        const markDoc = await getDoc(
          doc(
            db,
            "classrooms",
            classroomId,
            "assessments",
            assessment.id,
            "marks",
            studentId
          )
        );

        const marksObtained = markDoc.exists()
          ? markDoc.data().marksObtained
          : null;

        studentMarks.push({
          assessmentId: assessment.id,
          assessmentName: assessment.name,
          assessmentType: assessment.type,
          totalMarks: assessment.totalMarks,
          marksObtained,
          percentage:
            marksObtained !== null
              ? (marksObtained / assessment.totalMarks) * 100
              : null,
          isPublished: assessment.isPublished,
          date: assessment.date,
        });
      } catch (err) {
        console.error(
          `Error fetching marks for assessment ${assessment.id}:`,
          err
        );
      }
    }

    return {
      success: true,
      marks: studentMarks,
    };
  } catch (error) {
    console.error("Error fetching student marks:", error);
    return {
      success: false,
      error: error.message,
      marks: [],
    };
  }
};

// ========================
// GRADE CALCULATION
// ========================

/**
 * Calculate final grade for a student
 */
export const calculateStudentGrade = async (classroomId, studentId) => {
  try {
    const result = await calculateStudentGradeFunction({
      classroomId,
      studentId,
    });

    if (result.data.success) {
      return {
        success: true,
        finalGrade: result.data.finalGrade,
        assessments: result.data.assessments,
        weights: result.data.weights,
      };
    }

    throw new Error("Failed to calculate grade");
  } catch (error) {
    console.error("Error calculating grade:", error);
    return {
      success: false,
      error: error.message,
      finalGrade: 0,
    };
  }
};

/**
 * Get grade weights configuration
 */
export const getGradeWeights = async (classroomId) => {
  try {
    const configDoc = await getDoc(
      doc(db, "classrooms", classroomId, "configuration", "gradeWeights")
    );

    if (configDoc.exists()) {
      return {
        success: true,
        weights: configDoc.data(),
      };
    }

    return {
      success: true,
      weights: {},
    };
  } catch (error) {
    console.error("Error fetching grade weights:", error);
    return {
      success: false,
      error: error.message,
      weights: {},
    };
  }
};

/**
 * Configure grade weights
 */
export const configureGradeWeights = async (classroomId, weights) => {
  try {
    const result = await configureGradeWeightsFunction({
      classroomId,
      weights,
    });

    if (result.data.success) {
      return { success: true };
    }

    throw new Error("Failed to configure weights");
  } catch (error) {
    console.error("Error configuring weights:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ========================
// PUBLISHING
// ========================

/**
 * Publish or unpublish assessment marks
 */
export const toggleAssessmentPublishing = async (
  classroomId,
  assessmentId,
  publish = true
) => {
  try {
    const result = await publishAssessmentMarksFunction({
      classroomId,
      assessmentId,
      publish,
    });

    if (result.data.success) {
      return { success: true };
    }

    throw new Error("Failed to update publishing status");
  } catch (error) {
    console.error("Error updating publishing status:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// ========================
// ANALYTICS
// ========================

/**
 * Calculate class analytics for an assessment
 */
export const getAssessmentAnalytics = async (classroomId, assessmentId) => {
  try {
    const marksResult = await getAssessmentMarks(classroomId, assessmentId);
    if (!marksResult.success) {
      throw new Error("Failed to fetch marks");
    }

    const marks = Object.values(marksResult.marks);
    const scores = marks
      .map((m) => m.marksObtained)
      .filter((score) => score !== null && score !== undefined);

    if (scores.length === 0) {
      return {
        success: true,
        analytics: {
          totalStudents: 0,
          studentsAttempted: 0,
          average: 0,
          highest: 0,
          lowest: 0,
          distribution: {},
        },
      };
    }

    const average =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);

    // Grade distribution (A, B, C, D, F)
    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    scores.forEach((score) => {
      const percentage = (score / marks[0]?.totalMarks) * 100; // Assuming same total marks
      if (percentage >= 90) distribution.A++;
      else if (percentage >= 80) distribution.B++;
      else if (percentage >= 70) distribution.C++;
      else if (percentage >= 60) distribution.D++;
      else distribution.F++;
    });

    return {
      success: true,
      analytics: {
        totalStudents: marks.length,
        studentsAttempted: scores.length,
        average: Math.round(average * 100) / 100,
        highest,
        lowest,
        distribution,
      },
    };
  } catch (error) {
    console.error("Error calculating assessment analytics:", error);
    return {
      success: false,
      error: error.message,
      analytics: null,
    };
  }
};
