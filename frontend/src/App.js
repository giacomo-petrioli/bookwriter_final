import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import BookCraftLogo from './components/BookCraftLogo';

// Configure axios timeout
axios.defaults.timeout = 120000; // 2 minutes timeout for individual requests
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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