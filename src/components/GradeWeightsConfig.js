import React, { useState, useEffect } from "react";
import { X, Settings, Save, AlertCircle } from "lucide-react";
import { useNotifications } from "../contexts/NotificationContext";
import { configureGradeWeights } from "../firebase/gradebook";

const GradeWeightsConfig = ({
  classroom,
  currentWeights = {},
  onClose,
  onSuccess,
}) => {
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [weights, setWeights] = useState({
    EXAM: 0,
    QUIZ: 0,
    HOMEWORK: 0,
    PROJECT: 0,
    ...currentWeights,
  });

  const [totalWeight, setTotalWeight] = useState(0);

  // Calculate total weight whenever weights change
  useEffect(() => {
    const total = Object.values(weights).reduce((sum, weight) => {
      return sum + (parseFloat(weight) || 0);
    }, 0);
    setTotalWeight(total);
  }, [weights]);

  const handleWeightChange = (type, value) => {
    const numericValue = parseFloat(value) || 0;
    setWeights((prev) => ({
      ...prev,
      [type]: numericValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Validation
    if (Math.abs(totalWeight - 100) > 0.01) {
      showError("Total weight must equal 100%");
      return;
    }

    // Check if at least one weight is set
    const hasWeights = Object.values(weights).some((weight) => weight > 0);
    if (!hasWeights) {
      showError(
        "At least one assessment type must have a weight greater than 0"
      );
      return;
    }

    setLoading(true);

    try {
      const result = await configureGradeWeights(classroom.id, weights);

      if (result.success) {
        showSuccess("Grade weights configured successfully");
        onSuccess(weights);
      } else {
        showError(result.error || "Failed to configure weights");
      }
    } catch (error) {
      console.error("Error configuring weights:", error);
      showError("Failed to configure weights");
    } finally {
      setLoading(false);
    }
  };

  const getWeightColor = () => {
    if (Math.abs(totalWeight - 100) < 0.01) {
      return "text-green-600";
    } else if (totalWeight > 100) {
      return "text-red-600";
    } else {
      return "text-yellow-600";
    }
  };

  const assessmentTypes = [
    { key: "EXAM", label: "Exams", description: "Final exams, midterms, etc." },
    { key: "QUIZ", label: "Quizzes", description: "Pop quizzes, short tests" },
    {
      key: "HOMEWORK",
      label: "Homework",
      description: "Take-home assignments",
    },
    {
      key: "PROJECT",
      label: "Projects",
      description: "Long-term projects, presentations",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                Configure Grade Weights
              </h3>
              <p className="text-sm text-gray-600">{classroom?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">How Grade Weights Work</p>
              <p>
                Set the percentage each assessment type contributes to the final
                grade. The total must equal 100%.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Weight Configuration */}
          <div className="space-y-4">
            {assessmentTypes.map((type) => (
              <div
                key={type.key}
                className="border border-gray-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {type.label}
                    </h4>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={weights[type.key] || ""}
                      onChange={(e) =>
                        handleWeightChange(type.key, e.target.value)
                      }
                      className="w-20 px-3 py-2 rounded-lg border border-gray-200 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <span className="text-gray-600 font-medium">%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total Weight Display */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-800">Total Weight:</span>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${getWeightColor()}`}>
                  {totalWeight.toFixed(1)}%
                </span>
                {Math.abs(totalWeight - 100) < 0.01 && (
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                )}
              </div>
            </div>
            {Math.abs(totalWeight - 100) > 0.01 && (
              <p className="text-sm text-gray-600 mt-2">
                {totalWeight > 100
                  ? `Reduce by ${(totalWeight - 100).toFixed(1)}% to reach 100%`
                  : `Add ${(100 - totalWeight).toFixed(1)}% to reach 100%`}
              </p>
            )}
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
              disabled={loading || Math.abs(totalWeight - 100) > 0.01}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Weights
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GradeWeightsConfig;
