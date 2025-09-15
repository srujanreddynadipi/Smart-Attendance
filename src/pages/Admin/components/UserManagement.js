import React, { useState } from 'react';
import { Search, Filter, UserPlus, Upload, Download, ChevronRight } from 'lucide-react';
import UserTable from './UserTable';

const UserFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter,
  classFilter, 
  setClassFilter,
  subjectFilter, 
  setSubjectFilter,
  type 
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search ${type}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Class Filter for Students */}
          {type === 'students' && (
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Classes</option>
              <option value="1">Class 1</option>
              <option value="2">Class 2</option>
              <option value="3">Class 3</option>
              <option value="4">Class 4</option>
              <option value="5">Class 5</option>
              <option value="6">Class 6</option>
              <option value="7">Class 7</option>
              <option value="8">Class 8</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
            </select>
          )}

          {/* Subject Filter for Teachers */}
          {type === 'teachers' && (
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="English">English</option>
              <option value="Social Studies">Social Studies</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Computer Science">Computer Science</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );
};

const UserManagement = ({ 
  type, 
  users, 
  onAdd, 
  onEdit, 
  onDelete, 
  onResetPassword, 
  onApprove, 
  onBulkUpload,
  onBack 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');

  const getTitle = () => {
    switch (type) {
      case 'students':
        return 'Student Management';
      case 'teachers':
        return 'Teacher Management';
      case 'parents':
        return 'Parent Management';
      default:
        return 'User Management';
    }
  };

  const getSingularType = () => {
    return type.slice(0, -1); // Remove 's' from the end
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <ChevronRight className="w-5 h-5 transform rotate-180" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{getTitle()}</h2>
            <p className="text-gray-600">Manage {type} in your school</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onBulkUpload}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200"
          >
            <Upload className="w-5 h-5" />
            <span>Bulk Upload</span>
          </button>
          
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-200"
          >
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
          
          <button
            onClick={() => onAdd(type)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
          >
            <UserPlus className="w-5 h-5" />
            <span>Add {getSingularType()}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <UserFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        classFilter={classFilter}
        setClassFilter={setClassFilter}
        subjectFilter={subjectFilter}
        setSubjectFilter={setSubjectFilter}
        type={type}
      />

      {/* User Table */}
      <UserTable
        users={users}
        type={type}
        searchTerm={searchTerm}
        onEdit={onEdit}
        onDelete={onDelete}
        onResetPassword={onResetPassword}
        onApprove={onApprove}
        filters={{
          statusFilter,
          classFilter,
          subjectFilter
        }}
      />
    </div>
  );
};

export default UserManagement;