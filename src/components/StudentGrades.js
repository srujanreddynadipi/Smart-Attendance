import React, { useState, useEffect } from "react";
import {
  BookOpen,
  TrendingUp,
  Award,
  Calendar,
  Target,
  Eye,
  BarChart3,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import { getStudentMarks, calculateStudentGrade } from "../firebase/gradebook";

const StudentGrades = ({ classroom }) => {
  const { userData } = useAuth();
  const { showError } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [studentMarks, setStudentMarks] = useState([]);
  const [finalGrade, setFinalGrade] = useState(null);
  const [gradeData, setGradeData] = useState(null);

  useEffect(() => {
    if (classroom?.id && userData?.studentId) {
      loadStudentGrades();
    }
  }, [classroom?.id, userData?.studentId]);

  const loadStudentGrades = async () => {
    setLoading(true);
    try {
      // Load student's marks
      const marksResult = await getStudentMarks(
        classroom.id,
        userData.studentId
      );
      if (marksResult.success) {
        // Filter to show only published assessments
        const publishedMarks = marksResult.marks.filter(
          (mark) => mark.isPublished
        );
        setStudentMarks(publishedMarks);
      }

      // Calculate final grade
      const gradeResult = await calculateStudentGrade(
        classroom.id,
        userData.studentId
      );
      if (gradeResult.success) {
        setFinalGrade(gradeResult.finalGrade);
        setGradeData(gradeResult);
      }
    } catch (error) {
      console.error("Error loading student grades:", error);
      showError("Failed to load grades");
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 70) return "text-blue-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    return "F";
  };

  const getAssessmentTypeIcon = (type) => {
    const iconMap = {
      EXAM: Target,
      QUIZ: BookOpen,
      HOMEWORK: BookOpen,
      PROJECT: Award,
    };
    return iconMap[type] || BookOpen;
  };

  const getAssessmentTypeColor = (type) => {
    const colorMap = {
      EXAM: "bg-red-100 text-red-700 border-red-200",
      QUIZ: "bg-blue-100 text-blue-700 border-blue-200",
      HOMEWORK: "bg-green-100 text-green-700 border-green-200",
      PROJECT: "bg-purple-100 text-purple-700 border-purple-200",
    };
    return colorMap[type] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your grades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">My Grades</h2>
            <p className="text-sm text-gray-600">{classroom?.name}</p>
          </div>
        </div>

        {/* Final Grade Summary */}
        {finalGrade !== null && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  Overall Grade
                </h3>
                <p className="text-sm text-gray-600">
                  Based on published assessments
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`text-3xl font-bold ${getGradeColor(finalGrade)}`}
                >
                  {finalGrade.toFixed(1)}%
                </div>
                <div
                  className={`text-lg font-semibold ${getGradeColor(
                    finalGrade
                  )}`}
                >
                  Grade {getGradeLetter(finalGrade)}
                </div>
              </div>
            </div>

            {/* Grade Breakdown */}
            {gradeData?.weights &&
              Object.keys(gradeData.weights).length > 0 && (
                <div className="mt-4 pt-4 border-t border-indigo-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Grade Weights
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {Object.entries(gradeData.weights).map(([type, weight]) => (
                      <div key={type} className="text-center">
                        <div className="text-sm text-gray-600">{type}</div>
                        <div className="font-semibold text-indigo-700">
                          {weight}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Assessment Grades */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Assessment Results
          </h3>
          <div className="text-sm text-gray-600">
            {studentMarks.length} published assessment
            {studentMarks.length !== 1 ? "s" : ""}
          </div>
        </div>

        {studentMarks.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">
              No Grades Available
            </h4>
            <p className="text-gray-500">
              Your teacher hasn't published any grades yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {studentMarks.map((mark) => {
              const TypeIcon = getAssessmentTypeIcon(mark.assessmentType);
              const percentage = mark.percentage;
              const isAttempted = mark.marksObtained !== null;

              return (
                <div
                  key={mark.assessmentId}
                  className="border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
                        <TypeIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-2">
                          {mark.assessmentName}
                        </h4>
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className={`px-2 py-1 rounded border text-xs font-medium ${getAssessmentTypeColor(
                              mark.assessmentType
                            )}`}
                          >
                            {mark.assessmentType}
                          </span>
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {mark.date ? mark.date.toLocaleDateString() : "N/A"}
                          </span>
                        </div>

                        {!isAttempted ? (
                          <div className="flex items-center gap-2 text-yellow-600">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              Not Attempted
                            </span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-gray-600">Score</div>
                              <div className="text-lg font-bold text-gray-800">
                                {mark.marksObtained} / {mark.totalMarks}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">
                                Percentage
                              </div>
                              <div
                                className={`text-lg font-bold ${getGradeColor(
                                  percentage
                                )}`}
                              >
                                {percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {isAttempted ? (
                        <div
                          className={`text-2xl font-bold ${getGradeColor(
                            percentage
                          )}`}
                        >
                          {getGradeLetter(percentage)}
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-gray-400">
                          -
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Performance Indicator */}
                  {isAttempted && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Performance</span>
                        <div className="flex items-center gap-1">
                          {percentage >= 80 ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-green-600">
                                Excellent
                              </span>
                            </>
                          ) : percentage >= 70 ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-blue-600">
                                Good
                              </span>
                            </>
                          ) : percentage >= 60 ? (
                            <>
                              <AlertCircle className="w-4 h-4 text-yellow-600" />
                              <span className="font-medium text-yellow-600">
                                Satisfactory
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-red-600" />
                              <span className="font-medium text-red-600">
                                Needs Improvement
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              percentage >= 80
                                ? "bg-green-500"
                                : percentage >= 70
                                ? "bg-blue-500"
                                : percentage >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-2">📊 Understanding Your Grades</p>
            <ul className="space-y-1 text-xs">
              <li>• Only published assessments are shown here</li>
              <li>
                • Your final grade is calculated based on the weights set by
                your teacher
              </li>
              <li>• Check back regularly as new grades are published</li>
              <li>
                • Contact your teacher if you have questions about your grades
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentGrades;
