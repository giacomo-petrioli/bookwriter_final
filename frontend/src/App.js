import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import BookWriter from './components/BookWriter';
import Credits from './components/Credits';
import PaymentSuccess from './components/PaymentSuccess';
import './App.css';

function App() {
  return (
    <GoogleOAuthProvider clientId="758478706314-pn8dh4u94p8mt06qialfdigaqs5glj9s.apps.googleusercontent.com">
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/payment-success" element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            } />
            <Route path="/credits" element={
              <ProtectedRoute>
                <Credits />
              </ProtectedRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <BookWriter />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

export default App;