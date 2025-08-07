import React, { useState } from 'react';
import authService from '../../services/auth';
import userService from '../../services/user';

/**
 * Debug component to test API endpoints directly
 */
const ApiTest = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const testEndpoint = async (name, apiCall) => {
    setLoading(prev => ({ ...prev, [name]: true }));
    try {
      const result = await apiCall();
      setResults(prev => ({ 
        ...prev, 
        [name]: { 
          success: true, 
          data: result,
          timestamp: new Date().toISOString()
        } 
      }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [name]: { 
          success: false, 
          error: error.message,
          details: error.response?.data || error,
          timestamp: new Date().toISOString()
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  const tests = [
    {
      name: 'authCheck',
      label: 'Check Auth Status (/auth/check)',
      call: () => authService.checkAuth()
    },
    {
      name: 'authProfile',
      label: 'Get Auth Profile (/auth/profile)', 
      call: () => authService.getProfile()
    },
    {
      name: 'userProfile',
      label: 'Get User Profile (via userService)',
      call: () => userService.getProfile()
    },
    {
      name: 'userCheckAuth',
      label: 'Check Auth (via userService)',
      call: () => userService.checkAuth()
    }
  ];

  const renderResult = (result) => {
    if (!result) return null;
    
    return (
      <div className={`mt-2 p-3 rounded text-sm ${
        result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      }`}>
        <div className="font-medium mb-1">
          {result.success ? '✅ Success' : '❌ Error'} - {result.timestamp}
        </div>
        <pre className="whitespace-pre-wrap overflow-auto max-h-40">
          {JSON.stringify(result.success ? result.data : result.details, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">API Endpoints Test</h1>
      
      <div className="space-y-4">
        {tests.map(test => (
          <div key={test.name} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{test.label}</h3>
              <button
                onClick={() => testEndpoint(test.name, test.call)}
                disabled={loading[test.name]}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading[test.name] ? 'Testing...' : 'Test'}
              </button>
            </div>
            {renderResult(results[test.name])}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Instructions:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Open browser dev tools (F12) and check the Network tab</li>
          <li>• Click each "Test" button to see if API calls are being made</li>
          <li>• Check console for debug logs</li>
          <li>• Look for any 401 (Unauthorized) or other error responses</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium mb-2">Expected Behavior:</h3>
        <ul className="text-sm text-blue-600 space-y-1">
          <li>• If logged in: All endpoints should return user data</li>
          <li>• If not logged in: Should get 401 errors for protected endpoints</li>
          <li>• Network tab should show HTTP requests being made</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiTest;
