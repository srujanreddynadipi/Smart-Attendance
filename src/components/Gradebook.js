import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  BarChart3,
  Save,
  Filter,
  Calendar,
  Target,
  TrendingUp,
  Users,
  Award,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import {
  getClassroomAssessments,
  subscribeToAssessments,
  deleteAssessment,
  toggleAssessmentPublishing,
  getGradeWeights,
  getAssessmentAnalytics,
} from "../firebase/gradebook";
import AssessmentForm from "./AssessmentForm";
import GradeWeightsConfig from "./GradeWeightsConfig";
import MarksGrid from "./MarksGrid";

const Gradebook = ({ classroom, students = [] }) => {
  const { userData } = useAuth();
  const { showSuccess, showError, confirmDialog } = useNotifications();

  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [showWeightsConfig, setShowWeightsConfig] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [gradeWeights, setGradeWeights] = useState({});
  const [assessmentAnalytics, setAssessmentAnalytics] = useState({});

  // Load initial data
  useEffect(() => {
    if (!classroom?.id) return;

    loadAssessments();
    loadGradeWeights();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToAssessments(
      classroom.id,
      (updatedAssessments) => {
        setAssessments(updatedAssessments);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [classroom?.id]);

  const loadAssessments = async () => {
    try {
      const result = await getClassroomAssessments(classroom.id);
      if (result.success) {
        setAssessments(result.assessments);
      }
    } catch (error) {
      console.error("Error loading assessments:", error);
      showError("Failed to load assessments");
    } finally {
      setLoading(false);
    }
  };

  const loadGradeWeights = async () => {
    try {
      const result = await getGradeWeights(classroom.id);
      if (result.success) {
        setGradeWeights(result.weights);
      }
    } catch (error) {
      console.error("Error loading grade weights:", error);
    }
  };

  const handleDeleteAssessment = async (assessmentId, assessmentName) => {
    const confirmed = await confirmDialog({
      title: "Delete Assessment",
      message: `Are you sure you want to delete "${assessmentName}"? This will also delete all student marks for this assessment.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });

    if (confirmed) {
      try {
        const result = await deleteAssessment(classroom.id, assessmentId);
        if (result.success) {
          showSuccess("Assessment deleted successfully");
        } else {
          showError(result.error || "Failed to delete assessment");
        }
      } catch (error) {
        console.error("Error deleting assessment:", error);
        showError("Failed to delete assessment");
      }
    }
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
      } else {
        showError(result.error || "Failed to update publishing status");
      }
    } catch (error) {
      console.error("Error toggling publishing:", error);
      showError("Failed to update publishing status");
    }
  };

  const loadAssessmentAnalytics = async (assessmentId) => {
    try {
      const result = await getAssessmentAnalytics(classroom.id, assessmentId);
      if (result.success) {
        setAssessmentAnalytics((prev) => ({
          ...prev,
          [assessmentId]: result.analytics,
        }));
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  const getAssessmentTypeIcon = (type) => {
    const iconMap = {
      EXAM: Target,
      QUIZ: BookOpen,
      HOMEWORK: Edit3,
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
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gradebook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Gradebook</h2>
              <p className="text-sm text-gray-600">{classroom?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWeightsConfig(true)}
              className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl hover:bg-blue-200 transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Configure Weights
            </button>
            <button
              onClick={() => {
                setEditingAssessment(null);
                setShowAssessmentForm(true);
              }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Assessment
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100/50 rounded-xl p-1">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "marks", label: "Marks Entry", icon: Edit3 },
            { id: "analytics", label: "Analytics", icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "bg-white shadow-sm text-indigo-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Assessment List */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Assessments
              </h3>
              <div className="text-sm text-gray-600">
                {assessments.length} assessment
                {assessments.length !== 1 ? "s" : ""}
              </div>
            </div>

            {assessments.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-600 mb-2">
                  No Assessments Yet
                </h4>
                <p className="text-gray-500 mb-6">
                  Create your first assessment to start tracking student grades.
                </p>
                <button
                  onClick={() => setShowAssessmentForm(true)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create Assessment
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {assessments.map((assessment) => {
                  const TypeIcon = getAssessmentTypeIcon(assessment.type);
                  const analytics = assessmentAnalytics[assessment.id];

                  return (
                    <div
                      key={assessment.id}
                      className="border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <TypeIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">
                              {assessment.name}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span
                                className={`px-2 py-1 rounded border text-xs font-medium ${getAssessmentTypeColor(
                                  assessment.type
                                )}`}
                              >
                                {assessment.type}
                              </span>
                              <span>•</span>
                              <Calendar className="w-3 h-3" />
                              {assessment.date?.toLocaleDateString()}
                              <span>•</span>
                              <Target className="w-3 h-3" />
                              {assessment.totalMarks} marks
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              loadAssessmentAnalytics(assessment.id)
                            }
                            className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                            title="View Analytics"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleTogglePublishing(
                                assessment.id,
                                assessment.isPublished
                              )
                            }
                            className={`p-2 rounded-lg transition-colors ${
                              assessment.isPublished
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                            title={
                              assessment.isPublished
                                ? "Published to Students"
                                : "Hidden from Students"
                            }
                          >
                            {assessment.isPublished ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setEditingAssessment(assessment);
                              setShowAssessmentForm(true);
                            }}
                            className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Edit Assessment"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteAssessment(
                                assessment.id,
                                assessment.name
                              )
                            }
                            className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 transition-colors"
                            title="Delete Assessment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Analytics Preview */}
                      {analytics && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-gray-500">Students</div>
                              <div className="font-semibold text-gray-800">
                                {analytics.studentsAttempted}/
                                {analytics.totalStudents}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">Average</div>
                              <div className="font-semibold text-gray-800">
                                {analytics.average}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">Highest</div>
                              <div className="font-semibold text-green-600">
                                {analytics.highest}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">Lowest</div>
                              <div className="font-semibold text-red-600">
                                {analytics.lowest}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "marks" && (
        <MarksGrid
          classroom={classroom}
          students={students}
          assessments={assessments}
          onMarksUpdated={loadAssessments}
        />
      )}

      {activeTab === "analytics" && (
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">
              Analytics Coming Soon
            </h4>
            <p className="text-gray-500">
              Detailed class performance analytics will be available here.
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAssessmentForm && (
        <AssessmentForm
          classroom={classroom}
          assessment={editingAssessment}
          onClose={() => {
            setShowAssessmentForm(false);
            setEditingAssessment(null);
          }}
          onSuccess={() => {
            setShowAssessmentForm(false);
            setEditingAssessment(null);
            loadAssessments();
          }}
        />
      )}

      {showWeightsConfig && (
        <GradeWeightsConfig
          classroom={classroom}
          currentWeights={gradeWeights}
          onClose={() => setShowWeightsConfig(false)}
          onSuccess={(newWeights) => {
            setGradeWeights(newWeights);
            setShowWeightsConfig(false);
          }}
        />
      )}
    </div>
  );
};

export default Gradebook;
