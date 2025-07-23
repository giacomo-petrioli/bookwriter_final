import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    // Only check auth status on initial load if there's a token stored
    const token = localStorage.getItem('auth_token');
    if (token) {
      checkAuthStatus();
    } else {
      // No token, immediately set loading to false and not authenticated
      setLoading(false);
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('Checking auth status...');
      const token = localStorage.getItem('auth_token');
      console.log('Stored token:', token ? 'exists' : 'not found');
      
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Making auth check request to:', `${API_URL}/api/auth/profile`);
        const response = await axios.get(`${API_URL}/api/auth/profile`);
        console.log('Auth check successful:', response.data);
        
        setUser(response.data);
        setIsAuthenticated(true);
      } else {
        console.log('No token found, user not authenticated');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error.response?.status, error.response?.data || error.message);
      if (error.response?.status === 401) {
        console.log('Token expired or invalid, clearing auth state');
      }
      localStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credential) => {
    try {
      console.log('Starting Google login...');
      setLoading(true);
      setIsAuthenticated(false); // Ensure we start with clean state
      
      console.log('Making Google login request to:', `${API_URL}/api/auth/google/verify`);
      const response = await axios.post(`${API_URL}/api/auth/google/verify`, {
        token: credential
      });
      
      console.log('Google login response:', response.data);
      const { user: userData, session_token } = response.data;
      
      if (!session_token) {
        throw new Error('No session token received from server');
      }
      
      console.log('Storing token and updating state...');
      // Store token and set headers
      localStorage.setItem('auth_token', session_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${session_token}`;
      
      // Update state immediately
      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);
      
      console.log('Google login completed successfully, user should now be authenticated');
      
      return userData;
    } catch (error) {
      console.error('Google login failed:', error.response?.data || error.message);
      // Ensure we're not authenticated on failure
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (token) {
        await axios.post(`${API_URL}/api/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Clean up regardless of API call success
      localStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const loginWithEmailPassword = async (email, password) => {
    try {
      setLoading(true);
      setIsAuthenticated(false); // Reset state before login attempt
      
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      
      const { user: userData, session_token } = response.data;
      
      // Store token and set headers
      localStorage.setItem('auth_token', session_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${session_token}`;
      
      // Update state immediately
      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);
      
      console.log('Email login successful:', { userData: userData?.email });
      
      return userData;
    } catch (error) {
      console.error('Email/password login failed:', error);
      // Ensure we're not authenticated on failure
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
      throw error;
    }
  };

  const registerWithEmailPassword = async (email, password, name) => {
    try {
      setLoading(true);
      setIsAuthenticated(false); // Reset state before registration attempt
      
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        name
      });
      
      const { user: userData, session_token } = response.data;
      
      // Store token and set headers
      localStorage.setItem('auth_token', session_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${session_token}`;
      
      // Update state immediately
      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);
      
      console.log('Registration successful:', { userData: userData?.email });
      
      return userData;
    } catch (error) {
      console.error('Registration failed:', error);
      // Ensure we're not authenticated on failure
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login: loginWithGoogle, // Add alias for backwards compatibility
    loginWithGoogle,
    loginWithEmailPassword,
    registerWithEmailPassword,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;