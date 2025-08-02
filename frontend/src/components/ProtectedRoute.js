import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LandingPage from './LandingPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user, backendReady } = useAuth();
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);

  console.log('ProtectedRoute State:', { isAuthenticated, loading, backendReady, user: user?.email });

  // Force re-render when authentication state changes
  useEffect(() => {
    console.log('Authentication state changed in ProtectedRoute:', { isAuthenticated, loading, backendReady, user: user?.email });
    console.log('Current localStorage token:', localStorage.getItem('auth_token') ? 'exists' : 'not found');
  }, [isAuthenticated, loading, user, backendReady]);

  // Add timeout for loading state to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setShowTimeoutMessage(true);
      }, 15000); // Show timeout message after 15 seconds

      return () => clearTimeout(timeout);
    } else {
      setShowTimeoutMessage(false);
    }
  }, [loading]);

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
          {showTimeoutMessage && (
            <div className="mt-4 p-4 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
              <p className="text-yellow-300 text-sm">
                Connection is taking longer than expected. Please try refreshing the page.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Refresh Page
              </button>
            </div>
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