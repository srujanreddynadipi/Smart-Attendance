import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, Users, BookOpen, BarChart2, GraduationCap, UserCheck, TrendingUp, Bell, Settings, Search, Upload, UserPlus, Trash2, Edit, Key, Check, CheckCircle, AlertCircle, Info, ChevronRight, FileText, Award, DollarSign, Activity, PieChart as PieChartLucide, Edit2, X, LogOut, Plus, Download, ClipboardCheck } from 'lucide-react';
import { registerUser, logoutUser } from '../firebase/auth';
import { useAuth } from '../contexts/AuthContext';

const SchoolManagementDashboard = ({ onLogout }) => {
    const { userData } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [filterRole, setFilterRole] = useState('all');
    const [notification, setNotification] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    // Form data for adding new users
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        class: '',
        subject: '',
        department: '',
        employeeId: '',
        designation: '',
        address: ''
    });

    // Sample data
    const [users, setUsers] = useState({
        students: [
            { id: 'ST001', name: 'John Doe', email: 'john@email.com', class: 'CS-301', status: 'approved', attendance: 92 },
            { id: 'ST002', name: 'Jane Smith', email: 'jane@email.com', class: 'CS-301', status: 'pending', attendance: 88 },
            { id: 'ST003', name: 'Mike Johnson', email: 'mike@email.com', class: 'CS-302', status: 'approved', attendance: 95 },
            { id: 'ST004', name: 'Sarah Wilson', email: 'sarah@email.com', class: 'CS-302', status: 'approved', attendance: 90 },
        ],
        teachers: [
            { id: 'T001', name: 'Dr. Robert Brown', email: 'robert@school.edu', subject: 'Computer Science', classes: 3 },
            { id: 'T002', name: 'Prof. Emily Davis', email: 'emily@school.edu', subject: 'Mathematics', classes: 4 },
            { id: 'T003', name: 'Dr. Chris Miller', email: 'chris@school.edu', subject: 'Physics', classes: 2 },
        ],
        parents: [
            { id: 'P001', name: 'Michael Doe', email: 'mdoe@email.com', children: ['ST001'], phone: '+1234567890' },
            { id: 'P002', name: 'Anna Smith', email: 'asmith@email.com', children: ['ST002'], phone: '+0987654321' },
        ]
    });

    const [analytics] = useState({
        totalStudents: 156,
        totalTeachers: 24,
        totalParents: 142,
        averageAttendance: 91,
        monthlyData: [
            { month: 'Jan', students: 140, attendance: 88 },
            { month: 'Feb', students: 145, attendance: 90 },
            { month: 'Mar', students: 150, attendance: 92 },
            { month: 'Apr', students: 152, attendance: 91 },
            { month: 'May', students: 156, attendance: 93 },
        ],
        departmentData: [
            { name: 'Computer Science', value: 45, color: '#3B82F6' },
            { name: 'Mathematics', value: 30, color: '#8B5CF6' },
            { name: 'Physics', value: 25, color: '#EC4899' },
            { name: 'Chemistry', value: 20, color: '#F59E0B' },
        ],
        recentActivities: [
            { id: 1, action: 'New student registered', user: 'John Doe', time: '2 mins ago', type: 'info' },
            { id: 2, action: 'Teacher added', user: 'Dr. Sarah Lee', time: '15 mins ago', type: 'success' },
            { id: 3, action: 'Attendance report generated', user: 'System', time: '1 hour ago', type: 'info' },
            { id: 4, action: 'Password reset', user: 'Mike Johnson', time: '2 hours ago', type: 'warning' },
        ]
    });

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(''), 3000);
    };

    const handleAddUser = (type) => {
        setModalType(type);
        setShowAddModal(true);
        setSelectedUser(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            class: '',
            subject: '',
            department: '',
            employeeId: '',
            designation: '',
            address: ''
        });
    };

    const handleEditUser = (user, type) => {
        setSelectedUser(user);
        setModalType(type);
        setShowAddModal(true);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            password: '',
            phone: user.phone || '',
            class: user.class || '',
            subject: user.subject || '',
            department: user.department || '',
            employeeId: user.id || '',
            designation: user.designation || '',
            address: user.address || ''
        });
    };

    const handleDeleteUser = (userId, type) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            setUsers(prev => ({
                ...prev,
                [type]: prev[type].filter(u => u.id !== userId)
            }));
            showNotification('User deleted successfully');
        }
    };

    const handleApproveStudent = (studentId) => {
        setUsers(prev => ({
            ...prev,
            students: prev.students.map(s => 
                s.id === studentId ? { ...s, status: 'approved' } : s
            )
        }));
        showNotification('Student approved successfully');
    };

    const handleResetPassword = (userId) => {
        if (window.confirm('Send password reset email to this user?')) {
            showNotification('Password reset email sent');
        }
    };

    const handleLogout = async () => {
        try {
            await logoutUser();
            if (onLogout) {
                onLogout();
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleSubmitUser = async () => {
        setLoading(true);
        try {
            if (!formData.name || !formData.email || (!selectedUser && !formData.password)) {
                throw new Error('Please fill in all required fields');
            }

            if (modalType === 'teachers') {
                // Create teacher account using Firebase
                const teacherData = {
                    name: formData.name,
                    email: formData.email,
                    role: 'teacher',
                    phone: formData.phone,
                    subject: formData.subject,
                    department: formData.department,
                    employeeId: formData.employeeId,
                    designation: formData.designation,
                    address: formData.address,
                    dateOfJoining: new Date().toISOString().split('T')[0]
                };

                if (selectedUser) {
                    // Update existing teacher
                    setUsers(prev => ({
                        ...prev,
                        teachers: prev.teachers.map(t => 
                            t.id === selectedUser.id 
                                ? { ...t, ...teacherData, id: t.id }
                                : t
                        )
                    }));
                    showNotification('Teacher updated successfully');
                } else {
                    // Create new teacher
                    await registerUser(formData.email, formData.password, teacherData);
                    
                    // Add to local state (in real app, you'd fetch from Firebase)
                    const newTeacher = {
                        id: 'T' + String(Date.now()).slice(-3),
                        ...teacherData,
                        classes: 0
                    };
                    
                    setUsers(prev => ({
                        ...prev,
                        teachers: [...prev.teachers, newTeacher]
                    }));
                    showNotification('Teacher added successfully');
                }
            } else if (modalType === 'students') {
                // Handle student creation/update
                const studentData = {
                    name: formData.name,
                    email: formData.email,
                    role: 'student',
                    phone: formData.phone,
                    class: formData.class,
                    studentId: formData.employeeId || 'ST' + String(Date.now()).slice(-3)
                };

                if (selectedUser) {
                    setUsers(prev => ({
                        ...prev,
                        students: prev.students.map(s => 
                            s.id === selectedUser.id 
                                ? { ...s, ...studentData, id: s.id }
                                : s
                        )
                    }));
                    showNotification('Student updated successfully');
                } else {
                    await registerUser(formData.email, formData.password, studentData);
                    
                    const newStudent = {
                        id: studentData.studentId,
                        ...studentData,
                        status: 'approved',
                        attendance: 0
                    };
                    
                    setUsers(prev => ({
                        ...prev,
                        students: [...prev.students, newStudent]
                    }));
                    showNotification('Student added successfully');
                }
            }

            setShowAddModal(false);
            setFormData({
                name: '',
                email: '',
                password: '',
                phone: '',
                class: '',
                subject: '',
                department: '',
                employeeId: '',
                designation: '',
                address: ''
            });
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBulkUpload = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            showNotification(`Uploading ${file.name}...`);
            setTimeout(() => showNotification('Bulk upload completed successfully'), 2000);
        }
    };

    const renderOverview = () => (
        <div className="space-y-6 animate-slide-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                            <Users className="w-7 h-7 text-blue-600" />
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+12%</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800">{analytics.totalStudents}</h3>
                    <p className="text-sm text-gray-600 mt-1">Total Students</p>
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 bg-gradient-to-r from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center">
                            <GraduationCap className="w-7 h-7 text-purple-600" />
                        </div>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">+3</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800">{users.teachers.length}</h3>
                    <p className="text-sm text-gray-600 mt-1">Total Teachers</p>
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 bg-gradient-to-r from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center">
                            <UserCheck className="w-7 h-7 text-pink-600" />
                        </div>
                        <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">Active</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800">{analytics.totalParents}</h3>
                    <p className="text-sm text-gray-600 mt-1">Total Parents</p>
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 bg-gradient-to-r from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
                            <TrendingUp className="w-7 h-7 text-green-600" />
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">+2%</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800">{analytics.averageAttendance}%</h3>
                    <p className="text-sm text-gray-600 mt-1">Avg. Attendance</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Enrollment Trend */}
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Enrollment & Attendance Trend</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={analytics.monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="month" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="students" stroke="#3B82F6" strokeWidth={2} name="Students" />
                            <Line type="monotone" dataKey="attendance" stroke="#10B981" strokeWidth={2} name="Attendance %" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Department Distribution */}
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Department Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={analytics.departmentData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {analytics.departmentData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Recent Activities</h3>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
                </div>
                <div className="space-y-3">
                    {analytics.recentActivities.map(activity => (
                        <div key={activity.id} className="flex items-center justify-between p-4 bg-white/50 rounded-2xl hover:bg-white/70 transition-all duration-300">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    activity.type === 'success' ? 'bg-green-100' :
                                    activity.type === 'warning' ? 'bg-yellow-100' :
                                    'bg-blue-100'
                                }`}>
                                    {activity.type === 'success' ? <CheckCircle className={`w-5 h-5 ${
                                        activity.type === 'success' ? 'text-green-600' :
                                        activity.type === 'warning' ? 'text-yellow-600' :
                                        'text-blue-600'
                                    }`} /> :
                                    activity.type === 'warning' ? <AlertCircle className={`w-5 h-5 ${
                                        activity.type === 'success' ? 'text-green-600' :
                                        activity.type === 'warning' ? 'text-yellow-600' :
                                        'text-blue-600'
                                    }`} /> :
                                    <Info className={`w-5 h-5 ${
                                        activity.type === 'success' ? 'text-green-600' :
                                        activity.type === 'warning' ? 'text-yellow-600' :
                                        'text-blue-600'
                                    }`} />}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">{activity.action}</p>
                                    <p className="text-sm text-gray-600">{activity.user}</p>
                                </div>
                            </div>
                            <span className="text-xs text-gray-500">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderUserManagement = () => {
        const getUsersByRole = () => {
            if (filterRole === 'students') return users.students;
            if (filterRole === 'teachers') return users.teachers;
            if (filterRole === 'parents') return users.parents;
            return [...users.students, ...users.teachers, ...users.parents];
        };

        const filteredUsers = getUsersByRole().filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.id.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div className="space-y-6 animate-slide-in">
                {/* Header Actions */}
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-96">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Roles</option>
                                <option value="students">Students</option>
                                <option value="teachers">Teachers</option>
                                <option value="parents">Parents</option>
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleBulkUpload}
                                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                            >
                                <Upload className="w-4 h-4" />
                                Bulk Upload
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAddUser('students')}
                                    className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                                >
                                    <UserPlus className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleAddUser('teachers')}
                                    className="px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                                >
                                    <GraduationCap className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleAddUser('parents')}
                                    className="px-4 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                                >
                                    <Users className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    accept=".csv,.xlsx"
                    className="hidden"
                />

                {/* Users Table */}
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-4 px-4 font-semibold text-gray-700">User</th>
                                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Role</th>
                                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Details</th>
                                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filterRole === 'all' || filterRole === 'students' ?
                                    users.students.filter(u =>
                                        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        u.email.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).map(student => (
                                        <tr key={student.id} className="border-b border-gray-100 hover:bg-white/50 transition-all duration-300">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                                        <Users className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{student.name}</p>
                                                        <p className="text-sm text-gray-600">{student.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Student</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-sm text-gray-600">Class: {student.class}</p>
                                                <p className="text-sm text-gray-600">Attendance: {student.attendance}%</p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                    student.status === 'approved'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {student.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleApproveStudent(student.id)}
                                                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-all duration-300"
                                                            title="Approve"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleEditUser(student, 'students')}
                                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all duration-300"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleResetPassword(student.id)}
                                                        className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-all duration-300"
                                                        title="Reset Password"
                                                    >
                                                        <Key className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(student.id, 'students')}
                                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all duration-300"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : null}

                                {filterRole === 'all' || filterRole === 'teachers' ?
                                    users.teachers.filter(u =>
                                        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        u.email.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).map(teacher => (
                                        <tr key={teacher.id} className="border-b border-gray-100 hover:bg-white/50 transition-all duration-300">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                                                        <GraduationCap className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{teacher.name}</p>
                                                        <p className="text-sm text-gray-600">{teacher.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Teacher</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-sm text-gray-600">Subject: {teacher.subject}</p>
                                                <p className="text-sm text-gray-600">Classes: {teacher.classes}</p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Active</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEditUser(teacher, 'teachers')}
                                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all duration-300"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleResetPassword(teacher.id)}
                                                        className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-all duration-300"
                                                        title="Reset Password"
                                                    >
                                                        <Key className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(teacher.id, 'teachers')}
                                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all duration-300"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : null}

                                {filterRole === 'all' || filterRole === 'parents' ?
                                    users.parents.filter(u =>
                                        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        u.email.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).map(parent => (
                                        <tr key={parent.id} className="border-b border-gray-100 hover:bg-white/50 transition-all duration-300">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-pink-100 to-pink-200 rounded-full flex items-center justify-center">
                                                        <Users className="w-5 h-5 text-pink-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{parent.name}</p>
                                                        <p className="text-sm text-gray-600">{parent.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">Parent</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-sm text-gray-600">Children: {parent.children.join(', ')}</p>
                                                <p className="text-sm text-gray-600">Phone: {parent.phone}</p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Active</span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEditUser(parent, 'parents')}
                                                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all duration-300"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleResetPassword(parent.id)}
                                                        className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-all duration-300"
                                                        title="Reset Password"
                                                    >
                                                        <Key className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(parent.id, 'parents')}
                                                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all duration-300"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : null}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderAcademicManagement = () => (
        <div className="space-y-6 animate-slide-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timetable Management */}
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center">
                                <LayoutDashboard className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Timetable Management</h3>
                                <p className="text-sm text-gray-600">Manage class schedules</p>
                            </div>
                        </div>
                        <button className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-all duration-300">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div className="p-4 bg-white/50 rounded-xl hover:bg-white/70 transition-all duration-300 cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-800">Monday - CS301</p>
                                    <p className="text-sm text-gray-600">9:00 AM - 10:30 AM</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                        <div className="p-4 bg-white/50 rounded-xl hover:bg-white/70 transition-all duration-300 cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-800">Tuesday - Math202</p>
                                    <p className="text-sm text-gray-600">2:00 PM - 3:30 PM</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                        <div className="p-4 bg-white/50 rounded-xl hover:bg-white/70 transition-all duration-300 cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-800">Wednesday - Physics101</p>
                                    <p className="text-sm text-gray-600">11:00 AM - 12:30 PM</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subject Management */}
                <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-cyan-100 to-cyan-200 rounded-xl flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-cyan-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Subject Management</h3>
                                <p className="text-sm text-gray-600">Manage courses and subjects</p>
                            </div>
                        </div>
                        <button className="p-2 bg-cyan-100 text-cyan-600 rounded-lg hover:bg-cyan-200 transition-all duration-300">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'].map(subject => (
                            <div key={subject} className="p-3 bg-white/50 rounded-xl hover:bg-white/70 transition-all duration-300 cursor-pointer">
                                <p className="font-medium text-gray-800">{subject}</p>
                                <p className="text-xs text-gray-600">Active</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Marks Management */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Marks & Grades Management</h3>
                            <p className="text-sm text-gray-600">Edit and manage student grades</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-all duration-300 flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Import Marks
                        </button>
                        <button className="px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-all duration-300 flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export Report
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Student</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Math</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Science</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">English</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Average</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Grade</th>
                                <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { name: 'John Doe', math: 85, science: 92, english: 78, avg: 85, grade: 'A' },
                                { name: 'Jane Smith', math: 92, science: 88, english: 95, avg: 92, grade: 'A+' },
                                { name: 'Mike Johnson', math: 78, science: 82, english: 85, avg: 82, grade: 'B+' },
                            ].map((student, idx) => (
                                <tr key={idx} className="border-b border-gray-100 hover:bg-white/50 transition-all duration-300">
                                    <td className="py-3 px-4 font-medium text-gray-800">{student.name}</td>
                                    <td className="text-center py-3 px-4">{student.math}</td>
                                    <td className="text-center py-3 px-4">{student.science}</td>
                                    <td className="text-center py-3 px-4">{student.english}</td>
                                    <td className="text-center py-3 px-4 font-semibold">{student.avg}</td>
                                    <td className="text-center py-3 px-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            student.grade === 'A+' ? 'bg-green-100 text-green-700' :
                                            student.grade === 'A' ? 'bg-blue-100 text-blue-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {student.grade}
                                        </span>
                                    </td>
                                    <td className="text-center py-3 px-4">
                                        <button className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-all duration-300">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderReports = () => (
        <div className="space-y-6 animate-slide-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Reports */}
                {[
                    { title: 'Attendance Report', IconComponent: ClipboardCheck, color: 'blue', desc: 'Monthly attendance summary' },
                    { title: 'Academic Performance', IconComponent: TrendingUp, color: 'green', desc: 'Student grades analysis' },
                    { title: 'Fee Collection', IconComponent: DollarSign, color: 'purple', desc: 'Payment status report' },
                    { title: 'Teacher Performance', IconComponent: Award, color: 'amber', desc: 'Teaching effectiveness metrics' },
                    { title: 'Student Progress', IconComponent: Activity, color: 'pink', desc: 'Individual progress tracking' },
                    { title: 'Resource Utilization', IconComponent: PieChartLucide, color: 'indigo', desc: 'Infrastructure usage stats' },
                ].map((report, idx) => (
                    <div key={idx} className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 bg-gradient-to-r from-${report.color}-100 to-${report.color}-200 rounded-xl flex items-center justify-center`}>
                                <report.IconComponent className={`w-6 h-6 text-${report.color}-600`} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800">{report.title}</h3>
                                <p className="text-sm text-gray-600">{report.desc}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View Report</button>
                            <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all duration-300">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detailed Analytics */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Performance Analytics</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                        { month: 'Jan', attendance: 88, performance: 82, satisfaction: 90 },
                        { month: 'Feb', attendance: 90, performance: 85, satisfaction: 92 },
                        { month: 'Mar', attendance: 92, performance: 88, satisfaction: 91 },
                        { month: 'Apr', attendance: 91, performance: 86, satisfaction: 93 },
                        { month: 'May', attendance: 93, performance: 90, satisfaction: 95 },
                    ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="month" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="attendance" fill="#3B82F6" name="Attendance %" />
                        <Bar dataKey="performance" fill="#10B981" name="Performance %" />
                        <Bar dataKey="satisfaction" fill="#8B5CF6" name="Satisfaction %" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                Admin Dashboard
                            </h1>
                            <p className="text-gray-600 text-lg">Complete school management system control</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-white/50 hover:bg-white/80 transition-all duration-300">
                                <Bell className="w-5 h-5 text-gray-600" />
                            </button>
                            <button className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-white/50 hover:bg-white/80 transition-all duration-300">
                                <Settings className="w-5 h-5 text-gray-600" />
                            </button>
                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl px-4 py-2 font-semibold">
                                {userData?.name || 'Admin'}
                            </div>
                            <button 
                                onClick={handleLogout}
                                className="p-3 bg-red-100 rounded-xl border border-red-200 hover:bg-red-200 transition-all duration-300"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5 text-red-600" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notification */}
                {notification && (
                    <div className={`mb-6 rounded-xl px-4 py-3 flex items-center gap-2 animate-slide-in ${
                        notification.type === 'success' ? 'bg-green-100 border border-green-300 text-green-700' :
                        notification.type === 'error' ? 'bg-red-100 border border-red-300 text-red-700' :
                        'bg-blue-100 border border-blue-300 text-blue-700'
                    }`}>
                        <CheckCircle className="w-5 h-5" />
                        <span>{notification.message}</span>
                    </div>
                )}

                {/* Navigation Tabs */}
                <div className="mb-8 bg-white/70 backdrop-blur-sm rounded-3xl p-2 shadow-xl border border-white/50">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                            { id: 'users', label: 'User Management', icon: Users },
                            { id: 'academic', label: 'Academic', icon: BookOpen },
                            { id: 'reports', label: 'Reports & Analytics', icon: BarChart2 },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                                    activeTab === tab.id
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                        : 'text-gray-600 hover:bg-white/50'
                                }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'users' && renderUserManagement()}
                {activeTab === 'academic' && renderAcademicManagement()}
                {activeTab === 'reports' && renderReports()}

                {/* Add/Edit Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-slide-in max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-800">
                                    {selectedUser ? 'Edit' : 'Add'} {modalType.slice(0, -1)}
                                </h3>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-300"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {!selectedUser && (
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                )}
                                <input
                                    type="text"
                                    name="phone"
                                    placeholder="Phone Number"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                
                                {modalType === 'students' && (
                                    <>
                                        <input
                                            type="text"
                                            name="class"
                                            placeholder="Class (e.g., CS-301)"
                                            value={formData.class}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="text"
                                            name="employeeId"
                                            placeholder="Student ID (optional)"
                                            value={formData.employeeId}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </>
                                )}
                                
                                {modalType === 'teachers' && (
                                    <>
                                        <input
                                            type="text"
                                            name="subject"
                                            placeholder="Subject/Department"
                                            value={formData.subject}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="text"
                                            name="department"
                                            placeholder="Department"
                                            value={formData.department}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="text"
                                            name="employeeId"
                                            placeholder="Employee ID"
                                            value={formData.employeeId}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="text"
                                            name="designation"
                                            placeholder="Designation (e.g., Professor, Lecturer)"
                                            value={formData.designation}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </>
                                )}
                                
                                <textarea
                                    name="address"
                                    placeholder="Address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmitUser}
                                        disabled={loading}
                                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                                    >
                                        {loading ? 'Processing...' : (selectedUser ? 'Update' : 'Add')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SchoolManagementDashboard;
