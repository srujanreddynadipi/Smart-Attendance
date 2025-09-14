import React, { useState } from 'react';
import { 
  getStudentDashboardData,
  addSampleAttendanceData,
  addSampleGradesData 
} from '../firebase/attendance';

const DataTest = () => {
  const [testResults, setTestResults] = useState('');
  const [studentId, setStudentId] = useState('test-student-123');
  const [loading, setLoading] = useState(false);

  const testAddSampleData = async () => {
    setLoading(true);
    try {
      console.log('Adding sample data for student:', studentId);
      
      const attendanceResult = await addSampleAttendanceData(studentId);
      const gradesResult = await addSampleGradesData(studentId);
      
      setTestResults(`
Attendance Data: ${attendanceResult.success ? 'Success' : 'Failed - ' + attendanceResult.error}
Grades Data: ${gradesResult.success ? 'Success' : 'Failed - ' + gradesResult.error}
      `);
    } catch (error) {
      setTestResults('Error: ' + error.message);
    }
    setLoading(false);
  };

  const testGetDashboardData = async () => {
    setLoading(true);
    try {
      console.log('Getting dashboard data for student:', studentId);
      
      const result = await getStudentDashboardData(studentId);
      
      if (result.success) {
        setTestResults(`
Dashboard Data Retrieved Successfully:

Recent Attendance (${result.recentAttendance.length} records):
${result.recentAttendance.map(record => 
  `- ${record.subject}: ${record.status} at ${record.time} on ${record.date.toDateString()}`
).join('\n')}

Subject Performance (${result.subjectPerformance.length} subjects):
${result.subjectPerformance.map(perf => 
  `- ${perf.subject}: ${perf.grade} (${perf.performancePercentage}%) - Attendance: ${perf.attendancePercentage}%`
).join('\n')}
        `);
      } else {
        setTestResults('Failed to get dashboard data: ' + result.error);
      }
    } catch (error) {
      setTestResults('Error: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Firebase Data Test</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Student ID for Testing:
        </label>
        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter student ID"
        />
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={testAddSampleData}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Sample Data'}
        </button>
        
        <button
          onClick={testGetDashboardData}
          disabled={loading}
          className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Get Dashboard Data'}
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Test Results:</h3>
        <pre className="whitespace-pre-wrap text-sm text-gray-700">
          {testResults || 'No tests run yet. Click a button above to test Firebase integration.'}
        </pre>
      </div>
    </div>
  );
};

export default DataTest;