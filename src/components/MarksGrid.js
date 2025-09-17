import React, { useState, useEffect, useCallback } from "react";
import {
  Save,
  Eye,
  EyeOff,
  User,
  Award,
  TrendingUp,
  BarChart3,
  CheckCircle,
} from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";
import {
  updateStudentMarks,
  getAssessmentMarks,
  toggleAssessmentPublishing,
} from "../firebase/gradebook";

const MarksGrid = ({
  classroom,
  students = [],
  assessments = [],
  onMarksUpdated,
}) => {
  const { showSuccess, showError } = useNotifications();

  const [marks, setMarks] = useState({}); // { assessmentId: { studentId: marksObtained } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(new Set());
  const [selectedCell, setSelectedCell] = useState(null);

  // Load all marks data
  useEffect(() => {
    if (assessments.length > 0 && classroom?.id) {
      loadAllMarks();
    }
  }, [assessments, classroom?.id]);

  const loadAllMarks = async () => {
    setLoading(true);
    try {
      const marksData = {};

      for (const assessment of assessments) {
        const result = await getAssessmentMarks(classroom.id, assessment.id);
        if (result.success) {
          marksData[assessment.id] = result.marks;
        }
      }

      setMarks(marksData);
    } catch (error) {
      console.error("Error loading marks:", error);
      showError("Failed to load marks data");
    } finally {
      setLoading(false);
    }
  };

  // Auto-save functionality with debouncing
  const saveChanges = useCallback(async () => {
    if (pendingChanges.size === 0 || saving) return;

    setSaving(true);
    try {
      const markUpdates = [];

      pendingChanges.forEach((key) => {
        const [assessmentId, studentId] = key.split("|");
        const marksObtained = marks[assessmentId]?.[studentId]?.marksObtained;

        if (
          marksObtained !== undefined &&
          marksObtained !== null &&
          marksObtained !== ""
        ) {
          markUpdates.push({
            assessmentId,
            studentId,
            marksObtained: parseFloat(marksObtained) || 0,
          });
        }
      });

      if (markUpdates.length > 0) {
        const result = await updateStudentMarks(classroom.id, markUpdates);
        if (result.success) {
          setPendingChanges(new Set());
          // Don't show success toast for auto-save to avoid spam
        } else {
          showError("Failed to save some marks");
        }
      }
    } catch (error) {
      console.error("Error saving marks:", error);
      showError("Failed to save marks");
    } finally {
      setSaving(false);
    }
  }, [pendingChanges, marks, classroom?.id, saving, showError]);

  // Auto-save with debounce
  useEffect(() => {
    if (pendingChanges.size > 0) {
      const timeoutId = setTimeout(saveChanges, 1000); // Save after 1 second of inactivity
      return () => clearTimeout(timeoutId);
    }
  }, [pendingChanges, saveChanges]);

  const handleMarkChange = (assessmentId, studentId, value) => {
    // Validate input
    const assessment = assessments.find((a) => a.id === assessmentId);
    if (
      assessment &&
      value !== "" &&
      (isNaN(value) || value < 0 || value > assessment.totalMarks)
    ) {
      return; // Don't update if invalid
    }

    setMarks((prev) => ({
      ...prev,
      [assessmentId]: {
        ...prev[assessmentId],
        [studentId]: {
          ...prev[assessmentId]?.[studentId],
          studentId,
          marksObtained: value === "" ? null : parseFloat(value),
        },
      },
    }));

    // Mark as pending change
    setPendingChanges(
      (prev) => new Set([...prev, `${assessmentId}|${studentId}`])
    );
  };

  const handleTogglePublishing = async (assessmentId, currentStatus) => {
    try {
      const result = await toggleAssessmentPublishing(
        classroom.id,
        assessmentId,
        !currentStatus
      );
      if (result.success) {
        showSuccess(
          currentStatus
            ? "Assessment marks hidden from students"
            : "Assessment marks published to students"
        );
        if (onMarksUpdated) {
          onMarksUpdated();
        }
      } else {
        showError("Failed to update publishing status");
      }
    } catch (error) {
      console.error("Error toggling publishing:", error);
      showError("Failed to update publishing status");
    }
  };

  const calculateStudentAverage = (studentId) => {
    const publishedAssessments = assessments.filter((a) => a.isPublished);
    if (publishedAssessments.length === 0) return null;

    let totalPercentage = 0;
    let count = 0;

    publishedAssessments.forEach((assessment) => {
      const mark = marks[assessment.id]?.[studentId]?.marksObtained;
      if (mark !== null && mark !== undefined) {
        const percentage = (mark / assessment.totalMarks) * 100;
        totalPercentage += percentage;
        count++;
      }
    });

    return count > 0 ? totalPercentage / count : null;
  };

  const calculateAssessmentStats = (assessmentId) => {
    const assessmentMarks = marks[assessmentId];
    if (!assessmentMarks) return { average: 0, attempted: 0 };

    const scores = Object.values(assessmentMarks)
      .map((m) => m.marksObtained)
      .filter((score) => score !== null && score !== undefined);

    if (scores.length === 0) return { average: 0, attempted: 0 };

    const average =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return {
      average: Math.round(average * 100) / 100,
      attempted: scores.length,
    };
  };

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading marks grid...</p>
        </div>
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">
            No Assessments Yet
          </h4>
          <p className="text-gray-500">
            Create assessments first before entering marks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Status */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                Marks Entry Grid
              </h3>
              <p className="text-sm text-gray-600">
                {students.length} students × {assessments.length} assessments
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Saving...</span>
              </div>
            )}
            {pendingChanges.size === 0 && !saving && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">All changes saved</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Marks Grid */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            {/* Header Row */}
            <thead>
              <tr>
                <th className="sticky left-0 bg-white/90 backdrop-blur-sm border-r border-gray-200 p-4 text-left">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="font-semibold text-gray-800">Student</span>
                  </div>
                </th>
                {assessments.map((assessment) => (
                  <th
                    key={assessment.id}
                    className="border-r border-gray-200 p-4 min-w-[160px]"
                  >
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-semibold text-gray-800 text-sm">
                          {assessment.name}
                        </span>
                        <button
                          onClick={() =>
                            handleTogglePublishing(
                              assessment.id,
                              assessment.isPublished
                            )
                          }
                          className={`p-1 rounded ${
                            assessment.isPublished
                              ? "text-green-600 hover:bg-green-100"
                              : "text-gray-400 hover:bg-gray-100"
                          }`}
                          title={
                            assessment.isPublished ? "Published" : "Hidden"
                          }
                        >
                          {assessment.isPublished ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <div className="text-xs text-gray-600">
                        <div className="mb-1">
                          /{assessment.totalMarks} marks
                        </div>
                        <div className="text-xs bg-gray-100 rounded px-2 py-1">
                          Avg: {calculateAssessmentStats(assessment.id).average}
                        </div>
                      </div>
                    </div>
                  </th>
                ))}
                <th className="border-l-2 border-indigo-200 p-4 bg-indigo-50/50">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      <span className="font-semibold text-indigo-800">
                        Final Grade
                      </span>
                    </div>
                    <div className="text-xs text-indigo-600 mt-1">
                      Average %
                    </div>
                  </div>
                </th>
              </tr>
            </thead>

            {/* Student Rows */}
            <tbody>
              {students.map((student, index) => (
                <tr
                  key={student.studentId || student.id}
                  className={`border-t border-gray-100 hover:bg-gray-50/50 ${
                    index % 2 === 0 ? "bg-white/50" : "bg-gray-50/30"
                  }`}
                >
                  {/* Student Name Column */}
                  <td className="sticky left-0 bg-white/90 backdrop-blur-sm border-r border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-blue-700">
                          {(
                            student.name ||
                            student.firstName ||
                            "Student"
                          ).charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-800 truncate">
                          {student.name ||
                            `${student.firstName} ${student.lastName}` ||
                            "Unknown Student"}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {student.studentId || student.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Mark Input Cells */}
                  {assessments.map((assessment) => {
                    const studentMark =
                      marks[assessment.id]?.[student.studentId || student.id];
                    const marksObtained = studentMark?.marksObtained;
                    const cellKey = `${assessment.id}|${
                      student.studentId || student.id
                    }`;
                    const isSelected = selectedCell === cellKey;
                    const isPending = pendingChanges.has(cellKey);

                    return (
                      <td
                        key={assessment.id}
                        className="border-r border-gray-100 p-2"
                      >
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max={assessment.totalMarks}
                            step="0.5"
                            value={
                              marksObtained !== null &&
                              marksObtained !== undefined
                                ? marksObtained
                                : ""
                            }
                            onChange={(e) =>
                              handleMarkChange(
                                assessment.id,
                                student.studentId || student.id,
                                e.target.value
                              )
                            }
                            onFocus={() => setSelectedCell(cellKey)}
                            onBlur={() => setSelectedCell(null)}
                            className={`w-full px-3 py-2 rounded-lg border text-center transition-all ${
                              isPending
                                ? "border-yellow-300 bg-yellow-50"
                                : isSelected
                                ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100"
                                : "border-gray-200 hover:border-gray-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                            } focus:outline-none`}
                            placeholder="-"
                          />
                          {marksObtained !== null &&
                            marksObtained !== undefined && (
                              <div className="text-xs text-gray-500 text-center mt-1">
                                {Math.round(
                                  (marksObtained / assessment.totalMarks) * 100
                                )}
                                %
                              </div>
                            )}
                        </div>
                      </td>
                    );
                  })}

                  {/* Final Grade Column */}
                  <td className="border-l-2 border-indigo-200 p-4 bg-indigo-50/30">
                    <div className="text-center">
                      {(() => {
                        const average = calculateStudentAverage(
                          student.studentId || student.id
                        );
                        if (average === null) {
                          return (
                            <span className="text-gray-400 text-sm">-</span>
                          );
                        }
                        return (
                          <div>
                            <div
                              className={`text-lg font-bold ${
                                average >= 80
                                  ? "text-green-600"
                                  : average >= 70
                                  ? "text-blue-600"
                                  : average >= 60
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {Math.round(average)}%
                            </div>
                            <div
                              className={`text-xs font-medium ${
                                average >= 80
                                  ? "text-green-500"
                                  : average >= 70
                                  ? "text-blue-500"
                                  : average >= 60
                                  ? "text-yellow-500"
                                  : "text-red-500"
                              }`}
                            >
                              {average >= 80
                                ? "A"
                                : average >= 70
                                ? "B"
                                : average >= 60
                                ? "C"
                                : "F"}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Helper Text */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-2">
              💡 Tips for using the marks grid:
            </p>
            <ul className="space-y-1 text-xs">
              <li>
                • Type marks directly into cells - changes save automatically
                after 1 second
              </li>
              <li>
                • Use the eye icon (👁) in column headers to publish/hide marks
                from students
              </li>
              <li>
                • Yellow cells indicate unsaved changes, green check means all
                saved
              </li>
              <li>
                • Final grades show averages of published assessments only
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarksGrid;
