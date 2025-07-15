import React from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import BookWriter from './components/BookWriter';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <BookWriter />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;