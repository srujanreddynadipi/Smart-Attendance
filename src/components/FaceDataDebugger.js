import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import faceEmbeddingDatabase from '../firebase/faceEmbeddingDatabase';

const FaceDataDebugger = () => {
  const [legacyData, setLegacyData] = useState([]);
  const [embeddingData, setEmbeddingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testUserId, setTestUserId] = useState('');
  const [testResults, setTestResults] = useState(null);

  const loadFaceData = async () => {
    setLoading(true);
    try {
      // Check legacy face encodings
      const legacySnapshot = await getDocs(collection(db, 'faceEncodings'));
      const legacyEntries = [];
      legacySnapshot.forEach((doc) => {
        legacyEntries.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setLegacyData(legacyEntries);

      // Check new face embeddings
      const embeddingSnapshot = await getDocs(collection(db, 'faceEmbeddings'));
      const embeddingEntries = [];
      embeddingSnapshot.forEach((doc) => {
        embeddingEntries.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setEmbeddingData(embeddingEntries);

    } catch (error) {
      console.error('Error loading face data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testUserFaceData = async () => {
    if (!testUserId.trim()) return;
    
    setLoading(true);
    try {
      // Test new embedding system
      const embeddingResult = await faceEmbeddingDatabase.getFaceEmbedding(testUserId);
      
      // Test legacy system
      const legacyResult = await faceEmbeddingDatabase.getLegacyFaceData(testUserId);
      
      setTestResults({
        userId: testUserId,
        embedding: embeddingResult,
        legacy: legacyResult
      });
    } catch (error) {
      console.error('Error testing user face data:', error);
      setTestResults({
        userId: testUserId,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaceData();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Face Data Debugger</h2>
      
      {/* Test specific user */}
      <div className="mb-8 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Test User Face Data</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Enter User ID"
            value={testUserId}
            onChange={(e) => setTestUserId(e.target.value)}
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={testUserFaceData}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test User
          </button>
        </div>
        
        {testResults && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <h4 className="font-medium">Results for User: {testResults.userId}</h4>
            <div className="mt-2">
              <p><strong>New Embedding System:</strong> {testResults.embedding?.success ? '✅ Found' : '❌ Not Found'}</p>
              <p><strong>Legacy System:</strong> {testResults.legacy?.success ? '✅ Found' : '❌ Not Found'}</p>
              {testResults.error && <p className="text-red-600"><strong>Error:</strong> {testResults.error}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Legacy face encodings */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Legacy Face Encodings ({legacyData.length})</h3>
        <button 
          onClick={loadFaceData} 
          disabled={loading}
          className="mb-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">User ID</th>
                <th className="border px-4 py-2 text-left">Name</th>
                <th className="border px-4 py-2 text-left">Email</th>
                <th className="border px-4 py-2 text-left">Registered At</th>
                <th className="border px-4 py-2 text-left">Descriptor Length</th>
              </tr>
            </thead>
            <tbody>
              {legacyData.map((entry) => (
                <tr key={entry.id}>
                  <td className="border px-4 py-2 font-mono text-sm">{entry.userId}</td>
                  <td className="border px-4 py-2">{entry.name}</td>
                  <td className="border px-4 py-2">{entry.email}</td>
                  <td className="border px-4 py-2">{entry.registeredAt?.toDate?.()?.toLocaleString() || 'N/A'}</td>
                  <td className="border px-4 py-2">{entry.descriptor?.length || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New face embeddings */}
      <div>
        <h3 className="text-lg font-semibold mb-3">New Face Embeddings ({embeddingData.length})</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">User ID</th>
                <th className="border px-4 py-2 text-left">Model Version</th>
                <th className="border px-4 py-2 text-left">Registration Date</th>
                <th className="border px-4 py-2 text-left">Embedding Size</th>
                <th className="border px-4 py-2 text-left">Active</th>
              </tr>
            </thead>
            <tbody>
              {embeddingData.map((entry) => (
                <tr key={entry.id}>
                  <td className="border px-4 py-2 font-mono text-sm">{entry.userId}</td>
                  <td className="border px-4 py-2">{entry.modelVersion}</td>
                  <td className="border px-4 py-2">{entry.registrationDate?.toDate?.()?.toLocaleString() || 'N/A'}</td>
                  <td className="border px-4 py-2">{entry.embeddingSize || 'N/A'}</td>
                  <td className="border px-4 py-2">{entry.isActive ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FaceDataDebugger;