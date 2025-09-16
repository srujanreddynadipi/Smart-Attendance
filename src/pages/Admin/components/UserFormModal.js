import React from 'react';
import { X, User, Mail, Phone, MapPin, Calendar, BookOpen, GraduationCap, Briefcase } from 'lucide-react';

const FormField = ({ 
  type = "text", 
  name, 
  placeholder, 
  value, 
  onChange, 
  required = false,
  icon: Icon,
  options = null,
  rows = null
}) => {
  const baseClasses = "w-full px-3 sm:px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base";
  
  if (type === 'select' && options) {
    return (
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
        )}
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={`${baseClasses} ${Icon ? 'pl-9 sm:pl-10' : ''}`}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-4 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
        )}
        <textarea
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          rows={rows || 3}
          className={`${baseClasses} ${Icon ? 'pl-9 sm:pl-10' : ''}`}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
      )}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`${baseClasses} ${Icon ? 'pl-9 sm:pl-10' : ''}`}
      />
    </div>
  );
};

const UserFormModal = ({ 
  isOpen, 
  onClose, 
  modalType, 
  formData, 
  onInputChange, 
  onSubmit, 
  loading, 
  selectedUser 
}) => {
  if (!isOpen) return null;

  const getModalTitle = () => {
    const action = selectedUser ? 'Edit' : 'Add';
    const type = modalType?.slice(0, -1) || 'User'; // Remove 's' from end
    return `${action} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  };

  const commonFields = [
    { name: 'name', placeholder: 'Full Name', icon: User, required: true },
    { name: 'email', placeholder: 'Email Address', type: 'email', icon: Mail, required: true },
    { name: 'phone', placeholder: 'Phone Number', icon: Phone, required: true },
  ];

  if (!selectedUser) {
    commonFields.push({ name: 'password', placeholder: 'Password', type: 'password', required: true });
  }

  const getTypeSpecificFields = () => {
    switch (modalType) {
      case 'students':
        return [
          { 
            name: 'class', 
            placeholder: 'Select Class', 
            type: 'select', 
            icon: GraduationCap,
            options: Array.from({length: 10}, (_, i) => ({ value: i + 1, label: `Class ${i + 1}` }))
          },
          { name: 'dateOfBirth', placeholder: 'Date of Birth', type: 'date', icon: Calendar },
          { name: 'parentContact', placeholder: 'Parent Contact', icon: Phone },
          { name: 'admissionDate', placeholder: 'Admission Date', type: 'date', icon: Calendar },
        ];
      
      case 'teachers':
        return [
          { 
            name: 'subject', 
            placeholder: 'Select Subject', 
            type: 'select', 
            icon: BookOpen,
            options: [
              { value: 'Mathematics', label: 'Mathematics' },
              { value: 'Science', label: 'Science' },
              { value: 'English', label: 'English' },
              { value: 'Social Studies', label: 'Social Studies' },
              { value: 'Physics', label: 'Physics' },
              { value: 'Chemistry', label: 'Chemistry' },
              { value: 'Biology', label: 'Biology' },
              { value: 'Computer Science', label: 'Computer Science' },
            ]
          },
          { name: 'department', placeholder: 'Department', icon: Briefcase },
          { name: 'employeeId', placeholder: 'Employee ID' },
          { name: 'designation', placeholder: 'Designation', icon: Briefcase },
          { name: 'qualification', placeholder: 'Qualification (e.g., PhD, M.Tech)' },
          { name: 'experience', placeholder: 'Years of Experience' },
          { name: 'dateOfJoining', placeholder: 'Date of Joining', type: 'date', icon: Calendar },
        ];
      
      case 'parents':
        return [
          { name: 'occupation', placeholder: 'Occupation', icon: Briefcase },
          { name: 'alternatePhone', placeholder: 'Alternate Phone Number', icon: Phone },
          { name: 'emergencyContact', placeholder: 'Emergency Contact', icon: Phone },
          { 
            name: 'relationship', 
            placeholder: 'Select Relationship', 
            type: 'select',
            options: [
              { value: 'Father', label: 'Father' },
              { value: 'Mother', label: 'Mother' },
              { value: 'Guardian', label: 'Guardian' },
              { value: 'Grandfather', label: 'Grandfather' },
              { value: 'Grandmother', label: 'Grandmother' },
              { value: 'Uncle', label: 'Uncle' },
              { value: 'Aunt', label: 'Aunt' },
              { value: 'Other', label: 'Other' },
            ]
          },
        ];
      
      default:
        return [];
    }
  };

  const allFields = [...commonFields, ...getTypeSpecificFields()];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 safe-area-top safe-area-bottom">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">{getModalTitle()}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {allFields.map((field, index) => (
              <div key={field.name} className={field.name === 'address' ? 'sm:col-span-2' : ''}>
                <FormField
                  {...field}
                  value={formData[field.name] || ''}
                  onChange={onInputChange}
                />
              </div>
            ))}
            
            {/* Address field - always full width */}
            <div className="sm:col-span-2">
              <FormField
                type="textarea"
                name="address"
                placeholder="Address"
                value={formData.address || ''}
                onChange={onInputChange}
                icon={MapPin}
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={onClose}
              className="w-full sm:flex-1 bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={loading}
              className="w-full sm:flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (selectedUser ? 'Update' : 'Add')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserFormModal;