import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getToken, hasValidToken, getTokenExpiration, getUserIdFromToken } from '../../utils/tokenManager';

const AuthDebug = () => {
  const { user, isAuthenticated, isLoading, error } = useAuth();
  const [tokenInfo, setTokenInfo] = useState({
    token: null,
    isValid: false,
    expiration: null,
    userId: null,
  });

  useEffect(() => {
    const updateTokenInfo = () => {
      const token = getToken();
      setTokenInfo({
        token: token ? `${token.substring(0, 20)}...` : null,
        isValid: hasValidToken(),
        expiration: getTokenExpiration(),
        userId: getUserIdFromToken(),
      });
    };

    updateTokenInfo();
    // Update token info every 5 seconds
    const interval = setInterval(updateTokenInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClearToken = () => {
    localStorage.removeItem('token');
    setTokenInfo({
      token: null,
      isValid: false,
      expiration: null,
      userId: null,
    });
  };

  const handleTestAuth = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/check', {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log('Auth check response:', data);
      alert(`Auth check response: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Auth check error:', error);
      alert(`Auth check error: ${error.message}`);
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg m-4 font-mono text-sm">
      <h3 className="text-lg font-bold mb-4">🔐 Authentication Debug</h3>
      
      <div className="space-y-3">
        <div>
          <strong>useAuth Hook State:</strong>
          <div className="ml-4">
            <div>isAuthenticated: {isAuthenticated ? '✅ true' : '❌ false'}</div>
            <div>isLoading: {isLoading ? '⏳ true' : '✅ false'}</div>
            <div>Error: {error || 'none'}</div>
            <div>User: {user ? `${user.name} (${user.email})` : 'null'}</div>
          </div>
        </div>

        <div>
          <strong>Token State:</strong>
          <div className="ml-4">
            <div>Token: {tokenInfo.token || 'null'}</div>
            <div>Valid: {tokenInfo.isValid ? '✅ true' : '❌ false'}</div>
            <div>User ID: {tokenInfo.userId || 'null'}</div>
            <div>Expiration: {tokenInfo.expiration ? tokenInfo.expiration.toLocaleString() : 'null'}</div>
          </div>
        </div>

        <div>
          <strong>Actions:</strong>
          <div className="ml-4 space-x-2">
            <button
              onClick={handleClearToken}
              className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
            >
              Clear Token
            </button>
            <button
              onClick={handleTestAuth}
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
            >
              Test Auth API
            </button>
          </div>
        </div>

        <div>
          <strong>localStorage:</strong>
          <div className="ml-4">
            <div>token: {localStorage.getItem('token') ? 'exists' : 'null'}</div>
            <div>adminToken: {localStorage.getItem('adminToken') ? 'exists' : 'null'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;
