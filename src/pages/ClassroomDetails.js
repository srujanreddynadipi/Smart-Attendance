import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  ArrowLeft, 
  Users, 
  MapPin, 
  Calendar, 
  BookOpen, 
  QrCode,
  Camera,
  Clock,
  Copy,
  CheckCircle,
  Plus,
  Edit3,
  Trash2,
  X
} from 'lucide-react';
import { 
  getClassroomById,
  addSubjectToClassroom,
  updateSubject,
  deleteSubject
} from '../firebase/classrooms';
import QRGenerator from '../components/QRGenerator';

const ClassroomDetails = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { showSuccess, showError, confirmDelete, showLoading, hideLoading } = useNotifications();
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showStudentsList, setShowStudentsList] = useState(false);

  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    credits: '',
    description: ''
  });

  useEffect(() => {
    loadClassroomDetails();
  }, [classroomId]);

  const loadClassroomDetails = async () => {
    try {
      setLoading(true);
      console.log('Loading classroom details for ID:', classroomId);
      
      const result = await getClassroomById(classroomId);
      console.log('Classroom details result:', result);
      
      if (result.success) {
        setClassroom(result.classroom);
      } else {
        setError(result.error || 'Failed to load classroom details');
      }
    } catch (error) {
      console.error('Error loading classroom:', error);
      setError('Failed to load classroom details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async () => {
    try {
      showLoading('Adding subject...');
      const result = await addSubjectToClassroom(classroomId, newSubject);
      if (result.success) {
        await loadClassroomDetails(); // Reload to get updated data
        setNewSubject({ name: '', code: '', credits: '', description: '' });
        setShowAddSubject(false);
        hideLoading();
        showSuccess(`Subject "${newSubject.name}" added successfully!`);
      } else {
        hideLoading();
        showError('Failed to add subject: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding subject:', error);
      hideLoading();
      showError('Error adding subject. Please try again.');
    }
  };

  const handleUpdateSubject = async (subjectId, updatedData) => {
    try {
      showLoading('Updating subject...');
      const result = await updateSubject(classroomId, subjectId, updatedData);
      if (result.success) {
        await loadClassroomDetails();
        setEditingSubject(null);
        hideLoading();
        showSuccess('Subject updated successfully!');
      } else {
        hideLoading();
        showError('Failed to update subject: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating subject:', error);
      hideLoading();
      showError('Error updating subject. Please try again.');
    }
  };

  const handleDeleteSubject = async (subject) => {
    const confirmed = await confirmDelete(
      subject.name,
      async () => {
        try {
          showLoading('Deleting subject...');
          const result = await deleteSubject(classroomId, subject.id);
          if (result.success) {
            await loadClassroomDetails();
            hideLoading();
            showSuccess(`Subject "${subject.name}" deleted successfully!`);
          } else {
            hideLoading();
            showError('Failed to delete subject: ' + result.error);
          }
        } catch (error) {
          console.error('Error deleting subject:', error);
          hideLoading();
          showError('Error deleting subject. Please try again.');
        }
      }
    );
  };

  const copyClassroomCode = () => {
    if (classroom?.code) {
      navigator.clipboard.writeText(classroom.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading classroom details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/teacher-dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Classroom not found</p>
          <button 
            onClick={() => navigate('/teacher-dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 safe-area-top safe-area-bottom">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/teacher-dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-sm sm:text-base min-h-10 touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-800 truncate">{classroom.name}</h1>
            <p className="text-sm sm:text-base text-gray-600">{classroom.description || 'No description available'}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Classroom Info */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Classroom Code Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Classroom Code</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-50 rounded-lg p-3 font-mono text-base sm:text-lg font-bold text-center min-h-12">
                  {classroom.code || 'N/A'}
                </div>
                <button
                  onClick={copyClassroomCode}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-12 min-w-12 flex items-center justify-center touch-manipulation"
                  disabled={!classroom.code}
                >
                  {copiedCode ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">Share this code with students to join</p>
            </div>

            {/* Classroom Info Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Information</h3>
              <div className="space-y-4">
                <div 
                  className="flex items-center gap-3 cursor-pointer hover:bg-blue-50 p-3 rounded-lg transition-colors touch-manipulation"
                  onClick={() => setShowStudentsList(true)}
                >
                  <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base">Students</p>
                    <p className="text-xs sm:text-sm text-gray-600">{classroom.studentCount || 0} enrolled</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Academic Year</p>
                    <p className="text-sm text-gray-600">{classroom.academicYear || 'N/A'}</p>
                  </div>
                </div>

                {classroom.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-gray-600">{classroom.location.name || 'N/A'}</p>
                      {classroom.location.address && (
                        <p className="text-xs text-gray-500">{classroom.location.address}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Subjects</p>
                    <p className="text-sm text-gray-600">{classroom.subjects?.length || 0} subjects</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  <QrCode className="w-5 h-5" />
                  Generate QR Code
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                  <Camera className="w-5 h-5" />
                  Face Recognition
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                  <Clock className="w-5 h-5" />
                  Take Attendance
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Subjects */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Subjects</h3>
                <button
                  onClick={() => setShowAddSubject(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Subject
                </button>
              </div>

              {/* Subjects List */}
              <div className="space-y-4">
                {classroom.subjects && classroom.subjects.length > 0 ? (
                  classroom.subjects.map((subject) => (
                    <div key={subject.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{subject.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">Code: {subject.code}</p>
                          {subject.credits && (
                            <p className="text-sm text-gray-600 mb-2">Credits: {subject.credits}</p>
                          )}
                          {subject.description && (
                            <p className="text-sm text-gray-500 mb-3">{subject.description}</p>
                          )}
                          <button
                            onClick={() => {
                              setSelectedSubject(subject);
                              setShowQRGenerator(true);
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
                            Generate QR Code
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingSubject(subject)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(subject)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No subjects added yet</p>
                    <p className="text-gray-400">Add subjects to organize your classroom content</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Add New Subject</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                <input
                  type="text"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., CS101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                <input
                  type="number"
                  value={newSubject.credits}
                  onChange={(e) => setNewSubject({...newSubject, credits: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({...newSubject, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the subject"
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddSubject(false);
                  setNewSubject({ name: '', code: '', credits: '', description: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubject}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Subject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Students List Modal */}
      {showStudentsList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Enrolled Students</h3>
              <button
                onClick={() => setShowStudentsList(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {classroom.students && classroom.students.length > 0 ? (
                classroom.students.map((student, index) => (
                  <div key={student.id || index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{student.name}</h4>
                      <p className="text-sm text-gray-600">{student.email}</p>
                      <p className="text-xs text-gray-500">
                        Student ID: {student.id}
                      </p>
                      {student.joinedAt && (
                        <p className="text-xs text-gray-500">
                          Joined: {student.joinedAt.toDate ? student.joinedAt.toDate().toLocaleDateString() : new Date(student.joinedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-600 mb-2">No Students Enrolled</h4>
                  <p className="text-gray-500">Students will appear here once they join the classroom</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Total Students: {classroom.students?.length || 0}</span>
                <span>Classroom Code: {classroom.code}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Generator Modal */}
      {showQRGenerator && (
        <QRGenerator 
          classroomId={classroomId}
          subjectData={selectedSubject}
          onClose={() => {
            setShowQRGenerator(false);
            setSelectedSubject(null);
          }} 
        />
      )}
    </div>
  );
};

export default ClassroomDetails;