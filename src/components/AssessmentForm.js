import React, { useState, useEffect } from "react";
import { X, Calendar, Target, FileText, BookOpen, Save } from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";
import { createAssessment, updateAssessment } from "../firebase/gradebook";

const AssessmentForm = ({
  classroom,
  assessment = null,
  onClose,
  onSuccess,
}) => {
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "EXAM",
    totalMarks: "",
    date: "",
    description: "",
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (assessment) {
      setFormData({
        name: assessment.name || "",
        type: assessment.type || "EXAM",
        totalMarks: assessment.totalMarks?.toString() || "",
        date: assessment.date
          ? assessment.date.toISOString().split("T")[0]
          : "",
        description: assessment.description || "",
      });
    }
  }, [assessment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Validation
    if (!formData.name.trim()) {
      showError("Assessment name is required");
      return;
    }

    if (!formData.totalMarks || parseInt(formData.totalMarks) <= 0) {
      showError("Total marks must be a positive number");
      return;
    }

    if (!formData.date) {
      showError("Assessment date is required");
      return;
    }

    setLoading(true);

    try {
      const assessmentData = {
        name: formData.name.trim(),
        type: formData.type,
        totalMarks: parseInt(formData.totalMarks),
        date: formData.date,
        description: formData.description.trim(),
      };

      let result;
      if (assessment) {
        // Update existing assessment
        result = await updateAssessment(
          classroom.id,
          assessment.id,
          assessmentData
        );
      } else {
        // Create new assessment
        result = await createAssessment(classroom.id, assessmentData);
      }

      if (result.success) {
        showSuccess(
          assessment
            ? "Assessment updated successfully"
            : "Assessment created successfully"
        );
        onSuccess();
      } else {
        showError(result.error || "Failed to save assessment");
      }
    } catch (error) {
      console.error("Error saving assessment:", error);
      showError("Failed to save assessment");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              {assessment ? "Edit Assessment" : "Create Assessment"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Assessment Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Assessment Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Mid-Term Exam"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* Assessment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assessment Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange("type", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="EXAM">Exam</option>
              <option value="QUIZ">Quiz</option>
              <option value="HOMEWORK">Homework</option>
              <option value="PROJECT">Project</option>
            </select>
          </div>

          {/* Total Marks & Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Target className="w-4 h-4 inline mr-2" />
                Total Marks *
              </label>
              <input
                type="number"
                min="1"
                value={formData.totalMarks}
                onChange={(e) =>
                  handleInputChange("totalMarks", e.target.value)
                }
                placeholder="100"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Additional details about this assessment..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {assessment ? "Update" : "Create"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssessmentForm;
