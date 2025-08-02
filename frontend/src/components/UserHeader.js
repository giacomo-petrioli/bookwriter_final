import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BookCraftLogo from './BookCraftLogo';
import axios from 'axios';

const UserHeader = ({ children }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [creditBalance, setCreditBalance] = useState(null);
  
  const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    const fetchCreditBalance = async () => {
      if (!user) return;
      
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const response = await axios.get(`${API_URL}/api/user/credits`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          setCreditBalance(response.data.credits);
        }
      } catch (error) {
        console.error('Error fetching credit balance:', error);
        setCreditBalance(0);
      }
    };

    fetchCreditBalance();
  }, [user, API_URL]);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  const handleClickOutside = (event) => {
    if (showUserMenu && !event.target.closest('.user-menu')) {
      setShowUserMenu(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 p-6">
        <div className="container mx-auto flex justify-between items-center">
          {/* Professional Brand - With Logo */}
          <div className="flex items-center space-x-3">
            <BookCraftLogo className="w-8 h-8" />
            <h1 className="text-2xl font-bold text-white tracking-tight">MyBookCrafter AI</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Credits Display */}
            <div className="bg-slate-700/50 px-4 py-2 rounded-lg border border-slate-600/50">
              <span className="text-gray-300 text-sm">Credits: </span>
              <span className="text-emerald-400 font-semibold">
                {creditBalance !== null ? creditBalance : '...'}
              </span>
            </div>

            {/* User Menu */}
            <div className="relative user-menu">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 bg-slate-700/50 hover:bg-slate-600/50 px-4 py-2 rounded-lg border border-slate-600/50 transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="text-white font-medium">
                  {user?.name || user?.email?.split('@')[0] || 'User'}
                </span>
                <svg className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-600/50 shadow-xl z-50">
                  <div className="p-4 border-b border-slate-600/50">
                    <div className="text-white font-medium">{user?.name || 'User'}</div>
                    <div className="text-gray-300 text-sm">{user?.email}</div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
};

export default UserHeader;