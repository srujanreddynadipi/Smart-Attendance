import React from 'react';
import { CheckCircle, X, AlertCircle, Clock, User, Mail, Phone, Calendar } from 'lucide-react';

const RequestCard = ({ request, onApprove, onReject, loading }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <X className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
            {request.parentName?.charAt(0)?.toUpperCase() || 'P'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{request.parentName}</h3>
            <p className="text-xs sm:text-sm text-gray-600">Parent Registration Request</p>
          </div>
        </div>
        <div className={`flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-full border text-xs sm:text-sm font-medium flex-shrink-0 ${getStatusColor(request.status)}`}>
          {getStatusIcon(request.status)}
          <span className="capitalize hidden sm:inline">{request.status}</span>
        </div>
      </div>

      {/* Request Details */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-4">
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 min-w-0">
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{request.parentEmail}</span>
        </div>
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
          <Phone className="w-4 h-4 flex-shrink-0" />
          <span>{request.parentPhone}</span>
        </div>
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 min-w-0">
          <User className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Child: {request.childName}</span>
        </div>
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>{new Date(request.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Child Details */}
      <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4">
        <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Child Information</h4>
        <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm text-gray-600">
          <div>
            <span className="font-medium">Name:</span> {request.childName}
          </div>
          <div>
            <span className="font-medium">Class:</span> {request.childClass}
          </div>
          <div>
            <span className="font-medium">Student ID:</span> {request.childStudentId}
          </div>
          <div>
            <span className="font-medium">School:</span> {request.childSchool}
          </div>
        </div>
      </div>

      {/* Actions */}
      {request.status === 'pending' && (
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={() => onReject(request.id)}
            disabled={loading}
            className="flex-1 bg-red-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-600 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base min-h-12 touch-manipulation"
          >
            Reject
          </button>
          <button
            onClick={() => onApprove(request.id, request)}
            disabled={loading}
            className="flex-1 bg-green-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-600 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base min-h-12 touch-manipulation"
          >
            Approve
          </button>
        </div>
      )}

      {/* Show reason if rejected */}
      {request.status === 'rejected' && request.rejectionReason && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-xs sm:text-sm text-red-800">
            <span className="font-medium">Rejection Reason:</span> {request.rejectionReason}
          </p>
        </div>
      )}
    </div>
  );
};

const ChildRequestsModal = ({ 
  isOpen, 
  onClose, 
  requests, 
  onApprove, 
  onReject, 
  loading 
}) => {
  if (!isOpen) return null;

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const processedRequests = requests.filter(req => req.status !== 'pending');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 safe-area-top safe-area-bottom">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Child Registration Requests</h2>
            <p className="text-sm sm:text-base text-gray-600">
              {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-80px)]">
          {requests.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2">No Requests Found</h3>
              <p className="text-sm sm:text-base">There are no child registration requests at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                    Pending Requests ({pendingRequests.length})
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    {pendingRequests.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        onApprove={onApprove}
                        onReject={onReject}
                        loading={loading}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Processed Requests */}
              {processedRequests.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                    Processed Requests ({processedRequests.length})
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    {processedRequests.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        onApprove={onApprove}
                        onReject={onReject}
                        loading={loading}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChildRequestsModal;