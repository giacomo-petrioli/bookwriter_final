import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BookCraftLogo from './BookCraftLogo';
import axios from 'axios';

const UserHeader = ({ children }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [creditBalance, setCreditBalance] = useState(null);

  const API_URL = 'https://bc34adc4-cefc-4873-aff9-a3a535069d2f.preview.emergentagent.com';

  // Fetch credit balance
  useEffect(() => {
    const fetchCreditBalance = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const response = await axios.get(`${API_URL}/api/credits/balance`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCreditBalance(response.data.credit_balance);
        }
      } catch (error) {
        console.error('Failed to fetch credit balance:', error);
      }
    };

    if (user) {
      fetchCreditBalance();
    }
  }, [user, API_URL]);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  const refreshCreditBalance = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await axios.get(`${API_URL}/api/credits/balance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCreditBalance(response.data.credit_balance);
      }
    } catch (error) {
      console.error('Failed to refresh credit balance:', error);
    }
  };

  return (
    <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 p-6">
      <div className="container mx-auto flex justify-between items-center">
        {/* Professional Brand - With Logo */}
        <div className="flex items-center space-x-3">
          <BookCraftLogo className="w-8 h-8" />
          <h1 className="text-2xl font-bold text-white tracking-tight">BookCraft AI</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Credit Balance Display */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm border border-purple-500/30 rounded-xl">
            <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">₵</span>
            </div>
            <span className="text-white font-semibold text-sm">
              {creditBalance !== null ? creditBalance : '...'}
            </span>
            <span className="text-gray-300 text-xs">credits</span>
          </div>
          
          {children}
          
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl text-white hover:bg-slate-700/50 transition-all duration-300"
            >
              {user?.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium">{user?.name || 'User'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700/50 shadow-xl">
                <div className="p-4 border-b border-slate-700/50">
                  <p className="text-white font-semibold truncate">{user?.name}</p>
                  <p className="text-gray-400 text-sm truncate break-all" title={user?.email}>{user?.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default UserHeader;