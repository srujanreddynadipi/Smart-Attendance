import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Users, 
  MapPin, 
  BookOpen, 
  Settings, 
  Copy, 
  Check, 
  X, 
  Edit3, 
  Trash2,
  UserPlus,
  Clock,
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  createClassroom,
  getTeacherClassrooms,
  updateClassroom,
  deleteClassroom,
  getClassroomJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  addSubjectToClassroom,
  updateSubject,
  deleteSubject,
  removeStudentFromClassroom
} from '../firebase/classrooms';

const ClassroomManagement = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [classroomModalTab, setClassroomModalTab] = useState('subjects');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [classroomForm, setClassroomForm] = useState({
    name: '',
    description: '',
    academicYear: '2024-25',
    semester: ''
  });

  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    credits: '',
    location: {
      name: '',
      address: '',
      latitude: '',
      longitude: ''
    }
  });

  useEffect(() => {
    loadClassrooms();
    loadJoinRequests();
  }, [userData]);

  const loadClassrooms = async () => {
    if (userData?.uid) {
      setLoading(true);
      try {
        console.log('Loading classrooms for teacher:', userData.uid);
        const result = await getTeacherClassrooms(userData.uid);
        console.log('Classrooms loaded:', result);
        
        if (result.success) {
          setClassrooms(result.classrooms);
          console.log('Classrooms set in state:', result.classrooms);
        } else {
          console.error('Failed to load classrooms:', result.error);
        }
      } catch (error) {
        console.error('Error loading classrooms:', error);
      }
      setLoading(false);
    }
  };

  const loadJoinRequests = async () => {
    if (userData?.uid) {
      try {
        console.log('Loading join requests for teacher:', userData.uid);
        const result = await getClassroomJoinRequests(userData.uid);
        console.log('Join requests result:', result);
        
        if (result.success) {
          setJoinRequests(result.requests);
          console.log('Join requests set in state:', result.requests);
        } else {
          console.error('Failed to load join requests:', result.error);
        }
      } catch (error) {
        console.error('Error loading join requests:', error);
      }
    }
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Creating classroom with data:', {
        ...classroomForm,
        teacherId: userData.uid,
        teacherName: userData.name
      });

      const result = await createClassroom({
        ...classroomForm,
        teacherId: userData.uid,
        teacherName: userData.name
      });

      console.log('Classroom creation result:', result);

      if (result.success) {
        setShowCreateModal(false);
        setClassroomForm({ name: '', description: '', academicYear: '2024-25', semester: '' });
        alert(`Classroom created successfully! Code: ${result.code}`);
        
        // Reload classrooms from Firebase to ensure data consistency
        await loadClassrooms();
      } else {
        alert('Error creating classroom: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating classroom:', error);
      alert('Error creating classroom: ' + error.message);
    }
    setLoading(false);
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!selectedClassroom) return;

    setLoading(true);
    try {
      const result = await addSubjectToClassroom(selectedClassroom.id, subjectForm);
      
      if (result.success) {
        // Update local state
        const updatedClassrooms = classrooms.map(classroom => 
          classroom.id === selectedClassroom.id 
            ? { ...classroom, subjects: [...(classroom.subjects || []), { id: result.subjectId, ...subjectForm }] }
            : classroom
        );
        setClassrooms(updatedClassrooms);
        setSelectedClassroom({
          ...selectedClassroom,
          subjects: [...(selectedClassroom.subjects || []), { id: result.subjectId, ...subjectForm }]
        });
        setShowSubjectModal(false);
        setSubjectForm({
          name: '', code: '', credits: '',
          location: { name: '', address: '', latitude: '', longitude: '' }
        });
        alert('Subject added successfully!');
      } else {
        alert('Error adding subject: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding subject:', error);
      alert('Error adding subject');
    }
    setLoading(false);
  };

  const handleApproveRequest = async (requestId, classroomId) => {
    try {
      console.log('UI: Approving request:', requestId, 'for classroom:', classroomId);
      const result = await approveJoinRequest(requestId, classroomId);
      console.log('UI: Approve result:', result);
      
      if (result.success) {
        console.log('UI: Request approved successfully, updating UI');
        
        // Reload classrooms to get updated data
        await loadClassrooms();
        
        // Reload join requests to update the list
        await loadJoinRequests();
        
        // If this is the selected classroom, update its data
        if (selectedClassroom && selectedClassroom.id === classroomId) {
          const updatedClassrooms = await getTeacherClassrooms(userData.uid);
          if (updatedClassrooms.success) {
            const updatedClassroom = updatedClassrooms.classrooms.find(c => c.id === classroomId);
            if (updatedClassroom) {
              setSelectedClassroom(updatedClassroom);
              console.log('Updated selected classroom with new student:', updatedClassroom);
            }
          }
        }
        
        alert('Student request approved and added to classroom!');
      } else {
        console.error('UI: Failed to approve request:', result.error);
        alert('Failed to approve request: ' + result.error);
      }
    } catch (error) {
      console.error('UI: Error approving request:', error);
      alert('Error approving request: ' + error.message);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const result = await rejectJoinRequest(requestId);
      if (result.success) {
        setJoinRequests(joinRequests.filter(req => req.id !== requestId));
        alert('Student request rejected!');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  // Helper function to get join requests for a specific classroom
  const getJoinRequestsForClassroom = (classroomId) => {
    const classroomRequests = joinRequests.filter(request => request.classroomId === classroomId);
    console.log(`Join requests for classroom ${classroomId}:`, classroomRequests);
    return classroomRequests;
  };

  const copyClassroomCode = (code) => {
    if (code) {
      navigator.clipboard.writeText(code);
      alert('Classroom code copied to clipboard!');
    } else {
      alert('Classroom code not available');
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSubjectForm(prev => ({
            ...prev,
            location: {
              ...prev.location,
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString()
            }
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get current location. Please enter coordinates manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const filteredClassrooms = classrooms.filter(classroom =>
    classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classroom.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 sm:p-6 safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/50 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <button 
              onClick={() => navigate('/teacher')}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-2 transition-colors text-sm sm:text-base touch-manipulation"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-800 truncate">Classroom Management</h1>
            <p className="text-sm sm:text-base text-gray-600">Create and manage your classrooms, subjects, and students</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 sm:px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 text-sm sm:text-base min-h-12 touch-manipulation w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Create Classroom</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 sm:space-y-6">
        {/* Search and Filter */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/50">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search classrooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-12"
              />
            </div>
            <button className="px-6 py-3 bg-white/50 border border-gray-200 rounded-xl hover:bg-white/70 transition-colors flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter
            </button>
          </div>
        </div>

        {/* Classrooms Grid */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">My Classrooms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClassrooms.map((classroom) => {
              const classroomRequests = getJoinRequestsForClassroom(classroom.id);
              return (
                <div key={classroom.id} className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{classroom.name}</h3>
                      <p className="text-gray-600 text-sm mb-3">{classroom.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{classroom.academicYear}</span>
                        <span>•</span>
                        <span>Sem {classroom.semester}</span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Students</span>
                      <span className="font-semibold text-blue-600">{classroom.studentCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Subjects</span>
                      <span className="font-semibold text-green-600">{classroom.subjects?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Classroom Code</span>
                      <button
                        onClick={() => copyClassroomCode(classroom.code)}
                        className="flex items-center gap-1 text-purple-600 hover:text-purple-800"
                      >
                        <span className="font-mono text-sm">{classroom.code || 'N/A'}</span>
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    {classroomRequests.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Join Requests</span>
                        <span className="font-semibold text-orange-600">{classroomRequests.length}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedClassroom(classroom)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-300"
                    >
                      Manage
                    </button>
                    {classroomRequests.length > 0 && (
                      <button 
                        onClick={() => setSelectedClassroom(classroom)}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-1"
                        title={`${classroomRequests.length} join request${classroomRequests.length > 1 ? 's' : ''}`}
                      >
                        <UserPlus className="w-4 h-4" />
                        {classroomRequests.length}
                      </button>
                    )}
                    <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredClassrooms.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Classrooms Found</h3>
              <p className="text-gray-500 mb-6">Create your first classroom to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Create Classroom
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Classroom Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Classroom</h2>
            <form onSubmit={handleCreateClassroom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Classroom Name *</label>
                <input
                  type="text"
                  required
                  value={classroomForm.name}
                  onChange={(e) => setClassroomForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Computer Science - Year 3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={classroomForm.description}
                  onChange={(e) => setClassroomForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the classroom"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                  <select
                    value={classroomForm.academicYear}
                    onChange={(e) => setClassroomForm(prev => ({ ...prev, academicYear: e.target.value }))}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="2024-25">2024-25</option>
                    <option value="2025-26">2025-26</option>
                    <option value="2026-27">2026-27</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                  <select
                    value={classroomForm.semester}
                    onChange={(e) => setClassroomForm(prev => ({ ...prev, semester: e.target.value }))}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Semester</option>
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                    <option value="3">3rd Semester</option>
                    <option value="4">4th Semester</option>
                    <option value="5">5th Semester</option>
                    <option value="6">6th Semester</option>
                    <option value="7">7th Semester</option>
                    <option value="8">8th Semester</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 px-6 border border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Classroom Detail Modal */}
      {selectedClassroom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedClassroom.name}</h2>
                <p className="text-gray-600">{selectedClassroom.description}</p>
              </div>
              <button
                onClick={() => setSelectedClassroom(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Classroom Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-6">
              <button 
                onClick={() => setClassroomModalTab('subjects')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  classroomModalTab === 'subjects' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Subjects
              </button>
              <button 
                onClick={() => setClassroomModalTab('students')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  classroomModalTab === 'students' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Students
              </button>
              <button 
                onClick={() => setClassroomModalTab('requests')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  classroomModalTab === 'requests' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Join Requests ({getJoinRequestsForClassroom(selectedClassroom.id).length})
              </button>
              <button 
                onClick={() => setClassroomModalTab('settings')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  classroomModalTab === 'settings' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Settings
              </button>
            </div>

            {/* Tab Content */}
            {classroomModalTab === 'subjects' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Subjects</h3>
                  <button
                    onClick={() => setShowSubjectModal(true)}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Subject
                  </button>
                </div>

              {selectedClassroom.subjects?.length === 0 || !selectedClassroom.subjects ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No subjects added yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedClassroom.subjects.map((subject) => (
                    <div key={subject.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">{subject.name}</h4>
                          <p className="text-sm text-gray-600">Code: {subject.code}</p>
                          <p className="text-sm text-gray-600">Credits: {subject.credits}</p>
                        </div>
                        <div className="flex gap-1">
                          <button className="text-blue-600 hover:text-blue-800">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-800">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {subject.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>{subject.location.name || subject.location.address}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              </div>
            )}

            {classroomModalTab === 'students' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Students</h3>
                <div className="space-y-3">
                  {selectedClassroom.students?.map((student) => (
                    <div key={student.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800">{student.name}</h4>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </div>
                      <button className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(!selectedClassroom.students || selectedClassroom.students.length === 0) && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No students enrolled yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {classroomModalTab === 'requests' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Join Requests</h3>
                <div className="space-y-3">
                  {getJoinRequestsForClassroom(selectedClassroom.id).map((request) => (
                    <div key={request.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800">{request.studentName}</h4>
                          <p className="text-sm text-gray-600">{request.studentEmail}</p>
                          <p className="text-xs text-gray-500">
                            Requested: {request.requestedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveRequest(request.id, request.classroomId)}
                            className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                          >
                            <Check className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getJoinRequestsForClassroom(selectedClassroom.id).length === 0 && (
                    <div className="text-center py-8">
                      <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No join requests</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {classroomModalTab === 'settings' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Classroom Settings</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Classroom Code</span>
                      <button
                        onClick={() => copyClassroomCode(selectedClassroom.code)}
                        className="flex items-center gap-1 text-purple-600 hover:text-purple-800"
                      >
                        <span className="font-mono text-sm">{selectedClassroom.code || 'N/A'}</span>
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Subject</h2>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Data Structures"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Code *</label>
                  <input
                    type="text"
                    required
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., CS301"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Credits</label>
                  <input
                    type="number"
                    value={subjectForm.credits}
                    onChange={(e) => setSubjectForm(prev => ({ ...prev, credits: e.target.value }))}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="3"
                  />
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Location Details</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location Name</label>
                  <input
                    type="text"
                    value={subjectForm.location.name}
                    onChange={(e) => setSubjectForm(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, name: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Room 101, Computer Lab"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={subjectForm.location.address}
                    onChange={(e) => setSubjectForm(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, address: e.target.value }
                    }))}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Full address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={subjectForm.location.latitude}
                      onChange={(e) => setSubjectForm(prev => ({ 
                        ...prev, 
                        location: { ...prev.location, latitude: e.target.value }
                      }))}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={subjectForm.location.longitude}
                      onChange={(e) => setSubjectForm(prev => ({ 
                        ...prev, 
                        location: { ...prev.location, longitude: e.target.value }
                      }))}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.000000"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="mt-3 w-full py-2 px-4 bg-blue-100 text-blue-600 rounded-xl font-semibold hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Use Current Location
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="flex-1 py-3 px-6 border border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomManagement;