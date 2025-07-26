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
  const [backendReady, setBackendReady] = useState(false);

  const API_URL = 'https://a4a476c4-1ae3-4338-af34-da4cf0f722a1.preview.emergentagent.com';

  // Backend health check with retry logic
  const checkBackendHealth = async (maxRetries = 5, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`Backend health check attempt ${i + 1}/${maxRetries}...`);
        const response = await axios.get(`${API_URL}/api/`, { timeout: 5000 });
        if (response.status === 200) {
          console.log('Backend is healthy and ready');
          setBackendReady(true);
          return true;
        }
      } catch (error) {
        console.warn(`Backend health check failed (attempt ${i + 1}/${maxRetries}):`, error.message);
        if (i < maxRetries - 1) {
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 1.5; // Exponential backoff
        }
      }
    }
    console.error('Backend failed to become available after multiple attempts');
    setBackendReady(false);
    setLoading(false);
    return false;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication...');
        
        // First, check if backend is available
        const isBackendHealthy = await checkBackendHealth();
        
        if (!isBackendHealthy) {
          console.error('Backend not available, skipping auth check');
          setLoading(false);
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        // Only check auth status if there's a token stored
        const token = localStorage.getItem('auth_token');
        if (token) {
          console.log('Found stored token, checking auth status...');
          await checkAuthStatus();
        } else {
          console.log('No stored token, user not authenticated');
          setLoading(false);
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setLoading(false);
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    initializeAuth();
  }, []);

  const checkAuthStatus = async (maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Checking auth status (attempt ${attempt}/${maxRetries})...`);
        const token = localStorage.getItem('auth_token');
        console.log('Stored token:', token ? 'exists' : 'not found');
        
        if (!token) {
          console.log('No token found, user not authenticated');
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
          return;
        }

        if (!backendReady) {
          console.log('Backend not ready, checking health first...');
          const isHealthy = await checkBackendHealth(3, 500);
          if (!isHealthy) {
            throw new Error('Backend not available');
          }
        }

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Making auth check request to:', `${API_URL}/api/auth/profile`);
        
        const response = await axios.get(`${API_URL}/api/auth/profile`, { 
          timeout: 10000,
          validateStatus: (status) => status < 500 // Don't throw on 4xx errors
        });
        
        if (response.status === 200) {
          console.log('Auth check successful:', response.data);
          setUser(response.data);
          setIsAuthenticated(true);
          setLoading(false);
          return;
        } else if (response.status === 401) {
          console.log('Token expired or invalid');
          throw new Error('Token invalid');
        }
      } catch (error) {
        console.warn(`Auth check attempt ${attempt} failed:`, error.message);
        
        if (error.response?.status === 401 || error.message === 'Token invalid') {
          console.log('Token expired or invalid, clearing auth state');
          localStorage.removeItem('auth_token');
          delete axios.defaults.headers.common['Authorization'];
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
          return;
        }
        
        // If this is the last attempt, give up
        if (attempt === maxRetries) {
          console.error('Auth check failed after all retries');
          localStorage.removeItem('auth_token');
          delete axios.defaults.headers.common['Authorization'];
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  };

  const loginWithGoogle = async (credential, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Starting Google login (attempt ${attempt}/${maxRetries})...`);
        setLoading(true);
        setIsAuthenticated(false); // Ensure we start with clean state
        
        // Check if backend is ready before attempting login
        if (!backendReady) {
          console.log('Backend not ready for Google login, checking health...');
          const isHealthy = await checkBackendHealth(5, 1000);
          if (!isHealthy) {
            throw new Error('Backend is not available for authentication');
          }
        }
        
        console.log('Making Google login request to:', `${API_URL}/api/auth/google/verify`);
        
        const response = await axios.post(`${API_URL}/api/auth/google/verify`, {
          token: credential
        }, { 
          timeout: 15000,
          validateStatus: (status) => status < 500 // Don't throw on 4xx errors
        });
        
        if (response.status !== 200) {
          throw new Error(`Authentication failed: ${response.data?.detail || 'Unknown error'}`);
        }
        
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
        console.error(`Google login attempt ${attempt} failed:`, error.message);
        
        // Clear auth state on failure
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('auth_token');
        delete axios.defaults.headers.common['Authorization'];
        
        // If this is the last attempt, give up
        if (attempt === maxRetries) {
          setLoading(false);
          throw new Error(`Google authentication failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retrying (longer delay for each attempt)
        const delay = 2000 * attempt;
        console.log(`Retrying Google login in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
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

  const loginWithEmailPassword = async (email, password, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Starting email login (attempt ${attempt}/${maxRetries})...`);
        setLoading(true);
        setIsAuthenticated(false); // Reset state before login attempt
        
        // Check if backend is ready
        if (!backendReady) {
          console.log('Backend not ready for email login, checking health...');
          const isHealthy = await checkBackendHealth(5, 1000);
          if (!isHealthy) {
            throw new Error('Backend is not available for authentication');
          }
        }
        
        const response = await axios.post(`${API_URL}/api/auth/login`, {
          email,
          password
        }, { 
          timeout: 15000,
          validateStatus: (status) => status < 500
        });
        
        if (response.status !== 200) {
          throw new Error(response.data?.detail || 'Login failed');
        }
        
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
        console.error(`Email login attempt ${attempt} failed:`, error.message);
        
        // Clear auth state on failure
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('auth_token');
        delete axios.defaults.headers.common['Authorization'];
        
        // If this is the last attempt, give up
        if (attempt === maxRetries) {
          setLoading(false);
          throw error;
        }
        
        // Wait before retrying
        const delay = 2000 * attempt;
        console.log(`Retrying email login in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const registerWithEmailPassword = async (email, password, name, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Starting registration (attempt ${attempt}/${maxRetries})...`);
        setLoading(true);
        setIsAuthenticated(false); // Reset state before registration attempt
        
        // Check if backend is ready
        if (!backendReady) {
          console.log('Backend not ready for registration, checking health...');
          const isHealthy = await checkBackendHealth(5, 1000);
          if (!isHealthy) {
            throw new Error('Backend is not available for registration');
          }
        }
        
        const response = await axios.post(`${API_URL}/api/auth/register`, {
          email,
          password,
          name
        }, { 
          timeout: 15000,
          validateStatus: (status) => status < 500
        });
        
        if (response.status !== 200) {
          throw new Error(response.data?.detail || 'Registration failed');
        }
        
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
        console.error(`Registration attempt ${attempt} failed:`, error.message);
        
        // Clear auth state on failure
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('auth_token');
        delete axios.defaults.headers.common['Authorization'];
        
        // If this is the last attempt, give up
        if (attempt === maxRetries) {
          setLoading(false);
          throw error;
        }
        
        // Wait before retrying
        const delay = 2000 * attempt;
        console.log(`Retrying registration in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    backendReady,
    login: loginWithGoogle, // Add alias for backwards compatibility
    loginWithGoogle,
    loginWithEmailPassword,
    registerWithEmailPassword,
    logout,
    checkAuthStatus,
    checkBackendHealth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;