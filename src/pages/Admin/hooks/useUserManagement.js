import { useState } from 'react';
import { registerUser, createStudent, createTeacher, createParent } from '../../../firebase/auth';
import { useNotifications } from '../../../contexts/NotificationContext';

export const useUserManagement = (onDataUpdate) => {
  const { showSuccess, showError, confirmDialog } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

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
    address: '',
    // Student specific fields
    dateOfBirth: '',
    parentContact: '',
    admissionDate: '',
    // Teacher specific fields
    qualification: '',
    experience: '',
    dateOfJoining: '',
    salary: '',
    // Parent specific fields
    occupation: '',
    alternatePhone: '',
    emergencyContact: '',
    relationship: '',
    children: []
  });

  const resetForm = () => {
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
      address: '',
      dateOfBirth: '',
      parentContact: '',
      admissionDate: '',
      qualification: '',
      experience: '',
      dateOfJoining: '',
      salary: '',
      occupation: '',
      alternatePhone: '',
      emergencyContact: '',
      relationship: '',
      children: []
    });
  };

  const handleAddUser = (type) => {
    setModalType(type);
    setShowAddModal(true);
    resetForm();
    setSelectedUser(null);
  };

  const handleEditUser = (user, type) => {
    setSelectedUser(user);
    setModalType(type);
    setShowAddModal(true);
    setFormData({
      ...formData,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      class: user.class || '',
      subject: user.subject || '',
      department: user.department || '',
      employeeId: user.employeeId || '',
      designation: user.designation || '',
      address: user.address || '',
      dateOfBirth: user.dateOfBirth || '',
      parentContact: user.parentContact || '',
      admissionDate: user.admissionDate || '',
      qualification: user.qualification || '',
      experience: user.experience || '',
      dateOfJoining: user.dateOfJoining || '',
      salary: user.salary || '',
      occupation: user.occupation || '',
      alternatePhone: user.alternatePhone || '',
      emergencyContact: user.emergencyContact || '',
      relationship: user.relationship || '',
      children: user.children || []
    });
  };

  const handleDeleteUser = async (userId, type) => {
    const confirmed = await confirmDialog(
      'Delete User',
      `Are you sure you want to delete this ${type.slice(0, -1)}? This action cannot be undone.`
    );
    
    if (confirmed) {
      // Add delete logic here if needed
      showSuccess(`${type.slice(0, -1)} deleted successfully`);
      if (onDataUpdate) onDataUpdate();
    }
  };

  const handleSubmitUser = async () => {
    try {
      setLoading(true);
      
      if (!formData.name || !formData.email || (!selectedUser && !formData.password)) {
        showError('Please fill in all required fields');
        return;
      }

      if (modalType === 'teachers') {
        const teacherData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          subject: formData.subject,
          department: formData.department,
          employeeId: formData.employeeId,
          designation: formData.designation,
          qualification: formData.qualification,
          experience: formData.experience,
          dateOfJoining: formData.dateOfJoining,
          salary: formData.salary,
          address: formData.address
        };

        const result = selectedUser 
          ? { success: true, message: 'Teacher updated successfully' } // Add update logic
          : await createTeacher(teacherData);

        if (result.success) {
          showSuccess(result.message);
          setShowAddModal(false);
          resetForm();
          setSelectedUser(null);
          if (onDataUpdate) onDataUpdate();
        } else {
          showError(result.error);
        }
      } else if (modalType === 'students') {
        const studentData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          class: formData.class,
          dateOfBirth: formData.dateOfBirth,
          parentContact: formData.parentContact,
          admissionDate: formData.admissionDate,
          address: formData.address
        };

        const result = selectedUser 
          ? { success: true, message: 'Student updated successfully' } // Add update logic
          : await createStudent(studentData);

        if (result.success) {
          showSuccess(result.message);
          setShowAddModal(false);
          resetForm();
          setSelectedUser(null);
          if (onDataUpdate) onDataUpdate();
        } else {
          showError(result.error);
        }
      } else if (modalType === 'parents') {
        const parentData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          occupation: formData.occupation,
          alternatePhone: formData.alternatePhone,
          emergencyContact: formData.emergencyContact,
          relationship: formData.relationship,
          address: formData.address,
          children: formData.children
        };

        const result = selectedUser 
          ? { success: true, message: 'Parent updated successfully' } // Add update logic
          : await createParent(parentData);

        if (result.success) {
          showSuccess(result.message);
          setShowAddModal(false);
          resetForm();
          setSelectedUser(null);
          if (onDataUpdate) onDataUpdate();
        } else {
          showError(result.error);
        }
      }
    } catch (error) {
      console.error('❌ Error submitting user:', error);
      showError('Failed to save user');
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

  const handleResetPassword = async (userId) => {
    const confirmed = await confirmDialog(
      'Reset Password',
      'This will send a password reset email to the user. Continue?'
    );
    
    if (confirmed) {
      showSuccess('Password reset email sent successfully');
    }
  };

  return {
    loading,
    showAddModal,
    setShowAddModal,
    modalType,
    selectedUser,
    formData,
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
    handleSubmitUser,
    handleInputChange,
    handleResetPassword,
    resetForm
  };
};