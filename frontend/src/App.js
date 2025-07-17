import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import BookWriter from './components/BookWriter';
import './App.css';

function App() {
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