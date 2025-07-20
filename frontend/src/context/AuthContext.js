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
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get(`${API_URL}/api/auth/profile`);
        setUser(response.data);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
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
      setLoading(true);
      console.log('Google login attempt started...');
      const response = await axios.post(`${API_URL}/api/auth/google/verify`, {
        token: credential
      });
      
      const { user: userData, session_token } = response.data;
      console.log('Google login successful, setting user data...', userData);
      
      // Store token and set headers
      localStorage.setItem('auth_token', session_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${session_token}`;
      
      setUser(userData);
      setIsAuthenticated(true);
      console.log('Authentication state updated - user should be redirected to app');
      
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
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
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      
      const { user: userData, session_token } = response.data;
      
      // Store token and set headers
      localStorage.setItem('auth_token', session_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${session_token}`;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return userData;
    } catch (error) {
      console.error('Email/password login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmailPassword = async (email, password, name) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        name
      });
      
      const { user: userData, session_token } = response.data;
      
      // Store token and set headers
      localStorage.setItem('auth_token', session_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${session_token}`;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return userData;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
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