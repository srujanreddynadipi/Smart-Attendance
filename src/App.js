import React, { useEffect, useState } from 'react';
import TeacherDashboard from './pages/TeacherDashboard';
import { testFirebaseConnection, testDatabaseOperations } from './testFirebase';

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState('testing');

  useEffect(() => {
    const testConnection = async () => {
      console.log('🚀 Starting Firebase connection test...');
      
      // Test basic Firebase connection
      const connectionResult = await testFirebaseConnection();
      
      if (connectionResult.success) {
        // Test database operations
        const dbResult = await testDatabaseOperations();
        
        if (dbResult.success) {
          setConnectionStatus('connected');
          console.log('🎉 All Firebase tests passed!');
        } else {
          setConnectionStatus('db-error');
          console.error('💥 Database operations failed:', dbResult.message);
        }
      } else {
        setConnectionStatus('connection-error');
        console.error('💥 Firebase connection failed:', connectionResult.message);
      }
    };

    testConnection();
  }, []);

  if (connectionStatus === 'testing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-lg font-semibold">Testing Firebase Connection...</span>
          </div>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'connection-error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-red-700 mb-2">Firebase Connection Failed</h2>
            <p className="text-gray-600 mb-4">Please check your Firebase configuration in the .env file</p>
            <div className="text-sm text-gray-500">
              Check the browser console for detailed error messages
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (connectionStatus === 'db-error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
          <div className="text-center">
            <div className="text-yellow-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-yellow-700 mb-2">Database Operations Failed</h2>
            <p className="text-gray-600 mb-4">Firebase connected but database operations failed</p>
            <div className="text-sm text-gray-500">
              Check Firestore permissions and rules
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Firebase Connection Status Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-green-100 border border-green-300 text-green-700 px-3 py-1 rounded-lg text-sm">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Firebase Connected
        </div>
      </div>
      <TeacherDashboard />
    </div>
  );
}