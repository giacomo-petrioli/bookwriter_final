import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import BookWriter from './components/BookWriter';
import './App.css';

function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Add a small delay to ensure all systems are initialized
    // This prevents race conditions during startup
    const initializeApp = async () => {
      console.log('Initializing BookCraft AI...');
      
      // Small delay to allow all components to mount
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('BookCraft AI ready');
      setAppReady(true);
    };

    initializeApp();
  }, []);

  if (!appReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl font-semibold">BookCraft AI</p>
          <p className="text-gray-300 text-sm mt-2">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <ProtectedRoute>
          <BookWriter />
        </ProtectedRoute>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;