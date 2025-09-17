// Import the functions you need from the SDKs you need

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAnalytics } from 'firebase/analytics';


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    "AIzaSyDevelopmentKeyForTesting123456789",
  authDomain:
    process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    "smart-attendance-dev.firebaseapp.com",
  projectId:
    process.env.REACT_APP_FIREBASE_PROJECT_ID || "smart-attendance-dev",
  storageBucket:
    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    "smart-attendance-dev.appspot.com",
  messagingSenderId:
    process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId:
    process.env.REACT_APP_FIREBASE_APP_ID ||
    "1:123456789012:web:abcdef1234567890",
  measurementId:
    process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX",
};

// Log configuration status (remove in production)
console.log("🔥 Firebase Config Status:");
console.log(
  "🔥 Using API Key:",
  firebaseConfig.apiKey?.substring(0, 10) + "..."
);
console.log("🔥 Project ID:", firebaseConfig.projectId);
console.log("🔥 Auth Domain:", firebaseConfig.authDomain);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

// Initialize Analytics (only in browser environment)
export const analytics =
  typeof window !== "undefined" && process.env.NODE_ENV === "production"
    ? getAnalytics(app)
    : null;

// Cloud Function references
export const markAttendanceFunction = httpsCallable(
  functions,
  "markAttendance"
);

// Gradebook Cloud Functions
export const createAssessmentFunction = httpsCallable(
  functions,
  "createAssessment"
);
export const updateAssessmentFunction = httpsCallable(
  functions,
  "updateAssessment"
);
export const deleteAssessmentFunction = httpsCallable(
  functions,
  "deleteAssessment"
);
export const updateStudentMarksFunction = httpsCallable(
  functions,
  "updateStudentMarks"
);
export const calculateStudentGradeFunction = httpsCallable(
  functions,
  "calculateStudentGrade"
);
export const publishAssessmentMarksFunction = httpsCallable(
  functions,
  "publishAssessmentMarks"
);
export const configureGradeWeightsFunction = httpsCallable(
  functions,
  "configureGradeWeights"
);

export default app;
