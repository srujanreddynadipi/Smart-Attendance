import React, { useState } from 'react';
import { Search, Filter, UserPlus, Edit, Trash2, Key, Check, X, ChevronRight } from 'lucide-react';

const UserTable = ({ 
  users, 
  type, 
  searchTerm, 
  onEdit, 
  onDelete, 
  onResetPassword, 
  onApprove,
  filters = {}
}) => {
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilters = true;
    
    if (filters.statusFilter && filters.statusFilter !== 'all') {
      matchesFilters = matchesFilters && user.status === filters.statusFilter;
    }
    
    if (filters.classFilter && filters.classFilter !== 'all' && type === 'students') {
      matchesFilters = matchesFilters && user.class === filters.classFilter;
    }
    
    if (filters.subjectFilter && filters.subjectFilter !== 'all' && type === 'teachers') {
      matchesFilters = matchesFilters && user.subject === filters.subjectFilter;
    }
    
    return matchesSearch && matchesFilters;
  });

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.active;
  };

  const getTableHeaders = () => {
    const baseHeaders = ['Name', 'Email', 'Phone', 'Status', 'Actions'];
    
    switch (type) {
      case 'students':
        return ['Name', 'Email', 'Class', 'Phone', 'Status', 'Actions'];
      case 'teachers':
        return ['Name', 'Email', 'Subject', 'Department', 'Phone', 'Status', 'Actions'];
      case 'parents':
        return ['Name', 'Email', 'Occupation', 'Children', 'Phone', 'Status', 'Actions'];
      default:
        return baseHeaders;
    }
  };

  const renderTableRow = (user) => {
    const baseRow = (
      <>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{user.name}</div>
              <div className="text-sm text-gray-500">ID: {user.id || 'N/A'}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{user.email}</div>
        </td>
      </>
    );

    switch (type) {
      case 'students':
        return (
          <>
            {baseRow}
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{user.class || 'N/A'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{user.phone || 'N/A'}</div>
            </td>
          </>
        );
      case 'teachers':
        return (
          <>
            {baseRow}
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{user.subject || 'N/A'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{user.department || 'N/A'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{user.phone || 'N/A'}</div>
            </td>
          </>
        );
      case 'parents':
        return (
          <>
            {baseRow}
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{user.occupation || 'N/A'}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">
                {user.children?.length || 0} children
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{user.phone || 'N/A'}</div>
            </td>
          </>
        );
      default:
        return (
          <>
            {baseRow}
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-gray-900">{user.phone || 'N/A'}</div>
            </td>
          </>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {getTableHeaders().map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                {renderTableRow(user)}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(user.status || 'active')}`}>
                    {user.status || 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    {user.status === 'pending' && onApprove && (
                      <button
                        onClick={() => onApprove(user.id)}
                        className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-100 transition-all duration-200"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(user, type)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100 transition-all duration-200"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onResetPassword(user.id)}
                      className="text-purple-600 hover:text-purple-900 p-1 rounded-full hover:bg-purple-100 transition-all duration-200"
                      title="Reset Password"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(user.id, type)}
                      className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition-all duration-200"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium">No {type} found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default UserTable;