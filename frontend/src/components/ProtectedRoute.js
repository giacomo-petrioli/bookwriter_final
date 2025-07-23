import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LandingPage from './LandingPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user, backendReady } = useAuth();

  console.log('ProtectedRoute State:', { isAuthenticated, loading, backendReady, user: user?.email });

  // Force re-render when authentication state changes
  useEffect(() => {
    console.log('Authentication state changed in ProtectedRoute:', { isAuthenticated, loading, backendReady, user: user?.email });
    console.log('Current localStorage token:', localStorage.getItem('auth_token') ? 'exists' : 'not found');
  }, [isAuthenticated, loading, user, backendReady]);

  if (loading) {
    console.log('Still loading authentication...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">
            {!backendReady ? 'Connecting to server...' : 'Loading...'}
          </p>
          {!backendReady && (
            <p className="text-gray-300 text-sm mt-2">
              Please wait while we establish connection
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('User not authenticated, showing LandingPage');
    return <LandingPage />;
  }

  console.log('User authenticated, showing BookWriter app');
  return children;
};

export default ProtectedRoute;