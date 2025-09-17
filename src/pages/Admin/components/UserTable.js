import React, { useState } from 'react';
import { Search, Filter, UserPlus, Edit, Trash2, Key, Check, X, ChevronRight, MoreVertical, UserX } from 'lucide-react';

const UserTable = ({ 
  users, 
  type, 
  searchTerm, 
  onEdit, 
  onDelete,
  onDeactivate,
  onResetPassword, 
  onApprove,
  filters = {}
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null);

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

  const ActionButtons = ({ user }) => (
    <div className="flex items-center space-x-1">
      {user.status === 'pending' && onApprove && (
        <button
          onClick={() => onApprove(user.id)}
          className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-lg transition-all duration-200"
          title="Approve"
        >
          <Check className="w-4 h-4" />
        </button>
      )}
      <button
        onClick={() => onEdit(user, type)}
        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-all duration-200"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => onResetPassword(user.id)}
        className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-100 rounded-lg transition-all duration-200"
        title="Reset Password"
      >
        <Key className="w-4 h-4" />
      </button>
      {user.isActive !== false && onDeactivate && (
        <button
          onClick={() => onDeactivate(user, type)}
          className="p-2 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-100 rounded-lg transition-all duration-200"
          title="Deactivate User"
        >
          <UserX className="w-4 h-4" />
        </button>
      )}
      <button
        onClick={() => onDelete(user, type)}
        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-all duration-200"
        title="Permanently Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const MobileUserCard = ({ user }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{user.name}</h3>
            <p className="text-xs text-gray-600 truncate">{user.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(user.status || 'active')}`}>
                {user.status || 'Active'}
              </span>
              {type === 'students' && user.class && (
                <span className="text-xs text-gray-500">Class {user.class}</span>
              )}
              {type === 'teachers' && user.subject && (
                <span className="text-xs text-gray-500">{user.subject}</span>
              )}
            </div>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {activeDropdown === user.id && (
            <div className="absolute right-0 top-10 z-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
              {user.status === 'pending' && onApprove && (
                <button
                  onClick={() => {
                    onApprove(user.id);
                    setActiveDropdown(null);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve</span>
                </button>
              )}
              <button
                onClick={() => {
                  onEdit(user, type);
                  setActiveDropdown(null);
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  onResetPassword(user.id);
                  setActiveDropdown(null);
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
              >
                <Key className="w-4 h-4" />
                <span>Reset Password</span>
              </button>
              {user.isActive !== false && onDeactivate && (
                <button
                  onClick={() => {
                    onDeactivate(user, type);
                    setActiveDropdown(null);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
                >
                  <UserX className="w-4 h-4" />
                  <span>Deactivate</span>
                </button>
              )}
              <button
                onClick={() => {
                  onDelete(user, type);
                  setActiveDropdown(null);
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Permanently Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div>
          <span className="font-medium">Phone:</span> {user.phone || 'N/A'}
        </div>
        {type === 'teachers' && user.department && (
          <div>
            <span className="font-medium">Dept:</span> {user.department}
          </div>
        )}
        {type === 'parents' && user.occupation && (
          <div>
            <span className="font-medium">Occupation:</span> {user.occupation}
          </div>
        )}
        {type === 'parents' && user.children && (
          <div className="col-span-2">
            <span className="font-medium">Children:</span> {user.children.length || 0}
          </div>
        )}
      </div>
    </div>
  );

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

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {/* Mobile View */}
      <div className="block lg:hidden space-y-3">
        {filteredUsers.map((user) => (
          <MobileUserCard key={user.id} user={user} />
        ))}
        
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

      {/* Desktop View */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                    <ActionButtons user={user} />
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
    </div>
  );
};

export default UserTable;